import React, { useState, useEffect, useRef } from 'react';
import '../CustomerServicePage.css'; // You can keep using the same CSS

// --- Helper Components ---
const UserIcon = () => <span className="icon user-icon">U</span>;
const BotIcon = () => <span className="icon bot-icon">B</span>;
const ChatIcon = () => '💬';
const CloseIcon = () => '✖️';

const ChatWidget = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Welcome to customer service! How can I help you?' },
        { id: 2, sender: 'bot', text: 'THnossE2QZQRUciv7tXXX TRC20 Wallet address of shopping e-commerce company' },
    ]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;

        const newMessage = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        setTimeout(() => {
            const botResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                text: "An agent will be with you shortly.",
            };
            setMessages(prev => [...prev, botResponse]);
        }, 1500);
    };

    const toggleChat = () => setIsChatOpen(!isChatOpen);

    useEffect(() => {
        if (isChatOpen) {
            document.body.classList.add('chat-open');
        } else {
            document.body.classList.remove('chat-open');
        }
    }, [isChatOpen]);

    return (
        <>
            {/* --- Floating Chat Icon Button --- */}
            <button
                onClick={toggleChat}
                className="chat-toggle-button"
                aria-label="Toggle chat"
            >
                <ChatIcon />
            </button>

            {/* --- Chat Window --- */}
            <div className={`chat-popup ${isChatOpen ? 'active' : ''}`}>
                <header className="chat-header">
                    <h1>Customer Service</h1>
                    <button onClick={toggleChat} className="chat-close-button">
                        <CloseIcon />
                    </button>
                </header>

                <main className="chat-messages-area">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message-container ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                        >
                            {message.sender === 'bot' && <BotIcon />}
                            <div className="message-bubble">
                                <p>{message.text}</p>
                            </div>
                            {message.sender === 'user' && <UserIcon />}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </main>

                <footer className="chat-footer">
                    <form onSubmit={handleSendMessage} className="message-form">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="message-input"
                        />
                        <button type="submit" className="send-button">➤</button>
                    </form>
                </footer>
            </div>
        </>
    );
};

export default ChatWidget;