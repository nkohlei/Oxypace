import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
import {
    Layers,
    Radio,
    Film,
    Shield,
    Users,
    Lock,
    Globe,
    Check,
    Clock,
    ArrowUpRight,
    Terminal,
    Hash,
    ChevronRight
} from 'lucide-react';
import './TanitimShowcase.css';

const TanitimShowcase = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [globalPortal, setGlobalPortal] = useState(null);
    const [topPortals, setTopPortals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchShowcaseData = async () => {
            try {
                const res = await axios.get('/api/portals/showcase');
                if (isMounted && res.data) {
                    setGlobalPortal(res.data.globalPortal || null);
                    setTopPortals(Array.isArray(res.data.topPortals) ? res.data.topPortals : []);
                }
            } catch (err) {
                console.error('Showcase fetch error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchShowcaseData();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleJoin = async (e, portal) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        if (portal.isMember) {
            navigate(`/portal/${portal._id}`);
            return;
        }

        if (portal.isRequested || joiningId === portal._id) return;

        setJoiningId(portal._id);

        try {
            const res = await axios.post(`/api/portals/${portal._id}/join`);
            const isReq = res.data?.status === 'requested';

            const updateItem = (item) => {
                if (!item || item._id !== portal._id) return item;
                return {
                    ...item,
                    isMember: !isReq,
                    isRequested: isReq,
                    memberCount: !isReq ? (item.memberCount || 0) + 1 : item.memberCount
                };
            };

            if (globalPortal?._id === portal._id) {
                setGlobalPortal(updateItem(globalPortal));
            }
            setTopPortals((prev) => prev.map(updateItem));

            if (!isReq && user && updateUser) {
                const currentJoined = user.joinedPortals || [];
                if (!currentJoined.some(p => (p._id || p).toString() === portal._id.toString())) {
                    updateUser({
                        joinedPortals: [...currentJoined, portal],
                        portals: [...(user.portals || []), portal]
                    });
                }
            }
        } catch (err) {
            console.error('Join error:', err);
            alert(err.response?.data?.message || 'İşlem gerçekleştirilemedi.');
        } finally {
            setJoiningId(null);
        }
    };

    const getPortalBanner = (portal) => {
        if (portal?.banner) return `url(${getImageUrl(portal.banner)}) center/cover no-repeat`;
        return '#141414';
    };

    return (
        <div className="tanitim-showcase-wrapper">
            {/* 1. ARCHITECTURAL GUIDE SHOWCASE (Tek Detaylı Tanıtım Kartı) */}
            <section className="tanitim-guide-card">
                <div className="tanitim-guide-header">
                    <div className="tanitim-guide-tag">
                        <Terminal size={13} />
                        <span>SİSTEM DİREKTİFİ // RESMİ PLATFORM REHBERİ</span>
                    </div>
                    <h1 className="tanitim-guide-title">
                        Oxypace İletişim Protokolü & Kullanım Mimarisi
                    </h1>
                    <p className="tanitim-guide-lead">
                        Özgür, sansürsüz ve yüksek performanslı yeni nesil topluluk ekosistemi.
                        Aşağıdaki yönergeleri takip ederek platform kabiliyetlerini keşfedin.
                    </p>
                </div>

                <div className="tanitim-pillars-grid">
                    {/* Pillar 01 */}
                    <div className="tanitim-pillar-item">
                        <div className="pillar-header">
                            <span className="pillar-index">01</span>
                            <div className="pillar-icon-box">
                                <Layers size={18} />
                            </div>
                        </div>
                        <h2 className="pillar-title">Topluluk & Portal Mimarisi</h2>
                        <p className="pillar-text">
                            Oxypace üzerinde her bağımsız alan bir "Portal"dır. Topluluklarınızı
                            <strong> Herkese Açık</strong>, <strong>Gizli</strong> veya <strong>Kısıtlı Erişim</strong> protokolleriyle
                            oluşturup tam izolasyon sağlayabilirsiniz.
                        </p>
                        <div className="pillar-meta">
                            <Hash size={13} />
                            <span>Metin Akışları & Kanallar</span>
                        </div>
                    </div>

                    {/* Pillar 02 */}
                    <div className="tanitim-pillar-item">
                        <div className="pillar-header">
                            <span className="pillar-index">02</span>
                            <div className="pillar-icon-box">
                                <Radio size={18} />
                            </div>
                        </div>
                        <h2 className="pillar-title">Düşük Gecikmeli Ses & Sahne</h2>
                        <p className="pillar-text">
                            WebRTC tabanlı, kristal netliğinde ses iletişimi. Serbest konuşma
                            kanallarının yanı sıra seminer ve etkinlikler için geliştirilmiş
                            konuşmacı-dinleyici mimarili Sahne Konferans odaları.
                        </p>
                        <div className="pillar-meta">
                            <Radio size={13} />
                            <span>Ultra Düşük Gecikme & Konferans</span>
                        </div>
                    </div>

                    {/* Pillar 03 */}
                    <div className="tanitim-pillar-item">
                        <div className="pillar-header">
                            <span className="pillar-index">03</span>
                            <div className="pillar-icon-box">
                                <Film size={18} />
                            </div>
                        </div>
                        <h2 className="pillar-title">Ultra-HD Medya & Doküman</h2>
                        <p className="pillar-text">
                            360p'den 4K'ya kadar otomatik video kodlama ve hafif oynatıcı altyapısı.
                            Gönderi başına 10 adede kadar yüksek kaliteli görsel desteği ve
                            doğrudan görüntülenebilir PDF doküman paylaşımı.
                        </p>
                        <div className="pillar-meta">
                            <Film size={13} />
                            <span>4K Video & PDF Desteği</span>
                        </div>
                    </div>

                    {/* Pillar 04 */}
                    <div className="tanitim-pillar-item">
                        <div className="pillar-header">
                            <span className="pillar-index">04</span>
                            <div className="pillar-icon-box">
                                <Shield size={18} />
                            </div>
                        </div>
                        <h2 className="pillar-title">Veri Gizliliği & Güvenlik</h2>
                        <p className="pillar-text">
                            Kişisel veriler asla ticari hedefleme veya profilleme amacıyla işlenmez.
                            Gelişmiş oturum ve IP denetimi, kurtarma anahtarları ve doğrulanmış
                            topluluk rozetleri ile güvenli iletişim ağı.
                        </p>
                        <div className="pillar-meta">
                            <Shield size={13} />
                            <span>Sıfır İzleme & Doğrulama</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. EN POPÜLER PORTAL: OXYPACE GLOBAL HERO KARTI */}
            {globalPortal && (
                <section className="tanitim-section">
                    <div className="tanitim-section-header">
                        <div className="section-label-row">
                            <span className="section-code">[ MERKEZ TOPLULUK // 01 ]</span>
                            <span className="section-badge">EN POPÜLER PORTAL</span>
                        </div>
                        <h2 className="tanitim-section-title">Oxypace Global</h2>
                        <p className="tanitim-section-subtitle">
                            Platformun en geniş üye kitlesine sahip resmi ana iletişim merkezi.
                        </p>
                    </div>

                    <div
                        className="oxypace-global-hero-card"
                        onClick={() => navigate(`/portal/${globalPortal._id}`)}
                    >
                        <div
                            className="hero-card-banner"
                            style={{ background: getPortalBanner(globalPortal) }}
                        >
                            <div className="hero-banner-overlay" />
                            <div className="hero-banner-badge">
                                <span>ANA TOPLULUK</span>
                            </div>
                        </div>

                        <div className="hero-card-body">
                            <div className="hero-header-row">
                                <div className="hero-avatar-box">
                                    {globalPortal.avatar ? (
                                        <img
                                            src={getImageUrl(globalPortal.avatar)}
                                            alt={globalPortal.name}
                                            className="hero-avatar-img"
                                        />
                                    ) : (
                                        <div className="hero-avatar-fallback">
                                            {globalPortal.name?.substring(0, 2)?.toUpperCase() || 'OG'}
                                        </div>
                                    )}
                                </div>

                                <div className="hero-identity-col">
                                    <div className="hero-name-row">
                                        <h3 className="hero-portal-name">{globalPortal.name}</h3>
                                        <Badge type={globalPortal.isVerified ? 'verified' : 'official'} size={18} />
                                        <span className="hero-privacy-tag">
                                            {globalPortal.privacy === 'private' ? (
                                                <><Lock size={11} /> GİZLİ</>
                                            ) : (
                                                <><Globe size={11} /> HERKESE AÇIK</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="hero-meta-row">
                                        <div className="hero-member-stat">
                                            <Users size={14} />
                                            <span>{(globalPortal.memberCount || 0).toLocaleString('tr-TR')} Üye</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hero-action-col">
                                    <button
                                        type="button"
                                        className={`tanitim-sharp-btn hero-btn ${
                                            globalPortal.isMember
                                                ? 'btn-joined'
                                                : globalPortal.isRequested
                                                ? 'btn-requested'
                                                : 'btn-action'
                                        }`}
                                        onClick={(e) => handleJoin(e, globalPortal)}
                                        disabled={joiningId === globalPortal._id || globalPortal.isRequested}
                                    >
                                        {joiningId === globalPortal._id ? (
                                            'İŞLENİYOR...'
                                        ) : globalPortal.isMember ? (
                                            <>
                                                <Check size={14} />
                                                ÜYESİNİZ
                                            </>
                                        ) : globalPortal.isRequested ? (
                                            <>
                                                <Clock size={14} />
                                                İSTEK GÖNDERİLDİ
                                            </>
                                        ) : globalPortal.privacy === 'private' ? (
                                            'ÜYELİK İSTEĞİ GÖNDER'
                                        ) : (
                                            'PORTALA KATIL'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p className="hero-description">
                                {globalPortal.description || 'Oxypace platformunun ana buluşma noktası. Güncel duyurular, teknik tartışmalar ve küresel topluluk etkileşimi.'}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* 3. POPÜLER VE PAYLAŞIMLARI ÇOK OLAN PORTALLAR (YAN YANA 3 KART) */}
            {topPortals.length > 0 && (
                <section className="tanitim-section">
                    <div className="tanitim-section-header">
                        <div className="section-label-row">
                            <span className="section-code">[ AKTİF TOPLULUKLAR // 02 ]</span>
                            <span className="section-badge">ÖNE ÇIKAN PORTALLAR</span>
                        </div>
                        <h2 className="tanitim-section-title">Popüler Topluluklar</h2>
                        <p className="tanitim-section-subtitle">
                            En çok paylaşıma ve aktif etkileşime sahip seçkin portallar.
                        </p>
                    </div>

                    <div className="tanitim-portals-row">
                        {topPortals.map((p) => (
                            <div
                                key={p._id}
                                className="tanitim-classic-card"
                                onClick={() => navigate(`/portal/${p._id}`)}
                            >
                                {/* Banner */}
                                <div
                                    className="classic-card-banner"
                                    style={{ background: getPortalBanner(p) }}
                                >
                                    <div className="classic-banner-overlay" />
                                </div>

                                {/* Avatar wrapper */}
                                <div className="classic-card-icon-wrapper">
                                    {p.avatar ? (
                                        <img
                                            src={getImageUrl(p.avatar)}
                                            alt={p.name}
                                            className="classic-card-icon-img"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="classic-card-icon-placeholder">
                                            {p.name?.substring(0, 2)?.toUpperCase() || 'P'}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="classic-card-body">
                                    <div className="classic-card-title-row">
                                        <h4 className="classic-card-title">{p.name}</h4>
                                        <Badge type={p.isVerified ? 'verified' : p.badges?.[0]} size={16} />
                                    </div>

                                    <p className="classic-card-desc">
                                        {p.description || 'Bu topluluk hakkında henüz bir açıklama girilmemiş.'}
                                    </p>

                                    <div className="classic-card-footer">
                                        <div className="classic-member-count">
                                            <Users size={12} />
                                            <span>{p.memberCount || 0} Üye</span>
                                        </div>

                                        <button
                                            type="button"
                                            className={`tanitim-sharp-btn small-btn ${
                                                p.isMember
                                                    ? 'btn-joined'
                                                    : p.isRequested
                                                    ? 'btn-requested'
                                                    : 'btn-action'
                                            }`}
                                            onClick={(e) => handleJoin(e, p)}
                                            disabled={joiningId === p._id || p.isRequested}
                                        >
                                            {joiningId === p._id ? (
                                                '...'
                                            ) : p.isMember ? (
                                                'ÜYESİNİZ'
                                            ) : p.isRequested ? (
                                                'İSTEK'
                                            ) : p.privacy === 'private' ? (
                                                'İSTEK AT'
                                            ) : (
                                                'KATIL'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default TanitimShowcase;
