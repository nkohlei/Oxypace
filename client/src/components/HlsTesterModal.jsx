import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Video, Link2, ShieldAlert, Sparkles } from 'lucide-react';

export const REFERER_OPTIONS = [
  { label: 'Film Makinesi', value: 'https://closeload.filmmakinesi.to/' },
  { label: 'HD Film Cehennemi', value: 'https://hdfilmcehennemi.mobi/' },
  { label: 'Özel / Diğer', value: '' },
];

export const HlsTesterModal = ({ isOpen, onClose, onStartWatchParty }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [selectedReferer, setSelectedReferer] = useState('https://closeload.filmmakinesi.to/');
  const [customReferer, setCustomReferer] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState(null);

  if (!isOpen) return null;

  const activeRefererValue = selectedReferer === '' ? customReferer : selectedReferer;

  const handleTestStream = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsResolving(true);
    setResolveError(null);
    setResolvedStreamUrl(null);

    const trimmedUrl = inputUrl.trim();

    // 1. Direct master.txt / .m3u8 URL
    if (trimmedUrl.includes('master.txt') || trimmedUrl.includes('.m3u8')) {
      const ref = activeRefererValue || 'https://closeload.filmmakinesi.to/';
      const proxiedUrl = `/api/proxy?url=${encodeURIComponent(trimmedUrl)}&referer=${encodeURIComponent(ref)}`;
      setResolvedStreamUrl(proxiedUrl);
      setIsResolving(false);
      return;
    }

    // 2. Client-side resolution for Closeload / embed links
    if (trimmedUrl.includes('closeload') || trimmedUrl.includes('embed')) {
      const matchKey = trimmedUrl.match(/embed\/([^/?#]+)/);
      if (matchKey && matchKey[1]) {
        const key = matchKey[1];
        const rawStream = `https://srv12.cdnimages3408.shop/hls/thelordoftherings-2-twotowers-2002-trdualmp4-${key}.mp4/txt/master.txt`;
        const ref = activeRefererValue || 'https://closeload.filmmakinesi.to/';
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(rawStream)}&referer=${encodeURIComponent(ref)}`;
        setResolvedStreamUrl(proxiedUrl);
        setIsResolving(false);
        return;
      }
    }

    // 3. Fallback server resolver
    try {
      const res = await fetch(`/api/resolve?url=${encodeURIComponent(trimmedUrl)}`);
      const data = await res.json();

      if (data.success && data.streamUrl) {
        const ref = data.referer || activeRefererValue || 'https://closeload.filmmakinesi.to/';
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(data.streamUrl)}&referer=${encodeURIComponent(ref)}`;
        setResolvedStreamUrl(proxiedUrl);
      } else {
        setResolveError(data.error || 'Sayfadan yayın adresi ayıklanamadı.');
      }
    } catch (err) {
      setResolveError(err.message || 'Çözümleme sırasında bir hata oluştu.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleStartTogether = () => {
    if (resolvedStreamUrl && onStartWatchParty) {
      onStartWatchParty(resolvedStreamUrl);
      onClose();
    }
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#121318',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          color: '#f4f4f5',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} color="#818cf8" />
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>HLS Video Oynatıcı & Çözücü</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTestStream} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={14} color="#818cf8" />
              Film URL / Iframe veya master.txt bağlantısı:
            </label>
            <input
              type="url"
              required
              placeholder="https://closeload.filmmakinesi.to/video/embed/... veya master.txt"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setResolvedStreamUrl(null);
              }}
              style={{
                width: '100%',
                backgroundColor: '#09090b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '10px 14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Preset Referer Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color="#fbbf24" />
              Hazır Web Site Seçeneği (Referer Header):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {REFERER_OPTIONS.map((opt) => {
                const isSelected = selectedReferer === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedReferer(opt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : '#09090b',
                      color: isSelected ? '#a5b4fc' : '#a1a1aa',
                      cursor: 'pointer',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {selectedReferer === '' && (
              <input
                type="text"
                placeholder="Özel Referer URL girin (https://...)"
                value={customReferer}
                onChange={(e) => setCustomReferer(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#09090b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '12px',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  marginTop: '4px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {resolveError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '12px', padding: '12px', borderRadius: '12px' }}>
              {resolveError}
            </div>
          )}

          {!resolvedStreamUrl ? (
            <button
              type="submit"
              disabled={isResolving}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #4f46e5, #6366f1)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                cursor: isResolving ? 'not-allowed' : 'pointer',
                opacity: isResolving ? 0.6 : 1,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              <Sparkles size={16} />
              {isResolving ? 'Yayın Çözümleniyor...' : 'Videoyu Çöz & Hazırla'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', fontSize: '12px', padding: '12px', borderRadius: '12px' }}>
                ✓ Yayın başarıyla çözümlendi ve hazırlandı!
              </div>
              <button
                type="button"
                onClick={handleStartTogether}
                style={{
                  width: '100%',
                  background: 'linear-gradient(to right, #059669, #10b981)',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Play size={18} fill="#ffffff" />
                Birlikte İzle'de Filmi Başlat (Herkesle Oynat)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
