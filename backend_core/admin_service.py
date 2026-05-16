from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import User, UsageLog, Transaction  # Fixed: absolute import, added Transaction

class NexusAdminService:
    """Provides high-level analytics and management logic for administrators."""
    
    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:  # Fixed: added missing Any import
        """Aggregates system-wide metrics for the main dashboard view."""
        total_users = db.query(User).count()
        premium_users = db.query(User).filter(User.is_premium == True).count()
        
        return {
            "total_users": total_users,
            "premium_users": premium_users,
            "premium_ratio": round((premium_users / total_users), 4) if total_users > 0 else 0,
            "revenue_mtd": 18420,  # Replace with: db.query(func.sum(Transaction.amount)).scalar()
            "active_sessions": 420,  # Replace with: Redis active session count
            "system_health": "Optimal"
        }

    @staticmethod
    def ban_user(db: Session, user_id: str) -> bool:
        """Disables a user account due to TOS violations. Returns True on success."""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_active = False  # Fixed: is_active column now exists in models.py
            db.commit()
            return True
        return False

    @staticmethod
    def get_recent_transactions(db: Session, limit: int = 10) -> List[Transaction]:
        """Returns the most recent payment transactions."""
        return db.query(Transaction).order_by(Transaction.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_usage_by_feature(db: Session, user_id: Optional[str] = None) -> List[Dict]:
        """Returns a breakdown of feature usage (chat, image, voice)."""
        query = db.query(UsageLog)
        if user_id:
            query = query.filter(UsageLog.user_id == user_id)
        logs = query.all()
        return [{"feature": log.feature, "tokens": log.tokens, "created_at": str(log.created_at)} for log in logs]
