# 🗺️ Nexus AI: Entity Relationship (ER) Diagram

This diagram visualizes the core relationships between users, their intelligence (memories), and the business layer (payments).

```mermaid
erDiagram
    USER ||--o{ CHAT : "starts"
    USER ||--o{ MEMORY : "anchors"
    USER ||--o{ PAYMENT : "makes"
    USER ||--o{ FILE : "uploads"
    USER ||--o{ USAGE_LOG : "tracks"
    
    CHAT ||--o{ MESSAGE : "contains"
    CHAT ||--o{ MEMORY : "generates"
    
    FILE ||--o{ CHAT : "referenced_in"
    
    USER {
        uuid id PK
        string email
        string password_hash
        boolean is_premium
        int credits
        timestamp created_at
    }
    
    CHAT {
        uuid id PK
        uuid user_id FK
        string title
        text summary
        timestamp created_at
    }
    
    MEMORY {
        uuid id PK
        uuid user_id FK
        uuid chat_id FK
        text content
        string vector_id
        float importance
    }
    
    PAYMENT {
        uuid id PK
        uuid user_id FK
        float amount
        string status
        timestamp created_at
    }
    
    FILE {
        uuid id PK
        uuid user_id FK
        string filename
        string s3_url
        int size_bytes
    }
    
    USAGE_LOG {
        uuid id PK
        uuid user_id FK
        string feature_used
        int tokens_consumed
        timestamp created_at
    }
```

---

**Architect's Note:** Every relationship is designed for **Cascading Deletes**. If a user deletes their account, all related chats, files, and memories are instantly purged to ensure 100% GDPR compliance.
