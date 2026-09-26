import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowUpRight, LogOut, UserPlus, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
import './PortalInfoModal.css';

const PortalInfoModal = ({ portal, onClose, isMobile, onLeave }) => {
    const [portalData, setPortalData] = useState(portal || {});
    const [leaving, setLeaving] = useState(false);
    const [joining, setJoining] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);
    const touchCurrentY = useRef(0);

    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    useEffect(() => {
        if (portal) {
            setPortalData(portal);
        }
        let isMounted = true;
        if (portal?._id) {
            axios.get(`/api/portals/${portal._id}`)
                .then((res) => {
                    if (isMounted && res.data) {
                        setPortalData((prev) => ({ ...prev, ...res.data }));
                    }
                })
                .catch(() => {});
        }
        return () => {
            isMounted = false;
        };
    }, [portal]);

    if (!portal && !portalData?._id) return null;

    const currentPortalId = (portalData?._id || portal?._id)?.toString();
    const currentUserId = user?._id?.toString();

    const isOwner = Boolean(
        currentUserId &&
        portalData?.owner &&
        (portalData.owner?._id || portalData.owner)?.toString() === currentUserId
    );

    const isCurrentUserMember = Boolean(
        currentUserId && (
            isOwner ||
            portalData?.isMember ||
            (Array.isArray(user?.joinedPortals) &&
                user.joinedPortals.some((p) => (p?._id || p)?.toString() === currentPortalId)) ||
            (Array.isArray(portalData?.members) &&
                portalData.members.some((m) => (m?._id || m)?.toString() === currentUserId))
        )
    );

    const handleLeave = async () => {
        if (!window.confirm(`"${portalData.name || 'Portal'}" portaldan ayrılmak istediğinize emin misiniz?`)) {
            return;
        }
        setLeaving(true);
        try {
            await axios.post(`/api/portals/${currentPortalId}/leave`);
            if (user && updateUser) {
                const currentJoined = Array.isArray(user.joinedPortals) ? user.joinedPortals : [];
                updateUser({
                    ...user,
                    joinedPortals: currentJoined.filter((p) => (p?._id || p)?.toString() !== currentPortalId),
                });
            }
            if (onLeave) {
                onLeave(currentPortalId);
            }
            onClose();
            if (window.location.pathname.includes(`/portal/${currentPortalId}`)) {
                navigate('/');
            }
        } catch (err) {
            console.error('Portaldan ayrılma hatası:', err);
            alert(err.response?.data?.message || 'Portaldan ayrılırken bir hata oluştu');
        } finally {
            setLeaving(false);
        }
    };

    const handleJoin = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setJoining(true);
        try {
            const res = await axios.post(`/api/portals/${currentPortalId}/join`);
            if (res.data.status === 'joined') {
                if (user && updateUser) {
                    const currentJoined = Array.isArray(user.joinedPortals) ? user.joinedPortals : [];
                    updateUser({
                        ...user,
                        joinedPortals: [...currentJoined, portalData],
                    });
                }
                setPortalData((prev) => ({
                    ...prev,
                    isMember: true,
                    membersCount: (prev.membersCount || prev.members?.length || 0) + 1,
                }));
            } else if (res.data.status === 'requested') {
                setPortalData((prev) => ({ ...prev, isRequested: true }));
                alert('Üyelik isteğiniz iletildi.');
            }
        } catch (err) {
            console.error('Katılma hatası:', err);
            alert(err.response?.data?.message || 'Katılma işlemi başarısız oldu.');
        } finally {
            setJoining(false);
        }
    };

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

    const formattedDate = portalData.createdAt
        ? new Date(portalData.createdAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'Belirtilmedi';

    const isPrivate = portalData.privacy === 'private' || portalData.isPrivate === true;
    const isRestricted = portalData.privacy === 'restricted';

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
                    src={portalData.coverImage ? getImageUrl(portalData.coverImage) : portalData.banner ? getImageUrl(portalData.banner) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
                    alt={portalData.name} 
                />
                <div className="portal-info-avatar-wrapper">
                    <img src={getImageUrl(portalData.avatar)} alt={portalData.name} className="portal-info-avatar-img" />
                </div>
                <div className="portal-info-top-actions">
                    <button 
                        type="button"
                        className="portal-info-go-btn"
                        onClick={() => {
                            onClose();
                            navigate(`/portal/${currentPortalId}`);
                        }}
                        title="Portala Git"
                    >
                        <span>Git</span>
                        <ArrowUpRight size={14} className="portal-go-icon" />
                    </button>
                    <button className="portal-info-close" onClick={onClose} aria-label="Kapat">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="portal-info-content">
                <div className="portal-info-header">
                    <h1>
                        {portalData.name}
                        <Badge type={portalData.isVerified ? 'verified' : portalData.badges?.[0]} size={20} />
                    </h1>
                    <p className="portal-info-tagline">{portalData.description || 'Bu portal için bir açıklama bulunmuyor.'}</p>
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
                            <span className="stat-value">{portalData.membersCount || portalData.members?.length || 0}</span>
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
                        <span>Durum: <strong>{portalData.isVerified || (portalData.badges && portalData.badges.length > 0) ? 'Doğrulanmış Portal' : 'Standart Portal'}</strong></span>
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
                        <span>Kategori: <strong>{portalData.category || 'Genel'}</strong></span>
                    </div>
                </div>

                {/* Footer Action Area */}
                <div className="portal-info-footer-actions">
                    {isCurrentUserMember ? (
                        isOwner ? (
                            <div className="portal-owner-indicator">
                                <ShieldCheck size={16} />
                                <span>Bu portalın kurucususunuz</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="portal-info-leave-btn"
                                onClick={handleLeave}
                                disabled={leaving}
                                title="Portaldan Ayrıl"
                            >
                                <LogOut size={16} />
                                <span>{leaving ? 'Ayrılınıyor...' : 'Portaldan Ayrıl'}</span>
                            </button>
                        )
                    ) : portalData.isRequested ? (
                        <div className="portal-requested-indicator">
                            <span>Üyelik İsteği Gönderildi</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="portal-info-join-btn"
                            onClick={handleJoin}
                            disabled={joining}
                        >
                            <UserPlus size={16} />
                            <span>{portalData.privacy === 'private' ? 'Üyelik İsteği Gönder' : 'Portala Katıl'}</span>
                        </button>
                    )}
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
