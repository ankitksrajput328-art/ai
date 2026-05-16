import asyncio
from typing import List, Callable

class NexusAgent:
    """A task-oriented autonomous agent that can use tools and make decisions."""
    
    def __init__(self, name: str, capabilities: List[str]):
        self.name = name
        self.capabilities = capabilities
        self.task_history = []

    async def execute_workflow(self, instruction: str):
        """Breaks down a complex instruction into a multi-step execution graph."""
        print(f"🤖 Agent {self.name} received instruction: {instruction}")
        
        # 1. Plan (LLM step)
        steps = ["Search news", "Summarize top 3", "Post to LinkedIn"]
        
        # 2. Execute
        for step in steps:
            print(f"   -> Executing: {step}...")
            await asyncio.sleep(1)
            self.task_history.append({"step": step, "status": "success"})
            
        return {"status": "completed", "result": "Workflow executed successfully."}

class BrowserOperatorAgent(NexusAgent):
    """Specialized agent that can control a headless browser."""
    
    async def perform_web_task(self, url: str, action: str):
        # In production: Use Playwright to navigate to URL and click/type
        print(f"🌐 Navigating to {url} to perform {action}...")
        await asyncio.sleep(2)
        return "Task Completed: Flight booked."

class SocialCreatorAgent(NexusAgent):
    """Specialized agent for content creation across platforms."""
    
    async def create_campaign(self, topic: str):
        print(f"📱 Generating social campaign for: {topic}")
        # 1. Generate Script
        # 2. Generate Images
        # 3. Schedule Posts
        await asyncio.sleep(1)
        return "Campaign Live."
