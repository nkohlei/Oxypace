import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  X, Film, Play, Link2, AlertCircle, CheckCircle2, 
  Clipboard, ArrowRight, Search
} from 'lucide-react';
import './HlsStreamResolverModalVol2.css';

const formatPlayableUrl = (relativeOrAbsoluteUrl) => {
  if (!relativeOrAbsoluteUrl) return '';
  if (relativeOrAbsoluteUrl.startsWith('http://') || relativeOrAbsoluteUrl.startsWith('https://')) {
    return relativeOrAbsoluteUrl;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
  const cleanPath = relativeOrAbsoluteUrl.startsWith('/') ? relativeOrAbsoluteUrl : `/${relativeOrAbsoluteUrl}`;
  return `${baseUrl}${cleanPath}`;
};

export const HlsStreamResolverModalVol2 = ({ isOpen, onClose, onStartWatchParty }) => {
  const { user } = useAuth();
  const isPrivileged = Boolean(user?.isAdmin || user?.isTouristAdmin);

  // Tab state: 'search' (default) | 'manual'
  const [activeTab, setActiveTab] = useState('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [activeProviderFilter, setActiveProviderFilter] = useState('all');

  // Resolver state
  const [url, setUrl] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resolvedData, setResolvedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setSelectedMovie(null);
      setIsResolving(false);
      setResolvedData(null);
      setErrorMsg(null);
      setSearchError(null);
      setActiveProviderFilter('all');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateUrl = (rawUrl) => {
    if (!rawUrl) return false;
    return /^https?:\/\/.+/i.test(rawUrl.trim());
  };

  // Search Movies Handler
  const handleSearch = async (overrideQuery) => {
    const q = (overrideQuery || searchQuery).trim();
    if (!q || q.length < 2) {
      setSearchError('Lütfen aramak için en az 2 karakter girin.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedMovie(null);
    setResolvedData(null);
    setActiveProviderFilter('all');

    try {
      const response = await axios.get(`/api/search-movies?q=${encodeURIComponent(q)}`, {
        timeout: 25000,
      });

      if (response.data && response.data.success && Array.isArray(response.data.results)) {
        if (response.data.results.length === 0) {
          setSearchError(`"${q}" için sonuç bulunamadı. Farklı bir isim deneyebilir veya doğrudan bağlantı yapıştırabilirsiniz.`);
        } else {
          setSearchResults(response.data.results);
        }
      } else {
        setSearchError(response.data?.error || 'Arama sırasında bir hata oluştu.');
      }
    } catch (err) {
      let msg = err.response?.data?.error || err.message;
      if (typeof msg === 'string' && (msg.includes('Endpoint bulunamadı') || msg.includes('NOT_FOUND') || msg.includes('404'))) {
        msg = 'Film arama servisi şu anda güncelleniyor. Lütfen birkaç saniye sonra tekrar deneyin veya bağlantıyı doğrudan girin.';
      }
      setSearchError(msg || 'Film arama servisine bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setErrorMsg(null);
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const buildWatchMeta = (resData, movieMeta) => ({
    alternativeGroups: Array.isArray(resData?.alternativeGroups) ? resData.alternativeGroups : [],
    activeAlternativeId: resData?.activeAlternativeId || '',
    externalSubtitles: Array.isArray(resData?.externalSubtitles) ? resData.externalSubtitles : [],
    movieMeta: {
      imdbId: movieMeta?.imdbId || '',
      year: movieMeta?.year || '',
    },
  });

  // Stream Resolution Logic (supports multi-source tokens OR manual direct URL)
  const startResolveMovieOrUrl = async ({ targetUrl = '', movieMeta = null }) => {
    const trimmedUrl = (targetUrl || '').trim();
    const hasTokens = Array.isArray(movieMeta?.sourceTokens) && movieMeta.sourceTokens.length > 0;

    if (!hasTokens && !trimmedUrl) {
      setErrorMsg('Lütfen geçerli bir film seçin veya bağlantı girin.');
      return;
    }
    if (!hasTokens && !validateUrl(trimmedUrl)) {
      setErrorMsg('Lütfen geçerli bir web bağlantısı (http:// veya https://) girin.');
      return;
    }

    setIsResolving(true);
    setErrorMsg(null);
    setResolvedData(null);
    setElapsedMs(0);
    setSelectedMovie(movieMeta);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    try {
      if (!hasTokens && trimmedUrl) {
        const lower = trimmedUrl.toLowerCase();
        if (lower.includes('.m3u8') || lower.includes('master.txt') || lower.endsWith('.mp4')) {
          clearInterval(timerRef.current);
          const playableUrl = formatPlayableUrl(`/api/proxy?url=${encodeURIComponent(trimmedUrl)}`);
          const result = {
            streamUrl: trimmedUrl,
            playableStreamUrl: playableUrl,
            type: lower.endsWith('.mp4') ? 'mp4' : 'm3u8',
            pageTitle: movieMeta?.title || 'Doğrudan Akış Bağlantısı',
            resolvedIn: Date.now() - startTime,
            alternativeGroups: [],
            externalSubtitles: [],
          };
          setResolvedData(result);
          setIsResolving(false);
          return;
        }
      }

      const payload = {
        ...(hasTokens ? { sourceTokens: movieMeta.sourceTokens } : { url: trimmedUrl }),
        ...(isPrivileged && Array.isArray(movieMeta?.sources) ? { sources: movieMeta.sources } : {}),
        title: movieMeta?.title || '',
        year: movieMeta?.year || '',
        imdbId: movieMeta?.imdbId || '',
        timeout: 20000,
      };

      const response = await axios.post('/api/resolve-stream', payload, { timeout: 25000 });
      clearInterval(timerRef.current);

      if (response.data && response.data.success && response.data.playableStreamUrl) {
        const formattedPlayable = formatPlayableUrl(response.data.playableStreamUrl);
        if (!formattedPlayable || (!formattedPlayable.includes('/api/proxy') && !/\.(m3u8|mp4|mpd)(\?|$)/i.test(formattedPlayable))) {
          setErrorMsg('Geçerli video akış bağlantısı üretilemedi. Lütfen başka bir film veya kaynak deneyin.');
          return;
        }
        const resData = {
          ...response.data,
          playableStreamUrl: formattedPlayable,
          pageTitle: movieMeta?.title || response.data.pageTitle || 'Film Akışı',
        };
        setResolvedData(resData);

        if (movieMeta && onStartWatchParty) {
          const watchMeta = buildWatchMeta(resData, movieMeta);
          setTimeout(() => {
            onStartWatchParty(
              resData.playableStreamUrl,
              false,
              resData.subtitles || [],
              resData.pageTitle || movieMeta?.title || '',
              watchMeta
            );
            onClose();
          }, 300);
        }
      } else {
        setErrorMsg(
          response.data?.error ||
            'Bu film için oynatılabilir akış bulunamadı. Lütfen başka bir sonuç deneyin.'
        );
      }
    } catch (err) {
      clearInterval(timerRef.current);
      const serverErr = err.response?.data?.error || err.message;
      if (err.response?.status === 404) {
        setErrorMsg('Bu içerik için uygun video akışı bulunamadı. Lütfen farklı bir sonuç seçin.');
      } else if (err.code === 'ECONNABORTED' || err.response?.status === 408) {
        setErrorMsg('Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        setErrorMsg(serverErr || 'Çözümleme sırasında bir hata oluştu.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleManualResolveSubmit = (e) => {
    if (e) e.preventDefault();
    startResolveMovieOrUrl({ targetUrl: url, movieMeta: null });
  };

  const handleMovieSelect = (movie) => {
    if (movie.url) setUrl(movie.url);
    startResolveMovieOrUrl({ targetUrl: movie.url || '', movieMeta: movie });
  };

  const handleStartInRoom = () => {
    if (!resolvedData?.playableStreamUrl) return;
    if (onStartWatchParty) {
      onStartWatchParty(
        formatPlayableUrl(resolvedData.playableStreamUrl),
        false,
        resolvedData.subtitles || [],
        resolvedData.pageTitle || selectedMovie?.title || '',
        buildWatchMeta(resolvedData, selectedMovie)
      );
      onClose();
    }
  };

  // Admin-only provider filter chips computed dynamically from unified movie sources
  const adminProviderCounts = new Map();
  if (isPrivileged) {
    for (const item of searchResults) {
      const seenForItem = new Set();
      for (const s of (item.sources || [])) {
        if (!s?.providerKey || seenForItem.has(s.providerKey)) continue;
        seenForItem.add(s.providerKey);
        const cur = adminProviderCounts.get(s.providerKey) || { key: s.providerKey, label: s.provider || s.providerKey, count: 0 };
        cur.count += 1;
        adminProviderCounts.set(s.providerKey, cur);
      }
    }
  }
  const adminFilterChips = Array.from(adminProviderCounts.values());

  const filteredResults = (isPrivileged && activeProviderFilter !== 'all')
    ? searchResults.filter(item => (item.sources || []).some(s => s.providerKey === activeProviderFilter))
    : searchResults;

  const modalContent = (
    <div className="vol2-resolver-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vol2-resolver-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="vol2-resolver-header">
          <div className="vol2-header-title-wrap">
            <div className="vol2-header-icon-box">
              <Film size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="vol2-header-title">HLS Video Oynatıcı Vol 2</h3>
                <span className="vol2-header-badge">Entegre Film Arama</span>
              </div>
            </div>
          </div>
          <button className="vol2-close-btn" onClick={onClose} title="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="vol2-mode-tabs">
          <button 
            type="button"
            className={`vol2-mode-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => { setActiveTab('search'); setErrorMsg(null); }}
          >
            <Search size={15} />
            <span>Film Ara (Önerilen)</span>
            <span className="vol2-tab-pill">Hızlı</span>
          </button>
          <button 
            type="button"
            className={`vol2-mode-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => { setActiveTab('manual'); setErrorMsg(null); }}
          >
            <Link2 size={15} />
            <span>Doğrudan Link Yapıştır</span>
          </button>
        </div>

        {/* Body */}
        <div className="vol2-resolver-body custom-scrollbar">

          {/* Resolving In-Progress Overlay or Card */}
          {isResolving && (
            <div className="vol2-resolving-card">
              {selectedMovie?.poster && (
                <img src={selectedMovie.poster} alt={selectedMovie.title} className="vol2-resolving-poster" />
              )}
              <div className="vol2-resolving-info">
                <div className="vol2-loading-header">
                  <span className="vol2-loading-text">
                    <div className="vol2-spinner" />
                    <strong>{selectedMovie?.title || 'Film Akışı'}</strong> çözümleniyor...
                  </span>
                  <span className="vol2-loading-timer">{(elapsedMs / 1000).toFixed(1)}s</span>
                </div>
                <p className="vol2-resolving-sub">
                  {isPrivileged && selectedMovie?.providers?.length
                    ? `${selectedMovie.providers.join(', ')} üzerinden en hızlı ve en yüksek kaliteli akış seçiliyor...`
                    : 'En hızlı ve en yüksek kaliteli akış hazırlanıyor...'}
                </p>
                <div className="vol2-progress-bar-bg">
                  <div className="vol2-progress-bar-fill" />
                </div>
              </div>
            </div>
          )}

          {/* Success Result Card */}
          {!isResolving && resolvedData && (
            <div className="vol2-result-box">
              <div className="vol2-result-header">
                <div className="vol2-result-title-group">
                  <h4 className="vol2-result-title">
                    {resolvedData.pageTitle || 'Video Akışı Başarıyla Çözümlendi'}
                  </h4>
                  {isPrivileged && resolvedData.streamUrl && (
                    <p className="vol2-result-url-sub">{resolvedData.streamUrl}</p>
                  )}
                </div>
                <CheckCircle2 size={20} color="#ffffff" style={{ flexShrink: 0 }} />
              </div>

              <div className="vol2-result-meta">
                <span className="vol2-meta-tag success">Hazır</span>
                <span className="vol2-meta-tag">Format: {resolvedData.type?.toUpperCase() || 'HLS'}</span>
                {resolvedData.bestQualityHeight > 0 && (
                  <span className="vol2-meta-tag">{resolvedData.bestQualityHeight}p</span>
                )}
                {resolvedData.resolvedIn > 0 && (
                  <span className="vol2-meta-tag">{resolvedData.resolvedIn} ms</span>
                )}
                {isPrivileged && selectedMovie?.provider && (
                  <span className="vol2-meta-tag">
                    {selectedMovie.provider}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isResolving && errorMsg && (
            <div className="vol2-error-box">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: FILM ARA */}
          {activeTab === 'search' && !isResolving && !resolvedData && (
            <div className="vol2-search-container">
              {/* Search Form */}
              <form 
                className="vol2-search-bar" 
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              >
                <div className="vol2-search-input-wrap">
                  <Search size={16} className="vol2-search-icon" />
                  <input
                    type="text"
                    className="vol2-search-input"
                    placeholder="Film adı yazın (örn: Inception, Matrix, Kurtlar Vadisi)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (searchError) setSearchError(null);
                    }}
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      className="vol2-search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      title="Temizle"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="vol2-btn vol2-btn-action vol2-search-btn"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <div className="vol2-spinner" />
                      <span>Aranıyor</span>
                    </>
                  ) : (
                    <>
                      <span>Film Ara</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>


              {/* Search Error */}
              {searchError && (
                <div className="vol2-error-box">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Admin/Turist Admin: Kaynak Web Sitelerine Göre Filtre */}
              {isPrivileged && searchResults.length > 0 && adminFilterChips.length > 0 && (
                <div className="vol2-filter-row">
                  <span className="vol2-filter-label">Kaynak Siteler:</span>
                  <div className="vol2-filter-chips">
                    <button
                      type="button"
                      className={`vol2-filter-chip ${activeProviderFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveProviderFilter('all')}
                    >
                      Tümü ({searchResults.length})
                    </button>
                    {adminFilterChips.map(chip => (
                      <button
                        key={chip.key}
                        type="button"
                        className={`vol2-filter-chip ${activeProviderFilter === chip.key ? 'active' : ''}`}
                        onClick={() => setActiveProviderFilter(chip.key)}
                      >
                        {chip.label} ({chip.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results Grid (Unified Original Cards) */}
              {filteredResults.length > 0 && (
                <div className="vol2-results-grid">
                  {filteredResults.map((movie, idx) => {
                    const safePoster = movie.poster || null;
                    return (
                      <div 
                        key={movie.id || `${movie.title}-${idx}`} 
                        className="vol2-movie-card"
                        onClick={() => handleMovieSelect(movie)}
                        title={`${movie.title}${movie.year ? ` (${movie.year})` : ''} - Oynatmak için tıkla`}
                      >
                        <div className="vol2-movie-poster-wrap">
                          {safePoster ? (
                            <img 
                              src={safePoster} 
                              alt={movie.title} 
                              className="vol2-movie-poster"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="vol2-poster-fallback" style={{ display: safePoster ? 'none' : 'flex' }}>
                            <Film size={26} strokeWidth={1.5} />
                            <span className="vol2-fallback-text">{movie.title}</span>
                          </div>
                          {movie.year && (
                            <span className="vol2-card-year-tag">{movie.year}</span>
                          )}
                          <div className="vol2-card-hover-overlay">
                            <div className="vol2-card-play-btn">
                              <Play size={16} fill="currentColor" />
                            </div>
                            <span>Oynat</span>
                          </div>
                        </div>

                        {/* Sadece Admin ve Turist Admin'ler kaynak web sitelerini görebilir */}
                        {isPrivileged && Array.isArray(movie.providers) && movie.providers.length > 0 && (
                          <div className="vol2-card-provider-badge-wrap vol2-admin-sources-wrap">
                            {movie.providers.map((pName) => (
                              <span key={pName} className="vol2-admin-source-tag">
                                {pName}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="vol2-movie-details">
                          <h5 className="vol2-movie-title">{movie.title}</h5>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOĞRUDAN LINK YAPIŞTIR */}
          {activeTab === 'manual' && !isResolving && !resolvedData && (
            <div className="vol2-manual-container">
              <p className="vol2-description">
                Üçüncü taraf film veya dizi sitesi sayfa bağlantısını doğrudan yapıştırın. Sistem akış URL'sini otomatik çözecektir.
              </p>

              <form className="vol2-input-group" onSubmit={handleManualResolveSubmit}>
                <label className="vol2-input-label">Hedef Sayfa veya Akış Bağlantısı</label>
                <div className={`vol2-input-box ${errorMsg ? 'error' : ''}`}>
                  <div className="vol2-input-icon">
                    <Link2 size={16} />
                  </div>
                  <input
                    type="text"
                    className="vol2-input-field"
                    placeholder="https://hdfilmcehennemi... veya https://.../master.m3u8"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="vol2-paste-btn"
                    onClick={handlePaste}
                    title="Panodan Yapıştır"
                  >
                    <Clipboard size={12} />
                    Yapıştır
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="vol2-resolver-footer">
          <button type="button" className="vol2-btn vol2-btn-secondary" onClick={onClose}>
            Kapat
          </button>

          {resolvedData ? (
            <button
              type="button"
              className="vol2-btn vol2-btn-primary"
              onClick={handleStartInRoom}
            >
              <Play size={15} fill="currentColor" />
              Odadaki Herkes İçin Başlat
            </button>
          ) : activeTab === 'manual' ? (
            <button
              type="button"
              className="vol2-btn vol2-btn-action"
              onClick={handleManualResolveSubmit}
              disabled={isResolving || !url.trim()}
            >
              {isResolving ? (
                <>
                  <div className="vol2-spinner" />
                  Çözümleniyor...
                </>
              ) : (
                <>
                  Kaynağı Çözümle
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default HlsStreamResolverModalVol2;
