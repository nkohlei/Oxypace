import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { 
  X, Film, Play, Link2, AlertCircle, CheckCircle2, 
  Clipboard, ArrowRight, Search, Sparkles, Tv, Layers
} from 'lucide-react';
import './HlsStreamResolverModalVol2.css';

const formatPlayableUrl = (relativeOrAbsoluteUrl) => {
  if (!relativeOrAbsoluteUrl) return '';
  if (relativeOrAbsoluteUrl.startsWith('http://') || relativeOrAbsoluteUrl.startsWith('https://')) {
    return relativeOrAbsoluteUrl;
  }
  const isNative = Capacitor.isNativePlatform();
  const baseUrl = (isNative || import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr') : '').replace(/\/$/, '');
  const cleanPath = relativeOrAbsoluteUrl.startsWith('/') ? relativeOrAbsoluteUrl : `/${relativeOrAbsoluteUrl}`;
  return `${baseUrl}${cleanPath}`;
};

const POPULAR_SUGGESTIONS = ['Matrix', 'Yüzüklerin Efendisi', 'Interstellar', 'Batman', 'Gladyatör'];

export const HlsStreamResolverModalVol2 = ({ isOpen, onClose, onStartWatchParty }) => {
  // Tab state: 'search' (default) | 'manual'
  const [activeTab, setActiveTab] = useState('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [activeProviderFilter, setActiveProviderFilter] = useState('all'); // 'all' | 'hdfilmcehennemi' | 'fullhdfilmizlesene'

  // Resolver state (shared between manual URL and search click)
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

    try {
      const response = await axios.get(`/api/search-movies?q=${encodeURIComponent(q)}`, {
        timeout: 25000,
      });

      if (response.data && response.data.success && Array.isArray(response.data.results)) {
        if (response.data.results.length === 0) {
          setSearchError(`"${q}" için entegre film sitelerinde sonuç bulunamadı. Farklı bir isim deneyebilir veya doğrudan bağlantı yapıştırabilirsiniz.`);
        } else {
          setSearchResults(response.data.results);
        }
      } else {
        setSearchError(response.data?.error || 'Arama sırasında bir hata oluştu.');
      }
    } catch (err) {
      let msg = err.response?.data?.error || err.message;
      if (typeof msg === 'string' && (msg.includes('Endpoint bulunamadı') || msg.includes('NOT_FOUND') || msg.includes('404'))) {
        msg = 'Film arama servisi şu anda güncelleniyor. Lütfen birkaç saniye sonra tekrar deneyin veya film bağlantısını "Link Yapıştır" sekmesinden doğrudan girin.';
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

  // Stream Resolution Logic
  const startResolveUrl = async (targetUrl, movieMeta = null) => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) {
      setErrorMsg('Lütfen geçerli bir film sayfa bağlantısı seçin veya girin.');
      return;
    }

    if (!validateUrl(trimmedUrl)) {
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
      // 1. Direct stream URL bypass (.m3u8, .mp4, master.txt)
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
        };
        setResolvedData(result);
        setIsResolving(false);

        // Auto start in room if triggered from search card
        if (movieMeta && onStartWatchParty) {
          setTimeout(() => {
            onStartWatchParty(playableUrl);
            onClose();
          }, 400);
        }
        return;
      }

      // 2. Call backend Stream Resolver
      const response = await axios.post(
        '/api/resolve-stream',
        {
          url: trimmedUrl,
          timeout: 20000,
        },
        { timeout: 23000 }
      );

      clearInterval(timerRef.current);

      if (response.data && response.data.success) {
        const resData = {
          ...response.data,
          playableStreamUrl: formatPlayableUrl(response.data.playableStreamUrl),
          pageTitle: movieMeta?.title || response.data.pageTitle
        };
        setResolvedData(resData);

        // Auto start in room if selected directly from search
        if (movieMeta && onStartWatchParty) {
          setTimeout(() => {
            onStartWatchParty(resData.playableStreamUrl);
            onClose();
          }, 400);
        }
      } else {
        setErrorMsg(
          response.data?.error ||
            'Bu kaynaktan oynatılabilir video akışı alınamadı. Lütfen listedeki alternatif bir kaynağı deneyin.'
        );
      }
    } catch (err) {
      clearInterval(timerRef.current);
      const serverErr = err.response?.data?.error || err.message;
      if (err.response?.status === 404) {
        setErrorMsg('Bu film sayfasında video akışı tespit edilemedi. Lütfen listedeki diğer seçeneği deneyin.');
      } else if (err.code === 'ECONNABORTED' || err.response?.status === 408) {
        setErrorMsg('Sayfa yanıt vermedi (zaman aşımı). Lütfen tekrar deneyin.');
      } else {
        setErrorMsg(serverErr || 'Çözümleme sırasında bir hata oluştu. Lütfen bağlantıyı kontrol edin.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleManualResolveSubmit = (e) => {
    if (e) e.preventDefault();
    startResolveUrl(url, null);
  };

  const handleMovieSelect = (movie) => {
    setUrl(movie.url);
    startResolveUrl(movie.url, movie);
  };

  const handleStartInRoom = () => {
    if (!resolvedData?.playableStreamUrl) return;
    if (onStartWatchParty) {
      onStartWatchParty(formatPlayableUrl(resolvedData.playableStreamUrl));
      onClose();
    }
  };

  const getProviderLogo = (providerKey) => {
    if (providerKey === 'hdfilmcehennemi') return '/providers/hdfilmcehennemi.png';
    if (providerKey === 'filmmakinesi') return '/providers/filmmakinesi.png';
    return '/providers/fullhdfilmizlesene.png';
  };

  const getSafePosterUrl = (posterUrl, providerKey) => {
    if (!posterUrl) return null;
    if (providerKey === 'hdfilmcehennemi' && !posterUrl.startsWith('/api/proxy') && !posterUrl.startsWith('data:')) {
      return `/api/proxy?url=${encodeURIComponent(posterUrl)}&referer=${encodeURIComponent('https://www.hdfilmcehennemi.nl/')}`;
    }
    return posterUrl;
  };

  // Filtered results by provider
  const filteredResults = searchResults.filter(item => {
    if (activeProviderFilter === 'all') return true;
    return item.providerKey === activeProviderFilter;
  });

  const hdfCount = searchResults.filter(r => r.providerKey === 'hdfilmcehennemi').length;
  const fhfCount = searchResults.filter(r => r.providerKey === 'fullhdfilmizlesene').length;
  const fmCount = searchResults.filter(r => r.providerKey === 'filmmakinesi').length;

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
                  {selectedMovie?.provider ? `${selectedMovie.provider} üzerinden güvenli HLS akışı hazırlanıyor.` : 'Hedef sayfa taranıyor...'}
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
                  <p className="vol2-result-url-sub">{resolvedData.streamUrl}</p>
                </div>
                <CheckCircle2 size={20} color="#ffffff" style={{ flexShrink: 0 }} />
              </div>

              <div className="vol2-result-meta">
                <span className="vol2-meta-tag success">Hazır</span>
                <span className="vol2-meta-tag">Format: {resolvedData.type?.toUpperCase() || 'HLS'}</span>
                {resolvedData.resolvedIn > 0 && (
                  <span className="vol2-meta-tag">{resolvedData.resolvedIn} ms</span>
                )}
                {selectedMovie?.provider && (
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

              {/* Suggestions chips when no search has been made */}
              {searchResults.length === 0 && !isSearching && !searchError && (
                <div className="vol2-suggestions-section">
                  <div className="vol2-suggestions-label">
                    <Sparkles size={13} color="#ffffff" />
                    <span>Popüler Aramalar</span>
                  </div>
                  <div className="vol2-suggestions-chips">
                    {POPULAR_SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="vol2-chip"
                        onClick={() => {
                          setSearchQuery(item);
                          handleSearch(item);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Error */}
              {searchError && (
                <div className="vol2-error-box">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Provider Filter Chips (Siteye Göre Filtrele) */}
              {searchResults.length > 0 && (
                <div className="vol2-filter-row">
                  <span className="vol2-filter-label">Kaynak:</span>
                  <div className="vol2-filter-chips">
                    <button
                      type="button"
                      className={`vol2-filter-chip ${activeProviderFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveProviderFilter('all')}
                    >
                      Tümü ({searchResults.length})
                    </button>
                    {hdfCount > 0 && (
                      <button
                        type="button"
                        className={`vol2-filter-chip hdfilmcehennemi ${activeProviderFilter === 'hdfilmcehennemi' ? 'active' : ''}`}
                        onClick={() => setActiveProviderFilter('hdfilmcehennemi')}
                      >
                        HDFilmCehennemi ({hdfCount})
                      </button>
                    )}
                    {fhfCount > 0 && (
                      <button
                        type="button"
                        className={`vol2-filter-chip fullhdfilmizlesene ${activeProviderFilter === 'fullhdfilmizlesene' ? 'active' : ''}`}
                        onClick={() => setActiveProviderFilter('fullhdfilmizlesene')}
                      >
                        FullHDFilmİzlesene ({fhfCount})
                      </button>
                    )}
                    {fmCount > 0 && (
                      <button
                        type="button"
                        className={`vol2-filter-chip filmmakinesi ${activeProviderFilter === 'filmmakinesi' ? 'active' : ''}`}
                        onClick={() => setActiveProviderFilter('filmmakinesi')}
                      >
                        FilmMakinesi ({fmCount})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Search Results Grid */}
              {filteredResults.length > 0 && (
                <div className="vol2-results-grid">
                  {filteredResults.map((movie, idx) => {
                    const safePoster = getSafePosterUrl(movie.poster, movie.providerKey);
                    return (
                      <div 
                        key={`${movie.url}-${idx}`} 
                        className="vol2-movie-card"
                        onClick={() => handleMovieSelect(movie)}
                        title={`${movie.title} (${movie.provider}) - Oynatmak için tıkla`}
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
                                const currentSrc = e.currentTarget.src || '';
                                if (!currentSrc.includes('/api/proxy') && movie.poster) {
                                  e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(movie.poster)}`;
                                  return;
                                }
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
                          <div className="vol2-card-hover-overlay">
                            <div className="vol2-card-play-btn">
                              <Play size={16} fill="currentColor" />
                            </div>
                            <span>Oynat</span>
                          </div>
                        </div>

                        {/* Ek'te verilen etiket (Provider Badge) */}
                        <div className="vol2-card-provider-badge-wrap">
                          <img 
                            src={getProviderLogo(movie.providerKey)} 
                            alt={movie.provider} 
                            className="vol2-card-provider-logo"
                            loading="lazy"
                          />
                        </div>

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
