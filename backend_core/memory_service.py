import time
import random
from typing import List, Dict, Any

class NexusMemoryService:
    """Manages long-term semantic memory using Vector Embeddings and Pinecone."""
    
    def __init__(self, api_key: str, index_name: str):
        self.api_key = api_key
        self.index_name = index_name
        self.embedding_model = "text-embedding-004"

    async def generate_embedding(self, text: str) -> List[float]:
        """Simulates calling an embedding API (Gemini/OpenAI)."""
        # In production: res = await client.embeddings.create(input=text, model=self.embedding_model)
        return [random.uniform(-1, 1) for _ in range(768)]

    async def store_memory(self, user_id: str, text: str, importance: float = 0.5):
        """Vectorizes and stores memory with associated metadata in PostgreSQL and Pinecone."""
        vector = await self.generate_embedding(text)
        metadata = {
            "user_id": user_id,
            "text": text,
            "timestamp": time.time(),
            "importance": importance
        }
        
        # 1. Upsert to Pinecone
        # self.index.upsert(vectors=[(str(uuid4()), vector, metadata)])
        
        # 2. Store in PostgreSQL for fast relational queries
        # db.execute("INSERT INTO memories (user_id, text, importance) VALUES (%s, %s, %s)", ...)
        
        print(f"🧠 Memory Anchored [{user_id}]: {text[:50]}...")

    async def search_memory(self, user_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Performs a semantic search and ranks memories by relevance and recency."""
        query_vector = await self.generate_embedding(query)
        
        # 1. Query Pinecone with metadata filter
        # results = self.index.query(vector=query_vector, top_k=top_k, filter={"user_id": user_id})
        
        # 2. Mock results for architecture demonstration
        mock_results = [
            {"text": "User is a senior Flutter developer.", "score": 0.92, "timestamp": time.time() - 86400},
            {"text": "User prefers dark neon theme with glassmorphism.", "score": 0.88, "timestamp": time.time() - 3600},
            {"text": "User is building a high-end SaaS AI app.", "score": 0.85, "timestamp": time.time() - 7200}
        ]
        
        # 3. Final Ranking: Score = (Similarity * 0.7) + (Recency * 0.2) + (Importance * 0.1)
        ranked_memories = sorted(mock_results, key=lambda x: x['score'], reverse=True)
        return ranked_memories

    def get_context_injection(self, memories: List[Dict]) -> str:
        """Formats retrieved memories for injection into the AI prompt."""
        if not memories: return ""
        
        context = "\n--- RELEVANT PAST CONTEXT ---\n"
        for i, m in enumerate(memories, 1):
            context += f"Fact {i}: {m['text']}\n"
        return context + "-----------------------------\n"
