import React, { useState, useRef } from 'react';
import { X, Users, Info, Calendar, ShieldCheck, Globe } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
import './PortalInfoModal.css';

const PortalInfoModal = ({ portal, onClose, isMobile }) => {
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);
    const touchCurrentY = useRef(0);

    if (!portal) return null;

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchCurrentY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        touchCurrentY.current = currentY;
        const diffY = currentY - touchStartY.current;
        if (diffY > 0) {
            setDragOffset(diffY);
        } else {
            setDragOffset(0);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const diffY = touchCurrentY.current - touchStartY.current;
        if (diffY > 100) {
            onClose();
        }
        setDragOffset(0);
    };

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
                <div className="portal-info-avatar-wrapper">
                    <img src={getImageUrl(portal.avatar)} alt={portal.name} className="portal-info-avatar-img" />
                </div>
                <button className="portal-info-close" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="portal-info-content">
                <div className="portal-info-header">
                    <h1>
                        {portal.name}
                        <Badge type={portal.isVerified ? 'verified' : portal.badges?.[0]} size={20} />
                    </h1>
                    <p className="portal-info-tagline">{portal.description || 'Bu portal için bir açıklama bulunmuyor.'}</p>
                </div>

                <div className="portal-info-stats-grid">
                    <div className="portal-info-stat-card">
                        <Users size={18} className="stat-icon" />
                        <div className="stat-data">
                            <span className="stat-value">{portal.membersCount || portal.members?.length || 0}</span>
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
                <div 
                    className="bottom-sheet-content" 
                    onClick={e => e.stopPropagation()}
                    style={{
                        transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <div 
                        className="bottom-sheet-handle-wrapper"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="bottom-sheet-handle" />
                    </div>
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
