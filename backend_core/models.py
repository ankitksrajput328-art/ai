import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base  # Fixed: absolute import (no leading dot)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)  # Added: needed for ban_user
    credits = Column(Integer, default=50)
    fcm_token = Column(String, nullable=True)  # Added: for push notifications
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String)
    summary = Column(Text)
    ai_role = Column(String, default="nexus_core")  # Added: stores active AI personality
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Memory(Base):
    __tablename__ = "memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    vector_id = Column(String, nullable=False)
    importance = Column(Float, default=0.5)  # Fixed: Float for 0.0-1.0 range
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    file_type = Column(String)  # Added: e.g. 'pdf', 'image', 'docx'
    size_bytes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    feature = Column(String, nullable=False)  # Fixed: was broken SQL comment syntax -- 'chat', 'image', 'voice'
    tokens = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    """Fixed: Was referenced in admin_service.py but didn't exist."""
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    stripe_session_id = Column(String)
    plan = Column(String)  # e.g. 'PRO', 'ULTRA'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
