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

// ChatWidget now receives isOpen and initialMessage props from its parent (Dashboard)
const ChatWidget = ({ isOpen, setIsOpen, initialMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const socketRef = useRef(null);
  const optimisticMessageIds = useRef(new Set());

  // Internal state to manage chat widget's visibility, initialized by the isOpen prop.
  const [isWidgetVisible, setIsWidgetVisible] = useState(isOpen);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;
  const currentUserRole = currentUser ? currentUser.role : null;

  // Effect to synchronize internal visibility with the prop, and add initial message
  useEffect(() => {
    setIsWidgetVisible(isOpen); // Update internal visibility based on prop

    // Add initial message only if chat is opened by prop and message is new
    if (isOpen && initialMessage) {
      // Check if message is already in messages to prevent duplicates
      const messageAlreadyExists = messages.some(
        (msg) => msg.text === initialMessage && msg.sender === 'system'
      );
      if (!messageAlreadyExists) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `initial-${Date.now()}`, // Unique ID for the message
            sender: 'system', // Or 'bot', 'info'
            text: initialMessage,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [isOpen, initialMessage, messages]); // Depend on isOpen, initialMessage, and messages

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWidgetVisible]); // Scroll when messages update or visibility changes

  // Initialize socket connection and event listeners
  useEffect(() => {
    if (isWidgetVisible && currentUserId && !socketRef.current) {
      const token = localStorage.getItem('token');
      if (!token) {
        setChatError('Authentication token not found. Please log in.');
        return;
      }

      socketRef.current = io(SOCKET_URL, {
        query: { token },
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        socketRef.current.emit('joinRoom', `user-${currentUserId}`);
        fetchMessages(); // Fetch messages only after joining the room
      });

      socketRef.current.on('receiveMessage', (message) => {
        console.log('Received message:', message);
        setMessages((prevMessages) => {
          // Check if this is an optimistic message confirmation
          if (optimisticMessageIds.current.has(message.tempId)) {
            optimisticMessageIds.current.delete(message.tempId);
            // Update the temporary message with the real one if needed, or just keep it
            return prevMessages.map(msg =>
              msg.id === message.tempId ? { ...message, id: message.id } : msg
            );
          }
          return [...prevMessages, message];
        });
      });

      socketRef.current.on('chatHistory', (history) => {
        console.log('Chat history received:', history);
        setMessages(history);
        setLoadingChat(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
        setChatError('Socket error: ' + error.message);
        setLoadingChat(false);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setChatError('Disconnected from chat service.');
      });
    }

    // Cleanup function for socket connection
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isWidgetVisible, currentUserId]); // Re-run if visibility or user changes

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;

    setLoadingChat(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/history/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
      setChatError(null);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setChatError('Failed to load chat history.');
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId]);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!inputValue.trim() || !currentUserId || !socketRef.current) return;

      const tempId = `temp-${Date.now()}`;
      optimisticMessageIds.current.add(tempId);

      // Add optimistic message to UI
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: tempId,
          sender: 'user',
          text: inputValue,
          timestamp: new Date().toISOString(),
          temp: true, // Mark as temporary
        },
      ]);
      setInputValue(''); // Clear input immediately

      try {
        const messageData = {
          userId: currentUserId,
          senderRole: currentUserRole,
          messageText: inputValue,
          tempId: tempId, // Pass tempId for server confirmation
        };
        socketRef.current.emit('sendMessage', messageData);
      } catch (error) {
        console.error('Error sending message:', error);
        setChatError('Failed to send message.');
        // Remove optimistic message if sending failed immediately (e.g., network error)
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        optimisticMessageIds.current.delete(tempId);
      }
    },
    [inputValue, currentUserId, currentUserRole]
  );

  // This part toggles the chat visibility, and updates the parent if setIsOpen is provided
  const toggleChatVisibility = () => {
    setIsWidgetVisible((prev) => !prev);
    if (setIsOpen) { // If a setter from parent is provided, update parent state
        setIsOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* Chat toggle button - now uses isWidgetVisible */}
      <button className="chat-toggle-button" onClick={toggleChatVisibility}>
        {isWidgetVisible ? CloseIcon() : ChatIcon()}
      </button>

      {/* Chat window, conditionally rendered based on isWidgetVisible */}
      {isWidgetVisible && (
        <div className="chat-widget">
          <header className="chat-header">
            <h3>Customer Service Chat</h3>
            <button className="close-chat-button" onClick={toggleChatVisibility}>
              ✖️
            </button>
          </header>

          <main className="chat-main">
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
      )}
    </>
  );
};

export default ChatWidget;