import firebase_admin
from firebase_admin import credentials, messaging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from typing import List, Optional, Dict

logger = logging.getLogger("NexusNotifications")

class NotificationService:
    """Core engine for AI-driven push notifications and scheduled engagement."""

    def __init__(self, service_account_path: str = "config/firebase_credentials.json"):
        self.scheduler = AsyncIOScheduler()
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized for Nexus Notifications.")
        except Exception as e:
            logger.warning(f"Firebase initialization skipped (likely missing credentials): {e}")

    def start_scheduler(self):
        """Starts the background task scheduler."""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Nexus Notification Scheduler started.")

    # --- Push Logic ---

    async def send_push_notification(self, token: str, title: str, body: str, data: Optional[Dict] = None):
        """Sends a single FCM message to a specific device."""
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
            token=token,
        )
        try:
            response = messaging.send(message)
            logger.info(f"Successfully sent message: {response}")
            return True
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False

    async def broadcast_notification(self, tokens: List[str], title: str, body: str):
        """Sends notifications to multiple devices."""
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            tokens=tokens,
        )
        try:
            response = messaging.send_multicast(message)
            logger.info(f"Broadcast successful: {response.success_count} sent.")
            return response
        except Exception as e:
            logger.error(f"Error in broadcast: {e}")
            return None

    # --- AI Engagement Workflows ---

    async def schedule_ai_reminder(self, user_id: str, token: str, reminder_text: str, scheduled_time):
        """Schedules a one-off AI reminder."""
        self.scheduler.add_job(
            self.send_push_notification,
            'date',
            run_date=scheduled_time,
            args=[token, "Nexus AI Reminder", reminder_text]
        )

    def schedule_daily_tips(self, tokens_provider_func):
        """Schedules a daily AI tip at 9:00 AM."""
        async def send_daily_tip():
            tokens = await tokens_provider_func()
            tip = "Pro Tip: You can use 'Creative Mode' to brainstorm product names!"
            await self.broadcast_notification(tokens, "Nexus Daily Insight", tip)

        self.scheduler.add_job(send_daily_tip, CronTrigger(hour=9, minute=0))

    # --- Smart Recommendations ---

    async def trigger_smart_recommendation(self, token: str, context: str):
        """AI-driven recommendation based on user behavior."""
        # This would be triggered by analytics logic
        title = "Nexus Recommendation"
        body = f"Based on your interest in {context}, check out our new 'Analyst Mode'!"
        await self.send_push_notification(token, title, body)
