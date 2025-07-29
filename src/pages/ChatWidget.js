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
    // Disconnect existing socket if it exists before trying to connect a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (isChatOpen && currentUserId) {
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on("connect", () => {
        console.log("Socket connected, joining room:", `user-${currentUserId}`);
        socketRef.current.emit("joinRoom", `user-${currentUserId}`);
      });

      socketRef.current.on("receiveMessage", handleReceiveMessage);

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setChatError("Could not connect to chat server.");
      });

    }

    // Cleanup function for when component unmounts or dependencies change
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket in cleanup");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isChatOpen, currentUserId, handleReceiveMessage]);


  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentUserId) {
      setChatError("Please log in to send images.");
      return;
    }

    // IMPORTANT: Check socketRef.current BEFORE proceeding with optimistic update and API call
    if (!socketRef.current || !socketRef.current.connected) {
      setChatError("Chat is not connected. Please try again.");
      return;
    }

    const tempMessageId = `optimistic-image-user-${Date.now()}`;

    // Use FileReader to create a self-contained Data URL for the preview.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const imageDataUrl = reader.result;
      setMessages((prev) => [
        ...prev,
        {
          id: tempMessageId,
          tempId: tempMessageId,
          sender: "user",
          text: null,
          imageUrl: imageDataUrl,
          timestamp: new Date().toISOString(),
        },
      ]);
      optimisticMessageIds.current.add(tempMessageId);
    };

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("userId", currentUserId);

      const token = localStorage.getItem("token");
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(
        `${API_BASE_URL}/chat/messages/image`,
        formData,
        config
      );

      // After successful upload, emit the socket event with the actual server URL
      // Re-check socketRef.current here as well, in case connection dropped during async operation
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("sendMessage", {
          userId: currentUserId,
          senderId: currentUserId,
          senderRole: "user",
          messageText: null,
          imageUrl: response.data.imageUrl, // URL from backend
          tempId: tempMessageId, // Keep tempId to match with confirmation
        });
      } else {
        console.warn("Socket disconnected after image upload, could not emit message.");
        // Optionally, revert the optimistic update or show a specific error
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempMessageId));
        optimisticMessageIds.current.delete(tempMessageId);
        setChatError("Image sent to server, but chat connection lost. Message might not be delivered immediately.");
      }

    } catch (err) {
      console.error("Failed to send image:", err);
      setChatError("Failed to send image.");
      // If the upload fails, remove the optimistic message
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempMessageId));
      optimisticMessageIds.current.delete(tempMessageId);
    }
  };

  const fetchChatHistory = useCallback(async () => {
    if (!currentUserId) {
      // If no user, clear messages and return
      setMessages([]);
      setChatError("Please log in to view chat history.");
      return;
    }

    setLoadingChat(true);
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
          imageUrl: msg.image_url || msg.imageUrl,
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
    } else {
        // When chat closes, clear messages and errors
        setMessages([]);
        setChatError(null);
    }
  }, [isChatOpen, fetchChatHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    if (!currentUserId) {
        setChatError("Please log in to send messages.");
        return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
        setChatError("Chat is not connected. Please try again.");
        return;
    }

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
      >
        <ChatIcon />
      </button>
      <div className={`chat-popup ${isChatOpen ? "active" : ""}`}>
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
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                {message.sender !== "user" && <BotIcon />}
                <div className="message-bubble">
                  {message.text && <p>{message.text}</p>}
                  {message.imageUrl && (
                    <img
                      src={
                        message.imageUrl.startsWith("blob:") ||
                        message.imageUrl.startsWith("data:")
                          ? message.imageUrl
                          : `${SOCKET_URL.replace("/api", "")}${
                              message.imageUrl
                            }`
                      }
                      alt="User upload"
                      className="chat-image"
                    />
                  )}
                </div>
                {message.sender === "user" && <UserIcon />}
              </div>
            ))
          )}
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
              disabled={!currentUserId}
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
              disabled={!currentUserId || inputValue.trim() === ""}
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