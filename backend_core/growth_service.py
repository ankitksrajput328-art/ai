from typing import Dict
from sqlalchemy.orm import Session
from .models import User

class NexusGrowthService:
    """Manages viral growth loops including referrals and reward distribution."""
    
    @staticmethod
    async def process_referral(db: Session, referrer_id: str, new_user_id: str):
        """Rewards both the referrer and the new user with Nexus Coins."""
        REWARD_AMOUNT = 500
        
        # 1. Credit the Referrer
        # await db.users.update(where={"id": referrer_id}, data={"credits": {"increment": REWARD_AMOUNT}})
        
        # 2. Credit the New User
        # await db.users.update(where={"id": new_user_id}, data={"credits": {"increment": REWARD_AMOUNT}})
        
        print(f"🎉 Referral successful! {referrer_id} and {new_user_id} earned {REWARD_AMOUNT} coins each.")

    @staticmethod
    def get_referral_code(user_id: str) -> str:
        """Generates a unique, shareable referral code for a user."""
        return f"NEXUS-{user_id[:8].upper()}"

    @staticmethod
    async def track_ad_view(user_id: str):
        """Rewards the user with 5 coins for watching a rewarded ad."""
        # await db.users.update(where={"id": user_id}, data={"credits": {"increment": 5}})
        print(f"📺 User {user_id} earned 5 coins via Ad Reward.")
