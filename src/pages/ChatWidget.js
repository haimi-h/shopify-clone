import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../CustomerServicePage.css'; // Make sure this CSS file exists

const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">A</span>;
const ChatIcon = () => '💬';
const CloseIcon = () => '✖️';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ChatWidget = ({ isOpen, setIsOpen, initialMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const socketRef = useRef(null);
  const optimisticMessageIds = useRef(new Set());

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;
  const currentUserRole = currentUser ? currentUser.role : null;

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;

    setLoadingChat(true);
    setChatError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const formattedMessages = response.data.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        sender_id: msg.sender_id,
        sender: msg.sender_role === 'user' ? 'user' : 'bot',
        text: msg.message_text,
        timestamp: msg.timestamp,
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      setChatError('Failed to load chat history.');
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchMessages();

      socketRef.current = io(SOCKET_URL, {
        query: { token: localStorage.getItem('token') },
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        socketRef.current.emit('joinRoom', `user-${currentUserId}`);
        if (currentUserRole === 'admin') {
          socketRef.current.emit('identifyAdmin', currentUserId);
        }
      });

      socketRef.current.on('receiveMessage', (message) => {
        console.log('Received message:', message);
        if (!optimisticMessageIds.current.has(message.tempId)) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: message.id,
              user_id: message.user_id,
              sender_id: message.sender_id,
              sender: message.sender_role === 'user' ? 'user' : 'bot',
              text: message.message_text,
              timestamp: message.timestamp,
            },
          ]);
        }
        optimisticMessageIds.current.delete(message.tempId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isOpen, currentUserId, currentUserRole, fetchMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (
      isOpen &&
      initialMessage &&
      socketRef.current &&
      currentUserId &&
      messages.length === 0
    ) {
      const timer = setTimeout(() => {
        handleSendMessage(null, initialMessage);
        // Removed setInitialChatMessage to prevent error
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMessage, currentUserId, messages.length]);

  const handleSendMessage = async (e, predefinedMessage = null) => {
    if (e) e.preventDefault();

    const messageToSend = predefinedMessage || inputValue.trim();

    if (!messageToSend || !currentUserId) return;

    const tempId = Date.now().toString();

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: tempId,
        user_id: currentUserId,
        sender_id: currentUserId,
        sender: 'user',
        text: messageToSend,
        timestamp: new Date().toISOString(),
        tempId: tempId,
      },
    ]);
    setInputValue('');

    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const token = localStorage.getItem('token');
      socketRef.current.emit('sendMessage', {
        userId: currentUserId,
        senderId: currentUserId,
        senderRole: 'user',
        messageText: messageToSend,
        tempId: tempId,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setChatError('Failed to send message.');
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== tempId)
      );
    }
  };

  return (
    <>
      <div className="chat-bubble-icon" onClick={() => setIsOpen(!isOpen)}>
        <ChatIcon />
      </div>

      <div className={`chat-widget-container ${isOpen ? 'open' : 'closed'}`}>
        <header className="chat-header">
          <h3>Customer Support</h3>
          <button className="close-button" onClick={() => setIsOpen(false)}>
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
              placeholder={
                currentUserId ? 'Type your message...' : 'Please log in to chat'
              }
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
