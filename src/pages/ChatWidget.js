import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import "../CustomerServicePage.css";

const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">A</span>;
const ChatIcon = () => "💬";
const CloseIcon = () => "✖️";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const ChatWidget = ({ isOpen, onClose, initialMessage }) => {
  const [isChatOpen, setIsChatOpen] = useState(isOpen);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState(initialMessage || "");
  const chatEndRef = useRef(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const socketRef = useRef(null);
  const optimisticMessageIds = useRef(new Set());

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser ? currentUser.id : null;

  useEffect(() => {
    setIsChatOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (initialMessage) {
      setInputValue(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // your-project/src/ChatWidget.js

const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", currentUserId);

    const tempMessageId = `optimistic-image-user-${Date.now()}`;

    setMessages((prev) => [
        ...prev,
        {
            id: tempMessageId,
            tempId: tempMessageId,
            sender: "user",
            text: null,
            imageUrl: URL.createObjectURL(file),
            timestamp: new Date().toISOString(),
            isUploading: true,
        },
    ]);
    optimisticMessageIds.current.add(tempMessageId);

    try {
        const token = localStorage.getItem("token");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        const response = await axios.post(
            `${API_BASE_URL}/chat/messages/image`,
            formData,
            config
        );

        // ✅ FIX: Check if the socket is still connected before emitting.
        // This prevents the app from crashing if the user closes the chat mid-upload.
        if (!socketRef.current) {
            console.warn("Socket disconnected before image message could be sent via WebSocket.");
            return; // Exit the function gracefully
        }

        socketRef.current.emit("sendMessage", {
            userId: currentUserId,
            senderId: currentUserId,
            senderRole: "user",
            messageText: null,
            imageUrl: response.data.imageUrl,
            tempId: tempMessageId,
        });

    } catch (err) {
        console.error("Failed to send image:", err);
        setChatError("Failed to send image.");
        setMessages((prev) => prev.filter(msg => msg.tempId !== tempMessageId));
        // optimisticMessageIds.current.delete(tempMessageId);
    }
    finally {
        setIsUploading(false); // Set uploading to false when done
    }
};

  const handleReceiveMessage = useCallback((message) => {
    setMessages((prevMessages) => {
      if (
        message.sender_role === "user" &&
        message.tempId &&
        optimisticMessageIds.current.has(message.tempId)
      ) {
        optimisticMessageIds.current.delete(message.tempId);

        return prevMessages.map((msg) =>
          msg.tempId === message.tempId
            ? {
                id: message.id,
                sender: message.sender_role,
                text: message.message_text,
                imageUrl: message.image_url || message.imageUrl,
                timestamp: message.timestamp,
              }
            : msg
        );
      }

      const isDuplicate = prevMessages.some(
        (msg) => msg.id === message.id || msg.tempId === message.tempId
      );

      if (!isDuplicate) {
        return [
          ...prevMessages,
          {
            id: message.id,
            sender: message.sender_role,
            text: message.message_text,
            imageUrl: message.image_url || message.imageUrl,
            timestamp: message.timestamp,
          },
        ];
      }

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
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on("connect", () => {
        socketRef.current.emit("joinRoom", `user-${currentUserId}`);
      });

      socketRef.current.on("receiveMessage", handleReceiveMessage);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isChatOpen, currentUserId, handleReceiveMessage]);

  const fetchChatHistory = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingChat(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${API_BASE_URL}/chat/messages/${currentUserId}`,
        config
      );
      
      // FIXED: Ensure imageUrl is mapped from the history response
      setMessages(
        response.data.map((msg) => ({
          id: msg.id,
          sender: msg.sender_role,
          text: msg.message_text,
          timestamp: msg.timestamp,
          imageUrl: msg.image_url || msg.imageUrl,
        }))
      );
    } catch (err) {
      setChatError("Failed to load chat history.");
    } finally {
      setLoadingChat(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isChatOpen) {
      fetchChatHistory();
    }
  }, [isChatOpen, fetchChatHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === "" || !socketRef.current) return;

    const tempMessageId = `optimistic-user-${Date.now()}`;
    const messageToSend = {
      userId: currentUserId,
      senderId: currentUserId,
      senderRole: "user",
      messageText: inputValue.trim(),
      tempId: tempMessageId,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: tempMessageId,
        tempId: tempMessageId,
        sender: "user",
        text: messageToSend.messageText,
        timestamp: new Date().toISOString(),
      },
    ]);
    optimisticMessageIds.current.add(tempMessageId);
    setInputValue("");

    socketRef.current.emit("sendMessage", messageToSend);
  };

  const toggleChat = () => {
    if (isUploading) return;
    const nextState = !isChatOpen;
    setIsChatOpen(nextState);
    if (!nextState && onClose) {
      onClose();
    }
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="chat-toggle-button"
        aria-label="Toggle chat"
        disabled={isUploading}
      >
        <ChatIcon />
      </button>
      <div className={`chat-popup ${isChatOpen ? "active" : ""}`}>
        <header className="chat-header">
          <h1>Customer Service</h1>
          <button onClick={toggleChat} className="chat-close-button" disabled={isUploading}>
            {isUploading ? "..." : <CloseIcon />}
          </button>
        </header>

        <main className="chat-messages-area">
          {messages.map((message) => (
              <div
                key={message.id}
                className={`message-container ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                {/* ... other message rendering */}
                <div className="message-bubble">
                  {message.isUploading && <div className="spinner"></div>}
                  {/* ... other bubble content */}
                </div>
              </div>
            ))
          }
          <div ref={chatEndRef} />
        </main>

        <footer className="chat-footer">
          <form onSubmit={handleSendMessage} className="message-form">
            <label htmlFor="file-input" className="file-input-label">
              📎
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleImageSend}
              style={{ display: "none" }}
              disabled={!currentUserId || isUploading}
              
            />

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                currentUserId ? "Type your message..." : "Please log in to chat"
              }
              className="message-input"
              disabled={!currentUserId}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!currentUserId || isUploading}
            >
              ➤
            </button>
          </form>
        </footer>
      </div>
    </>
  );
};

export default ChatWidget;