/**
 * OxypacePlayer.jsx
 *
 * Oxypace web uygulamasına entegre edilebilecek React bileşeni.
 *
 * Kullanım:
 *   import OxypacePlayer from './components/OxypacePlayer';
 *
 *   <OxypacePlayer
 *     apiBaseUrl="https://api.oxypace.com"   // Stream Resolver API adresi
 *     initialUrl="https://film-sitesi.com/film-izle/"  // opsiyonel
 *     onStreamFound={(data) => console.log(data)}      // opsiyonel callback
 *   />
 *
 * Gereksinimler:
 *   npm install hls.js
 *
 * Not: Bu bileşen kendi stillerini tanımlar; Tailwind veya CSS modül gerektirmez.
 *      İstersen stilleri CSS modülüne veya styled-components'a taşıyabilirsin.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// hls.js — HLS stream'lerini tarayıcıda oynatmak için
// `npm install hls.js` ile kur
// CDN kullanmak istersen: import Hls from 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
let Hls;
try {
  Hls = require('hls.js');
  // ESM import için: import Hls from 'hls.js';
} catch {
  console.warn('[OxypacePlayer] hls.js bulunamadı. `npm install hls.js` çalıştırın.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Alt Bileşenler
// ─────────────────────────────────────────────────────────────────────────────

/** Dönen yükleme animasyonu */
function Spinner({ size = 20, color = '#8b5cf6' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(139,92,246,0.25)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'oxypace-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

/** Durum rozeti */
function Badge({ type }) {
  const config = {
    m3u8: { label: 'HLS', bg: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    mp4:  { label: 'MP4', bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  };
  const c = config[type] || config.mp4;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
        background: c.bg, color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana Bileşen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ apiBaseUrl: string, initialUrl?: string, onStreamFound?: (data: StreamResult) => void }} props
 *
 * @typedef {{
 *   streamUrl: string,
 *   type: 'm3u8' | 'mp4',
 *   headers: { referer: string, 'user-agent': string, origin: string },
 *   pageTitle: string,
 *   resolvedIn: number
 * }} StreamResult
 */
export default function OxypacePlayer({ apiBaseUrl = '', initialUrl = '', onStreamFound }) {
  // ── State ───────────────────────────────────────────────────────────────────

  const [url, setUrl]           = useState(initialUrl);
  const [status, setStatus]     = useState(null);   // { message, type: 'loading'|'success'|'error' }
  const [result, setResult]     = useState(null);   // StreamResult
  const [error, setError]       = useState(null);   // { message, code }
  const [isLoading, setLoading] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────

  const videoRef  = useRef(null);
  const hlsRef    = useRef(null);

  // ── HLS Temizleme ─────────────────────────────────────────────────────────

  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
    }
    setPlayerReady(false);
  }, []);

  // Bileşen unmount olduğunda player'ı temizle
  useEffect(() => () => destroyPlayer(), [destroyPlayer]);

  // ── HLS Oynatıcı Başlatma ─────────────────────────────────────────────────

  const initPlayer = useCallback((streamUrl, type) => {
    const video = videoRef.current;
    if (!video) return;

    destroyPlayer();

    if (type === 'm3u8' && Hls && Hls.isSupported()) {
      // HLS.js ile oynat
      const hls = new Hls({ debug: false, enableWorker: true, startLevel: -1 });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayerReady(true);
        video.play().catch(() => {
          // Autoplay engeli — kullanıcı etkileşimi gerekiyor
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('[OxypacePlayer] HLS fatal error:', data);
          setError({
            message: 'Stream yüklenirken hata oluştu. Referer/CORS engeli olabilir.',
            code: 'HLS_ERROR',
          });
        }
      });

    } else if (type === 'm3u8' && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = streamUrl;
      video.play().catch(() => {});
      setPlayerReady(true);

    } else {
      // MP4 veya fallback
      video.src = streamUrl;
      video.play().catch(() => {});
      setPlayerReady(true);
    }
  }, [destroyPlayer]);

  // ── Stream Çözme ──────────────────────────────────────────────────────────

  const resolveStream = useCallback(async () => {
    if (!url.trim() || isLoading) return;

    setLoading(true);
    setResult(null);
    setError(null);
    destroyPlayer();
    setStatus({ message: 'Headless tarayıcı başlatılıyor...', type: 'loading' });

    // 3 saniye sonra mesajı güncelle
    const timer = setTimeout(() => {
      setStatus({ message: 'Ağ trafiği izleniyor...', type: 'loading' });
    }, 3000);

    try {
      const res = await fetch(`${apiBaseUrl}/api/resolve-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearTimeout(timer);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus({ message: data.error || 'Stream bulunamadı.', type: 'error' });
        setTimeout(() => setStatus(null), 3000);
        setError({ message: data.error, code: data.code });
        return;
      }

      // Başarılı
      setStatus({ message: 'Stream bulundu! ✅', type: 'success' });
      setTimeout(() => setStatus(null), 2000);

      setResult(data);
      onStreamFound?.(data);

      const proxyUrl = `${apiBaseUrl}/api/proxy?url=${encodeURIComponent(data.streamUrl)}&referer=${encodeURIComponent(data.headers?.referer || '')}`;
      initPlayer(proxyUrl, data.type);

    } catch (err) {
      clearTimeout(timer);
      setStatus({ message: 'Bağlantı hatası.', type: 'error' });
      setTimeout(() => setStatus(null), 3000);
      setError({
        message: 'API sunucusuna bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.',
        code: 'CONNECTION_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [url, isLoading, apiBaseUrl, initPlayer, destroyPlayer, onStreamFound]);

  // ── URL Kopyala ────────────────────────────────────────────────────────────

  const copyUrl = async () => {
    if (!result?.streamUrl) return;
    await navigator.clipboard.writeText(result.streamUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.wrapper}>
      {/* CSS Animasyonları — once inject et */}
      <style>{KEYFRAMES}</style>

      {/* ── Input ── */}
      <div style={styles.card}>
        <label style={styles.label}>Film / Dizi URL'si</label>
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && resolveStream()}
            placeholder="https://www.hdfilmcehennemi.nl/film-izle/"
            disabled={isLoading}
          />
          <button
            style={{ ...styles.btn, ...(isLoading ? styles.btnDisabled : {}) }}
            onClick={resolveStream}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size={16} color="white" /> : '🔍'}
            <span>{isLoading ? 'Çözülüyor...' : 'Çöz'}</span>
          </button>
        </div>

        {/* Durum çubuğu */}
        {status && (
          <div style={styles.statusBar}>
            <span
              style={{
                ...styles.statusDot,
                background: status.type === 'success' ? '#10b981'
                  : status.type === 'error' ? '#ef4444'
                  : '#8b5cf6',
                animation: status.type === 'loading' ? 'oxypace-pulse 1s infinite' : 'none',
              }}
            />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{status.message}</span>
          </div>
        )}
      </div>

      {/* ── Hata ── */}
      {error && (
        <div style={styles.errorCard}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 6 }}>Stream Bulunamadı</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{error.message}</div>
          {error.code && <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', marginTop: 6 }}>Kod: {error.code}</div>}
        </div>
      )}

      {/* ── Sonuç ── */}
      {result && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>✅ Stream Bulundu</div>
              {result.pageTitle && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{result.pageTitle}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge type={result.type} />
              <span style={{ fontSize: 11, color: '#64748b' }}>⚡ {(result.resolvedIn / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {/* Stream URL */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 6 }}>Stream URL</div>
          <div style={styles.urlBox}>
            <code style={{ flex: 1, fontSize: 11, color: '#a78bfa', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {result.streamUrl}
            </code>
            <button style={{ ...styles.copyBtn, ...(copied ? styles.copyBtnCopied : {}) }} onClick={copyUrl}>
              {copied ? '✓ Kopyalandı' : 'Kopyala'}
            </button>
          </div>

          {/* HTTP Başlıkları */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 8 }}>
              HTTP Başlıkları
            </div>
            {Object.entries(result.headers || {}).filter(([, v]) => v).map(([key, value]) => (
              <div key={key} style={styles.headerRow}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', width: 90, flexShrink: 0 }}>{key}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.4 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Video Oynatıcı ── */}
      {result && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>🎬 Video Oynatıcı</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>hls.js — HTML5 Player</div>
            </div>
            <button style={styles.closeBtn} onClick={() => { destroyPlayer(); setResult(null); }}>✕ Kapat</button>
          </div>

          <div style={styles.videoWrapper}>
            <video ref={videoRef} controls playsInline style={styles.video} />
            {!playerReady && (
              <div style={styles.videoOverlay}>
                <Spinner size={32} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Stream yükleniyor...</span>
              </div>
            )}
          </div>

          {/* CORS Uyarısı */}
          <div style={styles.corsNotice}>
            ⚠️ <strong>CORS Notu:</strong> Bazı stream'ler <code>Referer</code> header doğrulaması gerektirir.
            Direkt oynatma çalışmazsa, bir <strong>proxy endpoint</strong> kullanmanız gerekir.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stiller
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    color: '#f1f5f9',
    maxWidth: 860,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
    backdropFilter: 'blur(20px)',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#94a3b8', marginBottom: 8,
  },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#f1f5f9',
    fontFamily: 'inherit', fontSize: 13,
    outline: 'none',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: 'white', border: 'none', borderRadius: 10,
    padding: '12px 20px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  statusBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginTop: 12, padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  errorCard: {
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 16, padding: 24, textAlign: 'center',
  },
  urlBox: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: '10px 14px',
  },
  copyBtn: {
    flexShrink: 0,
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.3)',
    color: '#a78bfa',
    borderRadius: 6, padding: '5px 10px',
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  copyBtnCopied: {
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#34d399',
  },
  headerRow: {
    display: 'flex', gap: 10, padding: '7px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  videoWrapper: {
    position: 'relative', background: '#000',
    borderRadius: 10, overflow: 'hidden',
    aspectRatio: '16/9',
  },
  video: { width: '100%', height: '100%', display: 'block' },
  videoOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'rgba(0,0,0,0.6)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', borderRadius: 6,
    padding: '5px 10px', fontSize: 11, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  corsNotice: {
    marginTop: 10, padding: '10px 14px',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 8, fontSize: 11, color: '#fbbf24', lineHeight: 1.6,
  },
};

// CSS Keyframes (global scope'a bir kez eklenir)
const KEYFRAMES = `
  @keyframes oxypace-spin  { to { transform: rotate(360deg); } }
  @keyframes oxypace-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
`;
