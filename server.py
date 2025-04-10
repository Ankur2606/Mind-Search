import os
from fastapi import FastAPI, WebSocket, HTTPException, Depends, Request, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import asyncio
from dotenv import load_dotenv
from smolagents import CodeAgent, LiteLLMModel, DuckDuckGoSearchTool, VisitWebpageTool

load_dotenv()

app = FastAPI(title="Mind Search API")

# Configure CORS for production
frontend_url = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM configuration
llm = LiteLLMModel(
    model_id="openai/Qwen/Qwen2.5-32B-Instruct", 
    api_base=os.environ.get('NEBIUS_BASE_URL'),
    api_key=os.environ.get('NEBIUS_APIKEY'), 
    num_ctx=8162
)

# Import and configure litellm
import litellm
litellm.model_list = [
    {
        "model_name": "Qwen/Qwen2.5-32B-Instruct", 
        "litellm_params": {
            "model": "openai/Qwen/Qwen2.5-32B-Instruct",
            "api_key": os.environ.get('NEBIUS_APIKEY'),
            "api_base": os.environ.get('NEBIUS_BASE_URL'),
        }
    }
]

# Initialize agent with tools
agent = CodeAgent(
    tools=[DuckDuckGoSearchTool(), VisitWebpageTool()], 
    model=llm
)

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[Dict[str, Any]]] = []

# Active connections
active_connections = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to Mind Search API"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Convert history format if needed
        history_context = "\n".join([f"{msg.role}: {msg.content}" for msg in request.history[-5:] if request.history]) if request.history else ""
        
        # Add history context to the query if available
        query = request.message
        if history_context:
            query = f"Context from previous messages:\n{history_context}\n\nNew question: {query}"
        
        # Run the agent
        response = agent.run(query)
        
        # Handle list responses by converting to string
        if isinstance(response, list):
            response = str(response)
        
        # Extract sources if available (would need to modify smolagents to properly return sources)
        sources = []
        
        return ChatResponse(
            answer=response,
            sources=sources
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = id(websocket)
    active_connections[client_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            request_data = json.loads(data)
            print(f"Received request: {request_data['message'][:50]}...")
            
            # Process similar to the /chat endpoint but send result
            history_context = ""
            if "history" in request_data and request_data["history"]:
                history_context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in request_data["history"][-5:]])
            
            query = request_data["message"]
            if history_context:
                query = f"Context from previous messages:\n{history_context}\n\nNew question: {query}"
            
            try:
                # Send "thinking" message to indicate processing
                await websocket.send_text(json.dumps({"type": "chunk", "content": "Thinking..."}))
                print("Sent 'Thinking...' message")
                
                # Get full response
                print("Running agent...")
                full_response = agent.run(query)
                print(f"Got response (length: {len(full_response) if hasattr(full_response, '__len__') else 'unknown'}): {str(full_response)[:100]}...")
                
                # Handle both string and list responses
                if isinstance(full_response, list):
                    # Convert list to string for display
                    string_response = str(full_response)
                else:
                    string_response = full_response
                    
                if not string_response or (isinstance(string_response, str) and string_response.strip() == ""):
                    print("WARNING: Empty response from agent")
                    string_response = "I'm sorry, I couldn't generate a response. Please try again."
                
                try:
                    # Send the full response
                    await websocket.send_text(json.dumps({"type": "chunk", "content": string_response}))
                    print("Sent chunk with full response")
                    
                    # Send completion message
                    await websocket.send_text(json.dumps({
                        "type": "complete",
                        "content": string_response,
                        "sources": []
                    }))
                    print("Sent completion message")
                except Exception as send_error:
                    print(f"Error sending response: {str(send_error)}")
                    await websocket.send_text(json.dumps({
                        "type": "error", 
                        "content": f"Error sending response: {str(send_error)}"
                    }))
            except Exception as e:
                error_msg = f"Error processing request: {str(e)}"
                print(error_msg)
                await websocket.send_text(json.dumps({"type": "error", "content": error_msg}))
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {client_id}")
        del active_connections[client_id]
    except Exception as e:
        print(f"WebSocket general error: {str(e)}")
        try:
            await websocket.send_text(json.dumps({"type": "error", "content": str(e)}))
        except:
            pass
        del active_connections[client_id]

if __name__ == "__main__":
    import uvicorn
    # Get port from environment variable for production or use default
    port = int(os.environ.get("PORT", 8000))
    # Use 0.0.0.0 to make the server publicly available
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)