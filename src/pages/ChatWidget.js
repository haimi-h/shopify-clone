import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../CustomerServicePage.css'; // Make sure this CSS file exists and is styled

// Removed UserIcon, BotIcon, ChatIcon, CloseIcon as they are no longer needed for a full-page chat
// If you need icons for messages themselves, they should be inline or part of the message rendering.

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatWidget = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const socketRef = useRef(null);
  const optimisticMessageIds = useRef(new Set());

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;
  const token = localStorage.getItem('token'); // Get the token here

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to fetch messages
  const fetchMessages = useCallback(async () => {
    if (!currentUserId) {
      console.log("fetchMessages: No user ID found. Setting chat error.");
      setChatError('Please log in to view chat messages.');
      return;
    }
    setLoadingChat(true);
    setChatError(null);
    try {
      console.log(`fetchMessages: Attempting to fetch messages for user ${currentUserId}`);
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Ensure token is sent
        },
      });
      console.log("fetchMessages: Messages fetched successfully.");
      setMessages(response.data.map(msg => ({
        id: msg.id,
        sender: msg.sender_role === 'user' ? 'user' : 'bot', // Assuming 'admin' is 'bot' for user view
        text: msg.message_text,
        timestamp: msg.timestamp,
      })));
    } catch (error) {
      console.error('fetchMessages: Error fetching chat messages:', error);
      setChatError('Failed to load messages. Please try again later.');
      // If unauthorized, trigger logout
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("fetchMessages AXIOS ERROR: Unauthorized or Forbidden. Triggering logout.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setChatError('Session expired or unauthorized. Please log in again.');
        navigate('/login'); // Use navigate for routing
      }
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId, token, navigate]); // Depend on currentUserId, token, and navigate

  // Effect for Socket.IO connection and message fetching
  useEffect(() => {
    if (!currentUserId || !token) {
      console.log("useEffect: No user ID or token found, skipping socket connection and message fetch.");
      setChatError('Please log in to chat.');
      return;
    }

    // Initialize Socket.IO connection
    if (!socketRef.current) {
      console.log('useEffect: Attempting to connect Socket.IO...');
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: token, // Pass the current token
        },
        transports: ['websocket', 'polling'], // Ensure common transports are enabled
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        socketRef.current.emit('joinRoom', `user-${currentUserId}`);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setChatError(`Connection error: ${err.message}. Please try refreshing.`);
        // If connection fails due to auth, prompt logout
        if (err.message.includes('Authentication error')) {
            console.error("Socket connect_error: Authentication error. Triggering logout.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setChatError('Authentication failed. Please log in again.');
            navigate('/login'); // Use navigate for routing
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        // For debugging, let's not aggressively logout on every disconnect reason
        // The fetchMessages error handling should cover token issues.
        // If you want aggressive logout on any disconnect, uncomment below:
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // setChatError('Disconnected. Please log in again.');
        // navigate('/login');
      });

      socketRef.current.on('receiveMessage', (newMessage) => {
        console.log('Received new message:', newMessage);
        // Only add if it's not an optimistic update already handled
        if (!optimisticMessageIds.current.has(newMessage.tempId)) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: newMessage.id,
              sender: newMessage.sender_role === 'user' ? 'user' : 'bot', // Assuming 'admin' is 'bot' for user view
              text: newMessage.message_text,
              timestamp: newMessage.timestamp,
            },
          ]);
        } else {
            // If it's an optimistic update, replace it with the server-confirmed message
            setMessages((prevMessages) => prevMessages.map(msg =>
                msg.id === newMessage.tempId ? { // Assuming tempId is used as a placeholder ID
                    id: newMessage.id,
                    sender: newMessage.sender_role === 'user' ? 'user' : 'bot',
                    text: newMessage.message_text,
                    timestamp: newMessage.timestamp,
                } : msg
            ));
            optimisticMessageIds.current.delete(newMessage.tempId); // Remove from optimistic set
        }
      });
    }

    // Fetch messages when component mounts or currentUserId/token changes
    fetchMessages();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('useEffect cleanup: Disconnecting Socket.IO.');
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('receiveMessage');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId, token, fetchMessages, navigate]); // Re-run effect if currentUserId or token changes

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUserId || !token) {
      showMessageBox('Message cannot be empty and you must be logged in.');
      return;
    }

    const tempId = Date.now(); // Unique ID for optimistic update
    optimisticMessageIds.current.add(tempId);

    // Optimistic UI update
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: tempId, // Use tempId as a placeholder
        sender: 'user',
        text: inputValue,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInputValue(''); // Clear input immediately
    scrollToBottom();

    try {
      // Emit message via Socket.IO
      socketRef.current.emit('sendMessage', {
        userId: currentUserId,
        senderId: currentUserId,
        senderRole: 'user',
        messageText: inputValue,
        tempId: tempId, // Pass tempId for server confirmation
      });

      // No need for axios.post here if Socket.IO handles persistence
    } catch (error) {
      console.error('handleSendMessage: Error sending message:', error);
      setChatError('Failed to send message.');
      // Revert optimistic update if sending fails
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempId));
      optimisticMessageIds.current.delete(tempId);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("handleSendMessage AXIOS ERROR: Unauthorized or Forbidden. Triggering logout.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setChatError('Session expired or unauthorized. Please log in again.');
        navigate('/login'); // Use navigate for routing
      }
    }
  };

  // Simple message box for errors/info (replace alert)
  const [message, setMessage] = useState('');
  const showMessageBox = (msg) => {
      setMessage(msg);
      setTimeout(() => setMessage(''), 3000); // Clear after 3 seconds
  };

  // Removed chat-toggle-button and isChatOpen logic for full-page chat
  return (
    <div className="chat-widget-container"> {/* This is now the main container */}
      <header className="chat-header">
        {/* Back button and Home icon, assuming these are part of your page layout */}
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <div className="icons">
          <span className="home-icon" onClick={() => navigate('/dashboard')}>🏠</span>
        </div>
        <h3>Customer Service</h3>
        {/* Removed close chat button as it's a full page */}
      </header>

      {message && <div className="message-box success">{message}</div>}
      {chatError && <div className="message-box error">{chatError}</div>}

      <main className="chat-messages-area">
        {loadingChat ? (
          <div className="loading-message">Loading...</div>
        ) : chatError ? (
          <div className="error-message">{chatError}</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-container ${
                message.sender === 'user' ? 'user-message' : 'bot-message'
              }`}
            >
              {/* You might want to add user/bot icons here if you had them before */}
              <div className="message-bubble">
                <p>{message.text}</p>
              </div>
              {/* You might want to add user/bot icons here if you had them before */}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="chat-footer">
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentUserId ? 'Type your message...' : 'Please log in to chat'}
            className="message-input"
            disabled={!currentUserId}
          />
          <button type="submit" className="send-button" disabled={!currentUserId}>
            ➤
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWidget;
