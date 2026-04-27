import React from 'react';
import { X, Users, Info, Calendar, ShieldCheck, Globe } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import './PortalInfoModal.css';

const PortalInfoModal = ({ portal, onClose, isMobile }) => {
    if (!portal) return null;

    const formattedDate = new Date(portal.createdAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const content = (
        <div className="portal-info-container">
            <div className="portal-info-banner">
                <img 
                    src={portal.coverImage ? getImageUrl(portal.coverImage) : portal.banner ? getImageUrl(portal.banner) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
                    alt={portal.name} 
                />
                <button className="portal-info-close" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="portal-info-content">
                <div className="portal-info-header">
                    <h1>{portal.name}</h1>
                    <p className="portal-info-tagline">{portal.description || 'Bu portal için bir açıklama bulunmuyor.'}</p>
                </div>

                <div className="portal-info-stats-grid">
                    <div className="portal-info-stat-card">
                        <Users size={18} className="stat-icon" />
                        <div className="stat-data">
                            <span className="stat-value">{portal.membersCount || 0}</span>
                            <span className="stat-label">Üye</span>
                        </div>
                    </div>
                    <div className="portal-info-stat-card">
                        <Globe size={18} className="stat-icon" />
                        <div className="stat-data">
                            <span className="stat-value">Kamu</span>
                            <span className="stat-label">Görünürlük</span>
                        </div>
                    </div>
                </div>

                <div className="portal-info-details">
                    <div className="detail-item">
                        <Calendar size={18} />
                        <span>Oluşturulma: <strong>{formattedDate}</strong></span>
                    </div>
                    <div className="detail-item">
                        <ShieldCheck size={18} />
                        <span>Doğrulanmış Portal</span>
                    </div>
                    <div className="detail-item">
                        <Info size={18} />
                        <span>Kategori: <strong>{portal.category || 'Genel'}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <div className="bottom-sheet-overlay" onClick={onClose}>
                <div className="bottom-sheet-content" onClick={e => e.stopPropagation()}>
                    <div className="bottom-sheet-handle" />
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content portal-info-modal" onClick={e => e.stopPropagation()}>
                {content}
            </div>
        </div>
    );
};

export default PortalInfoModal;
