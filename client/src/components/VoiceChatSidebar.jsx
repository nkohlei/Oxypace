import React, { useState, useRef, useEffect } from 'react';
import './VoiceChatSidebar.css';
import { X, MessageSquare, Lock, Send } from 'lucide-react';

const VoiceChatSidebar = ({ messages, onSendMessage, onClose, isRestricted, isAdmin }) => {
    const [inputText, setInputText] = useState('');
    const endOfMessagesRef = useRef(null);

    // Scroll to bottom whenever messages array changes
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    // Helper function to render text with clickable URLs
    const renderMessageText = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <div className="voice-chat-sidebar glass-panel">
            <div className="chat-header">
                <h3>Oda Sohbeti</h3>
                <button className="chat-close-btn icon-btn" onClick={onClose} title="Kapat">
                    <X size={20} strokeWidth={2} />
                </button>
            </div>

            <div className="chat-messages custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="chat-empty-state">
                        <MessageSquare size={48} strokeWidth={1.5} color="rgba(255,255,255,0.2)" />
                        <p>Henüz mesaj yok. İlk mesajı sen gönder!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`chat-bubble-wrapper ${msg.isLocal ? 'local' : 'remote'}`}>
                            {!msg.isLocal && <span className="chat-sender-name">{msg.senderName}</span>}
                            <div className="chat-bubble">
                                {renderMessageText(msg.text)}
                            </div>
                            <span className="chat-timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {isRestricted && !isAdmin ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Lock size={16} strokeWidth={2} />
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Sadece Yöneticiler Mesaj Gönderebilir</span>
                    </div>
                </div>
            ) : (
                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder={isAdmin ? "Mesaj veya /watch [YouTube URL]..." : "Mesaj yaz..."}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="chat-input glass-input"
                    />
                    <button
                        type="submit"
                        className="chat-send-btn glass-btn active flex-center"
                        disabled={(!inputText.trim())}
                        style={{ width: '40px', height: '40px', padding: '0', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Send size={18} strokeWidth={2} style={{ marginLeft: '-2px' }} />
                    </button>
                </form>
            )}
        </div>
    );
};

export default VoiceChatSidebar;
