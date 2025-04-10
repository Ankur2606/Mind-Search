import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'ws://localhost:8000/ws';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  
  // Initialize WebSocket connection with reconnection logic
  const connectWebSocket = () => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      const websocket = new WebSocket(API_URL);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      
      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        // Try to reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 2000);
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        websocket.close();
      };
      
      // WebSocket message handling with better debugging and error handling
      websocket.onmessage = (event) => {
        try {
          console.log("Received WebSocket message:", event.data);
          const data = JSON.parse(event.data);
          
          if (data.type === 'chunk') {
            console.log(`Received chunk (length: ${data.content.length}):`, data.content.substring(0, 50));
            // If we receive a "Thinking..." message and already have streaming content, preserve it
            if (data.content === "Thinking..." && streamingResponse !== "") {
              console.log("Ignoring 'Thinking...' as we already have content");
              return;
            }
            
            // Otherwise update the streaming response
            setStreamingResponse(prev => {
              // If this is a "Thinking..." message, replace previous content
              if (data.content === "Thinking...") {
                return data.content;
              }
              // If the previous content was just "Thinking...", replace it
              if (prev === "Thinking...") {
                return data.content;
              }
              // Otherwise append to existing content
              return prev + data.content;
            });
          } else if (data.type === 'complete') {
            console.log(`Received complete message (length: ${data.content.length}):`, data.content.substring(0, 50));
            // Check if the content is empty or just whitespace
            if (!data.content || data.content.trim() === "") {
              console.warn("Received empty 'complete' message content");
              data.content = "I'm sorry, I couldn't generate a response. Please try again.";
            }
            
            // Clear streaming response and add the message to the chat
            setStreamingResponse('');
            setMessages(prevMessages => [...prevMessages, 
              { role: 'assistant', content: data.content, sources: data.sources || [] }
            ]);
            setIsLoading(false);
          } else if (data.type === 'error') {
            console.error("Received error message:", data.content);
            setStreamingResponse('');
            setMessages(prevMessages => [...prevMessages, 
              { role: 'assistant', content: `Error: ${data.content}`, isError: true }
            ]);
            setIsLoading(false);
          } else {
            console.warn("Unknown message type:", data.type);
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err, "Raw data:", event.data);
          setStreamingResponse('');
          setMessages(prevMessages => [...prevMessages, 
            { role: 'assistant', content: `Error processing response: ${err.message}`, isError: true }
          ]);
          setIsLoading(false);
        }
      };
      
      setWs(websocket);
      
      return websocket;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      // Try to reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      return null;
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = connectWebSocket();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      setDarkMode(true);
    }
    
    // Cleanup function
    return () => {
      if (websocket) {
        websocket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Update document class when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    // Save theme preference
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  // Focus on input initially
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        message: input,
        history: messages
      }));
    } else {
      // Try to reconnect if WebSocket is not available
      const newWs = connectWebSocket();
      
      // If reconnection fails immediately, show error
      if (!newWs) {
        setIsLoading(false);
        setMessages(prevMessages => [...prevMessages, 
          { role: 'assistant', content: 'Error: Could not connect to server. Please try again later.', isError: true }
        ]);
      } else {
        // Wait for connection to open, then send
        newWs.onopen = () => {
          newWs.send(JSON.stringify({
            message: input,
            history: messages
          }));
        };
      }
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Icons
  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  );

  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );

  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  );

  return (
    <>
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <div className="gradient-orb orb3"></div>
        <div className="gradient-orb orb4"></div>
        <div className="grid-pattern"></div>
      </div>
      
      <div className={`App ${darkMode ? 'dark-theme' : ''}`}>
        <header className="header">
          <div className="header-content">
            <h1>Mind Search</h1>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {wsConnected ? (
                <div className="connection-status connected">
                  <span className="connection-dot"></span>
                </div>
              ) : (
                <div className="connection-status disconnected">
                  <span className="connection-dot"></span>
                </div>
              )}
              
              <button 
                className="theme-toggle" 
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </header>
        
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>Welcome to Mind Search</h2>
                <p>Ask me anything, I'll search the web and provide you with informative answers!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-role">
                    {message.role === 'user' ? 'You' : 'Mind Search'}
                  </div>
                  <div className="message-content">
                    {message.role === 'assistant' ? (
                      <>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="sources">
                            <h4>Sources</h4>
                            <ul>
                              {message.sources.map((source, i) => (
                                <li key={i}>
                                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                                    {source.title || source.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && streamingResponse && (
              <div className="message assistant">
                <div className="message-role">Mind Search</div>
                <div className="message-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingResponse}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {isLoading && !streamingResponse && (
              <div className="message assistant">
                <div className="message-role">Mind Search</div>
                <div className="message-content loading">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                ref={inputRef}
              />
              <button type="submit" disabled={!input.trim() || isLoading}>
                {isLoading ? 'Processing...' : <SendIcon />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default App;