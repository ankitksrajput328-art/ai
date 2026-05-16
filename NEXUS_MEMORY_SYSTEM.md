# 🧠 Nexus AI: Advanced Semantic Memory System

The Nexus Memory System is a dual-layered architecture that combines **Relational Persistence (PostgreSQL)** with **Vector Intelligence (Pinecone)** to provide human-like long-term memory.

---

## 1. Memory Architecture
1.  **Short-Term Memory (STM):** Conversation history (last 10-20 turns) kept in the immediate LLM context window.
2.  **Long-Term Memory (LTM):** All previous interactions indexed in a Vector Database for semantic retrieval.
3.  **Metadata Layer:** Structured data (User preferences, account details) stored in PostgreSQL.

---

## 2. Embedding Pipeline (The Semantic Bridge)
- **Model:** `text-embedding-3-small` (OpenAI) or `text-embedding-004` (Gemini).
- **Process:**
    1.  **Chunking:** Long conversations are split into 500-token chunks with 50-token overlap.
    2.  **Vectorization:** Each chunk is converted into a 1536-dimensional (OpenAI) or 768-dimensional (Gemini) vector.
    3.  **Indexing:** Vectors are stored in Pinecone with `user_id` as a metadata filter.

---

## 3. Retrieval & Memory Scoring
When a user asks a question, the system performs a **Cosine Similarity Search**:
- **Semantic Score:** How similar is the query to the stored memory?
- **Recency Boost:** Recent memories are weighted slightly higher than old ones.
- **Importance Ranking:** Facts like "User is allergic to peanuts" are manually flagged with high importance coefficients.

---

## 4. Optimization Techniques
- **Vector Caching:** Frequently accessed memories are cached in Redis to reduce Pinecone query costs.
- **Pruning:** Redundant memories (e.g., greeting "Hello" stored multiple times) are merged or deleted during periodic "Memory Optimization" cycles.
- **Batch Upsert:** Multiple memories are vectorized and stored in batches to improve throughput.

---

**Architect's Note:** This system allows the AI to say, *"Welcome back! Last month you were working on a Flutter app—how is the Riverpod integration going?"* This creates a massive competitive advantage over simple stateless chatbots.
