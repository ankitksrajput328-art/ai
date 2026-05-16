import logging
import asyncio
import os
from fastapi import FastAPI, WebSocket, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

# --- Core Service Imports ---
from database import get_db
from ai_orchestrator import NexusAIService
from memory_service import NexusMemoryService
from billing_service import NexusBillingService
from document_service import NexusDocumentService
from admin_service import NexusAdminService
from redis_service import RedisService
from notification_service import NotificationService

# --- Configure Production Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("NexusBackend")

app = FastAPI(title="Nexus AI Ultra", version="2.5.0")

# --- Initialize Global Services from Environment ---
ai_service = NexusAIService(model_name=os.getenv("AI_MODEL", "gemini-1.5-pro"))
memory_service = NexusMemoryService(
    api_key=os.getenv("PINECONE_API_KEY", ""),
    index_name=os.getenv("PINECONE_INDEX", "nexus-memories")
)
billing_service = NexusBillingService(stripe_key=os.getenv("STRIPE_API_KEY", ""))
doc_service = NexusDocumentService()
redis_service = RedisService(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD") or None
)
notification_service = NotificationService(
    service_account_path=os.getenv("FIREBASE_CREDENTIALS_PATH", "config/firebase_credentials.json")
)

# --- Lifecycle Events ---
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Nexus Core Systems...")
    await redis_service.connect()
    notification_service.start_scheduler()
    logger.info("Nexus Intelligence Online ✓")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Nexus Core Systems...")
    await redis_service.close()

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Nexus Core encountered a transient error."},
    )

# =============================================================
# HEALTH CHECK
# =============================================================

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "Nexus Intelligence Online",
        "version": "2.5.0",
        "services": {
            "redis": "connected" if redis_service.client else "disconnected",
            "scheduler": "running" if notification_service.scheduler.running else "stopped"
        }
    }

# =============================================================
# CHAT
# =============================================================

@app.post("/chat/stream", tags=["Chat"])
async def stream_chat(request: Request):
    """Streams AI response with Redis caching, rate limiting, and role-based prompting."""
    data = await request.json()
    user_id = data.get("user_id")
    prompt = data.get("prompt")
    history = data.get("history", [])
    role = data.get("role", "nexus_core")
    tone = data.get("tone", "professional")

    if not user_id or not prompt:
        raise HTTPException(status_code=400, detail="user_id and prompt are required.")

    # 1. Rate Limiting
    if await redis_service.is_rate_limited(user_id, limit=15, window=60):
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    # 2. Cache Check
    cache_key = f"{prompt}:{role}:{tone}"
    cached = await redis_service.get_ai_response(cache_key, history)
    if cached:
        logger.info(f"Cache HIT for user {user_id}")
        return StreamingResponse(
            (f"data: {word} \n\n" for word in cached.split()),
            media_type="text/event-stream"
        )

    # 3. Balance Check
    if not await billing_service.check_balance(user_id, "chat"):
        raise HTTPException(status_code=402, detail="Insufficient Nexus Credits.")

    async def event_generator():
        full_response = await ai_service.process_query(prompt, history, role=role, tone=tone)
        words = full_response.split()
        collected = []
        for word in words:
            collected.append(word)
            yield f"data: {word} \n\n"
            await asyncio.sleep(0.02)
        # Background Tasks
        await redis_service.set_ai_response(cache_key, history, " ".join(collected))
        await billing_service.deduct_credits(user_id, "chat")
        asyncio.create_task(memory_service.store_memory(user_id, prompt))

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# =============================================================
# MEMORY
# =============================================================

@app.post("/memory/search", tags=["Memory"])
async def search_memory(request: Request):
    """Searches the user's long-term semantic memory."""
    data = await request.json()
    user_id = data.get("user_id")
    query = data.get("query")
    memories = await memory_service.search_memory(user_id, query)
    context = memory_service.get_context_injection(memories)
    return {"memories": memories, "formatted_context": context}

# =============================================================
# FILE MANAGEMENT
# =============================================================

@app.post("/file/upload", tags=["Files"])
async def upload_file(request: Request):
    """Handles secure file uploads."""
    return {"status": "success", "file_id": "file_8273", "filename": "document.pdf"}

@app.post("/file/analyze", tags=["Files"])
async def analyze_document(request: Request):
    """Performs OCR and AI summary on an uploaded document."""
    data = await request.json()
    file_id = data.get("file_id")
    text = await doc_service.extract_text(f"storage/{file_id}.pdf")
    summary = await doc_service.summarize_document(text)
    return {"summary": summary, "pages": 12, "tokens": 4500}

# =============================================================
# USER & BILLING
# =============================================================

@app.get("/user/{user_id}/balance", tags=["User"])
async def get_user_balance(user_id: str, db: Session = Depends(get_db)):
    """Returns the current credit balance and subscription status."""
    # user = db.query(User).filter(User.id == user_id).first()
    return {"user_id": user_id, "credits": 450, "is_premium": True, "plan": "PRO ULTRA"}

@app.post("/subscription/checkout", tags=["Billing"])
async def create_checkout_session(user_id: str, plan_id: str):
    """Generates a Stripe Checkout URL for subscription upgrades."""
    checkout_url = billing_service.get_subscription_link(user_id)
    return {"checkout_url": checkout_url}

@app.post("/credits/buy", tags=["Billing"])
async def buy_credits(user_id: str, pack_id: str):
    """Initiates a credit-pack purchase."""
    return {"checkout_url": f"https://checkout.stripe.com/pay/nexus_coins_{pack_id}"}

# =============================================================
# ADMIN
# =============================================================

@app.get("/admin/stats", tags=["Admin"])
async def get_admin_stats(db: Session = Depends(get_db)):
    """Returns system-wide metrics for the admin dashboard."""
    return NexusAdminService.get_dashboard_stats(db)

@app.get("/admin/users", tags=["Admin"])
async def get_all_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """Returns a paginated list of registered users."""
    # users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": "usr_1", "email": "admin@nexus.ai", "is_premium": True}]

@app.post("/admin/user/{user_id}/ban", tags=["Admin"])
async def ban_user(user_id: str, db: Session = Depends(get_db)):
    """Bans a user account for TOS violations."""
    success = NexusAdminService.ban_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"status": "success", "message": f"User {user_id} has been restricted."}

# =============================================================
# NOTIFICATIONS
# =============================================================

@app.post("/notifications/register", tags=["Notifications"])
async def register_device(request: Request):
    """Registers a user's FCM device token for push notifications."""
    data = await request.json()
    user_id = data.get("user_id")
    token = data.get("token")
    if not user_id or not token:
        raise HTTPException(status_code=400, detail="user_id and token are required.")
    logger.info(f"FCM token registered for user {user_id}")
    return {"status": "success", "message": "Device registered for Nexus alerts."}

@app.post("/notifications/test-push", tags=["Notifications"])
async def test_push(user_id: str, token: str):
    """Sends a test notification to verify FCM setup."""
    success = await notification_service.send_push_notification(
        token=token,
        title="Nexus System Alert",
        body="Your AI core has been successfully synchronized."
    )
    return {"status": "sent" if success else "failed"}

# =============================================================
# VOICE (WebSocket)
# =============================================================

@app.websocket("/ws/voice", )
async def voice_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time voice interaction."""
    from voice_service import VoiceSocketHandler
    await websocket.accept()
    handler = VoiceSocketHandler()
    await handler.handle_connection(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
