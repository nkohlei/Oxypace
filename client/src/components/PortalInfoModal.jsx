import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
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

    const isPrivate = portal.privacy === 'private' || portal.isPrivate === true;
    const isRestricted = portal.privacy === 'restricted';

    const getPrivacyInfo = () => {
        if (isPrivate) {
            return {
                label: 'Gizli',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                )
            };
        }
        if (isRestricted) {
            return {
                label: 'Kısıtlı',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                )
            };
        }
        return {
            label: 'Kamu',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20" />
                    <path d="M2 12h20" />
                </svg>
            )
        };
    };

    const privacyInfo = getPrivacyInfo();

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
                <button className="portal-info-close" onClick={onClose} aria-label="Kapat">
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
                        <div className="portal-stat-icon-box">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="stat-data">
                            <span className="stat-value">{portal.membersCount || portal.members?.length || 0}</span>
                            <span className="stat-label">Üye</span>
                        </div>
                    </div>
                    <div className="portal-info-stat-card">
                        <div className="portal-stat-icon-box">
                            {privacyInfo.icon}
                        </div>
                        <div className="stat-data">
                            <span className="stat-value">{privacyInfo.label}</span>
                            <span className="stat-label">Görünürlük</span>
                        </div>
                    </div>
                </div>

                <div className="portal-info-details">
                    <div className="detail-item">
                        <div className="detail-icon-pill">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <span>Oluşturulma: <strong>{formattedDate}</strong></span>
                    </div>
                    <div className="detail-item">
                        <div className="detail-icon-pill">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <polyline points="9 12 11 14 15 10" />
                            </svg>
                        </div>
                        <span>Durum: <strong>{portal.isVerified || (portal.badges && portal.badges.length > 0) ? 'Doğrulanmış Portal' : 'Standart Portal'}</strong></span>
                    </div>
                    <div className="detail-item">
                        <div className="detail-icon-pill">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                            </svg>
                        </div>
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
        <div className="portal-info-modal-overlay" onClick={onClose}>
            <div className="portal-info-modal-card" onClick={e => e.stopPropagation()}>
                {content}
            </div>
        </div>
    );
};

export default PortalInfoModal;
