# Dependencies
import os
from dotenv import load_dotenv
from smolagents import CodeAgent, LiteLLMModel, DuckDuckGoSearchTool, VisitWebpageTool 

load_dotenv()

# LLM
llm = LiteLLMModel(
    model_id="openai/Qwen/Qwen2.5-32B-Instruct", 
    api_base=os.environ['NEBIUS_BASE_URL'],
    api_key=os.environ['NEBIUS_APIKEY'], 
    num_ctx=8162
)

# Register the custom model mapping if needed
import litellm
litellm.model_list = [
    {
        "model_name": "Qwen/Qwen2.5-32B-Instruct", 
        "litellm_params": {
            "model": "openai/Qwen/Qwen2.5-32B-Instruct",
            "api_key": os.environ['NEBIUS_APIKEY'],
            "api_base": os.environ['NEBIUS_BASE_URL'],
        }
    }
]

agent = CodeAgent(tools=[DuckDuckGoSearchTool(),VisitWebpageTool()], model=llm)
agent.run("who is karan mundre from gwalior which institute is he studying in?")
