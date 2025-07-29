import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import "../CustomerServicePage.css"; // Assuming this CSS provides necessary styles

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
    // Scroll to bottom when messages change, but only if chat is open or becomes open
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]); // Added isChatOpen to dependency array

  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setChatError(null); // Clear previous errors

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", currentUserId);

    const tempMessageId = `optimistic-image-user-${Date.now()}`;
    const imageUrlPreview = URL.createObjectURL(file); // Create a temporary URL for preview

    setMessages((prev) => [
      ...prev,
      {
        id: tempMessageId, // Use tempId as id for optimistic message
        tempId: tempMessageId,
        sender: "user",
        text: null,
        imageUrl: imageUrlPreview,
        timestamp: new Date().toISOString(),
        isUploading: true, // Flag for showing upload indicator
      },
    ]);
    optimisticMessageIds.current.add(tempMessageId);

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Ensure correct content type for file upload
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/chat/messages/image`,
        formData,
        config
      );

      // IMPORTANT: Check if the socket is still connected before emitting.
      // This prevents the app from crashing if the user closes the chat mid-upload.
      if (!socketRef.current) {
        console.warn("Socket disconnected before image message could be sent via WebSocket. Removing optimistic message.");
        // Remove the optimistic message if socket is not available to confirm it
        setMessages((prev) => prev.filter(msg => msg.tempId !== tempMessageId));
        optimisticMessageIds.current.delete(tempMessageId);
        return;
      }

      // Emit the message via socket.io
      socketRef.current.emit("sendMessage", {
        userId: currentUserId,
        senderId: currentUserId,
        senderRole: "user",
        messageText: null,
        imageUrl: response.data.imageUrl, // Use the URL returned by the server
        tempId: tempMessageId, // Pass tempId for server confirmation
      });

    } catch (err) {
      console.error("Failed to send image:", err);
      setChatError("Failed to send image.");
      // On error, remove the optimistic message from the state
      setMessages((prev) => prev.filter(msg => msg.tempId !== tempMessageId));
      optimisticMessageIds.current.delete(tempMessageId); // Clear tempId from set
    } finally {
      setIsUploading(false); // Always set uploading to false when done
    }
    // No need to revoke URL.createObjectURL here, it's revoked in the img onLoad
  };

  const handleReceiveMessage = useCallback((message) => {
    setMessages((prevMessages) => {
      // If this is a confirmation for an optimistic user message
      if (
        message.sender_role === "user" &&
        message.tempId &&
        optimisticMessageIds.current.has(message.tempId)
      ) {
        optimisticMessageIds.current.delete(message.tempId); // Remove from set

        return prevMessages.map((msg) =>
          msg.tempId === message.tempId
            ? {
                id: message.id, // Replace tempId with actual ID from server
                sender: message.sender_role,
                text: message.message_text,
                imageUrl: message.image_url || message.imageUrl,
                timestamp: message.timestamp,
                isUploading: false, // Mark as no longer uploading
                tempId: undefined, // Clear tempId
              }
            : msg
        );
      }

      // Prevent duplicate messages (especially for non-optimistic messages or bot responses)
      const isDuplicate = prevMessages.some(
        (msg) => msg.id === message.id || (message.tempId && msg.tempId === message.tempId)
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
            isUploading: false, // New messages are never uploading initially
          },
        ];
      }

      return prevMessages; // If duplicate, return previous state
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
        console.log("Socket connected:", socketRef.current.id);
        socketRef.current.emit("joinRoom", `user-${currentUserId}`);
      });

      socketRef.current.on("receiveMessage", handleReceiveMessage);

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setChatError("Failed to connect to chat service.");
      });
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
    setChatError(null); // Clear previous errors
    try {
      const token = localStorage.getItem("token");
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
          imageUrl: msg.image_url || msg.imageUrl, // Ensure imageUrl is mapped
          isUploading: false, // History messages are never uploading
        }))
      );
    } catch (err) {
      console.error("Failed to load chat history:", err);
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
    if (inputValue.trim() === "" || !socketRef.current || isUploading) return; // Disable if uploading

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
        id: tempMessageId, // Use tempId as ID for optimistic message
        tempId: tempMessageId,
        sender: "user",
        text: messageToSend.messageText,
        timestamp: new Date().toISOString(),
        isUploading: false, // Text messages aren't "uploading" in the same way as images
      },
    ]);
    optimisticMessageIds.current.add(tempMessageId);
    setInputValue("");
    setChatError(null); // Clear any previous errors when sending new message

    socketRef.current.emit("sendMessage", messageToSend);
  };

  const toggleChat = () => {
    if (isUploading) return; // Prevent closing/opening during upload
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
        disabled={isUploading} // Disable toggle button during upload
      >
        <ChatIcon />
      </button>
      <div className={`chat-popup ${isChatOpen ? "active" : ""}`}>
        <header className="chat-header">
          <h1>Customer Service</h1>
          <button onClick={toggleChat} className="chat-close-button" disabled={isUploading}>
            {isUploading ? "Uploading..." : <CloseIcon />} {/* More descriptive */}
          </button>
        </header>

        <main className="chat-messages-area">
          {loadingChat && <div className="loading-indicator">Loading chat history...</div>}
          {chatError && <div className="error-message">{chatError}</div>}
          {messages.map((message) => (
            <div
              key={message.id || message.tempId} // Use tempId for optimistic messages until actual ID is received
              className={`message-container ${
                message.sender === "user" ? "user-message" : "bot-message"
              }`}
            >
              {message.sender === "user" ? <UserIcon /> : <BotIcon />}
              <div className="message-bubble">
                {message.isUploading && (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <span>Sending...</span>
                  </div>
                )}
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Uploaded"
                    className="chat-image"
                    onLoad={(e) => URL.revokeObjectURL(e.target.src)} // Clean up blob URL
                  />
                )}
                {message.text && <p>{message.text}</p>}
                <span className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
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
              disabled={!currentUserId || isUploading} // Disable file input during upload
            />

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                currentUserId && !isUploading ? "Type your message..." : "Please log in or wait..." // Update placeholder
              }
              className="message-input"
              disabled={!currentUserId || isUploading} // Disable text input during upload
            />
            <button
              type="submit"
              className="send-button"
              disabled={!currentUserId || isUploading || inputValue.trim() === ""} // Disable send button during upload or if input is empty
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