import React, { useState, useRef, useEffect } from 'react';
import './VoiceChatSidebar.css';

const VoiceChatSidebar = ({ messages, onSendMessage, onClose, isRestricted, isAdmin, canSpeak }) => {
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

    return (
        <div className="voice-chat-sidebar glass-panel">
            <div className="chat-header">
                <h3>Oda Sohbeti</h3>
                <button className="chat-close-btn icon-btn" onClick={onClose} title="Kapat">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div className="chat-messages custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="chat-empty-state">
                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <p>Henüz mesaj yok. İlk mesajı sen gönder!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`chat-bubble-wrapper ${msg.isLocal ? 'local' : 'remote'}`}>
                            {!msg.isLocal && <span className="chat-sender-name">{msg.senderName}</span>}
                            <div className="chat-bubble">
                                {msg.text}
                            </div>
                            <span className="chat-timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={endOfMessagesRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder="Mesaj yaz..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="chat-input neumorphic-input"
                    disabled={isRestricted && !isAdmin && !canSpeak}
                />
                <button
                    type="submit"
                    className="chat-send-btn neumorphic-btn active flex-center"
                    disabled={(!inputText.trim()) || (isRestricted && !isAdmin && !canSpeak)}
                    style={{ width: '40px', height: '40px', padding: '0', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginLeft: '-2px' }}>
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
            {isRestricted && !isAdmin && !canSpeak && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px', paddingBottom: '8px' }}>
                    Sadece yöneticiler mesaj gönderebilir.
                </div>
            )}
        </div>
    );
};

export default VoiceChatSidebar;
