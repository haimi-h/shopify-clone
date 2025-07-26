import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for potential redirects
import '../CustomerServicePage.css';

const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">A</span>;
const ChatIcon = () => '💬';
const CloseIcon = () => '✖️';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatWidget = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const socketRef = useRef(null);
  const optimisticMessageIds = useRef(new Set());

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;
  const token = localStorage.getItem('token'); // Get the token here

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReceiveMessage = useCallback((message) => {
    console.log('CLIENT RECEIVED MESSAGE:', JSON.stringify(message, null, 2));

    setMessages((prevMessages) => {
      // Check if it's an optimistic message being confirmed by the server
      if (
        message.sender_role === 'user' &&
        message.tempId &&
        optimisticMessageIds.current.has(message.tempId)
      ) {
        console.log(`Replacing optimistic message with tempId: ${message.tempId}`);
        optimisticMessageIds.current.delete(message.tempId); // Remove from optimistic set

        return prevMessages.map((msg) =>
          msg.id === message.tempId // Match by the tempId used as placeholder
            ? {
                id: message.id, // Replace with actual server ID
                sender: message.sender_role,
                text: message.message_text,
                timestamp: message.timestamp,
              }
            : msg
        );
      }

      // Prevent adding duplicate messages from other sources (e.g., admin sending a message)
      const isDuplicate = prevMessages.some(
        (msg) => msg.id === message.id // Check for actual server ID
      );

      if (!isDuplicate) {
        console.log(`Adding new message from other user/admin with id: ${message.id}`);
        return [
          ...prevMessages,
          {
            id: message.id,
            sender: message.sender_role === 'user' ? 'user' : 'bot', // Assuming 'admin' is 'bot' for user view
            text: message.message_text,
            timestamp: message.timestamp,
          },
        ];
      }

      console.log(`Ignoring already present message with id: ${message.id}`);
      return prevMessages;
    });
  }, []);

  const fetchChatHistory = useCallback(async () => {
    if (!currentUserId || !token) {
      console.log("fetchChatHistory: No user ID or token found. Skipping fetch.");
      setChatError('Please log in to view chat history.');
      return;
    }
    setLoadingChat(true);
    setChatError(null); // Clear previous errors
    try {
      console.log(`fetchChatHistory: Attempting to fetch messages for user ${currentUserId}`);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${API_BASE_URL}/chat/messages/${currentUserId}`,
        config
      );

      console.log("fetchChatHistory: Messages fetched successfully.");
      setMessages(
        response.data.map((msg) => ({
          id: msg.id,
          sender: msg.sender_role === 'user' ? 'user' : 'bot', // Assuming 'admin' is 'bot' for user view
          text: msg.message_text,
          timestamp: msg.timestamp,
        }))
      );
    } catch (err) {
      console.error('fetchChatHistory: Error fetching chat history:', err);
      setChatError('Failed to load chat history.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.error("fetchChatHistory AXIOS ERROR: Unauthorized or Forbidden. Triggering logout.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setChatError('Session expired or unauthorized. Please log in again.');
        navigate('/login'); // Redirect to login page
      }
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId, token, navigate]);

  useEffect(() => {
    // Connect/disconnect socket based on chat open state and user presence
    if (isChatOpen && currentUserId && token) {
      if (!socketRef.current) {
        console.log('useEffect: Chat is open and user/token present. Attempting to connect Socket.IO...');
        socketRef.current = io(SOCKET_URL, {
          auth: {
            token: token, // Pass the current token for authentication
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
              navigate('/login'); // Redirect to login page
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          // For debugging, let's not aggressively logout on every disconnect reason
          // The fetchChatHistory error handling should cover token issues.
        });

        socketRef.current.on('receiveMessage', handleReceiveMessage);
      }
      // Fetch history when chat opens
      fetchChatHistory();
    } else {
      // Disconnect socket if chat is closed or user/token is missing
      if (socketRef.current) {
        console.log('useEffect cleanup: Chat closed or user/token missing. Disconnecting Socket.IO.');
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('receiveMessage');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Clear messages and errors if chat is closed
      setMessages([]);
      setChatError(null);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('Component unmount cleanup: Disconnecting Socket.IO.');
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('receiveMessage');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isChatOpen, currentUserId, token, handleReceiveMessage, fetchChatHistory, navigate]); // Dependencies for this effect

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || !socketRef.current || !currentUserId || !token) {
      showMessageBox('Message cannot be empty and you must be logged in.');
      return;
    }

    const tempMessageId = `optimistic-user-${Date.now()}`; // Unique ID for optimistic update
    const messageToSend = {
      userId: currentUserId,
      senderId: currentUserId,
      senderRole: 'user',
      messageText: inputValue.trim(),
      tempId: tempMessageId, // Pass tempId for server confirmation
    };

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        id: tempMessageId, // Use tempId as a placeholder ID for optimistic message
        sender: 'user',
        text: messageToSend.messageText,
        timestamp: new Date().toISOString(),
      },
    ]);
    optimisticMessageIds.current.add(tempMessageId); // Add to set of optimistic IDs
    setInputValue(''); // Clear input immediately
    scrollToBottom();

    try {
      // Emit message via Socket.IO
      socketRef.current.emit('sendMessage', messageToSend);
    } catch (error) {
      console.error('handleSendMessage: Error sending message via socket:', error);
      setChatError('Failed to send message.');
      // Revert optimistic update if sending fails
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempMessageId));
      optimisticMessageIds.current.delete(tempMessageId);
      // If there's an underlying network issue or server rejection not caught by socket.io events
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("handleSendMessage AXIOS ERROR: Unauthorized or Forbidden. Triggering logout.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setChatError('Session expired or unauthorized. Please log in again.');
        navigate('/login');
      }
    }
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  // Simple message box for errors/info (replace alert)
  const [message, setMessage] = useState('');
  const showMessageBox = (msg) => {
      setMessage(msg);
      setTimeout(() => setMessage(''), 3000); // Clear after 3 seconds
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button onClick={toggleChat} className="chat-toggle-button" aria-label="Toggle chat">
        <ChatIcon />
      </button>

      {/* Chat Popup Container */}
      <div className={`chat-popup ${isChatOpen ? 'active' : ''}`}>
        <header className="chat-header">
          <h1>Customer Service</h1>
          <button onClick={toggleChat} className="chat-close-button">
            <CloseIcon />
          </button>
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
                {message.sender !== 'user' && <BotIcon />}
                <div className="message-bubble">
                  <p>{message.text}</p>
                </div>
                {message.sender === 'user' && <UserIcon />}
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
    </>
  );
};

export default ChatWidget;
