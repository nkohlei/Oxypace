import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import MessageBubble from '../components/MessageBubble';
import NewMessageModal from '../components/NewMessageModal';
import { getImageUrl } from '../utils/imageUtils';
import Badge from '../components/Badge';
import UserBar from '../components/UserBar';
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
    const [showNewMessageModal, setShowNewMessageModal] = useState(false); // Modal State
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);

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
                    (message.sender._id === selectedUser?._id &&
                        message.recipient._id === user._id) ||
                    (message.sender._id === user._id && message.recipient._id === selectedUser?._id)
                ) {
                    setMessages((prev) => {
                        if (prev.some((m) => m._id === message._id)) return prev;
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
                setMessages((prev) =>
                    prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
                );
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

    const handleStartNewConversation = (user) => {
        setSelectedUser(user);
        fetchMessages(user._id);
        setShowNewMessageModal(false);
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
            recipient: {
                _id: selectedUser._id,
                username: selectedUser.username,
                profile: selectedUser.profile,
            },
            content: newMessage,
            media: media ? URL.createObjectURL(media) : null,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            replyTo: replyingTo,
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

            setMessages((prev) =>
                prev.map((msg) => (msg._id === optimisticMessage._id ? response.data : msg))
            );
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
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

    const filteredConversations = conversations.filter((conv) => {
        const name = conv.user.profile?.displayName || conv.user.username;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className={`inbox-container ${selectedUser ? 'chat-active' : ''}`}>
                    {/* Left Side: Conversations */}
                    <div className="conversations-view">
                        <div className="inbox-header">
                            <h1>Mesajlar</h1>
                            <button
                                className="compose-btn"
                                onClick={() => setShowNewMessageModal(true)}
                                title="Yeni Mesaj"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Mesajlarda ara"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {loading ? (
                            <div className="spinner-container">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="empty-inbox">
                                <p>Henüz mesajın yok.</p>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowNewMessageModal(true)}
                                    style={{ marginTop: '10px' }}
                                >
                                    Mesaj Başlat
                                </button>
                            </div>
                        ) : (
                            <div className="conversations-list">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.user._id}
                                        className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''} ${selectedUser?._id === conv.user._id ? 'active' : ''}`}
                                        onClick={() => handleConversationClick(conv)}
                                    >
                                        {conv.unreadCount > 0 && <div className="unread-dot"></div>}
                                        <div className="conv-avatar-wrapper">
                                            {conv.user.profile?.avatar ? (
                                                <img
                                                    src={getImageUrl(conv.user.profile.avatar)}
                                                    alt=""
                                                    className="conv-avatar"
                                                />
                                            ) : (
                                                <div className="conv-avatar-placeholder">
                                                    <span style={{ fontWeight: 'bold' }}>
                                                        {conv.user.username?.[0]?.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="conv-content">
                                            <div className="conv-header">
                                                <div className="conv-user-info">
                                                    <span className="conv-name">
                                                        {conv.user.profile?.displayName ||
                                                            conv.user.username}
                                                    </span>
                                                    <Badge type={conv.user.verificationBadge} />
                                                </div>
                                                <span className="conv-time">
                                                    {formatTime(conv.lastMessage.createdAt)}
                                                </span>
                                            </div>
                                            <p className="conv-preview">
                                                {conv.user._id === conv.lastMessage.sender._id
                                                    ? ''
                                                    : 'Sen: '}
                                                {conv.lastMessage.content ||
                                                    (conv.lastMessage.media
                                                        ? '📷 Fotoğraf'
                                                        : 'Mesaj')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <UserBar />
                    </div>

                    {/* Right Side: Chat */}
                    {selectedUser ? (
                        <div className="chat-view">
                            <div className="chat-header">
                                <button className="back-btn" onClick={handleBackToList}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        width="24"
                                        height="24"
                                    >
                                        <line x1="19" y1="12" x2="5" y2="12"></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                </button>
                                <div
                                    className="chat-header-content"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/profile/${selectedUser.username}`)}
                                >
                                    <span className="chat-header-name">
                                        {selectedUser.profile?.displayName || selectedUser.username}
                                        <Badge type={selectedUser.verificationBadge} />
                                    </span>
                                    {selectedUser.username && (
                                        <span className="chat-header-joined">
                                            @{selectedUser.username}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="chat-header-info-btn"
                                    onClick={() => navigate(`/profile/${selectedUser.username}`)}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        width="24"
                                        height="24"
                                    >
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
                                <div
                                    className="media-preview"
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {media.type.startsWith('video') ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            <span>🎥</span>
                                            <span>Video seçildi</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(media)}
                                            alt="Preview"
                                            style={{
                                                maxHeight: '200px',
                                                maxWidth: '100%',
                                                borderRadius: '4px',
                                            }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMedia(null);
                                            if (fileInputRef.current)
                                                fileInputRef.current.value = '';
                                            if (videoInputRef.current)
                                                videoInputRef.current.value = '';
                                        }}
                                        style={{
                                            marginLeft: '10px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {replyingTo && (
                                <div className="reply-preview-bar">
                                    <div className="reply-info">
                                        <span className="reply-to-label">
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="14"
                                                height="14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <polyline points="9 10 4 15 9 20" />
                                                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                            </svg>
                                            {replyingTo.sender.profile?.displayName ||
                                                replyingTo.sender.username}
                                        </span>
                                        <p className="reply-text">
                                            {replyingTo.content || '📷 Medya'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="close-reply-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="message-form">
                                <div className="message-input-wrapper">
                                    {/* Plus / Upload Button */}
                                    <button
                                        type="button"
                                        className={`upload-btn ${showPlusMenu ? 'active' : ''}`}
                                        onClick={() => setShowPlusMenu(!showPlusMenu)}
                                        title="Yükle"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" />
                                        </svg>
                                    </button>

                                    {/* Plus Menu Popover */}
                                    {showPlusMenu && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                                onClick={() => setShowPlusMenu(false)}
                                            />
                                            <div
                                                className="plus-menu"
                                                style={{ bottom: '80px', left: '20px' }}
                                            >
                                                <div
                                                    className="plus-menu-item"
                                                    onClick={() => {
                                                        fileInputRef.current.click();
                                                        setShowPlusMenu(false);
                                                    }}
                                                >
                                                    <div className="plus-menu-icon">
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <rect
                                                                x="3"
                                                                y="3"
                                                                width="18"
                                                                height="18"
                                                                rx="2"
                                                                ry="2"
                                                            ></rect>
                                                            <circle
                                                                cx="8.5"
                                                                cy="8.5"
                                                                r="1.5"
                                                            ></circle>
                                                            <polyline points="21 15 16 10 5 21"></polyline>
                                                        </svg>
                                                    </div>
                                                    Görsel Yükle
                                                </div>
                                                <div
                                                    className="plus-menu-item"
                                                    onClick={() => {
                                                        videoInputRef.current.click();
                                                        setShowPlusMenu(false);
                                                    }}
                                                >
                                                    <div className="plus-menu-icon">
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                            <rect
                                                                x="1"
                                                                y="5"
                                                                width="15"
                                                                height="14"
                                                                rx="2"
                                                                ry="2"
                                                            ></rect>
                                                        </svg>
                                                    </div>
                                                    Video Yükle
                                                </div>
                                                <div
                                                    className="plus-menu-item"
                                                    onClick={() => {
                                                        alert('GIF yükleme yakında!');
                                                        setShowPlusMenu(false);
                                                    }}
                                                >
                                                    <div
                                                        className="plus-menu-icon"
                                                        style={{
                                                            fontWeight: 800,
                                                            fontSize: '10px',
                                                        }}
                                                    >
                                                        GIF
                                                    </div>
                                                    GIF Yükle
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileSelect}
                                    />
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        style={{ display: 'none' }}
                                        accept="video/mp4, video/webm, video/quicktime"
                                        onChange={handleFileSelect}
                                    />

                                    <input
                                        type="text"
                                        placeholder={`@${selectedUser.username} kullanıcısına mesaj gönder`}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />

                                    {/* Right Side Icons */}
                                    <div className="input-right-actions">
                                        <button
                                            type="button"
                                            className="input-action-btn"
                                            title="Emoji (Yakında)"
                                        >
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <smile cx="12" cy="12" r="10"></smile>
                                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div
                            className="chat-view"
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <h2>Mesaj seç</h2>
                                <p>Mevcut sohbetlerinden birini seç veya yeni bir mesaj başlat.</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowNewMessageModal(true)}
                                    style={{
                                        marginTop: '20px',
                                        padding: '10px 24px',
                                        borderRadius: '24px',
                                    }}
                                >
                                    Yeni Mesaj
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Message Modal */}
                {showNewMessageModal && (
                    <NewMessageModal
                        currentUser={user}
                        onClose={() => setShowNewMessageModal(false)}
                        onSelectUser={handleStartNewConversation}
                    />
                )}
            </main>
        </div>
    );
};

export default Inbox;
