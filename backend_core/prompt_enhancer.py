import re

class NexusPromptEnhancer:
    """Uses engineering patterns to transform simple prompts into high-fidelity AI art instructions."""
    
    STYLES = {
        "realistic": "hyper-realistic, 8k resolution, cinematic lighting, masterpiece, highly detailed, photorealistic, shot on 35mm lens",
        "anime": "digital art, anime style, vibrant colors, clean lines, high quality, studio ghibli influence, cel shaded",
        "cyberpunk": "neon lights, futuristic city, dark synthwave aesthetic, glowing details, intricate machinery",
        "oil_painting": "classical oil painting, thick brushstrokes, rich texture, museum quality, historical aesthetic"
    }

    def enhance(self, prompt: str, style: str = "realistic") -> str:
        """Appends quality boosters and style-specific modifiers to the user prompt."""
        base_style = self.STYLES.get(style, self.STYLES["realistic"])
        
        # Add universal boosters
        boosters = "masterpiece, trending on artstation, incredibly detailed"
        
        enhanced_prompt = f"{prompt}, {base_style}, {boosters}"
        
        # Basic cleanup
        enhanced_prompt = re.sub(' +', ' ', enhanced_prompt)
        return enhanced_prompt

    def get_negative_prompt(self) -> str:
        """Provides a standard list of unwanted elements for high-quality generation."""
        return "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
