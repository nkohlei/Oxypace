import React, { useState } from 'react';
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
  const [effectiveReferer, setEffectiveReferer] = useState('');

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
      setEffectiveReferer(ref);
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
        setEffectiveReferer(ref);
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
        setEffectiveReferer(ref);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">HLS Video Oynatıcı & Çözücü</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTestStream} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
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
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Preset Referer Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Hazır Web Site Seçeneği (Referer Header):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {REFERER_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedReferer(opt.value)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer text-center truncate ${
                    selectedReferer === opt.value
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {selectedReferer === '' && (
              <input
                type="text"
                placeholder="Özel Referer URL girin (https://...)"
                value={customReferer}
                onChange={(e) => setCustomReferer(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-3.5 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {resolveError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
              {resolveError}
            </div>
          )}

          {!resolvedStreamUrl ? (
            <button
              type="submit"
              disabled={isResolving}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 rounded-xl shadow-lg active:scale-[0.99] transition cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isResolving ? 'Yayın Çözümleniyor...' : 'Videoyu Çöz & Hazırla'}
            </button>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-center justify-between">
                <span>✓ Yayın başarıyla çözümlendi ve hazırlandı!</span>
              </div>
              <button
                type="button"
                onClick={handleStartTogether}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                Birlikte İzle'de Filmi Başlat (Herkesle Oynat)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
