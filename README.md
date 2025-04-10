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

## Deployment Instructions

### Option 1: Deploy to Render.com (Recommended)

The easiest way to deploy Mind Search for free is using Render.com:

1. Fork or clone this repository to your GitHub account
2. Sign up for a free account at [Render.com](https://render.com)
3. Click on the "New +" button and select "Blueprint"
4. Connect your GitHub repository and select it
5. Render will automatically detect the `render.yaml` configuration
6. Set the required environment variables:
   - `NEBIUS_BASE_URL`: Your LLM API base URL
   - `NEBIUS_APIKEY`: Your LLM API key

The deployment will create two services:
- A web service for the FastAPI backend
- A static site for the React frontend

### Option 2: Manual Deployment

#### Backend (FastAPI)

You can deploy the backend to any platform that supports Python:

- **Heroku**: Use a Procfile with `web: uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Railway**: Set the build command to `pip install -r requirements.txt` and the start command to `uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Fly.io**: Create a `fly.toml` file and deploy with the Fly CLI
- **Vercel**: Create a `vercel.json` file to configure the Python serverless functions

#### Frontend (React)

The frontend can be deployed to any static site hosting service:

- **Netlify**: Connect your GitHub repo and set the build command to `cd frontend && npm install && npm run build` and publish directory to `frontend/build`
- **Vercel**: Connect your GitHub repo and Vercel will auto-detect the React project in the frontend folder
- **GitHub Pages**: Run `npm run build` and deploy the `frontend/build` directory

Remember to update the `REACT_APP_API_URL` environment variable to point to your deployed backend WebSocket URL.

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
