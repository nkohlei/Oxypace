import { createPortal } from 'react-dom';
import { getImageUrl } from '../utils/imageUtils';
import { X, Search, ArrowLeft, Hash, Image } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import './QuotePortalModal.css';

const QuotePortalModal = ({ portals, onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPortal, setSelectedPortal] = useState(null);
    const [channels, setChannels] = useState([]);
    const [channelsLoading, setChannelsLoading] = useState(false);

    const handlePortalClick = async (portal) => {
        setSelectedPortal(portal);
        setChannelsLoading(true);
        try {
            const res = await axios.get(`/api/portals/${portal._id}`);
            // Filter: Only text and image channels are post-able (sharing quote posts is a post)
            const postableChannels = (res.data.channels || []).filter(
                c => c.type === 'text' || c.type === 'image' || !c.type
            );
            setChannels(postableChannels);
        } catch (error) {
            console.error('Failed to fetch portal channels:', error);
            setChannels([]);
        } finally {
            setChannelsLoading(false);
        }
    };

    const handleBackClick = () => {
        setSelectedPortal(null);
        setChannels([]);
    };

    const filteredPortals = (portals || []).filter(portal => {
        if (!portal || !portal.name) return false;
        return portal.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return createPortal(
        <div className="quote-modal-overlay" onClick={onClose}>
            <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quote-modal-header">
                    {selectedPortal ? (
                        <button onClick={handleBackClick} className="close-btn">
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <button onClick={onClose} className="close-btn">
                            <X size={24} />
                        </button>
                    )}
                    <h3>{selectedPortal ? 'Paylaşılacak Kanalı Seç' : 'Paylaşılacak Portalı Seç'}</h3>
                    <div style={{ width: 32 }}></div>
                </div>

                {!selectedPortal ? (
                    <>
                        <div className="quote-modal-search">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Portal ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="quote-modal-list">
                            {filteredPortals.length > 0 ? (
                                filteredPortals.map((portal) => (
                                    <div
                                        key={portal._id}
                                        className="portal-select-item"
                                        onClick={() => handlePortalClick(portal)}
                                    >
                                        <img
                                            src={getImageUrl(portal.avatar, 'thumbnail')}
                                            alt={portal.name}
                                            className="portal-select-avatar"
                                            onError={(e) => {
                                                const originalUrl = getImageUrl(portal.avatar, 'original');
                                                if (e.target.src !== originalUrl) {
                                                    e.target.src = originalUrl;
                                                }
                                            }}
                                        />
                                        <span className="portal-select-name">{portal.name}</span>
                                        {portal.privacy === 'private' && <span className="privacy-badge">Gizli</span>}
                                        {portal.privacy === 'restricted' && <span className="privacy-badge">Kısıtlı</span>}
                                    </div>
                                ))
                            ) : (
                                <div className="no-portals">Portal bulunamadı.</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="quote-modal-list">
                        {channelsLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <div className="spinner-small" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary-color)', borderRadius: '50%', width: 24, height: 24, animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : channels.length > 0 ? (
                            channels.map((channel) => (
                                <div
                                    key={channel._id}
                                    className="channel-select-item"
                                    onClick={() => onSelect(selectedPortal._id, channel._id)}
                                >
                                    <div className="channel-select-icon">
                                        {channel.type === 'image' ? <Image size={18} /> : <Hash size={18} />}
                                    </div>
                                    <span className="channel-select-name">{channel.name}</span>
                                    {channel.type && <span className="channel-type-badge">{channel.type === 'image' ? 'Görsel' : 'Metin'}</span>}
                                </div>
                            ))
                        ) : (
                            <div className="no-portals">Paylaşım yapılabilen kanal bulunamadı.</div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default QuotePortalModal;
