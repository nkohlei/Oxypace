import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { Users, Globe, Lock, Check, Clock, Compass, ArrowRight, ShieldCheck } from 'lucide-react';
import './PromotedPortalCard.css';

const PromotedPortalCard = ({ portal }) => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    // +18 NSFW safety guarantee: never render NSFW portals
    if (!portal || portal.isNSFW) {
        return null;
    }

    const [isMember, setIsMember] = useState(Boolean(portal.isMember));
    const [isRequested, setIsRequested] = useState(Boolean(portal.isRequested));
    const [memberCount, setMemberCount] = useState(Number(portal.memberCount) || 0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleJoin = async (e) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        if (isMember) {
            navigate(`/portal/${portal._id}`);
            return;
        }

        if (isRequested || loading) return;

        setLoading(true);
        setErrorMsg('');

        try {
            const res = await axios.post(`/api/portals/${portal._id}/join`);
            if (res.data?.status === 'requested') {
                setIsRequested(true);
            } else {
                setIsMember(true);
                setMemberCount((prev) => prev + 1);
                // Optimistically update joinedPortals in user context
                if (user && updateUser) {
                    const currentJoined = user.joinedPortals || [];
                    if (!currentJoined.some(p => (p._id || p).toString() === portal._id.toString())) {
                        updateUser({
                            joinedPortals: [...currentJoined, portal],
                            portals: [...(user.portals || []), portal]
                        });
                    }
                }
            }
        } catch (err) {
            const message = err.response?.data?.message || 'İşlem başarısız oldu.';
            setErrorMsg(message);
            setTimeout(() => setErrorMsg(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = () => {
        navigate(`/portal/${portal._id}`);
    };

    const isPrivate = portal.privacy === 'private' || portal.privacy === 'restricted';
    const bannerUrl = portal.banner ? getImageUrl(portal.banner) : null;
    const avatarUrl = portal.lowResAvatar || portal.avatar ? getImageUrl(portal.lowResAvatar || portal.avatar) : null;

    return (
        <div className="promoted-portal-card" onClick={handleCardClick} role="button" tabIndex={0}>
            {/* Top Showcase Badge */}
            <div className="promoted-portal-badge-bar">
                <span className="promoted-badge-tag">
                    <Compass size={13} className="promoted-badge-icon" />
                    Öne Çıkan Portal
                </span>
                <span className="promoted-privacy-pill">
                    {isPrivate ? (
                        <>
                            <Lock size={12} /> Gizli Topluluk
                        </>
                    ) : (
                        <>
                            <Globe size={12} /> Herkese Açık
                        </>
                    )}
                </span>
            </div>

            {/* Banner with Ambient Gradient Fallback */}
            <div
                className="promoted-portal-banner"
                style={{
                    backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                    background: !bannerUrl
                        ? `linear-gradient(135deg, ${portal.themeColor || '#0284c7'}33 0%, var(--bg-card) 100%)`
                        : undefined,
                }}
            >
                <div className="promoted-banner-overlay" />
            </div>

            {/* Card Body */}
            <div className="promoted-portal-body">
                {/* Avatar & Header Info */}
                <div className="promoted-portal-header">
                    <div className="promoted-avatar-wrapper">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={portal.name}
                                className="promoted-avatar-img"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div className="promoted-avatar-fallback">
                                {portal.name ? portal.name.charAt(0).toUpperCase() : 'O'}
                            </div>
                        )}
                        {portal.isVerified && (
                            <div className="promoted-verified-badge" title="Doğrulanmış Portal">
                                <ShieldCheck size={14} />
                            </div>
                        )}
                    </div>

                    <div className="promoted-title-col">
                        <div className="promoted-title-row">
                            <h4 className="promoted-portal-name">{portal.name}</h4>
                        </div>
                        <div className="promoted-members-meta">
                            <Users size={13} className="meta-icon" />
                            <span>{memberCount.toLocaleString('tr-TR')} üye</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {portal.description && (
                    <p className="promoted-portal-description">
                        {portal.description}
                    </p>
                )}

                {/* Error Banner */}
                {errorMsg && (
                    <div className="promoted-error-alert">
                        {errorMsg}
                    </div>
                )}

                {/* Action Footer */}
                <div className="promoted-portal-footer">
                    <button
                        type="button"
                        className="promoted-view-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/portal/${portal._id}`);
                        }}
                    >
                        Portalı İncele
                        <ArrowRight size={14} />
                    </button>

                    <button
                        type="button"
                        className={`promoted-join-btn ${isMember ? 'joined' : isRequested ? 'requested' : isPrivate ? 'request' : 'join'}`}
                        onClick={handleJoin}
                        disabled={loading || isRequested}
                    >
                        {loading ? (
                            <span className="promoted-btn-spinner" />
                        ) : isMember ? (
                            <>
                                <Check size={15} />
                                Katıldın
                            </>
                        ) : isRequested ? (
                            <>
                                <Clock size={15} />
                                İstek Gönderildi
                            </>
                        ) : isPrivate ? (
                            'Üyelik İsteği Gönder'
                        ) : (
                            'Tek Tıkla Katıl'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromotedPortalCard;
