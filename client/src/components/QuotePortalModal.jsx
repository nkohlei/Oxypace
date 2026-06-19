import { createPortal } from 'react-dom';
import { getImageUrl } from '../utils/imageUtils';
import { X, Search } from 'lucide-react';
import { useState } from 'react';
import './QuotePortalModal.css';

const QuotePortalModal = ({ portals, onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPortals = (portals || []).filter(portal => {
        if (!portal || !portal.name) return false;
        return portal.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return createPortal(
        <div className="quote-modal-overlay" onClick={onClose}>
            <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quote-modal-header">
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                    <h3>Paylaşılacak Portalı Seç</h3>
                    <div style={{ width: 32 }}></div>
                </div>

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
                                onClick={() => onSelect(portal._id)}
                            >
                                <img
                                    src={getImageUrl(portal.avatar, 'thumbnail')}
                                    alt={portal.name}
                                    className="portal-select-avatar"
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
            </div>
        </div>,
        document.body
    );
};

export default QuotePortalModal;
