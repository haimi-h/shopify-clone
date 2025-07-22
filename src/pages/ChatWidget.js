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

  // --- START MODIFICATION ---
  // REMOVED: walletAddress state and setUserWalletAddress setter
  // const [userWalletAddress, setUserWalletAddress] = useState('');
  // --- END MODIFICATION ---

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser.id : null;

  const initialMessagesLoaded = useRef(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- START MODIFICATION ---
  // REMOVED: useEffect hook for fetching user wallet address
  // useEffect(() => {
  //   const fetchUserWalletAddress = async () => {
  //     if (!currentUserId) {
  //       console.log("No current user ID, skipping wallet address fetch.");
  //       return;
  //     }
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       console.warn("No token found, cannot fetch wallet address.");
  //       return;
  //     }
  //     try {
  //       const response = await axios.get(`${API_BASE_URL}/users/me`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       if (response.data && response.data.user && response.data.user.walletAddress) {
  //         setUserWalletAddress(response.data.user.walletAddress);
  //       } else {
  //         console.log("Wallet address not found in user data.");
  //         setUserWalletAddress('Not available');
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user wallet address:", error);
  //       setUserWalletAddress('Error fetching');
  //       setChatError("Failed to load user info.");
  //     }
  //   };

  //   if (isChatOpen) {
  //     fetchUserWalletAddress();
  //   }
  // }, [isChatOpen, currentUserId]);
  // --- END MODIFICATION ---


  useEffect(() => {
    if (isChatOpen && currentUserId) {
      socketRef.current = io(SOCKET_URL, {
        query: { userId: currentUserId },
        extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      socketRef.current.on('message', (message) => {
        console.log('Received message:', message);
        if (!optimisticMessageIds.current.has(message.id)) {
          setMessages((prevMessages) => [...prevMessages, { ...message, sender: message.senderId === currentUserId ? 'user' : 'bot' }]);
        } else {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === message.id ? { ...message, sender: message.senderId === currentUserId ? 'user' : 'bot' } : msg
            )
          );
          optimisticMessageIds.current.delete(message.id);
        }
      });

      // Event listener for welcome message (triggered on successful connection)
      socketRef.current.on('welcome', (message) => {
        console.log('Received welcome message:', message);
        if (!initialMessagesLoaded.current) {
          // This ensures the welcome message is the first and only initial message.
          setMessages([{ id: Date.now(), text: message, sender: 'bot' }]);
          initialMessagesLoaded.current = true;
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setChatError('Failed to connect to chat. Please try again.');
        setLoadingChat(false);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server.');
        setChatError('Disconnected. Please reopen chat to reconnect.');
        initialMessagesLoaded.current = false;
      });

      return () => {
        socketRef.current.disconnect();
        socketRef.current = null;
        initialMessagesLoaded.current = false;
      };
    } else if (!isChatOpen) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setMessages([]);
      initialMessagesLoaded.current = false;
    }
  }, [isChatOpen, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (inputValue.trim() && currentUserId && socketRef.current) {
      const messageText = inputValue.trim();
      setInputValue('');

      const optimisticId = `optimistic-${Date.now()}`;
      optimisticMessageIds.current.add(optimisticId);

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: optimisticId, text: messageText, sender: 'user', timestamp: new Date().toISOString() },
      ]);

      socketRef.current.emit('message', {
        senderId: currentUserId,
        text: messageText,
        optimisticId: optimisticId
      });
    }
  }, [inputValue, currentUserId]);

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
    if (!isChatOpen && !initialMessagesLoaded.current) {
      setMessages([]);
    }
  };

  return (
    <>
      {!isChatOpen && (
        <button className="chat-toggle-button" onClick={toggleChat}>
          <ChatIcon /> Customer Service
        </button>
      )}

      <div className={`chat-window ${isChatOpen ? 'open' : ''}`}>
        <header className="chat-header">
          <h2>Customer Service</h2>
          <button className="close-chat-button" onClick={toggleChat}>
            <CloseIcon />
          </button>
        </header>

        <main className="chat-messages-area">
          {loadingChat ? (
            <div className="loading-message">Loading...</div>
          ) : chatError ? (
            <div className="error-message">{chatError}</div>
          ) : (
            // --- START MODIFICATION ---
            // REMOVED: Conditional rendering of wallet address block
            // {userWalletAddress && (
            //   <div className="message-container bot-message">
            //     <BotIcon />
            //     <div className="message-bubble">
            //       <p>Your wallet address: {userWalletAddress}</p>
            //     </div>
            //   </div>
            // )}
            // --- END MODIFICATION ---
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