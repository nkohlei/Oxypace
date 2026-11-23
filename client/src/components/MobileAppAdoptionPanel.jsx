import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Smartphone, CheckCircle2, AlertTriangle, Sparkles, Search, Bell } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

const formatSyncTime = (dateVal) => {
    if (!dateVal) return '—';
    try {
        return new Date(dateVal).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

const MobileAppAdoptionPanel = ({ onSendUpdatePrompt, onBroadcastUpdatePrompt }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('android');
    const [query, setQuery] = useState('');
    const [broadcastingOta, setBroadcastingOta] = useState(false);
    const [otaBanner, setOtaBanner] = useState(null);

    const handleBroadcastSilentOta = async () => {
        if (broadcastingOta) return;
        setBroadcastingOta(true);
        setOtaBanner(null);
        try {
            const res = await axios.post('/api/admin/ota/broadcast');
            setOtaBanner({
                type: 'success',
                text: res.data?.message || 'Arka plan OTA sinyali gönderildi.',
            });
        } catch (err) {
            setOtaBanner({
                type: 'error',
                text: err?.response?.data?.message || 'Arka plan OTA yayını başarısız oldu.',
            });
        } finally {
            setBroadcastingOta(false);
        }
    };

    const fetchVersions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/admin/app-versions');
            setData(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Sürüm verileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, []);

    const latest = data?.latest || {};
    const summary = data?.summary || {};

    const filteredUsers = useMemo(() => {
        const list = Array.isArray(data?.users) ? data.users : [];
        const q = query.trim().toLowerCase();
        return list.filter((u) => {
            if (filter === 'android' && u.appPlatform !== 'android') return false;
            if (filter === 'uptodate' && !u.isApkUpToDate) return false;
            if (filter === 'outdated' && !(u.appPlatform === 'android' && !u.isApkUpToDate)) return false;
            if (filter === 'web' && u.appPlatform === 'android') return false;
            if (!q) return true;
            return (
                (u.username || '').toLowerCase().includes(q) ||
                (u.displayName || '').toLowerCase().includes(q) ||
                (u.appVersion || '').toLowerCase().includes(q) ||
                (u.otaVersion || '').toLowerCase().includes(q)
            );
        });
    }, [data?.users, filter, query]);

    return (
        <div
            style={{
                background: 'rgba(15, 16, 22, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '18px',
                marginBottom: '20px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '16px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'rgba(56, 189, 248, 0.14)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#38bdf8',
                        }}
                    >
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                            Kullanıcı Mobil Sürüm &amp; OTA Takibi
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                            Hedef APK: <strong style={{ color: '#e2e8f0' }}>v{latest.latestVersion || '2.6.3'}</strong> ({latest.versionCode || 263}) • Hedef OTA: <strong style={{ color: '#38bdf8' }}>{latest.otaVersion || '2.6.3-ota.1'}</strong>
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleBroadcastSilentOta}
                        disabled={broadcastingOta}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248, 0.16)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: '#38bdf8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: broadcastingOta ? 'wait' : 'pointer',
                            opacity: broadcastingOta ? 0.7 : 1,
                        }}
                    >
                        <Sparkles size={14} />
                        {broadcastingOta ? 'Gönderiliyor...' : 'Arka Plan OTA Gönder'}
                    </button>
                    {onBroadcastUpdatePrompt && (
                        <button
                            type="button"
                            onClick={onBroadcastUpdatePrompt}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 12px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                color: '#fbbf24',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            <Bell size={14} />
                            Eski Sürümlere Bildir
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={fetchVersions}
                        disabled={loading}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.16)',
                            color: '#f1f5f9',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={14} />
                        Yenile
                    </button>
                </div>
            </div>

            {otaBanner && (
                <div
                    style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: otaBanner.type === 'success' ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)',
                        color: otaBanner.type === 'success' ? '#86efac' : '#fca5a5',
                        border: `1px solid ${otaBanner.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        fontSize: '13px',
                        marginBottom: '12px',
                    }}
                >
                    {otaBanner.text}
                </div>
            )}

            {error && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', fontSize: '13px', marginBottom: '12px' }}>
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                    marginBottom: '14px',
                }}
            >
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Toplam Android</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{summary.totalAndroid ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#86efac', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Güncel APK
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#4ade80', marginTop: '4px' }}>{summary.upToDateApk ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.22)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} /> Güncel Canlı OTA
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{summary.upToDateOta ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> Güncelleme Bekleyen
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>{summary.outdatedApk ?? 0}</div>
                </div>
            </div>

            {/* Version Breakdown Pills */}
            {Array.isArray(summary.versionBreakdown) && summary.versionBreakdown.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {summary.versionBreakdown.map((item) => (
                        <span
                            key={item.label}
                            style={{
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                background: item.versionCode >= (latest.versionCode || 263) ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: item.versionCode >= (latest.versionCode || 263) ? '#86efac' : '#cbd5e1',
                                fontWeight: 600,
                            }}
                        >
                            {item.label}: {item.count} kişi
                        </span>
                    ))}
                </div>
            )}

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'android', label: 'Android' },
                        { id: 'uptodate', label: 'Güncel' },
                        { id: 'outdated', label: 'Eski Sürüm' },
                        { id: 'web', label: 'Web' },
                        { id: 'all', label: 'Tümü' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFilter(tab.id)}
                            style={{
                                padding: '5px 11px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.14)',
                                background: filter === tab.id ? '#ffffff' : 'rgba(255,255,255,0.05)',
                                color: filter === tab.id ? '#09090b' : '#cbd5e1',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        minWidth: '210px',
                    }}
                >
                    <Search size={14} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Kullanıcı veya sürüm ara..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            width: '100%',
                        }}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px' }}>Kullanıcı</th>
                            <th style={{ padding: '10px 12px' }}>Platform</th>
                            <th style={{ padding: '10px 12px' }}>APK Sürümü</th>
                            <th style={{ padding: '10px 12px' }}>Canlı OTA</th>
                            <th style={{ padding: '10px 12px' }}>Durum</th>
                            <th style={{ padding: '10px 12px' }}>Son Senkron</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                    Sürüm verileri yükleniyor...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                    Eşleşen kullanıcı bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u._id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}>
                                    <td style={{ padding: '9px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {u.avatar ? (
                                                <img
                                                    src={getImageUrl(u.avatar)}
                                                    alt={u.username}
                                                    style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '26px',
                                                        height: '26px',
                                                        borderRadius: '50%',
                                                        background: '#334155',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '11px',
                                                    }}
                                                >
                                                    {(u.username || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#fff' }}>{u.displayName}</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '9px 12px' }}>
                                        {u.appPlatform === 'android' ? '📱 Android' : '🌐 Web'}
                                    </td>
                                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>
                                        {u.appPlatform === 'android'
                                            ? `v${u.appVersion || '?'} (${u.versionCode || 0})`
                                            : 'Web'}
                                    </td>
                                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: u.isOtaUpToDate ? '#38bdf8' : '#94a3b8' }}>
                                        {u.otaVersion || '—'}
                                    </td>
                                    <td style={{ padding: '9px 12px' }}>
                                        {u.appPlatform !== 'android' ? (
                                            <span style={{ color: '#93c5fd' }}>Web</span>
                                        ) : u.isApkUpToDate ? (
                                            <span style={{ color: '#4ade80', fontWeight: 600 }}>Güncel</span>
                                        ) : (
                                            <span style={{ color: '#f87171', fontWeight: 600 }}>Eski</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '9px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                        {formatSyncTime(u.lastOtaSyncAt || u.lastAppSyncAt)}
                                    </td>
                                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                                        {u.appPlatform === 'android' && !u.isApkUpToDate && onSendUpdatePrompt ? (
                                            <button
                                                type="button"
                                                onClick={() => onSendUpdatePrompt(u._id, u.username)}
                                                style={{
                                                    padding: '4px 9px',
                                                    borderRadius: '6px',
                                                    background: 'rgba(239,68,68,0.16)',
                                                    border: '1px solid rgba(239,68,68,0.32)',
                                                    color: '#fca5a5',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Bildir
                                            </button>
                                        ) : (
                                            <span style={{ color: '#64748b' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MobileAppAdoptionPanel;
