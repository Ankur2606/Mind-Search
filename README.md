# Mind Search

A modern AI chat application that can search the web and provide informative answers, built with React and FastAPI.

## Features

- Modern, sleek UI with dark mode
- Animated background with neon accents
- Real-time chat via WebSockets
- Web search capabilities
- Markdown support for responses
- Code syntax highlighting
- Mobile-responsive design

## Tech Stack

### Backend
- FastAPI
- WebSockets for streaming responses
- smolagents with LiteLLM integration
- DuckDuckGo search tools

### Frontend
- React 
- WebSockets for real-time communication
- React Markdown for rendering formatted responses
- Syntax highlighting for code blocks

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+ and npm

### Backend Setup
1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   - Rename `.env.example` to `.env`
   - Add your API keys (NEBIUS_APIKEY, NEBIUS_BASE_URL) in the `.env` file

3. Run the backend server:
   ```
   run_backend.bat
   ```
   or manually with:
   ```
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```
   or run from the root directory:
   ```
   run_frontend.bat
   ```

## Local Development

1. Clone the repository
2. Set up environment variables in a `.env` file
3. Install backend dependencies: `pip install -r requirements.txt`
4. Install frontend dependencies: `cd frontend && npm install`
5. Run backend: `uvicorn server:app --reload`
6. Run frontend: `cd frontend && npm start`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Type your question in the input field and press Enter or click "Send"
3. The AI will process your question, search the web if needed, and provide a response with sources

## Environment Variables

- `NEBIUS_BASE_URL`: LLM API base URL
- `NEBIUS_APIKEY`: LLM API key
- `REACT_APP_API_URL` (frontend): WebSocket URL for the backend API (e.g., `wss://your-api.example.com/ws`)
- `FRONTEND_URL` (backend): URL for the frontend application for CORS configuration

## License

MIT
