import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import MessageBubble from '../components/MessageBubble';
import { getImageUrl } from '../utils/imageUtils';
import Badge from '../components/Badge';
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
    const [media, setMedia] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchConversations();

        const username = searchParams.get('user');
        if (username) {
            fetchUserByUsername(username);
        }
    }, [searchParams]);

    useEffect(() => {
        if (socket) {
            const handleNewMessage = (message) => {
                if (
                    (message.sender._id === selectedUser?._id && message.recipient._id === user._id) ||
                    (message.sender._id === user._id && message.recipient._id === selectedUser?._id)
                ) {
                    setMessages((prev) => {
                        if (prev.some(m => m._id === message._id)) return prev;
                        return [...prev, message];
                    });
                }
                fetchConversations();
            };

            const handleMessageDeleted = (id) => {
                setMessages((prev) => prev.filter((msg) => msg._id !== id));
                fetchConversations();
            };

            const handleMessageReaction = ({ messageId, reactions }) => {
                setMessages((prev) => prev.map(msg =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                ));
            };

            socket.on('newMessage', handleNewMessage);
            socket.on('messageSent', handleNewMessage);
            socket.on('messageDeleted', handleMessageDeleted);
            socket.on('messageReaction', handleMessageReaction);

            return () => {
                socket.off('newMessage', handleNewMessage);
                socket.off('messageSent', handleNewMessage);
                socket.off('messageDeleted', handleMessageDeleted);
                socket.off('messageReaction', handleMessageReaction);
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

    const handleReply = (message) => {
        setReplyingTo(message);
        const input = document.querySelector('.message-input-wrapper input');
        if (input) input.focus();
    };

    const handleReact = async (messageId, emoji) => {
        try {
            await axios.post(`/api/messages/${messageId}/react`, { emoji });
        } catch (error) {
            console.error('Reaction failed:', error);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMedia(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !media) || !selectedUser) return;

        if (!selectedUser._id) {
            alert('Hata: Kullanıcı ID bulunamadı.');
            return;
        }

        const optimisticMessage = {
            _id: Date.now().toString(),
            sender: { _id: user._id, username: user.username, profile: user.profile },
            recipient: { _id: selectedUser._id, username: selectedUser.username, profile: selectedUser.profile },
            content: newMessage,
            media: media ? URL.createObjectURL(media) : null,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            replyTo: replyingTo
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        const tempContent = newMessage;
        const tempMedia = media;
        const tempReplyTo = replyingTo;

        setNewMessage('');
        setMedia(null);
        setReplyingTo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            const formData = new FormData();
            formData.append('recipientId', selectedUser._id);
            if (tempContent) formData.append('content', tempContent);
            if (tempMedia) formData.append('media', tempMedia);
            if (tempReplyTo) formData.append('replyToId', tempReplyTo._id);

            const response = await axios.post('/api/messages', formData);

            setMessages((prev) => prev.map(msg =>
                msg._id === optimisticMessage._id ? response.data : msg
            ));
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages((prev) => prev.filter(msg => msg._id !== optimisticMessage._id));
            alert('Mesaj gönderilemedi.');
            setNewMessage(tempContent);
            setMedia(tempMedia);
            setReplyingTo(tempReplyTo);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        const previousMessages = [...messages];
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

        try {
            await axios.delete(`/api/messages/${messageId}`);
            fetchConversations();
        } catch (err) {
            console.error('Failed to delete message:', err);
            setMessages(previousMessages);
            alert('Mesaj silinemedi.');
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

    const formatJoinedDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `Katıldı ${date.getFullYear()}`;
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
                    {!selectedUser ? (
                        <div className="conversations-view">
                            <div className="inbox-header">
                                <h1>Mesajlar</h1>
                                <button className="compose-btn" onClick={() => navigate('/search')} title="Yeni mesaj">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Ara"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            {loading ? (
                                <div className="spinner-container"><div className="spinner"></div></div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="empty-inbox"><p>Mesaj yok</p></div>
                            ) : (
                                <div className="conversations-list">
                                    {filteredConversations.map((conv) => (
                                        <div key={conv.user._id} className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}`} onClick={() => handleConversationClick(conv)}>
                                            {conv.unreadCount > 0 && <div className="unread-dot"></div>}
                                            <div className="conv-avatar-wrapper">
                                                {conv.user.profile?.avatar ? (
                                                    <img src={getImageUrl(conv.user.profile.avatar)} alt="" className="conv-avatar" />
                                                ) : (
                                                    <div className="conv-avatar-placeholder">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="conv-content">
                                                <div className="conv-header">
                                                    <div className="conv-user-info">
                                                        <span className="conv-name">{conv.user.profile?.displayName || conv.user.username}</span>
                                                        <Badge type={conv.user.verificationBadge} />
                                                    </div>
                                                    <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                                                </div>
                                                <p className="conv-preview">
                                                    {conv.user._id === conv.lastMessage.sender._id ? '' : 'Sen: '}
                                                    {conv.lastMessage.content || (conv.lastMessage.media ? '📷 Fotoğraf' : 'Mesaj')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="chat-view">
                            <div className="chat-header">
                                <button className="back-btn" onClick={handleBackToList}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                </button>
                                <div className="chat-header-content">
                                    <span className="chat-header-name">
                                        {selectedUser.profile?.displayName || selectedUser.username}
                                        <Badge type={selectedUser.verificationBadge} />
                                    </span>
                                    {selectedUser.createdAt && (
                                        <span className="chat-header-joined">{formatJoinedDate(selectedUser.createdAt)}</span>
                                    )}
                                </div>
                                <button className="chat-header-info-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                </button>
                            </div>

                            <div className="messages-container">
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message._id}
                                        message={message}
                                        isOwn={message.sender._id === user._id}
                                        onDelete={handleDeleteMessage}
                                        onReply={handleReply}
                                        onReact={handleReact}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {media && (
                                <div className="media-preview">
                                    <img src={URL.createObjectURL(media)} alt="Preview" />
                                    <button type="button" onClick={() => { setMedia(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>×</button>
                                </div>
                            )}

                            {replyingTo && (
                                <div className="reply-preview-bar">
                                    <div className="reply-info">
                                        <span className="reply-to-label">
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 10 4 15 9 20" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></svg>
                                            {replyingTo.sender.username}
                                        </span>
                                        <p className="reply-text">{replyingTo.content || '📷 Medya'}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="close-reply-btn">×</button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="message-form">
                                <div className="input-actions-left">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Resim Ekle">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                    </button>
                                    <button type="button" className="icon-btn" title="GIF">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 10h-2v4h2"></path><path d="M12 10v4"></path><path d="M15 10h2"></path><path d="M15 12h1.5"></path><path d="M15 14h2"></path></svg>
                                    </button>
                                    <button type="button" className="icon-btn" title="Emoji">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                                    </button>
                                </div>

                                <div className="message-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Mesaj yaz..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                </div>

                                <button type="submit" className="send-btn-small" disabled={!newMessage.trim() && !media}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
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
