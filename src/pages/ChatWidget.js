import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../CustomerServicePage.css';

const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">A</span>;
const ChatIcon = () => '💬';
const CloseIcon = () => '✖️';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
      setChatError('Please log in to view chat messages.');
      return;
    }
    setLoadingChat(true);
    setChatError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Ensure token is sent
        },
      });
      setMessages(response.data.map(msg => ({
        id: msg.id,
        sender: msg.sender_role === 'user' ? 'user' : 'bot', // Assuming 'admin' is 'bot' for user view
        text: msg.message_text,
        timestamp: msg.timestamp,
      })));
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      setChatError('Failed to load messages. Please try again later.');
      // If unauthorized, trigger logout
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // You might want to navigate to login page here or show a specific message
        setChatError('Session expired or unauthorized. Please log in again.');
        window.location.href = '/login'; // Redirect to login page
      }
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId, token]); // Depend on currentUserId and token

  // Effect for Socket.IO connection and message fetching
  useEffect(() => {
    if (!currentUserId || !token) {
      console.log("No user ID or token found, skipping socket connection and message fetch.");
      setChatError('Please log in to chat.');
      return;
    }

    // Initialize Socket.IO connection
    if (!socketRef.current) {
      console.log('Attempting to connect Socket.IO...');
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setChatError('Authentication failed. Please log in again.');
            window.location.href = '/login'; // Redirect to login page
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        // If disconnected due to unauthorized, trigger logout
        if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
            // These reasons might imply a server-side rejection or network issue
            // Re-fetch messages to see if it's a temporary glitch or a persistent auth issue
            // Or, if you want aggressive logout on any disconnect:
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
            // setChatError('Disconnected. Please log in again.');
            // window.location.href = '/login';
        }
      });

      socketRef.current.on('receiveMessage', (newMessage) => {
        console.log('Received new message:', newMessage);
        // Only add if it's not an optimistic update already handled
        if (!optimisticMessageIds.current.has(newMessage.tempId)) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: newMessage.id,
              sender: newMessage.sender_role === 'user' ? 'user' : 'bot',
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
        console.log('Disconnecting Socket.IO on cleanup.');
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('receiveMessage');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId, token, fetchMessages]); // Re-run effect if currentUserId or token changes

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUserId || !token) {
      setMessage('Message cannot be empty and you must be logged in.');
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
      // If you still want to use REST for persistence, uncomment this:
      /*
      await axios.post(`${API_BASE_URL}/chat/messages`, {
        userId: currentUserId,
        messageText: inputValue,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      */

    } catch (error) {
      console.error('Error sending message:', error);
      setChatError('Failed to send message.');
      // Revert optimistic update if sending fails
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempId));
      optimisticMessageIds.current.delete(tempId);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setChatError('Session expired or unauthorized. Please log in again.');
        window.location.href = '/login';
      }
    }
  };

  // Simple message box for errors/info (replace alert)
  const [message, setMessage] = useState('');
  const showMessageBox = (msg) => {
      setMessage(msg);
      setTimeout(() => setMessage(''), 3000); // Clear after 3 seconds
  };


  return (
    <>
      <button className="chat-toggle-button" onClick={() => setIsChatOpen(!isChatOpen)}>
        {isChatOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      <div className={`chat-widget-container ${isChatOpen ? 'open' : 'closed'}`}>
        <header className="chat-header">
          <h3>Customer Service</h3>
          <button className="close-chat-button" onClick={() => setIsChatOpen(false)}>✖️</button>
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
