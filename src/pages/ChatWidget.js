import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../CustomerServicePage.css';

const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">A</span>;
const ChatIcon = () => '�';
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

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;

  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReceiveMessage = useCallback((message) => {
    console.log('CLIENT RECEIVED MESSAGE:', JSON.stringify(message, null, 2));

    setMessages((prevMessages) => {
      if (
        message.sender_role === 'user' &&
        message.tempId &&
        optimisticMessageIds.current.has(message.tempId)
      ) {
        console.log(`Replacing optimistic message with tempId: ${message.tempId}`);
        optimisticMessageIds.current.delete(message.tempId);

        return prevMessages.map((msg) =>
          msg.tempId === message.tempId
            ? {
                id: message.id,
                sender: message.sender_role,
                text: message.message_text,
                timestamp: message.timestamp,
              }
            : msg
        );
      }

      const isDuplicate = prevMessages.some(
        (msg) => msg.id === message.id || msg.tempId === message.tempId
      );

      if (!isDuplicate) {
        console.log(`Adding new message from other user/admin with id: ${message.id}`);
        return [
          ...prevMessages,
          {
            id: message.id,
            sender: message.sender_role,
            text: message.message_text,
            timestamp: message.timestamp,
          },
        ];
      }

      console.log(`Ignoring already present message with id: ${message.id}`);
      return prevMessages;
    });
  }, []);

  useEffect(() => {
    if (!currentUserId || !isChatOpen) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      // Pass the token with the Socket.IO connection for authentication
      const token = localStorage.getItem('token');
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: token
        }
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinRoom', `user-${currentUserId}`);
      });

      socketRef.current.on('receiveMessage', handleReceiveMessage);

      // Handle Socket.IO disconnection (e.g., due to invalid token on server-side middleware)
      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect' || reason === 'transport close') {
          // This might indicate a server-side authentication failure
          console.warn('Server-side disconnect, potentially due to authentication. Redirecting to login.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      });

    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isChatOpen, currentUserId, handleReceiveMessage, navigate]); // Add navigate to dependencies

  const fetchChatHistory = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingChat(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${API_BASE_URL}/chat/messages/${currentUserId}`,
        config
      );

      setMessages(
        response.data.map((msg) => ({
          id: msg.id,
          sender: msg.sender_role,
          text: msg.message_text,
          timestamp: msg.timestamp,
        }))
      );
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setChatError('Failed to load chat history.');
      // *** IMPORTANT: If fetching chat history fails due to authentication, redirect to login ***
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login'); // Redirect to login page
      }
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId, navigate]); // Add navigate to dependencies

  useEffect(() => {
    if (isChatOpen) {
      fetchChatHistory();
    }
  }, [isChatOpen, fetchChatHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || !socketRef.current) return;

    const tempMessageId = `optimistic-user-${Date.now()}`;
    const messageToSend = {
      userId: currentUserId,
      senderId: currentUserId,
      senderRole: 'user',
      messageText: inputValue.trim(),
      tempId: tempMessageId,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: tempMessageId,
        tempId: tempMessageId, // This is required to match later
        sender: 'user',
        text: messageToSend.messageText,
        timestamp: new Date().toISOString(),
      },
    ]);
    optimisticMessageIds.current.add(tempMessageId);
    setInputValue('');

    socketRef.current.emit('sendMessage', messageToSend);
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <>
      <button onClick={toggleChat} className="chat-toggle-button" aria-label="Toggle chat">
        <ChatIcon />
      </button>
      <div className={`chat-popup ${isChatOpen ? 'active' : ''}`}>
        <header className="chat-header">
          <h1>Customer Service</h1>
          <button onClick={toggleChat} className="chat-close-button">
            <CloseIcon />
          </button>
        </header>

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
