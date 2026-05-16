import os
from typing import Callable, Dict, List

class NexusAgent:
    """
    Autonomous AI Agent with planning and tool-calling capabilities.
    """
    
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model
        self.tools: Dict[str, Callable] = {}
        self.memory: List[Dict] = []

    def register_tool(self, name: str, func: Callable):
        self.tools[name] = func
        print(f"[Agent] Registered tool: {name}")

    async def execute_task(self, task: str):
        """
        ReAct Execution Loop: Thought -> Action -> Observation
        """
        print(f"[Agent {self.name}] Planning task: {task}")
        
        # Simulated Planning Step
        plan = ["Search for info", "Write code", "Test execution"]
        
        for step in plan:
            print(f"[Agent {self.name}] Executing Step: {step}")
            # In a real system, the LLM would output JSON tool calls here.
            
        return f"Task '{task}' completed successfully by {self.name} agent."

# Example Tools
def terminal_tool(command: str):
    return f"Executed: {command}"

def browser_tool(url: str):
    return f"Captured content from {url}"

# agent = NexusAgent("Developer", "gemini-1.5-pro")
# agent.register_tool("terminal", terminal_tool)
# agent.register_tool("browser", browser_tool)
