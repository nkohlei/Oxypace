import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';
import { useSocket } from '../context/SocketContext';
import { getImageUrl } from '../utils/imageUtils';
import { Home, Pencil, Trash2, LayoutDashboard, KeyRound, Users, ShieldAlert, Award, FileBadge, Globe, AlertTriangle, Send, Settings, ShieldCheck, CheckCircle2, Menu, X, Bot, FileText, BookOpen, Plus, Check, Eye, Edit3, UserCheck, Calculator, Image, Smartphone, Monitor, History, Sparkles, RefreshCw, User, Search, Copy, Sliders, Sun, Moon, Layers, Zap, ArrowRight, Shield, Volume2, Video, Hash, Radio, Lock, Unlock, MessageSquare, Download, Pause, Play, Filter, Server, HardDrive, Terminal, Activity } from 'lucide-react';
import Badge from '../components/Badge';
import PortalBadges from '../components/PortalBadges';
import UserBadges from '../components/UserBadges';
import UserAvatar from '../components/UserAvatar';
import ImageCropper from '../components/ImageCropper';
import MobileDesignShowcase from '../components/MobileDesignShowcase';
import MobileVersionHistory from '../components/MobileVersionHistory';
import { uploadFile } from '../utils/uploadUtils';
import './AdminDashboard.css';

// Safe Admin Media rendering component to guarantee NO broken images or gifs
const AdminMedia = ({ src, alt = '', className = '', style = {}, isAvatar = false, fallbackText = 'Görsel Yok' }) => {
    const [failed, setFailed] = useState(false);
    
    useEffect(() => {
        setFailed(false);
    }, [src]);

    const defaultAvatarSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

    let cleanSrc = src;
    if (Array.isArray(cleanSrc)) {
        cleanSrc = cleanSrc.length > 0 ? cleanSrc[0] : '';
    }
    if (cleanSrc && typeof cleanSrc === 'object') {
        cleanSrc = cleanSrc.url || cleanSrc.src || cleanSrc.media || cleanSrc.path || cleanSrc.uri || '';
    }

    if (!cleanSrc || typeof cleanSrc !== 'string' || failed) {
        if (isAvatar) {
            return <img src={defaultAvatarSvg} alt="" className={className} style={{ objectFit: 'cover', ...style }} />;
        }
        return (
            <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161616', color: '#666666', border: '1px solid #282828', fontSize: '11px', fontWeight: 600, ...style }}>
                {fallbackText}
            </div>
        );
    }

    const resolvedUrl = (typeof cleanSrc === 'string' && (cleanSrc.startsWith('data:') || cleanSrc.startsWith('blob:'))) ? cleanSrc : getImageUrl(cleanSrc);

    if (!resolvedUrl) {
        if (isAvatar) {
            return <img src={defaultAvatarSvg} alt="" className={className} style={{ objectFit: 'cover', ...style }} />;
        }
        return (
            <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161616', color: '#666666', border: '1px solid #282828', fontSize: '11px', fontWeight: 600, ...style }}>
                {fallbackText}
            </div>
        );
    }

    return (
        <img
            src={resolvedUrl}
            alt={alt}
            className={className}
            style={style}
            onError={() => setFailed(true)}
            loading="lazy"
        />
    );
};

const getYouTubeEmbedUrl = (urlOrText) => {
    if (!urlOrText || typeof urlOrText !== 'string') return null;
    const match = urlOrText.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

// Format human-friendly byte size (e.g. 2.4 MB, 680 KB)
export const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    const num = Number(bytes);
    if (num <= 0) return null;
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
};

// Format duration in seconds (e.g. 14 dk 22 sn, 2 sa 10 dk)
export const formatDurationSec = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return null;
    const sec = Math.round(Number(seconds));
    if (sec <= 0) return '0 sn';
    if (sec < 60) return `${sec} sn`;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins < 60) return `${mins} dk ${remSec > 0 ? remSec + ' sn' : ''}`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours} sa ${remMins > 0 ? remMins + ' dk' : ''}`;
};

// Human-friendly Turkish reason translation
export const translateReason = (reason) => {
    if (!reason) return 'Bilinmiyor';
    const map = {
        'INVALID_PASSWORD': 'Hatalı şifre girişi',
        'USER_NOT_FOUND': 'Kullanıcı hesabı bulunamadı',
        'DELETED_ACCOUNT': 'Silinmiş hesap ile giriş denemesi',
        'UNVERIFIED_EMAIL': 'Doğrulanmamış e-posta adresi',
        'BANNED_USER': 'Yasaklı kullanıcı hesabı',
        'RATE_LIMIT_EXCEEDED': 'İstek limiti aşıldı (Rate limit)',
        'SWITCHED_PORTAL': 'Farklı bir portala geçiş yapıldı',
        'SWITCHED_CHANNEL': 'Farklı bir kanala geçiş yapıldı',
        'USER_LEFT_PORTAL': 'Kullanıcı portaldan ayrıldı',
        'USER_LEFT_CHANNEL': 'Kullanıcı kanaldan ayrıldı',
        'SOCKET_DISCONNECT': 'Ağ bağlantısı / Sekme kapatıldı'
    };
    return map[reason] || reason;
};

// Generates a descriptive, human-readable narrative and title for any activity log
export const getActionNarrative = (log) => {
    if (!log) return { title: 'Bilinmeyen İşlem', desc: 'Platform kaydı işlendi.' };
    const action = log.action || '';
    const details = log.details || {};
    const portal = log.portalName || log.portal?.name || details.portalName || (typeof details.portal === 'string' && !/^[a-f0-9]{24}$/i.test(details.portal) ? details.portal : '');
    const channel = log.channel || details.channelName || (typeof details.channel === 'string' && !/^[a-f0-9]{24}$/i.test(details.channel) ? details.channel : '');
    const where = portal ? `${portal}${channel ? ` › #${channel}` : ''}` : (channel ? `#${channel}` : '');

    switch (action) {
        case 'STREAM_TOGGLE': {
            const parts = [];
            if (details.isCameraOn !== undefined) {
                parts.push(details.isCameraOn ? '🎥 Kamera Açıldı' : '📷 Kamera Kapalı');
            }
            if (details.isScreenSharing !== undefined) {
                parts.push(details.isScreenSharing ? '🖥️ Ekran Paylaşımı Başlatıldı' : '🖥️ Ekran Kapalı');
            }
            if (details.isMuted !== undefined) {
                parts.push(details.isMuted ? '🔇 Mikrofon Susturuldu' : '🎙️ Mikrofon Açık');
            }
            return {
                title: 'Canlı Medya Yayını Durumu Değiştirildi',
                desc: `${where ? `[${where}] ` : ''}${parts.join(' • ') || details.summary || 'Medya akışı güncellendi'}`
            };
        }
        case 'STREAM_WATCH':
            return {
                title: 'Canlı Video / Film Yayını İzlendi',
                desc: `${where ? `[${where}] ` : ''}${details.title ? `"${details.title}" yayını izleniyor.` : 'Canlı yayın izleniyor.'}${details.url ? ` (${details.url})` : ''}`
            };
        case 'BOT_POST':
            return {
                title: 'Bot Otomatik Gönderi Paylaştı',
                desc: `${where ? `[${where}] ` : ''}"${details.title || details.snippet || details.content || 'İçerik yayınlandı'}"`
            };
        case 'POST_CREATE':
            return {
                title: 'Yeni Gönderi Paylaşıldı',
                desc: `${where ? `[${where}] ` : ''}"${details.content || details.snippet || details.title || 'İçerik paylaşıldı'}"`
            };
        case 'POST_DELETE':
            return {
                title: 'Gönderi Silindi',
                desc: `${where ? `[${where}] ` : ''}Silinen İçerik: "${details.content || details.snippet || details.title || '...'}"`
            };
        case 'POST_MEDIA_ATTACHED':
            return {
                title: 'Gönderiye Medya/Dosya Eklendi',
                desc: `${details.fileName ? `📁 ${details.fileName}` : ''}${details.fileSize ? ` (${formatFileSize(details.fileSize)})` : ''}${details.content ? ` • "${details.content.substring(0, 50)}"` : ''}`
            };
        case 'FILE_UPLOAD':
            return {
                title: 'Depolama Alanına Dosya Yüklendi',
                desc: `📁 ${details.fileName || 'Dosya'} (${formatFileSize(details.sizeBytes || details.fileSize)})${details.mimeType ? ` • Tür: ${details.mimeType}` : ''}`
            };
        case 'FILE_DELETE':
            return {
                title: 'Depolama Alanından Dosya Silindi',
                desc: `🗑️ ${details.fileName || details.key || 'Dosya silindi'}`
            };
        case 'ROOM_JOIN':
            return {
                title: 'Canlı Ses/Görüntü Odasına Katıldı',
                desc: `${where ? `${where} odasına giriş yapıldı.` : 'Canlı ses odasına katılım sağlandı.'}`
            };
        case 'ROOM_LEAVE':
            return {
                title: 'Canlı Ses/Görüntü Odasından Ayrıldı',
                desc: `${where ? `${where} odasından ayrıldı.` : 'Odadan ayrıldı.'}${details.durationSec !== undefined ? ` • Odada Kalınan Süre: ${formatDurationSec(details.durationSec)}` : ''}`
            };
        case 'WP_START':
            return {
                title: 'Watch Party Başlatıldı',
                desc: `${where ? `${where}: ` : ''}${details.title ? `"${details.title}" ` : ''}ortak video izleme oturumu başlatıldı.${details.url ? ` (${details.url})` : ''}`
            };
        case 'WP_PLAY':
            return {
                title: 'Watch Party: Video Oynatılıyor',
                desc: `${where ? `${where}: ` : ''}Medya yürütülmeye devam ediyor.`
            };
        case 'WP_PAUSE':
            return {
                title: 'Watch Party: Video Duraklatıldı',
                desc: `${where ? `${where}: ` : ''}Medya yürütmesi duraklatıldı.`
            };
        case 'WP_SEEK':
            return {
                title: 'Watch Party: Video Sarıldı',
                desc: `${where ? `${where}: ` : ''}Medya oynatma konumu değiştirildi.`
            };
        case 'ICE_CONNECTION_FAILED':
            return {
                title: 'WebRTC Bağlantı Hatası (ICE Restart)',
                desc: 'Kullanıcının canlı yayın/ses akışı kesildi, yeniden bağlanılıyor.'
            };
        case 'LOGIN_SUCCESS':
            return {
                title: 'Başarılı Oturum Açma',
                desc: `${details.method === 'google' ? 'Google ile ' : ''}${details.email || log.username || 'Kullanıcı'} sisteme giriş yaptı.${details.isNewDevice ? ' (Yeni Tanınmayan Cihaz)' : ''}`
            };
        case 'LOGIN_FAILED':
            return {
                title: 'Başarısız Giriş Denemesi',
                desc: `Sebep: ${translateReason(details.reason)}${details.securityAlert ? ` • 🚨 ${details.securityAlert}` : ''}`
            };
        case 'LOGOUT':
            return {
                title: 'Oturum Kapatıldı',
                desc: `${log.username || 'Kullanıcı'} platformdan çıkış yaptı.${details.durationSec ? ` • Platformda Kalış Süresi: ${formatDurationSec(details.durationSec)}` : ''}`
            };
        case 'PORTAL_VIEW':
            return {
                title: 'Portal Ziyaret Edildi',
                desc: `🏛️ ${portal || 'Portal'} topluluğuna giriş yapıldı ve içerikler görüntülendi.`
            };
        case 'PORTAL_LEAVE':
            return {
                title: 'Portaldan Ayrılındı',
                desc: `🚪 ${portal || 'Portal'} topluluğundan ayrıldı.${details.durationSec ? ` • Portalda Kalış Süresi: ${formatDurationSec(details.durationSec)}` : ''}`
            };
        case 'PORTAL_JOIN':
            return {
                title: 'Portala Katılım Sağlandı',
                desc: `${portal || 'Portal'} topluluğuna katıldı.${details.inviteCode ? ` (Davet Kodu: ${details.inviteCode})` : ''}`
            };
        case 'PORTAL_CREATE':
            return {
                title: 'Yeni Portal Kuruldu',
                desc: `🏛️ "${portal || details.portalName || 'Yeni Portal'}" oluşturuldu.`
            };
        case 'PORTAL_DELETE':
            return {
                title: 'Portal Kalıcı Olarak Silindi',
                desc: `🏛️ "${details.portalName || portal || 'Portal'}" silindi.`
            };
        case 'CHANNEL_VIEW':
            return {
                title: 'Kanal Ziyaret Edildi',
                desc: `📻 ${where ? `${where} kanalına` : 'Kanala'} geçildi.`
            };
        case 'CHANNEL_LEAVE':
            return {
                title: 'Kanaldan Ayrıldı',
                desc: `📻 ${where ? `${where} kanalından` : 'Kanaldan'} ayrıldı.${details.durationSec ? ` • Kanalda Kalış Süresi: ${formatDurationSec(details.durationSec)}` : ''}`
            };
        case 'CHANNEL_CREATE':
            return {
                title: 'Yeni Kanal Oluşturuldu',
                desc: `${portal ? `${portal} bünyesinde ` : ''}#${channel || details.channelName || 'kanal'} oluşturuldu.`
            };
        case 'CHANNEL_DELETE':
            return {
                title: 'Kanal Silindi',
                desc: `${portal ? `${portal} bünyesindeki ` : ''}#${channel || 'kanal'} silindi.`
            };
        case 'MESSAGE_EDIT':
            return {
                title: 'Mesaj Düzenlendi',
                desc: `Güncellenen içerik: "${details.newContent || details.content || '...'}"`
            };
        case 'MESSAGE_DELETE':
            return {
                title: 'Mesaj Silindi',
                desc: `Silinen mesaj: "${details.content || '...'}"`
            };
        case 'REPORT_CREATED':
            return {
                title: 'Yeni Güvenlik & İçerik Şikayeti',
                desc: `Bildirim Sebebi: ${details.reason || 'Kural İhlali'}`
            };
        case 'PASSWORD_RESET_SUCCESS':
            return {
                title: 'Şifre Sıfırlandı',
                desc: 'Hesap şifresi güvenlik bağlantısıyla başarıyla değiştirildi.'
            };
        case 'PROFILE_UPDATE':
            return {
                title: 'Profil Bilgileri Güncellendi',
                desc: details.changedFields && details.changedFields.length > 0
                    ? `Değişen Alanlar: ${details.changedFields.join(', ')}`
                    : 'Kullanıcı profil biyografisi, avatarı veya adı güncellendi.'
            };
        case 'HIGH_LATENCY':
            return {
                title: 'Yüksek İstek Gecikmesi (>500ms)',
                desc: `${details.method || ''} ${details.path || ''} (${details.durationMs}ms)`
            };
        case 'UNHANDLED_ERROR':
            return {
                title: 'Sunucu İç Hatası (500)',
                desc: `${details.message || 'Sistem düzeyinde istisna oluştu.'}`
            };
        default:
            return {
                title: action.replace(/_/g, ' '),
                desc: details.reason || details.title || details.snippet || (typeof details === 'object' ? JSON.stringify(details) : String(details || ''))
            };
    }
};

// Rich curated session themes for distinct coloring across sessions
export const SESSION_PALETTES = [
    { name: 'cyan', border: '#06b6d4', text: '#22d3ee', badgeBg: 'rgba(6, 182, 212, 0.16)', cardBg: 'rgba(6, 182, 212, 0.04)', glow: 'rgba(6, 182, 212, 0.3)' },
    { name: 'emerald', border: '#10b981', text: '#34d399', badgeBg: 'rgba(16, 185, 129, 0.16)', cardBg: 'rgba(16, 185, 129, 0.04)', glow: 'rgba(16, 185, 129, 0.3)' },
    { name: 'purple', border: '#a855f7', text: '#c084fc', badgeBg: 'rgba(168, 85, 247, 0.16)', cardBg: 'rgba(168, 85, 247, 0.04)', glow: 'rgba(168, 85, 247, 0.3)' },
    { name: 'amber', border: '#f59e0b', text: '#fbbf24', badgeBg: 'rgba(245, 158, 11, 0.16)', cardBg: 'rgba(245, 158, 11, 0.04)', glow: 'rgba(245, 158, 11, 0.3)' },
    { name: 'rose', border: '#f43f5e', text: '#fb7185', badgeBg: 'rgba(244, 63, 94, 0.16)', cardBg: 'rgba(244, 63, 94, 0.04)', glow: 'rgba(244, 63, 94, 0.3)' },
    { name: 'blue', border: '#3b82f6', text: '#60a5fa', badgeBg: 'rgba(59, 130, 246, 0.16)', cardBg: 'rgba(59, 130, 246, 0.04)', glow: 'rgba(59, 130, 246, 0.3)' },
    { name: 'teal', border: '#14b8a6', text: '#2dd4bf', badgeBg: 'rgba(20, 184, 166, 0.16)', cardBg: 'rgba(20, 184, 166, 0.04)', glow: 'rgba(20, 184, 166, 0.3)' },
    { name: 'fuchsia', border: '#d946ef', text: '#e879f9', badgeBg: 'rgba(217, 70, 239, 0.16)', cardBg: 'rgba(217, 70, 239, 0.04)', glow: 'rgba(217, 70, 239, 0.3)' }
];

// Categorizes logs into distinct user sessions and attaches matching color palettes
export const categorizeLogsBySession = (logs = []) => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) return [];

    // Chronological order (oldest first) to accurately partition sessions
    const sorted = [...logs].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    // Map each user to their session tracker: { sessionIndex, lastTime, wasLogout }
    const userSessionTrackers = new Map();
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes gap splits session

    const enrichedChronological = sorted.map((log) => {
        const uId = String(log.user?._id || log.user || log.username || 'system');
        const logTime = new Date(log.createdAt || 0).getTime();
        const action = log.action || '';

        let tracker = userSessionTrackers.get(uId);
        if (!tracker) {
            tracker = { sessionIndex: 1, lastTime: logTime, wasLogout: false };
            userSessionTrackers.set(uId, tracker);
        } else {
            const timeDiff = Math.abs(logTime - tracker.lastTime);
            if (tracker.wasLogout || action === 'LOGIN_SUCCESS' || timeDiff > SESSION_TIMEOUT_MS) {
                tracker.sessionIndex += 1;
            }
            tracker.lastTime = logTime;
            tracker.wasLogout = (action === 'LOGOUT');
        }

        const sessionIndex = tracker.sessionIndex;
        const palette = SESSION_PALETTES[(sessionIndex - 1) % SESSION_PALETTES.length];

        return {
            ...log,
            _sessionMeta: {
                sessionIndex,
                sessionLabel: `Oturum #${sessionIndex}`,
                palette,
                time: logTime
            }
        };
    });

    // Return in reverse chronological order (newest first) for audit feeds
    return enrichedChronological.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

// ActivityLogCard: Professional, detailed card for Portal Logs and User Dossier
export const ActivityLogCard = ({ act, onInspectLog, onMediaClick }) => {
    if (!act) return null;
    const sev = act.severity || 'info';
    const narrative = getActionNarrative(act);
    const sessionMeta = act._sessionMeta || { sessionLabel: 'Oturum #1', palette: SESSION_PALETTES[0] };
    const palette = sessionMeta.palette || SESSION_PALETTES[0];

    const actor = act.user && typeof act.user === 'object' ? act.user : act.details?.author;
    const chName = act.channel || act.details?.channelName || (typeof act.details?.channel === 'string' && !/^[a-f0-9]{24}$/i.test(act.details.channel) ? act.details.channel : '');
    const postContent = act.content || act.details?.content || act.details?.snippet || act.details?.postSnapshot?.content || '';
    const hasMedia = act.hasMedia || act.details?.hasMedia || act.details?.mediaUrl || act.details?.media || act.details?.pdfUrl;
    const mediaUrl = act.mediaUrl || act.details?.mediaUrl || act.details?.media || (Array.isArray(act.details?.media) ? act.details.media[0] : null) || act.details?.pdfUrl;
    const mediaType = act.mediaType || act.details?.mediaType || (act.details?.pdfUrl ? 'pdf' : (act.details?.url ? 'video' : 'image'));
    const durationSec = act.durationSec !== undefined && act.durationSec !== null ? act.durationSec : act.details?.durationSec;

    // Check if live stream toggle
    const isStreamToggle = act.action === 'STREAM_TOGGLE';
    // Check if watch party or video watch
    const isStreamWatch = act.action === 'STREAM_WATCH' || act.action === 'WP_START' || !!act.details?.url;

    return (
        <div 
            onClick={() => onInspectLog && onInspectLog(act)}
            className="portal-audit-feed-card"
            style={{
                background: '#141414',
                border: '1px solid #242424',
                borderLeft: `4px solid ${palette.border}`,
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: onInspectLog ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: `0 2px 10px ${palette.cardBg}`
            }}
        >
            {/* Header Row: Session Badge + Actor + Action + Severity + Channel + Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span 
                        style={{
                            background: palette.badgeBg,
                            color: palette.text,
                            border: `1px solid ${palette.border}`,
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase'
                        }}
                    >
                        {sessionMeta.sessionLabel}
                    </span>

                    {actor ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AdminMedia
                                src={actor.profile?.avatar || actor.avatar}
                                alt=""
                                isAvatar
                                style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                            />
                            <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>
                                @{actor.username}
                            </span>
                            {actor.profile?.displayName && actor.profile.displayName !== actor.username && (
                                <span style={{ color: '#777', fontSize: '11px' }}>({actor.profile.displayName})</span>
                            )}
                        </div>
                    ) : (
                        <span style={{ color: '#888', fontSize: '12px', fontWeight: 500 }}>
                            ⚙️ {act.username || act.actorRole || 'Sistem / Bot'}
                        </span>
                    )}

                    <span className="mono-tag" style={{ fontSize: '9px' }}>{act.action}</span>
                    <span className={`severity-badge ${sev}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {sev.toUpperCase()}
                    </span>

                    {chName && (
                        <span className="channel-badge-chip" style={{ fontSize: '9px' }}>
                            #{chName}
                        </span>
                    )}

                    {durationSec !== null && durationSec !== undefined && (
                        <span 
                            style={{
                                background: 'rgba(234, 179, 8, 0.15)',
                                color: '#facc15',
                                border: '1px solid rgba(234, 179, 8, 0.35)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '10px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ⏱️ Kalış Süresi: {formatDurationSec(durationSec)}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {act.ip && <span style={{ color: '#666', fontFamily: 'monospace', fontSize: '10px' }}>{act.ip}</span>}
                    <span style={{ color: '#777', fontFamily: 'monospace', fontSize: '10px' }}>
                        {act.createdAt ? new Date(act.createdAt).toLocaleString('tr-TR') : '-'}
                    </span>
                    {onInspectLog && (
                        <span style={{ color: palette.text, fontSize: '11px', fontWeight: 600 }}>🔍 İncele</span>
                    )}
                </div>
            </div>

            {/* Narrative Title & Description */}
            <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.4 }}>
                <strong style={{ color: '#fff', marginRight: '6px' }}>{narrative.title}:</strong>
                <span>{narrative.desc}</span>
            </div>

            {/* Live Media Stream Toggle Toggles (Mic, Cam, Screen) */}
            {isStreamToggle && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {act.details?.isMuted !== undefined && (
                        <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: act.details.isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: act.details.isMuted ? '#f87171' : '#4ade80',
                            border: `1px solid ${act.details.isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                        }}>
                            {act.details.isMuted ? '🔇 Mikrofon Susturuldu' : '🎙️ Mikrofon Açıldı'}
                        </span>
                    )}
                    {act.details?.isCameraOn !== undefined && (
                        <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: act.details.isCameraOn ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                            color: act.details.isCameraOn ? '#60a5fa' : '#9ca3af',
                            border: `1px solid ${act.details.isCameraOn ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
                        }}>
                            {act.details.isCameraOn ? '🎥 Kamera Açıldı' : '📷 Kamera Kapalı'}
                        </span>
                    )}
                    {act.details?.isScreenSharing !== undefined && (
                        <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: act.details.isScreenSharing ? 'rgba(168, 85, 247, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                            color: act.details.isScreenSharing ? '#c084fc' : '#9ca3af',
                            border: `1px solid ${act.details.isScreenSharing ? 'rgba(168, 85, 247, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
                        }}>
                            {act.details.isScreenSharing ? '🖥️ Ekran Paylaşımı Başlatıldı' : '⏹️ Ekran Paylaşımı Kapalı'}
                        </span>
                    )}
                </div>
            )}

            {/* Live Video / Film Source Information */}
            {isStreamWatch && act.details?.url && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '16px' }}>🎬</span>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {act.details?.title || 'Canlı Video/Film Yayını'}
                            </div>
                            <div style={{ color: '#888', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {act.details.url}
                            </div>
                        </div>
                    </div>
                    {onMediaClick && (
                        <button
                            type="button"
                            className="btn-modern-ghost"
                            style={{ padding: '4px 8px', fontSize: '11px', flexShrink: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMediaClick({
                                    url: act.details.url,
                                    type: 'video',
                                    title: act.details.title || 'Canlı Video/Film Yayını',
                                    content: act.details.url
                                });
                            }}
                        >
                            ▶️ İzle / Büyüt
                        </button>
                    )}
                </div>
            )}

            {/* Post Content Body Preview */}
            {postContent && (
                <div style={{
                    background: '#0c0c0c',
                    border: '1px solid #1f1f1f',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#e0e0e0',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '120px',
                    overflowY: 'auto'
                }}>
                    {postContent}
                </div>
            )}

            {/* Attached Media / File Showcase with Click-to-Enlarge */}
            {hasMedia && mediaUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                    {mediaType === 'video' ? (
                        <div 
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                background: '#0a0a0a',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                transition: 'border-color 0.2s'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMediaClick) onMediaClick({ url: mediaUrl, type: 'video', title: narrative.title, content: postContent });
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>🎬</span>
                            <span className="media-mini-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                🎥 Video (Büyütmek & Oynatmak için tıkla)
                            </span>
                        </div>
                    ) : mediaType === 'pdf' ? (
                        <div 
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                background: '#0a0a0a',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                padding: '6px 10px'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMediaClick) onMediaClick({ url: mediaUrl, type: 'pdf', title: act.details?.pdfName || 'PDF Belgesi' });
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>📄</span>
                            <span className="media-mini-pill" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                PDF Belgesi {act.details?.pdfName ? `(${act.details.pdfName})` : ''} (İncelemek için tıkla)
                            </span>
                        </div>
                    ) : (
                        <div 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMediaClick) onMediaClick({ url: mediaUrl, type: 'image', title: narrative.title, content: postContent });
                            }}
                        >
                            <AdminMedia
                                src={mediaUrl}
                                alt="Paylaşılan Medya"
                                style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                            />
                            <span className="media-mini-pill">🖼️ Görsel (Büyütmek için tıkla)</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Modern Modal Component for Reason Entry + Duration Picker
const ReasonModal = ({ isOpen, onClose, onSubmit, actionType }) => {
    const [reason, setReason] = useState('');
    const [durationType, setDurationType] = useState('preset'); // 'preset' or 'custom'
    const [selectedPreset, setSelectedPreset] = useState(null); // hours
    const [customDate, setCustomDate] = useState('');

    if (!isOpen) return null;

    const presets = [
        { label: '1 Saat', hours: 1 },
        { label: '6 Saat', hours: 6 },
        { label: '12 Saat', hours: 12 },
        { label: '1 Gün', hours: 24 },
        { label: '3 Gün', hours: 72 },
        { label: '7 Gün', hours: 168 },
        { label: '30 Gün', hours: 720 },
    ];

    const calculateSuspendedUntil = () => {
        if (actionType !== 'suspend') return null;
        if (durationType === 'preset' && selectedPreset) {
            return new Date(Date.now() + selectedPreset * 60 * 60 * 1000).toISOString();
        }
        if (durationType === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (actionType === 'suspend' && !calculateSuspendedUntil()) {
            alert('Lütfen askıya alma süresi belirleyin.');
            return;
        }
        onSubmit(reason, calculateSuspendedUntil());
        setReason('');
        setSelectedPreset(null);
        setCustomDate('');
    };

    let title = 'İşlem Sebebi';
    let description = 'Bu işlem için bir sebep belirtin.';
    let actionBtnText = 'ONAYLA';

    if (actionType === 'suspend') {
        title = 'Askıya Alma Sebebi';
        description = 'Bu portal askıya alınacak. Lütfen bir sebep ve süre belirleyin. Bu bilgiler portal sayfasında görüntülenecektir.';
        actionBtnText = 'ASKIYA ALMAYI ONAYLA';
    } else if (actionType === 'close') {
        title = 'Kapatma Sebebi';
        description = 'Bu portal kapatılacak. Lütfen bir sebep belirtin. Bu sebep portal sayfasında görüntülenecektir.';
        actionBtnText = 'KAPATMAYI ONAYLA';
    }

    // Min date for custom picker (now)
    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern">
                <div className="modal-header-modern">
                    <h2>{title}</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-modern">
                        <p className="modal-description-modern">{description}</p>
                        <textarea
                            className="reason-input-modern"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Örn: Topluluk kuralları ihlali..."
                            rows="4"
                            required
                        />

                        {/* Duration Picker — Only for Suspend */}
                        {actionType === 'suspend' && (
                            <div className="duration-picker-section">
                                <h4 className="duration-title">⏱ Askıya Alma Süresi</h4>
                                <div className="duration-type-toggle">
                                    <button
                                        type="button"
                                        className={`duration-type-btn ${durationType === 'preset' ? 'active' : ''}`}
                                        onClick={() => setDurationType('preset')}
                                    >
                                        Hazır Süre
                                    </button>
                                    <button
                                        type="button"
                                        className={`duration-type-btn ${durationType === 'custom' ? 'active' : ''}`}
                                        onClick={() => setDurationType('custom')}
                                    >
                                        Özel Tarih
                                    </button>
                                </div>

                                {durationType === 'preset' ? (
                                    <div className="preset-grid">
                                        {presets.map((p) => (
                                            <button
                                                key={p.hours}
                                                type="button"
                                                className={`preset-btn ${selectedPreset === p.hours ? 'active' : ''}`}
                                                onClick={() => setSelectedPreset(p.hours)}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="datetime-local"
                                        className="custom-date-input"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        min={minDate}
                                        required={durationType === 'custom'}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-ghost" onClick={onClose}>
                            İptal
                        </button>
                        <button type="submit" className="btn-modern-primary">
                            {actionBtnText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modern Ban Modal Component for User and IP Banning
const BanModal = ({ isOpen, onClose, onSubmit, type }) => {
    const [reason, setReason] = useState('');
    const [durationType, setDurationType] = useState('preset'); // 'preset' or 'custom' or 'permanent'
    const [selectedPreset, setSelectedPreset] = useState(null); // hours
    const [customDate, setCustomDate] = useState('');

    if (!isOpen) return null;

    const presets = [
        { label: '1 Saat', hours: 1 },
        { label: '12 Saat', hours: 12 },
        { label: '1 Gün', hours: 24 },
        { label: '3 Gün', hours: 72 },
        { label: '7 Gün', hours: 168 },
        { label: '30 Gün', hours: 720 },
    ];

    const calculateExpiresAt = () => {
        if (durationType === 'permanent') return null;
        if (durationType === 'preset' && selectedPreset) {
            return new Date(Date.now() + selectedPreset * 60 * 60 * 1000).toISOString();
        }
        if (durationType === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(reason, calculateExpiresAt());
        setReason('');
        setSelectedPreset(null);
        setCustomDate('');
    };

    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern">
                <div className="modal-header-modern">
                    <h2>{type === 'ip' ? '🚫 IP Adresini Engelle' : '🚫 Kullanıcıyı Engelle'}</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-modern">
                        <p className="modal-description-modern">
                            Bu {type === 'ip' ? 'IP adresini' : 'kullanıcıyı'} engellemek için bir sebep ve süre belirleyin.
                        </p>
                        <textarea
                            className="reason-input-modern"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Örn: Topluluk kuralları ihlali, spam faaliyeti..."
                            rows="4"
                            required
                        />

                        <div className="duration-picker-section">
                            <h4 className="duration-title">⏱ Engel Süresi</h4>
                            <div className="duration-type-toggle">
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'preset' ? 'active' : ''}`}
                                    onClick={() => setDurationType('preset')}
                                >
                                    Süre Seç
                                </button>
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'custom' ? 'active' : ''}`}
                                    onClick={() => setDurationType('custom')}
                                >
                                    Özel Tarih
                                </button>
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'permanent' ? 'active' : ''}`}
                                    onClick={() => setDurationType('permanent')}
                                >
                                    Kalıcı
                                </button>
                            </div>

                            {durationType === 'preset' ? (
                                <div className="preset-grid">
                                    {presets.map((p) => (
                                        <button
                                            key={p.hours}
                                            type="button"
                                            className={`preset-btn ${selectedPreset === p.hours ? 'active' : ''}`}
                                            onClick={() => setSelectedPreset(p.hours)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            ) : durationType === 'custom' ? (
                                <input
                                    type="datetime-local"
                                    className="custom-date-input"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={minDate}
                                    required={durationType === 'custom'}
                                />
                            ) : (
                                <div className="permanent-ban-warning" style={{ color: '#ff4b4b', fontSize: '12px', fontWeight: '600', marginTop: '10px' }}>
                                    ⚠️ Bu engel elle kaldırılana kadar süresiz olarak geçerli olacaktır.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-ghost" onClick={onClose}>
                            İptal
                        </button>
                        <button type="submit" className="btn-modern-primary" style={{ background: '#ff4b4b' }}>
                            ENGELE
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Alert Modal Component — Similar to ReasonModal but for portal alerts
const AlertModal = ({ isOpen, onClose, onSubmit, portalName }) => {
    const [message, setMessage] = useState('');
    const [durationType, setDurationType] = useState('preset');
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [customDate, setCustomDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const presets = [
        { label: '1 Saat', hours: 1 },
        { label: '6 Saat', hours: 6 },
        { label: '12 Saat', hours: 12 },
        { label: '1 Gün', hours: 24 },
        { label: '3 Gün', hours: 72 },
        { label: '7 Gün', hours: 168 },
        { label: '30 Gün', hours: 720 },
    ];

    const calculateExpiresAt = () => {
        if (durationType === 'preset' && selectedPreset) {
            return new Date(Date.now() + selectedPreset * 60 * 60 * 1000).toISOString();
        }
        if (durationType === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const expiresAt = calculateExpiresAt();
        if (!expiresAt) {
            alert('Lütfen uyarı süresi belirleyin.');
            return;
        }
        if (!message.trim()) {
            alert('Lütfen uyarı mesajı yazın.');
            return;
        }
        setSubmitting(true);
        await onSubmit(message.trim(), expiresAt);
        setSubmitting(false);
        setMessage('');
        setSelectedPreset(null);
        setCustomDate('');
    };

    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern">
                <div className="modal-header-modern">
                    <h2>📢 Uyarı Yayınla</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-modern">
                        <p className="modal-description-modern">
                            <strong>{portalName}</strong> portalına bir yönetici uyarısı yayınlayın. Bu uyarı portal anasayfasında tüm kullanıcılara banner olarak gösterilecektir.
                        </p>
                        <textarea
                            className="reason-input-modern"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Uyarı mesajınızı yazın... (maks. 500 karakter)"
                            rows="4"
                            maxLength={500}
                            required
                        />
                        <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', marginTop: '-8px' }}>
                            {message.length}/500
                        </div>

                        <div className="duration-picker-section">
                            <h4 className="duration-title">⏱ Uyarı Süresi</h4>
                            <div className="duration-type-toggle">
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'preset' ? 'active' : ''}`}
                                    onClick={() => setDurationType('preset')}
                                >
                                    Hazır Süre
                                </button>
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'custom' ? 'active' : ''}`}
                                    onClick={() => setDurationType('custom')}
                                >
                                    Özel Tarih
                                </button>
                            </div>

                            {durationType === 'preset' ? (
                                <div className="preset-grid">
                                    {presets.map((p) => (
                                        <button
                                            key={p.hours}
                                            type="button"
                                            className={`preset-btn ${selectedPreset === p.hours ? 'active' : ''}`}
                                            onClick={() => setSelectedPreset(p.hours)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <input
                                    type="datetime-local"
                                    className="custom-date-input"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={minDate}
                                    required={durationType === 'custom'}
                                />
                            )}
                        </div>
                    </div>
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-ghost" onClick={onClose}>
                            İptal
                        </button>
                        <button type="submit" className="btn-modern-primary" disabled={submitting} style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)' }}>
                            {submitting ? 'GÖNDERİLİYOR...' : '📢 UYARIYI YAYINLA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Professional Feedback Response Modal v2
const FeedbackResponseModal = ({ isOpen, onClose, feedback, onSubmit }) => {
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    if (!isOpen || !feedback) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(feedback._id, response);
        setSubmitting(false);
        setResponse('');
    };

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern feedback-ticket-modal">
                <div className="modal-header-modern">
                    <div className="ticket-header-info">
                        <h2>#{feedback._id?.substring(feedback._id.length - 6) || '000000'} Talep Detayı</h2>
                        <span className={`status-badge-neon ${feedback.status}`}>{feedback.status === 'new' ? 'Bekliyor' : 'Yanıtlandı'}</span>
                    </div>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>

                <div className="ticket-split-body">
                    {/* Left Side: Request Info & Gallery */}
                    <div className="ticket-request-side">
                        <div className="sender-meta-box">
                            <img 
                                src={feedback.user?.profile?.avatar || '/system/deleted-user.png'} 
                                alt="" 
                                className="sender-avatar-large" 
                            />
                            <div className="sender-details">
                                <strong>{feedback.user ? `@${feedback.user.username}` : 'Silinmiş Kullanıcı'}</strong>
                                <span>{new Date(feedback.createdAt).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>

                        <div className="request-content-scroller">
                            <div className={`category-chip ${(feedback.category?.toLowerCase() || 'genel').replace(/\s+/g, '-')}`}>{feedback.category || 'Genel'}</div>
                            <h3 className="ticket-subject">{feedback.subject}</h3>
                            <div className="ticket-message-block">
                                {feedback.message}
                            </div>

                            {feedback.files && feedback.files.length > 0 && (
                                <div className="ticket-gallery-section">
                                    <label>Ekli Görseller ({feedback.files.length})</label>
                                    <div className="ticket-gallery-grid">
                                        {feedback.files.map((file, i) => (
                                            <div 
                                                key={i} 
                                                className="gallery-thumb-wrap"
                                                onClick={() => setActiveImage(file)}
                                            >
                                                <img src={getImageUrl(file)} alt="" className="gallery-thumb" />
                                                <div className="thumb-overlay">
                                                    <span>BÜYÜT</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Admin Response */}
                    <div className="ticket-reply-side">
                        <form onSubmit={handleSubmit} className="reply-form-full">
                            <div className="reply-header-mini">
                                <h3>Hızlı Yanıt</h3>
                                <p>Kullanıcının Inbox'ına anlık bildirim gider.</p>
                            </div>
                            
                            <textarea
                                className="ticket-reply-area"
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Kullanıcıya iletilecek profesyonel yanıtı buraya yazın..."
                                required
                                disabled={feedback.status === 'replied'}
                            />

                            {feedback.status === 'replied' && feedback.adminResponse && (
                                <div className="sent-response-preview">
                                    <label>Gönderilen Yanıt:</label>
                                    <p>{feedback.adminResponse}</p>
                                </div>
                            )}

                            <div className="reply-actions">
                                <button type="button" className="btn-modern-ghost" onClick={onClose}>İPTAL</button>
                                <button 
                                    type="submit" 
                                    className="btn-modern-primary btn-glow-cyan" 
                                    disabled={submitting || !response.trim() || feedback.status === 'replied'}
                                >
                                    {submitting ? 'İLETİLİYOR...' : 'YANITI GÖNDER'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Lightbox for Images */}
            {activeImage && (
                <div className="lightbox-overlay" onClick={() => setActiveImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <img src={getImageUrl(activeImage)} alt="" className="lightbox-img" />
                        <button className="lightbox-close" onClick={() => setActiveImage(null)}>&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};


// Portal Detay & Kanallar Dosyası (Comprehensive Portal Dossier & Channel Manager)
const PortalDetailModal = ({
    isOpen,
    onClose,
    portal,
    loading = false,
    contextBadges = [],
    customBadges = [],
    handlePortalBadge,
    handlePortalCustomBadgeAssign,
    handleNSFWToggle,
    handleReadOnlyToggle,
    initiatePortalStatusChange,
    openAlertModal,
    handleRemoveAlert,
    ownershipTarget,
    setOwnershipTarget,
    handleTransferOwnership,
    transferring,
    onAddChannel,
    onEditChannel,
    onDeleteChannel,
    openPortalPosts,
    openUserDossier,
    onInspectLog,
    onMediaClick
}) => {
    if (!isOpen || !portal) return null;

    const [activeSubTab, setActiveSubTab] = useState('channels'); // 'channels', 'identity', 'members', 'security', 'activity'
    const [showAddChannel, setShowAddChannel] = useState(false);
    const [submittingChannel, setSubmittingChannel] = useState(false);
    const [newChannel, setNewChannel] = useState({
        name: '',
        type: 'text',
        roomMode: 'free',
        maxParticipants: 25,
        isPrivate: false
    });
    const [editingChannelId, setEditingChannelId] = useState(null);
    const [editChannelForm, setEditChannelForm] = useState({
        name: '',
        type: 'text',
        roomMode: 'free',
        maxParticipants: 25,
        isPrivate: false
    });
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    const activeAlerts = portal.alerts ? portal.alerts.filter(a => new Date(a.expiresAt) > new Date() && a.isActive !== false) : [];
    const channels = portal.channels || [];
    const channelStats = portal.channelStats || {};
    const members = Array.isArray(portal.members) ? portal.members : [];
    const admins = Array.isArray(portal.admins) ? portal.admins : [];
    const blockedUsers = Array.isArray(portal.blockedUsers) ? portal.blockedUsers : [];
    const joinRequests = Array.isArray(portal.joinRequests) ? portal.joinRequests : [];

    const handleCreateChannelSubmit = async (e) => {
        e.preventDefault();
        if (!newChannel.name.trim()) {
            alert('Kanal adı gereklidir.');
            return;
        }
        setSubmittingChannel(true);
        try {
            const success = await onAddChannel(portal._id, newChannel);
            if (success) {
                setNewChannel({ name: '', type: 'text', roomMode: 'free', maxParticipants: 25, isPrivate: false });
                setShowAddChannel(false);
            }
        } finally {
            setSubmittingChannel(false);
        }
    };

    const handleStartEditChannel = (ch) => {
        setEditingChannelId(ch._id);
        setEditChannelForm({
            name: ch.name || '',
            type: ch.type || 'text',
            roomMode: ch.roomMode || 'free',
            maxParticipants: ch.maxParticipants || 25,
            isPrivate: !!ch.isPrivate
        });
    };

    const handleSaveEditChannel = async (chId) => {
        if (!editChannelForm.name.trim()) {
            alert('Kanal adı boş olamaz.');
            return;
        }
        const success = await onEditChannel(portal._id, chId, editChannelForm);
        if (success) {
            setEditingChannelId(null);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        alert(`${label} panoya kopyalandı: ${text}`);
    };

    const getChannelIcon = (type) => {
        switch(type) {
            case 'voice': return <Volume2 size={15} />;
            case 'conference': return <Video size={15} />;
            case 'image': return <Image size={15} />;
            default: return <Hash size={15} />;
        }
    };

    const getChannelTypeLabel = (type) => {
        switch(type) {
            case 'voice': return 'SESLİ SOHBET';
            case 'conference': return 'CANLI KONFERANS';
            case 'image': return 'GÖRSEL GALERİ';
            default: return 'METİN';
        }
    };

    // Filter populated members by search
    const filteredMembers = members.filter(m => {
        if (!memberSearchTerm.trim()) return true;
        const term = memberSearchTerm.toLowerCase();
        if (typeof m === 'object' && m !== null) {
            return (m.username && m.username.toLowerCase().includes(term)) ||
                   (m.profile?.displayName && m.profile.displayName.toLowerCase().includes(term)) ||
                   (m.email && m.email.toLowerCase().includes(term));
        }
        return false;
    });

    return (
        <div className="modal-overlay-modern" onClick={onClose}>
            <div className="modal-content-modern portal-dossier-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header Banner */}
                <div className="portal-detail-header-banner" style={{ background: portal.banner ? `url(${getImageUrl(portal.banner)}) center/cover` : '#141414' }}>
                    <div className="portal-banner-overlay" />
                    <button
                        className="close-btn-modern"
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            background: '#000000',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            border: '1px solid #333333',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Portal Identity & Primary Bar */}
                <div className="portal-detail-identity-bar">
                    <AdminMedia
                        src={portal.avatar}
                        alt={portal.name}
                        className="portal-detail-avatar-box"
                        isAvatar={true}
                        fallbackText={portal.name?.substring(0, 2).toUpperCase()}
                    />
                    <div className="portal-detail-primary-info">
                        <div className="portal-detail-heading-row">
                            <h2 className="portal-detail-name">
                                {portal.name}
                                <PortalBadges portal={portal} size={20} />
                                {portal.isNSFW && <span className="mono-tag" style={{ background: '#000', color: '#fff', border: '1px solid #fff' }}>+18 NSFW</span>}
                                {portal.isReadOnly && <span className="mono-tag muted">SALT OKUNUR</span>}
                                <span className={`badge-pill-status ${portal.status}`}>
                                    {portal.status === 'active' ? 'AKTİF' : portal.status === 'suspended' ? 'ASKIDA' : 'KAPALI'}
                                </span>
                            </h2>
                        </div>
                        <div className="portal-detail-quick-meta">
                            <span className="quick-meta-item">
                                ID: <span className="mono-code" onClick={() => copyToClipboard(portal._id, 'Portal ID')}>{portal._id} <Copy size={11} style={{ verticalAlign: 'middle' }} /></span>
                            </span>
                            <span className="quick-meta-item">
                                Kurucu:{' '}
                                {portal.owner ? (
                                    <strong
                                        className="portal-owner-link"
                                        onClick={() => openUserDossier && openUserDossier(portal.owner)}
                                        title="Kurucunun şeceresini aç"
                                    >
                                        @{typeof portal.owner === 'object' ? portal.owner.username : portal.owner}
                                    </strong>
                                ) : (
                                    'Bilinmiyor'
                                )}
                            </span>
                            <span className="quick-meta-item">👥 {members.length} Üye</span>
                            <span className="quick-meta-item">📻 {channels.length} Kanal</span>
                            <span className="quick-meta-item">📝 {portal.postCount || 0} Gönderi</span>
                        </div>
                    </div>
                </div>

                {/* Sub-Tab Navigation */}
                <div className="portal-dossier-subtabs-nav">
                    <button
                        type="button"
                        className={`portal-subtab-btn ${activeSubTab === 'channels' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('channels')}
                    >
                        <Radio size={14} />
                        <span>KANALLAR & ODALAR ({channels.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`portal-subtab-btn ${activeSubTab === 'identity' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('identity')}
                    >
                        <Globe size={14} />
                        <span>GENEL & KİMLİK BİLGİLERİ</span>
                    </button>
                    <button
                        type="button"
                        className={`portal-subtab-btn ${activeSubTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('members')}
                    >
                        <Users size={14} />
                        <span>ÜYELER & YÖNETİCİLER ({members.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`portal-subtab-btn ${activeSubTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('security')}
                    >
                        <ShieldCheck size={14} />
                        <span>GÜVENLİK & AYARLAR</span>
                    </button>
                    <button
                        type="button"
                        className={`portal-subtab-btn ${activeSubTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('activity')}
                    >
                        <History size={14} />
                        <span>PORTAL GÜNLÜĞÜ</span>
                    </button>
                </div>

                {/* Modal Body Scroller */}
                <div className="detail-modal-body-scroller">
                    {loading && (
                        <div className="admin-loading" style={{ margin: '10px 0' }}>
                            Portal dosyası ve kanal istatistikleri senkronize ediliyor...
                        </div>
                    )}

                    {/* SUBTAB 1: KANALLAR & ODALAR */}
                    {activeSubTab === 'channels' && (
                        <div className="portal-subtab-pane">
                            {/* Channels Quick Metrics */}
                            <div className="portal-channels-metrics-grid">
                                <div className="p-metric-card">
                                    <span className="p-metric-label">TOPLAM KANAL</span>
                                    <strong className="p-metric-val">{channels.length}</strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">METİN KANALLARI</span>
                                    <strong className="p-metric-val">
                                        {channels.filter(c => !c.type || c.type === 'text').length}
                                    </strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">SES & CANLI SAHNE</span>
                                    <strong className="p-metric-val">
                                        {channels.filter(c => c.type === 'voice' || c.type === 'conference').length}
                                    </strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">ÖZEL / KİLİTLİ</span>
                                    <strong className="p-metric-val">
                                        {channels.filter(c => c.isPrivate).length}
                                    </strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">TOPLAM PORTAL POST</span>
                                    <strong className="p-metric-val">{portal.postCount || 0}</strong>
                                </div>
                            </div>

                            {/* Header row with Add Channel toggle */}
                            <div className="channels-section-header">
                                <div>
                                    <h4 className="detail-section-title" style={{ margin: 0 }}>
                                        Portal İçi Kanallar ve Canlı Odalar
                                    </h4>
                                    <span style={{ fontSize: '12px', color: '#888888' }}>
                                        Bu portalda bulunan tüm metin, ses ve konferans kanallarını yapılandırın veya postlarını filtreleyin.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="user-box-btn"
                                    onClick={() => setShowAddChannel(!showAddChannel)}
                                    style={{ background: showAddChannel ? '#222222' : '#ffffff', color: showAddChannel ? '#ffffff' : '#000000', fontWeight: 700 }}
                                >
                                    {showAddChannel ? '✖ İptal' : '➕ Yeni Kanal Ekle'}
                                </button>
                            </div>

                            {/* Add Channel Inline Form */}
                            {showAddChannel && (
                                <form onSubmit={handleCreateChannelSubmit} className="add-channel-panel">
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.5px' }}>
                                        ➕ Yeni Kanal Yapılandır
                                    </h5>
                                    <div className="add-channel-grid">
                                        <div className="form-group-modern" style={{ flex: 1, minWidth: '180px' }}>
                                            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Kanal Adı</label>
                                            <input
                                                type="text"
                                                className="reason-input-modern"
                                                placeholder="Örn: sohbet-genel"
                                                value={newChannel.name}
                                                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                                required
                                                maxLength={20}
                                                style={{ height: '36px', padding: '6px 10px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="form-group-modern" style={{ width: '160px' }}>
                                            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Kanal Türü</label>
                                            <select
                                                className="badge-select"
                                                value={newChannel.type}
                                                onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                                                style={{ width: '100%', height: '36px', fontSize: '12px', padding: '6px' }}
                                            >
                                                <option value="text">💬 Metin Sohbet</option>
                                                <option value="voice">🔊 Sesli Sohbet</option>
                                                <option value="conference">🎙️ Canlı Sahne</option>
                                                <option value="image">🖼️ Görsel Galeri</option>
                                            </select>
                                        </div>
                                        <div className="form-group-modern" style={{ width: '150px' }}>
                                            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Oda Modu</label>
                                            <select
                                                className="badge-select"
                                                value={newChannel.roomMode}
                                                onChange={(e) => setNewChannel({ ...newChannel, roomMode: e.target.value })}
                                                style={{ width: '100%', height: '36px', fontSize: '12px', padding: '6px' }}
                                            >
                                                <option value="free">Serbest Katılım</option>
                                                <option value="stage">Sahne (Sadece Yetkili)</option>
                                            </select>
                                        </div>
                                        <div className="form-group-modern" style={{ width: '110px' }}>
                                            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Katılımcı Sınırı</label>
                                            <input
                                                type="number"
                                                className="reason-input-modern"
                                                value={newChannel.maxParticipants}
                                                onChange={(e) => setNewChannel({ ...newChannel, maxParticipants: e.target.value })}
                                                min={2}
                                                max={100}
                                                style={{ height: '36px', padding: '6px 10px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="form-group-modern" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#ccc', margin: '14px 0 0 0' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newChannel.isPrivate}
                                                    onChange={(e) => setNewChannel({ ...newChannel, isPrivate: e.target.checked })}
                                                />
                                                <span>🔒 Özel Kanal</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                        <button
                                            type="button"
                                            className="btn-modern-ghost"
                                            onClick={() => setShowAddChannel(false)}
                                            style={{ padding: '6px 14px', fontSize: '12px' }}
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="user-box-btn"
                                            disabled={submittingChannel}
                                            style={{ minWidth: '120px', padding: '6px 14px', fontSize: '12px' }}
                                        >
                                            {submittingChannel ? 'Kaydediliyor...' : '✓ Kanalı Oluştur'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Channels Table / Grid */}
                            {channels.length === 0 ? (
                                <p className="no-data">Bu portalda henüz yapılandırılmış kanal bulunmuyor.</p>
                            ) : (
                                <div className="portal-channels-list">
                                    {channels.map((ch) => {
                                        const isEditing = editingChannelId === ch._id;
                                        const pCount = channelStats[String(ch._id)] || channelStats[String(ch.name)] || 0;

                                        if (isEditing) {
                                            return (
                                                <div key={ch._id} className="channel-inspect-card editing">
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', width: '100%' }}>
                                                        <div>
                                                            <span style={{ fontSize: '10px', color: '#888' }}>Kanal Adı</span>
                                                            <input
                                                                type="text"
                                                                className="reason-input-modern"
                                                                value={editChannelForm.name}
                                                                onChange={(e) => setEditChannelForm({ ...editChannelForm, name: e.target.value })}
                                                                style={{ height: '32px', fontSize: '12px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '10px', color: '#888' }}>Tür</span>
                                                            <select
                                                                className="badge-select"
                                                                value={editChannelForm.type}
                                                                onChange={(e) => setEditChannelForm({ ...editChannelForm, type: e.target.value })}
                                                                style={{ width: '100%', height: '32px', fontSize: '11px' }}
                                                            >
                                                                <option value="text">💬 Metin</option>
                                                                <option value="voice">🔊 Ses</option>
                                                                <option value="conference">🎙️ Sahne</option>
                                                                <option value="image">🖼️ Galeri</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '10px', color: '#888' }}>Oda Modu</span>
                                                            <select
                                                                className="badge-select"
                                                                value={editChannelForm.roomMode}
                                                                onChange={(e) => setEditChannelForm({ ...editChannelForm, roomMode: e.target.value })}
                                                                style={{ width: '100%', height: '32px', fontSize: '11px' }}
                                                            >
                                                                <option value="free">Serbest</option>
                                                                <option value="stage">Sahne</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '10px', color: '#888' }}>Maks. Katılımcı</span>
                                                            <input
                                                                type="number"
                                                                className="reason-input-modern"
                                                                value={editChannelForm.maxParticipants}
                                                                onChange={(e) => setEditChannelForm({ ...editChannelForm, maxParticipants: e.target.value })}
                                                                style={{ height: '32px', fontSize: '12px' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '16px' }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ccc' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editChannelForm.isPrivate}
                                                                    onChange={(e) => setEditChannelForm({ ...editChannelForm, isPrivate: e.target.checked })}
                                                                />
                                                                <span>Özel</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'flex-end', width: '100%' }}>
                                                        <button
                                                            type="button"
                                                            className="btn-modern-ghost"
                                                            onClick={() => setEditingChannelId(null)}
                                                            style={{ padding: '4px 10px', fontSize: '11px' }}
                                                        >
                                                            İptal
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="user-box-btn"
                                                            onClick={() => handleSaveEditChannel(ch._id)}
                                                            style={{ padding: '4px 12px', fontSize: '11px' }}
                                                        >
                                                            Kaydet
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={ch._id} className="channel-inspect-card">
                                                <div className="channel-card-left">
                                                    <div className="channel-type-icon-box">
                                                        {getChannelIcon(ch.type)}
                                                    </div>
                                                    <div className="channel-meta-content">
                                                        <div className="channel-title-row">
                                                            <strong className="channel-name-tag">#{ch.name}</strong>
                                                            <span className="mono-tag" style={{ fontSize: '9px' }}>
                                                                {getChannelTypeLabel(ch.type)}
                                                            </span>
                                                            {ch.roomMode === 'stage' && (
                                                                <span className="mono-tag inverted" style={{ fontSize: '9px' }}>
                                                                    SAHNE
                                                                </span>
                                                            )}
                                                            {ch.isPrivate && (
                                                                <span className="mono-tag" style={{ fontSize: '9px', border: '1px solid #ffffff' }}>
                                                                    🔒 ÖZEL
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="channel-sub-info">
                                                            <span>ID: <code style={{ fontFamily: 'monospace' }}>{ch._id}</code></span>
                                                            <span>• Maks: {ch.maxParticipants || 25} kişi</span>
                                                            <span>• {pCount} Paylaşım / Post</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="channel-card-actions">
                                                    <button
                                                        type="button"
                                                        className="user-box-btn"
                                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                                        title="Bu kanaldaki tüm gönderileri görüntüle ve filtrele"
                                                        onClick={() => {
                                                            onClose();
                                                            openPortalPosts(portal, ch._id);
                                                        }}
                                                    >
                                                        📝 Postlar ({pCount})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="user-box-btn"
                                                        style={{ padding: '4px 8px', fontSize: '11px' }}
                                                        title="Kanal ayarlarını düzenle"
                                                        onClick={() => handleStartEditChannel(ch)}
                                                    >
                                                        ✏️ Düzenle
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="user-box-btn"
                                                        style={{ padding: '4px 8px', fontSize: '11px', color: '#ff6b6b' }}
                                                        title="Kanalı sil"
                                                        onClick={() => onDeleteChannel(portal._id, ch._id)}
                                                    >
                                                        🗑️ Sil
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUBTAB 2: GENEL & KİMLİK BİLGİLERİ */}
                    {activeSubTab === 'identity' && (
                        <div className="portal-subtab-pane">
                            <div className="dossier-grid">
                                {/* Kimlik Tablosu */}
                                <div className="dossier-section-box">
                                    <h4 className="dossier-section-title">KİMLİK & SİSTEM REFERANSLARI</h4>
                                    <div className="dossier-key-val">
                                        <span className="label">Portal ID</span>
                                        <span className="val" style={{ fontFamily: 'monospace' }}>
                                            {portal._id}{' '}
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(portal._id, 'Portal ID')}
                                                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
                                            >
                                                <Copy size={11} />
                                            </button>
                                        </span>
                                    </div>
                                    <div className="dossier-key-val">
                                        <span className="label">Portal Adı</span>
                                        <span className="val"><strong>{portal.name}</strong></span>
                                    </div>
                                    <div className="dossier-key-val">
                                        <span className="label">Kategori</span>
                                        <span className="val">{portal.category || 'Genel'}</span>
                                    </div>
                                    <div className="dossier-key-val">
                                        <span className="label">Tema / Vurgu Rengi</span>
                                        <span className="val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: portal.themeColor || '#ffffff', display: 'inline-block', border: '1px solid #444' }} />
                                            {portal.themeColor || '#ffffff'}
                                        </span>
                                    </div>
                                    <div className="dossier-key-val">
                                        <span className="label">Oluşturulma Tarihi</span>
                                        <span className="val">{portal.createdAt ? new Date(portal.createdAt).toLocaleString('tr-TR') : '-'}</span>
                                    </div>
                                    <div className="dossier-key-val">
                                        <span className="label">Son Güncelleme</span>
                                        <span className="val">{portal.updatedAt ? new Date(portal.updatedAt).toLocaleString('tr-TR') : '-'}</span>
                                    </div>
                                    <div className="dossier-key-val">
                                        <span className="label">Toplam Gönderi</span>
                                        <span className="val">{portal.postCount || 0} Gönderi</span>
                                    </div>
                                </div>

                                {/* Kurucu Profil Kartı */}
                                <div className="dossier-section-box">
                                    <h4 className="dossier-section-title">PORTAL KURUCUSU (OWNER)</h4>
                                    {portal.owner && typeof portal.owner === 'object' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <AdminMedia
                                                    src={portal.owner.profile?.avatar}
                                                    alt={portal.owner.username}
                                                    isAvatar={true}
                                                    style={{ width: '48px', height: '48px', borderRadius: '8px' }}
                                                />
                                                <div>
                                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                                                        {portal.owner.profile?.displayName || portal.owner.username}
                                                    </div>
                                                    <div style={{ color: '#888', fontSize: '12px' }}>@{portal.owner.username}</div>
                                                    <div style={{ color: '#666', fontSize: '11px' }}>{portal.owner.email}</div>
                                                </div>
                                            </div>

                                            <div className="dossier-key-val" style={{ marginTop: '4px' }}>
                                                <span className="label">Kurucu Kayıt Tarihi</span>
                                                <span className="val">{portal.owner.createdAt ? new Date(portal.owner.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="user-box-btn"
                                                onClick={() => {
                                                    onClose();
                                                    openUserDossier(portal.owner);
                                                }}
                                                style={{ marginTop: '8px', width: '100%' }}
                                            >
                                                📋 Kurucu Şecere Dosyasını İncele →
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#888' }}>
                                            Kurucu ID: {typeof portal.owner === 'string' ? portal.owner : 'Bilinmiyor'}
                                        </span>
                                    )}
                                </div>

                                {/* Açıklama & Ek Politikalar */}
                                <div className="dossier-section-box" style={{ gridColumn: '1 / -1' }}>
                                    <h4 className="dossier-section-title">AÇIKLAMA & TOPLULUK KURALLARI</h4>
                                    <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#cccccc', lineHeight: 1.6 }}>
                                        {portal.description || 'Bu topluluk hakkında henüz bir açıklama eklenmemiş.'}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                        <div style={{ background: '#111111', border: '1px solid #222222', padding: '10px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '11px', color: '#777777', display: 'block' }}>LOKASYON / COĞRAFYA</span>
                                            <strong style={{ fontSize: '12px', color: '#ffffff' }}>
                                                {portal.location?.name || (portal.location?.coordinates ? `${portal.location.coordinates[1]}, ${portal.location.coordinates[0]}` : 'Küresel / Tanımsız')}
                                            </strong>
                                        </div>
                                        <div style={{ background: '#111111', border: '1px solid #222222', padding: '10px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '11px', color: '#777777', display: 'block' }}>WATCH PARTY (ORTAK İZLEME)</span>
                                            <strong style={{ fontSize: '12px', color: '#ffffff' }}>
                                                {portal.watchPartySettings?.allowEveryone ? 'Tüm Üyeler Başlatabilir' : 'Sadece Yöneticiler'}
                                            </strong>
                                        </div>
                                        <div style={{ background: '#111111', border: '1px solid #222222', padding: '10px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '11px', color: '#777777', display: 'block' }}>GİZLİLİK VE ERİŞİM</span>
                                            <strong style={{ fontSize: '12px', color: '#ffffff' }}>
                                                {portal.isPrivate ? 'Özel / Onaylı Katılım' : 'Açık / Herkese Görünür'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBTAB 3: ÜYELER & YÖNETİCİLER */}
                    {activeSubTab === 'members' && (
                        <div className="portal-subtab-pane">
                            {/* Member stats */}
                            <div className="portal-channels-metrics-grid">
                                <div className="p-metric-card">
                                    <span className="p-metric-label">TOPLAM ÜYE</span>
                                    <strong className="p-metric-val">{members.length}</strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">YÖNETİCİLER (ADMINS)</span>
                                    <strong className="p-metric-val">{admins.length}</strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">ENGELLENEN KULLANICILAR</span>
                                    <strong className="p-metric-val">{blockedUsers.length}</strong>
                                </div>
                                <div className="p-metric-card">
                                    <span className="p-metric-label">BEKLEYEN İSTEKLER</span>
                                    <strong className="p-metric-val">{joinRequests.length}</strong>
                                </div>
                            </div>

                            {/* Admins Breakdown */}
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">PORTAL YÖNETİCİLERİ ({admins.length})</h4>
                                {admins.length === 0 ? (
                                    <span style={{ fontSize: '12px', color: '#666' }}>Özel yetkili yönetici atanmamış (Yalnızca kurucu yetkilidir).</span>
                                ) : (
                                    <div className="dossier-portals-grid">
                                        {admins.map((adm, i) => (
                                            <div key={adm._id || i} className="dossier-portal-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <AdminMedia
                                                        src={adm.profile?.avatar}
                                                        alt={adm.username}
                                                        isAvatar={true}
                                                        style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                                                            {adm.profile?.displayName || adm.username}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#888' }}>@{adm.username}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="user-box-btn"
                                                    style={{ padding: '3px 8px', fontSize: '10px' }}
                                                    onClick={() => {
                                                        onClose();
                                                        openUserDossier(adm);
                                                    }}
                                                >
                                                    Şecere →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filterable Populated Members List */}
                            <div className="detail-section-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <h4 className="detail-section-title" style={{ margin: 0 }}>
                                        KAYITLI ÜYELER LİSTESİ ({filteredMembers.length} / {members.length})
                                    </h4>
                                    <input
                                        type="text"
                                        placeholder="Üye ara (@kullanıcı adı veya isim)..."
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid #333333', color: '#ffffff', padding: '6px 10px', fontSize: '11px', borderRadius: '6px', minWidth: '200px' }}
                                    />
                                </div>

                                {filteredMembers.length === 0 ? (
                                    <span style={{ fontSize: '12px', color: '#666' }}>Eşleşen üye bulunamadı.</span>
                                ) : (
                                    <div className="portal-members-card-grid">
                                        {filteredMembers.map((m, i) => {
                                            const isObj = typeof m === 'object' && m !== null;
                                            const username = isObj ? m.username : String(m);
                                            const displayName = isObj ? (m.profile?.displayName || m.username) : username;
                                            const avatar = isObj ? m.profile?.avatar : null;

                                            return (
                                                <div key={isObj ? m._id : i} className="portal-member-chip-card">
                                                    <AdminMedia
                                                        src={avatar}
                                                        alt={username}
                                                        isAvatar={true}
                                                        style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {displayName}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#777' }}>@{username}</div>
                                                    </div>
                                                    {isObj && (
                                                        <button
                                                            type="button"
                                                            className="user-box-btn"
                                                            style={{ padding: '3px 6px', fontSize: '9px' }}
                                                            title="Kullanıcı şeceresini aç"
                                                            onClick={() => {
                                                                onClose();
                                                                openUserDossier(m);
                                                            }}
                                                        >
                                                            Şecere
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUBTAB 4: GÜVENLİK & AYARLAR */}
                    {activeSubTab === 'security' && (
                        <div className="portal-subtab-pane">
                            {/* Karantina / Salt Okunur Mod */}
                            <div className="read-only-toggle-container">
                                <div className="read-only-info">
                                    <strong>🛡️ Karantina / Salt Okunur Mod</strong>
                                    <span>Aktif edildiğinde bu portala gönderi ve yorum paylaşımı platform düzeyinde tamamen dondurulur.</span>
                                </div>
                                <div 
                                    className={`read-only-toggle-switch ${portal.isReadOnly ? 'active' : ''}`}
                                    onClick={() => handleReadOnlyToggle(portal._id, portal.isReadOnly)}
                                />
                            </div>

                            {/* Rozet ve NSFW Ayarları */}
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">PORTAL GÜVENLİK & ROZET YAPILANDIRMASI</h4>
                                <div className="flex-control-row" style={{ gap: '16px', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Doğrulama Rozeti</span>
                                        <select
                                            className="badge-select"
                                            value={portal.badges && portal.badges.length > 0 ? portal.badges[0] : 'none'}
                                            onChange={(e) => handlePortalBadge(portal._id, e.target.value)}
                                            style={{ minWidth: '160px' }}
                                        >
                                            <option value="none">Rozet Yok</option>
                                            {(() => {
                                                const portalBadges = contextBadges.filter(b => b.category === 'portal' || b.category === 'both');
                                                const slugs = new Set(portalBadges.map(b => b.slug));
                                                const LEGACY = [
                                                    { slug: 'blue', name: 'Mavi Onay' },
                                                    { slug: 'gold', name: 'Altın Onay' },
                                                    { slug: 'verified', name: 'Onaylı Portal' },
                                                    { slug: 'partner', name: 'Partner' },
                                                    { slug: 'official', name: 'Resmi Hesap' },
                                                ];
                                                const merged = [...portalBadges];
                                                LEGACY.forEach(l => { if (!slugs.has(l.slug)) merged.push(l); });
                                                const currentBadge = portal.badges?.[0];
                                                if (currentBadge && currentBadge !== 'none' && !slugs.has(currentBadge) && !LEGACY.find(l => l.slug === currentBadge)) {
                                                    merged.push({ slug: currentBadge, name: currentBadge });
                                                }
                                                return merged.map(b => (<option key={b.slug} value={b.slug}>{b.name}</option>));
                                            })()}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>+18 NSFW Durumu</span>
                                        <label className="nsfw-toggle-label">
                                            <input
                                                type="checkbox"
                                                checked={portal.isNSFW || false}
                                                onChange={() => handleNSFWToggle(portal._id, portal.isNSFW)}
                                                className="nsfw-toggle-input"
                                            />
                                            <span className="nsfw-toggle-slider"></span>
                                            <span className="nsfw-toggle-text">+18 NSFW İçerik</span>
                                        </label>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Portal Durumu</span>
                                        <span className={`badge-pill-status ${portal.status}`}>
                                            {portal.status === 'active' ? 'Aktif' : portal.status === 'suspended' ? 'Askıya Alındı' : 'Kapatıldı'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Badge Assignment */}
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">Özel İkon Rozeti (Yönetici Rozeti)</h4>
                                <select
                                    className="badge-select"
                                    value={portal.customBadge?.url || ''}
                                    onChange={(e) => {
                                        const selectedUrl = e.target.value;
                                        const selectedBadge = customBadges.find(b => b.url === selectedUrl);
                                        handlePortalCustomBadgeAssign(
                                            portal._id,
                                            selectedBadge ? selectedBadge.url : '',
                                            selectedBadge ? selectedBadge.name : '',
                                            selectedBadge ? (selectedBadge.shape || 'round') : 'round',
                                            selectedBadge ? (selectedBadge.borderStyle || 'thin') : 'thin'
                                        );
                                    }}
                                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px' }}
                                >
                                    <option value="">Rozet Yok</option>
                                    {customBadges.map((badge) => (
                                        <option key={badge._id} value={badge.url}>
                                            {badge.name}
                                        </option>
                                    ))}
                                </select>
                                {portal.customBadge?.url && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '13px', color: '#888' }}>Mevcut:</span>
                                        <span
                                            className={`custom-badge-frame shape-${portal.customBadge.shape || 'round'} border-${portal.customBadge.borderStyle || 'thin'}`}
                                            style={{ width: '22px', height: '22px' }}
                                        >
                                            <img src={portal.customBadge.url} alt={portal.customBadge.name} className="custom-badge-icon" />
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#fff' }}>{portal.customBadge.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Sahiplik Devri (Transfer Ownership) */}
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">Sahiplik Devri (Transfer Ownership)</h4>
                                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#888' }}>
                                    Portal sahipliğini başka bir kullanıcının ID'si veya kullanıcı adı (@username) ile doğrudan devredebilirsiniz.
                                </p>
                                <div className="transfer-ownership-box">
                                    <input
                                        type="text"
                                        className="transfer-ownership-input"
                                        placeholder="Hedef kullanıcı adı veya ID..."
                                        value={ownershipTarget}
                                        onChange={(e) => setOwnershipTarget(e.target.value)}
                                    />
                                    <button
                                        className="btn-transfer-action"
                                        onClick={() => handleTransferOwnership(portal._id)}
                                        disabled={transferring || !ownershipTarget.trim()}
                                    >
                                        {transferring ? 'Devrediliyor...' : 'Devret'}
                                    </button>
                                </div>
                            </div>

                            {/* Actions and Status Operations */}
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">DOĞRUDAN YÖNETİM EYLEMLERİ</h4>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="user-box-btn"
                                        onClick={() => {
                                            onClose();
                                            openPortalPosts(portal);
                                        }}
                                        style={{ background: '#ffffff', color: '#000000', fontWeight: 700 }}
                                    >
                                        📝 Portal Gönderi Arşivini Aç ({portal.postCount || 0})
                                    </button>

                                    <button
                                        type="button"
                                        className="user-box-btn"
                                        onClick={() => openAlertModal(portal._id, portal.name)}
                                    >
                                        📢 Topluluk Uyarısı Yayınla
                                    </button>

                                    {portal.status !== 'suspended' && (
                                        <button
                                            type="button"
                                            className="user-box-btn"
                                            onClick={() => {
                                                onClose();
                                                initiatePortalStatusChange(portal._id, 'suspend');
                                            }}
                                            style={{ color: '#fbbf24' }}
                                        >
                                            ⛔ Askıya Al
                                        </button>
                                    )}

                                    {portal.status !== 'active' && (
                                        <button
                                            type="button"
                                            className="user-box-btn"
                                            onClick={() => {
                                                onClose();
                                                initiatePortalStatusChange(portal._id, 'activate');
                                            }}
                                            style={{ color: '#4ade80' }}
                                        >
                                            ✅ Aktifleştir
                                        </button>
                                    )}

                                    {portal.status !== 'closed' && (
                                        <button
                                            type="button"
                                            className="user-box-btn"
                                            onClick={() => {
                                                onClose();
                                                initiatePortalStatusChange(portal._id, 'close');
                                            }}
                                            style={{ color: '#f87171' }}
                                        >
                                            ❌ Hukuki Kapat
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Timed alerts / announcements list */}
                            {activeAlerts.length > 0 && (
                                <div className="detail-section-card" style={{ border: '1px solid #333333', background: '#0e0e0e' }}>
                                    <h4 className="detail-section-title" style={{ color: '#ffffff' }}>📢 Aktif Portal Uyarıları</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {activeAlerts.map(alert => (
                                            <div key={alert._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161616', padding: '10px 14px', borderRadius: '8px', border: '1px solid #282828' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '13px', color: '#e0e0e0', lineHeight: '1.4' }}>{alert.message}</span>
                                                    <span style={{ fontSize: '11px', color: '#888' }}>Bitiş: {new Date(alert.expiresAt).toLocaleString()}</span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveAlert(portal._id, alert._id)}
                                                    className="user-box-btn"
                                                    style={{ color: '#ff4b4b' }}
                                                >
                                                    Kaldır
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUBTAB 5: PORTAL GÜNLÜĞÜ (AUDIT LOGS & ŞECERE) */}
                    {activeSubTab === 'activity' && (
                        <div className="portal-subtab-pane">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                <h4 className="detail-section-title" style={{ margin: 0 }}>PORTAL İŞLEM VE DENETİM GÜNLÜĞÜ</h4>
                                <button
                                    type="button"
                                    className="user-box-btn"
                                    onClick={() => openPortalPosts(portal)}
                                    style={{ fontSize: '11px', padding: '6px 12px' }}
                                >
                                    📝 Portal Post Arşivini Aç (Aktif + Silinmiş)
                                </button>
                            </div>

                            {/* Portal Görsel Şeceresi (Logo ve Banner Tarihçesi) */}
                            <div style={{ marginBottom: '16px', background: '#0e0e0e', border: '1px solid #222', borderRadius: '8px', padding: '14px' }}>
                                <h5 style={{ fontSize: '11px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                    🖼️ PORTAL GÖRSEL ŞECERESİ (LOGO & BANNER GEÇMİŞİ)
                                </h5>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <span style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '6px' }}>
                                            Kullanılan Portal Logoları ({(portal.avatarHistory || []).length || (portal.avatar ? 1 : 0)}):
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {(portal.avatarHistory || []).length > 0 ? (
                                                portal.avatarHistory.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => onMediaClick && onMediaClick({ url: item.url, title: `${portal.name} Logosu`, date: item.changedAt })}
                                                        style={{ background: '#161616', border: '1px solid #282828', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                                        title="Büyütmek için tıkla"
                                                    >
                                                        <AdminMedia
                                                            src={item.url}
                                                            alt=""
                                                            isAvatar
                                                            style={{ width: '40px', height: '40px', borderRadius: '6px', margin: '0 auto' }}
                                                        />
                                                        <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>
                                                            {item.changedAt ? new Date(item.changedAt).toLocaleDateString('tr-TR') : 'Kayıt'}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : portal.avatar ? (
                                                <div
                                                    onClick={() => onMediaClick && onMediaClick({ url: portal.avatar, title: `${portal.name} Aktif Logosu` })}
                                                    style={{ background: '#161616', border: '1px solid #282828', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                                    title="Büyütmek için tıkla"
                                                >
                                                    <AdminMedia
                                                        src={portal.avatar}
                                                        alt=""
                                                        isAvatar
                                                        style={{ width: '40px', height: '40px', borderRadius: '6px', margin: '0 auto' }}
                                                    />
                                                    <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>Aktif Logo</div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: '#666' }}>Logo kaydı yok.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '6px' }}>
                                            Kullanılan Portal Bannerları ({(portal.bannerHistory || []).length || (portal.banner ? 1 : 0)}):
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {(portal.bannerHistory || []).length > 0 ? (
                                                portal.bannerHistory.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => onMediaClick && onMediaClick({ url: item.url, title: `${portal.name} Bannerı`, date: item.changedAt })}
                                                        style={{ background: '#161616', border: '1px solid #282828', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                                        title="Büyütmek için tıkla"
                                                    >
                                                        <AdminMedia
                                                            src={item.url}
                                                            alt=""
                                                            style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                        <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>
                                                            {item.changedAt ? new Date(item.changedAt).toLocaleDateString('tr-TR') : 'Kayıt'}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : portal.banner ? (
                                                <div
                                                    onClick={() => onMediaClick && onMediaClick({ url: portal.banner, title: `${portal.name} Aktif Bannerı` })}
                                                    style={{ background: '#161616', border: '1px solid #282828', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                                    title="Büyütmek için tıkla"
                                                >
                                                    <AdminMedia
                                                        src={portal.banner}
                                                        alt=""
                                                        style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                    />
                                                    <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>Aktif Banner</div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: '#666' }}>Banner kaydı yok.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const categorizedActivities = categorizeLogsBySession(portal.recentActivities || []);
                                if (categorizedActivities.length === 0) {
                                    return <p className="no-data">Bu portala ait son işlem günlüğü bulunamadı.</p>;
                                }
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {categorizedActivities.map((act, i) => (
                                            <ActivityLogCard
                                                key={act._id || i}
                                                act={act}
                                                onInspectLog={onInspectLog}
                                                onMediaClick={onMediaClick}
                                            />
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer-modern" style={{ padding: '12px 24px', borderTop: '1px solid #222222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#777' }}>
                        Portal ID: <span style={{ fontFamily: 'monospace' }}>{portal._id}</span>
                    </div>
                    <button type="button" className="btn-modern-ghost" onClick={onClose}>
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};


// User Detail / Management Modal
const UserDetailModal = ({
    isOpen,
    onClose,
    user,
    contextBadges,
    handleBadgeChange,
    handleUnbanUser,
    setBanModalTarget,
    setBanModalOpen,
    handleImpersonate,
    handleUserShadowbanToggle,
    isOxypace,
    handleApproveRecovery,
    handleRejectRecovery,
    customBadges = [],
    handleCustomBadgeAssign,
    hasPerm = () => true
}) => {
    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern user-detail-modal">
                <div className="modal-header-modern" style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2>👤 Kullanıcı Yönetimi</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body-modern" style={{ gap: '20px', overflowY: 'auto', maxHeight: '70vh' }}>
                    {/* Profile Summary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <img 
                            src={user.profile?.avatar || 'https://via.placeholder.com/150'} 
                            alt="" 
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)' }} 
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {user.profile?.displayName || user.username}
                                <UserBadges user={user} size={18} />
                            </strong>
                            <span style={{ fontSize: '13px', color: '#888' }}>@{user.username}</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>{user.email}</span>
                        </div>
                    </div>

                    {/* Shadowban (Hayalet Mod) */}
                    {hasPerm('canManageUsers') && (
                        <div className="read-only-toggle-container" style={{ margin: 0 }}>
                            <div className="read-only-info">
                                <strong>Hayalet Modu (Shadowban)</strong>
                                <span>Aktif edildiğinde kullanıcının gönderi ve yorumları sadece kendisine gösterilir.</span>
                            </div>
                            <div 
                                className={`read-only-toggle-switch ${user.isShadowbanned ? 'active' : ''}`}
                                onClick={() => handleUserShadowbanToggle(user._id, user.isShadowbanned)}
                            />
                        </div>
                    )}

                    {/* Badge Selection */}
                    {hasPerm('canManageBadges') && (
                        <>
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">Doğrulama Rozeti</h4>
                                <select
                                    className={`badge-select ${user.verificationBadge}`}
                                    value={user.verificationBadge}
                                    onChange={(e) => handleBadgeChange(user._id, e.target.value)}
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                                >
                                    <option value="none">Rozet Yok</option>
                                    {(() => {
                                        const userBadges = contextBadges.filter(b => b.category === 'user' || b.category === 'both');
                                        const slugs = new Set(userBadges.map(b => b.slug));
                                        const LEGACY = [
                                            { slug: 'blue', name: 'Mavi Onay' },
                                            { slug: 'gold', name: 'Altın Onay' },
                                            { slug: 'platinum', name: 'Platin Onay' },
                                            { slug: 'special', name: 'Özel Rozet' },
                                            { slug: 'staff', name: 'Platform Yöneticisi' },
                                            { slug: 'partner', name: 'Partner' },
                                            { slug: 'official', name: 'Resmi Hesap' },
                                        ];
                                        const merged = [...userBadges];
                                        LEGACY.forEach(l => { if (!slugs.has(l.slug)) merged.push(l); });
                                        if (user.verificationBadge && user.verificationBadge !== 'none' && !slugs.has(user.verificationBadge) && !LEGACY.find(l => l.slug === user.verificationBadge)) {
                                            merged.push({ slug: user.verificationBadge, name: user.verificationBadge });
                                        }
                                        return merged.map(b => (<option key={b.slug} value={b.slug}>{b.name}</option>));
                                    })()}
                                </select>
                            </div>

                            {/* Custom Badge Assignment */}
                            <div className="detail-section-card">
                                <h4 className="detail-section-title">Özel İkon Rozeti (Yönetici Rozeti)</h4>
                                <select
                                    className="badge-select"
                                    value={user.customBadge?.url || ''}
                                    onChange={(e) => {
                                        const selectedUrl = e.target.value;
                                        const selectedBadge = customBadges.find(b => b.url === selectedUrl);
                                        handleCustomBadgeAssign(
                                            user._id,
                                            selectedBadge ? selectedBadge.url : '',
                                            selectedBadge ? selectedBadge.name : '',
                                            selectedBadge ? (selectedBadge.shape || 'round') : 'round',
                                            selectedBadge ? (selectedBadge.borderStyle || 'thin') : 'thin'
                                        );
                                    }}
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                                >
                                    <option value="">Rozet Yok</option>
                                    {customBadges.map((badge) => (
                                        <option key={badge._id} value={badge.url}>
                                            {badge.name}
                                        </option>
                                    ))}
                                </select>
                                {user.customBadge?.url && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '13px', color: '#888' }}>Mevcut:</span>
                                        <span
                                            className={`custom-badge-frame shape-${user.customBadge.shape || 'round'} border-${user.customBadge.borderStyle || 'thin'}`}
                                            style={{ width: '22px', height: '22px' }}
                                        >
                                            <img src={user.customBadge.url} alt={user.customBadge.name} className="custom-badge-icon" />
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#fff' }}>{user.customBadge.name}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Security Info (IP & Device info) */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Güvenlik Bilgisi</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#ccc' }}>
                            <div>
                                <span style={{ color: '#666' }}>Son IP Adresi: </span>
                                <strong style={{ fontFamily: 'monospace' }}>{user.lastIP || 'Kayıtlı Değil'}</strong>
                            </div>
                            {user.isBanned && (
                                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginTop: '4px' }}>
                                    <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '4px' }}>⚠️ Hesap Engellendi (Ban)</div>
                                    <div style={{ fontSize: '12px' }}><span style={{ color: '#888' }}>Sebep:</span> {user.banReason || 'Belirtilmedi'}</div>
                                    <div style={{ fontSize: '12px' }}><span style={{ color: '#888' }}>Bitiş:</span> {user.banExpiresAt ? new Date(user.banExpiresAt).toLocaleString() : 'Kalıcı / Süresiz'}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hesap Kurtarma Talebi */}
                    {user.recoveryStatus === 'pending' && hasPerm('canManageRecovery') && (
                        <div className="detail-section-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.04)' }}>
                            <h4 className="detail-section-title" style={{ color: '#ef4444' }}>⏳ Hesap Kurtarma Talebi</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#ccc' }}>
                                <div>
                                    <span style={{ color: '#888', display: 'block', marginBottom: '2px' }}>Kurtarma Gerekçesi:</span>
                                    <strong style={{ fontSize: '14px', color: '#fff' }}>{user.recoveryReason || 'Gerekçe belirtilmemiş.'}</strong>
                                </div>
                                {user.securityAnswers && user.securityAnswers.length > 0 && (
                                    <div>
                                        <span style={{ color: '#888', display: 'block', marginBottom: '6px' }}>Güvenlik Soruları & Cevapları:</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            {user.securityAnswers.map((item, idx) => (
                                                <div key={idx} style={{ borderBottom: idx < user.securityAnswers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: idx < user.securityAnswers.length - 1 ? '6px' : 0 }}>
                                                    <div style={{ color: '#aaa', fontSize: '12px' }}>Soru: {item.question}</div>
                                                    <div style={{ color: '#4ade80', fontWeight: '600', marginTop: '2px' }}>Cevap: {item.answer}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        onClick={() => handleApproveRecovery(user._id)}
                                        style={{
                                            flex: 1,
                                            background: '#22c55e',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Talebi Onayla (Hesabı Aç)
                                    </button>
                                    <button
                                        onClick={() => handleRejectRecovery(user._id)}
                                        style={{
                                            flex: 1,
                                            background: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Talebi Reddet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Operations */}
                    {(hasPerm('canBanUsers') || (isOxypace && user.username !== 'oxypace')) && (
                        <div className="detail-section-card">
                            <h4 className="detail-section-title">Yönetim Eylemleri</h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {hasPerm('canBanUsers') && (
                                    user.isBanned ? (
                                        <button 
                                            className="btn-modern-primary"
                                            onClick={() => handleUnbanUser(user._id)}
                                            style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid #4ade80', textTransform: 'none', padding: '10px 16px' }}
                                        >
                                            Engeli Kaldır
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn-modern-primary"
                                            onClick={() => {
                                                setBanModalTarget({ type: 'user', id: user._id });
                                                setBanModalOpen(true);
                                            }}
                                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #f87171', textTransform: 'none', padding: '10px 16px' }}
                                        >
                                            Kullanıcıyı Engelle
                                        </button>
                                    )
                                )}

                                {isOxypace && user.username !== 'oxypace' && (
                                    <button
                                        className="btn-modern-primary"
                                        onClick={() => handleImpersonate(user._id)}
                                        style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid #6366f1', textTransform: 'none', padding: '10px 16px' }}
                                    >
                                        👤 Taklit Et (Ghost Mode)
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer-modern" style={{ padding: '10px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button type="button" className="btn-modern-ghost" onClick={onClose}>
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};


const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

export const ADMIN_MODULES = [
    // Kategori 1: Genel Bakış & Talepler
    {
        id: 'requests',
        category: 'overview',
        categoryLabel: '📊 Genel Bakış & Talepler',
        label: 'Başvurular',
        desc: 'Portal ve kullanıcı rozet başvuru incelemeleri',
        icon: '📋',
        hasDetails: true,
        detailsLabel: 'Açılır Pencere Başvuru Detayları'
    },
    {
        id: 'recovery',
        category: 'overview',
        categoryLabel: '📊 Genel Bakış & Talepler',
        label: 'Kurtarma Talepleri',
        desc: 'Kullanıcı hesap kurtarma ve güvenlik incelemeleri',
        icon: '🔑',
        hasDetails: true,
        detailsLabel: 'Açılır Pencere Kurtarma Detayları'
    },
    {
        id: 'feedback',
        category: 'overview',
        categoryLabel: '📊 Genel Bakış & Talepler',
        label: 'Talepler / Geri Bildirim',
        desc: 'Kullanıcı destek, geri bildirim ve talep mesajları',
        icon: '💬',
        hasDetails: true,
        detailsLabel: 'Açılır Pencere Geri Bildirim Detayları'
    },

    // Kategori 2: Kullanıcı Yönetimi
    {
        id: 'users',
        category: 'users',
        categoryLabel: '👥 Kullanıcı Yönetimi',
        label: 'Kullanıcılar',
        desc: 'Kullanıcı listesi, profil, şecere ve hesap yönetimi',
        icon: '👥',
        hasDetails: true,
        detailsLabel: 'Kullanıcı Detay Açılır Penceresi (IP, Oturum & Cihaz)',
        customSubPerms: [
            { key: 'canBan', label: 'Kullanıcıyı Engelleme / Ban Yetkisi' },
            { key: 'canManageBadges', label: 'Rozet Atama / Değiştirme Yetkisi' }
        ]
    },
    {
        id: 'activity',
        category: 'users',
        categoryLabel: '👥 Kullanıcı Yönetimi',
        label: 'Platform Günlüğü & Oturumlar',
        desc: '7 kategorili canlı telemetri, IP ve sistem günlüğü',
        icon: '📜',
        hasDetails: true,
        detailsLabel: 'Adli Log İnceleme Açılır Penceresi (Ham JSON & GeoIP)',
        customSubPerms: [
            { key: 'canExport', label: 'Log Dışa Aktarma (CSV / JSON)' }
        ]
    },
    {
        id: 'ipbans',
        category: 'users',
        categoryLabel: '👥 Kullanıcı Yönetimi',
        label: 'IP Engelleri',
        desc: 'Zararlı IP adreslerini engelleme ve engel kaldırma',
        icon: '🚫',
        hasDetails: false
    },
    {
        id: 'badges',
        category: 'users',
        categoryLabel: '👥 Kullanıcı Yönetimi',
        label: 'Rozetler',
        desc: 'Platform doğrulama rozetleri listesi ve yönetimi',
        icon: '🎖️',
        hasDetails: false
    },
    {
        id: 'custom-badges',
        category: 'users',
        categoryLabel: '👥 Kullanıcı Yönetimi',
        label: 'Özel İkon Rozetler',
        desc: 'Görsel yönetici rozet yükleme ve stüdyo',
        icon: '🏷️',
        hasDetails: false
    },
    {
        id: 'bots',
        category: 'users',
        categoryLabel: '👥 Kullanıcı Yönetimi',
        label: 'Bot Yönetimi',
        desc: 'Sistem botları, RSS entegrasyonu ve otomatik akış',
        icon: '🤖',
        hasDetails: true,
        detailsLabel: 'Bot Token & Gizli Anahtar Detay Penceresi'
    },

    // Kategori 3: İçerik & Sistem
    {
        id: 'portals',
        category: 'system',
        categoryLabel: '🌐 İçerik & Sistem',
        label: 'Portallar',
        desc: 'Portal denetimi, dondurma, silme ve kanal yönetimi',
        icon: '🌐',
        hasDetails: true,
        detailsLabel: 'Portal Detay Açılır Penceresi (Kanal ve Üye Listesi)'
    },
    {
        id: 'blog',
        category: 'system',
        categoryLabel: '🌐 İçerik & Sistem',
        label: 'Blog Yönetimi',
        desc: 'Bilim ve teknoloji makaleleri yazma, yayınlama ve düzenleme',
        icon: '✍️',
        hasDetails: true,
        detailsLabel: 'Makale Önizleme ve Taslak Detayları'
    },
    {
        id: 'reports',
        category: 'system',
        categoryLabel: '🌐 İçerik & Sistem',
        label: 'Bildirilenler / Şikayetler',
        desc: 'Kullanıcı ve gönderi şikayetleri moderasyonu',
        icon: '🛡️',
        hasDetails: true,
        detailsLabel: 'Şikayet Edilen İçerik/Kullanıcı Detay Açılır Penceresi'
    },
    {
        id: 'mass-notification',
        category: 'system',
        categoryLabel: '🌐 İçerik & Sistem',
        label: 'Toplu Bildirim Gönder',
        desc: 'Tüm kullanıcılara push bildirim ve sistem duyurusu iletme',
        icon: '📢',
        hasDetails: false
    },
    {
        id: 'mobile-designs',
        category: 'system',
        categoryLabel: '🌐 İçerik & Sistem',
        label: 'Mobil Tasarım Barındırma',
        desc: 'Mobil arayüz tasarımlarını inceleme ve vitrin',
        icon: '📱',
        hasDetails: false
    },
    {
        id: 'mobile-versions',
        category: 'system',
        categoryLabel: '🌐 İçerik & Sistem',
        label: 'Mobil Sürüm Günlüğü',
        desc: 'Android APK sürüm geçmişi ve güncelleme notları',
        icon: '⏱️',
        hasDetails: false
    }
];

export const getDefaultModulePermissions = (preset = 'none') => {
    const state = {};
    ADMIN_MODULES.forEach(mod => {
        state[mod.id] = {
            access: preset === 'full' ? 'full' : (preset === 'view' ? 'view' : 'none'),
            canViewDetails: preset !== 'none',
            canBan: preset === 'full',
            canManageBadges: preset === 'full',
            canExport: preset === 'full'
        };
    });
    return state;
};

export const parseExistingPermissions = (perms = {}) => {
    const state = {};
    const hasModules = perms && perms.modules && typeof perms.modules === 'object';
    ADMIN_MODULES.forEach(mod => {
        if (hasModules && perms.modules[mod.id]) {
            state[mod.id] = {
                access: perms.modules[mod.id].access || 'none',
                canViewDetails: perms.modules[mod.id].canViewDetails !== false,
                canBan: !!perms.modules[mod.id].canBan,
                canManageBadges: !!perms.modules[mod.id].canManageBadges,
                canExport: !!perms.modules[mod.id].canExport
            };
        } else {
            const legMap = {
                'requests': perms?.canManageRequests,
                'recovery': perms?.canManageRecovery,
                'feedback': perms?.canManageFeedback,
                'users': perms?.canManageUsers,
                'activity': perms?.canViewLogs,
                'ipbans': perms?.canBanUsers,
                'badges': perms?.canManageBadges,
                'custom-badges': perms?.canManageBadges,
                'bots': perms?.canManageBots,
                'portals': perms?.canManagePortals,
                'blog': perms?.canManageBlog,
                'reports': perms?.canManageReports,
                'mass-notification': perms?.canSendNotifications || perms?.canManageNotifications,
                'mobile-designs': perms?.canManageMobile || perms?.canManageSystem,
                'mobile-versions': perms?.canManageMobile || perms?.canManageSystem
            };
            const hasLegacy = !!legMap[mod.id];
            state[mod.id] = {
                access: hasLegacy ? 'full' : 'none',
                canViewDetails: hasLegacy,
                canBan: !!perms?.canBanUsers,
                canManageBadges: !!perms?.canManageBadges,
                canExport: !!perms?.canViewLogs
            };
        }
    });
    return state;
};

export const compileTouristPermissions = (modulesMap) => {
    const map = modulesMap || {};
    return {
        canManageRequests: map.requests?.access === 'full',
        canManageRecovery: map.recovery?.access === 'full',
        canManageFeedback: map.feedback?.access === 'full',
        canManageUsers: map.users?.access === 'full',
        canBanUsers: !!(map.users?.canBan || map.ipbans?.access === 'full'),
        canManagePortals: map.portals?.access === 'full',
        canManageReports: map.reports?.access === 'full',
        canManageBadges: !!(map.badges?.access === 'full' || map['custom-badges']?.access === 'full' || map.users?.canManageBadges),
        canManageBots: map.bots?.access === 'full',
        canViewLogs: map.activity?.access !== 'none',
        canSendNotifications: map['mass-notification']?.access === 'full',
        canManageNotifications: map['mass-notification']?.access === 'full',
        canManageBlog: map.blog?.access === 'full',
        canManageMobile: map['mobile-designs']?.access === 'full' || map['mobile-versions']?.access === 'full',
        canManageSystem: map['mobile-designs']?.access === 'full' || map['mobile-versions']?.access === 'full',
        modules: map
    };
};

const AccessDeniedView = ({ moduleTitle, currentUser }) => (
    <div className="admin-access-denied fade-in">
        <div className="access-denied-box">
            <div className="access-denied-icon-wrap">
                <ShieldAlert size={40} />
            </div>
            <h2 className="access-denied-title">Erişim Yetkiniz Bulunmamaktadır</h2>
            <p className="access-denied-desc">
                Bu modülü (<strong>{moduleTitle}</strong>) görüntülemek veya işlem yapmak için yetkilendirilmediniz.
            </p>
            <div className="access-denied-info-card">
                <div className="access-denied-info-row">
                    <span className="info-label">Yetki Seviyesi:</span>
                    <span className="info-value">Turist Admin (Erişim Yok)</span>
                </div>
                {currentUser?.touristAdminExpiresAt && (
                    <div className="access-denied-info-row">
                        <span className="info-label">Yetki Bitiş Tarihi:</span>
                        <span className="info-value">{new Date(currentUser.touristAdminExpiresAt).toLocaleString('tr-TR')}</span>
                    </div>
                )}
            </div>
            <p className="access-denied-contact">
                Erişim izni veya yetki yükseltme talebinde bulunmak için lütfen Baş Yönetici <strong>@oxypace</strong> ile iletişime geçin.
            </p>
        </div>
    </div>
);

const ReadOnlyBanner = ({ moduleTitle }) => (
    <div className="readonly-mode-banner fade-in">
        <Eye size={18} />
        <span>
            <strong>{moduleTitle}</strong> modülünde <u>Sadece Görüntüleme</u> yetkisine sahipsiniz. Veri ekleme, düzenleme, silme ve yönetim aksiyonları kısıtlanmıştır.
        </span>
    </div>
);

const TouristPermissionStudio = ({ modulesState, onChange }) => {
    const handleSetAll = (preset) => {
        onChange(getDefaultModulePermissions(preset));
    };

    const handleApplyPreset = (presetName) => {
        const next = getDefaultModulePermissions('none');
        if (presetName === 'mod') {
            next.users = { access: 'full', canViewDetails: true, canBan: true, canManageBadges: false };
            next.portals = { access: 'full', canViewDetails: true };
            next.reports = { access: 'full', canViewDetails: true };
            next.blog = { access: 'full', canViewDetails: true };
            next.ipbans = { access: 'full', canViewDetails: false };
            next.activity = { access: 'view', canViewDetails: true, canExport: false };
        } else if (presetName === 'support') {
            next.requests = { access: 'full', canViewDetails: true };
            next.recovery = { access: 'full', canViewDetails: true };
            next.feedback = { access: 'full', canViewDetails: true };
            next.reports = { access: 'view', canViewDetails: true };
            next.users = { access: 'view', canViewDetails: true, canBan: false, canManageBadges: false };
        }
        onChange(next);
    };

    const handleAccessChange = (modId, newAccess) => {
        const current = modulesState[modId] || { access: 'none', canViewDetails: false };
        const isFull = newAccess === 'full';
        const isView = newAccess === 'view';
        onChange({
            ...modulesState,
            [modId]: {
                ...current,
                access: newAccess,
                canViewDetails: newAccess !== 'none',
                canBan: isFull ? true : false,
                canManageBadges: isFull ? true : false,
                canExport: isFull ? true : false
            }
        });
    };

    const handleSubPermToggle = (modId, key) => {
        const current = modulesState[modId] || { access: 'none', canViewDetails: false };
        onChange({
            ...modulesState,
            [modId]: {
                ...current,
                [key]: !current[key]
            }
        });
    };

    const categories = [
        { id: 'overview', title: '📊 Genel Bakış & Talepler' },
        { id: 'users', title: '👥 Kullanıcı Yönetimi' },
        { id: 'system', title: '🌐 İçerik & Sistem' }
    ];

    return (
        <div className="tourist-permission-studio">
            <div className="studio-header-area">
                <div className="studio-header-title">
                    <span>🛡️ Modül Yetkilendirme & Detay İzinleri</span>
                </div>
                <div className="studio-presets-bar">
                    <button type="button" className="studio-preset-btn btn-preset-full" onClick={() => handleSetAll('full')}>
                        ⚡ Tümüne Tam Yetki
                    </button>
                    <button type="button" className="studio-preset-btn" onClick={() => handleSetAll('view')}>
                        👁️ Tümünü Sadece Görüntüle
                    </button>
                    <button type="button" className="studio-preset-btn" onClick={() => handleApplyPreset('mod')}>
                        🛡️ Şablon: Moderatör
                    </button>
                    <button type="button" className="studio-preset-btn" onClick={() => handleApplyPreset('support')}>
                        💬 Şablon: Destek & Başvuru
                    </button>
                    <button type="button" className="studio-preset-btn btn-preset-reset" onClick={() => handleSetAll('none')}>
                        🚫 Tümünü Sıfırla
                    </button>
                </div>
            </div>

            <div className="studio-categories-container">
                {categories.map(cat => {
                    const catMods = ADMIN_MODULES.filter(m => m.category === cat.id);
                    return (
                        <div key={cat.id} className="studio-category-group">
                            <div className="studio-category-group-title">
                                <span>{cat.title}</span>
                            </div>
                            <div className="studio-modules-list">
                                {catMods.map(mod => {
                                    const mState = modulesState[mod.id] || { access: 'none', canViewDetails: false };
                                    const acc = mState.access || 'none';
                                    return (
                                        <div key={mod.id} className={`studio-module-card state-${acc}`}>
                                            <div className="module-row-top">
                                                <div className="module-meta-info">
                                                    <strong>{mod.icon} {mod.label}</strong>
                                                    <span>{mod.desc}</span>
                                                </div>
                                                <div className="module-segmented-control">
                                                    <button
                                                        type="button"
                                                        className={`segmented-btn opt-none ${acc === 'none' ? 'active' : ''}`}
                                                        onClick={() => handleAccessChange(mod.id, 'none')}
                                                    >
                                                        🚫 Erişim Yok
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`segmented-btn opt-view ${acc === 'view' ? 'active' : ''}`}
                                                        onClick={() => handleAccessChange(mod.id, 'view')}
                                                    >
                                                        👁️ Sadece Görüntüle
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`segmented-btn opt-full ${acc === 'full' ? 'active' : ''}`}
                                                        onClick={() => handleAccessChange(mod.id, 'full')}
                                                    >
                                                        ⚡ Tam Yetki
                                                    </button>
                                                </div>
                                            </div>

                                            {acc !== 'none' && (mod.hasDetails || mod.customSubPerms) && (
                                                <div className="module-sub-perms-box fade-in">
                                                    {mod.hasDetails && (
                                                        <label className="sub-perm-toggle-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={mState.canViewDetails !== false}
                                                                onChange={() => handleSubPermToggle(mod.id, 'canViewDetails')}
                                                            />
                                                            <span>🔍 {mod.detailsLabel || 'Açılır Pencere Detaylarına Erişim'}</span>
                                                        </label>
                                                    )}
                                                    {mod.customSubPerms && mod.customSubPerms.map(sub => (
                                                        <label key={sub.key} className="sub-perm-toggle-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!mState[sub.key]}
                                                                onChange={() => handleSubPermToggle(mod.id, sub.key)}
                                                            />
                                                            <span>⚙️ {sub.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TAB_PERMISSION_MAP = {
    'requests': 'canManageRequests',
    'recovery': 'canManageRecovery',
    'feedback': 'canManageFeedback',
    'users': 'canManageUsers',
    'activity': 'canViewLogs',
    'ipbans': 'canBanUsers',
    'badges': 'canManageBadges',
    'custom-badges': 'canManageBadges',
    'bots': 'canManageBots',
    'portals': 'canManagePortals',
    'blog': 'canManageBlog',
    'reports': 'canManageReports',
    'mass-notification': 'canSendNotifications',
    'mobile-designs': 'canManageMobile',
    'mobile-versions': 'canManageMobile',
    'tourist-admin': null // only isOxypace
};

const AdminDashboard = () => {
    const { user: currentUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const isOxypace = currentUser && currentUser.username === 'oxypace';
    const isFullAdmin = isOxypace || (currentUser?.isAdmin && !currentUser?.isTouristAdmin);
    const isTouristAdmin = !!currentUser?.isTouristAdmin;
    const isAdmin = currentUser && (currentUser.isAdmin || currentUser.isTouristAdmin || currentUser.username === 'oxypace');

    // Live Tourist Admin Permissions state (synced via WebSocket and fresh fetch on mount)
    const [liveTouristPerms, setLiveTouristPerms] = useState(currentUser?.touristAdminPermissions || {});

    // Always fetch fresh permissions on mount to avoid stale localStorage cache
    useEffect(() => {
        let isMounted = true;
        const fetchFreshPermissions = async () => {
            try {
                const res = await axios.get('/api/admin/my-permissions');
                if (!isMounted || !res.data) return;
                const { isTouristAdmin: serverIsTourist, permissions: serverPerms, expiresAt } = res.data;
                if (serverPerms) {
                    setLiveTouristPerms(serverPerms);
                }
                if (updateUser) {
                    updateUser({
                        isTouristAdmin: serverIsTourist,
                        touristAdminPermissions: serverPerms,
                        touristAdminExpiresAt: expiresAt
                    });
                }
            } catch (err) {
                // If endpoint fails, keep using cached context
            }
        };

        if (isAdmin) {
            fetchFreshPermissions();
        }

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (currentUser?.touristAdminPermissions) {
            setLiveTouristPerms(currentUser.touristAdminPermissions);
        }
    }, [currentUser]);

    // Comprehensive Alias Map between module IDs and legacy keys
    const ALIAS_MAP = {
        'notifications': 'mass-notification',
        'notification': 'mass-notification',
        'mass_notification': 'mass-notification',
        'canSendNotifications': 'mass-notification',
        'canManageNotifications': 'mass-notification',
        'system': 'mobile-designs',
        'mobile': 'mobile-designs',
        'canManageMobile': 'mobile-designs',
        'canManageSystem': 'mobile-designs',
        'badges': 'badges',
        'custom_badges': 'custom-badges',
        'canManageBadges': 'custom-badges',
        'users': 'users',
        'canManageUsers': 'users',
        'canBanUsers': 'users',
        'requests': 'requests',
        'canManageRequests': 'requests',
        'recovery': 'recovery',
        'canManageRecovery': 'recovery',
        'feedback': 'feedback',
        'canManageFeedback': 'feedback',
        'activity': 'activity',
        'canViewLogs': 'activity',
        'ipbans': 'ipbans',
        'ip_bans': 'ipbans',
        'bots': 'bots',
        'canManageBots': 'bots',
        'portals': 'portals',
        'canManagePortals': 'portals',
        'blog': 'blog',
        'canManageBlog': 'blog',
        'reports': 'reports',
        'canManageReports': 'reports'
    };

    // Check granular permission helper (bidirectional)
    const hasPerm = (permKey, level = 'view') => {
        if (isFullAdmin) return true;
        if (!isTouristAdmin) return false;

        const targetMod = ALIAS_MAP[permKey] || permKey;
        const access = getModuleAccess(targetMod);
        if (level === 'view') return access.canView;
        if (level === 'full') return access.canEdit;
        if (level === 'details') return access.canViewDetails;
        if (level === 'canBan') return !!access.custom?.canBan || access.canEdit;
        if (level === 'canManageBadges') return !!access.custom?.canManageBadges || access.canEdit;
        if (level === 'canExport') return !!access.custom?.canExport || access.canEdit;

        return !!liveTouristPerms[permKey];
    };

    // Granular Module-Level Access Control Helper
    const getModuleAccess = (moduleId) => {
        if (isOxypace || (currentUser?.isAdmin && !isTouristAdmin)) {
            return { 
                access: 'full', 
                canView: true, 
                canEdit: true, 
                canViewDetails: true, 
                custom: { canBan: true, canManageBadges: true, canExport: true } 
            };
        }
        if (!isTouristAdmin) {
            return { access: 'none', canView: false, canEdit: false, canViewDetails: false, custom: {} };
        }

        const canonicalId = ALIAS_MAP[moduleId] || moduleId;
        const perms = liveTouristPerms || {};
        const mod = perms.modules?.[canonicalId] || perms.modules?.[moduleId];

        if (mod) {
            const access = mod.access || 'none';
            return {
                access,
                canView: access === 'view' || access === 'full',
                canEdit: access === 'full',
                canViewDetails: access !== 'none' && mod.canViewDetails !== false,
                custom: {
                    canBan: mod.canBan !== undefined ? !!mod.canBan : (access === 'full'),
                    canManageBadges: mod.canManageBadges !== undefined ? !!mod.canManageBadges : (access === 'full'),
                    canExport: mod.canExport !== undefined ? !!mod.canExport : (access === 'full')
                }
            };
        }

        // Fallback for legacy boolean structure
        const legacyKeyMap = {
            'requests': 'canManageRequests',
            'recovery': 'canManageRecovery',
            'feedback': 'canManageFeedback',
            'users': 'canManageUsers',
            'activity': 'canViewLogs',
            'ipbans': 'canBanUsers',
            'badges': 'canManageBadges',
            'custom-badges': 'canManageBadges',
            'bots': 'canManageBots',
            'portals': 'canManagePortals',
            'blog': 'canManageBlog',
            'reports': 'canManageReports',
            'mass-notification': 'canSendNotifications',
            'mobile-designs': 'canManageMobile',
            'mobile-versions': 'canManageMobile'
        };

        const legKey = legacyKeyMap[canonicalId] || legacyKeyMap[moduleId];
        const hasLegacy = legKey ? (!!perms[legKey] || (legKey === 'canSendNotifications' && !!perms.canManageNotifications)) : false;

        return {
            access: hasLegacy ? 'full' : 'none',
            canView: hasLegacy,
            canEdit: hasLegacy,
            canViewDetails: hasLegacy,
            custom: {
                canBan: !!perms.canBanUsers,
                canManageBadges: !!perms.canManageBadges,
                canExport: !!perms.canViewLogs
            }
        };
    };

    // Module Title Helper
    const getModuleTitle = (modId) => {
        const canonical = ALIAS_MAP[modId] || modId;
        const found = ADMIN_MODULES.find(m => m.id === canonical || m.id === modId);
        return found ? found.label : modId;
    };

    // Calculate first permitted tab for the current admin/tourist admin
    const getFirstPermittedTab = () => {
        if (isFullAdmin) return 'requests';
        const candidateTabs = [
            'requests', 'recovery', 'feedback', 'users', 'activity', 
            'ipbans', 'badges', 'custom-badges', 'bots', 'portals', 
            'blog', 'reports', 'mass-notification', 'mobile-designs', 'mobile-versions'
        ];
        for (const tab of candidateTabs) {
            const access = getModuleAccess(tab);
            if (access.canView) {
                return tab;
            }
        }
        return 'no-permissions';
    };

    // Forbidden UI for non-admins
    if (!isAdmin) {
        return (
            <div className="forbidden-container fade-in">
                <div className="forbidden-content">
                    <div className="forbidden-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            <path d="M12 8v4" />
                            <path d="M12 16h.01" />
                        </svg>
                    </div>
                    <h1 className="forbidden-title">403</h1>
                    <h2 className="forbidden-subtitle">Yetkisiz Erişim</h2>
                    <p className="forbidden-text">
                        Bu sayfayı görüntülemek için sistem yöneticisi yetkisine sahip olmalısınız. Yanlış bir bağlantıya tıklamış olabilirsiniz.
                    </p>
                    <button className="forbidden-back-btn" onClick={() => navigate(-1)}>
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState(getFirstPermittedTab());
    const [maintenanceActive, setMaintenanceActive] = useState(false);
    const [requests, setRequests] = useState([]);
    const [recoveryRequests, setRecoveryRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [userAccountTypeFilter, setUserAccountTypeFilter] = useState('all');
    const [portals, setPortals] = useState([]);
    const [searchTermPortal, setSearchTermPortal] = useState('');

    // User Dossier (Şecere) State
    const [userDossierOpen, setUserDossierOpen] = useState(false);
    const [userDossierData, setUserDossierData] = useState(null);
    const [loadingDossier, setLoadingDossier] = useState(false);

    // User Posts Inspector State
    const [userPostsOpen, setUserPostsOpen] = useState(false);
    const [userPostsData, setUserPostsData] = useState([]);
    const [userPostsUser, setUserPostsUser] = useState(null);
    const [userPostsSearch, setUserPostsSearch] = useState('');
    const [loadingUserPosts, setLoadingUserPosts] = useState(false);

    // Portal Posts Inspector State
    const [portalPostsOpen, setPortalPostsOpen] = useState(false);
    const [portalPostsData, setPortalPostsData] = useState([]);
    const [selectedPortalForPosts, setSelectedPortalForPosts] = useState(null);
    const [portalPostsChannelFilter, setPortalPostsChannelFilter] = useState('all');
    const [portalPostsSearch, setPortalPostsSearch] = useState('');
    const [loadingPortalPosts, setLoadingPortalPosts] = useState(false);

    // Platform Activity Logs (Platform Günlüğü) State
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityLogsTotal, setActivityLogsTotal] = useState(0);
    const [activityLogsPage, setActivityLogsPage] = useState(1);
    const [activityLogsLoading, setActivityLogsLoading] = useState(false);
    const [activityLogsSearch, setActivityLogsSearch] = useState('');
    const [activityLogsCategory, setActivityLogsCategory] = useState('all');
    const [activityLogsSeverity, setActivityLogsSeverity] = useState('all');
    const [activityViewMode, setActivityViewMode] = useState('logs'); // 'logs' or 'live'
    const [activityLiveEnabled, setActivityLiveEnabled] = useState(true);
    const [activityStats, setActivityStats] = useState(null);
    const [activityStatsLoading, setActivityStatsLoading] = useState(false);
    const [inspectingLog, setInspectingLog] = useState(null);
    const [copiedJson, setCopiedJson] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [showRawJson, setShowRawJson] = useState(false);
    const [mediaLightbox, setMediaLightbox] = useState(null); // { url, title, date }

    // Tourist Admin Granular Modules Permission State
    const [touristModulesState, setTouristModulesState] = useState(() => getDefaultModulePermissions('none'));
    const [editingModulesState, setEditingModulesState] = useState(() => getDefaultModulePermissions('none'));
    const [editPermissionsModalOpen, setEditPermissionsModalOpen] = useState(false);
    const [editingTouristAdmin, setEditingTouristAdmin] = useState(null);
    const [editExpiryOption, setEditExpiryOption] = useState('keep'); // 'keep', 'extend', 'custom'
    const [editExtendHours, setEditExtendHours] = useState(24);
    const [editCustomDate, setEditCustomDate] = useState('');

    // On-screen Unauthorized Action Warning Alert State
    const [unauthorizedAlert, setUnauthorizedAlert] = useState({
        show: false,
        title: 'Yetkisiz Eylem',
        message: '',
        requiredLevel: '',
        moduleName: ''
    });

    const triggerUnauthorizedWarning = (message, title = 'Yetkisiz Eylem', requiredLevel = '', moduleName = '') => {
        setUnauthorizedAlert({
            show: true,
            title,
            message: message || 'Bu işlem veya modül için yetkiniz bulunmamaktadır.',
            requiredLevel,
            moduleName
        });
    };

    // Auto-dismiss unauthorized alert
    useEffect(() => {
        if (unauthorizedAlert.show) {
            const timer = setTimeout(() => {
                setUnauthorizedAlert(prev => ({ ...prev, show: false }));
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [unauthorizedAlert.show]);

    // Local Axios Response Interceptor for 403 Forbidden warnings
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 403) {
                    const data = error.response.data;
                    if (!data?.isBanned) {
                        const msg = data?.message || 'Bu işlem veya modül için yetkiniz bulunmamaktadır.';
                        triggerUnauthorizedWarning(msg, 'Yetkisiz Eylem', data?.requiredLevel || '', data?.requiredPermission || '');
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    // Action permission guard helper
    const checkActionPerm = (moduleId, requiredLevel = 'full', actionName = 'Bu işlem') => {
        if (isFullAdmin) return true;
        const access = getModuleAccess(moduleId);
        if (!access.canView) {
            triggerUnauthorizedWarning(`"${getModuleTitle(moduleId)}" modülüne erişim yetkiniz bulunmamaktadır.`, 'Yetkisiz Eylem', 'Erişim İzni', getModuleTitle(moduleId));
            return false;
        }
        if (requiredLevel === 'full' && !access.canEdit) {
            triggerUnauthorizedWarning(`${actionName} için tam yönetim yetkisi gereklidir. Yalnızca izleme (salt okunur) yetkiniz bulunmaktadır.`, 'Yetkisiz Eylem', 'Tam Yetki', getModuleTitle(moduleId));
            return false;
        }
        if (requiredLevel === 'canBan' && !access.custom?.canBan && access.access !== 'full') {
            triggerUnauthorizedWarning(`Kullanıcı engelleme veya ceza işlemi yetkiniz kısıtlanmıştır.`, 'Yetkisiz Eylem', 'Engelleme / Ban Yetkisi', 'Kullanıcılar');
            return false;
        }
        if (requiredLevel === 'canManageBadges' && !access.custom?.canManageBadges && access.access !== 'full') {
            triggerUnauthorizedWarning(`Rozet atama veya değiştirme yetkiniz bulunmamaktadır.`, 'Yetkisiz Eylem', 'Rozet Atama Yetkisi', 'Rozetler');
            return false;
        }
        if (requiredLevel === 'canExport' && !access.custom?.canExport && access.access !== 'full') {
            triggerUnauthorizedWarning(`Logları dışa aktarma (export) yetkiniz kısıtlanmıştır.`, 'Yetkisiz Eylem', 'Log Dışa Aktarma Yetkisi', 'Platform Günlüğü');
            return false;
        }
        if (requiredLevel === 'details' && !access.canViewDetails) {
            triggerUnauthorizedWarning(`Açılır pencere detaylarını inceleme yetkiniz kısıtlanmıştır.`, 'Yetkisiz Eylem', 'Detay İnceleme İzni', getModuleTitle(moduleId));
            return false;
        }
        return true;
    };

    const handleNavTabClick = (tabId, label) => {
        setSidebarOpen(false);
        if (isTouristAdmin && !isFullAdmin) {
            const access = getModuleAccess(tabId);
            if (!access.canView) {
                triggerUnauthorizedWarning(
                    `"${label}" modülüne erişim yetkiniz bulunmamaktadır. Bu sekme kilitlidir.`,
                    'Yetkisiz Eylem',
                    'İzleme veya Tam Yetki',
                    label
                );
                setActiveTab(tabId);
                return;
            }
        }
        setActiveTab(tabId);
    };

    // Custom badges state
    const [customBadges, setCustomBadges] = useState([]);
    const [customBadgeName, setCustomBadgeName] = useState('');
    const [customBadgeUploadedKey, setCustomBadgeUploadedKey] = useState('');
    const [customBadgeUploadedUrl, setCustomBadgeUploadedUrl] = useState('');
    const [uploadingCustomBadge, setUploadingCustomBadge] = useState(false);
    const [customBadgeShape, setCustomBadgeShape] = useState('round');
    const [customBadgeBorderStyle, setCustomBadgeBorderStyle] = useState('thin');
    const [editingCustomBadgeId, setEditingCustomBadgeId] = useState(null);

    // Cropper State for Custom Badges
    const [customBadgeCropperImage, setCustomBadgeCropperImage] = useState(null);
    const [customBadgeCropperFile, setCustomBadgeCropperFile] = useState(null);
    const [customBadgeCropperAspectRatio, setCustomBadgeCropperAspectRatio] = useState(1.0);

    // Reports State (Oxypace Only)
    const [reports, setReports] = useState([]);
    const [reportFilter, setReportFilter] = useState('pending');

    // Active Sessions & Banned IPs State
    const { socket, connected } = useSocket();
    const [activeSessions, setActiveSessions] = useState([]);
    const [bannedIps, setBannedIps] = useState([]);
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [banModalTarget, setBanModalTarget] = useState({ type: 'user', id: '', extraData: '' }); // type can be 'user' or 'ip'

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPortalId, setSelectedPortalId] = useState(null);
    const [modalAction, setModalAction] = useState('');

    // Alert Modal State
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertPortalId, setAlertPortalId] = useState(null);
    const [alertPortalName, setAlertPortalName] = useState('');

    // Blog Management State
    const [blogPosts, setBlogPosts] = useState([]);
    const [blogLoading, setBlogLoading] = useState(false);
    const [blogSearch, setBlogSearch] = useState('');
    const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
    const [blogStatusFilter, setBlogStatusFilter] = useState('all');
    const [blogModalOpen, setBlogModalOpen] = useState(false);
    const [editingBlogPost, setEditingBlogPost] = useState(null);
    const [blogEditorMode, setBlogEditorMode] = useState('write');
    const [blogSaving, setBlogSaving] = useState(false);
    const [uploadingBlogImage, setUploadingBlogImage] = useState(false);
    const [blogForm, setBlogForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Teorik Fizik',
        readTime: '',
        image: '',
        isPublished: true,
    });

    // Calculation Tools Management State
    const [calcToolsModalOpen, setCalcToolsModalOpen] = useState(false);
    const [calcToolsList, setCalcToolsList] = useState([]);
    const [calcToolsLoading, setCalcToolsLoading] = useState(false);
    const [editingCalcTool, setEditingCalcTool] = useState(null);
    const [calcToolImageUrl, setCalcToolImageUrl] = useState('');
    const [uploadingCalcToolImage, setUploadingCalcToolImage] = useState(false);
    const [calcToolSaving, setCalcToolSaving] = useState(false);

    // Badge Studio State
    const { badges: contextBadges, refreshBadges } = useBadges();
    const [allBadges, setAllBadges] = useState([]);
    const [badgeModalOpen, setBadgeModalOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [badgeFilter, setBadgeFilter] = useState('all'); // 'all', 'x_official', 'user', 'portal'
    const [badgeSearch, setBadgeSearch] = useState('');
    const [badgeCanvasBg, setBadgeCanvasBg] = useState('dark'); // 'dark' | 'light'
    const [badgeForm, setBadgeForm] = useState({
        name: '',
        slug: '',
        shape: 'rosette',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#1d9bf0',
            secondaryColor: '#f59e0b',
            gradientAngle: 135,
            metallicType: 'gold',
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: '',
            borderStyle: 'none',
        },
    });

    // Direct Badge Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignTargetBadge, setAssignTargetBadge] = useState(null);
    const [assignType, setAssignType] = useState('user'); // 'user' | 'portal'
    const [assignQuery, setAssignQuery] = useState('');
    const [assignResults, setAssignResults] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignSuccessMsg, setAssignSuccessMsg] = useState('');

    // Feedback Modal State
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [feedbackFilter, setFeedbackFilter] = useState('new'); // 'new', 'replied', 'all'

    // Portal Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailPortal, setDetailPortal] = useState(null);
    const [loadingPortalDossier, setLoadingPortalDossier] = useState(false);
    const [ownershipTarget, setOwnershipTarget] = useState('');
    const [transferring, setTransferring] = useState(false);

    // User Detail Modal State
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);


    // Feedbacks State
    const [feedbacks, setFeedbacks] = useState([]);
    const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

    // Tourist Admin State
    const [touristAdmins, setTouristAdmins] = useState([]);
    const [touristSearchTerm, setTouristSearchTerm] = useState('');
    const [touristSearchResult, setTouristSearchResult] = useState([]);
    const [selectedTouristUser, setSelectedTouristUser] = useState(null);
    const [touristDurationType, setTouristDurationType] = useState('preset'); // 'preset' or 'custom'
    const [selectedTouristPreset, setSelectedTouristPreset] = useState(2); // hours
    const [customTouristDate, setCustomTouristDate] = useState('');
    const [assigningTourist, setAssigningTourist] = useState(false);
    const [loadingTourist, setLoadingTourist] = useState(false);

    // Mass Notification State
    const [massNotifTitle, setMassNotifTitle] = useState('');
    const [massNotifMessage, setMassNotifMessage] = useState('');
    const [massNotifInApp, setMassNotifInApp] = useState(true);
    const [massNotifPush, setMassNotifPush] = useState(false);
    const [massNotifSending, setMassNotifSending] = useState(false);
    const [massNotifStatus, setMassNotifStatus] = useState({ type: '', text: '' });
    const [massNotifImage, setMassNotifImage] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Desktop Site View Mode on Mobile State
    const [desktopSiteMode, setDesktopSiteMode] = useState(() => {
        try {
            return localStorage.getItem('adminDesktopSiteMode') === 'true';
        } catch {
            return false;
        }
    });

    const [isMobileScreen, setIsMobileScreen] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobileScreen(window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Manage viewport meta tag & forced classes for desktop view mode with pinch-to-zoom support
    useEffect(() => {
        const defaultViewport = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content';
        const desktopViewport = 'width=1280, initial-scale=0.32, minimum-scale=0.15, maximum-scale=5.0, user-scalable=yes';

        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }

        if (desktopSiteMode) {
            meta.setAttribute('content', desktopViewport);
            document.documentElement.classList.add('admin-forced-desktop-mode');
            document.body.classList.add('admin-forced-desktop-mode');
            try { localStorage.setItem('adminDesktopSiteMode', 'true'); } catch {}
        } else {
            meta.setAttribute('content', defaultViewport);
            document.documentElement.classList.remove('admin-forced-desktop-mode');
            document.body.classList.remove('admin-forced-desktop-mode');
            try { localStorage.setItem('adminDesktopSiteMode', 'false'); } catch {}
        }

        return () => {
            meta.setAttribute('content', defaultViewport);
            document.documentElement.classList.remove('admin-forced-desktop-mode');
            document.body.classList.remove('admin-forced-desktop-mode');
        };
    }, [desktopSiteMode]);

    const toggleDesktopSiteMode = () => {
        setDesktopSiteMode(prev => !prev);
    };

    // Bot Management State
    const [bots, setBots] = useState([]);
    const [searchTermBot, setSearchTermBot] = useState('');
    const [botFormOpen, setBotFormOpen] = useState(false);
    const [newBotData, setNewBotData] = useState({ username: '', email: '', password: '' });
    const [editingBot, setEditingBot] = useState(null);
    const [botPostModalOpen, setBotPostModalOpen] = useState(false);
    const [botPostTarget, setBotPostTarget] = useState(null);
    const [botPostData, setBotPostData] = useState({ content: '', portalId: '', channel: 'general', mediaUrl: '', mediaType: 'image' });
    const [feedInput, setFeedInput] = useState('');

    const handleMassNotifFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const mediaKey = await uploadFile(file, 'post');
            setMassNotifImage(mediaKey);
        } catch (err) {
            console.error('Failed to upload image:', err);
            alert('Görsel yüklenirken bir hata oluştu.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSendMassNotification = async (e) => {
        e.preventDefault();
        if (!checkActionPerm('mass-notification', 'full', 'Toplu bildirim gönderme')) return;
        if (!massNotifTitle.trim() || !massNotifMessage.trim()) {
            setMassNotifStatus({ type: 'error', text: 'Lütfen başlık ve mesaj alanlarını doldurun.' });
            return;
        }
        if (!massNotifInApp && !massNotifPush) {
            setMassNotifStatus({ type: 'error', text: 'Lütfen en az bir gönderim yöntemi seçin.' });
            return;
        }

        setMassNotifSending(true);
        setMassNotifStatus({ type: '', text: '' });

        try {
            const response = await axios.post('/api/admin/mass-notification', {
                title: massNotifTitle.trim(),
                message: massNotifMessage.trim(),
                inApp: massNotifInApp,
                push: massNotifPush,
                imageUrl: massNotifImage.trim() || undefined,
            });

            setMassNotifStatus({
                type: 'success',
                text: response.data.message || 'Toplu bildirim başarıyla gönderildi.'
            });
            setMassNotifTitle('');
            setMassNotifMessage('');
            setMassNotifImage('');
        } catch (err) {
            console.error('Send mass notification error:', err);
            setMassNotifStatus({
                type: 'error',
                text: err.response?.data?.message || 'Bildirim gönderilirken bir hata oluştu.'
            });
        } finally {
            setMassNotifSending(false);
        }
    };

    const fetchCustomBadges = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/custom-badges');
            setCustomBadges(data);
        } catch (err) {
            setError('Özel rozetler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomBadgeFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Dosya boyutu kontrolü (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Rozet görseli boyutu en fazla 10MB olabilir.');
            if (e.target) e.target.value = '';
            return;
        }

        // Dosya tipi kontrolü
        const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(png|gif|jpe?g|webp|svg)$/i);
        if (!isImage) {
            alert('Lütfen geçerli bir görsel dosyası seçin (PNG, GIF, JPEG veya WebP).');
            if (e.target) e.target.value = '';
            return;
        }

        setUploadingCustomBadge(true);
        try {
            // PNG şeffaflığı ve GIF animasyonu tam korunarak doğrudan yüklenir
            const mediaKey = await uploadFile(file, 'avatar');
            setCustomBadgeUploadedKey(mediaKey);
            setCustomBadgeUploadedUrl(getImageUrl(mediaKey));
            setCustomBadgeCropperFile(file);
        } catch (err) {
            console.error('Custom badge upload error:', err);
            alert(err.response?.data?.message || err.message || 'Görsel yüklenirken bir hata oluştu.');
        } finally {
            setUploadingCustomBadge(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleCustomBadgeCropComplete = async (croppedResult) => {
        setCustomBadgeCropperImage(null);
        setUploadingCustomBadge(true);
        try {
            let mediaKey;
            if (typeof croppedResult === 'string') {
                mediaKey = croppedResult;
            } else {
                mediaKey = await uploadFile(croppedResult, 'avatar');
            }

            setCustomBadgeUploadedKey(mediaKey);
            setCustomBadgeUploadedUrl(getImageUrl(mediaKey));
            alert('Görsel başarıyla güncellendi.');
        } catch (err) {
            alert('Görsel kırpılırken hata oluştu.');
        } finally {
            setUploadingCustomBadge(false);
        }
    };

    const handleSaveCustomBadge = async (e) => {
        e.preventDefault();
        if (!checkActionPerm('custom-badges', 'full', 'Özel rozet kaydetme/güncelleme')) return;
        if (!customBadgeName.trim()) {
            alert('Lütfen rozet ismi girin.');
            return;
        }
        if (!customBadgeUploadedUrl) {
            alert('Lütfen rozet görseli yükleyin.');
            return;
        }

        try {
            if (editingCustomBadgeId) {
                await axios.put(`/api/admin/custom-badges/${editingCustomBadgeId}`, {
                    name: customBadgeName.trim(),
                    url: customBadgeUploadedUrl,
                    key: customBadgeUploadedKey,
                    shape: customBadgeShape,
                    borderStyle: customBadgeBorderStyle
                });
                alert('Özel rozet başarıyla güncellendi.');
            } else {
                await axios.post('/api/admin/custom-badges', {
                    name: customBadgeName.trim(),
                    url: customBadgeUploadedUrl,
                    key: customBadgeUploadedKey,
                    shape: customBadgeShape,
                    borderStyle: customBadgeBorderStyle
                });
                alert('Özel rozet başarıyla eklendi.');
            }
            handleCancelCustomBadgeEdit();
            fetchCustomBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'Rozet kaydedilemedi.');
        }
    };

    const handleEditCustomBadge = (badge) => {
        if (!checkActionPerm('custom-badges', 'full', 'Özel rozet düzenleme')) return;
        setEditingCustomBadgeId(badge._id);
        setCustomBadgeName(badge.name || '');
        setCustomBadgeUploadedUrl(badge.url || '');
        setCustomBadgeUploadedKey(badge.key || '');
        setCustomBadgeShape(badge.shape || 'round');
        setCustomBadgeBorderStyle(badge.borderStyle || 'thin');
        const formEl = document.querySelector('.custom-badge-form-card');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelCustomBadgeEdit = () => {
        setEditingCustomBadgeId(null);
        setCustomBadgeName('');
        setCustomBadgeUploadedUrl('');
        setCustomBadgeUploadedKey('');
        setCustomBadgeShape('round');
        setCustomBadgeBorderStyle('thin');
    };

    const handleDeleteCustomBadge = async (badgeId) => {
        if (!checkActionPerm('custom-badges', 'full', 'Özel rozet silme')) return;
        if (!window.confirm('Bu özel rozeti silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/custom-badges/${badgeId}`);
            fetchCustomBadges();
            alert('Rozet silindi.');
        } catch (err) {
            alert('Rozet silinemedi.');
        }
    };

    const handleCustomBadgeAssign = async (userId, badgeUrl, badgeName, shape = 'round', borderStyle = 'thin') => {
        try {
            const { data } = await axios.post(`/api/admin/users/${userId}/custom-badge`, {
                url: badgeUrl,
                name: badgeName,
                shape,
                borderStyle
            });
            const badgeObj = { url: badgeUrl, name: badgeName, shape, borderStyle };
            setUsers(
                users.map((u) =>
                    u._id === userId
                        ? { ...u, customBadge: badgeObj }
                        : u
                )
            );
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, customBadge: badgeObj } : prev);
            alert('Özel rozet kullanıcıya atandı.');
        } catch (err) {
            alert('Rozet atanamadı.');
        }
    };

    const fetchTouristAdmins = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/tourist-admins');
            setTouristAdmins(data);
        } catch (err) {
            console.error('Failed to load tourist admins from endpoint, falling back to /users:', err);
            try {
                const { data: usersData } = await axios.get('/api/admin/users');
                setTouristAdmins(usersData.filter(u => u.isTouristAdmin));
            } catch (fallbackErr) {
                setError('Turist admin listesi yüklenemedi.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearchTouristUser = async (e) => {
        if (e) e.preventDefault();
        if (!touristSearchTerm.trim()) return;
        setLoadingTourist(true);
        try {
            const { data } = await axios.get(`/api/admin/users?q=${touristSearchTerm.trim()}`);
            setTouristSearchResult(data.filter(u => u.username !== 'oxypace'));
        } catch (err) {
            alert('Kullanıcı arama başarısız.');
        } finally {
            setLoadingTourist(false);
        }
    };

    const handleAssignTouristAdmin = async () => {
        if (!selectedTouristUser) {
            alert('Lütfen bir kullanıcı seçin.');
            return;
        }

        let body = {};
        if (touristDurationType === 'preset') {
            body.duration = `${selectedTouristPreset}h`;
        } else {
            if (!customTouristDate) {
                alert('Lütfen geçerli bir tarih seçin.');
                return;
            }
            body.expiresAt = new Date(customTouristDate).toISOString();
        }
        body.permissions = compileTouristPermissions(touristModulesState);

        setAssigningTourist(true);
        try {
            const { data } = await axios.post(`/api/admin/users/${selectedTouristUser._id}/tourist-admin`, body);
            alert(data.message || 'Turist admin başarıyla atandı.');
            setSelectedTouristUser(null);
            setTouristSearchTerm('');
            setTouristSearchResult([]);
            setTouristModulesState(getDefaultModulePermissions('none'));
            fetchTouristAdmins();
        } catch (err) {
            alert(err.response?.data?.message || 'Turist admin atanamadı.');
        } finally {
            setAssigningTourist(false);
        }
    };

    const handleRevokeTouristAdmin = async (userId) => {
        if (!window.confirm('Bu kullanıcının turist admin yetkilerini iptal etmek istediğinize emin misiniz?')) return;
        try {
            const { data } = await axios.post(`/api/admin/users/${userId}/tourist-admin`, { revoke: true });
            alert(data.message || 'Yetkiler başarıyla geri alındı.');
            fetchTouristAdmins();
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    useEffect(() => {
        const loadCustomBadges = async () => {
            try {
                const { data } = await axios.get('/api/admin/custom-badges');
                setCustomBadges(data);
            } catch (err) {
                console.error('Failed to load custom badges on mount:', err);
            }
        };
        if (isAdmin) {
            loadCustomBadges();
        }
    }, [isAdmin]);

    const fetchRecoveryRequests = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/recovery-requests');
            setRecoveryRequests(data);
        } catch (err) {
            setError('Kurtarma talepleri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    // Keep tourist admins away ONLY from the oxypace-only tourist assignment panel
    useEffect(() => {
        if (activeTab === 'tourist-admin' && !isOxypace) {
            setActiveTab('requests');
        }
    }, [activeTab, isOxypace]);

    // WebSocket listener for real-time permission sync, revoke, and expiry
    useEffect(() => {
        if (!socket) return;

        const handlePermsUpdated = (data) => {
            if (data?.permissions) {
                setLiveTouristPerms(data.permissions);
            }
            if (updateUser) {
                updateUser({
                    isTouristAdmin: true,
                    touristAdminPermissions: data?.permissions,
                    touristAdminExpiresAt: data?.expiresAt
                });
            }
        };

        const handleRevoked = () => {
            if (updateUser) {
                updateUser({
                    isTouristAdmin: false,
                    touristAdminPermissions: {},
                    touristAdminExpiresAt: null
                });
            }
            alert('Turist admin yetkileriniz geri alındı.');
            navigate('/messages');
        };

        const handleExpired = () => {
            if (updateUser) {
                updateUser({
                    isTouristAdmin: false,
                    touristAdminPermissions: {},
                    touristAdminExpiresAt: null
                });
            }
            alert('Turist admin yetkilerinizin süresi doldu.');
            navigate('/messages');
        };

        socket.on('tourist_admin_assigned', handlePermsUpdated);
        socket.on('tourist_admin_permissions_updated', handlePermsUpdated);
        socket.on('tourist_admin_revoked', handleRevoked);
        socket.on('tourist_admin_expired', handleExpired);

        return () => {
            socket.off('tourist_admin_assigned', handlePermsUpdated);
            socket.off('tourist_admin_permissions_updated', handlePermsUpdated);
            socket.off('tourist_admin_revoked', handleRevoked);
            socket.off('tourist_admin_expired', handleExpired);
        };
    }, [socket, updateUser, navigate]);

    useEffect(() => {
        if (activeTab === 'requests' && getModuleAccess('requests').canView) {
            fetchRequests();
        } else if (activeTab === 'recovery' && getModuleAccess('recovery').canView) {
            fetchRecoveryRequests();
        } else if (activeTab === 'users' && getModuleAccess('users').canView) {
            fetchUsers();
        } else if (activeTab === 'portals' && getModuleAccess('portals').canView) {
            fetchPortals();
        } else if (activeTab === 'reports' && getModuleAccess('reports').canView) {
            fetchReports();
        } else if (activeTab === 'badges' && getModuleAccess('badges').canView) {
            fetchAllBadges();
        } else if (activeTab === 'custom-badges' && getModuleAccess('custom-badges').canView) {
            fetchCustomBadges();
        } else if (activeTab === 'feedback' && getModuleAccess('feedback').canView) {
            fetchFeedbacks();
        } else if (activeTab === 'ipbans' && getModuleAccess('ipbans').canView) {
            fetchBannedIps();
        } else if (activeTab === 'activity' && getModuleAccess('activity').canView) {
            fetchActivityLogs(1, activityLogsSearch, activityLogsCategory, activityLogsSeverity);
            fetchActivityStats();
        } else if (activeTab === 'tourist-admin' && isOxypace) {
            fetchTouristAdmins();
        } else if (activeTab === 'bots' && getModuleAccess('bots').canView) {
            fetchBots();
            fetchPortals(); // Load portals for selection/defaults
        }
    }, [activeTab, isOxypace, liveTouristPerms]);

    // Aktif oturum ve canlı log izleme WebSocket dinleyicisi
    useEffect(() => {
        if (activeTab === 'activity' && socket && connected) {
            socket.emit('join_admin_presence');

            socket.on('admin_presence_update', (data) => {
                setActiveSessions(data);
            });

            socket.on('platform:log', (newLog) => {
                if (!newLog || !activityLiveEnabled) return;
                setActivityLogs((prev) => {
                    if (activityLogsCategory !== 'all' && newLog.category !== activityLogsCategory) return prev;
                    if (activityLogsSeverity !== 'all' && newLog.severity !== activityLogsSeverity) return prev;
                    if (prev.some(l => l._id === newLog._id)) return prev;
                    return [newLog, ...prev.slice(0, 49)];
                });
                setActivityLogsTotal((prev) => prev + 1);
            });

            return () => {
                socket.emit('leave_admin_presence');
                socket.off('admin_presence_update');
                socket.off('platform:log');
            };
        }
    }, [activeTab, socket, connected, activityLiveEnabled, activityLogsCategory, activityLogsSeverity]);

    const fetchBannedIps = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/ip-bans');
            setBannedIps(data);
        } catch (err) {
            setError('Engelli IP listesi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleBanSubmit = async (reason, expiresAt) => {
        try {
            if (banModalTarget.type === 'user') {
                if (!checkActionPerm('users', 'canBan', 'Kullanıcı engelleme')) return;
                const userId = banModalTarget.id;
                await axios.put(`/api/admin/users/${userId}/ban`, { reason, expiresAt });
                alert('Kullanıcı başarıyla engellendi.');
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: true, banReason: reason, banExpiresAt: expiresAt } : u));
                setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isBanned: true, banReason: reason, banExpiresAt: expiresAt } : prev);
                if (activeTab === 'users') fetchUsers(searchTerm);
            } else if (banModalTarget.type === 'ip') {
                if (!checkActionPerm('ipbans', 'full', 'IP engelleme')) return;
                const ip = banModalTarget.id;
                await axios.post('/api/admin/ip-bans', { ip, reason, expiresAt });
                alert('IP adresi başarıyla engellendi.');
                if (activeTab === 'ipbans') fetchBannedIps();
            }
            setBanModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Engelleme işlemi başarısız.');
        }
    };

    const handleUnbanUser = async (userId) => {
        if (!checkActionPerm('users', 'canBan', 'Kullanıcı engeli kaldırma')) return;
        if (!window.confirm('Bu kullanıcının engelini kaldırmak istediğinize emin misiniz?')) return;
        try {
            await axios.put(`/api/admin/users/${userId}/unban`);
            alert('Kullanıcının engeli kaldırıldı.');
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: false, banReason: '', banExpiresAt: null } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isBanned: false, banReason: '', banExpiresAt: null } : prev);
            if (activeTab === 'users') fetchUsers(searchTerm);
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleUnbanIp = async (ip) => {
        if (!window.confirm(`Bu IP adresinin (${ip}) engelini kaldırmak istediğinize emin misiniz?`)) return;
        try {
            await axios.delete(`/api/admin/ip-bans/${ip}`);
            alert('IP adresinin engeli kaldırıldı.');
            if (activeTab === 'ipbans') fetchBannedIps();
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleImpersonate = async (userId) => {
        if (!window.confirm('Bu kullanıcının kimliğine bürünmek (Taklit Et) istediğinize emin misiniz?')) return;
        try {
            const { data } = await axios.post(`/api/admin/impersonate/${userId}`);
            const adminToken = localStorage.getItem('token');
            localStorage.setItem('admin_backup_token', adminToken);
            localStorage.setItem('token', data.token);
            alert(`Taklit modu başlatıldı: @${data.user.username}`);
            window.location.href = '/';
        } catch (err) {
            alert(err.response?.data?.message || 'Taklit modu başlatılamadı.');
        }
    };

    const fetchMaintenanceStatus = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/system-settings/maintenance');
            setMaintenanceActive(data.active);
        } catch (err) {
            setError('Bakım modu durumu yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMaintenance = async () => {
        const confirmMsg = maintenanceActive
            ? 'Bakım modunu kapatmak ve platformu genel kullanıma açmak istediğinize emin misiniz?'
            : 'Bakım modunu açmak ve platformu genel kullanıma kapatmak istediğinize emin misiniz? Sitedeki tüm aktif kullanıcılar anında 404 sayfasına yönlendirilecektir.';
        
        if (!window.confirm(confirmMsg)) return;

        try {
            const { data } = await axios.put('/api/admin/system-settings/maintenance', {
                active: !maintenanceActive
            });
            setMaintenanceActive(data.active);
            alert(data.message);
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    // Fetch Feedbacks for the dedicated tab
    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/feedback/admin/list');
            setFeedbacks(data);
            setUnreadFeedbackCount(data.filter(f => f.status === 'new').length);
        } catch (err) {
            setError('Geri bildirimler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-update unread count on mount
    useEffect(() => {
        const checkUnread = async () => {
            try {
                const { data } = await axios.get('/api/feedback/admin/list');
                setUnreadFeedbackCount(data.filter(f => f.status === 'new').length);
            } catch (err) {}
        };
        checkUnread();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/reports');
            setReports(data);
        } catch (err) {
            setError('Bildirilenler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveReport = async (reportId) => {
        if (!checkActionPerm('reports', 'full', 'Şikayet sonuçlandırma')) return;
        try {
            await axios.put(`/api/reports/${reportId}/status`, { status: 'resolved' });
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
            alert('Bildirim çözüldü olarak işaretlendi.');
        } catch (err) {
            console.error('Resolve report error:', err);
            alert('İşlem başarısız.');
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!checkActionPerm('reports', 'full', 'Şikayet bildirisi silme')) return;
        if (!window.confirm('Bu bildiriyi silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/reports/${reportId}`);
            setReports(prev => prev.filter(r => r._id !== reportId));
            alert('Bildirim silindi.');
        } catch (err) {
            console.error('Delete report error:', err);
            alert('İşlem başarısız.');
        }
    };

    const handleAdminDeletePost = async (postId, reportId) => {
        if (!checkActionPerm('reports', 'full', 'Gönderi silme')) return;
        if (!window.confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/posts/${postId}`);
            alert('Gönderi başarıyla silindi.');
            // Auto mark the report resolved
            await axios.put(`/api/reports/${reportId}/status`, { status: 'resolved' });
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
        } catch (err) {
            console.error('Admin delete post error:', err);
            alert('İşlem başarısız.');
        }
    };

    const handleFeedbackReply = async (feedbackId, response) => {
        if (!checkActionPerm('feedback', 'full', 'Talebe yanıt verme')) return;
        try {
            await axios.post(`/api/feedback/admin/reply/${feedbackId}`, { response });
            setFeedbackModalOpen(false);
            fetchFeedbacks();
            alert('Yanıt iletildi!');
        } catch (err) {
            alert('Yanıt gönderilemedi.');
        }
    };

    const handleFeedbackMigration = async () => {
        if (!window.confirm('Eski iletişim verilerini yeni sisteme taşımak istiyor musunuz?')) return;
        setLoading(true);
        try {
            const { data } = await axios.post('/api/feedback/admin/migrate');
            alert(`${data.results.migrated} mesaj taşındı.`);
            fetchFeedbacks();
        } catch (err) {
            alert('Taşıma hatası.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/verification-requests');
            setRequests(data);
        } catch (err) {
            setError('Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (query = searchTerm, accountType = userAccountTypeFilter) => {
        setLoading(true);
        try {
            const url = `/api/admin/users?q=${encodeURIComponent(query || '')}&accountType=${encodeURIComponent(accountType || 'all')}`;
            const { data } = await axios.get(url);
            setUsers(data);
        } catch (err) {
            setError('Kullanıcılar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBots = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/bots');
            setBots(data);
        } catch (err) {
            setError('Botlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBot = async (e) => {
        e.preventDefault();
        if (!checkActionPerm('bots', 'full', 'Bot hesabı oluşturma')) return;
        try {
            await axios.post('/api/admin/bots', newBotData);
            setNewBotData({ username: '', email: '', password: '' });
            setBotFormOpen(false);
            fetchBots();
            alert('Bot hesabı oluşturuldu.');
        } catch (err) {
            alert(err.response?.data?.message || 'Bot oluşturulamadı.');
        }
    };

    const handleDeleteBot = async (id) => {
        if (!checkActionPerm('bots', 'full', 'Bot hesabı silme')) return;
        if (!window.confirm('Bu bot hesabını tamamen silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/bots/${id}`);
            fetchBots();
            alert('Bot başarıyla silindi.');
        } catch (err) {
            alert('Bot silinemedi.');
        }
    };

    const handleUpdateBotProfile = async (e) => {
        e.preventDefault();
        if (!checkActionPerm('bots', 'full', 'Bot profili ve ayarları güncelleme')) return;
        if (!editingBot) return;
        try {
            await axios.put(`/api/admin/bots/${editingBot._id}/profile`, {
                displayName: editingBot.profile.displayName,
                bio: editingBot.profile.bio,
                avatar: editingBot.profile.avatar,
                coverImage: editingBot.profile.coverImage,
                feeds: editingBot.config.feeds,
                defaultPortal: editingBot.config.defaultPortal?._id || editingBot.config.defaultPortal || null,
                defaultChannel: editingBot.config.defaultChannel
            });
            setEditingBot(null);
            fetchBots();
            alert('Bot profili ve ayarları güncellendi.');
        } catch (err) {
            alert('Güncelleme başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleBotPost = async (e) => {
        e.preventDefault();
        if (!checkActionPerm('bots', 'full', 'Bot üzerinden gönderi paylaşma')) return;
        if (!botPostTarget) return;
        try {
            await axios.post(`/api/admin/bots/${botPostTarget._id}/post`, botPostData);
            setBotPostModalOpen(false);
            setBotPostData({ content: '', portalId: '', channel: 'general', mediaUrl: '', mediaType: 'image' });
            alert('Gönderi bot tarafından başarıyla paylaşıldı.');
        } catch (err) {
            alert('Paylaşım başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleApprove = async (id) => {
        if (!checkActionPerm('requests', 'full', 'Başvuru onaylama')) return;
        if (!window.confirm('Bu kullanıcıyı onaylamak istiyor musunuz?')) return;
        try {
            await axios.post(`/api/admin/verify-user/${id}`);
            setRequests(requests.filter((req) => req._id !== id));
            alert('Kullanıcı doğrulandı!');
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleReject = async (id) => {
        if (!checkActionPerm('requests', 'full', 'Başvuru reddetme')) return;
        if (!window.confirm('Bu başvuruyu reddetmek istiyor musunuz?')) return;
        try {
            await axios.post(`/api/admin/reject-verification/${id}`);
            setRequests(requests.filter((req) => req._id !== id));
            alert('Başvuru reddedildi.');
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleBadgeChange = async (userId, newBadge) => {
        if (!checkActionPerm('users', 'canManageBadges', 'Rozet değiştirme')) return;
        try {
            await axios.put(`/api/admin/users/${userId}/badge`, { badge: newBadge });
            setUsers(
                users.map((user) =>
                    user._id === userId
                        ? { ...user, verificationBadge: newBadge, isVerified: newBadge !== 'none' }
                        : user
                )
            );
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, verificationBadge: newBadge, isVerified: newBadge !== 'none' } : prev);
        } catch (err) {
            alert('Rozet güncellenemedi.');
        }
    };

    const handleApproveRecovery = async (userId) => {
        if (!checkActionPerm('recovery', 'full', 'Kurtarma onaylama')) return;
        if (!window.confirm('Bu kullanıcının hesap kurtarma talebini onaylamak istiyor musunuz? Hesabı tekrar aktif edilecektir.')) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/recover-approve`);
            alert(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isDeleted: false, recoveryStatus: 'approved' } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isDeleted: false, recoveryStatus: 'approved' } : prev);
            setRecoveryRequests(prev => prev.filter(r => r._id !== userId));
            if (activeTab === 'users') fetchUsers(searchTerm);
        } catch (err) {
            alert(err.response?.data?.message || 'Onaylama işlemi başarısız.');
        }
    };

    const handleRejectRecovery = async (userId) => {
        if (!checkActionPerm('recovery', 'full', 'Kurtarma reddetme')) return;
        if (!window.confirm('Bu kullanıcının hesap kurtarma talebini reddetmek istiyor musunuz?')) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/recover-reject`);
            alert(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, recoveryStatus: 'rejected' } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, recoveryStatus: 'rejected' } : prev);
            setRecoveryRequests(prev => prev.filter(r => r._id !== userId));
            if (activeTab === 'users') fetchUsers(searchTerm);
        } catch (err) {
            alert(err.response?.data?.message || 'Reddetme işlemi başarısız.');
        }
    };

    const openUserDetail = (user) => {
        if (!checkActionPerm('users', 'details', 'Kullanıcı detaylarını inceleme')) return;
        setSelectedUserDetail(user);
        setUserDetailModalOpen(true);
    };

    const openUserDossier = async (user) => {
        if (!checkActionPerm('users', 'details', 'Kullanıcı şeceresini inceleme')) return;
        setUserDossierOpen(true);
        setLoadingDossier(true);
        setUserDossierData(null);
        try {
            const { data } = await axios.get(`/api/admin/users/${user._id}/dossier`);
            setUserDossierData(data);
        } catch (err) {
            alert('Kullanıcı şeceresi yüklenemedi: ' + (err.response?.data?.message || err.message));
            setUserDossierOpen(false);
        } finally {
            setLoadingDossier(false);
        }
    };

    const openUserPosts = async (user, searchQuery = '') => {
        setUserPostsUser(user);
        setUserPostsOpen(true);
        setLoadingUserPosts(true);
        try {
            const { data } = await axios.get(`/api/admin/users/${user._id}/posts?q=${encodeURIComponent(searchQuery)}`);
            setUserPostsData(data.posts || []);
        } catch (err) {
            alert('Kullanıcı gönderileri yüklenemedi.');
        } finally {
            setLoadingUserPosts(false);
        }
    };

    const openPortalPosts = async (portal, channelId = 'all', searchQuery = '') => {
        setSelectedPortalForPosts(portal);
        setPortalPostsChannelFilter(channelId);
        setPortalPostsSearch(searchQuery);
        setPortalPostsOpen(true);
        setLoadingPortalPosts(true);
        try {
            const { data } = await axios.get(`/api/admin/portals/${portal._id}/posts?channelId=${channelId}&q=${encodeURIComponent(searchQuery)}`);
            setPortalPostsData(data.posts || []);
        } catch (err) {
            alert('Portal gönderileri yüklenemedi.');
        } finally {
            setLoadingPortalPosts(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/posts/${postId}`);
            setUserPostsData(prev => prev.filter(p => p._id !== postId));
            setPortalPostsData(prev => prev.filter(p => p._id !== postId));
            alert('Gönderi sistemden kalıcı olarak silindi.');
        } catch (err) {
            alert('Gönderi silinemedi: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchActivityStats = async () => {
        setActivityStatsLoading(true);
        try {
            const { data } = await axios.get('/api/admin/activity-logs/stats');
            setActivityStats(data);
        } catch (err) {
            console.error('Activity stats fetch error:', err);
        } finally {
            setActivityStatsLoading(false);
        }
    };

    const fetchActivityLogs = async (page = 1, query = activityLogsSearch, category = activityLogsCategory, severity = activityLogsSeverity) => {
        setActivityLogsLoading(true);
        try {
            let url = `/api/admin/activity-logs?page=${page}&q=${encodeURIComponent(query)}&category=${category}`;
            if (severity && severity !== 'all') {
                url += `&severity=${severity}`;
            }
            const { data } = await axios.get(url);
            setActivityLogs(data.logs || []);
            setActivityLogsTotal(data.total || 0);
            setActivityLogsPage(data.page || 1);
        } catch (err) {
            console.error('Activity logs fetch error:', err);
        } finally {
            setActivityLogsLoading(false);
        }
    };

    const handleExportLogs = (format = 'csv') => {
        if (!checkActionPerm('activity', 'canExport', 'Platform günlüğü dışa aktarma')) return;
        let url = `/api/admin/activity-logs/export?format=${format}`;
        if (activityLogsCategory && activityLogsCategory !== 'all') url += `&category=${activityLogsCategory}`;
        if (activityLogsSeverity && activityLogsSeverity !== 'all') url += `&severity=${activityLogsSeverity}`;
        if (activityLogsSearch) url += `&q=${encodeURIComponent(activityLogsSearch)}`;
        window.open(url, '_blank');
    };


    const handleUpdateTouristPermissions = async (userId, newPermissions, updatedExpiry = null) => {
        try {
            const body = { permissions: newPermissions };
            if (updatedExpiry) {
                body.expiresAt = updatedExpiry;
            }
            const { data } = await axios.put(`/api/admin/users/${userId}/tourist-admin/permissions`, body);
            alert(data.message || 'Turist admin hakları başarıyla güncellendi.');
            setEditPermissionsModalOpen(false);
            fetchTouristAdmins();
        } catch (err) {
            alert('Haklar güncellenemedi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUserShadowbanToggle = async (userId, currentShadowbanned) => {
        if (!checkActionPerm('users', 'canBan', 'Kullanıcı gizli engelleme (shadowban)')) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/shadowban`, {
                isShadowbanned: !currentShadowbanned
            });
            alert(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isShadowbanned: data.user.isShadowbanned } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isShadowbanned: data.user.isShadowbanned } : prev);
        } catch (err) {
            alert('Hayalet mod durumu güncellenemedi.');
        }
    };

    const handleDeactivateUser = async (userId) => {
        if (!checkActionPerm('users', 'canBan', 'Kullanıcıyı pasife alma')) return;
        const reason = window.prompt('Hesabı pasife alma / silme gerekçesi giriniz:', 'Yönetici tarafından pasife alındı');
        if (reason === null) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/deactivate`, { reason });
            alert(data.message || 'Kullanıcı hesabı pasife alındı.');
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isDeleted: true, status: 'passive', deletionReason: reason, deletedAt: new Date().toISOString() } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isDeleted: true, status: 'passive', deletionReason: reason, deletedAt: new Date().toISOString() } : prev);
            if (activeTab === 'users') fetchUsers(searchTerm, userAccountTypeFilter);
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    const handleRestoreUser = async (userId) => {
        if (!checkActionPerm('users', 'canBan', 'Kullanıcıyı aktif etme')) return;
        if (!window.confirm('Bu kullanıcının hesabını yeniden AKTİF etmek istediğinize emin misiniz?')) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/restore`);
            alert(data.message || 'Kullanıcı hesabı başarıyla aktif edildi.');
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isDeleted: false, status: 'active', deletionReason: '', deletedAt: null } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isDeleted: false, status: 'active', deletionReason: '', deletedAt: null } : prev);
            if (activeTab === 'users') fetchUsers(searchTerm, userAccountTypeFilter);
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    // Search effect for users
    useEffect(() => {
        if (activeTab === 'users') {
            const delayDebounceFn = setTimeout(() => {
                fetchUsers(searchTerm, userAccountTypeFilter);
            }, 400);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm, userAccountTypeFilter]);

    // Search effect for portals
    useEffect(() => {
        if (activeTab === 'portals') {
            const delayDebounceFn = setTimeout(() => {
                fetchPortals(searchTermPortal);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTermPortal]);

    const fetchPortals = async (query = '') => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/admin/portals?q=${query}`);
            setPortals(data);
        } catch (err) {
            setError('Portallar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handlePortalBadge = async (portalId, newBadge) => {
        try {
            const badges = newBadge === 'none' ? [] : [newBadge];

            await axios.put(`/api/admin/portals/${portalId}`, { badges });
            setPortals(prev => prev.map(p =>
                p._id === portalId ? { ...p, badges, isVerified: badges.length > 0 } : p
            ));
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, badges, isVerified: badges.length > 0 } : prev);
            refreshBadges();
            alert('Portal rozeti başarıyla güncellendi.');
        } catch (err) {
            alert(err.response?.data?.message || 'Rozet güncellenemedi.');
        }
    };

    const handlePortalCustomBadgeAssign = async (portalId, badgeUrl, badgeName, shape = 'round', borderStyle = 'thin') => {
        try {
            await axios.post(`/api/admin/portals/${portalId}/custom-badge`, {
                url: badgeUrl,
                name: badgeName,
                shape,
                borderStyle
            });
            const badgeObj = { url: badgeUrl, name: badgeName, shape, borderStyle };
            setPortals(prev =>
                prev.map((p) =>
                    p._id === portalId
                        ? { ...p, customBadge: badgeObj }
                        : p
                )
            );
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, customBadge: badgeObj } : prev);
            alert('Özel rozet portala atandı.');
        } catch (err) {
            alert(err.response?.data?.message || 'Rozet portala atanamadı.');
        }
    };

    const handleNSFWToggle = async (portalId, currentValue) => {
        try {
            await axios.put(`/api/admin/portals/${portalId}`, { isNSFW: !currentValue });
            setPortals(portals.map(p =>
                p._id === portalId ? { ...p, isNSFW: !currentValue } : p
            ));
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, isNSFW: !currentValue } : prev);
        } catch (err) {
            alert('+18 durumu güncellenemedi.');
        }
    };

    const openPortalDetail = async (portal) => {
        if (!checkActionPerm('portals', 'details', 'Portal detaylarını inceleme')) return;
        setDetailPortal(portal);
        setOwnershipTarget('');
        setDetailModalOpen(true);
        setLoadingPortalDossier(true);
        try {
            const { data } = await axios.get(`/api/admin/portals/${portal._id}/dossier`);
            if (data && data.portal) {
                setDetailPortal(prev => ({
                    ...(prev || {}),
                    ...(data.portal || {}),
                    channelStats: data.channelStats || {},
                    postCount: data.postCount || 0,
                    recentActivities: data.recentActivities || [],
                    recentPosts: data.recentPosts || []
                }));
            }
        } catch (err) {
            console.error('Portal dossier fetch error:', err);
        } finally {
            setLoadingPortalDossier(false);
        }
    };

    const handleAdminAddChannel = async (portalId, channelData) => {
        if (!checkActionPerm('portals', 'full', 'Portal kanalı ekleme')) return false;
        try {
            const { data } = await axios.post(`/api/admin/portals/${portalId}/channels`, channelData);
            alert(data.message || 'Kanal başarıyla eklendi.');
            setDetailPortal(prev => prev ? { ...prev, channels: data.channels } : prev);
            setPortals(prev => prev.map(p => p._id === portalId ? { ...p, channels: data.channels } : p));
            return true;
        } catch (err) {
            alert(err.response?.data?.message || 'Kanal eklenemedi.');
            return false;
        }
    };

    const handleAdminEditChannel = async (portalId, channelId, channelData) => {
        if (!checkActionPerm('portals', 'full', 'Portal kanalı düzenleme')) return false;
        try {
            const { data } = await axios.put(`/api/admin/portals/${portalId}/channels/${channelId}`, channelData);
            alert('Kanal başarıyla güncellendi.');
            setDetailPortal(prev => {
                if (!prev) return prev;
                const updatedChannels = (prev.channels || []).map(ch => ch._id === channelId ? { ...ch, ...channelData } : ch);
                return { ...prev, channels: updatedChannels };
            });
            setPortals(prev => prev.map(p => {
                if (p._id !== portalId) return p;
                const updatedChannels = (p.channels || []).map(ch => ch._id === channelId ? { ...ch, ...channelData } : ch);
                return { ...p, channels: updatedChannels };
            }));
            return true;
        } catch (err) {
            alert(err.response?.data?.message || 'Kanal güncellenemedi.');
            return false;
        }
    };

    const handleAdminDeleteChannel = async (portalId, channelId) => {
        if (!checkActionPerm('portals', 'full', 'Portal kanalı silme')) return;
        if (!window.confirm('Bu kanalı kalıcı olarak silmek istediğinize emin misiniz?')) return;
        try {
            const { data } = await axios.delete(`/api/admin/portals/${portalId}/channels/${channelId}`);
            alert('Kanal silindi.');
            setDetailPortal(prev => prev ? { ...prev, channels: data.channels } : prev);
            setPortals(prev => prev.map(p => p._id === portalId ? { ...p, channels: data.channels } : p));
        } catch (err) {
            alert(err.response?.data?.message || 'Kanal silinemedi.');
        }
    };

    const handleReadOnlyToggle = async (portalId, currentReadOnly) => {
        if (!checkActionPerm('portals', 'full', 'Portal salt okunur ayarını değiştirme')) return;
        try {
            const { data } = await axios.put(`/api/admin/portals/${portalId}`, {
                isReadOnly: !currentReadOnly
            });
            const updated = data.portal;
            setPortals(prev => prev.map(p => p._id === portalId ? { ...p, isReadOnly: updated.isReadOnly } : p));
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, isReadOnly: updated.isReadOnly } : prev);
        } catch (err) {
            alert('Salt okunur durumu güncellenemedi.');
        }
    };

    const handleTransferOwnership = async (portalId) => {
        if (!checkActionPerm('portals', 'full', 'Portal sahipliğini devretme')) return;
        if (!ownershipTarget.trim()) {
            alert('Lütfen hedef kullanıcının ID veya kullanıcı adını girin.');
            return;
        }

        const confirmMsg = `Portal sahipliğini @${ownershipTarget} kullanıcısına devretmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
        if (!window.confirm(confirmMsg)) return;

        setTransferring(true);
        try {
            const { data } = await axios.post(`/api/admin/portals/${portalId}/transfer-ownership`, {
                targetUserIdentifier: ownershipTarget.trim()
            });
            alert(data.message);
            setPortals(prev => prev.map(p => p._id === portalId ? { ...p, owner: data.portal.owner, members: data.portal.members } : p));
            setDetailPortal(data.portal);
            setOwnershipTarget('');
        } catch (err) {
            alert(err.response?.data?.message || 'Sahiplik devredilemedi.');
        } finally {
            setTransferring(false);
        }
    };

    // Open Modal for Status Change
    const initiatePortalStatusChange = (portalId, action) => {
        if (action === 'activate') {
            // Direct activation, no reason needed usually, or simple confirm
            if (window.confirm('Bu portalı tekrar aktifleştirmek istediğinize emin misiniz?')) {
                executePortalStatusChange(portalId, 'active', '');
            }
        } else {
            // Suspend or Close - Open Modal
            setSelectedPortalId(portalId);
            setModalAction(action);
            setModalOpen(true);
        }
    };

    const executePortalStatusChange = async (portalId, newStatus, reason, suspendedUntil = null) => {
        try {
            await axios.put(`/api/admin/portals/${portalId}`, {
                status: newStatus,
                statusReason: reason,
                suspendedUntil: suspendedUntil
            });
            setPortals(portals.map(p =>
                p._id === portalId ? {
                    ...p,
                    status: newStatus,
                    statusReason: reason,
                    suspendedUntil: suspendedUntil
                } : p
            ));
            setDetailPortal(prev => prev && prev._id === portalId ? {
                ...prev,
                status: newStatus,
                statusReason: reason,
                suspendedUntil: suspendedUntil
            } : prev);
            setModalOpen(false);
        } catch (err) {
            alert('Durum güncellenemedi.');
        }
    };

    const handleModalSubmit = (reason, suspendedUntil) => {
        const newStatus = modalAction === 'suspend' ? 'suspended' : 'closed';
        executePortalStatusChange(selectedPortalId, newStatus, reason, suspendedUntil);
    };

    const handlePortalWarning = async (portalId) => {
        const message = window.prompt('Uyarı mesajınızı yazın:');
        if (!message) return;

        try {
            await axios.post(`/api/admin/portals/${portalId}/warning`, { message });
            alert('Uyarı gönderildi.');
        } catch (err) {
            alert('Uyarı gönderilemedi.');
        }
    };

    // --- Portal Alert System ---
    const openAlertModal = (portalId, portalName) => {
        setAlertPortalId(portalId);
        setAlertPortalName(portalName);
        setAlertModalOpen(true);
    };

    const handleAlertSubmit = async (message, expiresAt) => {
        try {
            const { data } = await axios.post(`/api/admin/portals/${alertPortalId}/alert`, { message, expiresAt });
            setAlertModalOpen(false);
            alert('Uyarı başarıyla yayınlandı!');
            fetchPortals(searchTermPortal);
            setDetailPortal(prev => {
                if (prev && prev._id === alertPortalId) {
                    const updatedAlerts = [...(prev.alerts || []), data.alert];
                    return { ...prev, alerts: updatedAlerts };
                }
                return prev;
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Uyarı gönderilemedi.');
        }
    };

    const handleRemoveAlert = async (portalId, alertId) => {
        if (!window.confirm('Bu uyarıyı kaldırmak istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/portals/${portalId}/alert/${alertId}`);
            alert('Uyarı kaldırıldı.');
            fetchPortals(searchTermPortal);
            setDetailPortal(prev => {
                if (prev && prev._id === portalId) {
                    const updatedAlerts = (prev.alerts || []).map(a => a._id === alertId ? { ...a, isActive: false } : a);
                    return { ...prev, alerts: updatedAlerts };
                }
                return prev;
            });
        } catch (err) {
            alert('Uyarı kaldırılamadı.');
        }
    };

    // ===== BADGE STUDIO CONSTANTS & PRESETS =====
    const BADGE_PRESETS = [
        {
            id: 'x_blue',
            name: 'X Mavi Onay',
            desc: 'Twitter / X Orijinal Mavi Onay',
            badge: {
                name: 'X Mavi Onay',
                slug: 'x-blue',
                shape: 'rosette_10',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'solid',
                    primaryColor: '#1d9bf0',
                    secondaryColor: '',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(29, 155, 240, 0.45)',
                }
            }
        },
        {
            id: 'x_gold',
            name: 'X Altın Kuruluş',
            desc: 'Twitter / X Orijinal Şirket Rozeti',
            badge: {
                name: 'X Altın Onay (Kuruluş)',
                slug: 'x-gold',
                shape: 'rounded_square',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'metallic',
                    primaryColor: '#ffd700',
                    secondaryColor: '#f59e0b',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(255, 215, 0, 0.45)',
                }
            }
        },
        {
            id: 'x_grey',
            name: 'X Gri Hükümet',
            desc: 'Twitter / X Orijinal Resmi Kurum Rozeti',
            badge: {
                name: 'X Gri Onay (Hükümet & Resmi)',
                slug: 'x-grey',
                shape: 'rosette_10',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'solid',
                    primaryColor: '#829aab',
                    secondaryColor: '',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(130, 154, 171, 0.4)',
                }
            }
        },
        {
            id: 'x_affiliate',
            name: 'X Bağlı Kuruluş',
            desc: 'Twitter / X Bağlı Şirket Rozeti',
            badge: {
                name: 'X Bağlı Kuruluş',
                slug: 'x-affiliate',
                shape: 'rounded_square',
                icon: 'shield',
                category: 'both',
                style: {
                    type: 'solid',
                    primaryColor: '#1d9bf0',
                    secondaryColor: '',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(29, 155, 240, 0.4)',
                }
            }
        },
        {
            id: 'meta_verified',
            name: 'Meta Onaylı',
            desc: 'Meta / Instagram 12-Köşe Resmi Doğrulama',
            badge: {
                name: 'Meta Onaylı Rozet',
                slug: 'meta-verified',
                shape: 'rosette_12',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'solid',
                    primaryColor: '#0095f6',
                    secondaryColor: '',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(0, 149, 246, 0.4)',
                }
            }
        },
        {
            id: 'oxypace_official',
            name: 'Oxypace Resmi',
            desc: 'Fırçalanmış Titanyum 12-Köşe Doğrulama',
            badge: {
                name: 'Oxypace Resmi Doğrulama',
                slug: 'oxypace-official',
                shape: 'rosette_12',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'titanium',
                    primaryColor: '#ffffff',
                    secondaryColor: '#71717a',
                    gradientAngle: 135,
                    innerIconColor: '#000000',
                    animationType: 'shimmer',
                    glowColor: 'rgba(255, 255, 255, 0.4)',
                }
            }
        },
        {
            id: 'oxypace_gold',
            name: 'Oxypace Kurumsal Altın',
            desc: 'Gerçekçi Metalik Altın Şirket Rozeti',
            badge: {
                name: 'Oxypace Kurumsal Altın',
                slug: 'oxypace-gold',
                shape: 'rounded_square',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'metallic',
                    primaryColor: '#ffd700',
                    secondaryColor: '#b45309',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(255, 215, 0, 0.4)',
                }
            }
        },
        {
            id: 'oxypace_executive',
            name: 'Oxypace Yönetim',
            desc: 'Obsidiyen & Karbon Yönetim Rozeti',
            badge: {
                name: 'Oxypace Yönetim & Lider',
                slug: 'oxypace-executive',
                shape: 'rosette_10',
                icon: 'crown',
                category: 'both',
                style: {
                    type: 'obsidian',
                    primaryColor: '#18181b',
                    secondaryColor: '#27272a',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(255, 255, 255, 0.15)',
                }
            }
        },
        {
            id: 'oxypace_partner',
            name: 'Oxypace Partner',
            desc: 'Metalik Mavi Stratejik Ortak',
            badge: {
                name: 'Oxypace Stratejik Partner',
                slug: 'oxypace-partner',
                shape: 'rounded_square',
                icon: 'shield',
                category: 'both',
                style: {
                    type: 'metallic',
                    primaryColor: '#3b82f6',
                    secondaryColor: '#6366f1',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(59, 130, 246, 0.4)',
                }
            }
        },
        {
            id: 'emerald_verified',
            name: 'Zümrüt Doğrulama',
            desc: 'Metalik Zümrüt Yeşil 10-Köşe',
            badge: {
                name: 'Zümrüt Doğrulama',
                slug: 'emerald-verified',
                shape: 'rosette_10',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'metallic',
                    primaryColor: '#10b981',
                    secondaryColor: '#059669',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: 'rgba(16, 185, 129, 0.4)',
                }
            }
        },
    ];

    const SHAPES = [
        { value: 'rosette_10', label: '10-Köşeli X Orijinal Rozet', desc: 'Resmi Twitter / X Standart Doğrulama Formu' },
        { value: 'rosette_12', label: '12-Köşeli Kurumsal Rozet', desc: 'Resmi Twitter Klasik & Meta / Instagram Doğrulama' },
        { value: 'rounded_square', label: 'Kurumsal Squircle (Kare)', desc: 'Resmi X Altın Şirket / Doğrulanmış Kuruluş Formu' },
        { value: 'rosette_8', label: '8-Köşeli Kompakt Rozet', desc: 'X / Twitter Klasik Kompakt Geometri' },
        { value: 'icon_only', label: 'Yalnızca Simge (Minimal)', desc: 'Arka plansız doğrudan vektör simge görünümü' },
    ];

    const STYLE_MODES = [
        { value: 'solid', label: 'Mat / Düz Renk', desc: 'Net ve minimalist kurumsal tek renk' },
        { value: 'gradient', label: 'Dinamik Gradyan', desc: 'Açı kontrollü 2 renkli yumuşak geçiş' },
        { value: 'metallic', label: 'Metalik Krom & Parlaklık', desc: 'Seçtiğiniz renkten dinamik türetilen gerçekçi ayna yansıması' },
        { value: 'titanium', label: 'Fırçalanmış Titanyum', desc: 'Yüksek kontrastlı çok şeritli endüstriyel metal yansıması' },
        { value: 'glass', label: 'Sıvı Cam & Akrilik', desc: 'Işığı kıran saydam kristal kenar parıltısı' },
        { value: 'obsidian', label: 'Karbon & Obsidiyen', desc: 'Grafen parıltılı koyu grafit ve derin siyah' },
        { value: 'neon', label: 'Siberpunk Işıması', desc: 'Yüksek yoğunluklu luminesan çekirdek ve ışık halesi' },
        { value: 'cosmic', label: 'Kozmik Aurora', desc: 'Derin uzay ve nebula spektrum geçişi' },
        { value: 'iridescent', label: 'Holografik Prizma', desc: 'Renk değiştiren kromatik difraksiyon dalgası' },
    ];

    const QUICK_PALETTES = [
        { name: 'X Blue', hex: '#1d9bf0' },
        { name: 'X Gold', hex: '#ffd700' },
        { name: 'Amber', hex: '#f59e0b' },
        { name: 'X Grey', hex: '#829aab' },
        { name: 'Meta Blue', hex: '#0095f6' },
        { name: 'Pure White', hex: '#ffffff' },
        { name: 'Titanium Slate', hex: '#71717a' },
        { name: 'Obsidian Black', hex: '#18181b' },
        { name: 'Emerald', hex: '#10b981' },
        { name: 'Ruby', hex: '#ef4444' },
        { name: 'Amethyst', hex: '#8b5cf6' },
        { name: 'Cyan', hex: '#06b6d4' },
    ];

    const ICONS = [
        { value: 'checkmark', label: 'X Onayı' },
        { value: 'shield', label: 'Kalkan' },
        { value: 'star', label: 'Yıldız' },
        { value: 'crown', label: 'Taç' },
        { value: 'award', label: 'Ödül' },
        { value: 'gem', label: 'Mücevher' },
        { value: 'lightning', label: 'Şimşek' },
        { value: 'diamond', label: 'Elmas' },
        { value: 'sparkle', label: 'Parıltı' },
        { value: 'globe', label: 'Dünya' },
        { value: 'rocket', label: 'Roket' },
        { value: 'fire', label: 'Ateş' },
        { value: 'heart', label: 'Kalp' },
        { value: 'atom', label: 'Atom' },
        { value: 'swords', label: 'Kılıç' },
        { value: 'eye', label: 'Göz' },
    ];

    const ANIM_TYPES = [
        { value: 'none', label: 'Sabit' },
        { value: 'pulse', label: 'Nabız' },
        { value: 'glow', label: 'Işıma' },
        { value: 'shimmer', label: 'Yansıma' },
        { value: 'spin', label: 'Dönme' },
        { value: 'float', label: 'Süzülme' },
        { value: 'bounce', label: 'Zıplama' },
    ];

    // ===== BADGE CRUD & STUDIO HANDLERS =====
    const fetchAllBadges = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/badges');
            setAllBadges(data);
        } catch (err) {
            setError('Rozetler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSeedBadges = async () => {
        try {
            const { data } = await axios.post('/api/badges/seed');
            alert(data.message);
            fetchAllBadges();
            refreshBadges();
        } catch (err) {
            alert('Seed işlemi başarısız.');
        }
    };

    const openBadgeCreator = (badge = null) => {
        if (!checkActionPerm('badges', 'full', badge ? 'Rozet Düzenleme' : 'Yeni Rozet Oluşturma')) return;
        if (badge) {
            setEditingBadge(badge);
            setBadgeForm({
                name: badge.name || '',
                slug: badge.slug || '',
                shape: badge.shape || (badge.slug?.includes('gold') ? 'rounded_square' : 'rosette_10'),
                icon: badge.icon || 'checkmark',
                category: badge.category || 'both',
                style: {
                    type: badge.style?.type || 'solid',
                    primaryColor: badge.style?.primaryColor || '#1d9bf0',
                    secondaryColor: badge.style?.secondaryColor || '#f59e0b',
                    gradientAngle: badge.style?.gradientAngle ?? 135,
                    innerIconColor: badge.style?.innerIconColor || '#ffffff',
                    animationType: badge.style?.animationType || 'none',
                    glowColor: badge.style?.glowColor || '',
                    borderStyle: badge.style?.borderStyle || 'none',
                },
            });
        } else {
            setEditingBadge(null);
            setBadgeForm({
                name: '',
                slug: '',
                shape: 'rosette_10',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'solid',
                    primaryColor: '#1d9bf0',
                    secondaryColor: '#f59e0b',
                    gradientAngle: 135,
                    innerIconColor: '#ffffff',
                    animationType: 'none',
                    glowColor: '',
                    borderStyle: 'none',
                },
            });
        }
        setBadgeModalOpen(true);
    };

    const handleBadgeClone = (badge) => {
        setEditingBadge(null);
        setBadgeForm({
            name: `${badge.name} (Kopya)`,
            slug: `${badge.slug}-kopya`,
            shape: badge.shape || 'rosette_10',
            icon: badge.icon || 'checkmark',
            category: badge.category || 'both',
            style: {
                type: badge.style?.type || 'solid',
                primaryColor: badge.style?.primaryColor || '#1d9bf0',
                secondaryColor: badge.style?.secondaryColor || '#f59e0b',
                gradientAngle: badge.style?.gradientAngle ?? 135,
                innerIconColor: badge.style?.innerIconColor || '#ffffff',
                animationType: badge.style?.animationType || 'none',
                glowColor: badge.style?.glowColor || '',
                borderStyle: badge.style?.borderStyle || 'none',
            },
        });
        setBadgeModalOpen(true);
    };

    const applyBadgePreset = (preset) => {
        setBadgeForm(prev => ({
            ...prev,
            name: editingBadge ? prev.name : preset.badge.name,
            slug: editingBadge ? prev.slug : preset.badge.slug,
            shape: preset.badge.shape,
            icon: preset.badge.icon,
            category: preset.badge.category,
            style: { ...preset.badge.style },
        }));
    };

    const handleBadgeSave = async () => {
        if (!badgeForm.name || !badgeForm.slug) {
            alert('İsim ve slug zorunludur.');
            return;
        }
        try {
            if (editingBadge) {
                await axios.put(`/api/badges/${editingBadge._id}`, badgeForm);
            } else {
                await axios.post('/api/badges', badgeForm);
            }
            setBadgeModalOpen(false);
            fetchAllBadges();
            refreshBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    const handleBadgeDelete = async (badgeId) => {
        if (!checkActionPerm('badges', 'full', 'Rozet Silme')) return;
        if (!window.confirm('Bu rozeti silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/badges/${badgeId}`);
            fetchAllBadges();
            refreshBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'Silme başarısız.');
        }
    };

    // Auto-generate slug from name (Turkish chars → ASCII)
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
            .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleNameChange = (name) => {
        const newForm = { ...badgeForm, name };
        if (!editingBadge || !editingBadge.isDefault) {
            newForm.slug = generateSlug(name);
        }
        setBadgeForm(newForm);
    };

    // Direct Badge Assignment Handlers
    const openAssignModal = async (badge, targetType = 'user') => {
        if (!checkActionPerm('badges', 'full', 'Rozet Atama')) return;
        setAssignTargetBadge(badge);
        setAssignType(targetType);
        setAssignQuery('');
        setAssignSuccessMsg('');
        setAssignModalOpen(true);
        setAssignLoading(true);
        try {
            if (targetType === 'user') {
                const { data } = await axios.get('/api/admin/users');
                setAssignResults(Array.isArray(data) ? data : (data.users || []));
            } else {
                const { data } = await axios.get('/api/admin/portals');
                setAssignResults(Array.isArray(data) ? data : (data.portals || []));
            }
        } catch (err) {
            console.error('Assign initial fetch error:', err);
            setAssignResults([]);
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAssignSearch = async (query) => {
        setAssignQuery(query);
        setAssignLoading(true);
        try {
            const trimmed = (query || '').trim();
            const endpoint = assignType === 'user'
                ? `/api/admin/users${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ''}`
                : `/api/admin/portals${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ''}`;
            const { data } = await axios.get(endpoint);
            if (assignType === 'user') {
                setAssignResults(Array.isArray(data) ? data : (data.users || []));
            } else {
                setAssignResults(Array.isArray(data) ? data : (data.portals || []));
            }
        } catch (err) {
            console.error('Assign search error:', err);
        } finally {
            setAssignLoading(false);
        }
    };

    const executeBadgeAssign = async (targetItem) => {
        if (!assignTargetBadge) return;
        setAssignLoading(true);
        try {
            if (assignType === 'user') {
                await axios.put(`/api/admin/users/${targetItem._id}/badge`, { badge: assignTargetBadge.slug });
                setAssignSuccessMsg(`"${assignTargetBadge.name}" rozeti @${targetItem.username} kullanıcısına başarıyla atandı!`);
                setAssignResults(prev => prev.map(u => u._id === targetItem._id ? { ...u, verificationBadge: assignTargetBadge.slug, isVerified: true } : u));
                setUsers(prev => prev.map(u => u._id === targetItem._id ? { ...u, verificationBadge: assignTargetBadge.slug, isVerified: true } : u));
                setSelectedUserDetail(prev => prev && prev._id === targetItem._id ? { ...prev, verificationBadge: assignTargetBadge.slug, isVerified: true } : prev);
            } else {
                const existingBadges = targetItem.badges || [];
                const updatedBadges = existingBadges.includes(assignTargetBadge.slug)
                    ? existingBadges
                    : [assignTargetBadge.slug, ...existingBadges.filter(b => b !== assignTargetBadge.slug)];
                await axios.put(`/api/admin/portals/${targetItem._id}`, { badges: updatedBadges });
                setAssignSuccessMsg(`"${assignTargetBadge.name}" rozeti "${targetItem.name}" portalına başarıyla atandı!`);
                setAssignResults(prev => prev.map(p => p._id === targetItem._id ? { ...p, badges: updatedBadges, isVerified: true } : p));
                setPortals(prev => prev.map(p => p._id === targetItem._id ? { ...p, badges: updatedBadges, isVerified: true } : p));
                setDetailPortal(prev => prev && prev._id === targetItem._id ? { ...prev, badges: updatedBadges, isVerified: true } : prev);
            }
            refreshBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'Atama işlemi başarısız.');
        } finally {
            setAssignLoading(false);
        }
    };

    const executeBadgeRevoke = async (targetItem) => {
        if (!assignTargetBadge) return;
        setAssignLoading(true);
        try {
            if (assignType === 'user') {
                await axios.put(`/api/admin/users/${targetItem._id}/badge`, { badge: 'none' });
                setAssignSuccessMsg(`@${targetItem.username} kullanıcısının rozeti kaldırıldı.`);
                setAssignResults(prev => prev.map(u => u._id === targetItem._id ? { ...u, verificationBadge: 'none', isVerified: false } : u));
                setUsers(prev => prev.map(u => u._id === targetItem._id ? { ...u, verificationBadge: 'none', isVerified: false } : u));
                setSelectedUserDetail(prev => prev && prev._id === targetItem._id ? { ...prev, verificationBadge: 'none', isVerified: false } : prev);
            } else {
                const existingBadges = targetItem.badges || [];
                const updatedBadges = existingBadges.filter(b => b !== assignTargetBadge.slug);
                await axios.put(`/api/admin/portals/${targetItem._id}`, { badges: updatedBadges });
                setAssignSuccessMsg(`"${targetItem.name}" portalından rozet kaldırıldı.`);
                setAssignResults(prev => prev.map(p => p._id === targetItem._id ? { ...p, badges: updatedBadges, isVerified: updatedBadges.length > 0 } : p));
                setPortals(prev => prev.map(p => p._id === targetItem._id ? { ...p, badges: updatedBadges, isVerified: updatedBadges.length > 0 } : p));
                setDetailPortal(prev => prev && prev._id === targetItem._id ? { ...prev, badges: updatedBadges, isVerified: updatedBadges.length > 0 } : prev);
            }
            refreshBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'Kaldırma işlemi başarısız.');
        } finally {
            setAssignLoading(false);
        }
    };

    // ===== BLOG MANAGEMENT HANDLERS =====
    const fetchAdminBlogPosts = async () => {
        setBlogLoading(true);
        try {
            const { data } = await axios.get('/api/blog/admin/all');
            setBlogPosts(data);
        } catch (err) {
            console.error('Fetch blog error:', err);
        } finally {
            setBlogLoading(false);
        }
    };

    const [blogAuthor, setBlogAuthor] = useState({
        name: 'Oxypace',
        title: 'Oxypace Kurucusu & Baş Yazarı',
        bio: 'Teorik fizik, kozmoloji ve yüksek performanslı yazılım mimarileri üzerine araştırmalar yapıyor.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        badge: 'Baş Yazar',
        github: '',
        twitter: '',
        website: '',
        linkedin: ''
    });
    const [blogAuthors, setBlogAuthors] = useState([]);
    const [authorEditTarget, setAuthorEditTarget] = useState('mine');
    const [blogAuthorModalOpen, setBlogAuthorModalOpen] = useState(false);
    const [blogAuthorSaving, setBlogAuthorSaving] = useState(false);
    const [uploadingAuthorAvatar, setUploadingAuthorAvatar] = useState(false);

    const fetchBlogAuthor = async () => {
        try {
            const { data } = await axios.get('/api/blog/author');
            if (data) setBlogAuthor(data);
        } catch (e) {
            console.error('Fetch blog author error:', e);
        }
    };

    const fetchBlogAuthors = async () => {
        try {
            const { data } = await axios.get('/api/blog/authors');
            if (data && Array.isArray(data)) setBlogAuthors(data);
        } catch (e) {
            console.error('Fetch all blog authors error:', e);
        }
    };

    const handleSaveBlogAuthor = async () => {
        setBlogAuthorSaving(true);
        try {
            const payload = {
                ...blogAuthor,
                isOfficialTarget: authorEditTarget === 'official'
            };
            const { data } = await axios.put('/api/blog/author', payload);
            setBlogAuthor(data);
            alert('Yazar profili başarıyla güncellendi.');
            setBlogAuthorModalOpen(false);
            fetchBlogAuthors();
        } catch (err) {
            alert(err.response?.data?.message || 'Yazar profili güncellenirken hata oluştu.');
        } finally {
            setBlogAuthorSaving(false);
        }
    };

    const handleAuthorAvatarFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAuthorAvatar(true);
        try {
            const mediaKey = await uploadFile(file, 'avatar');
            setBlogAuthor(prev => ({ ...prev, avatar: mediaKey }));
        } catch (err) {
            alert('Avatar yüklenirken hata oluştu.');
        } finally {
            setUploadingAuthorAvatar(false);
        }
    };

    const fetchCalcTools = async () => {
        setCalcToolsLoading(true);
        try {
            const { data } = await axios.get('/api/blog/admin/calculations');
            setCalcToolsList(data);
        } catch (e) {
            console.error('Fetch calc tools error:', e);
        } finally {
            setCalcToolsLoading(false);
        }
    };

    const handleSaveCalcToolImage = async (toolId, imageUrl) => {
        if (!imageUrl) {
            alert('Lütfen bir görsel URL\'si girin veya dosya seçin.');
            return;
        }
        setCalcToolSaving(true);
        try {
            const { data } = await axios.put(`/api/blog/admin/calculations/${toolId}`, { image: imageUrl });
            setCalcToolsList(prev => prev.map(t => t.toolId === toolId ? data : t));
            alert('Hesaplama aracı kapak görseli başarıyla güncellendi!');
            setEditingCalcTool(null);
            setCalcToolImageUrl('');
        } catch (e) {
            console.error('Save calc tool error:', e);
            alert('Görsel güncellenirken hata oluştu: ' + (e.response?.data?.message || e.message));
        } finally {
            setCalcToolSaving(false);
        }
    };

    const handleCalcToolFileSelect = async (e, toolId) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingCalcToolImage(true);
        try {
            const mediaKey = await uploadFile(file, 'post');
            setCalcToolImageUrl(mediaKey);
        } catch (err) {
            alert('Görsel yüklenirken hata oluştu.');
        } finally {
            setUploadingCalcToolImage(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'blog') {
            fetchAdminBlogPosts();
            fetchBlogAuthor();
            fetchBlogAuthors();
            fetchCalcTools();
        }
    }, [activeTab]);

    const handleTogglePublish = async (id) => {
        if (!checkActionPerm('blog', 'full', 'Makale yayın durumu değiştirme')) return;
        try {
            const { data } = await axios.patch(`/api/blog/admin/${id}/toggle-publish`);
            setBlogPosts(prev => prev.map(p => p._id === id ? { ...p, isPublished: data.isPublished } : p));
        } catch (err) {
            alert('Yayın durumu güncellenemedi.');
        }
    };

    const handleDeleteBlogPost = async (id) => {
        if (!checkActionPerm('blog', 'full', 'Makale silme')) return;
        if (!window.confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/blog/admin/${id}`);
            setBlogPosts(prev => prev.filter(p => p._id !== id));
        } catch (err) {
            alert('Makale silinemedi.');
        }
    };

    const openBlogModal = (post = null) => {
        if (post) {
            if (!checkActionPerm('blog', 'details', 'Makale detayını inceleme')) return;
            setEditingBlogPost(post);
            setBlogForm({
                title: post.title || '',
                slug: post.slug || '',
                excerpt: post.excerpt || '',
                content: post.content || '',
                category: post.category || 'Teorik Fizik',
                readTime: post.readTime || '',
                image: post.image || '',
                isPublished: post.isPublished !== undefined ? post.isPublished : true,
                authorProfile: post.authorProfile?._id || post.authorProfile || blogAuthor._id || '',
            });
        } else {
            if (!checkActionPerm('blog', 'full', 'Yeni makale oluşturma')) return;
            setEditingBlogPost(null);
            setBlogForm({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                category: 'Teorik Fizik',
                readTime: '',
                image: '',
                isPublished: true,
                authorProfile: blogAuthor._id || '',
            });
        }
        setBlogEditorMode('write');
        setBlogModalOpen(true);
    };

    const handleSaveBlogPost = async () => {
        if (!checkActionPerm('blog', 'full', 'Makale kaydetme/güncelleme')) return;
        if (!blogForm.title.trim() || !blogForm.content.trim()) {
            alert('Lütfen başlık ve içerik alanlarını doldurun.');
            return;
        }

        setBlogSaving(true);
        try {
            if (editingBlogPost) {
                const { data } = await axios.put(`/api/blog/admin/${editingBlogPost._id}`, blogForm);
                setBlogPosts(prev => prev.map(p => p._id === editingBlogPost._id ? data : p));
            } else {
                const { data } = await axios.post('/api/blog/admin', blogForm);
                setBlogPosts(prev => [data, ...prev]);
            }
            setBlogModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Makale kaydedilirken hata oluştu.');
        } finally {
            setBlogSaving(false);
        }
    };

    const handleBlogImageFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingBlogImage(true);
        try {
            const mediaKey = await uploadFile(file, 'post');
            setBlogForm(prev => ({ ...prev, image: mediaKey }));
        } catch (err) {
            alert('Görsel yüklenirken hata oluştu.');
        } finally {
            setUploadingBlogImage(false);
        }
    };

    const insertFormat = (startTag, endTag = '') => {
        const textarea = document.getElementById('blog-content-editor');
        if (!textarea) {
            setBlogForm(prev => ({
                ...prev,
                content: (prev.content || '') + `\n${startTag}Metin buraya${endTag}\n`
            }));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = blogForm.content || '';
        const selectedText = currentContent.substring(start, end) || 'Metin buraya';
        const replacement = `${startTag}${selectedText}${endTag}`;

        const newContent = currentContent.substring(0, start) + replacement + currentContent.substring(end);
        setBlogForm(prev => ({ ...prev, content: newContent }));

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + startTag.length, start + startTag.length + selectedText.length);
        }, 50);
    };

    const ensureHtmlFormatted = (text = '') => {
        if (!text || typeof text !== 'string') return '';

        if (/<(p|h1|h2|h3|blockquote|div|ul|ol|table|br)\b[^>]*>/i.test(text)) {
            return text;
        }

        const lines = text.split('\n');
        let htmlResult = [];
        let inList = false;

        for (let line of lines) {
            let trimmed = line.trim();

            if (!trimmed) {
                if (inList) { htmlResult.push('</ul>'); inList = false; }
                continue;
            }

            if (trimmed.startsWith('## ') || trimmed.startsWith('📌 ')) {
                if (inList) { htmlResult.push('</ul>'); inList = false; }
                const headerText = trimmed.replace(/^(## |📌 )/, '');
                htmlResult.push(`<h2 class="text-2xl font-bold text-white mt-8 mb-4">${headerText}</h2>`);
            }
            else if (trimmed.startsWith('### ') || trimmed.startsWith('🔹 ')) {
                if (inList) { htmlResult.push('</ul>'); inList = false; }
                const subText = trimmed.replace(/^(### |🔹 )/, '');
                htmlResult.push(`<h3 class="text-xl font-bold text-white mt-6 mb-3">${subText}</h3>`);
            }
            else if (trimmed.startsWith('> ') || trimmed.startsWith('💬 ')) {
                if (inList) { htmlResult.push('</ul>'); inList = false; }
                const quoteText = trimmed.replace(/^(> |💬 )/, '');
                htmlResult.push(`<blockquote class="border-l-4 border-accent pl-4 my-6 italic text-zinc-400">"${quoteText}"</blockquote>`);
            }
            else if (trimmed.startsWith('💡 ')) {
                if (inList) { htmlResult.push('</ul>'); inList = false; }
                const infoText = trimmed.replace(/^💡 /, '');
                htmlResult.push(`<div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-6">💡 <strong>Not:</strong> ${infoText}</div>`);
            }
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                if (!inList) {
                    htmlResult.push('<ul class="list-disc list-inside space-y-2 mb-6 text-zinc-300">');
                    inList = true;
                }
                const itemText = trimmed.replace(/^[-*] /, '');
                htmlResult.push(`  <li>${itemText}</li>`);
            }
            else {
                if (inList) { htmlResult.push('</ul>'); inList = false; }
                let formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                htmlResult.push(`<p class="text-zinc-300 mb-4">${formattedLine}</p>`);
            }
        }

        if (inList) htmlResult.push('</ul>');
        return htmlResult.join('\n');
    };

    const loadTemplate = (type) => {
        if (blogForm.content && !window.confirm('Mevcut makale içeriği şablon ile değiştirilecek. Devam etmek istiyor musunuz?')) return;

        if (type === 'science') {
            setBlogForm(prev => ({
                ...prev,
                category: prev.category || 'Teorik Fizik',
                excerpt: prev.excerpt || 'Evrenin temel fiziksel yasaları ve teorik araştırmaların makroskopik evrendeki yansımaları.',
                content: `Fiziğin en temel ve sarsıcı sorularından biri, mikroskobik düzeydeki hareket yasalarının tamamı simetrik iken, makroskobik evrende süreçlerin neden kararlı bir şekilde tek bir yöne ilerlediğidir.\n\n📌 1. Teorik Çerçeve ve Gözlemler\nSistemlerin makroskopik durumlarına karşılık gelen mikroskobik konfigürasyonların incelenmesi, olasılıkların geometrisini ortaya koymaktadır.\n\n💬 "Zaman oku, evrenin düzenden düzensizliğe doğru yaptığı kaçınılmaz istatistiksel yolculuğun makroskopik bir yansımasıdır."\n\n📌 2. Deneysel Bulgular ve Analiz\nElde edilen deneysel veriler ve termodinamik denklemler aşağıdaki bulguları doğrulamaktadır:\n\n- Düşük entropi durumlarının gerçekleşme olasılığı istatistiksel olarak küçüktür.\n- Kozmolojik ölçekte madde ve enerji homojen bir dağılım sergilemektedir.\n\n💡 Ölçümlerde kısmi basınç ve sıcaklık farklarının telafi edilmesi kritik önem taşır.\n\n📌 Sonuç\nNihayetinde evrenin fiziksel yasaları, mikro düzeydeki simetri ile makro düzeydeki tek yönlü akış arasındaki büyüleyici denge üzerine kuruludur.`
            }));
        } else if (type === 'announcement') {
            setBlogForm(prev => ({
                ...prev,
                category: 'Teknoloji & Yazılım',
                excerpt: 'Oxypace platformundaki en son sistem güncellemesi ve teknik yenilikler duyuruldu.',
                content: `Oxypace altyapısında gerçekleştirdiğimiz yeni sistem güncellemesi ve performans iyileştirmelerini duyurmaktan heyecan duyuyoruz.\n\n📌 📢 Yenilikler ve Öne Çıkanlar\n- Yeni Kolaylaştırılmış Blog Yönetim Paneli: Artık HTML bilmeden makale yazabilirsiniz!\n- Performans İyileştirmeleri: Sayfa yüklenme sürelerinde %40 hızlanma.\n\n💡 Tüm güncellemeler canlı sistemde aktif edilmiştir.`
            }));
        }
    };

    const filteredBlogPosts = blogPosts.filter(post => {
        const matchesSearch = !blogSearch.trim() ||
            post.title?.toLowerCase().includes(blogSearch.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(blogSearch.toLowerCase());
        const matchesCategory = blogCategoryFilter === 'all' || post.category === blogCategoryFilter;
        const matchesStatus = blogStatusFilter === 'all' ||
            (blogStatusFilter === 'published' ? post.isPublished : !post.isPublished);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const renderAccessDenied = (moduleName) => (
        <div className="tourist-access-denied-card fade-in">
            <div className="access-denied-icon-box">
                <Lock size={44} />
            </div>
            <h3>{moduleName} Modülü Kilitli</h3>
            <p>
                Turist Admin profilinizde bu modülün erişim seviyesi <strong>Kilitli</strong> olarak yapılandırılmıştır.
                Bu sekmeyi görüntüleme veya veri işleme yetkiniz bulunmamaktadır.
            </p>
            <div className="access-denied-pill">
                <ShieldAlert size={16} />
                <span>Erişim Kısıtlandı</span>
            </div>
        </div>
    );

    const renderViewModeBanner = (moduleName) => (
        <div className="tourist-view-mode-banner fade-in">
            <div className="view-mode-icon">
                <Eye size={20} />
            </div>
            <div className="view-mode-content">
                <div className="view-mode-title">{moduleName} • İzleme Modu (Salt Okunur)</div>
                <div className="view-mode-desc">Bu modüldeki tüm verileri inceleyebilirsiniz. Silme, güncelleme veya yeni veri ekleme yetkiniz kısıtlanmıştır.</div>
            </div>
        </div>
    );

    return (
        <div className={`admin-layout ${desktopSiteMode ? 'desktop-mode-active' : ''}`}>
            {/* Unauthorized Action Warning Toast Alert */}
            {unauthorizedAlert.show && (
                <div className="unauthorized-action-toast-overlay" onClick={() => setUnauthorizedAlert(prev => ({ ...prev, show: false }))}>
                    <div className="unauthorized-action-toast-card fade-in" onClick={e => e.stopPropagation()}>
                        <div className="unauthorized-toast-icon-wrap">
                            <ShieldAlert size={28} />
                        </div>
                        <div className="unauthorized-toast-body">
                            <div className="unauthorized-toast-header">
                                <h4>{unauthorizedAlert.title}</h4>
                                <span className="unauthorized-role-tag">Turist Admin</span>
                            </div>
                            <p className="unauthorized-toast-message">{unauthorizedAlert.message}</p>
                            {unauthorizedAlert.requiredLevel && (
                                <div className="unauthorized-req-info">
                                    Gerekli Yetki: <strong>{unauthorizedAlert.requiredLevel}</strong>
                                    {unauthorizedAlert.moduleName && ` • Modül: ${unauthorizedAlert.moduleName}`}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="unauthorized-toast-close"
                            onClick={() => setUnauthorizedAlert(prev => ({ ...prev, show: false }))}
                            aria-label="Kapat"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop overlay for mobile menu */}
            {sidebarOpen && (
                <div 
                    className="sidebar-backdrop" 
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Top Bar */}
            <div className="admin-top-bar">
                <button 
                    className="sidebar-mobile-toggle"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <Menu size={24} />
                </button>
                <div className="admin-mobile-title-wrap">
                    <span className="admin-mobile-title">Yönetici Paneli</span>
                    {(isMobileScreen || desktopSiteMode) && (
                        <button
                            type="button"
                            className={`desktop-site-toggle-btn ${desktopSiteMode ? 'active' : ''}`}
                            onClick={toggleDesktopSiteMode}
                            title={desktopSiteMode ? "Mobil Görünüme Dön" : "Masaüstü Sitesi Olarak Görüntüle (Yakınlaştırılabilir)"}
                            aria-label="Masaüstü sitesi modu"
                        >
                            <Monitor size={16} />
                            {desktopSiteMode && <span className="desktop-mode-active-dot" />}
                        </button>
                    )}
                </div>
                <button
                    className="admin-home-btn"
                    onClick={() => navigate('/messages')}
                    title="Mesajlar"
                >
                    <Home size={20} />
                </button>
            </div>

            {/* Glassmorphism Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button
                        className="sidebar-home-btn"
                        onClick={() => navigate('/messages')}
                        title="Mesajlar"
                    >
                        <Home size={18} />
                    </button>
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-title">Yönetici Paneli</span>
                        {(isMobileScreen || desktopSiteMode) && (
                            <button
                                type="button"
                                className={`desktop-site-toggle-btn in-sidebar ${desktopSiteMode ? 'active' : ''}`}
                                onClick={toggleDesktopSiteMode}
                                title={desktopSiteMode ? "Mobil Görünüme Dön" : "Masaüstü Sitesi Görünümüne Geç"}
                                aria-label="Masaüstü sitesi modu"
                            >
                                <Monitor size={14} />
                                <span className="desktop-mode-badge">
                                    {desktopSiteMode ? 'Masaüstü Açık' : 'Masaüstü Modu'}
                                </span>
                            </button>
                        )}
                    </div>
                    <button 
                        className="sidebar-close-btn"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="sidebar-nav">
                    {/* Category 1: Genel Bakış & Talepler */}
                    <div className="sidebar-category">
                        <span className="sidebar-category-label">Genel Bakış & Talepler</span>
                        
                        <button
                            className={`sidebar-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('requests', 'Başvurular')}
                        >
                            <span className="snav-icon"><LayoutDashboard size={18} /></span>
                            <span className="snav-label">Başvurular</span>
                            {requests.length > 0 && <span className="snav-badge">{requests.length}</span>}
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'recovery' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('recovery', 'Kurtarma Talepleri')}
                        >
                            <span className="snav-icon"><KeyRound size={18} /></span>
                            <span className="snav-label">Kurtarma Talepleri</span>
                            {recoveryRequests.length > 0 && <span className="snav-badge">{recoveryRequests.length}</span>}
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('feedback', 'Talepler')}
                        >
                            <span className="snav-icon"><ShieldAlert size={18} /></span>
                            <span className="snav-label">Talepler</span>
                            {unreadFeedbackCount > 0 && <span className="snav-badge">{unreadFeedbackCount}</span>}
                        </button>
                    </div>

                    {/* Category 2: Kullanıcı Yönetimi */}
                    <div className="sidebar-category">
                        <span className="sidebar-category-label">Kullanıcı Yönetimi</span>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('users', 'Kullanıcılar')}
                        >
                            <span className="snav-icon"><Users size={18} /></span>
                            <span className="snav-label">Kullanıcılar</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('activity', 'Platform Günlüğü & Oturumlar')}
                        >
                            <span className="snav-icon"><Globe size={18} /></span>
                            <span className="snav-label">Platform Günlüğü & Oturumlar</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'ipbans' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('ipbans', 'IP Engelleri')}
                        >
                            <span className="snav-icon"><AlertTriangle size={18} /></span>
                            <span className="snav-label">IP Engelleri</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'badges' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('badges', 'Rozetler')}
                        >
                            <span className="snav-icon"><Award size={18} /></span>
                            <span className="snav-label">Rozetler</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'custom-badges' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('custom-badges', 'Özel İkon Rozetler')}
                        >
                            <span className="snav-icon"><FileBadge size={18} /></span>
                            <span className="snav-label">Özel İkon Rozetler</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'bots' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('bots', 'Bot Yönetimi')}
                        >
                            <span className="snav-icon"><Bot size={18} /></span>
                            <span className="snav-label">Bot Yönetimi</span>
                        </button>
                    </div>

                    {/* Category 3: İçerik & Sistem */}
                    <div className="sidebar-category">
                        <span className="sidebar-category-label">İçerik & Sistem</span>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'portals' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('portals', 'Portallar')}
                        >
                            <span className="snav-icon"><Globe size={18} /></span>
                            <span className="snav-label">Portallar</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'blog' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('blog', 'Blog Yönetimi')}
                        >
                            <span className="snav-icon"><FileText size={18} /></span>
                            <span className="snav-label">Blog Yönetimi</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('reports', 'Bildirilenler')}
                        >
                            <span className="snav-icon"><ShieldAlert size={18} /></span>
                            <span className="snav-label">Bildirilenler</span>
                            {reports.filter(r => r.status === 'pending').length > 0 &&
                                <span className="snav-badge">{reports.filter(r => r.status === 'pending').length}</span>
                            }
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'mass-notification' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('mass-notification', 'Toplu Bildirim Gönder')}
                        >
                            <span className="snav-icon"><Send size={18} /></span>
                            <span className="snav-label">Toplu Bildirim Gönder</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'mobile-designs' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('mobile-designs', 'Mobil Tasarım Barındırma')}
                        >
                            <span className="snav-icon"><Smartphone size={18} /></span>
                            <span className="snav-label">Mobil Tasarım Barındırma</span>
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'mobile-versions' ? 'active' : ''}`}
                            onClick={() => handleNavTabClick('mobile-versions', 'Mobil Sürüm Günlüğü')}
                        >
                            <span className="snav-icon"><History size={18} /></span>
                            <span className="snav-label">Mobil Sürüm Günlüğü</span>
                        </button>
                    </div>

                    {/* Category 4: Özel Görünürlük Şartı (Süper Admin) */}
                    {isOxypace && (
                        <div className="sidebar-category">
                            <span className="sidebar-category-label">Süper Admin</span>
                            <button
                                className={`sidebar-nav-item ${activeTab === 'tourist-admin' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('tourist-admin'); setSidebarOpen(false); }}
                            >
                                <span className="snav-icon"><ShieldCheck size={18} /></span>
                                <span className="snav-label">Turist Admin Ata</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            <div className="admin-main-wrapper">
                <div className="admin-content">
                {activeTab === 'mobile-designs' && (
                    !getModuleAccess('mobile-designs').canView ? (
                        renderAccessDenied('Mobil Tasarım Barındırma')
                    ) : (
                        <>
                            {getModuleAccess('mobile-designs').access === 'view' && renderViewModeBanner('Mobil Tasarım Barındırma')}
                            <MobileDesignShowcase />
                        </>
                    )
                )}
                {activeTab === 'mobile-versions' && (
                    !getModuleAccess('mobile-versions').canView ? (
                        renderAccessDenied('Mobil Sürüm Günlüğü')
                    ) : (
                        <>
                            {getModuleAccess('mobile-versions').access === 'view' && renderViewModeBanner('Mobil Sürüm Günlüğü')}
                            <MobileVersionHistory />
                        </>
                    )
                )}
                {activeTab === 'tourist-admin' && isOxypace && (
                    <div className="tourist-admin-container fade-in">
                        <div className="tourist-admin-card">
                            <div className="tourist-admin-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck size={24} color="#60a5fa" />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Turist Admin Atama Paneli</h2>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Sadece @oxypace tarafından yönetilen bu modülle kullanıcılara geçici admin yetkileri atayabilir, süre ve modül izinlerini denetleyebilirsiniz.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="tourist-assign-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <h3 className="section-subtitle" style={{ margin: 0 }}>➕ Yeni Turist Admin Yetkilendir</h3>
                                    {selectedTouristUser && (
                                        <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600 }}>1 Kullanıcı Seçildi</span>
                                    )}
                                </div>

                                <form onSubmit={handleSearchTouristUser} className="tourist-search-form">
                                    <div className="tourist-search-box">
                                        <div className="tourist-search-input-wrap">
                                            <Search size={18} className="tourist-search-icon" />
                                            <input
                                                type="text"
                                                className="tourist-search-input"
                                                placeholder="Kullanıcı adı veya e-posta ile ara..."
                                                value={touristSearchTerm}
                                                onChange={(e) => setTouristSearchTerm(e.target.value)}
                                            />
                                            {touristSearchTerm && (
                                                <button
                                                    type="button"
                                                    className="tourist-search-clear-btn"
                                                    onClick={() => { setTouristSearchTerm(''); setTouristSearchResult([]); }}
                                                >
                                                    <X size={15} />
                                                </button>
                                            )}
                                        </div>
                                        <button type="submit" className="btn-modern-primary" disabled={loadingTourist}>
                                            {loadingTourist ? 'Aranıyor...' : 'Kullanıcı Bul'}
                                        </button>
                                    </div>
                                </form>

                                {touristSearchResult.length > 0 && !selectedTouristUser && (
                                    <div className="search-results-list fade-in" style={{ marginTop: '14px' }}>
                                        <h4 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Arama Sonuçları:</h4>
                                        <div className="results-grid">
                                            {touristSearchResult.map(u => (
                                                <div 
                                                    key={u._id} 
                                                    className="result-user-card"
                                                    onClick={() => setSelectedTouristUser(u)}
                                                >
                                                    <UserAvatar src={u.profile?.lowResAvatar || u.profile?.avatar} alt={u.username} className="avatar-mini" />
                                                    <div className="user-info-mini">
                                                        <strong>{u.profile?.displayName || u.username}</strong>
                                                        <span>@{u.username}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTouristUser && (
                                    <div className="assignment-details-form fade-in" style={{ marginTop: '16px' }}>
                                        <div className="selected-user-card-rich">
                                            <div className="selected-user-left">
                                                <UserAvatar src={selectedTouristUser.profile?.lowResAvatar || selectedTouristUser.profile?.avatar} alt={selectedTouristUser.username} className="avatar-table" />
                                                <div className="selected-user-meta">
                                                    <div className="selected-user-name">
                                                        <strong>{selectedTouristUser.profile?.displayName || selectedTouristUser.username}</strong>
                                                        <span className="selected-user-handle">@{selectedTouristUser.username}</span>
                                                    </div>
                                                    <div className="selected-user-sub">
                                                        <span>ID: {selectedTouristUser._id}</span>
                                                        {selectedTouristUser.email && <span> • {selectedTouristUser.email}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="clear-selected-user-btn"
                                                onClick={() => setSelectedTouristUser(null)}
                                                title="Seçimi İptal Et"
                                            >
                                                <X size={15} /> Seçimi Kaldır
                                            </button>
                                        </div>

                                        <div className="form-group-modern" style={{ marginTop: '16px' }}>
                                            <label className="badge-label">Süre Tipi</label>
                                            <div className="duration-type-toggle">
                                                <button
                                                    type="button"
                                                    className={`duration-type-btn ${touristDurationType === 'preset' ? 'active' : ''}`}
                                                    onClick={() => setTouristDurationType('preset')}
                                                >
                                                    Hazır Süre Seçimi
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`duration-type-btn ${touristDurationType === 'custom' ? 'active' : ''}`}
                                                    onClick={() => setTouristDurationType('custom')}
                                                >
                                                    Özel Bitiş Tarihi
                                                </button>
                                            </div>
                                        </div>

                                        {touristDurationType === 'preset' ? (
                                            <div className="form-group-modern">
                                                <label className="badge-label">Hazır Süre Seçin</label>
                                                <div className="preset-grid">
                                                    {[
                                                        { label: '2 Saat', val: 2 },
                                                        { label: '6 Saat', val: 6 },
                                                        { label: '12 Saat', val: 12 },
                                                        { label: '1 Gün (24 Saat)', val: 24 },
                                                        { label: '3 Gün', val: 72 },
                                                        { label: '7 Gün', val: 168 },
                                                        { label: '30 Gün', val: 720 }
                                                    ].map(p => (
                                                        <button
                                                            key={p.val}
                                                            type="button"
                                                            className={`preset-btn ${selectedTouristPreset === p.val ? 'active' : ''}`}
                                                            onClick={() => setSelectedTouristPreset(p.val)}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="duration-preview-pill" style={{ marginTop: '10px' }}>
                                                    <span>🕒 Yetki Bitiş Tarihi: <strong>{new Date(Date.now() + selectedTouristPreset * 60 * 60 * 1000).toLocaleString('tr-TR')}</strong></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="form-group-modern">
                                                <label className="badge-label">Bitiş Tarihi ve Saati</label>
                                                <input
                                                    type="datetime-local"
                                                    className="custom-date-input"
                                                    value={customTouristDate}
                                                    onChange={(e) => setCustomTouristDate(e.target.value)}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                />
                                                {customTouristDate && (
                                                    <div className="duration-preview-pill" style={{ marginTop: '10px' }}>
                                                        <span>🕒 Yetki Bitiş Tarihi: <strong>{new Date(customTouristDate).toLocaleString('tr-TR')}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Turist Admin Hakları / Granular Permissions Studio */}
                                        <div style={{ marginTop: '18px', marginBottom: '20px', background: '#0a0a0a', border: '1px solid #222222', borderRadius: '12px', padding: '16px' }}>
                                            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#888888', margin: '0 0 12px 0', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                                                🛡️ Turist Admin Hakları & 3 Aşamalı Granüler RBAC
                                            </h4>
                                            <TouristPermissionStudio
                                                modulesState={touristModulesState}
                                                onChange={setTouristModulesState}
                                            />
                                        </div>

                                        <div className="form-actions-modern">
                                            <button
                                                type="button"
                                                className="btn-modern-primary"
                                                onClick={handleAssignTouristAdmin}
                                                disabled={assigningTourist}
                                                style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 700, letterSpacing: '1px' }}
                                            >
                                                {assigningTourist ? 'ATANIYOR...' : '💼 TURİST ADMIN OLARAK ATA'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="tourist-list-section" style={{ marginTop: '30px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <h3 className="section-subtitle" style={{ margin: 0 }}>👥 Aktif Turist Adminler</h3>
                                    <span style={{ fontSize: '12px', background: '#1e293b', padding: '4px 10px', borderRadius: '20px', color: '#94a3b8', fontWeight: 600 }}>
                                        {touristAdmins.length} Kayıt
                                    </span>
                                </div>
                                {loading ? (
                                    <div className="admin-loading">Yükleniyor...</div>
                                ) : touristAdmins.length === 0 ? (
                                    <p className="no-data">Şu an aktif hiçbir Turist Admin bulunmamaktadır.</p>
                                ) : (
                                    <div className="tourist-admins-table-wrapper">
                                        <table className="tourist-table">
                                            <thead>
                                                <tr>
                                                    <th>Kullanıcı</th>
                                                    <th>Atayan</th>
                                                    <th>Aktif Yetkiler</th>
                                                    <th>Bitiş Tarihi</th>
                                                    <th>Kalan Süre</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {touristAdmins.map(admin => {
                                                    const expiresAt = new Date(admin.touristAdminExpiresAt);
                                                    const timeLeftMs = expiresAt - new Date();
                                                    let timeLeftStr = 'Süresi doldu';
                                                    if (timeLeftMs > 0) {
                                                        const diffHours = Math.floor(timeLeftMs / (1000 * 60 * 60));
                                                        const diffMins = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                                                        timeLeftStr = diffHours > 0 ? `${diffHours} sa ${diffMins} dk` : `${diffMins} dk`;
                                                    }
                                                    const perms = admin.touristAdminPermissions || {};
                                                    const mods = perms.modules || {};
                                                    const fullModsCount = Object.values(mods).filter(m => m.access === 'full').length;
                                                    const viewModsCount = Object.values(mods).filter(m => m.access === 'view').length;

                                                    const isExpired = timeLeftMs <= 0;
                                                    const isSoon = timeLeftMs > 0 && timeLeftMs < 12 * 60 * 60 * 1000;
                                                    const badgeClass = isExpired ? 'expired' : isSoon ? 'active-soon' : 'active-good';

                                                    return (
                                                        <tr key={admin._id}>
                                                            <td>
                                                                <div className="table-user-cell">
                                                                    <UserAvatar src={admin.profile?.lowResAvatar || admin.profile?.avatar} alt={admin.username} className="avatar-table" />
                                                                    <div className="user-info-table">
                                                                        <strong>{admin.profile?.displayName || admin.username}</strong>
                                                                        <span>@{admin.username}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>@{admin.assignedBy || 'oxypace'}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '320px' }}>
                                                                    {fullModsCount > 0 && (
                                                                        <span className="tourist-perm-tag full">⚡ {fullModsCount} Tam</span>
                                                                    )}
                                                                    {viewModsCount > 0 && (
                                                                        <span className="tourist-perm-tag view">👁️ {viewModsCount} İzleme</span>
                                                                    )}
                                                                    {perms.canBanUsers && <span className="mono-tag" style={{ fontSize: '9px' }}>Ceza</span>}
                                                                    {perms.canManageBadges && <span className="mono-tag" style={{ fontSize: '9px' }}>Rozet</span>}
                                                                    {perms.canViewLogs && <span className="mono-tag" style={{ fontSize: '9px' }}>Günlük</span>}
                                                                    {fullModsCount === 0 && viewModsCount === 0 && Object.values(perms).filter(Boolean).length === 0 && (
                                                                        <span style={{ color: '#666', fontSize: '11px' }}>Özel İzin Yok</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>{expiresAt.toLocaleString('tr-TR')}</td>
                                                            <td>
                                                                <span className={`time-left-badge ${badgeClass}`}>{timeLeftStr}</span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingTouristAdmin(admin);
                                                                            setEditingModulesState(parseExistingPermissions(admin.touristAdminPermissions));
                                                                            setEditExpiryOption('keep');
                                                                            setEditPermissionsModalOpen(true);
                                                                        }}
                                                                        className="btn-modern-secondary"
                                                                        style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '8px', textTransform: 'uppercase' }}
                                                                    >
                                                                        İzinleri Düzenle
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleRevokeTouristAdmin(admin._id)}
                                                                        className="btn-revoke-tourist"
                                                                        style={{ borderRadius: '8px' }}
                                                                    >
                                                                        Yetkiyi Kaldır
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mass-notification' && (
                    !getModuleAccess('mass-notification').canView ? (
                        renderAccessDenied('Toplu Bildirim Gönder')
                    ) : (
                        <div className="mass-notification-container fade-in">
                            {getModuleAccess('mass-notification').access === 'view' && renderViewModeBanner('Toplu Bildirim Gönder')}
                            <div className="mass-notification-card">
                                <div className="mass-notif-header">
                                    <h2>📢 Toplu Bildirim ve Android Push Paneli</h2>
                                    <p>Sistemdeki aktif kullanıcılara in-app bildirim veya Android push bildirimi gönderin.</p>
                                </div>

                                {massNotifStatus.text && (
                                    <div className={`status-banner ${massNotifStatus.type}`}>
                                        {massNotifStatus.type === 'success' ? '✅' : '❌'} {massNotifStatus.text}
                                    </div>
                                )}

                                <form onSubmit={handleSendMassNotification} className="mass-notif-form">
                                    <div className="form-group-modern">
                                        <label className="badge-label">Bildirim Başlığı</label>
                                        <input
                                            type="text"
                                            className="reason-input-modern"
                                            placeholder="Örn: Önemli Sistem Güncellemesi"
                                            value={massNotifTitle}
                                            onChange={(e) => setMassNotifTitle(e.target.value)}
                                            required
                                            disabled={massNotifSending}
                                        />
                                    </div>

                                    <div className="form-group-modern">
                                        <label className="badge-label">Mesaj Metni</label>
                                        <textarea
                                            className="reason-input-modern"
                                            placeholder="Kullanıcılara iletilecek mesaj içeriğini yazın..."
                                            rows="5"
                                            value={massNotifMessage}
                                            onChange={(e) => setMassNotifMessage(e.target.value)}
                                            required
                                            disabled={massNotifSending}
                                        />
                                    </div>

                                    <div className="form-group-modern">
                                        <label className="badge-label">Görsel (Opsiyonel)</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                            <input
                                                type="text"
                                                className="reason-input-modern"
                                                placeholder="Görsel URL girin veya dosya seçin..."
                                                value={massNotifImage}
                                                onChange={(e) => setMassNotifImage(e.target.value)}
                                                disabled={massNotifSending}
                                                style={{ flex: 1 }}
                                            />
                                            <label className="btn-modern-ghost" style={{ cursor: 'pointer', margin: 0, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px', whiteSpace: 'nowrap' }}>
                                                {uploadingImage ? 'Yükleniyor...' : 'Dosya Seç'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleMassNotifFileSelect}
                                                    disabled={massNotifSending || uploadingImage}
                                                />
                                            </label>
                                        </div>
                                        {massNotifImage && (
                                            <div style={{ position: 'relative', width: 'fit-content', marginTop: '10px' }}>
                                                <img 
                                                    src={getImageUrl(massNotifImage)} 
                                                    alt="Önizleme" 
                                                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setMassNotifImage('')}
                                                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4b4b', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group-modern checkboxes-group">
                                        <label className="badge-label">Gönderim Kanalları</label>
                                        <div className="checkbox-options-grid">
                                            <label className={`checkbox-card-label ${massNotifInApp ? 'checked' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={massNotifInApp}
                                                    onChange={(e) => setMassNotifInApp(e.target.checked)}
                                                    disabled={massNotifSending}
                                                />
                                                <div className="checkbox-custom"></div>
                                                <div className="checkbox-text-content">
                                                    <strong>Web Toplu Bildirim (In-App)</strong>
                                                    <span>Aktif kullanıcıların bildirim sayfasına eklenir, sayaç anlık güncellenir.</span>
                                                </div>
                                            </label>

                                            <label className={`checkbox-card-label ${massNotifPush ? 'checked' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={massNotifPush}
                                                    onChange={(e) => setMassNotifPush(e.target.checked)}
                                                    disabled={massNotifSending}
                                                />
                                                <div className="checkbox-custom"></div>
                                                <div className="checkbox-text-content">
                                                    <strong>Android Mobil Bildirimi (Push)</strong>
                                                    <span>Android APK'ya sahip tüm cihazlara yerel push bildirimi gönderilir.</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-actions-modern">
                                        <button
                                            type="submit"
                                            className="btn-modern-primary btn-glow-cyan"
                                            disabled={massNotifSending}
                                            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                                        >
                                            {massNotifSending ? 'GÖNDERİLİYOR...' : '📢 BİLDİRİMİ GÖNDER'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'bots' && (
                    !getModuleAccess('bots').canView ? (
                        renderAccessDenied('Bot Yönetimi')
                    ) : (
                        <div className="bots-section fade-in">
                            {getModuleAccess('bots').access === 'view' && renderViewModeBanner('Bot Yönetimi')}
                            <div className="section-header-modern">
                            <h2>🤖 Bot Hesap Yönetim Merkezi</h2>
                            <p>Sistemdeki otomatik içerik üreten bot hesaplarını ekleyin, düzenleyin veya paylaşım hedeflerini yönetin.</p>
                        </div>

                        <div className="filter-controls-modern" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="search-box-modern" style={{ flex: 1, minWidth: '280px' }}>
                                <input
                                    type="text"
                                    placeholder="Bot hesaplarında ara..."
                                    value={searchTermBot}
                                    onChange={(e) => setSearchTermBot(e.target.value)}
                                    className="search-input-modern"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <button 
                                className="btn-modern-primary btn-glow-cyan"
                                onClick={() => setBotFormOpen(true)}
                                style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '8px' }}
                            >
                                ➕ Yeni Bot Ekle
                            </button>
                        </div>

                        {/* CREATE BOT FORM MODAL */}
                        {botFormOpen && (
                            <div className="modal-overlay-modern">
                                <div className="modal-content-modern" style={{ maxWidth: '500px' }}>
                                    <div className="modal-header-modern">
                                        <h2>🤖 Yeni Bot Hesabı Oluştur</h2>
                                        <button className="close-btn-modern" onClick={() => setBotFormOpen(false)}>&times;</button>
                                    </div>
                                    <form onSubmit={handleCreateBot}>
                                        <div className="modal-body-modern" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div className="form-group-modern">
                                                <label>Kullanıcı Adı</label>
                                                <input
                                                    type="text"
                                                    value={newBotData.username}
                                                    onChange={(e) => setNewBotData({ ...newBotData, username: e.target.value })}
                                                    placeholder="Örn: MovieNewsBot"
                                                    required
                                                    className="reason-input-modern"
                                                    style={{ height: '40px', padding: '10px' }}
                                                />
                                            </div>
                                            <div className="form-group-modern">
                                                <label>E-posta Adresi</label>
                                                <input
                                                    type="email"
                                                    value={newBotData.email}
                                                    onChange={(e) => setNewBotData({ ...newBotData, email: e.target.value })}
                                                    placeholder="Örn: movienews@oxypace.com"
                                                    required
                                                    className="reason-input-modern"
                                                    style={{ height: '40px', padding: '10px' }}
                                                />
                                            </div>
                                            <div className="form-group-modern">
                                                <label>Şifre</label>
                                                <input
                                                    type="password"
                                                    value={newBotData.password}
                                                    onChange={(e) => setNewBotData({ ...newBotData, password: e.target.value })}
                                                    placeholder="Şifre belirleyin"
                                                    required
                                                    className="reason-input-modern"
                                                    style={{ height: '40px', padding: '10px' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="modal-footer-modern">
                                            <button type="button" className="btn-modern-ghost" onClick={() => setBotFormOpen(false)}>İptal</button>
                                            <button type="submit" className="btn-modern-primary btn-glow-cyan">Botu Oluştur</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* EDIT BOT CONFIG MODAL */}
                        {editingBot && (
                            <div className="modal-overlay-modern">
                                <div className="modal-content-modern" style={{ maxWidth: '650px' }}>
                                    <div className="modal-header-modern">
                                        <h2>📝 Bot Profili ve Ayarları Düzenle: @{editingBot.username}</h2>
                                        <button className="close-btn-modern" onClick={() => setEditingBot(null)}>&times;</button>
                                    </div>
                                    <form onSubmit={handleUpdateBotProfile}>
                                        <div className="modal-body-modern" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px' }}>Görünen İsim (Display Name)</label>
                                                    <input
                                                        type="text"
                                                        value={editingBot.profile?.displayName || ''}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            profile: { ...editingBot.profile, displayName: e.target.value }
                                                        })}
                                                        className="reason-input-modern"
                                                        style={{ height: '40px', padding: '10px' }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px' }}>Hakkında Yazısı (Biyografi)</label>
                                                <textarea
                                                    value={editingBot.profile?.bio || ''}
                                                    onChange={(e) => setEditingBot({
                                                        ...editingBot,
                                                        profile: { ...editingBot.profile, bio: e.target.value }
                                                    })}
                                                    className="reason-input-modern"
                                                    rows="3"
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px' }}>Profil Resmi</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img 
                                                            src={getImageUrl(editingBot.profile?.avatar) || '/system/deleted-user.png'} 
                                                            alt="Avatar" 
                                                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', background: '#333' }}
                                                        />
                                                        <label className="btn-modern-ghost" style={{ cursor: 'pointer', margin: 0, padding: '8px 12px', fontSize: '12px' }}>
                                                            {uploadingImage ? 'Yükleniyor...' : 'Görsel Seç'}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                style={{ display: 'none' }}
                                                                onChange={async (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    setUploadingImage(true);
                                                                    try {
                                                                        const mediaKey = await uploadFile(file, 'avatar');
                                                                        const fullUrl = getImageUrl(mediaKey);
                                                                        setEditingBot({
                                                                            ...editingBot,
                                                                            profile: { ...editingBot.profile, avatar: fullUrl }
                                                                        });
                                                                    } catch (err) {
                                                                        alert('Görsel yüklenemedi: ' + err.message);
                                                                    } finally {
                                                                        setUploadingImage(false);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px' }}>Kapak Fotoğrafı</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        {editingBot.profile?.coverImage ? (
                                                            <img 
                                                                src={getImageUrl(editingBot.profile.coverImage)} 
                                                                alt="Cover" 
                                                                style={{ width: '80px', height: '50px', borderRadius: '6px', objectFit: 'cover', background: '#333' }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '80px', height: '50px', borderRadius: '6px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#666' }}>Kapak Yok</div>
                                                        )}
                                                        <label className="btn-modern-ghost" style={{ cursor: 'pointer', margin: 0, padding: '8px 12px', fontSize: '12px' }}>
                                                            {uploadingImage ? 'Yükleniyor...' : 'Görsel Seç'}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                style={{ display: 'none' }}
                                                                onChange={async (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    setUploadingImage(true);
                                                                    try {
                                                                        const mediaKey = await uploadFile(file, 'cover');
                                                                        const fullUrl = getImageUrl(mediaKey);
                                                                        setEditingBot({
                                                                            ...editingBot,
                                                                            profile: { ...editingBot.profile, coverImage: fullUrl }
                                                                        });
                                                                    } catch (err) {
                                                                        alert('Görsel yüklenemedi: ' + err.message);
                                                                    } finally {
                                                                        setUploadingImage(false);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                                <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>🎯 Otomatik Paylaşım Hedef Seçimi</h3>
                                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Hedef Portal</label>
                                                        <select
                                                            className="badge-select"
                                                            value={editingBot.config?.defaultPortal?._id || editingBot.config?.defaultPortal || ''}
                                                            onChange={(e) => {
                                                                const portalVal = e.target.value;
                                                                const pObj = portals.find(p => String(p._id) === String(portalVal));
                                                                const firstChId = pObj?.channels?.[0]?._id || 'general';
                                                                setEditingBot({
                                                                    ...editingBot,
                                                                    config: { ...editingBot.config, defaultPortal: portalVal, defaultChannel: firstChId }
                                                                });
                                                            }}
                                                            style={{ width: '100%', background: '#0a0a0a', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '8px' }}
                                                        >
                                                            <option value="">Portal Seçin (Pasif / Genel)</option>
                                                            {portals.map(p => (
                                                                <option key={p._id} value={p._id}>{p.name} ({p._id})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Hedef Kanal</label>
                                                        {(() => {
                                                            const pId = editingBot.config?.defaultPortal?._id || editingBot.config?.defaultPortal;
                                                            const selectedP = portals.find(p => String(p._id) === String(pId));
                                                            const channels = selectedP?.channels || [];
                                                            return (
                                                                <select
                                                                    className="badge-select"
                                                                    value={editingBot.config?.defaultChannel || (channels[0]?._id || 'general')}
                                                                    onChange={(e) => setEditingBot({
                                                                        ...editingBot,
                                                                        config: { ...editingBot.config, defaultChannel: e.target.value }
                                                                    })}
                                                                    style={{ width: '100%', background: '#0a0a0a', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '8px' }}
                                                                >
                                                                    {channels.length === 0 ? (
                                                                        <option value="general"># Varsayılan Kanal</option>
                                                                    ) : (
                                                                        channels.map(ch => (
                                                                            <option key={ch._id} value={ch._id}>
                                                                                #{ch.name} (Kanal ID: {ch._id})
                                                                            </option>
                                                                        ))
                                                                    )}
                                                                </select>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                                <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>📡 Dış Kaynak (API/RSS Feed) Bağlantıları</h3>
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                                    <input
                                                        type="text"
                                                        value={feedInput}
                                                        onChange={(e) => setFeedInput(e.target.value)}
                                                        placeholder="RSS/API linki girin... (Örn: https://variety.com/feed/)"
                                                        className="reason-input-modern"
                                                        style={{ height: '40px', padding: '10px', flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-modern-primary"
                                                        style={{ height: '40px', padding: '0 16px', background: '#3b82f6' }}
                                                        onClick={() => {
                                                            if (!feedInput.trim()) return;
                                                            const currentFeeds = editingBot.config.feeds || [];
                                                            if (currentFeeds.includes(feedInput.trim())) {
                                                                alert('Bu feed zaten ekli.');
                                                                return;
                                                            }
                                                            setEditingBot({
                                                                ...editingBot,
                                                                config: { ...editingBot.config, feeds: [...currentFeeds, feedInput.trim()] }
                                                            });
                                                            setFeedInput('');
                                                        }}
                                                    >
                                                        Ekle
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                                    {(editingBot.config?.feeds || []).length === 0 ? (
                                                        <span style={{ fontSize: '12px', color: '#666' }}>Kayıtlı API/RSS kaynağı bulunamadı.</span>
                                                    ) : (
                                                        (editingBot.config?.feeds || []).map((feed, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>
                                                                <span style={{ fontSize: '13px', color: '#ccc', wordBreak: 'break-all' }}>{feed}</span>
                                                                <button
                                                                    type="button"
                                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                                                                    onClick={() => {
                                                                        setEditingBot({
                                                                            ...editingBot,
                                                                            config: {
                                                                                ...editingBot.config,
                                                                                feeds: (editingBot.config.feeds || []).filter((_, i) => i !== idx)
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    Kaldır
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer-modern">
                                            <button type="button" className="btn-modern-ghost" onClick={() => setEditingBot(null)}>İptal</button>
                                            <button type="submit" className="btn-modern-primary btn-glow-cyan">Değişiklikleri Kaydet</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* POST AS BOT MODAL */}
                        {botPostModalOpen && botPostTarget && (
                            <div className="modal-overlay-modern">
                                <div className="modal-content-modern" style={{ maxWidth: '550px' }}>
                                    <div className="modal-header-modern">
                                        <h2>🚀 @{botPostTarget.username} Olarak Gönderi Paylaş</h2>
                                        <button className="close-btn-modern" onClick={() => setBotPostModalOpen(false)}>&times;</button>
                                    </div>
                                    <form onSubmit={handleBotPost}>
                                        <div className="modal-body-modern" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '180px' }}>
                                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Paylaşılacak Portal</label>
                                                    <select
                                                        className="badge-select"
                                                        value={botPostData.portalId}
                                                        onChange={(e) => setBotPostData({ ...botPostData, portalId: e.target.value, channel: 'general' })}
                                                        style={{ width: '100%', background: '#0a0a0a', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '8px' }}
                                                    >
                                                        <option value="">Global Akış (Portal Dışı)</option>
                                                        {portals.map(p => (
                                                            <option key={p._id} value={p._id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1, minWidth: '180px' }}>
                                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Hedef Kanal</label>
                                                    {(() => {
                                                        const selectedP = portals.find(p => String(p._id) === String(botPostData.portalId));
                                                        const channels = selectedP?.channels || [];
                                                        return (
                                                            <select
                                                                className="badge-select"
                                                                value={botPostData.channel || (channels[0]?._id || 'general')}
                                                                onChange={(e) => setBotPostData({ ...botPostData, channel: e.target.value })}
                                                                style={{ width: '100%', background: '#0a0a0a', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '8px' }}
                                                            >
                                                                {channels.length === 0 ? (
                                                                    <option value="general"># Varsayılan Kanal</option>
                                                                ) : (
                                                                    channels.map(ch => (
                                                                        <option key={ch._id} value={ch._id}>
                                                                            #{ch.name} (Kanal ID: {ch._id})
                                                                        </option>
                                                                    ))
                                                                )}
                                                            </select>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Gönderi İçeriği (Metin)</label>
                                                <textarea
                                                    value={botPostData.content}
                                                    onChange={(e) => setBotPostData({ ...botPostData, content: e.target.value })}
                                                    placeholder="Gönderi içeriğini yazın..."
                                                    className="reason-input-modern"
                                                    rows="4"
                                                />
                                            </div>

                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Medya / Video (İsteğe Bağlı)</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {botPostData.mediaUrl && (
                                                        <div style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            ✓ Dosya Yüklendi ({botPostData.mediaType === 'video' ? 'Video' : 'Görsel'})
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setBotPostData({ ...botPostData, mediaUrl: '', mediaType: 'image' })}
                                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                                            >
                                                                [Sil]
                                                            </button>
                                                        </div>
                                                    )}
                                                    <label className="btn-modern-ghost" style={{ cursor: 'pointer', margin: 0, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {uploadingImage ? 'Yükleniyor...' : 'Dosya Seç'}
                                                        <input
                                                            type="file"
                                                            accept="image/*,video/*"
                                                            style={{ display: 'none' }}
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;
                                                                setUploadingImage(true);
                                                                try {
                                                                    const purpose = file.type.startsWith('video/') ? 'video' : 'post';
                                                                    const mediaKey = await uploadFile(file, purpose);
                                                                    const fullUrl = getImageUrl(mediaKey);
                                                                    setBotPostData({
                                                                        ...botPostData,
                                                                        mediaUrl: fullUrl,
                                                                        mediaType: file.type.startsWith('video/') ? 'video' : 'image'
                                                                    });
                                                                } catch (err) {
                                                                    alert('Dosya yüklenemedi: ' + err.message);
                                                                } finally {
                                                                    setUploadingImage(false);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer-modern">
                                            <button type="button" className="btn-modern-ghost" onClick={() => setBotPostModalOpen(false)}>İptal</button>
                                            <button type="submit" className="btn-modern-primary btn-glow-cyan">Gönderiyi Paylaş</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {loading && <div className="admin-loading">Botlar Yükleniyor...</div>}

                        {!loading && bots.length === 0 ? (
                            <p className="no-data">Sistemde kayıtlı bot hesap bulunamadı.</p>
                        ) : (
                            <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {bots
                                    .filter(bot => bot.username.toLowerCase().includes(searchTermBot.toLowerCase()))
                                    .map(bot => (
                                        <div key={bot._id} className="request-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                    <img
                                                        src={bot.profile?.avatar || '/system/deleted-user.png'}
                                                        alt={bot.username}
                                                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                                                    />
                                                    <div>
                                                        <h3 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>{bot.profile?.displayName || bot.username}</h3>
                                                        <span style={{ fontSize: '13px', color: '#888' }}>@{bot.username}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#ccc', marginBottom: '16px' }}>
                                                    <div>
                                                        <span style={{ color: '#666' }}>E-posta: </span>
                                                        <strong>{bot.email}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#666' }}>Biyografi: </span>
                                                        <span style={{ color: '#aaa' }}>{bot.profile?.bio || 'Biyografi belirtilmemiş.'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#666' }}>Hedef Portal: </span>
                                                        <strong style={{ color: '#3b82f6' }}>{bot.config?.defaultPortal?.name || 'Pasif'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#666' }}>Hedef Kanal: </span>
                                                        <strong>{bot.config?.defaultChannel || 'general'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#666' }}>Kayıtlı Feed: </span>
                                                        <strong>{(bot.config?.feeds || []).length} Adet</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                                <button
                                                    className="approve-btn"
                                                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: '#3b82f6' }}
                                                    onClick={() => {
                                                        setEditingBot(JSON.parse(JSON.stringify(bot)));
                                                        setFeedInput('');
                                                    }}
                                                >
                                                    📝 Düzenle
                                                </button>
                                                <button
                                                    className="approve-btn"
                                                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: '#10b981' }}
                                                    onClick={() => {
                                                        setBotPostTarget(bot);
                                                        setBotPostData({ content: '', portalId: bot.config?.defaultPortal?._id || '', channel: bot.config?.defaultChannel || 'general', mediaUrl: '', mediaType: 'image' });
                                                        setBotPostModalOpen(true);
                                                    }}
                                                >
                                                    🚀 Paylaş
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                                    onClick={() => handleDeleteBot(bot._id)}
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    )
                )}

                {activeTab === 'requests' && (
                    !getModuleAccess('requests').canView ? (
                        renderAccessDenied('Başvurular')
                    ) : (
                        // --- REQUESTS TAB ---
                        <div className="requests-section">
                            {getModuleAccess('requests').access === 'view' && renderViewModeBanner('Başvurular')}
                            {loading && <div className="admin-loading">Yükleniyor...</div>}
                            {!loading && requests.length === 0 && (
                                <p className="no-data">Bekleyen başvuru bulunmamaktadır.</p>
                            )}
                            <div className="requests-grid">
                                {requests.map((user) => (
                                    <div key={user._id} className="request-card">
                                        <div className="request-header">
                                            <img
                                                src={
                                                    user.profile.avatar ||
                                                    'https://via.placeholder.com/150'
                                                }
                                                alt={user.username}
                                                className="request-avatar"
                                            />
                                            <div className="request-user-info">
                                                <h3>{user.profile.displayName}</h3>
                                                <span>@{user.username}</span>
                                            </div>
                                        </div>
                                        <div className="request-details">
                                            <div className="detail-item">
                                                <span>Kategori:</span>
                                                <strong>
                                                    {user.verificationRequest.category?.toUpperCase()}
                                                </strong>
                                            </div>
                                            <div className="detail-item">
                                                <span>Talep:</span>
                                                <span className="badge-pill">
                                                    {user.verificationRequest.badgeType?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="reject-btn"
                                                onClick={() => handleReject(user._id)}
                                            >
                                                Reddet
                                            </button>
                                            <button
                                                className="approve-btn"
                                                onClick={() => handleApprove(user._id)}
                                            >
                                                Onayla
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'recovery' && (
                    !getModuleAccess('recovery').canView ? (
                        renderAccessDenied('Kurtarma Talepleri')
                    ) : (
                        // --- RECOVERY REQUESTS TAB ---
                        <div className="requests-section">
                            {getModuleAccess('recovery').access === 'view' && renderViewModeBanner('Kurtarma Talepleri')}
                            {loading && <div className="admin-loading">Yükleniyor...</div>}
                            {!loading && recoveryRequests.length === 0 && (
                                <p className="no-data">Bekleyen hesap kurtarma başvurusu bulunmamaktadır.</p>
                            )}
                            <div className="requests-grid">
                                {recoveryRequests.map((user) => (
                                    <div key={user._id} className="request-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        <div className="request-header" style={{ cursor: 'pointer' }} onClick={() => openUserDetail(user)}>
                                            <img
                                                src={
                                                    user.profile?.avatar ||
                                                    'https://via.placeholder.com/150'
                                                }
                                                alt={user.username}
                                                className="request-avatar"
                                            />
                                            <div className="request-user-info">
                                                <h3>{user.profile?.displayName || user.username}</h3>
                                                <span>@{user.username}</span>
                                            </div>
                                        </div>
                                        <div className="request-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                                            <div style={{ fontSize: '13px', color: '#ccc' }}>
                                                <span style={{ color: '#888' }}>Gerekçe: </span>
                                                <strong>{user.recoveryReason || 'Gerekçe belirtilmemiş.'}</strong>
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="reject-btn"
                                                onClick={() => handleRejectRecovery(user._id)}
                                            >
                                                Reddet
                                            </button>
                                            <button
                                                className="approve-btn"
                                                onClick={() => handleApproveRecovery(user._id)}
                                            >
                                                Onayla
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'users' && (
                    !getModuleAccess('users').canView ? (
                        renderAccessDenied('Kullanıcılar')
                    ) : (
                        // --- USERS TAB ---
                        <div className="users-section">
                            {getModuleAccess('users').access === 'view' && renderViewModeBanner('Kullanıcılar')}
                            <div className="users-search" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı ara (Kullanıcı adı, isim, e-posta veya IP)..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ flex: 1, minWidth: '240px' }}
                                    />
                                    <div className="user-type-selector-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            HESAP TÜRÜ:
                                        </span>
                                        <select
                                            value={userAccountTypeFilter}
                                            onChange={(e) => setUserAccountTypeFilter(e.target.value)}
                                            className="admin-select-input"
                                            style={{
                                                background: '#0d0d0d',
                                                color: '#fff',
                                                border: '1px solid #333',
                                                borderRadius: '6px',
                                                padding: '9px 14px',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            <option value="all">⚡ Tümü (Tüm Kayıtlar)</option>
                                            <option value="standard">👤 Standart Kullanıcılar</option>
                                            <option value="admin">👑 Yöneticiler</option>
                                            <option value="tourist">🛡️ Turist Adminler</option>
                                            <option value="bot">🤖 Bot / Sistem Hesapları</option>
                                            <option value="verified">✅ Onaylı Hesaplar</option>
                                            <option value="deleted">🗑️ Silinmiş / Pasif Hesaplar</option>
                                            <option value="banned">🚫 Engelli Hesaplar</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="user-type-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {[
                                        { id: 'all', label: 'Tümü', icon: '⚡' },
                                        { id: 'standard', label: 'Standart', icon: '👤' },
                                        { id: 'admin', label: 'Yöneticiler', icon: '👑' },
                                        { id: 'tourist', label: 'Turist Admin', icon: '🛡️' },
                                        { id: 'bot', label: 'Botlar', icon: '🤖' },
                                        { id: 'verified', label: 'Onaylı', icon: '✅' },
                                        { id: 'deleted', label: 'Silinmiş / Pasif', icon: '🗑️' },
                                        { id: 'banned', label: 'Engelli', icon: '🚫' },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setUserAccountTypeFilter(item.id)}
                                            style={{
                                                background: userAccountTypeFilter === item.id ? '#fff' : '#141414',
                                                color: userAccountTypeFilter === item.id ? '#000' : '#aaa',
                                                border: userAccountTypeFilter === item.id ? '1px solid #fff' : '1px solid #282828',
                                                borderRadius: '4px',
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        {loading && <div className="admin-loading">Kullanıcı verileri yükleniyor...</div>}

                        <div className="admin-users-box-grid">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    className={`admin-user-box-card ${user.isDeleted ? 'deleted' : ''} ${user.isBanned ? 'banned' : ''} ${user.isShadowbanned ? 'shadowbanned' : ''}`}
                                    style={user.isDeleted ? { border: '1px solid rgba(239, 68, 68, 0.45)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.06) 0%, rgba(20, 20, 20, 0.8) 100%)' } : {}}
                                >
                                    <div className="user-box-header">
                                        <AdminMedia
                                            src={user.profile?.lowResAvatar || user.profile?.avatar}
                                            alt={user.username}
                                            className="user-box-avatar"
                                            isAvatar={true}
                                        />
                                        <div className="user-box-meta">
                                            <div className="user-box-title">
                                                {user.profile?.displayName || user.username}
                                                <UserBadges user={user} size={16} />
                                            </div>
                                            <div className="user-box-username">@{user.username}</div>
                                            <div className="user-box-email">{user.email || 'E-posta Gizli'}</div>
                                        </div>
                                    </div>

                                    {/* Badges / Roles / Status */}
                                    <div className="user-box-tags">
                                        {user.isDeleted ? (
                                            <span className="mono-tag" style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', fontWeight: 700 }}>
                                                🗑️ SİLİNMİŞ (PASİF)
                                            </span>
                                        ) : (
                                            <span className="mono-tag" style={{ border: '1px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
                                                🟢 AKTİF
                                            </span>
                                        )}
                                        {user.isAdmin && <span className="mono-tag inverted">👑 YÖNETİCİ</span>}
                                        {user.isTouristAdmin && <span className="mono-tag">🛡️ TURİST ADMİN</span>}
                                        {user.isBot && <span className="mono-tag">🤖 BOT HESAP</span>}
                                        {user.isBanned && <span className="mono-tag" style={{ border: '1px solid #ffffff' }}>🚫 ENGELLİ</span>}
                                        {user.isShadowbanned && <span className="mono-tag">👻 GÖLGE BAN</span>}
                                        {user.isVerified && <span className="mono-tag muted">✅ ONAYLI</span>}
                                    </div>

                                    {/* Comprehensive Metrics / Şecere Verileri */}
                                    <div className="user-box-stats">
                                        {user.isDeleted && (
                                            <div className="user-stat-item" style={{ gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '4px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                                                <span className="user-stat-label" style={{ color: '#ef4444', fontWeight: 700 }}>🗑️ Silinme Tarihi & Durumu</span>
                                                <span className="user-stat-value" style={{ color: '#ff8888', fontSize: '11px' }}>
                                                    {user.deletedAt ? new Date(user.deletedAt).toLocaleString('tr-TR') : 'Arşivlenmiş'} ({user.deletionReason || 'Kullanıcı isteğiyle'}) — Durum: Pasif
                                                </span>
                                            </div>
                                        )}
                                        <div className="user-stat-item">
                                            <span className="user-stat-label">Son Bilinen IP</span>
                                            <span className="user-stat-value">{user.lastIP || 'Kayıt Yok'}</span>
                                        </div>
                                        <div className="user-stat-item">
                                            <span className="user-stat-label">Kayıtlı Cihaz</span>
                                            <span className="user-stat-value">{(user.registeredDevices?.length || 0)} Cihaz</span>
                                        </div>
                                        <div className="user-stat-item">
                                            <span className="user-stat-label">Takipçi / Takip</span>
                                            <span className="user-stat-value">{user.followerCount || 0} / {user.followingCount || 0}</span>
                                        </div>
                                        <div className="user-stat-item">
                                            <span className="user-stat-label">Gönderi Sayısı</span>
                                            <span className="user-stat-value">{user.postCount || 0}</span>
                                        </div>
                                        <div className="user-stat-item">
                                            <span className="user-stat-label">Kayıt Tarihi</span>
                                            <span className="user-stat-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                                        </div>
                                        <div className="user-stat-item">
                                            <span className="user-stat-label">Son Aktiflik</span>
                                            <span className="user-stat-value">{user.lastActive ? new Date(user.lastActive).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                                        </div>
                                    </div>

                                    {/* Üye Olduğu Portallar (Member Portals) */}
                                    <div className="user-box-portals-section">
                                        <div className="user-box-portals-header">
                                            <span className="user-box-portals-title">
                                                🌐 ÜYE OLDUĞU PORTALLAR ({user.memberPortals?.length || 0})
                                            </span>
                                        </div>
                                        {user.memberPortals && user.memberPortals.length > 0 ? (
                                            <div className="user-box-portals-chips">
                                                {user.memberPortals.map((mp) => (
                                                    <div
                                                        key={mp._id}
                                                        className="user-portal-chip-item"
                                                        onClick={() => openPortalDetail(mp)}
                                                        title={`${mp.name} (${mp.isOwner ? 'Kurucu' : 'Üye'}) - Portal Detaylarını Aç`}
                                                    >
                                                        <AdminMedia
                                                            src={mp.avatar}
                                                            alt={mp.name}
                                                            className="user-portal-chip-avatar"
                                                            isAvatar={true}
                                                            fallbackText={mp.name?.substring(0, 2).toUpperCase()}
                                                        />
                                                        <span className="user-portal-chip-name">{mp.name}</span>
                                                        {mp.isOwner ? (
                                                            <span className="user-portal-chip-badge owner">KURUCU</span>
                                                        ) : (
                                                            <span className="user-portal-chip-badge">ÜYE</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="user-box-portals-none">Kayıtlı portal üyeliği bulunamadı.</span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="user-box-actions">
                                        <button
                                            className="user-box-btn"
                                            title="Kullanıcının tam şeceresini, güvenlik detaylarını ve işlem geçmişini gör"
                                            onClick={() => openUserDossier(user)}
                                        >
                                            📋 Şecere
                                        </button>
                                        <button
                                            className="user-box-btn"
                                            title="Kullanıcının paylaştığı tüm gönderileri incele ve yönet"
                                            onClick={() => openUserPosts(user)}
                                        >
                                            📝 Postlar ({user.postCount || 0})
                                        </button>
                                        <button
                                            className="user-box-btn"
                                            title="Kullanıcı profilini ve rol yetkilerini düzenle"
                                            onClick={() => openUserDetail(user)}
                                        >
                                            ⚙️ Roller
                                        </button>
                                        <button
                                            className="user-box-btn"
                                            title={user.isShadowbanned ? 'Gölge banı kaldır' : 'Gölge ban uygula'}
                                            onClick={() => handleUserShadowbanToggle(user._id, user.isShadowbanned)}
                                        >
                                            {user.isShadowbanned ? '👻 Gölgeyi Aç' : '👻 Gölge Ban'}
                                        </button>
                                        <button
                                            className="user-box-btn"
                                            title={user.isBanned ? 'Kullanıcı banını kaldır' : 'Kullanıcıyı sistemden engelle'}
                                            onClick={() => {
                                                setBanModalTarget({ type: 'user', id: user._id });
                                                setBanModalOpen(true);
                                            }}
                                        >
                                            {user.isBanned ? '🔓 Banı Kaldır' : '🚫 Engelle'}
                                        </button>
                                        {user.isDeleted ? (
                                            <button
                                                className="user-box-btn"
                                                style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.08)' }}
                                                title="Pasif / silinmiş bu hesabı yeniden aktif et"
                                                onClick={() => handleRestoreUser(user._id)}
                                            >
                                                ♻️ Aktif Et
                                            </button>
                                        ) : (
                                            <button
                                                className="user-box-btn"
                                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                                title="Kullanıcı hesabını pasife al (silindi olarak işaretle, tüm veriler saklanır)"
                                                onClick={() => handleDeactivateUser(user._id)}
                                            >
                                                🗑️ Pasife Al
                                            </button>
                                        )}
                                        {isOxypace && (
                                            <button
                                                className="user-box-btn"
                                                style={{ borderStyle: 'dashed' }}
                                                title="Bu kullanıcının kimliğine bürün (Geliştirici modu)"
                                                onClick={() => handleImpersonate(user._id)}
                                            >
                                                👤 Taklit Et
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )
                )}

                {activeTab === 'portals' && (
                    !getModuleAccess('portals').canView ? (
                        renderAccessDenied('Portallar')
                    ) : (
                        <div className="portals-section">
                            {getModuleAccess('portals').access === 'view' && renderViewModeBanner('Portallar')}
                            <div className="users-search">
                            <input
                                type="text"
                                placeholder="Portal ara (İsim veya açıklama)..."
                                value={searchTermPortal}
                                onChange={(e) => setSearchTermPortal(e.target.value)}
                            />
                        </div>

                        {loading && <div className="admin-loading">Portallar yükleniyor...</div>}

                        <div className="admin-portals-box-grid">
                            {portals.map((portal) => (
                                <div
                                    key={portal._id}
                                    className="admin-portal-box-card"
                                >
                                    <div className="portal-box-banner">
                                        {portal.banner && (
                                            <AdminMedia
                                                src={portal.banner}
                                                alt={portal.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                fallbackText="Kapak Görseli Yok"
                                            />
                                        )}
                                        {portal.isNSFW && (
                                            <span className="mono-tag" style={{ position: 'absolute', top: 8, right: 8, background: '#000000', color: '#ffffff' }}>
                                                +18 NSFW
                                            </span>
                                        )}
                                    </div>

                                    <div className="portal-box-content">
                                        <div className="portal-box-header">
                                            <AdminMedia
                                                src={portal.avatar}
                                                alt={portal.name}
                                                className="portal-box-avatar"
                                                isAvatar={true}
                                                fallbackText={portal.name?.substring(0, 2).toUpperCase()}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="portal-box-title">
                                                    {portal.name}
                                                    <PortalBadges portal={portal} size={16} />
                                                    {portal.isReadOnly && <span className="mono-tag muted" style={{ fontSize: '9px' }}>SALT OKUNUR</span>}
                                                </div>
                                                <div className="portal-box-owner">
                                                    Kurucu: @{portal.owner?.username || 'Bilinmiyor'} • ID: <span style={{ fontFamily: 'monospace' }}>{portal._id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '12px', color: '#888888', margin: '4px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {portal.description || 'Bu portal hakkında henüz bir açıklama eklenmemiş.'}
                                        </p>

                                        {/* Portal Metrics */}
                                        <div className="user-box-stats">
                                            <div className="user-stat-item">
                                                <span className="user-stat-label">Üyeler</span>
                                                <span className="user-stat-value">{portal.members?.length || 0} Üye</span>
                                            </div>
                                            <div className="user-stat-item">
                                                <span className="user-stat-label">Kanallar</span>
                                                <span className="user-stat-value">{portal.channels?.length || 0} Kanal</span>
                                            </div>
                                            <div className="user-stat-item">
                                                <span className="user-stat-label">Durum</span>
                                                <span className="user-stat-value" style={{ textTransform: 'uppercase' }}>
                                                    {portal.status === 'active' ? 'AKTİF' : portal.status === 'suspended' ? 'ASKIDA' : 'KAPALI'}
                                                </span>
                                            </div>
                                            <div className="user-stat-item">
                                                <span className="user-stat-label">Kategori</span>
                                                <span className="user-stat-value">{portal.category || 'Genel'}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="user-box-actions">
                                            <button
                                                className="user-box-btn"
                                                title="Portal kanalları ve detaylarını yönet"
                                                onClick={() => openPortalDetail(portal)}
                                            >
                                                📋 Detay & Kanallar
                                            </button>
                                            <button
                                                className="user-box-btn"
                                                title="Portal içindeki tüm postları incele, filtrele ve sil"
                                                onClick={() => openPortalPosts(portal)}
                                            >
                                                📝 Portal Postları
                                            </button>
                                            <button
                                                className="user-box-btn"
                                                title="Portal yöneticilerine sistem uyarısı gönder"
                                                onClick={() => openAlertModal(portal._id, portal.name)}
                                            >
                                                📢 Uyarı
                                            </button>
                                            <button
                                                className="user-box-btn"
                                                title={portal.status === 'suspended' ? 'Portalı aktif et' : 'Portalı askıya al'}
                                                onClick={() => initiatePortalStatusChange(portal._id, portal.status === 'suspended' ? 'activate' : 'suspend')}
                                            >
                                                {portal.status === 'suspended' ? '🟢 Askıyı Kaldır' : '⛔ Askıya Al'}
                                            </button>
                                            <button
                                                className="user-box-btn"
                                                title="Portalı kalıcı olarak kapat"
                                                onClick={() => initiatePortalStatusChange(portal._id, 'close')}
                                            >
                                                ❌ Kapat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )
                )}

                {/* ===== BADGES TAB ===== */}
                {/* ===== BADGES STUDIO & MANAGEMENT TAB ===== */}
                {activeTab === 'badges' && (() => {
                    if (!getModuleAccess('badges').canView) {
                        return renderAccessDenied('Rozetler');
                    }

                    const isXBadge = (b) => {
                        const s = String(b.slug || '').toLowerCase();
                        return s.startsWith('x-') || ['blue', 'gold', 'platinum', 'verified', 'official'].includes(s);
                    };

                    const xBadgesCount = allBadges.filter(isXBadge).length;
                    const userBadgesCount = allBadges.filter(b => b.category === 'user' || b.category === 'both').length;
                    const portalBadgesCount = allBadges.filter(b => b.category === 'portal' || b.category === 'both').length;

                    const filteredBadges = allBadges.filter(b => {
                        // Category / group filter
                        if (badgeFilter === 'x_official' && !isXBadge(b)) return false;
                        if (badgeFilter === 'user' && b.category === 'portal') return false;
                        if (badgeFilter === 'portal' && b.category === 'user') return false;

                        // Search filter
                        if (badgeSearch.trim()) {
                            const query = badgeSearch.toLowerCase().trim();
                            const matchName = (b.name || '').toLowerCase().includes(query);
                            const matchSlug = (b.slug || '').toLowerCase().includes(query);
                            const matchShape = (b.shape || '').toLowerCase().includes(query);
                            return matchName || matchSlug || matchShape;
                        }
                        return true;
                    });

                    return (
                        <div className="badges-section fade-in">
                            {getModuleAccess('badges').access === 'view' && renderViewModeBanner('Rozetler')}
                            {/* Studio Header Banner */}
                            <div className="badge-studio-header">
                                <div className="badge-studio-title-row">
                                    <div className="badge-studio-title">
                                        <ShieldCheck size={20} className="text-white" />
                                        <span>ROZET STÜDYOSU & DOĞRULAMA MERKEZİ</span>
                                    </div>
                                    <div className="badge-studio-actions">
                                        <button
                                            className="badge-btn-primary"
                                            onClick={() => openBadgeCreator()}
                                        >
                                            <Plus size={15} />
                                            Yeni Rozet Tasarla
                                        </button>
                                        <button
                                            className="badge-btn-secondary"
                                            onClick={handleSeedBadges}
                                            title="X Orijinal Rozetlerini ve sistem varsayılanlarını senkronize et"
                                        >
                                            <RefreshCw size={14} />
                                            Rozetleri Senkronize Et
                                        </button>
                                    </div>
                                </div>
                                <p className="badge-studio-desc">
                                    X / Twitter resmi mavi ve altın doğrulama rozetleri, kurumsal onaylar ve Oxypace resmi sistem rozetleri. Gerçek zamanlı dinamik metalik krom, fırçalanmış titanyum, obsidiyen, sıvı cam ve siber ışık efektleriyle vektörel tasarım stüdyosu.
                                </p>

                                {/* Filter & Search Toolbar */}
                                <div className="badge-filter-bar" style={{ marginBottom: 0 }}>
                                    <div className="badge-filter-pills">
                                        <button
                                            type="button"
                                            className={`badge-filter-pill ${badgeFilter === 'all' ? 'active' : ''}`}
                                            onClick={() => setBadgeFilter('all')}
                                        >
                                            <Award size={13} />
                                            Tümü ({allBadges.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`badge-filter-pill ${badgeFilter === 'x_official' ? 'active' : ''}`}
                                            onClick={() => setBadgeFilter('x_official')}
                                        >
                                            <CheckCircle2 size={13} />
                                            Doğrulama & X ({xBadgesCount})
                                        </button>
                                        <button
                                            type="button"
                                            className={`badge-filter-pill ${badgeFilter === 'user' ? 'active' : ''}`}
                                            onClick={() => setBadgeFilter('user')}
                                        >
                                            <User size={13} />
                                            Kullanıcı ({userBadgesCount})
                                        </button>
                                        <button
                                            type="button"
                                            className={`badge-filter-pill ${badgeFilter === 'portal' ? 'active' : ''}`}
                                            onClick={() => setBadgeFilter('portal')}
                                        >
                                            <Globe size={13} />
                                            Portal ({portalBadgesCount})
                                        </button>
                                    </div>

                                    <div className="badge-search-input-wrap">
                                        <Search size={14} className="badge-search-icon" />
                                        <input
                                            type="text"
                                            className="badge-search-input"
                                            placeholder="Rozet adı veya slug ara..."
                                            value={badgeSearch}
                                            onChange={(e) => setBadgeSearch(e.target.value)}
                                        />
                                        {badgeSearch && (
                                            <button
                                                type="button"
                                                className="badge-search-clear"
                                                onClick={() => setBadgeSearch('')}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {loading && <div className="admin-loading">Rozetler yükleniyor...</div>}

                            {!loading && filteredBadges.length === 0 && (
                                <div className="no-data" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '12px' }}>Aramanıza uygun rozet bulunamadı.</p>
                                    <button className="badge-btn-primary" onClick={() => { setBadgeSearch(''); setBadgeFilter('all'); }}>
                                        Filtreleri Temizle
                                    </button>
                                </div>
                            )}

                            {/* Badge Cards Grid */}
                            <div className="badge-grid">
                                {filteredBadges.map((badge) => {
                                    const shapeObj = SHAPES.find(s => s.value === (badge.shape || 'rosette_10'));
                                    const styleModeObj = STYLE_MODES.find(m => m.value === (badge.style?.type || 'solid'));
                                    const isOfficialX = isXBadge(badge);

                                    return (
                                        <div
                                            key={badge._id || badge.slug}
                                            className={`badge-card ${isOfficialX ? 'is-x-badge' : ''}`}
                                        >
                                            <div className="badge-card-main">
                                                <div className="badge-card-preview" title="Canlı Vektör Önizleme">
                                                    <Badge badge={badge} size={42} />
                                                </div>
                                                <div className="badge-card-info">
                                                    <div className="badge-card-name-row">
                                                        <span className="badge-card-name">{badge.name}</span>
                                                    </div>
                                                    <div className="badge-card-slug">@{badge.slug}</div>
                                                    <div className="badge-card-meta">
                                                        <span className="badge-card-tag shape" title="Rozet Geometrisi">
                                                            {shapeObj?.label || (badge.shape === 'rounded_square' ? 'Kurumsal Squircle' : '10-Köşeli Rozet')}
                                                        </span>
                                                        <span className="badge-card-tag style" title="Görünüm ve Materyal">
                                                            {styleModeObj?.label || badge.style?.type || 'Düz'}
                                                        </span>
                                                        {badge.style?.animationType && badge.style.animationType !== 'none' && (
                                                            <span className="badge-card-tag anim" title="Animasyon Efekti">
                                                                <Zap size={10} style={{ display: 'inline', marginRight: 2 }} />
                                                                {badge.style.animationType}
                                                            </span>
                                                        )}
                                                        <span className="badge-card-tag scope" title="Kullanım Alanı">
                                                            {badge.category === 'user' ? 'Kullanıcı' : (badge.category === 'portal' ? 'Portal' : 'Evrensel')}
                                                        </span>
                                                        {badge.isDefault && (
                                                            <span className="badge-card-tag default" title="Sistem Varsayılanı">
                                                                Sistem
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Action Toolbar */}
                                            <div className="badge-card-actions">
                                                <button
                                                    type="button"
                                                    className="badge-action-btn edit"
                                                    onClick={() => openBadgeCreator(badge)}
                                                    title="Rozet Stüdyosunda Düzenle"
                                                >
                                                    <Edit3 size={12} />
                                                    Düzenle
                                                </button>
                                                <button
                                                    type="button"
                                                    className="badge-action-btn"
                                                    onClick={() => handleBadgeClone(badge)}
                                                    title="Bu rozeti şablon olarak çoğalt"
                                                >
                                                    <Copy size={12} />
                                                    Klonla
                                                </button>
                                                {(badge.category === 'user' || badge.category === 'both') && (
                                                    <button
                                                        type="button"
                                                        className="badge-action-btn assign"
                                                        onClick={() => openAssignModal(badge, 'user')}
                                                        title="Kullanıcıya Doğrudan Ver"
                                                    >
                                                        <User size={12} />
                                                        Kullanıcıya Ver
                                                    </button>
                                                )}
                                                {(badge.category === 'portal' || badge.category === 'both') && (
                                                    <button
                                                        type="button"
                                                        className="badge-action-btn assign"
                                                        onClick={() => openAssignModal(badge, 'portal')}
                                                        title="Portala Doğrudan Ver"
                                                    >
                                                        <Globe size={12} />
                                                        Portala Ver
                                                    </button>
                                                )}
                                                {!badge.isDefault && (
                                                    <button
                                                        type="button"
                                                        className="badge-action-btn delete"
                                                        onClick={() => handleBadgeDelete(badge._id)}
                                                        title="Rozeti Sil"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'reports' && (isOxypace || currentUser?.isAdmin || currentUser?.isTouristAdmin) && (() => {
                    if (!getModuleAccess('reports').canView) {
                        return renderAccessDenied('Bildirilenler / Şikayetler');
                    }

                    const getReportReasonLabel = (reason) => {
                        switch (reason) {
                            case 'spam': return { label: 'İstenmeyen İçerik (Spam)', bg: 'rgba(52, 152, 219, 0.15)', text: '#3498db' };
                            case 'harassment': return { label: 'Taciz veya Zorbalık', bg: 'rgba(230, 126, 34, 0.15)', text: '#e67e22' };
                            case 'hate_speech': return { label: 'Nefret Söylemi', bg: 'rgba(231, 76, 60, 0.15)', text: '#e74c3c' };
                            case 'violence': return { label: 'Şiddet veya Tehdit', bg: 'rgba(155, 89, 182, 0.15)', text: '#9b59b6' };
                            case 'sexual_content': return { label: 'Müstehcenlik veya Cinsel İçerik', bg: 'rgba(241, 196, 15, 0.15)', text: '#f1c40f' };
                            default: return { label: 'Diğer Nedenler', bg: 'rgba(149, 165, 166, 0.15)', text: '#95a5a6' };
                        }
                    };

                    const filters = ['pending', 'resolved', 'all'];
                    const filterLabels = {
                        pending: 'Bekleyenler',
                        resolved: 'Çözülenler',
                        all: 'Tümü'
                    };

                    const filteredReports = reports.filter(r => {
                        if (reportFilter === 'all') return true;
                        return r.status === reportFilter;
                    });

                    return (
                        <div className="reports-section fade-in">
                            {getModuleAccess('reports').access === 'view' && renderViewModeBanner('Bildirilenler / Şikayetler')}
                            <div className="report-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {filters.map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setReportFilter(filter)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            background: reportFilter === filter ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                                            color: reportFilter === filter ? '#fff' : 'var(--text-muted)',
                                            transition: '0.2s ease',
                                        }}
                                    >
                                        {filterLabels[filter]}
                                    </button>
                                ))}
                            </div>

                            {loading && <div className="admin-loading">Yükleniyor...</div>}

                            {!loading && filteredReports.length === 0 && (
                                <p className="no-data">Bildirim bulunamadı.</p>
                            )}

                            <div className="reports-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {filteredReports.map((report) => {
                                    const reasonStyle = getReportReasonLabel(report.reason);
                                    const reportedPost = report.targetPost;
                                    const reportedUser = report.targetUser;

                                    return (
                                        <div key={report._id} className="report-card-dashboard" style={{
                                            background: 'var(--bg-secondary)',
                                            border: `1px solid ${report.status === 'pending' ? 'rgba(231, 76, 60, 0.3)' : 'var(--border-subtle)'}`,
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '15px',
                                            boxShadow: report.status === 'pending' ? '0 4px 12px rgba(231, 76, 60, 0.05)' : 'none'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Bildiren</span>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {report.reporter?.profile?.displayName || report.reporter?.username || 'Silinmiş Kullanıcı'}
                                                            <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>@{report.reporter?.username}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        background: reasonStyle.bg,
                                                        color: reasonStyle.text,
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {reasonStyle.label}
                                                    </span>
                                                    <span style={{
                                                        background: report.targetType === 'post' ? 'rgba(0, 200, 81, 0.15)' : 'rgba(17, 168, 255, 0.15)',
                                                        color: report.targetType === 'post' ? '#00c851' : '#11a8ff',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {report.targetType === 'post' ? 'GÖNDERİ' : 'KULLANICI'}
                                                    </span>
                                                    {report.status === 'pending' && (
                                                        <span style={{ background: '#e74c3c', color: 'white', padding: '3px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            BEKLEMEDE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Report Details */}
                                            {report.details && (
                                                <div style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.9rem',
                                                    background: 'rgba(0,0,0,0.15)',
                                                    padding: '12px 15px',
                                                    borderRadius: '8px',
                                                    borderLeft: '3px solid #ff4b4b'
                                                }}>
                                                    <strong>Açıklama:</strong> {report.details}
                                                </div>
                                            )}

                                            {/* Target Post View */}
                                            {report.targetType === 'post' && reportedPost && (
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img src={reportedPost.author?.profile?.avatar || 'https://via.placeholder.com/40'} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                                {reportedPost.author?.profile?.displayName || reportedPost.author?.username}
                                                                <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>@{reportedPost.author?.username}</span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(reportedPost.createdAt).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', paddingLeft: '42px' }}>
                                                        {reportedPost.content}
                                                    </div>
                                                    {reportedPost.media && (
                                                        <div style={{ paddingLeft: '42px', marginTop: '6px' }}>
                                                            {reportedPost.mediaType === 'video' ? (
                                                                <video src={getImageUrl(reportedPost.media)} style={{ maxWidth: '200px', borderRadius: '8px' }} controls />
                                                            ) : (
                                                                <img src={getImageUrl(reportedPost.media)} alt="" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Target User View */}
                                            {report.targetType === 'user' && reportedUser && (
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}>
                                                    <img src={reportedUser.profile?.avatar || 'https://via.placeholder.com/50'} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                            {reportedUser.profile?.displayName || reportedUser.username}
                                                            <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>@{reportedUser.username}</span>
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            Hesap Türü: {reportedUser.settings?.privacy?.isPrivate ? 'Gizli Hesap' : 'Açık Hesap'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '5px' }}>
                                                {report.targetType === 'post' && reportedPost && (
                                                    <button
                                                        onClick={() => navigate(`/post/${reportedPost._id}`)}
                                                        style={{ background: 'rgba(17, 168, 255, 0.1)', color: '#11a8ff', border: '1px solid #11a8ff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Gönderiye Git
                                                    </button>
                                                )}
                                                {report.targetType === 'user' && reportedUser && (
                                                    <button
                                                        onClick={() => navigate(`/profile/${reportedUser.username}`)}
                                                        style={{ background: 'rgba(17, 168, 255, 0.1)', color: '#11a8ff', border: '1px solid #11a8ff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Profile Git
                                                    </button>
                                                )}
                                                {report.targetType === 'user' && reportedUser && (
                                                    <button
                                                        onClick={() => {
                                                            setBanModalTarget({ type: 'user', id: reportedUser._id });
                                                            setBanModalOpen(true);
                                                        }}
                                                        style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Kullanıcıyı Engelle
                                                    </button>
                                                )}
                                                {report.targetType === 'post' && reportedPost && (
                                                    <button
                                                        onClick={() => handleAdminDeletePost(reportedPost._id, report._id)}
                                                        style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Gönderiyi Sil
                                                    </button>
                                                )}
                                                {report.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => handleResolveReport(report._id)}
                                                        style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Çözüldü İşaretle
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteReport(report._id)}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                >
                                                    Bildirimi Sil
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'feedback' && (
                    !getModuleAccess('feedback').canView ? (
                        renderAccessDenied('Talepler / Geri Bildirim')
                    ) : (
                        <div className="feedback-section fade-in">
                            {getModuleAccess('feedback').access === 'view' && renderViewModeBanner('Talepler / Geri Bildirim')}
                            <div className="section-header-modern">
                            <div className="header-left">
                                <h2>Community Feedback / Talepler</h2>
                                <p>Kullanıcılardan gelen öneri, şikayet ve hata bildirimlerini yönetin.</p>
                            </div>
                            <div className="header-right">
                                <button onClick={handleFeedbackMigration} className="btn-modern-ghost migration-btn">
                                    Eski Verileri Taşı
                                </button>
                                <select 
                                    className="filter-select-modern"
                                    value={feedbackFilter}
                                    onChange={(e) => setFeedbackFilter(e.target.value)}
                                >
                                    <option value="all">Tüm Talepler</option>
                                    <option value="new">Sadece Yeniler</option>
                                    <option value="replied">Yanıtlananlar</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="admin-loading">Veriler Çekiliyor...</div>
                        ) : (
                            <div className="feedback-list-grid">
                                {feedbacks
                                    .filter(f => feedbackFilter === 'all' || f.status === feedbackFilter)
                                    .map(fb => (
                                    <div 
                                        key={fb._id} 
                                        className={`feedback-dashboard-card-v2 ${fb.status}`}
                                        onClick={() => { setSelectedFeedback(fb); setFeedbackModalOpen(true); }}
                                    >
                                        <div className="card-v2-header">
                                            <div className={`status-dot ${fb.status || 'new'}`}></div>
                                            <span className={`category-tag-v2 ${(fb.category?.toLowerCase() || 'genel').replace(/\s+/g, '-')}`}>{fb.category || 'Genel'}</span>
                                            <span className="date-text-v2">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                                        </div>

                                        <div className="card-v2-content">
                                            <div className="card-v2-text">
                                                <h3 className="fb-v2-subject">{fb.subject}</h3>
                                                <div className="fb-v2-sender">
                                                    <img 
                                                        src={fb.user?.profile?.avatar || '/system/deleted-user.png'} 
                                                        alt="" 
                                                        className="v2-avatar-tiny" 
                                                    />
                                                    <span>{fb.user ? `@${fb.user.username}` : 'Silinmiş Kullanıcı'}</span>
                                                </div>
                                                <p className="fb-v2-message-snippet">{fb.message ? fb.message.substring(0, 70) : 'Mesaj içeriği yok'}...</p>
                                            </div>

                                            {fb.files && fb.files.length > 0 && (
                                                <div className="card-v2-visual">
                                                    <div className="thumb-stack">
                                                        <img src={fb.files[0]} alt="" className="fb-v2-thumb" />
                                                        {fb.files.length > 1 && (
                                                            <div className="thumb-count-overlay">+{fb.files.length - 1}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-v2-footer">
                                            <div className="action-hint">DETAYLARI GÖR</div>
                                            {fb.status === 'replied' && (
                                                <div className="replied-marker">✓ Yanıtlandı</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {feedbacks.filter(f => feedbackFilter === 'all' || f.status === feedbackFilter).length === 0 && (
                                    <div className="no-feedback-state-v2">
                                        <div className="empty-icon-box">📬</div>
                                        <p>Gösterilecek talep bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    )
                )}

                {activeTab === 'activity' && (
                    !getModuleAccess('activity').canView ? (
                        renderAccessDenied('Platform Günlüğü & Oturumlar')
                    ) : (
                        <div className="activity-section fade-in">
                            {getModuleAccess('activity').access === 'view' && renderViewModeBanner('Platform Günlüğü & Oturumlar')}
                            <div className="activity-subnav">
                            <button
                                type="button"
                                className={`activity-subnav-btn ${activityViewMode === 'logs' ? 'active' : ''}`}
                                onClick={() => {
                                    setActivityViewMode('logs');
                                    fetchActivityLogs(1, activityLogsSearch, activityLogsCategory, activityLogsSeverity);
                                    fetchActivityStats();
                                }}
                            >
                                📜 Platform Günlüğü & Telemetri
                            </button>
                            <button
                                type="button"
                                className={`activity-subnav-btn ${activityViewMode === 'live' ? 'active' : ''}`}
                                onClick={() => setActivityViewMode('live')}
                            >
                                ⚡ Canlı Oturumlar ({activeSessions.length})
                            </button>
                        </div>

                        {activityViewMode === 'logs' && (
                            <div className="logs-container">
                                {/* 24H Telemetry Stats Cards */}
                                <div className="activity-stats-grid">
                                    <div className="activity-stat-card">
                                        <div className="stat-card-header">
                                            <span className="stat-card-title">24S TOPLAM HAREKET</span>
                                            <Activity size={16} className="stat-card-icon" />
                                        </div>
                                        <div className="stat-card-value">
                                            {activityStats?.total24h?.toLocaleString() || '0'}
                                        </div>
                                        <div className="stat-card-footer">
                                            <span>Sistem genelinde işlenen olaylar</span>
                                        </div>
                                    </div>

                                    <div className="activity-stat-card warning-border">
                                        <div className="stat-card-header">
                                            <span className="stat-card-title">GÜVENLİK & UYARILAR</span>
                                            <ShieldAlert size={16} className="stat-card-icon warning-text" />
                                        </div>
                                        <div className="stat-card-value warning-text">
                                            {(((activityStats?.bySeverity?.warning || 0) + (activityStats?.bySeverity?.critical || 0) + (activityStats?.bySeverity?.security || 0))).toLocaleString()}
                                        </div>
                                        <div className="stat-card-footer">
                                            <span>Kritik hata, şüpheli giriş & ihlaller</span>
                                        </div>
                                    </div>

                                    <div className="activity-stat-card">
                                        <div className="stat-card-header">
                                            <span className="stat-card-title">CANLI RTC & İZLEME</span>
                                            <Radio size={16} className="stat-card-icon" />
                                        </div>
                                        <div className="stat-card-value">
                                            {activityStats?.rtcEventsCount?.toLocaleString() || '0'}
                                        </div>
                                        <div className="stat-card-footer">
                                            <span>Oda katılımları, yayın ve watch party</span>
                                        </div>
                                    </div>

                                    <div className="activity-stat-card">
                                        <div className="stat-card-header">
                                            <span className="stat-card-title">DEPOLAMA & DOSYA</span>
                                            <HardDrive size={16} className="stat-card-icon" />
                                        </div>
                                        <div className="stat-card-value">
                                            {activityStats?.storageOpsCount?.toLocaleString() || '0'}
                                        </div>
                                        <div className="stat-card-footer">
                                            <span>Yüklemeler & imzalı URL istekleri</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Bar: Search, Real-Time Toggle & Exports */}
                                <div className="activity-controls-bar">
                                    <div className="controls-search-row">
                                        <div className="search-input-wrap">
                                            <Search size={14} className="search-icon-inside" />
                                            <input
                                                type="text"
                                                placeholder="İşlem kodu, kullanıcı, IP, konum veya detay ara..."
                                                value={activityLogsSearch}
                                                onChange={(e) => setActivityLogsSearch(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        fetchActivityLogs(1, activityLogsSearch, activityLogsCategory, activityLogsSeverity);
                                                    }
                                                }}
                                                className="activity-search-field"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fetchActivityLogs(1, activityLogsSearch, activityLogsCategory, activityLogsSeverity)}
                                            className="user-box-btn"
                                            style={{ minWidth: '85px' }}
                                        >
                                            Filtrele
                                        </button>

                                        {/* Real-time Live Stream Toggle */}
                                        <button
                                            type="button"
                                            className={`live-feed-toggle ${activityLiveEnabled ? 'active' : 'paused'}`}
                                            onClick={() => setActivityLiveEnabled(!activityLiveEnabled)}
                                            title={activityLiveEnabled ? 'Canlı akışı duraklat' : 'Canlı akışı devam ettir'}
                                        >
                                            <span className="live-dot-pulse"></span>
                                            {activityLiveEnabled ? 'CANLI AKIŞ' : 'DURAKLATILDI'}
                                        </button>

                                        {/* Export Buttons */}
                                        <div className="export-btn-group">
                                            <button
                                                type="button"
                                                className="export-btn"
                                                onClick={() => handleExportLogs('csv')}
                                                title="Filtrelenmiş kayıtları CSV formatında indir"
                                            >
                                                <Download size={13} />
                                                CSV
                                            </button>
                                            <button
                                                type="button"
                                                className="export-btn"
                                                onClick={() => handleExportLogs('json')}
                                                title="Filtrelenmiş kayıtları JSON formatında indir"
                                            >
                                                <Download size={13} />
                                                JSON
                                            </button>
                                        </div>
                                    </div>

                                    {/* Category Subtabs */}
                                    <div className="activity-category-row">
                                        <span className="row-label">KATEGORİ:</span>
                                        <div className="activity-category-pills">
                                            {[
                                                { id: 'all', label: 'TÜMÜ', icon: Globe },
                                                { id: 'auth', label: 'KİMLİK & HESAP', icon: KeyRound },
                                                { id: 'portal', label: 'PORTAL & KANAL', icon: Layers },
                                                { id: 'rtc', label: 'CANLI RTC & İZLEME', icon: Radio },
                                                { id: 'storage', label: 'DOSYA & DEPOLAMA', icon: HardDrive },
                                                { id: 'bot', label: 'BOT & ENTEGRASYON', icon: Bot },
                                                { id: 'content', label: 'İÇERİK & MESAJ', icon: MessageSquare },
                                                { id: 'system', label: 'SİSTEM & TELEMETRİ', icon: Server }
                                            ].map(cat => {
                                                const IconComp = cat.icon;
                                                const isActive = activityLogsCategory === cat.id;
                                                const count = cat.id === 'all' 
                                                    ? activityStats?.total24h 
                                                    : activityStats?.byCategory?.[cat.id];
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setActivityLogsCategory(cat.id);
                                                            fetchActivityLogs(1, activityLogsSearch, cat.id, activityLogsSeverity);
                                                        }}
                                                        className={`activity-cat-chip ${isActive ? 'active' : ''}`}
                                                    >
                                                        <IconComp size={12} />
                                                        <span>{cat.label}</span>
                                                        {count !== undefined && count > 0 && (
                                                            <span className="cat-chip-count">{count > 999 ? `${(count/1000).toFixed(1)}k` : count}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Severity Filter Row */}
                                    <div className="activity-severity-row">
                                        <span className="row-label">ÖNEM:</span>
                                        <div className="activity-severity-pills">
                                            {[
                                                { id: 'all', label: 'TÜM SEVİYELER', cls: 'all' },
                                                { id: 'info', label: 'BİLGİ (INFO)', cls: 'info' },
                                                { id: 'warning', label: 'UYARI (WARN)', cls: 'warning' },
                                                { id: 'critical', label: 'KRİTİK (CRIT)', cls: 'critical' },
                                                { id: 'security', label: 'GÜVENLİK (SEC)', cls: 'security' }
                                            ].map(sev => {
                                                const isActive = activityLogsSeverity === sev.id;
                                                return (
                                                    <button
                                                        key={sev.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setActivityLogsSeverity(sev.id);
                                                            fetchActivityLogs(1, activityLogsSearch, activityLogsCategory, sev.id);
                                                        }}
                                                        className={`severity-filter-chip ${sev.cls} ${isActive ? 'active' : ''}`}
                                                    >
                                                        {sev.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {activityLogsLoading ? (
                                    <div className="admin-loading">Platform telemetri kayıtları taranıyor...</div>
                                ) : activityLogs.length === 0 ? (
                                    <p className="no-data">Kriterlere uygun platform günlüğü kaydı bulunamadı.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="logs-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '140px' }}>Tarih / Saat</th>
                                                    <th style={{ width: '180px' }}>Aktör & Konum</th>
                                                    <th style={{ width: '100px' }}>Kategori</th>
                                                    <th style={{ width: '190px' }}>Eylem & Önem</th>
                                                    <th style={{ width: '180px' }}>IP & Cihaz</th>
                                                    <th style={{ width: '150px' }}>Kapsam / Portal</th>
                                                    <th>İşlem Detayları & Ayak İzi</th>
                                                    <th style={{ width: '70px', textAlign: 'center' }}>İncele</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activityLogs.map((log) => {
                                                    const sev = log.severity || 'info';
                                                    return (
                                                        <tr 
                                                            key={log._id}
                                                            onClick={() => setInspectingLog(log)}
                                                            className={`log-row-interactive sev-${sev}`}
                                                        >
                                                            <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>
                                                                {new Date(log.createdAt).toLocaleString('tr-TR')}
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {log.user ? (
                                                                        <>
                                                                            <AdminMedia
                                                                                src={log.user.profile?.avatar}
                                                                                alt=""
                                                                                isAvatar
                                                                                className="v2-avatar-tiny"
                                                                                style={{ width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0 }}
                                                                            />
                                                                            <div>
                                                                                <span
                                                                                    style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fff', fontWeight: 600, fontSize: '12px' }}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openUserDossier(log.user);
                                                                                    }}
                                                                                >
                                                                                    @{log.user.username}
                                                                                </span>
                                                                                {log.country && (
                                                                                    <div style={{ fontSize: '10px', color: '#777' }}>
                                                                                        📍 {log.country} {log.city ? `(${log.city})` : ''}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <span style={{ color: '#888', fontSize: '12px' }}>
                                                                            ⚙️ {log.actorUsername || 'Sistem'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="mono-tag muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                                                                    {log.category}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span className="mono-tag action-code" style={{ fontSize: '10px' }}>
                                                                        {log.action}
                                                                    </span>
                                                                    <span className={`severity-badge ${sev}`}>
                                                                        {sev.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa' }}>
                                                                <div>{log.ip || '-'}</div>
                                                                <div style={{ fontSize: '10px', color: '#666' }}>
                                                                    {log.deviceInfo?.browser || ''} {log.deviceInfo?.os || ''} {log.deviceInfo?.device ? `(${log.deviceInfo.device})` : ''}
                                                                </div>
                                                            </td>
                                                            <td style={{ fontSize: '11px', color: '#aaa' }}>
                                                                {log.portalName || log.portal?.name || log.details?.portalName ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                                        <span className="portal-badge-chip">
                                                                            🏛️ {log.portalName || log.portal?.name || log.details?.portalName}
                                                                        </span>
                                                                        {(log.channel || log.details?.channelName) && (
                                                                            <span className="channel-badge-chip">
                                                                                # {log.channel || log.details?.channelName}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : log.targetType && log.targetType !== 'UserSession' ? (
                                                                    <span className="target-badge-chip">
                                                                        🎯 {log.targetType}: {log.targetName || log.targetId?.substring(0, 8)}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: '#555', fontSize: '11px' }}>🌐 Genel</span>
                                                                )}
                                                            </td>
                                                            <td style={{ fontSize: '12px', color: '#ddd' }}>
                                                                {(() => {
                                                                    const narrative = getActionNarrative(log);
                                                                    return (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '12px' }}>
                                                                                {narrative.title}
                                                                            </div>
                                                                            <div style={{ color: '#aaa', fontSize: '11px', lineHeight: 1.4 }}>
                                                                                {narrative.desc}
                                                                            </div>
                                                                            {(log.details?.hasMedia || log.details?.mediaUrl || log.details?.fileName) && (
                                                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                                                                    <span className="media-mini-pill">
                                                                                        📎 {log.details.mediaType || 'Medya'} {formatFileSize(log.details.fileSize || log.details.sizeBytes) ? `• ${formatFileSize(log.details.fileSize || log.details.sizeBytes)}` : ''}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    className="inspect-eye-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setInspectingLog(log);
                                                                    }}
                                                                    title="Adli Günlük İnceleyicisi"
                                                                >
                                                                    <Eye size={13} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #222', paddingTop: '12px' }}>
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        Toplam <strong>{activityLogsTotal}</strong> kayıt • Sayfa <strong>{activityLogsPage}</strong>
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className="user-box-btn"
                                            disabled={activityLogsPage <= 1}
                                            onClick={() => fetchActivityLogs(activityLogsPage - 1, activityLogsSearch, activityLogsCategory, activityLogsSeverity)}
                                            style={{ opacity: activityLogsPage <= 1 ? 0.4 : 1 }}
                                        >
                                            ← Önceki
                                        </button>
                                        <button
                                            type="button"
                                            className="user-box-btn"
                                            disabled={activityLogs.length < 50}
                                            onClick={() => fetchActivityLogs(activityLogsPage + 1, activityLogsSearch, activityLogsCategory, activityLogsSeverity)}
                                            style={{ opacity: activityLogs.length < 50 ? 0.4 : 1 }}
                                        >
                                            Sonraki →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activityViewMode === 'live' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', margin: 0 }}>
                                            ⚡ Anlık Çevrimiçi Kullanıcılar
                                        </h3>
                                        <span style={{ fontSize: '12px', color: '#666' }}>Socket tabanlı gerçek zamanlı konum ve oturum takibi</span>
                                    </div>
                                    <div className="mono-tag" style={{ border: '1px solid #444', color: connected ? '#fff' : '#888' }}>
                                        {connected ? '● CANLI BAĞLANTI AKTİF' : '○ BAĞLANTI KESİLDİ'}
                                    </div>
                                </div>

                                {activeSessions.length === 0 ? (
                                    <p className="no-data">Şu an aktif çevrimiçi kullanıcı bulunmuyor.</p>
                                ) : (
                                    <div className="users-list">
                                        {activeSessions.map((session) => (
                                            <div key={session.userId} className="user-list-item" style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid #222', background: '#111', marginBottom: '8px' }}>
                                                <div className="user-item-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <AdminMedia
                                                        src={session.avatar}
                                                        alt=""
                                                        className="user-box-avatar"
                                                        isAvatar={true}
                                                        style={{ width: '40px', height: '40px' }}
                                                    />
                                                    <div className="user-item-info">
                                                        <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>
                                                            {session.displayName || session.username}
                                                        </h4>
                                                        <span style={{ fontSize: '12px', color: '#888' }}>@{session.username}</span>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span 
                                                        onClick={() => navigate(session.path)}
                                                        className="mono-tag"
                                                        style={{ cursor: 'pointer', padding: '6px 10px', fontSize: '11px', background: '#181818' }}
                                                    >
                                                        {session.path === '/' ? 'Genel Akış' : session.path}
                                                    </span>

                                                    <button
                                                        className="user-box-btn"
                                                        onClick={() => {
                                                            if (!checkActionPerm('users', 'canBan', 'Kullanıcı Kick / Ban')) return;
                                                            setBanModalTarget({ type: 'user', id: session.userId });
                                                            setBanModalOpen(true);
                                                        }}
                                                        style={{ minWidth: '90px' }}
                                                    >
                                                        Kick / Ban
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    )
                )}
                {activeTab === 'ipbans' && (
                    !getModuleAccess('ipbans').canView ? (
                        renderAccessDenied('IP Engelleri')
                    ) : (
                        <div className="ipbans-section fade-in">
                            {getModuleAccess('ipbans').access === 'view' && renderViewModeBanner('IP Engelleri')}
                            <div className="section-header-modern">
                                <div className="header-left">
                                    <h2>🚫 IP Adresi Engelleme Paneli</h2>
                                    <p>Sistem genelinde şüpheli IP adreslerini, ağ saldırısı veya spam kaynaklarını engelleyin.</p>
                                </div>
                                <div className="header-right">
                                    <button 
                                        className="btn-modern-primary"
                                        onClick={() => {
                                            if (!checkActionPerm('ipbans', 'full', 'IP Engelleme')) return;
                                            const ip = window.prompt('Engellenecek IP adresini yazın:');
                                        if (ip && ip.trim()) {
                                            setBanModalTarget({ type: 'ip', id: ip.trim() });
                                            setBanModalOpen(true);
                                        }
                                    }}
                                    style={{ padding: '10px 20px', fontSize: '14px', background: '#e74c3c' }}
                                >
                                    + IP Engelle
                                </button>
                            </div>
                        </div>

                        {loading && bannedIps.length === 0 && <div className="admin-loading">IP engelleri çekiliyor...</div>}
                        
                        {!loading && bannedIps.length === 0 && (
                            <p className="no-data">Kayıtlı engelli IP bulunmamaktadır.</p>
                        )}

                        <div className="users-list">
                            {bannedIps.map((ban) => (
                                <div key={ban._id} className="user-list-item" style={{ padding: '15px 20px' }}>
                                    <div className="user-item-left" style={{ gap: '15px' }}>
                                        <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        </div>
                                        <div className="user-item-info">
                                            <h4 style={{ fontSize: '16px', fontFamily: 'monospace' }}>{ban.ip}</h4>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Gerekçe: <strong>{ban.reason}</strong> • Ekleyen: @{ban.bannedBy?.username || 'Sistem'}
                                            </span>
                                            {ban.expiresAt && (
                                                <span style={{ fontSize: '11px', color: 'orange', marginTop: '4px', display: 'block' }}>
                                                    Süre Sonu: {new Date(ban.expiresAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button
                                        className="unban-btn-admin"
                                        onClick={() => handleUnbanIp(ban.ip)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(46, 204, 113, 0.15)',
                                            color: '#2ecc71',
                                            border: '1px solid #2ecc71',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            minWidth: '100px'
                                        }}
                                    >
                                        Engeli Kaldır
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    )
                )}

                {activeTab === 'custom-badges' && (
                    !getModuleAccess('custom-badges').canView ? (
                        renderAccessDenied('Özel İkon Rozetler')
                    ) : (
                        <div className="custom-badges-section fade-in">
                            {getModuleAccess('custom-badges').access === 'view' && renderViewModeBanner('Özel İkon Rozetler')}
                            <div className="section-header-modern">
                                <div className="header-left">
                                    <h2>🛡️ Özel İkon Rozetler (Yönetici Rozetleri)</h2>
                                    <p>Sistem genelinde kullanıcılara atanabilecek özel ikon/resim rozetler yükleyin ve yönetin.</p>
                                </div>
                            </div>

                        <div className="custom-badges-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', marginTop: '20px' }}>
                            {/* Left Side: Create / Upload form */}
                            <div className="custom-badge-form-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)' }}>
                                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>{editingCustomBadgeId ? '✏️ Özel Rozeti Düzenle' : 'Yeni Rozet Ekle'}</h3>
                                <form onSubmit={handleSaveCustomBadge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>Rozet Adı</label>
                                        <input
                                            type="text"
                                            className="reason-input-modern"
                                            style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', width: '100%' }}
                                            placeholder="Örn: Top Donör, Moderatör"
                                            value={customBadgeName}
                                            onChange={(e) => setCustomBadgeName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>Rozet Görseli (Görsel veya GIF)</label>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/gif"
                                            onChange={handleCustomBadgeFileSelect}
                                            style={{ display: 'none' }}
                                            id="custom-badge-file-input"
                                            disabled={uploadingCustomBadge}
                                        />
                                        <label
                                            htmlFor="custom-badge-file-input"
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '120px',
                                                border: '2px dashed rgba(255, 255, 255, 0.15)',
                                                borderRadius: '12px',
                                                cursor: uploadingCustomBadge ? 'not-allowed' : 'pointer',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                transition: '0.2s ease',
                                                gap: '8px',
                                                color: '#bbb',
                                                fontSize: '13px'
                                            }}
                                            className="custom-badge-upload-label"
                                        >
                                            {uploadingCustomBadge ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                    <span style={{ color: '#818cf8', fontSize: '13px', fontWeight: '500' }}>Yükleniyor...</span>
                                                </div>
                                            ) : customBadgeUploadedUrl ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <img src={customBadgeUploadedUrl} alt="Preview" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '11px', color: '#4ade80' }}>Değiştirmek için tıklayın</span>
                                                        {!customBadgeUploadedUrl.toLowerCase().endsWith('.gif') && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setCustomBadgeCropperImage(customBadgeUploadedUrl);
                                                                }}
                                                                style={{
                                                                    background: 'rgba(99, 102, 241, 0.25)',
                                                                    border: '1px solid rgba(99, 102, 241, 0.45)',
                                                                    color: '#c7d2fe',
                                                                    fontSize: '11px',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ✂️ Kırp
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '24px' }}>📁</span>
                                                    <span>Dosya Seç (PNG/GIF)</span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>Şekil (Form Faktörü)</label>
                                        <select
                                            value={customBadgeShape}
                                            onChange={(e) => setCustomBadgeShape(e.target.value)}
                                            style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '13px', width: '100%' }}
                                        >
                                            <option value="round">Yuvarlak / Dairesel (Klasik İkon)</option>
                                            <option value="rounded">Hafif Yuvarlatılmış Kare (Modern)</option>
                                            <option value="none">Çerçevesiz / Ham Görsel Şekli</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>Kenarlık Efekti</label>
                                        <select
                                            value={customBadgeBorderStyle}
                                            onChange={(e) => setCustomBadgeBorderStyle(e.target.value)}
                                            style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '13px', width: '100%' }}
                                        >
                                            <option value="thin">İnce Şık Çerçeve (Önerilen)</option>
                                            <option value="subtle">Hafif Saydam Kenarlık</option>
                                            <option value="glow">Neon / Işıltılı Glow Efekti</option>
                                            <option value="none">Kenarlık Yok</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button
                                            type="submit"
                                            className="btn-modern-primary"
                                            style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                                            disabled={uploadingCustomBadge || !customBadgeUploadedUrl}
                                        >
                                            {editingCustomBadgeId ? 'Güncelle' : 'Kaydet'}
                                        </button>
                                        {editingCustomBadgeId && (
                                            <button
                                                type="button"
                                                className="btn-modern-secondary"
                                                onClick={handleCancelCustomBadgeEdit}
                                                style={{ padding: '12px 16px', fontSize: '14px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                                            >
                                                İptal
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Right Side: List of custom badges */}
                            <div className="custom-badges-list-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)' }}>
                                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Aktif Özel Rozetler</h3>
                                {loading ? (
                                    <div className="admin-loading">Yükleniyor...</div>
                                ) : customBadges.length === 0 ? (
                                    <p className="no-data">Yüklenmiş özel rozet bulunmamaktadır.</p>
                                ) : (
                                    <div className="custom-badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                        {customBadges.map((badge) => (
                                            <div key={badge._id} className="custom-badge-item-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', position: 'relative', gap: '12px' }}>
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditCustomBadge(badge)}
                                                        style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0 }}
                                                        title="Düzenle"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCustomBadge(badge._id)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0 }}
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <span
                                                    className={`custom-badge-frame shape-${badge.shape || 'round'} border-${badge.borderStyle || 'thin'}`}
                                                    style={{ width: '42px', height: '42px' }}
                                                >
                                                    <img src={badge.url} alt={badge.name} className="custom-badge-icon" />
                                                </span>
                                                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>{badge.name}</div>
                                                <div style={{ color: '#888', fontSize: '11px', textAlign: 'center' }}>
                                                    {badge.shape === 'rounded' ? 'Kare' : badge.shape === 'none' ? 'Ham' : 'Yuvarlak'} • {badge.borderStyle === 'glow' ? 'Işıltı' : badge.borderStyle === 'subtle' ? 'Saydam' : badge.borderStyle === 'none' ? 'Düz' : 'İnce'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    )
                )}

                {activeTab === 'blog' && (
                    !getModuleAccess('blog').canView ? (
                        renderAccessDenied('Blog Yönetimi')
                    ) : (
                        <div className="blog-admin-container fade-in">
                            {getModuleAccess('blog').access === 'view' && renderViewModeBanner('Blog Yönetimi')}
                            {/* Header & Action Bar */}
                            <div className="blog-admin-header-card">
                                <div className="blog-header-title-wrap">
                                    <h2>📝 Blog & Makale Yönetim Paneli</h2>
                                    <p>Oxypace derin bilim ve teknik analiz makalelerini yazın, düzenleyin ve tek tuşla yayınlayın.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <button className="btn-modern-secondary" onClick={() => { if (!checkActionPerm('blog', 'full', 'Hesaplama Araçları')) return; fetchCalcTools(); setCalcToolsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                        <Calculator size={18} /> Hesaplama Araçları Görselleri
                                    </button>
                                    <button className="btn-modern-secondary" onClick={() => { if (!checkActionPerm('blog', 'full', 'Yazar Profilini Düzenle')) return; setBlogAuthorModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                        <UserCheck size={18} /> Yazar Profilini Düzenle
                                    </button>
                                    <button className="btn-modern-primary btn-glow-cyan" onClick={() => openBlogModal(null)}>
                                        <Plus size={18} /> Yeni Makale Yaz
                                    </button>
                                </div>
                            </div>

                        {/* Stats Summary */}
                        <div className="blog-stats-grid">
                            <div className="blog-stat-card">
                                <span className="stat-label">Toplam Makale</span>
                                <span className="stat-value">{blogPosts.length}</span>
                            </div>
                            <div className="blog-stat-card success">
                                <span className="stat-label">Yayında Olanlar</span>
                                <span className="stat-value">{blogPosts.filter(p => p.isPublished).length}</span>
                            </div>
                            <div className="blog-stat-card warning">
                                <span className="stat-label">Taslaklar</span>
                                <span className="stat-value">{blogPosts.filter(p => !p.isPublished).length}</span>
                            </div>
                            <div className="blog-stat-card info">
                                <span className="stat-label">Farklı Kategori</span>
                                <span className="stat-value">{new Set(blogPosts.map(p => p.category)).size}</span>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="blog-filter-bar">
                            <input
                                type="text"
                                className="reason-input-modern"
                                placeholder="Makale başlığında veya özette ara..."
                                value={blogSearch}
                                onChange={(e) => setBlogSearch(e.target.value)}
                                style={{ flex: 1, minWidth: '220px' }}
                            />
                            <select
                                className="badge-select"
                                value={blogCategoryFilter}
                                onChange={(e) => setBlogCategoryFilter(e.target.value)}
                                style={{ width: '170px', padding: '10px', background: 'rgba(0,0,0,0.3)' }}
                            >
                                <option value="all">Tüm Kategoriler</option>
                                {Array.from(new Set(blogPosts.map(p => p.category))).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select
                                className="badge-select"
                                value={blogStatusFilter}
                                onChange={(e) => setBlogStatusFilter(e.target.value)}
                                style={{ width: '160px', padding: '10px', background: 'rgba(0,0,0,0.3)' }}
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="published">Yayında Olanlar</option>
                                <option value="draft">Taslaklar</option>
                            </select>
                        </div>

                        {/* Articles Grid */}
                        {blogLoading ? (
                            <div className="admin-loading">Makaleler Yükleniyor...</div>
                        ) : filteredBlogPosts.length === 0 ? (
                            <div className="no-data" style={{ padding: '60px', textAlign: 'center' }}>
                                <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p>Kriterlerinize uygun makale bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="blog-admin-grid">
                                {filteredBlogPosts.map(post => (
                                    <div key={post._id} className={`blog-admin-card ${!post.isPublished ? 'is-draft' : ''}`}>
                                        <div className="blog-card-thumb-wrap">
                                            <img src={getImageUrl(post.image) || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86'} alt={post.title} className="blog-card-thumb" />
                                            <span className={`blog-status-badge ${post.isPublished ? 'published' : 'draft'}`}>
                                                {post.isPublished ? '● YAYINDA' : '○ TASLAK'}
                                            </span>
                                        </div>
                                        <div className="blog-card-body">
                                            <div className="blog-card-meta">
                                                <span className="blog-card-category">{post.category}</span>
                                                <span className="blog-card-date">{post.date}</span>
                                                <span className="blog-card-read">• {post.readTime}</span>
                                            </div>
                                            <h3 className="blog-card-title">{post.title}</h3>
                                            <p className="blog-card-excerpt">{post.excerpt || 'Özet eklenmemiş.'}</p>
                                            
                                            <div className="blog-card-actions">
                                                <button
                                                    type="button"
                                                    className={`btn-toggle-publish ${post.isPublished ? 'active' : ''}`}
                                                    onClick={() => handleTogglePublish(post._id)}
                                                    title={post.isPublished ? 'Yayından Kaldır' : 'Tek Tuşla Paylaş'}
                                                >
                                                    {post.isPublished ? '⚡ Yayından Kaldır' : '🚀 Tek Tuşla Paylaş'}
                                                </button>

                                                <div className="blog-card-action-group">
                                                    <a
                                                        href={`/blog/post?slug=${post.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-icon-action"
                                                        title="Sitede Gör"
                                                    >
                                                        <Eye size={16} />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        className="btn-icon-action"
                                                        onClick={() => openBlogModal(post)}
                                                        title="Düzenle"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-icon-action danger"
                                                        onClick={() => handleDeleteBlogPost(post._id)}
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    )
                )}
            </div>

            {/* Blog Article Editor Modal */}
            {blogModalOpen && (
                <div className="modal-overlay-modern">
                    <div className="modal-content-modern blog-editor-modal">
                        <div className="modal-header-modern">
                            <h2>{editingBlogPost ? '✏️ Makaleyi Düzenle' : '✨ Yeni Makale Yaz'}</h2>
                            <button className="close-btn-modern" onClick={() => setBlogModalOpen(false)}>&times;</button>
                        </div>

                        {/* Mode Switcher: Write vs Preview */}
                        <div className="editor-mode-toggle">
                            <button
                                type="button"
                                className={`mode-btn ${blogEditorMode === 'write' ? 'active' : ''}`}
                                onClick={() => setBlogEditorMode('write')}
                            >
                                <Edit3 size={16} /> Düzenle (Editör)
                            </button>
                            <button
                                type="button"
                                className={`mode-btn ${blogEditorMode === 'preview' ? 'active' : ''}`}
                                onClick={() => setBlogEditorMode('preview')}
                            >
                                <Eye size={16} /> Canlı Önizleme
                            </button>
                        </div>

                        <div className="modal-body-scroller">
                            {blogEditorMode === 'write' ? (
                                <div className="blog-form-grid">
                                    <div className="form-group-modern">
                                        <label className="badge-label">Makale Başlığı *</label>
                                        <input
                                            type="text"
                                            className="reason-input-modern"
                                            placeholder="Örn: Zamanın Yönü: Entropi ve Termodinamik"
                                            value={blogForm.title}
                                            onChange={(e) => {
                                                const title = e.target.value;
                                                setBlogForm(prev => ({
                                                    ...prev,
                                                    title,
                                                    slug: prev.slug || title.toLowerCase().trim().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-')
                                                }));
                                            }}
                                            required
                                        />
                                    </div>

                                    <div className="form-row-2">
                                        <div className="form-group-modern">
                                            <label className="badge-label">URL Slug (Otomatik)</label>
                                            <input
                                                type="text"
                                                className="reason-input-modern"
                                                placeholder="zamanin-yonu-entropi"
                                                value={blogForm.slug}
                                                onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group-modern">
                                            <label className="badge-label">Kategori</label>
                                            <select
                                                className="badge-select"
                                                value={blogForm.category}
                                                onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                                                style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', width: '100%' }}
                                            >
                                                <option value="Teorik Fizik">Teorik Fizik</option>
                                                <option value="Ekstrem Doğa Fiziği">Ekstrem Doğa Fiziği</option>
                                                <option value="Kozmoloji">Kozmoloji</option>
                                                <option value="Biyofizik">Biyofizik</option>
                                                <option value="Astrofizik">Astrofizik</option>
                                                <option value="Teknoloji & Yazılım">Teknoloji & Yazılım</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group-modern">
                                        <label className="badge-label">Öne Çıkan Kapak Görseli URL veya Dosya</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                className="reason-input-modern"
                                                placeholder="https://images.unsplash.com/..."
                                                value={blogForm.image}
                                                onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <label className="btn-modern-ghost" style={{ cursor: 'pointer', margin: 0, padding: '10px 16px', display: 'inline-flex', alignItems: 'center' }}>
                                                {uploadingBlogImage ? 'Yükleniyor...' : 'Görsel Seç'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleBlogImageFileSelect}
                                                    disabled={uploadingBlogImage}
                                                />
                                            </label>
                                        </div>
                                        {blogForm.image && (
                                            <img src={getImageUrl(blogForm.image)} alt="Önizleme" className="blog-form-image-preview" />
                                        )}
                                    </div>

                                    <div className="form-group-modern">
                                        <label className="badge-label">Kısa Özet (Excerpt)</label>
                                        <textarea
                                            className="reason-input-modern"
                                            placeholder="Makalenin anasayfa kartında görünecek çarpıcı özet metni..."
                                            rows="3"
                                            value={blogForm.excerpt}
                                            onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group-modern">
                                        <div className="editor-toolbar-header" style={{ flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                            <label className="badge-label" style={{ margin: 0 }}>Makale İçeriği *</label>
                                            <div className="editor-template-tools" style={{ display: 'flex', gap: '6px' }}>
                                                <button type="button" className="template-btn" onClick={() => loadTemplate('science')}>🚀 Bilim Şablonu</button>
                                                <button type="button" className="template-btn" onClick={() => loadTemplate('announcement')}>📢 Duyuru Şablonu</button>
                                            </div>
                                        </div>

                                        {/* Rich Formatting Toolbar */}
                                        <div className="editor-rich-toolbar">
                                            <button type="button" onClick={() => insertFormat('📌 ', '')} title="Ana Başlık Ekle">📌 Ana Başlık</button>
                                            <button type="button" onClick={() => insertFormat('🔹 ', '')} title="Alt Başlık Ekle">🔹 Alt Başlık</button>
                                            <button type="button" onClick={() => insertFormat('**', '**')} title="Seçili Metni Kalın Yap"><b>B</b> Kalın</button>
                                            <button type="button" onClick={() => insertFormat('💬 "', '"')} title="Öne Çıkan Alıntı Kutusu">💬 Alıntı Kutusu</button>
                                            <button type="button" onClick={() => insertFormat('💡 ', '')} title="Önemli Not / Vurgu Kutusu">💡 Bilgi Kutusu</button>
                                            <button type="button" onClick={() => insertFormat('- ', '\n- ')} title="Maddeli Liste">• Liste</button>
                                        </div>

                                        <textarea
                                            id="blog-content-editor"
                                            className="reason-input-modern blog-content-textarea"
                                            placeholder="Normal bir metin yazar gibi makalenizi buraya yazın. Başlık veya alıntı yapmak istediğiniz satırın başına yukarıdaki butonları tıklayarak simgeleri ekleyebilirsiniz."
                                            rows="13"
                                            value={blogForm.content}
                                            onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                                            required
                                        />
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                                            <span>✨ HTML bilmenize gerek yok! Düz metin yazıp yukarıdaki butonları kullanmanız yeterlidir.</span>
                                            <span>
                                                📊 {blogForm.content ? `${blogForm.content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length} Kelime (~${Math.max(1, Math.ceil(blogForm.content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length / 200))} dk okuma)` : '0 Kelime'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-row-2" style={{ alignItems: 'center' }}>
                                        <div className="form-group-modern">
                                            <label className="badge-label">Okuma Süresi Etiketi (Opsiyonel)</label>
                                            <input
                                                type="text"
                                                className="reason-input-modern"
                                                placeholder="Örn: 10 dk okuma (Boş bırakılırsa otomatik hesaplanır)"
                                                value={blogForm.readTime}
                                                onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group-modern" style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                                            <label className="publish-toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={blogForm.isPublished}
                                                    onChange={(e) => setBlogForm({ ...blogForm, isPublished: e.target.checked })}
                                                    style={{ width: '18px', height: '18px', accentColor: '#22c55e' }}
                                                />
                                                <span>Tek Tuşla Hemen Yayınlansın</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="blog-preview-container">
                                    <div className="blog-preview-header">
                                        <span className="blog-preview-category">{blogForm.category}</span>
                                        <h1 className="blog-preview-title">{blogForm.title || 'Başlıksız Makale'}</h1>
                                        <span className="blog-preview-meta">{blogForm.readTime || '5 dk okuma'}</span>
                                    </div>
                                    {blogForm.image && (
                                        <img src={getImageUrl(blogForm.image)} alt="" className="blog-preview-image" />
                                    )}
                                    <div
                                        className="blog-preview-body prose prose-invert"
                                        dangerouslySetInnerHTML={{ __html: ensureHtmlFormatted(blogForm.content) || '<p style="color:#888">İçerik henüz girilmedi...</p>' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer-modern">
                            <button type="button" className="btn-modern-ghost" onClick={() => setBlogModalOpen(false)}>İptal</button>
                            <button
                                type="button"
                                className="btn-modern-primary btn-glow-cyan"
                                onClick={handleSaveBlogPost}
                                disabled={blogSaving}
                            >
                                {blogSaving ? 'KAYDEDİLİYOR...' : (editingBlogPost ? 'GÜNCELLE & KAYDET' : 'PAYLAŞ & OLUŞTUR')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blog Author Profile Modal */}
            {blogAuthorModalOpen && (
                <div className="modal-overlay-modern backdrop-blur fade-in">
                    <div className="modal-content-modern blog-modal-wide" style={{ maxWidth: '650px' }}>
                        <div className="modal-header-modern">
                            <div className="modal-title-wrap">
                                <h3>✍️ Yazar Profili Ayarları</h3>
                                <p>Makalelerinizin altında gösterilecek yazar kartı bilgilerinizi düzenleyin.</p>
                            </div>
                            <button className="btn-close-modern" onClick={() => setBlogAuthorModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-modern">
                            {currentUser?.isAdmin && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <button
                                        type="button"
                                        className="btn-modern-secondary"
                                        onClick={async () => {
                                            setAuthorEditTarget('mine');
                                            const { data } = await axios.get('/api/blog/author');
                                            if (data) setBlogAuthor(data);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: authorEditTarget === 'mine' ? 'rgba(34,211,238,0.2)' : 'transparent',
                                            color: '#fff',
                                            border: authorEditTarget === 'mine' ? '1px solid rgba(34,211,238,0.5)' : 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}
                                    >
                                        👤 Kendi Yazar Profilim
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-modern-secondary"
                                        onClick={async () => {
                                            setAuthorEditTarget('official');
                                            const official = blogAuthors.find(a => a.isOfficial);
                                            if (official) setBlogAuthor(official);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: authorEditTarget === 'official' ? 'rgba(34,211,238,0.2)' : 'transparent',
                                            color: '#fff',
                                            border: authorEditTarget === 'official' ? '1px solid rgba(34,211,238,0.5)' : 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}
                                    >
                                        🏢 Oxypace Resmi Yazar Profili
                                    </button>
                                </div>
                            )}

                            {/* Avatar Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <img
                                    src={getImageUrl(blogAuthor.avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                                    alt={blogAuthor.name}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(34,211,238,0.5)' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <label className="badge-label">Profil Fotoğrafı (Avatar)</label>
                                    <p className="badge-help-text" style={{ marginBottom: '8px' }}>Yazar kartınızda ve makale detaylarında görünür.</p>
                                    <label className="btn-modern-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        {uploadingAuthorAvatar ? 'Fotoğraf Yükleniyor...' : 'Fotoğraf Değiştir'}
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAuthorAvatarFileSelect} />
                                    </label>
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group-modern">
                                    <label className="badge-label">Yazar Adı / Kullanıcı Adı</label>
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        value={blogAuthor.name}
                                        onChange={(e) => setBlogAuthor({ ...blogAuthor, name: e.target.value })}
                                        placeholder="Örn: Oxypace veya Adınız"
                                    />
                                </div>
                                <div className="form-group-modern">
                                    <label className="badge-label">Yazar Rozeti / Unvan Etiketi</label>
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        value={blogAuthor.badge}
                                        onChange={(e) => setBlogAuthor({ ...blogAuthor, badge: e.target.value })}
                                        placeholder="Örn: Baş Yazar, Kurucu"
                                    />
                                </div>
                            </div>

                            <div className="form-group-modern">
                                <label className="badge-label">Yazar Mesleki Unvanı</label>
                                <input
                                    type="text"
                                    className="reason-input-modern"
                                    value={blogAuthor.title}
                                    onChange={(e) => setBlogAuthor({ ...blogAuthor, title: e.target.value })}
                                    placeholder="Örn: Oxypace Kurucusu & Teorik Fizik Araştırmacısı"
                                />
                            </div>

                            <div className="form-group-modern">
                                <label className="badge-label">Biyografi / Hakkında</label>
                                <textarea
                                    className="reason-input-modern"
                                    rows="3"
                                    value={blogAuthor.bio}
                                    onChange={(e) => setBlogAuthor({ ...blogAuthor, bio: e.target.value })}
                                    placeholder="Makale okuyucularına kendinizi kısaca tanıtın..."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ paddingTop: '8px' }}>
                                <label className="badge-label" style={{ marginBottom: '8px', display: 'block' }}>🌐 Sosyal Medya & Web Bağlantıları</label>
                                <div className="form-row-2">
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        value={blogAuthor.github}
                                        onChange={(e) => setBlogAuthor({ ...blogAuthor, github: e.target.value })}
                                        placeholder="GitHub Profil URL (https://github.com/...)"
                                    />
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        value={blogAuthor.twitter}
                                        onChange={(e) => setBlogAuthor({ ...blogAuthor, twitter: e.target.value })}
                                        placeholder="Twitter / X URL (https://x.com/...)"
                                    />
                                </div>
                                <div className="form-row-2" style={{ marginTop: '10px' }}>
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        value={blogAuthor.website}
                                        onChange={(e) => setBlogAuthor({ ...blogAuthor, website: e.target.value })}
                                        placeholder="Kişisel Web Sitesi (https://...)"
                                    />
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        value={blogAuthor.linkedin}
                                        onChange={(e) => setBlogAuthor({ ...blogAuthor, linkedin: e.target.value })}
                                        placeholder="LinkedIn URL (https://linkedin.com/...)"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-modern">
                            <button type="button" className="btn-modern-ghost" onClick={() => setBlogAuthorModalOpen(false)}>İptal</button>
                            <button
                                type="button"
                                className="btn-modern-primary btn-glow-cyan"
                                onClick={handleSaveBlogAuthor}
                                disabled={blogAuthorSaving}
                            >
                                {blogAuthorSaving ? 'KAYDEDİLİYOR...' : 'YAZAR PROFİLİNİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reason Modal */}
            <ReasonModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                actionType={modalAction}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModalOpen}
                onClose={() => setAlertModalOpen(false)}
                onSubmit={handleAlertSubmit}
                portalName={alertPortalName}
            />

            {/* Feedback Response Modal */}
            <FeedbackResponseModal 
                isOpen={feedbackModalOpen} 
                onClose={() => setFeedbackModalOpen(false)}
                feedback={selectedFeedback}
                onSubmit={handleFeedbackReply}
            />

            {/* Custom Ban Modal for User / IP Banning */}
            <BanModal
                isOpen={banModalOpen}
                onClose={() => setBanModalOpen(false)}
                onSubmit={handleBanSubmit}
                type={banModalTarget.type}
            />

            {/* Portal Detail / Management Modal */}
            <PortalDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                portal={detailPortal}
                loading={loadingPortalDossier}
                contextBadges={contextBadges}
                customBadges={customBadges}
                handlePortalBadge={handlePortalBadge}
                handlePortalCustomBadgeAssign={handlePortalCustomBadgeAssign}
                handleNSFWToggle={handleNSFWToggle}
                handleReadOnlyToggle={handleReadOnlyToggle}
                initiatePortalStatusChange={initiatePortalStatusChange}
                openAlertModal={openAlertModal}
                handleRemoveAlert={handleRemoveAlert}
                ownershipTarget={ownershipTarget}
                setOwnershipTarget={setOwnershipTarget}
                handleTransferOwnership={handleTransferOwnership}
                transferring={transferring}
                onAddChannel={handleAdminAddChannel}
                onEditChannel={handleAdminEditChannel}
                onDeleteChannel={handleAdminDeleteChannel}
                openPortalPosts={openPortalPosts}
                openUserDossier={openUserDossier}
                onInspectLog={setInspectingLog}
                onMediaClick={setMediaLightbox}
            />

            {/* User Detail / Management Modal */}
            <UserDetailModal
                isOpen={userDetailModalOpen}
                onClose={() => setUserDetailModalOpen(false)}
                user={selectedUserDetail}
                contextBadges={contextBadges}
                handleBadgeChange={handleBadgeChange}
                handleUnbanUser={handleUnbanUser}
                setBanModalTarget={setBanModalTarget}
                setBanModalOpen={setBanModalOpen}
                handleImpersonate={handleImpersonate}
                handleUserShadowbanToggle={handleUserShadowbanToggle}
                isOxypace={isOxypace}
                handleApproveRecovery={handleApproveRecovery}
                handleRejectRecovery={handleRejectRecovery}
                customBadges={customBadges}
                handleCustomBadgeAssign={handleCustomBadgeAssign}
                hasPerm={hasPerm}
            />

            {/* Image Cropper Modal for Custom Badges */}
            {customBadgeCropperImage && (
                <ImageCropper
                    image={customBadgeCropperImage}
                    file={customBadgeCropperFile}
                    mode="badge"
                    aspectRatio={customBadgeCropperAspectRatio}
                    onComplete={handleCustomBadgeCropComplete}
                    onCancel={() => setCustomBadgeCropperImage(null)}
                    title="Özel Rozet Görseli Kırpıcı"
                />
            )}

            {/* =============================================
               BADGE STUDIO MODAL (Modern Interactive Editor)
               ============================================= */}
            {badgeModalOpen && (
                <div className="modal-overlay-modern" onClick={() => setBadgeModalOpen(false)}>
                    <div
                        className="modal-content-modern badge-studio-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="badge-studio-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="badge-studio-header-icon">
                                    <ShieldCheck size={20} color="#ffffff" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                        {editingBadge ? `Rozet Düzenle: ${editingBadge.name}` : 'Oxypace Doğrulama Rozeti Stüdyosu'}
                                    </h2>
                                    <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                                        10-Köşe ve 12-Köşe X/Twitter geometrisi, dinamik metalik krom yansıma ve kurumsal renk motoru.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="close-btn-modern"
                                onClick={() => setBadgeModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Split Body */}
                        <div className="badge-studio-modal-body">
                            {/* LEFT: Live Interactive Canvas & Contexts */}
                            <div className="badge-studio-canvas">
                                {/* Stage */}
                                <div
                                    className="badge-canvas-hero"
                                    style={{
                                        background: badgeCanvasBg === 'light'
                                            ? '#f4f4f5'
                                            : '#09090b',
                                        border: badgeCanvasBg === 'light'
                                            ? '1px solid #d4d4d8'
                                            : '1px solid #27272a'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setBadgeCanvasBg('dark')}
                                            className={`badge-canvas-theme-btn ${badgeCanvasBg === 'dark' ? 'active' : ''}`}
                                            title="Koyu Tema Kontrastı"
                                        >
                                            <Moon size={11} />
                                            <span>KOYU</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBadgeCanvasBg('light')}
                                            className={`badge-canvas-theme-btn ${badgeCanvasBg === 'light' ? 'active' : ''}`}
                                            title="Açık Tema Kontrastı"
                                        >
                                            <Sun size={11} />
                                            <span>AÇIK</span>
                                        </button>
                                    </div>

                                    {/* Main Showcase Badge */}
                                    <Badge badge={badgeForm} size={58} />
                                    <div
                                        className="badge-canvas-hero-name"
                                        style={{ color: badgeCanvasBg === 'light' ? '#09090b' : '#ffffff' }}
                                    >
                                        <span>{badgeForm.name || 'Yeni Rozet'}</span>
                                        <Badge badge={badgeForm} size={18} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: badgeCanvasBg === 'light' ? '#52525b' : '#a1a1aa', fontFamily: 'monospace' }}>
                                        @{badgeForm.slug || 'rozet-kodu'}
                                    </span>
                                </div>

                                {/* Multi-Size Comparison Bar */}
                                <div className="badge-size-preview-row">
                                    {[16, 20, 24, 32, 44].map((sz) => (
                                        <div key={sz} className="badge-size-item">
                                            <Badge badge={badgeForm} size={sz} />
                                            <span className="badge-size-label">{sz}px</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Simulated In-App Context: Post */}
                                <div className="badge-simulated-context">
                                    <div className="badge-sim-header">
                                        <Smartphone size={12} />
                                        <span>CANLI AKIŞ ÖNİZLEMESİ</span>
                                    </div>
                                    <div className="badge-sim-post">
                                        <div className="badge-sim-avatar">O</div>
                                        <div className="badge-sim-content">
                                            <div className="badge-sim-user">
                                                <span>Oxypace Global</span>
                                                <Badge badge={badgeForm} size={17} />
                                                <span className="badge-sim-handle">@oxypace • 2d</span>
                                            </div>
                                            <div className="badge-sim-text">
                                                Oxypace kurumsal doğrulama rozeti aktif ve doğrulanmış profillerde yayında.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 1-Click Fast Presets */}
                                <div className="badge-presets-section">
                                    <div className="badge-control-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Zap size={13} color="#ffffff" />
                                            <span>KURUMSAL DOĞRULAMA ŞABLONLARI</span>
                                        </div>
                                    </div>
                                    <div className="badge-presets-grid">
                                        {BADGE_PRESETS.map((pst) => (
                                            <button
                                                key={pst.id}
                                                type="button"
                                                className="badge-preset-btn"
                                                onClick={() => applyBadgePreset(pst)}
                                                title={pst.desc}
                                            >
                                                <Badge badge={pst.badge} size={22} />
                                                <div className="badge-preset-info">
                                                    <div className="badge-preset-title">{pst.name}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Studio Deep Controls */}
                            <div className="badge-studio-controls">
                                {/* 1. Name & Slug */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div className="badge-control-group">
                                        <label className="badge-label">Rozet Adı</label>
                                        <input
                                            className="reason-input-modern"
                                            style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '4px' }}
                                            value={badgeForm.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="Örn: X Mavi Onay, Kurumsal Altın"
                                        />
                                    </div>
                                    <div className="badge-control-group">
                                        <label className="badge-label">Rozet Kodu (Slug)</label>
                                        <input
                                            className="reason-input-modern"
                                            style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', borderRadius: '4px' }}
                                            value={badgeForm.slug}
                                            onChange={(e) => setBadgeForm({ ...badgeForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            placeholder="otomatik-olusturulur"
                                            disabled={editingBadge?.isDefault}
                                        />
                                    </div>
                                </div>

                                {/* 2. Visual Shape Selector */}
                                <div className="badge-control-group">
                                    <div className="badge-control-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Layers size={13} color="#ffffff" />
                                            <span>ROZET GEOMETRİSİ & FORMU</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
                                            {SHAPES.find(s => s.value === badgeForm.shape)?.label}
                                        </span>
                                    </div>
                                    <p className="badge-help-text">Twitter / X 10-Köşeli Orijinal Rozet, 12-Köşeli Kurumsal veya Altın Şirket Squircle formu.</p>
                                    <div className="badge-shape-grid">
                                        {SHAPES.map((sh) => (
                                            <button
                                                key={sh.value}
                                                type="button"
                                                className={`badge-shape-card ${badgeForm.shape === sh.value ? 'active' : ''}`}
                                                onClick={() => setBadgeForm({ ...badgeForm, shape: sh.value })}
                                                title={sh.desc}
                                            >
                                                <Badge
                                                    badge={{
                                                        ...badgeForm,
                                                        shape: sh.value,
                                                        style: {
                                                            ...badgeForm.style,
                                                            animationType: 'none'
                                                        }
                                                    }}
                                                    size={26}
                                                />
                                                <span>{sh.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Inner Icon & Inner Color */}
                                <div className="badge-control-group">
                                    <div className="badge-control-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={13} color="#ffffff" />
                                            <span>İÇ SEMBOL & RENK</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '11px', color: '#71717a' }}>Sembol:</span>
                                            <input
                                                type="color"
                                                value={badgeForm.style.innerIconColor || '#ffffff'}
                                                onChange={(e) => setBadgeForm({
                                                    ...badgeForm,
                                                    style: { ...badgeForm.style, innerIconColor: e.target.value }
                                                })}
                                                className="badge-color-input"
                                                style={{ width: '22px', height: '22px' }}
                                                title="İç sembol rengi (Checkmark / Yıldız rengi)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, innerIconColor: '#ffffff' } })}
                                                className="badge-color-quick-btn"
                                            >
                                                Beyaz
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, innerIconColor: '#000000' } })}
                                                className="badge-color-quick-btn"
                                            >
                                                Siyah
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, innerIconColor: '#ffd700' } })}
                                                className="badge-color-quick-btn"
                                            >
                                                Altın
                                            </button>
                                        </div>
                                    </div>
                                    <div className="badge-icon-grid">
                                        {ICONS.map((ic) => (
                                            <button
                                                key={ic.value}
                                                type="button"
                                                className={`badge-icon-btn ${badgeForm.icon === ic.value ? 'active' : ''}`}
                                                onClick={() => setBadgeForm({ ...badgeForm, icon: ic.value })}
                                            >
                                                <Badge
                                                    badge={{
                                                        ...badgeForm,
                                                        icon: ic.value,
                                                        style: { ...badgeForm.style, animationType: 'none' }
                                                    }}
                                                    size={20}
                                                />
                                                <span>{ic.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Style & Material Engine */}
                                <div className="badge-control-group">
                                    <div className="badge-control-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Sliders size={13} color="#ffffff" />
                                            <span>MATERYAL & RENK MOTORU</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 700 }}>
                                            {STYLE_MODES.find(m => m.value === badgeForm.style.type)?.label}
                                        </span>
                                    </div>
                                    <div className="badge-style-modes">
                                        {STYLE_MODES.map((sm) => (
                                            <button
                                                key={sm.value}
                                                type="button"
                                                className={`badge-mode-btn ${badgeForm.style.type === sm.value ? 'active' : ''}`}
                                                onClick={() => setBadgeForm({
                                                    ...badgeForm,
                                                    style: { ...badgeForm.style, type: sm.value }
                                                })}
                                                title={sm.desc}
                                            >
                                                {sm.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Color & Material Details */}
                                    <div className="badge-material-panel">
                                        <div className="badge-material-colors-row">
                                            {/* Primary Color */}
                                            <div className="badge-material-color-cell">
                                                <span className="badge-material-color-label">
                                                    Ana Renk (Gövde)
                                                </span>
                                                <div className="badge-color-wrap">
                                                    <input
                                                        type="color"
                                                        value={badgeForm.style.primaryColor || '#1d9bf0'}
                                                        onChange={(e) => setBadgeForm({
                                                            ...badgeForm,
                                                            style: { ...badgeForm.style, primaryColor: e.target.value }
                                                        })}
                                                        className="badge-color-input"
                                                    />
                                                    <span className="badge-hex-code">{badgeForm.style.primaryColor}</span>
                                                </div>
                                            </div>

                                            {/* Secondary / Sheen Color */}
                                            {badgeForm.style.type !== 'solid' && (
                                                <div className="badge-material-color-cell">
                                                    <span className="badge-material-color-label">
                                                        İkincil / Yansıma Rengi
                                                    </span>
                                                    <div className="badge-color-wrap">
                                                        <input
                                                            type="color"
                                                            value={badgeForm.style.secondaryColor || '#ffffff'}
                                                            onChange={(e) => setBadgeForm({
                                                                ...badgeForm,
                                                                style: { ...badgeForm.style, secondaryColor: e.target.value }
                                                            })}
                                                            className="badge-color-input"
                                                        />
                                                        <span className="badge-hex-code">{badgeForm.style.secondaryColor || 'Otomatik'}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Angle Slider for gradient / reflection */}
                                            {badgeForm.style.type !== 'solid' && (
                                                <div className="badge-material-angle-cell">
                                                    <div className="badge-angle-header">
                                                        <span>Yansıma Açısı</span>
                                                        <span className="badge-angle-val">{badgeForm.style.gradientAngle ?? 135}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="360"
                                                        step="15"
                                                        value={badgeForm.style.gradientAngle ?? 135}
                                                        onChange={(e) => setBadgeForm({
                                                            ...badgeForm,
                                                            style: { ...badgeForm.style, gradientAngle: Number(e.target.value) }
                                                        })}
                                                        className="badge-range-slider"
                                                    />
                                                </div>
                                            )}

                                            {/* Glow Color */}
                                            <div className="badge-material-color-cell">
                                                <span className="badge-material-color-label">
                                                    Işıma (Glow)
                                                </span>
                                                <div className="badge-color-wrap">
                                                    <input
                                                        type="color"
                                                        value={badgeForm.style.glowColor || badgeForm.style.primaryColor}
                                                        onChange={(e) => setBadgeForm({
                                                            ...badgeForm,
                                                            style: { ...badgeForm.style, glowColor: e.target.value }
                                                        })}
                                                        className="badge-color-input"
                                                    />
                                                    <span className="badge-hex-code">{badgeForm.style.glowColor || 'Varsayılan'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Color Palette */}
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: '6px' }}>
                                                Hızlı Kurumsal Renk Paleti (1-Tıkla Uygula)
                                            </div>
                                            <div className="badge-palette-row">
                                                {QUICK_PALETTES.map((qp) => (
                                                    <button
                                                        key={qp.hex}
                                                        type="button"
                                                        className="badge-palette-dot"
                                                        style={{ background: qp.hex }}
                                                        onClick={() => setBadgeForm({
                                                            ...badgeForm,
                                                            style: { ...badgeForm.style, primaryColor: qp.hex }
                                                        })}
                                                        title={`${qp.name} (${qp.hex})`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Animation FX */}
                                <div className="badge-control-group">
                                    <div className="badge-control-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <RefreshCw size={13} color="#ffffff" />
                                            <span>ANİMASYON EFEKTİ</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {ANIM_TYPES.map((a) => (
                                            <button
                                                key={a.value}
                                                type="button"
                                                className={`badge-anim-btn ${badgeForm.style.animationType === a.value ? 'active' : ''}`}
                                                onClick={() => setBadgeForm({
                                                    ...badgeForm,
                                                    style: { ...badgeForm.style, animationType: a.value }
                                                })}
                                            >
                                                {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 6. Category Scope */}
                                <div className="badge-control-group">
                                    <div className="badge-control-title">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Layers size={13} color="#ffffff" />
                                            <span>KULLANIM ALANI</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { v: 'both', l: 'Her İkisi', icon: Layers },
                                            { v: 'user', l: 'Sadece Kullanıcı', icon: User },
                                            { v: 'portal', l: 'Sadece Portal', icon: Globe },
                                        ].map((c) => {
                                            const IconComp = c.icon;
                                            return (
                                                <button
                                                    key={c.v}
                                                    type="button"
                                                    className={`badge-scope-btn ${badgeForm.category === c.v ? 'active' : ''}`}
                                                    onClick={() => setBadgeForm({ ...badgeForm, category: c.v })}
                                                >
                                                    <IconComp size={13} />
                                                    <span>{c.l}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="badge-studio-modal-footer">
                            <button
                                type="button"
                                className="badge-btn-cancel"
                                onClick={() => setBadgeModalOpen(false)}
                            >
                                İptal
                            </button>
                            <button
                                type="button"
                                className="badge-btn-save"
                                onClick={handleBadgeSave}
                            >
                                {editingBadge ? (
                                    <>
                                        <Check size={14} />
                                        <span>GÜNCELLE VE KAYDET</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        <span>ROZETİ OLUŞTUR</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =============================================
               DIRECT BADGE ASSIGNMENT MODAL
               ============================================= */}
            {assignModalOpen && assignTargetBadge && (
                <div className="modal-overlay-modern" onClick={() => setAssignModalOpen(false)}>
                    <div
                        className="modal-content-modern badge-assign-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-modern">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {assignType === 'user' ? <User size={16} /> : <Globe size={16} />}
                                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#ffffff' }}>
                                    {assignType === 'user' ? 'Kullanıcıya Rozet Ata' : 'Portala Rozet Ata'}
                                </h2>
                            </div>
                            <button className="close-btn-modern" onClick={() => setAssignModalOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-body-modern" style={{ gap: '16px' }}>
                            {/* Selected Badge Preview */}
                            <div className="badge-assign-target-preview">
                                <Badge badge={assignTargetBadge} size={36} />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>
                                        {assignTargetBadge.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                        @{assignTargetBadge.slug}
                                    </div>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div>
                                <label className="badge-label">
                                    {assignType === 'user' ? 'Kullanıcı Ara' : 'Portal Ara'}
                                </label>
                                <input
                                    type="text"
                                    className="reason-input-modern"
                                    placeholder={assignType === 'user' ? 'Kullanıcı adı veya isim yazın...' : 'Portal adı yazın...'}
                                    value={assignQuery}
                                    onChange={(e) => handleAssignSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {assignSuccessMsg && (
                                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '12px' }}>
                                    ✓ {assignSuccessMsg}
                                </div>
                            )}

                            {assignLoading && (
                                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                                    Aranıyor...
                                </div>
                            )}

                            {/* Results List */}
                            <div className="badge-assign-list">
                                {assignResults.map((item) => {
                                    if (assignType === 'user') {
                                        const hasThisBadge = item.verificationBadge === assignTargetBadge.slug;
                                        return (
                                            <div key={item._id} className="badge-assign-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                                                        {item.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                                                            {item.profile?.displayName || item.username}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                                                            @{item.username} {item.verificationBadge && item.verificationBadge !== 'none' ? `(${item.verificationBadge})` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    {hasThisBadge ? (
                                                        <button
                                                            type="button"
                                                            className="badge-action-btn delete"
                                                            onClick={() => executeBadgeRevoke(item)}
                                                        >
                                                            Kaldır
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="badge-action-btn assign"
                                                            onClick={() => executeBadgeAssign(item)}
                                                        >
                                                            Ata
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const existingBadges = item.badges || [];
                                        const hasThisBadge = existingBadges.includes(assignTargetBadge.slug);
                                        return (
                                            <div key={item._id} className="badge-assign-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                                                        {item.name?.[0]?.toUpperCase() || 'P'}
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                                                            {item.name}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                                                            {existingBadges.length > 0 ? `${existingBadges.join(', ')}` : 'Rozet yok'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    {hasThisBadge ? (
                                                        <button
                                                            type="button"
                                                            className="badge-action-btn delete"
                                                            onClick={() => executeBadgeRevoke(item)}
                                                        >
                                                            Kaldır
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="badge-action-btn assign"
                                                            onClick={() => executeBadgeAssign(item)}
                                                        >
                                                            Ata
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>

                        <div className="modal-footer-modern">
                            <button
                                type="button"
                                className="btn-modern-ghost"
                                onClick={() => setAssignModalOpen(false)}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Calculation Tools Cover Images Modal */}
            {calcToolsModalOpen && (
                <div className="modal-overlay-modern" onClick={() => { setCalcToolsModalOpen(false); setEditingCalcTool(null); }}>
                    <div className="modal-content-modern" style={{ maxWidth: '750px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-modern">
                            <h2>🧮 Hesaplama Araçları Kapak Görselleri</h2>
                            <button className="close-btn-modern" onClick={() => { setCalcToolsModalOpen(false); setEditingCalcTool(null); }}>×</button>
                        </div>
                        <div className="modal-body-modern" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            <p className="modal-description-modern">
                                Hesaplama portalında (`/calculations`) listelenen interaktif simülasyon araçlarının kapak görsellerini düzenleyin.
                            </p>

                            {calcToolsLoading ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Araçlar Yükleniyor...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                                    {calcToolsList.map(tool => {
                                        const titleStr = typeof tool.title === 'object' ? (tool.title.tr || tool.title.en) : tool.title;
                                        const isEditing = editingCalcTool?.toolId === tool.toolId;

                                        return (
                                            <div
                                                key={tool.toolId || tool._id}
                                                style={{
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '16px',
                                                    padding: '20px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '16px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {/* Preview Thumbnail */}
                                                    <div style={{ width: '140px', height: '80px', borderRadius: '10px', overflow: 'hidden', background: '#000', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }}>
                                                        <img
                                                            src={getImageUrl(isEditing ? (calcToolImageUrl || tool.image) : tool.image) || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86'}
                                                            alt={titleStr}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {tool.category || 'SIMULATOR'}
                                                        </div>
                                                        <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                                                            {titleStr}
                                                        </h3>
                                                        <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                                                            Rota: {tool.slug}
                                                        </div>
                                                    </div>

                                                    {!isEditing && (
                                                        <button
                                                            type="button"
                                                            className="btn-modern-secondary"
                                                            onClick={() => {
                                                                setEditingCalcTool(tool);
                                                                setCalcToolImageUrl(tool.image || '');
                                                            }}
                                                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        >
                                                            <Edit3 size={15} /> Kapak Resmini Değiştir
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Editing inputs */}
                                                {isEditing && (
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#ccc' }}>
                                                            📷 Kapak Resmi Seç veya URL Yapıştır:
                                                        </label>
                                                        
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <input
                                                                type="text"
                                                                className="reason-input-modern"
                                                                placeholder="https://images.unsplash.com/... veya yüklenen medya URL'si"
                                                                value={calcToolImageUrl}
                                                                onChange={(e) => setCalcToolImageUrl(e.target.value)}
                                                                style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px' }}
                                                            />
                                                            <label className="btn-modern-secondary" style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                                <Image size={16} /> {uploadingCalcToolImage ? 'Yükleniyor...' : 'Dosya Seç'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleCalcToolFileSelect(e, tool.toolId)}
                                                                    style={{ display: 'none' }}
                                                                    disabled={uploadingCalcToolImage}
                                                                />
                                                            </label>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                                            <button
                                                                type="button"
                                                                className="btn-modern-ghost"
                                                                onClick={() => { setEditingCalcTool(null); setCalcToolImageUrl(''); }}
                                                                style={{ padding: '8px 14px', fontSize: '13px' }}
                                                            >
                                                                İptal
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-modern-primary btn-glow-cyan"
                                                                onClick={() => handleSaveCalcToolImage(tool.toolId, calcToolImageUrl)}
                                                                disabled={calcToolSaving || uploadingCalcToolImage}
                                                                style={{ padding: '8px 18px', fontSize: '13px' }}
                                                            >
                                                                {calcToolSaving ? 'Kaydediliyor...' : 'Görseli Kaydet'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-modern">
                            <button type="button" className="btn-modern-ghost" onClick={() => { setCalcToolsModalOpen(false); setEditingCalcTool(null); }}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER DOSSIER / ŞECERE MODAL */}
            {userDossierOpen && (
                <div className="modal-overlay-modern" onClick={() => setUserDossierOpen(false)}>
                    <div className="modal-content-modern dossier-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-modern" style={{ borderBottom: '1px solid #222', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', margin: 0 }}>
                                    📋 Kullanıcı Şecere & Adli Sicil Dosyası
                                </h2>
                                {userDossierData?.user && (
                                    <>
                                        <span className="mono-tag inverted" style={{ fontSize: '10px' }}>
                                            @{userDossierData.user.username}
                                        </span>
                                        {userDossierData.user.isDeleted && (
                                            <span className="mono-tag" style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', fontSize: '10px', fontWeight: 700 }}>
                                                🗑️ SİLİNMİŞ (PASİF HESAP)
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                            <button className="close-btn-modern" onClick={() => setUserDossierOpen(false)}>&times;</button>
                        </div>

                        <div className="modal-body-modern" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {loadingDossier ? (
                                <div className="admin-loading">Kullanıcı şeceresi ve adli kayıtlar getiriliyor...</div>
                            ) : !userDossierData?.user ? (
                                <p className="no-data">Kullanıcı verisi bulunamadı.</p>
                            ) : (
                                <div className="dossier-grid">
                                    {/* Left Column: Kimlik ve Güvenlik */}
                                    <div className="dossier-section-box">
                                        <h4 className="dossier-section-title">KİMLİK & HESAP BİLGİLERİ</h4>
                                        <div className="dossier-key-val">
                                            <span className="label">Kullanıcı ID</span>
                                            <span className="val">{userDossierData.user._id}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">Görünen İsim</span>
                                            <span className="val">{userDossierData.user.profile?.displayName || '-'}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">Kullanıcı Adı</span>
                                            <span className="val">@{userDossierData.user.username}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">E-Posta</span>
                                            <span className="val">{userDossierData.user.email || '-'}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">Kayıt Tarihi</span>
                                            <span className="val">{userDossierData.user.createdAt ? new Date(userDossierData.user.createdAt).toLocaleString('tr-TR') : '-'}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">Son Giriş / Aktiflik</span>
                                            <span className="val">{userDossierData.user.lastActive ? new Date(userDossierData.user.lastActive).toLocaleString('tr-TR') : 'Bilinmiyor'}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">Hesap Durumu</span>
                                            <span className="val" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                {userDossierData.user.isDeleted ? (
                                                    <span style={{ color: '#ef4444', fontWeight: 700 }}>🗑️ SİLİNMİŞ (PASİF HESAP)</span>
                                                ) : (
                                                    <span style={{ color: '#10b981', fontWeight: 600 }}>🟢 AKTİF</span>
                                                )}
                                                {userDossierData.user.isBanned && <span style={{ color: '#ff4444' }}>| 🚫 ENGELLİ</span>}
                                                {userDossierData.user.isShadowbanned && <span style={{ color: '#aaa' }}>| 👻 GÖLGE BANLI</span>}
                                            </span>
                                        </div>
                                        {userDossierData.user.isDeleted && (
                                            <>
                                                <div className="dossier-key-val" style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                                                    <span className="label" style={{ color: '#ef4444' }}>Silinme Tarihi</span>
                                                    <span className="val" style={{ color: '#ff8888' }}>
                                                        {userDossierData.user.deletedAt ? new Date(userDossierData.user.deletedAt).toLocaleString('tr-TR') : 'Arşivlenmiş'}
                                                    </span>
                                                </div>
                                                <div className="dossier-key-val" style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                                                    <span className="label" style={{ color: '#ef4444' }}>Silinme Gerekçesi</span>
                                                    <span className="val" style={{ color: '#ff8888' }}>
                                                        {userDossierData.user.deletionReason || 'Kullanıcı kendi isteğiyle sildi'}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        <div className="dossier-key-val">
                                            <span className="label">Güvenlik Sorusu</span>
                                            <span className="val">{userDossierData.user.securityQuestionSet ? 'AYARLANDI' : 'AYARLANMAMIŞ'}</span>
                                        </div>
                                        <div className="dossier-key-val">
                                            <span className="label">2FA Durumu</span>
                                            <span className="val">{userDossierData.user.twoFactorEnabled ? 'AKTİF' : 'PASİF'}</span>
                                        </div>
                                    </div>

                                    {/* Right Column: Ağ, IP ve Cihazlar */}
                                    <div className="dossier-section-box">
                                        <h4 className="dossier-section-title">AĞ & CİHAZ AYAK İZLERİ</h4>
                                        <div className="dossier-key-val">
                                            <span className="label">Son Bilinen IP</span>
                                            <span className="val">{userDossierData.user.lastIP || 'Kayıt Yok'}</span>
                                        </div>
                                        
                                        <div style={{ marginTop: '10px' }}>
                                            <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Tüm Bilinen IP Adresleri ({(userDossierData.allKnownIPs || []).length}):
                                            </span>
                                            <div className="dossier-chip-list">
                                                {(userDossierData.allKnownIPs || []).length > 0 ? (
                                                    userDossierData.allKnownIPs.map((ip, i) => (
                                                        <span key={i} className="dossier-chip">{ip}</span>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: '#666' }}>IP kaydı bulunamadı.</span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '14px' }}>
                                            <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Kayıtlı Cihazlar ({(userDossierData.user.registeredDevices || []).length}):
                                            </span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                                                {(userDossierData.user.registeredDevices || []).length > 0 ? (
                                                    userDossierData.user.registeredDevices.map((dev, i) => (
                                                        <div key={i} style={{ background: '#161616', border: '1px solid #282828', padding: '6px 10px', fontSize: '11px' }}>
                                                            <div style={{ color: '#fff', fontWeight: 600 }}>{dev.deviceName || dev.userAgent || 'Bilinmeyen Cihaz'}</div>
                                                            <div style={{ color: '#777', fontSize: '10px' }}>
                                                                IP: {dev.ip || '-'} • Son Giriş: {dev.lastLogin ? new Date(dev.lastLogin).toLocaleString('tr-TR') : '-'}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: '#666' }}>Kayıtlı cihaz yok.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Görsel Şecere: Avatar ve Banner Tarihçesi */}
                                    <div className="dossier-section-box" style={{ gridColumn: '1 / -1' }}>
                                        <h4 className="dossier-section-title">
                                            🖼️ GÖRSEL ŞECERE: AVATAR & BANNER GEÇMİŞİ ({(userDossierData.avatarHistory || []).length || (userDossierData.user.profile?.avatar ? 1 : 0)} Avatar • {(userDossierData.bannerHistory || []).length || (userDossierData.user.profile?.coverImage ? 1 : 0)} Banner)
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                                                    👤 KULLANILAN AVATARLAR:
                                                </span>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {(userDossierData.avatarHistory || []).length > 0 ? (
                                                        userDossierData.avatarHistory.map((item, idx) => (
                                                            <div key={idx} style={{ background: '#111', border: '1px solid #282828', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                                                <AdminMedia
                                                                    src={item.url}
                                                                    alt="Avatar Geçmişi"
                                                                    className="v2-avatar-tiny"
                                                                    isAvatar
                                                                    style={{ width: '48px', height: '48px', borderRadius: '8px', margin: '0 auto' }}
                                                                />
                                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
                                                                    {item.changedAt ? new Date(item.changedAt).toLocaleDateString('tr-TR') : 'Kayıt'}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : userDossierData.user.profile?.avatar ? (
                                                        <div style={{ background: '#111', border: '1px solid #282828', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                                            <AdminMedia
                                                                src={userDossierData.user.profile.avatar}
                                                                alt="Aktif Avatar"
                                                                className="v2-avatar-tiny"
                                                                isAvatar
                                                                style={{ width: '48px', height: '48px', borderRadius: '8px', margin: '0 auto' }}
                                                            />
                                                            <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>Aktif Avatar</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: '#666' }}>Geçmiş avatar kaydı bulunamadı.</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                                                    🏙️ KULLANILAN BANNERLAR (KAPAK GÖRSELLERİ):
                                                </span>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {(userDossierData.bannerHistory || []).length > 0 ? (
                                                        userDossierData.bannerHistory.map((item, idx) => (
                                                            <div key={idx} style={{ background: '#111', border: '1px solid #282828', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                                                <AdminMedia
                                                                    src={item.url}
                                                                    alt="Banner Geçmişi"
                                                                    style={{ width: '100px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                                                                />
                                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
                                                                    {item.changedAt ? new Date(item.changedAt).toLocaleDateString('tr-TR') : 'Kayıt'}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : userDossierData.user.profile?.coverImage ? (
                                                        <div style={{ background: '#111', border: '1px solid #282828', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                                            <AdminMedia
                                                                src={userDossierData.user.profile.coverImage}
                                                                alt="Aktif Banner"
                                                                style={{ width: '100px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                                                            />
                                                            <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>Aktif Banner</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: '#666' }}>Geçmiş banner kaydı bulunamadı.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Full: Platform İstatistikleri & Son İşlemler */}
                                    <div className="dossier-section-box" style={{ gridColumn: '1 / -1' }}>
                                        <h4 className="dossier-section-title">PLATFORM ETKİLEŞİMİ & SON AYAK İZLERİ</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                                            <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', padding: '10px' }}>
                                                <div style={{ fontSize: '10px', color: '#777' }}>TOPLAM GÖNDERİ</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{userDossierData.totalPosts || 0}</div>
                                            </div>
                                            <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', padding: '10px' }}>
                                                <div style={{ fontSize: '10px', color: '#777' }}>SAHİP OLDUĞU PORTAL</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{(userDossierData.portalsOwned || []).length}</div>
                                            </div>
                                            <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', padding: '10px' }}>
                                                <div style={{ fontSize: '10px', color: '#777' }}>TAKİPÇİ / TAKİP</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                                                    {userDossierData.user.followerCount || 0} / {userDossierData.user.followingCount || 0}
                                                </div>
                                            </div>
                                            <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', padding: '10px' }}>
                                                <div style={{ fontSize: '10px', color: '#777' }}>GÜVENLİK CEZALARI</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                                                    {userDossierData.user.isBanned ? '1 BAN' : 'TEMİZ'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                                👣 Son Sistem Ayak İzleri & Hareket Günlükleri (Oturum Bazlı):
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
                                                Toplam {(userDossierData.recentLogs || userDossierData.recentActivities || []).length} İşlem Kaydı
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                                            {(() => {
                                                const userLogs = categorizeLogsBySession(userDossierData.recentLogs || userDossierData.recentActivities || []);
                                                if (userLogs.length === 0) {
                                                    return <span style={{ fontSize: '11px', color: '#666', padding: '12px' }}>Kullanıcıya ait son işlem günlüğü bulunamadı.</span>;
                                                }
                                                return userLogs.map((log, idx) => (
                                                    <ActivityLogCard
                                                        key={log._id || idx}
                                                        act={log}
                                                        onInspectLog={(act) => setInspectingLog(act)}
                                                        onMediaClick={(m) => setMediaLightbox(m)}
                                                    />
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {/* Üye Olduğu Portallar & Topluluklar */}
                                    <div className="dossier-section-box" style={{ gridColumn: '1 / -1' }}>
                                        <h4 className="dossier-section-title">
                                            🌐 ÜYE OLDUĞU PORTALLAR & TOPLULUKLAR ({(userDossierData.memberPortals || []).length})
                                        </h4>
                                        {(userDossierData.memberPortals || []).length > 0 ? (
                                            <div className="dossier-portals-grid">
                                                {userDossierData.memberPortals.map((p) => (
                                                    <div key={p._id} className="dossier-portal-card">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <AdminMedia
                                                                src={p.avatar}
                                                                alt={p.name}
                                                                className="dossier-portal-avatar"
                                                                isAvatar={true}
                                                                fallbackText={p.name?.substring(0, 2).toUpperCase()}
                                                            />
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <strong style={{ color: '#fff', fontSize: '13px' }}>{p.name}</strong>
                                                                    {p.isOwner ? (
                                                                        <span className="mono-tag inverted" style={{ fontSize: '9px' }}>KURUCU</span>
                                                                    ) : (
                                                                        <span className="mono-tag" style={{ fontSize: '9px' }}>ÜYE</span>
                                                                    )}
                                                                    {p.isReadOnly && <span className="mono-tag muted" style={{ fontSize: '9px' }}>SALT OKUNUR</span>}
                                                                    {p.isNSFW && <span className="mono-tag" style={{ fontSize: '9px' }}>+18</span>}
                                                                </div>
                                                                <span style={{ fontSize: '11px', color: '#777', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {p.description || 'Açıklama belirtilmemiş.'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #222', fontSize: '11px', color: '#888' }}>
                                                            <span>👥 {p.members?.length || p.memberCount || 0} Üye • 📻 {p.channels?.length || p.channelCount || 0} Kanal</span>
                                                            <button
                                                                type="button"
                                                                className="user-box-btn"
                                                                style={{ padding: '4px 8px', fontSize: '10px' }}
                                                                onClick={() => {
                                                                    setUserDossierOpen(false);
                                                                    openPortalDetail(p);
                                                                }}
                                                            >
                                                                Portala Git →
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: '#666' }}>Kullanıcının kayıtlı olduğu herhangi bir portal bulunamadı.</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer-modern" style={{ borderTop: '1px solid #222', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
                            {userDossierData?.user && (
                                <button
                                    type="button"
                                    className="user-box-btn"
                                    onClick={() => {
                                        setUserDossierOpen(false);
                                        openUserPosts(userDossierData.user);
                                    }}
                                    style={{ minWidth: '220px', fontWeight: 700 }}
                                >
                                    📝 Tüm Gönderi Arşivini Aç (Aktif + Silinmiş)
                                </button>
                            )}
                            <button type="button" className="btn-modern-ghost" onClick={() => setUserDossierOpen(false)}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER POSTS INSPECTOR MODAL */}
            {userPostsOpen && userPostsUser && (
                <div className="modal-overlay-modern" onClick={() => setUserPostsOpen(false)}>
                    <div className="modal-content-modern posts-inspector-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-modern" style={{ borderBottom: '1px solid #222', padding: '16px 20px' }}>
                            <div>
                                <h2 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', margin: 0 }}>
                                    📝 @{userPostsUser.username} Tarafından Paylaşılan Postlar
                                </h2>
                                <span style={{ fontSize: '11px', color: '#888' }}>
                                    Toplam {userPostsData.length} gönderi listeleniyor
                                </span>
                            </div>
                            <button className="close-btn-modern" onClick={() => setUserPostsOpen(false)}>&times;</button>
                        </div>

                        <div style={{ padding: '12px 20px', borderBottom: '1px solid #222', background: '#0e0e0e', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Gönderiler içinde kelime ara..."
                                value={userPostsSearch}
                                onChange={(e) => setUserPostsSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        openUserPosts(userPostsUser, userPostsSearch);
                                    }
                                }}
                                style={{ flex: 1, minWidth: '180px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '8px 12px', fontSize: '12px', borderRadius: '8px' }}
                            />
                            <button
                                type="button"
                                className="user-box-btn"
                                onClick={() => openUserPosts(userPostsUser, userPostsSearch)}
                                style={{ minWidth: '90px' }}
                            >
                                Ara
                            </button>
                        </div>

                        <div className="posts-inspector-list">
                            {loadingUserPosts ? (
                                <div className="admin-loading">Gönderiler taranıyor...</div>
                            ) : userPostsData.length === 0 ? (
                                <p className="no-data">Kullanıcının paylaştığı herhangi bir gönderi bulunamadı.</p>
                            ) : (
                                userPostsData.map((post) => (
                                    <div key={post._id} className="post-inspect-card" style={post.isDeleted ? { borderColor: '#7f1d1d', background: '#130808' } : {}}>
                                        <div className="post-inspect-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span className="post-inspect-channel">
                                                    {post.portal?.name ? `🌐 ${post.portal.name}` : 'GLOBAL AKIŞ'}
                                                </span>
                                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#777' }}>
                                                    ID: {post._id}
                                                </span>
                                                {post.isDeleted ? (
                                                    <span className="mono-tag" style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', fontSize: '9px' }}>
                                                        🗑️ SİLİNMİŞ (ARŞİVDE KORUNUYOR)
                                                    </span>
                                                ) : (
                                                    <span className="mono-tag" style={{ background: '#064e3b', color: '#6ee7b7', border: '1px solid #059669', fontSize: '9px' }}>
                                                        🟢 AKTİF
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#888' }}>
                                                {post.createdAt ? new Date(post.createdAt).toLocaleString('tr-TR') : '-'}
                                            </span>
                                        </div>

                                        {post.content && (
                                            <div className="post-inspect-text">{post.content}</div>
                                        )}

                                        {/* YouTube Video Player Embed */}
                                        {(() => {
                                            const ytUrl = getYouTubeEmbedUrl(post.content || (typeof post.media === 'string' ? post.media : ''));
                                            if (ytUrl) {
                                                return (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <iframe
                                                            src={ytUrl}
                                                            title="YouTube Video"
                                                            style={{ width: '100%', maxWidth: '480px', height: '240px', borderRadius: '6px', border: '1px solid #333' }}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Media (Images, Videos, GIFs) */}
                                        {post.media && (
                                            <div className="post-inspect-media-container">
                                                {post.mediaType === 'video' || post.mediaType === 'videoUrl' ? (
                                                    <video
                                                        src={getImageUrl(Array.isArray(post.media) ? post.media[0] : post.media)}
                                                        controls
                                                        style={{ maxHeight: '240px', maxWidth: '100%', borderRadius: '6px' }}
                                                    />
                                                ) : Array.isArray(post.media) ? (
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {post.media.map((item, mIdx) => (
                                                            <AdminMedia
                                                                key={mIdx}
                                                                src={item}
                                                                alt=""
                                                                className="post-inspect-media"
                                                                style={{ maxHeight: '180px', maxWidth: '240px', objectFit: 'cover', borderRadius: '6px' }}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <AdminMedia
                                                        src={post.media}
                                                        alt=""
                                                        className="post-inspect-media"
                                                        style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* PDF Attachment */}
                                        {post.pdfUrl && (
                                            <div style={{ marginTop: '8px', background: '#111', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '360px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '18px' }}>📄</span>
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{post.pdfName || 'Belge.pdf'}</div>
                                                        <div style={{ fontSize: '10px', color: '#888' }}>PDF Belgesi</div>
                                                    </div>
                                                </div>
                                                <a href={getImageUrl(post.pdfUrl)} target="_blank" rel="noopener noreferrer" className="user-box-btn" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                                    Aç / İndir
                                                </a>
                                            </div>
                                        )}

                                        <div className="post-inspect-footer">
                                            <div className="post-inspect-stats">
                                                <span>❤️ {post.likes?.length || post.likeCount || 0} Beğeni</span>
                                                <span>💬 {post.comments?.length || post.commentCount || 0} Yorum</span>
                                                <span>🔄 {post.retweets?.length || 0} Repost</span>
                                            </div>
                                            {post.isDeleted ? (
                                                <span style={{ color: '#f87171', fontSize: '11px', fontFamily: 'monospace' }}>
                                                    Silen: @{post.deletedBy || 'Yetkili'} • Silinme: {post.deletedAt ? new Date(post.deletedAt).toLocaleString('tr-TR') : '-'}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="post-delete-btn"
                                                    onClick={() => handleDeletePost(post._id)}
                                                >
                                                    🗑️ Kalıcı Sil
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-footer-modern" style={{ borderTop: '1px solid #222', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-modern-ghost" onClick={() => setUserPostsOpen(false)}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PORTAL POSTS INSPECTOR MODAL */}
            {portalPostsOpen && selectedPortalForPosts && (
                <div className="modal-overlay-modern" onClick={() => setPortalPostsOpen(false)}>
                    <div className="modal-content-modern posts-inspector-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-modern" style={{ borderBottom: '1px solid #222', padding: '16px 20px' }}>
                            <div>
                                <h2 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', margin: 0 }}>
                                    📝 Portal Post Arşivi: {selectedPortalForPosts.name}
                                </h2>
                                <span style={{ fontSize: '11px', color: '#888' }}>
                                    Kayıtlı postlar: {portalPostsData.length} adet
                                </span>
                            </div>
                            <button className="close-btn-modern" onClick={() => setPortalPostsOpen(false)}>&times;</button>
                        </div>

                        {/* Search & Channel Filter Bar */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid #222', background: '#0e0e0e', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <input
                                    type="text"
                                    placeholder="Portal gönderileri içinde kelime ara..."
                                    value={portalPostsSearch}
                                    onChange={(e) => setPortalPostsSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            openPortalPosts(selectedPortalForPosts, portalPostsChannelFilter, portalPostsSearch);
                                        }
                                    }}
                                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '8px 12px', fontSize: '12px', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <select
                                    className="badge-select"
                                    value={portalPostsChannelFilter}
                                    onChange={(e) => {
                                        const chId = e.target.value;
                                        setPortalPostsChannelFilter(chId);
                                        openPortalPosts(selectedPortalForPosts, chId, portalPostsSearch);
                                    }}
                                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '8px 10px', fontSize: '12px', borderRadius: '8px' }}
                                >
                                    <option value="all">Tüm Kanallar ({selectedPortalForPosts.channels?.length || 0})</option>
                                    {(selectedPortalForPosts.channels || []).map(ch => (
                                        <option key={ch._id} value={ch._id}>#{ch.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                className="user-box-btn"
                                onClick={() => openPortalPosts(selectedPortalForPosts, portalPostsChannelFilter, portalPostsSearch)}
                                style={{ minWidth: '90px' }}
                            >
                                Filtrele
                            </button>
                        </div>

                        <div className="posts-inspector-list">
                            {loadingPortalPosts ? (
                                <div className="admin-loading">Portal gönderileri taranıyor...</div>
                            ) : portalPostsData.length === 0 ? (
                                <p className="no-data">Bu portalda henüz gönderi bulunamadı veya arama sonucu boş.</p>
                            ) : (
                                portalPostsData.map((post) => (
                                    <div key={post._id} className="post-inspect-card" style={post.isDeleted ? { borderColor: '#7f1d1d', background: '#130808' } : {}}>
                                        <div className="post-inspect-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, color: '#fff' }}>
                                                    @{post.author?.username || 'Bilinmiyor'}
                                                </span>
                                                <span className="post-inspect-channel">
                                                    #{post.channelName || post.channel?.name || (typeof post.channel === 'string' && post.channel !== 'general' ? post.channel : (selectedPortalForPosts.channels?.[0]?.name || 'genel'))}
                                                </span>
                                                {post.isDeleted ? (
                                                    <span className="mono-tag" style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', fontSize: '9px' }}>
                                                        🗑️ SİLİNMİŞ (ARŞİVDE KORUNUYOR)
                                                    </span>
                                                ) : (
                                                    <span className="mono-tag" style={{ background: '#064e3b', color: '#6ee7b7', border: '1px solid #059669', fontSize: '9px' }}>
                                                        🟢 AKTİF
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>
                                                {post.createdAt ? new Date(post.createdAt).toLocaleString('tr-TR') : '-'}
                                            </span>
                                        </div>

                                        {post.content && (
                                            <div className="post-inspect-text">{post.content}</div>
                                        )}

                                        {/* YouTube Video Player Embed */}
                                        {(() => {
                                            const ytUrl = getYouTubeEmbedUrl(post.content || (typeof post.media === 'string' ? post.media : ''));
                                            if (ytUrl) {
                                                return (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <iframe
                                                            src={ytUrl}
                                                            title="YouTube Video"
                                                            style={{ width: '100%', maxWidth: '480px', height: '240px', borderRadius: '6px', border: '1px solid #333' }}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Media (Images, Videos, GIFs) */}
                                        {post.media && (
                                            <div className="post-inspect-media-container">
                                                {post.mediaType === 'video' || post.mediaType === 'videoUrl' ? (
                                                    <video
                                                        src={getImageUrl(Array.isArray(post.media) ? post.media[0] : post.media)}
                                                        controls
                                                        style={{ maxHeight: '240px', maxWidth: '100%', borderRadius: '6px' }}
                                                    />
                                                ) : Array.isArray(post.media) ? (
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {post.media.map((item, mIdx) => (
                                                            <AdminMedia
                                                                key={mIdx}
                                                                src={item}
                                                                alt=""
                                                                className="post-inspect-media"
                                                                style={{ maxHeight: '180px', maxWidth: '240px', objectFit: 'cover', borderRadius: '6px' }}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <AdminMedia
                                                        src={post.media}
                                                        alt=""
                                                        className="post-inspect-media"
                                                        style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* PDF Attachment */}
                                        {post.pdfUrl && (
                                            <div style={{ marginTop: '8px', background: '#111', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '360px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '18px' }}>📄</span>
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{post.pdfName || 'Belge.pdf'}</div>
                                                        <div style={{ fontSize: '10px', color: '#888' }}>PDF Belgesi</div>
                                                    </div>
                                                </div>
                                                <a href={getImageUrl(post.pdfUrl)} target="_blank" rel="noopener noreferrer" className="user-box-btn" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                                    Aç / İndir
                                                </a>
                                            </div>
                                        )}

                                        <div className="post-inspect-footer">
                                            <div className="post-inspect-stats">
                                                <span>❤️ {post.likes?.length || post.likeCount || 0} Beğeni</span>
                                                <span>💬 {post.comments?.length || post.commentCount || 0} Yorum</span>
                                            </div>
                                            {post.isDeleted ? (
                                                <span style={{ color: '#f87171', fontSize: '11px', fontFamily: 'monospace' }}>
                                                    Silen: @{post.deletedBy || 'Yetkili'} • Silinme: {post.deletedAt ? new Date(post.deletedAt).toLocaleString('tr-TR') : '-'}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="post-delete-btn"
                                                    onClick={() => handleDeletePost(post._id)}
                                                >
                                                    🗑️ Kalıcı Sil
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-footer-modern" style={{ borderTop: '1px solid #222', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-modern-ghost" onClick={() => setPortalPostsOpen(false)}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TOURIST ADMIN PERMISSIONS MODAL */}
            {editPermissionsModalOpen && editingTouristAdmin && (() => {
                const expiresAt = new Date(editingTouristAdmin.touristAdminExpiresAt);
                const timeLeftMs = expiresAt - new Date();
                let timeLeftStr = 'Süresi doldu';
                if (timeLeftMs > 0) {
                    const diffHours = Math.floor(timeLeftMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                    timeLeftStr = diffHours > 0 ? `${diffHours} sa ${diffMins} dk` : `${diffMins} dk`;
                }
                const isExpired = timeLeftMs <= 0;
                const isSoon = timeLeftMs > 0 && timeLeftMs < 12 * 60 * 60 * 1000;
                const badgeClass = isExpired ? 'expired' : isSoon ? 'active-soon' : 'active-good';

                const calculateNewExpiry = () => {
                    if (editExpiryOption === 'keep') return null;
                    if (editExpiryOption === 'extend') {
                        const baseTime = expiresAt.getTime();
                        const nowTime = Date.now();
                        const startTime = baseTime > nowTime ? baseTime : nowTime;
                        return new Date(startTime + editExtendHours * 60 * 60 * 1000).toISOString();
                    }
                    if (editExpiryOption === 'custom' && editCustomDate) {
                        return new Date(editCustomDate).toISOString();
                    }
                    return null;
                };

                const newExpiryIso = calculateNewExpiry();

                return (
                    <div className="modal-overlay-modern" onClick={() => setEditPermissionsModalOpen(false)}>
                        <div className="modal-content-modern edit-permissions-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '920px', width: '95vw', maxHeight: '90vh' }}>
                            <div className="modal-header-modern" style={{ borderBottom: '1px solid #222', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShieldCheck size={22} color="#3b82f6" />
                                    <div>
                                        <h2 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', margin: 0, fontWeight: 700 }}>
                                            Turist Admin İzinlerini Düzenle: @{editingTouristAdmin.username}
                                        </h2>
                                        <span style={{ fontSize: '11px', color: '#888' }}>
                                            Granüler RBAC Modül Yetkilendirme & Süre Yönetim Penceresi
                                        </span>
                                    </div>
                                </div>
                                <button className="close-btn-modern" onClick={() => setEditPermissionsModalOpen(false)}>&times;</button>
                            </div>

                            <div className="modal-body-modern" style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                                {/* User summary card */}
                                <div className="edit-permissions-modal-user-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <UserAvatar src={editingTouristAdmin.profile?.lowResAvatar || editingTouristAdmin.profile?.avatar} alt={editingTouristAdmin.username} className="avatar-table" />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                                                {editingTouristAdmin.profile?.displayName || editingTouristAdmin.username}
                                                <span style={{ fontSize: '12px', color: '#3b82f6', marginLeft: '6px' }}>@{editingTouristAdmin.username}</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                                Atayan: @{editingTouristAdmin.assignedBy || 'oxypace'} • Mevcut Bitiş: {expiresAt.toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`time-left-badge ${badgeClass}`}>
                                        {timeLeftStr}
                                    </span>
                                </div>

                                {/* Expiry extension section */}
                                <div className="edit-expiry-section">
                                    <h4>⏱️ Yetki Süresi Ayarları</h4>
                                    <div className="edit-expiry-quick-btns" style={{ marginBottom: '10px' }}>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'keep' ? 'active' : ''}`}
                                            onClick={() => setEditExpiryOption('keep')}
                                        >
                                            Mevcut Süreyi Koru
                                        </button>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'extend' && editExtendHours === 6 ? 'active' : ''}`}
                                            onClick={() => { setEditExpiryOption('extend'); setEditExtendHours(6); }}
                                        >
                                            +6 Saat Uzat
                                        </button>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'extend' && editExtendHours === 24 ? 'active' : ''}`}
                                            onClick={() => { setEditExpiryOption('extend'); setEditExtendHours(24); }}
                                        >
                                            +24 Saat (1 Gün)
                                        </button>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'extend' && editExtendHours === 72 ? 'active' : ''}`}
                                            onClick={() => { setEditExpiryOption('extend'); setEditExtendHours(72); }}
                                        >
                                            +3 Gün Uzat
                                        </button>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'extend' && editExtendHours === 168 ? 'active' : ''}`}
                                            onClick={() => { setEditExpiryOption('extend'); setEditExtendHours(168); }}
                                        >
                                            +7 Gün Uzat
                                        </button>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'extend' && editExtendHours === 720 ? 'active' : ''}`}
                                            onClick={() => { setEditExpiryOption('extend'); setEditExtendHours(720); }}
                                        >
                                            +30 Gün Uzat
                                        </button>
                                        <button
                                            type="button"
                                            className={`edit-expiry-btn ${editExpiryOption === 'custom' ? 'active' : ''}`}
                                            onClick={() => setEditExpiryOption('custom')}
                                        >
                                            Özel Tarih Belirle
                                        </button>
                                    </div>

                                    {editExpiryOption === 'custom' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <input
                                                type="datetime-local"
                                                className="custom-date-input"
                                                value={editCustomDate}
                                                onChange={(e) => setEditCustomDate(e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                            />
                                        </div>
                                    )}

                                    {newExpiryIso && (
                                        <div className="duration-preview-pill" style={{ marginTop: '10px' }}>
                                            <span>🕒 Yeni Bitiş Tarihi: <strong>{new Date(newExpiryIso).toLocaleString('tr-TR')}</strong></span>
                                        </div>
                                    )}
                                </div>

                                <TouristPermissionStudio
                                    modulesState={editingModulesState}
                                    onChange={setEditingModulesState}
                                />
                            </div>

                            <div className="modal-footer-modern" style={{ borderTop: '1px solid #222', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                    Değişiklikler sunucu güvenlik katmanında doğrulanır ve anında yürürlüğe girer.
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        className="btn-modern-ghost"
                                        onClick={() => setEditPermissionsModalOpen(false)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        className="user-box-btn"
                                        onClick={() => {
                                            const compiled = compileTouristPermissions(editingModulesState);
                                            handleUpdateTouristPermissions(editingTouristAdmin._id, compiled, newExpiryIso);
                                        }}
                                        style={{ minWidth: '160px' }}
                                    >
                                        Değişiklikleri Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* FORENSIC LOG INSPECTOR MODAL */}
            {inspectingLog && (
                <div className="modal-overlay-modern" onClick={() => setInspectingLog(null)}>
                    <div className="modal-content-modern inspector-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-modern inspector-header">
                            <div className="inspector-title-area">
                                <span className={`severity-badge ${inspectingLog.severity || 'info'}`}>
                                    {(inspectingLog.severity || 'info').toUpperCase()}
                                </span>
                                <span className="inspector-action-title">
                                    {inspectingLog.action}
                                </span>
                                <span className="inspector-category-badge">
                                    {inspectingLog.category?.toUpperCase()}
                                </span>
                            </div>
                            <button className="close-btn-modern" onClick={() => setInspectingLog(null)}>&times;</button>
                        </div>

                        <div className="modal-body-modern inspector-body">
                            {/* 1. Hero Action & Narrative Summary Card */}
                            {(() => {
                                const narrative = getActionNarrative(inspectingLog);
                                const portal = inspectingLog.portalName || inspectingLog.portal?.name || inspectingLog.details?.portalName;
                                const channel = inspectingLog.channel || inspectingLog.details?.channelName;
                                return (
                                    <div className="inspector-hero-card">
                                        <div className="hero-action-badge-row">
                                            <span className={`severity-badge ${inspectingLog.severity || 'info'}`}>
                                                {(inspectingLog.severity || 'info').toUpperCase()}
                                            </span>
                                            <span className="hero-action-code">{inspectingLog.action}</span>
                                            {portal && (
                                                <span className="hero-scope-pill">
                                                    🏛️ {portal} {channel ? `› #${channel}` : ''}
                                                </span>
                                            )}
                                            {inspectingLog.category && (
                                                <span className="hero-category-pill">
                                                    {inspectingLog.category.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="hero-action-title">
                                            {narrative.title}
                                        </div>
                                        <div className="hero-action-desc">
                                            {narrative.desc}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 2. Media, File & Content Showcase */}
                            {(inspectingLog.details?.mediaUrl || inspectingLog.details?.content || inspectingLog.details?.fileName || inspectingLog.details?.hasMedia) && (
                                <div className="inspector-box" style={{ marginTop: '12px' }}>
                                    <div className="inspector-box-title">📦 Dosya, Medya ve İçerik Ayrıntıları</div>
                                    <div className="media-preview-container">
                                        {inspectingLog.details?.mediaUrl && (
                                            <div className="media-preview-thumb">
                                                {inspectingLog.details?.mediaType === 'video' ? (
                                                    <video
                                                        src={getImageUrl(inspectingLog.details.mediaUrl)}
                                                        controls
                                                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', background: '#000' }}
                                                    />
                                                ) : (
                                                    <AdminMedia
                                                        src={inspectingLog.details.mediaUrl}
                                                        alt="Medya Önizlemesi"
                                                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', objectFit: 'contain' }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <div className="media-meta-list" style={{ flex: 1 }}>
                                            {inspectingLog.details?.fileName && (
                                                <div className="kv-item">
                                                    <span className="kv-key">Dosya Adı:</span>
                                                    <span className="kv-val mono">{inspectingLog.details.fileName}</span>
                                                </div>
                                            )}
                                            {(inspectingLog.details?.fileSize || inspectingLog.details?.sizeBytes) && (
                                                <div className="kv-item">
                                                    <span className="kv-key">Dosya Boyutu:</span>
                                                    <span className="kv-val" style={{ color: '#4ade80', fontWeight: 700 }}>
                                                        {formatFileSize(inspectingLog.details.fileSize || inspectingLog.details.sizeBytes)} ({Number(inspectingLog.details.fileSize || inspectingLog.details.sizeBytes).toLocaleString()} byte)
                                                    </span>
                                                </div>
                                            )}
                                            {(inspectingLog.details?.mimeType || inspectingLog.details?.mediaType) && (
                                                <div className="kv-item">
                                                    <span className="kv-key">Medya Türü:</span>
                                                    <span className="kv-val mono">{inspectingLog.details.mimeType || inspectingLog.details.mediaType}</span>
                                                </div>
                                            )}
                                            {inspectingLog.details?.content && (
                                                <div style={{ marginTop: '10px', borderTop: '1px solid #222', paddingTop: '10px' }}>
                                                    <span className="kv-key" style={{ display: 'block', marginBottom: '6px' }}>Gönderi / Mesaj İçeriği:</span>
                                                    <div className="content-text-bubble">
                                                        "{inspectingLog.details.content}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Explicit ID Directory (Anlaşılır Kimlikler ve Varlık Rehberi) */}
                            <div className="inspector-box" style={{ marginTop: '12px' }}>
                                <div className="inspector-box-title">🆔 İLİŞKİLİ KİMLİKLER & AÇIKLAMALARI (EXPLICIT ID DIRECTORY)</div>
                                <div className="explicit-ids-grid">
                                    {/* User ID */}
                                    {inspectingLog.user && (
                                        <div className="id-card-item">
                                            <div className="id-card-header">
                                                <span className="id-card-badge user">👤 KULLANICI ID (USER ID)</span>
                                                <button
                                                    type="button"
                                                    className="id-copy-tiny"
                                                    title="Kullanıcı ID Kopyala"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(inspectingLog.user._id || inspectingLog.user));
                                                        setCopiedId('user');
                                                        setTimeout(() => setCopiedId(null), 1500);
                                                    }}
                                                >
                                                    {copiedId === 'user' ? '✓' : <Copy size={11} />}
                                                </button>
                                            </div>
                                            <div className="id-value-code">{String(inspectingLog.user._id || inspectingLog.user)}</div>
                                            <div className="id-explanation">
                                                Ait Olduğu Hesap: <strong>@{inspectingLog.user.username || inspectingLog.username}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {/* Portal ID */}
                                    {(inspectingLog.portal || inspectingLog.details?.portalId) && (
                                        <div className="id-card-item">
                                            <div className="id-card-header">
                                                <span className="id-card-badge portal">🏛️ PORTAL ID</span>
                                                <button
                                                    type="button"
                                                    className="id-copy-tiny"
                                                    title="Portal ID Kopyala"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(inspectingLog.portal?._id || inspectingLog.portal || inspectingLog.details?.portalId));
                                                        setCopiedId('portal');
                                                        setTimeout(() => setCopiedId(null), 1500);
                                                    }}
                                                >
                                                    {copiedId === 'portal' ? '✓' : <Copy size={11} />}
                                                </button>
                                            </div>
                                            <div className="id-value-code">{String(inspectingLog.portal?._id || inspectingLog.portal || inspectingLog.details?.portalId)}</div>
                                            <div className="id-explanation">
                                                Ait Olduğu Portal: <strong>{inspectingLog.portalName || inspectingLog.portal?.name || inspectingLog.details?.portalName || 'Portal'}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {/* Channel ID */}
                                    {(inspectingLog.channel || inspectingLog.details?.channelId) && (
                                        <div className="id-card-item">
                                            <div className="id-card-header">
                                                <span className="id-card-badge channel">#️⃣ KANAL ID (CHANNEL ID)</span>
                                                <button
                                                    type="button"
                                                    className="id-copy-tiny"
                                                    title="Kanal ID Kopyala"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(inspectingLog.details?.channelId || inspectingLog.channel));
                                                        setCopiedId('channel');
                                                        setTimeout(() => setCopiedId(null), 1500);
                                                    }}
                                                >
                                                    {copiedId === 'channel' ? '✓' : <Copy size={11} />}
                                                </button>
                                            </div>
                                            <div className="id-value-code">{String(inspectingLog.details?.channelId || inspectingLog.channel)}</div>
                                            <div className="id-explanation">
                                                Ait Olduğu Kanal: <strong>#{inspectingLog.channel || inspectingLog.details?.channelName || 'Kanal'}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {/* Target ID */}
                                    {inspectingLog.targetId && (
                                        <div className="id-card-item">
                                            <div className="id-card-header">
                                                <span className="id-card-badge target">🎯 HEDEF {inspectingLog.targetType?.toUpperCase() || 'VARLIK'} ID</span>
                                                <button
                                                    type="button"
                                                    className="id-copy-tiny"
                                                    title="Hedef ID Kopyala"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(inspectingLog.targetId));
                                                        setCopiedId('target');
                                                        setTimeout(() => setCopiedId(null), 1500);
                                                    }}
                                                >
                                                    {copiedId === 'target' ? '✓' : <Copy size={11} />}
                                                </button>
                                            </div>
                                            <div className="id-value-code">{String(inspectingLog.targetId)}</div>
                                            <div className="id-explanation">
                                                Hedef Varlık: <strong>{inspectingLog.targetName || inspectingLog.targetType || 'Nesne'}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. Actor & Network Grid */}
                            <div className="inspector-section-grid" style={{ marginTop: '12px' }}>
                                {/* Actor Box */}
                                <div className="inspector-box">
                                    <div className="inspector-box-title">👤 Aktör & Hesap Bilgileri</div>
                                    {inspectingLog.user ? (
                                        <div className="inspector-actor-detail">
                                            <AdminMedia
                                                src={inspectingLog.user.profile?.avatar}
                                                alt=""
                                                isAvatar
                                                className="v2-avatar-tiny"
                                                style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                                            />
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                                                    {inspectingLog.user.profile?.displayName || inspectingLog.user.username}
                                                </div>
                                                <div style={{ color: '#aaa', fontSize: '11px', fontFamily: 'monospace', marginTop: '2px' }}>
                                                    @{inspectingLog.user.username}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '10px', marginTop: '3px' }}>
                                                    Rol: <strong style={{ color: '#ddd' }}>{inspectingLog.actorRole || 'Kullanıcı'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#aaa', fontSize: '12px' }}>
                                            ⚙️ Sistem / Otomasyon ({inspectingLog.actorUsername || 'system'})
                                        </div>
                                    )}
                                </div>

                                {/* Network & Device Box */}
                                <div className="inspector-box">
                                    <div className="inspector-box-title">🌐 Ağ & Cihaz Ayak İzi</div>
                                    <div className="inspector-key-value-list">
                                        <div className="kv-item">
                                            <span className="kv-key">IP Adresi:</span>
                                            <span className="kv-val mono">{inspectingLog.ip || 'Bilinmiyor'}</span>
                                        </div>
                                        <div className="kv-item">
                                            <span className="kv-key">Konum (GeoIP):</span>
                                            <span className="kv-val">
                                                {inspectingLog.country ? `📍 ${inspectingLog.country} ${inspectingLog.city ? '• ' + inspectingLog.city : ''}` : 'Bilinmiyor'}
                                            </span>
                                        </div>
                                        <div className="kv-item">
                                            <span className="kv-key">Cihaz / Tarayıcı:</span>
                                            <span className="kv-val">
                                                {inspectingLog.device ? `${inspectingLog.device.browser || '-'} • ${inspectingLog.device.os || '-'} (${inspectingLog.device.deviceType || 'Masaüstü'})` : inspectingLog.deviceInfo ? `${inspectingLog.deviceInfo.browser || '-'} • ${inspectingLog.deviceInfo.os || '-'}` : '-'}
                                            </span>
                                        </div>
                                        <div className="kv-item">
                                            <span className="kv-key">Zaman Damgası:</span>
                                            <span className="kv-val mono">
                                                {new Date(inspectingLog.createdAt).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Visual Before / After Diff */}
                            {inspectingLog.diff && (inspectingLog.diff.before || inspectingLog.diff.after) && (
                                <div className="inspector-box" style={{ marginTop: '12px' }}>
                                    <div className="inspector-box-title">🔄 Değişiklik Karşılaştırması (Before / After Diff)</div>
                                    <div className="diff-grid">
                                        <div className="diff-column before">
                                            <div className="diff-header">🔴 Önceki Değerler (Before)</div>
                                            <pre className="diff-pre">
                                                {JSON.stringify(inspectingLog.diff.before, null, 2)}
                                            </pre>
                                        </div>
                                        <div className="diff-column after">
                                            <div className="diff-header">🟢 Yeni Değerler (After)</div>
                                            <pre className="diff-pre">
                                                {JSON.stringify(inspectingLog.diff.after, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 6. Collapsible Raw JSON Payload Block */}
                            <div className="inspector-box" style={{ marginTop: '12px' }}>
                                <div className="inspector-box-title-row">
                                    <span className="inspector-box-title">📋 Ham Teknik Veri & Metaveri (JSON Payload)</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className="copy-payload-btn"
                                            onClick={() => setShowRawJson(!showRawJson)}
                                        >
                                            {showRawJson ? '▲ Gizle' : '▼ Göster'}
                                        </button>
                                        <button
                                            type="button"
                                            className="copy-payload-btn"
                                            onClick={() => {
                                                navigator.clipboard.writeText(JSON.stringify(inspectingLog, null, 2));
                                                setCopiedJson(true);
                                                setTimeout(() => setCopiedJson(false), 2000);
                                            }}
                                        >
                                            {copiedJson ? '✓ Kopyalandı' : 'JSON Kopyala'}
                                        </button>
                                    </div>
                                </div>
                                {showRawJson && (
                                    <pre className="raw-json-block" style={{ marginTop: '10px' }}>
                                        {JSON.stringify(inspectingLog.details || inspectingLog, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer-modern" style={{ borderTop: '1px solid #222', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn-modern-ghost"
                                onClick={() => setInspectingLog(null)}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal */}
            {mediaLightbox && (
                <div 
                    className="modal-overlay-modern" 
                    style={{ zIndex: 100000, background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setMediaLightbox(null)}
                >
                    <div 
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '10px' }}>
                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                                {mediaLightbox.title || 'Medya Önizleme'}
                                {mediaLightbox.date && (
                                    <span style={{ color: '#888', fontSize: '11px', marginLeft: '10px', fontFamily: 'monospace' }}>
                                        {new Date(mediaLightbox.date).toLocaleString('tr-TR')}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a
                                    href={mediaLightbox.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-modern-ghost"
                                    style={{ padding: '4px 10px', fontSize: '11px', textDecoration: 'none' }}
                                >
                                    ↗️ Yeni Sekmede Aç
                                </a>
                                <button
                                    type="button"
                                    className="btn-modern-ghost"
                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                    onClick={() => setMediaLightbox(null)}
                                >
                                    ✕ Kapat
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const url = mediaLightbox.url || '';
                            const isVideo = mediaLightbox.type === 'video' || /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(url);
                            const isPdf = mediaLightbox.type === 'pdf' || /\.pdf($|\?)/i.test(url);

                            if (isVideo) {
                                return (
                                    <video
                                        src={url}
                                        controls
                                        autoPlay
                                        playsInline
                                        style={{
                                            maxWidth: '85vw',
                                            maxHeight: '75vh',
                                            borderRadius: '8px',
                                            border: '1px solid #333',
                                            boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
                                            background: '#000'
                                        }}
                                    />
                                );
                            }

                            if (isPdf) {
                                return (
                                    <iframe
                                        src={url}
                                        title="PDF Görüntüleyici"
                                        style={{
                                            width: '85vw',
                                            height: '75vh',
                                            borderRadius: '8px',
                                            border: '1px solid #333',
                                            background: '#fff'
                                        }}
                                    />
                                );
                            }

                            return (
                                <img 
                                    src={url} 
                                    alt="" 
                                    style={{
                                        maxWidth: '85vw',
                                        maxHeight: '75vh',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        border: '1px solid #333',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
                                    }} 
                                />
                            );
                        })()}

                        {mediaLightbox.content && (
                            <div style={{
                                marginTop: '12px',
                                padding: '10px 16px',
                                background: '#111',
                                border: '1px solid #242424',
                                borderRadius: '6px',
                                maxWidth: '85vw',
                                width: '100%',
                                color: '#e0e0e0',
                                fontSize: '13px',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '120px',
                                overflowY: 'auto'
                            }}>
                                {mediaLightbox.content}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Toggle Floating Return Button for Mobile Desktop Mode */}
            {desktopSiteMode && (
                <button
                    type="button"
                    className="desktop-mode-floating-bar"
                    onClick={() => setDesktopSiteMode(false)}
                    title="Mobil Görünüme Dön"
                >
                    <Smartphone size={16} />
                    <span>Mobil Görünüme Dön</span>
                </button>
            )}
            </div>
        </div>
    );
};

export default AdminDashboard;
