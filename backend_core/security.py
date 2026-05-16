import time
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Production Security Config
SECRET_KEY = "NEXUS_ULTRA_SECURE_KEY_PRODUCTION_CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class NexusSecurity:
    """
    Enterprise-grade security handler for Nexus AI.
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def validate_token(credentials: HTTPAuthorizationCredentials = Security(security)):
        token = credentials.credentials
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            return user_id
        except JWTError:
            raise HTTPException(status_code=401, detail="Could not validate credentials")

# Rate Limiter (Simulated Redis-cell)
class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.requests = {}

    def is_allowed(self, ip_address: str) -> bool:
        now = time.time()
        if ip_address not in self.requests:
            self.requests[ip_address] = [now]
            return True
        
        # Clean old requests
        self.requests[ip_address] = [t for t in self.requests[ip_address] if now - t < 60]
        
        if len(self.requests[ip_address]) < self.rpm:
            self.requests[ip_address].append(now)
            return True
        return False
