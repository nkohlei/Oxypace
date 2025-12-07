import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import MessageBubble from '../components/MessageBubble';
import { getImageUrl } from '../utils/imageUtils';
import './Inbox.css';

const Inbox = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();

        const username = searchParams.get('user');
        if (username) {
            fetchUserByUsername(username);
        }
    }, [searchParams]);

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', (message) => {
                if (
                    (message.sender._id === selectedUser?._id && message.recipient._id === user._id) ||
                    (message.sender._id === user._id && message.recipient._id === selectedUser?._id)
                ) {
                    setMessages((prev) => [...prev, message]);
                }
                fetchConversations();
            });

            return () => {
                socket.off('newMessage');
            };
        }
    }, [socket, selectedUser, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/messages/conversations');
            setConversations(response.data);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserByUsername = async (username) => {
        try {
            const response = await axios.get(`/api/users/${username}`);
            setSelectedUser(response.data);
            fetchMessages(response.data._id);
        } catch (err) {
            console.error('Failed to fetch user:', err);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const response = await axios.get(`/api/messages/${userId}`);
            setMessages(response.data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const handleConversationClick = (conversation) => {
        setSelectedUser(conversation.user);
        fetchMessages(conversation.user._id);
    };

    const handleBackToList = () => {
        setSelectedUser(null);
        setMessages([]);
    };

    const [media, setMedia] = useState(null);
    const fileInputRef = useRef(null);

    // ... (rest of the file until handleSendMessage)

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMedia(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !media) || !selectedUser) return;

        // Optimistic UI Update
        const optimisticMessage = {
            _id: Date.now().toString(), // Temporary ID
            sender: { _id: user._id, username: user.username, profile: user.profile },
            recipient: { _id: selectedUser._id, username: selectedUser.username, profile: selectedUser.profile },
            content: newMessage,
            media: media ? URL.createObjectURL(media) : null, // Preview
            createdAt: new Date().toISOString(),
            isOptimistic: true // Flag to style potentially
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        const tempContent = newMessage;
        const tempMedia = media;

        // Reset inputs immediately
        setNewMessage('');
        setMedia(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            const formData = new FormData();
            formData.append('recipientId', selectedUser._id);
            if (tempContent) formData.append('content', tempContent);
            if (tempMedia) formData.append('media', tempMedia);

            const response = await axios.post('/api/messages', formData);

            // Replace optimistic message with real one
            setMessages((prev) => prev.map(msg =>
                msg._id === optimisticMessage._id ? response.data : msg
            ));
        } catch (err) {
            console.error('Failed to send message:', err);
            // Remove optimistic message on error
            setMessages((prev) => prev.filter(msg => msg._id !== optimisticMessage._id));
            const errorMsg = err.response?.data?.message || 'Mesaj gönderilemedi.';
            alert(errorMsg);
            // Restore inputs (optional)
            setNewMessage(tempContent);
            setMedia(tempMedia);
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return msgDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Dün';
        } else if (diffDays < 7) {
            return msgDate.toLocaleDateString('tr-TR', { weekday: 'short' });
        } else {
            return msgDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const name = conv.user.profile?.displayName || conv.user.username;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="inbox-container">
                    {/* Conversation List View */}
                    {!selectedUser ? (
                        <div className="conversations-view">
                            {/* Header */}
                            <div className="inbox-header">
                                <h1>Mesajlar</h1>
                                <button
                                    className="compose-btn"
                                    onClick={() => navigate('/search')}
                                    title="Yeni mesaj"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Search */}
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Mesajlarda Ara"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Conversations List */}
                            {loading ? (
                                <div className="spinner-container">
                                    <div className="spinner"></div>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="empty-inbox">
                                    <p>Henüz mesaj yok</p>
                                </div>
                            ) : (
                                <div className="conversations-list">
                                    {filteredConversations.map((conv) => (
                                        <div
                                            key={conv.user._id}
                                            className="conversation-item"
                                            onClick={() => handleConversationClick(conv)}
                                        >
                                            {conv.unreadCount > 0 && (
                                                <div className="unread-dot"></div>
                                            )}
                                            <div className="conv-avatar-wrapper">
                                                {conv.user.profile?.avatar ? (
                                                    <img
                                                        src={getImageUrl(conv.user.profile.avatar)}
                                                        alt={conv.user.username}
                                                        className="conv-avatar"
                                                    />
                                                ) : (
                                                    <div className="conv-avatar-placeholder">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                            <circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="conv-content">
                                                <div className="conv-header">
                                                    <span className="conv-name">
                                                        {conv.user.profile?.displayName || conv.user.username}
                                                    </span>
                                                    <span className="conv-time">
                                                        {formatTime(conv.lastMessage.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="conv-preview">
                                                    {conv.lastMessage.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Chat View */
                        <div className="chat-view">
                            {/* Chat Header */}
                            <div className="chat-header">
                                <button className="back-btn" onClick={handleBackToList}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <div className="chat-user-info">
                                    {selectedUser.profile?.avatar ? (
                                        <img
                                            src={selectedUser.profile.avatar}
                                            alt={selectedUser.username}
                                            className="chat-avatar"
                                        />
                                    ) : (
                                        <div className="chat-avatar-placeholder">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                    )}
                                    <span className="chat-username">
                                        {selectedUser.profile?.displayName || selectedUser.username}
                                    </span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="messages-container">
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message._id}
                                        message={message}
                                        isOwn={message.sender._id === user._id}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            {/* Media Preview */}
                            {media && (
                                <div className="media-preview">
                                    <img src={URL.createObjectURL(media)} alt="Preview" />
                                    <button type="button" onClick={() => { setMedia(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>×</button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="message-form">
                                <button
                                    type="button"
                                    className="attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                    </svg>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <input
                                    type="text"
                                    placeholder="Mesaj yaz..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="send-btn" disabled={!newMessage.trim() && !media}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Inbox;
