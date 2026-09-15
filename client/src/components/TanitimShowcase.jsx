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
    Terminal,
    Hash,
    MessageSquare,
    Smartphone,
    PictureInPicture,
    Sliders,
    Compass,
    AtSign,
    Pin,
    FileText,
    Mic,
    ShieldCheck,
    Sidebar,
    LayoutGrid,
    Settings,
    ChevronRight,
    Sparkle
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
                        Özgür, sansürsüz, yüksek performanslı ve gizlilik odaklı yeni nesil topluluk ekosistemi.
                        Arayüz haritasını ve platformun tüm gelişmiş yeteneklerini aşağıdaki yönergelerden inceleyin.
                    </p>
                </div>

                {/* ARAYÜZ KONFİGÜRASYONU & MENÜ HARİTASI */}
                <div className="tanitim-sub-section">
                    <div className="sub-section-header">
                        <span className="sub-section-tag">// NAVİGASYON VE MENÜ YERLEŞİMİ</span>
                        <h2 className="sub-section-title">Sayfa Yapısı & Arayüz Konumlandırması</h2>
                    </div>

                    <div className="tanitim-nav-map-grid">
                        <div className="nav-map-card">
                            <div className="nav-map-header">
                                <Sidebar size={16} />
                                <span className="nav-map-code">[ SOL NAVİGASYON BARI ]</span>
                            </div>
                            <h3 className="nav-map-title">Ana Gezinme Çubuğu</h3>
                            <ul className="nav-map-list">
                                <li>
                                    <strong>Doğrudan Mesajlar (DM):</strong> Birebir şifreli özel yazışmalar ve anlık bildirim kutusu.
                                </li>
                                <li>
                                    <strong>Portallar Listesi:</strong> Üye olduğunuz veya yönettiğiniz tüm portalların dikey simgeleri.
                                </li>
                                <li>
                                    <strong>Keşfet Pusulası:</strong> Yeni toplulukları, popüler portalları ve kişileri arama alanı.
                                </li>
                                <li>
                                    <strong>Portal Oluştur (+):</strong> Saniyeler içinde kendi özgür topluluğunuzu kurma aracı.
                                </li>
                                <li>
                                    <strong>Kimlik & Hızlı Ayar:</strong> En altta mikrofon, kulaklık ve profil hızlı kontrolleri.
                                </li>
                            </ul>
                        </div>

                        <div className="nav-map-card">
                            <div className="nav-map-header">
                                <Layers size={16} />
                                <span className="nav-map-code">[ PORTAL İÇİ MENÜ ]</span>
                            </div>
                            <h3 className="nav-map-title">Kanal Hiyerarşisi</h3>
                            <ul className="nav-map-list">
                                <li>
                                    <strong>Portal Kimliği:</strong> Özel afiş, doğrulanmış rozet ve çevrimiçi üye göstergeleri.
                                </li>
                                <li>
                                    <strong>Metin Kanalları (#):</strong> Tematik konulara göre ayrılmış gönderi ve tartışma akışları.
                                </li>
                                <li>
                                    <strong>Ses Kanalları (🎙️):</strong> Tek dokunuşla girilebilen, gecikmesiz canlı ses odaları.
                                </li>
                                <li>
                                    <strong>Sahne Kanalları (🎤):</strong> Seminer, podcast ve etkinlikler için konuşmacı odaları.
                                </li>
                                <li>
                                    <strong>Kanal Yönetimi:</strong> Yöneticiler için yeni kanallar açma ve gizlilik kilidi.
                                </li>
                            </ul>
                        </div>

                        <div className="nav-map-card">
                            <div className="nav-map-header">
                                <Sliders size={16} />
                                <span className="nav-map-code">[ ÜST DENETİM & AKIŞ ]</span>
                            </div>
                            <h3 className="nav-map-title">İçerik & Üye Denetimi</h3>
                            <ul className="nav-map-list">
                                <li>
                                    <strong>Kanal Üst Başlığı:</strong> Aktif kanal adı, açıklaması ve hızlı üye paneli butonu.
                                </li>
                                <li>
                                    <strong>Üye Listesi Paneli:</strong> Sağ tarafta çevrimiçi yöneticiler ve aktif üyeler.
                                </li>
                                <li>
                                    <strong>Görsel Akış Alanı:</strong> 4K videolar, çoklu galeriler ve doküman önizlemeleri.
                                </li>
                                <li>
                                    <strong>Bildirim Zil İkonu:</strong> Kanal ve portal bazlı bildirim filtreleme ayarları.
                                </li>
                                <li>
                                    <strong>Portal Ayarları:</strong> Portal sahibi ve yöneticileri için tam yönetim konsolu.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 6 ANA SİSTEM DİREĞİ (CORE CAPABILITIES) */}
                <div className="tanitim-sub-section">
                    <div className="sub-section-header">
                        <span className="sub-section-tag">// GELİŞMİŞ SİSTEM DİREKLERİ</span>
                        <h2 className="sub-section-title">Platform Mekanizmaları & Özellikler</h2>
                    </div>

                    <div className="tanitim-pillars-grid">
                        {/* 01: Mesaj Mekanizması */}
                        <div className="tanitim-pillar-item">
                            <div className="pillar-header">
                                <span className="pillar-index">01</span>
                                <div className="pillar-icon-box">
                                    <MessageSquare size={18} />
                                </div>
                            </div>
                            <h3 className="pillar-title">Gelişmiş Mesaj Mekanizması</h3>
                            <p className="pillar-text">
                                Markdown formatlama, tek tıkla alıntılı yanıtlama (quote reply), kullanıcıyı doğrudan haberdar eden @etiketleme sistemi ve akıllı bağlantı (link preview) ayrıştırma desteği.
                            </p>
                            <div className="pillar-features">
                                <span className="pillar-tag">Alıntılı Yanıt</span>
                                <span className="pillar-tag">@Bahsetmeler</span>
                                <span className="pillar-tag">Mesaj Sabitleme</span>
                            </div>
                        </div>

                        {/* 02: Canlı Ses ve Sahne Odaları */}
                        <div className="tanitim-pillar-item">
                            <div className="pillar-header">
                                <span className="pillar-index">02</span>
                                <div className="pillar-icon-box">
                                    <Radio size={18} />
                                </div>
                            </div>
                            <h3 className="pillar-title">Canlı Ses Odaları & Sahne Modu</h3>
                            <p className="pillar-text">
                                Ultra düşük gecikmeli WebRTC ses mimarisi. Herkesin serbestçe katılabildiği sohbet odaları ile seminer ve konferanslar için konuşmacı-dinleyici ayrımı ve el kaldırma desteği sunan Sahne kanalları.
                            </p>
                            <div className="pillar-features">
                                <span className="pillar-tag">Sıfır Gecikme</span>
                                <span className="pillar-tag">Sahne Hiyerarşisi</span>
                                <span className="pillar-tag">Arka Planda Ses</span>
                            </div>
                        </div>

                        {/* 03: Mobil Uygulama & PIP Oynatıcı */}
                        <div className="tanitim-pillar-item">
                            <div className="pillar-header">
                                <span className="pillar-index">03</span>
                                <div className="pillar-icon-box">
                                    <Smartphone size={18} />
                                </div>
                            </div>
                            <h3 className="pillar-title">Mobil Ekosistem & PIP Video</h3>
                            <p className="pillar-text">
                                Yerel Android APK ve tam uyumlu PWA deneyimi. Canlı FCM Push bildirimleri, mobil veri tasarrufu modu ve gezinirken köşede kesintisiz oynayan Kayan Resim İçinde Resim (PIP) video motoru.
                            </p>
                            <div className="pillar-features">
                                <span className="pillar-tag">Android APK / PWA</span>
                                <span className="pillar-tag">Canlı PIP Oynatıcı</span>
                                <span className="pillar-tag">FCM Push Bildirim</span>
                            </div>
                        </div>

                        {/* 04: Ultra-HD Medya & Doküman */}
                        <div className="tanitim-pillar-item">
                            <div className="pillar-header">
                                <span className="pillar-index">04</span>
                                <div className="pillar-icon-box">
                                    <Film size={18} />
                                </div>
                            </div>
                            <h3 className="pillar-title">Ultra-HD Medya & Transcoding</h3>
                            <p className="pillar-text">
                                İstemci içi WASM motoru ile 360p'den 4K'ya kadar otomatik optimize edilen video akışı. Tek gönderide 10 adede kadar yüksek kaliteli fotoğraf galerisi ve tek tıkla önizlenebilir PDF dokümanları.
                            </p>
                            <div className="pillar-features">
                                <span className="pillar-tag">4K Video Transcoding</span>
                                <span className="pillar-tag">10'lu Görsel Galerisi</span>
                                <span className="pillar-tag">PDF Doküman Desteği</span>
                            </div>
                        </div>

                        {/* 05: Özelleştirilebilir Sistemler */}
                        <div className="tanitim-pillar-item">
                            <div className="pillar-header">
                                <span className="pillar-index">05</span>
                                <div className="pillar-icon-box">
                                    <Sliders size={18} />
                                </div>
                            </div>
                            <h3 className="pillar-title">Özelleştirilebilir Sistemler & Temalar</h3>
                            <p className="pillar-text">
                                Saf OLED siyahı ve yüksek kontrastlı Aydınlık tema desteği. Kişisel profil afişi, biyografi ve avatar özelleştirmeleri. Portallar için özel roller, izin matrisleri ve gizlilik kalkanları.
                            </p>
                            <div className="pillar-features">
                                <span className="pillar-tag">OLED Siyah & Açık Tema</span>
                                <span className="pillar-tag">Rol & Yetki Matrisi</span>
                                <span className="pillar-tag">Özel Profil Afişi</span>
                            </div>
                        </div>

                        {/* 06: Güvenlik & Doğrulama */}
                        <div className="tanitim-pillar-item">
                            <div className="pillar-header">
                                <span className="pillar-index">06</span>
                                <div className="pillar-icon-box">
                                    <Shield size={18} />
                                </div>
                            </div>
                            <h3 className="pillar-title">Kripto-Güvenlik & Sıfır Takip</h3>
                            <p className="pillar-text">
                                Sıfır veri madenciliği ve ticari profil koruması. IP ve aktif cihaz oturum denetimi, güvenlik anahtarları ile hesap kurtarma ve doğrulanmış resmi topluluk rozetleri.
                            </p>
                            <div className="pillar-features">
                                <span className="pillar-tag">Sıfır Veri İzleme</span>
                                <span className="pillar-tag">Cihaz & Oturum Denetimi</span>
                                <span className="pillar-tag">Onay Rozetleri</span>
                            </div>
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
