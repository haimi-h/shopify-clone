import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios'; // axios is not directly used in this version for user profile fetching, but can remain if other parts of the component use it.
import io from 'socket.io-client';
import '../CustomerServicePage.css'; // Make sure your CSS path is correct

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
  const [loadingChat, setLoadingChat] = useState(false); // Can be used for initial message loading if fetching history
  const [chatError, setChatError] = useState(null);
  const socketRef = useRef(null);
  const optimisticMessageIds = useRef(new Set());

  // We still need the current user ID to send messages associated with them
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;

  // This ref ensures the welcome message is displayed only once per chat session opening
  const initialMessagesLoaded = useRef(false);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to establish and manage socket connection
  useEffect(() => {
    if (isChatOpen && currentUserId) {
      // Connect to Socket.IO server
      socketRef.current = io(SOCKET_URL, {
        query: { userId: currentUserId }, // Send userId to server for identification
        extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Send auth token
        },
      });

      // Event listener for incoming messages from the server
      socketRef.current.on('message', (message) => {
        console.log('Received message:', message);
        // Only add if it's not an optimistic message we've already sent,
        // or update the optimistic message once confirmed by server
        if (!optimisticMessageIds.current.has(message.id)) {
          setMessages((prevMessages) => [...prevMessages, { ...message, sender: message.senderId === currentUserId ? 'user' : 'bot' }]);
        } else {
          // If it's an optimistic message, update its status or replace it
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === message.id ? { ...message, sender: message.senderId === currentUserId ? 'user' : 'bot' } : msg
            )
          );
          optimisticMessageIds.current.delete(message.id); // Remove from set once confirmed
        }
      });

      // Event listener for the initial welcome message from the server
      socketRef.current.on('welcome', (message) => {
        console.log('Received welcome message:', message);
        // Ensure welcome message is only displayed once when chat opens
        if (!initialMessagesLoaded.current) {
          // Set messages array to only contain the welcome message
          setMessages([{ id: Date.now(), text: message, sender: 'bot' }]);
          initialMessagesLoaded.current = true;
        }
      });

      // Handle connection errors
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setChatError('Failed to connect to chat. Please try again.');
        setLoadingChat(false);
      });

      // Handle disconnection
      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server.');
        setChatError('Disconnected. Please reopen chat to reconnect.');
        initialMessagesLoaded.current = false; // Reset state for next connection
      });

      // Cleanup function: disconnect socket when component unmounts or chat closes
      return () => {
        socketRef.current.disconnect();
        socketRef.current = null;
        initialMessagesLoaded.current = false; // Reset on unmount/close
      };
    } else if (!isChatOpen) {
      // If chat is closed, ensure socket is disconnected and messages are cleared
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setMessages([]); // Clear messages when chat is closed
      initialMessagesLoaded.current = false; // Reset
    }
  }, [isChatOpen, currentUserId]); // Dependency array: re-run effect if chat state or user changes

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (inputValue.trim() && currentUserId && socketRef.current) {
      const messageText = inputValue.trim();
      setInputValue(''); // Clear input field

      // Create an optimistic message ID for immediate display
      const optimisticId = `optimistic-${Date.now()}`;
      optimisticMessageIds.current.add(optimisticId);

      // Add optimistic message to UI
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: optimisticId, text: messageText, sender: 'user', timestamp: new Date().toISOString() },
      ]);

      // Emit message to server
      socketRef.current.emit('message', {
        senderId: currentUserId,
        text: messageText,
        optimisticId: optimisticId // Send optimistic ID for server confirmation
      });
    }
  }, [inputValue, currentUserId]); // Dependency array: re-run if inputValue or currentUserId changes

  // Toggle chat window visibility
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
    // When opening, ensure chat starts fresh with the welcome message
    if (!isChatOpen && !initialMessagesLoaded.current) {
      setMessages([]); // Clear any old messages from previous sessions
    }
  };

  return (
    <>
      {/* Chat toggle button visible when chat is closed */}
      {!isChatOpen && (
        <button className="chat-toggle-button" onClick={toggleChat}>
          <ChatIcon /> Customer Service
        </button>
      )}

      {/* Chat window itself */}
      <div className={`chat-window ${isChatOpen ? 'open' : ''}`}>
        <header className="chat-header">
          <h2>Customer Service</h2>
          <button className="close-chat-button" onClick={toggleChat}>
            <CloseIcon />
          </button>
        </header>

        {/* Message display area */}
        <main className="chat-messages-area">
          {loadingChat ? (
            <div className="loading-message">Loading...</div>
          ) : chatError ? (
            <div className="error-message">{chatError}</div>
          ) : (
            // Map through messages and display them
            messages.map((message) => (
              <div
                key={message.id}
                className={`message-container ${
                  message.sender === 'user' ? 'user-message' : 'bot-message'
                }`}
              >
                {/* Display bot icon for bot messages, user icon for user messages */}
                {message.sender !== 'user' && <BotIcon />}
                <div className="message-bubble">
                  <p>{message.text}</p>
                </div>
                {message.sender === 'user' && <UserIcon />}
              </div>
            ))
          )}
          <div ref={chatEndRef} /> {/* Reference for scrolling to bottom */}
        </main>

        {/* Message input area */}
        <footer className="chat-footer">
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentUserId ? 'Type your message...' : 'Please log in to chat'}
              className="message-input"
              // Disable input if user is not logged in
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