import asyncio
import base64
import logging
from typing import AsyncGenerator
from ai_orchestrator import NexusAIService

logger = logging.getLogger("NexusVoice")

# Fixed: Instantiate the service so VoiceSocketHandler can use it
_ai_service = NexusAIService()

class NexusVoiceService:
    """Manages the STT → LLM → TTS streaming pipeline."""
    
    def __init__(self, eleven_labs_key: str):
        self.eleven_labs_key = eleven_labs_key
        self.tts_url = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

    async def transcribe_audio(self, audio_data: bytes) -> str:
        """Converts incoming audio chunks to text using Whisper."""
        # In production: res = await whisper_client.transcribe(audio_data)
        await asyncio.sleep(0.5)
        return "I want to hear about the new AI voice system."

    async def stream_tts(self, text: str) -> AsyncGenerator[bytes, None]:
        """Streams audio data from ElevenLabs for a given text string."""
        # In production: Connect to ElevenLabs WebSocket for lowest latency
        words = text.split()
        for word in words:
            await asyncio.sleep(0.1)
            yield word.encode("utf-8")  # Mock: yields word bytes (replace with PCM audio)

    async def synthesize(self, text: str) -> bytes:
        """Returns a complete TTS audio blob (non-streaming)."""
        await asyncio.sleep(1)
        return text.encode("utf-8")  # Mock audio bytes

class VoiceSocketHandler:
    """Handles real-time WebSocket connections for Voice AI (FastAPI WebSocket)."""
    
    def __init__(self):
        # Fixed: inject a proper service instance instead of using undefined 'voice_service'
        self.voice_service = NexusVoiceService(eleven_labs_key="")
        self.ai_service = _ai_service

    async def handle_connection(self, websocket):
        """Main loop for voice interaction."""
        logger.info("Voice Session Started")
        
        try:
            while True:
                # 1. Receive Audio Bytes from User (FastAPI WebSocket)
                audio_data = await websocket.receive_bytes()  # Fixed: was .receive() dict pattern
                
                if audio_data:
                    # 2. Speech-to-Text
                    user_text = await self.voice_service.transcribe_audio(audio_data)
                    logger.info(f"Transcribed: {user_text}")
                    
                    # 3. AI Response
                    ai_text = await self.ai_service.process_query(user_text, history=[])
                    
                    # 4. Text-to-Speech → send audio back
                    audio_response = await self.voice_service.synthesize(ai_text)
                    await websocket.send_bytes(audio_response)  # Fixed: was .send() with dict
                    
        except Exception as e:
            logger.error(f"Voice session error: {e}", exc_info=True)
        finally:
            logger.info("Voice Session Ended")
