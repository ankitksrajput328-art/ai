-- Nexus AI: Production Database Schema (PostgreSQL)

-- Users Table: Core Authentication and Billing
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    credits INTEGER DEFAULT 50,
    api_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Chats Table: Session Management
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT,
    model_used VARCHAR(50) DEFAULT 'gemini-1.5-pro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Memories Table: Metadata for Long-Term AI Memory
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    vector_id VARCHAR(255) NOT NULL, -- Reference to Pinecone/Vector DB ID
    importance FLOAT DEFAULT 0.5,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table: Billing History
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20), -- 'completed', 'pending', 'failed'
    stripe_session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-speed retrieval
CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_category ON memories(category);

-- Analytics Table: User Behavior and Feature Tracking
CREATE TABLE user_analytics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'chat_sent', 'image_gen', 'voice_mode', 'artifact_view'
    payload JSONB, -- Contextual data about the event
    device_info JSONB, -- OS, Browser, Platform
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Logs Table: Token Usage and Cost Tracking
CREATE TABLE api_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
    model VARCHAR(50) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost_usd DECIMAL(12, 6),
    latency_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crash Reports Table: System Health
CREATE TABLE crash_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    error_msg TEXT NOT NULL,
    stack_trace TEXT,
    platform VARCHAR(20), -- 'web', 'android', 'ios'
    version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_event ON user_analytics(event_type);
CREATE INDEX idx_api_logs_user ON api_usage_logs(user_id);
CREATE INDEX idx_api_logs_created ON api_usage_logs(created_at);
