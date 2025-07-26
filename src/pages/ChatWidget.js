import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../CustomerServicePage.css'; // This CSS file is likely for the chat widget's styling

const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">A</span>;
const ChatIcon = () => '💬';
const CloseIcon = () => '✖️';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Modify ChatWidget to accept isOpen, setIsOpen, and initialMessage props
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
  const currentUserRole = currentUser ? currentUser.role : null; // Get current user's role

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
      // Map API response to match local message structure
      const formattedMessages = response.data.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        sender_id: msg.sender_id,
        sender: msg.sender_role === 'user' ? 'user' : 'bot', // Assuming 'admin' is 'bot' from user's perspective
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
            socketRef.current.emit('identifyAdmin', currentUserId); // Admins join 'admins' room
        }
      });

      socketRef.current.on('receiveMessage', (message) => {
        console.log('Received message:', message);
        // Ensure we don't add duplicate messages from optimistic updates
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
        optimisticMessageIds.current.delete(message.tempId); // Remove tempId after real message arrives
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
    // Scroll to the latest message whenever messages update
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending initial message if provided
  useEffect(() => {
    if (isOpen && initialMessage && socketRef.current && currentUserId && messages.length === 0) {
      // Send the initial message after chat opens and messages are fetched (or empty)
      // Add a slight delay to ensure socket is ready
      const timer = setTimeout(() => {
        handleSendMessage(null, initialMessage); // Pass initialMessage directly
        setInitialChatMessage(''); // Clear initial message after sending
      }, 500); // Adjust delay as needed

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMessage, currentUserId, messages.length]);


  const handleSendMessage = async (e, predefinedMessage = null) => {
    if (e) e.preventDefault(); // Prevent default form submission if triggered by form

    const messageToSend = predefinedMessage || inputValue.trim();

    if (!messageToSend || !currentUserId) return;

    const tempId = Date.now().toString(); // Generate a temporary ID for optimistic update

    // Optimistically add message to UI
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: tempId, // Use tempId for optimistic update
        user_id: currentUserId,
        sender_id: currentUserId,
        sender: 'user',
        text: messageToSend,
        timestamp: new Date().toISOString(),
        tempId: tempId, // Store tempId for later reconciliation
      },
    ]);
    setInputValue(''); // Clear input immediately

    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const token = localStorage.getItem('token');
      // Emit message via Socket.IO
      socketRef.current.emit('sendMessage', {
        userId: currentUserId,
        senderId: currentUserId,
        senderRole: 'user', // This will always be 'user' from the user's side
        messageText: messageToSend,
        tempId: tempId, // Pass tempId to backend to match
      });

      // Backend will save and then broadcast to this user and admin.
      // The `receiveMessage` event listener will handle updating with the real ID.

    } catch (err) {
      console.error('Error sending message:', err);
      setChatError('Failed to send message.');
      // Revert optimistic update if sending fails (optional, more complex)
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== tempId)
      );
    }
  };


  return (
    <>
      {/* Chat Bubble Icon - Always visible on the dashboard */}
      <div className="chat-bubble-icon" onClick={() => setIsChatOpen(!isOpen)}>
        <ChatIcon />
      </div>

      {/* Chat Widget Container */}
      <div className={`chat-widget-container ${isOpen ? 'open' : 'closed'}`}>
        <header className="chat-header">
          <h3>Customer Support</h3>
          <button className="close-button" onClick={() => setIsChatOpen(false)}>
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
                key={message.id} // Use message.id for key
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