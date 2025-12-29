import React from 'react';
import UserBar from './UserBar';

const ChannelSidebar = ({ portal, isMember, onEdit, currentChannel, onChangeChannel }) => {
    if (!portal) return null;

    const channels = [
        { id: 'general', name: 'genel', type: 'text' },
        { id: 'announcements', name: 'duyurular', type: 'text' },
        { id: 'members', name: 'üyeler', type: 'text' },
        { id: 'voice-lounge', name: 'Canlı Sohbet', type: 'voice' }
    ];

    return (
        <div className="channel-sidebar" style={{
            width: '300px', /* Upscaled from 280px */
            height: '100%',
            backgroundColor: '#111827', // Gray-900 
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)'
        }}>
            {/* Header / Portal Name Dropdown */}
            <div style={{
                height: '60px', /* Upscaled from 48px */
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}
                className="channel-header-hover"
                onClick={onEdit} // Trigger edit modal ordropdown
            >
                <h2 style={{
                    fontSize: '17px', /* Upscaled */
                    fontWeight: '700',
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {portal.name}
                </h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" color="#b9bbbe">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>

            {/* Channels List */}
            <div style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }} className="custom-scrollbar">

                {/* Text Channels Category */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        padding: '0 8px 4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#949ba4',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                        className="category-header"
                    >
                        <span>Metin Kanalları</span>
                        <span style={{ cursor: 'pointer', fontSize: '16px' }}>+</span>
                    </div>

                    {channels.filter(c => c.type === 'text').map(channel => (
                        <div
                            key={channel.id}
                            className={`channel-item ${currentChannel === channel.id ? 'active' : ''}`}
                            onClick={() => onChangeChannel(channel.id)}
                            style={{
                                padding: '6px 8px',
                                margin: '1px 0',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: currentChannel === channel.id ? 'white' : '#949ba4',
                                backgroundColor: currentChannel === channel.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                                transition: 'all 0.1s'
                            }}
                        >
                            <span style={{ fontSize: '18px', color: '#72767d' }}>#</span>
                            <span style={{ fontWeight: 500 }}>{channel.name}</span>
                        </div>
                    ))}
                </div>

                {/* Voice Channels Category */}
                <div>
                    <div style={{
                        padding: '0 8px 4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#949ba4',
                        textTransform: 'uppercase'
                    }}>
                        Ses Kanalları
                    </div>
                    {channels.filter(c => c.type === 'voice').map(channel => (
                        <div
                            key={channel.id}
                            className="channel-item"
                            style={{
                                padding: '6px 8px',
                                margin: '1px 0',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: '#949ba4'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                            </svg>
                            <span style={{ fontWeight: 500 }}>{channel.name}</span>
                            <div style={{ marginLeft: 'auto', fontSize: '10px', background: '#3ba55d', padding: '2px 4px', borderRadius: '4px', color: 'white' }}>
                                LIVE
                            </div>
                        </div>
                    ))}
                    {/* Fake User in Voice */}
                    <div style={{ marginLeft: '28px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#5865F2', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            U
                        </div>
                        <span style={{ fontSize: '13px', color: '#b9bbbe' }}>ufuk.gls</span>
                    </div>
                </div>

            </div>

            {/* Bottom User Bar */}
            <UserBar />

            <style>{`
                .channel-header-hover:hover {
                    background-color: rgba(255,255,255,0.04);
                }
                .channel-item:hover {
                    background-color: rgba(255,255,255,0.04);
                    color: #dcddde !important;
                }
                .channel-item.active {
                    background-color: rgba(79, 84, 92, 0.48) !important;
                    color: white !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #202225;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default ChannelSidebar;
