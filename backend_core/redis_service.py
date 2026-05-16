import redis.asyncio as redis
import json
import logging
import hashlib
from typing import Optional, Any, Union
from datetime import timedelta

logger = logging.getLogger("NexusRedis")

class RedisService:
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0, password: Optional[str] = None):
        self.redis_url = f"redis://{host}:{port}/{db}"
        self.password = password
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        """Initializes the Redis connection pool."""
        try:
            self.client = redis.from_url(self.redis_url, password=self.password, decode_responses=True)
            await self.client.ping()
            logger.info("Connected to Redis performance cluster.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None

    async def close(self):
        """Closes the Redis connection pool."""
        if self.client:
            await self.client.close()

    # --- Generic Caching ---

    async def set(self, key: str, value: Any, expire: int = 3600):
        """Stores a value in Redis with an expiration time."""
        if not self.client: return
        serialized_value = json.dumps(value)
        await self.client.set(key, serialized_value, ex=expire)

    async def get(self, key: str) -> Optional[Any]:
        """Retrieves a value from Redis."""
        if not self.client: return None
        value = await self.client.get(key)
        return json.loads(value) if value else None

    # --- AI Response Caching (Exact Match) ---

    def _generate_cache_key(self, prompt: str, history: list) -> str:
        """Generates a unique hash for a prompt and its history context."""
        context = f"{prompt}:{json.dumps(history)}"
        return f"ai_cache:{hashlib.md5(context.encode()).hexdigest()}"

    async def get_ai_response(self, prompt: str, history: list) -> Optional[str]:
        """Retrieves a cached AI response."""
        key = self._generate_cache_key(prompt, history)
        return await self.get(key)

    async def set_ai_response(self, prompt: str, history: list, response: str, expire: int = 86400):
        """Caches an AI response for 24 hours by default."""
        key = self._generate_cache_key(prompt, history)
        await self.set(key, response, expire=expire)

    # --- Rate Limiting (Fixed Window) ---

    async def is_rate_limited(self, user_id: str, limit: int = 10, window: int = 60) -> bool:
        """Checks if a user has exceeded their rate limit within a time window (seconds)."""
        if not self.client: return False
        key = f"rate_limit:{user_id}"
        
        current_count = await self.client.get(key)
        if current_count and int(current_count) >= limit:
            return True
        
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window, nx=True)  # Set expiry only if key is new
        await pipe.execute()
        
        return False

    # --- Session Management ---

    async def store_session(self, session_id: str, data: dict, expire: int = 3600):
        """Stores user session data (e.g., active task state)."""
        key = f"session:{session_id}"
        await self.set(key, data, expire=expire)

    async def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieves user session data."""
        return await self.get(f"session:{session_id}")
