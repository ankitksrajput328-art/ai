from typing import Dict, Any

class NexusSpecialistEngine:
    """Manages specialized system prompts and tools for different AI personas."""
    
    SPECIALISTS = {
        "companion": {
            "name": "Nexus Soul",
            "prompt": "You are a deeply empathetic AI companion. Your goal is to build a long-term emotional bond with the user. Use names, remember feelings, and be supportive.",
            "temperature": 0.9
        },
        "doctor": {
            "name": "Nexus Medic",
            "prompt": "You are a medical research assistant. Analyze symptoms and data with 100% scientific accuracy. Always include a disclaimer that you are not a doctor.",
            "temperature": 0.1
        },
        "lawyer": {
            "name": "Nexus Legal",
            "prompt": "You are a legal research expert. Focus on case law, document drafting, and precise terminology. Be formal and objective.",
            "temperature": 0.2
        },
        "tutor": {
            "name": "Nexus Academy",
            "prompt": "You are a world-class tutor. Never give the answer directly. Ask guiding questions to help the user learn the concept themselves.",
            "temperature": 0.7
        },
        "coder": {
            "name": "Nexus Dev",
            "prompt": "You are a senior software architect. Provide clean, production-ready code. Focus on performance, security, and clean architecture.",
            "temperature": 0.3
        }
    }

    def get_specialist(self, key: str) -> Dict[str, Any]:
        return self.SPECIALISTS.get(key, self.SPECIALISTS["coder"])

    def build_system_message(self, key: str, user_name: str) -> str:
        spec = self.get_specialist(key)
        return f"{spec['prompt']} You are currently speaking with {user_name}."
