import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
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
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'manual'

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  // Resolver state
  const [url, setUrl] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [resolvingModeLabel, setResolvingModeLabel] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resolvedData, setResolvedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setSelectedMovie(null);
      setResolvingModeLabel('');
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
    setErrorMsg(null);

    try {
      const response = await axios.get(`/api/search-movies?q=${encodeURIComponent(q)}`, {
        timeout: 22000,
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
        msg = 'Film arama servisi şu anda güncelleniyor. Lütfen birkaç saniye sonra tekrar deneyin.';
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

  // Unified Movie Resolution (auto-fastest race OR explicit alternative source token)
  const startResolveMovie = async (movie, explicitSource = null) => {
    if (!movie || !Array.isArray(movie.sources) || movie.sources.length === 0) {
      setErrorMsg('Bu film için geçerli oynatma kaynağı bulunamadı.');
      return;
    }

    setIsResolving(true);
    setErrorMsg(null);
    setResolvedData(null);
    setElapsedMs(0);
    setSelectedMovie(movie);
    setResolvingModeLabel(
      explicitSource?.label
        ? `${explicitSource.label} üzerinden yayın akışı hazırlanıyor...`
        : 'En hızlı yayın kaynağı taranıyor ve hazırlanıyor...'
    );

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    try {
      const payload = {
        title: movie.title,
        sources: movie.sources.map((s) => s.token),
        timeout: 14000,
      };
      if (explicitSource?.token) {
        payload.sourceToken = explicitSource.token;
      }

      const response = await axios.post('/api/resolve-movie', payload, { timeout: 22000 });
      clearInterval(timerRef.current);

      if (response.data && response.data.success && response.data.playableStreamUrl) {
        const resData = {
          ...response.data,
          playableStreamUrl: formatPlayableUrl(response.data.playableStreamUrl),
          pageTitle: movie.title || response.data.pageTitle || 'Film Akışı',
          subtitles: (response.data.subtitles || []).map((s) => ({
            ...s,
            playableUrl: formatPlayableUrl(s.playableUrl),
          })),
        };
        setResolvedData(resData);

        if (onStartWatchParty) {
          onStartWatchParty(
            resData.playableStreamUrl,
            false,
            resData.subtitles || [],
            resData.pageTitle || movie.title || '',
            {
              alternatives: resData.alternatives || movie.sources,
              activeSourceToken: resData.activeSourceToken || '',
            }
          );
          onClose();
        }
      } else {
        setErrorMsg(
          response.data?.error ||
            'Bu kaynaktan oynatılabilir video akışı alınamadı. Lütfen alternatif bir kaynağı deneyin.'
        );
      }
    } catch (err) {
      clearInterval(timerRef.current);
      const serverErr = err.response?.data?.error || err.message;
      if (err.response?.status === 404) {
        setErrorMsg('Bu kaynaktan video akışı alınamadı. Lütfen aşağıdaki alternatif kaynaklardan birini deneyin.');
      } else if (err.code === 'ECONNABORTED' || err.response?.status === 408) {
        setErrorMsg('Kaynak yanıt vermedi (zaman aşımı). Lütfen alternatif kaynaklardan birini deneyin.');
      } else {
        setErrorMsg(serverErr || 'Yayın hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  // Manual Link Resolution
  const startResolveManualUrl = async (targetUrl) => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) {
      setErrorMsg('Lütfen geçerli bir sayfa veya akış bağlantısı girin.');
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
    setSelectedMovie(null);
    setResolvingModeLabel('Bağlantı üzerinden yayın akışı hazırlanıyor...');

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    try {
      const response = await axios.post(
        '/api/resolve-stream',
        { url: trimmedUrl, timeout: 16000 },
        { timeout: 22000 }
      );
      clearInterval(timerRef.current);

      if (response.data && response.data.success && response.data.playableStreamUrl) {
        const resData = {
          ...response.data,
          playableStreamUrl: formatPlayableUrl(response.data.playableStreamUrl),
          subtitles: (response.data.subtitles || []).map((s) => ({
            ...s,
            playableUrl: formatPlayableUrl(s.playableUrl),
          })),
        };
        setResolvedData(resData);
      } else {
        setErrorMsg(response.data?.error || 'Bu bağlantıdan oynatılabilir akış alınamadı.');
      }
    } catch (err) {
      clearInterval(timerRef.current);
      if (err.response?.status === 404) {
        setErrorMsg('Bu sayfada oynatılabilir video akışı bulunamadı.');
      } else if (err.code === 'ECONNABORTED' || err.response?.status === 408) {
        setErrorMsg('Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        setErrorMsg(err.response?.data?.error || err.message || 'Çözümleme sırasında bir hata oluştu.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleManualResolveSubmit = (e) => {
    if (e) e.preventDefault();
    startResolveManualUrl(url);
  };

  const handleStartInRoom = () => {
    if (!resolvedData?.playableStreamUrl) return;
    if (onStartWatchParty) {
      onStartWatchParty(
        formatPlayableUrl(resolvedData.playableStreamUrl),
        false,
        resolvedData.subtitles || [],
        resolvedData.pageTitle || selectedMovie?.title || '',
        {
          alternatives: resolvedData.alternatives || selectedMovie?.sources || [],
          activeSourceToken: resolvedData.activeSourceToken || '',
        }
      );
      onClose();
    }
  };

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
                <h3 className="vol2-header-title">Birlikte Film İzle</h3>
                <span className="vol2-header-badge">Akıllı Kaynak</span>
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
            onClick={() => { setActiveTab('search'); setErrorMsg(null); setResolvedData(null); }}
          >
            <Search size={15} />
            <span>Film Ara</span>
            <span className="vol2-tab-pill">Hızlı</span>
          </button>
          <button
            type="button"
            className={`vol2-mode-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => { setActiveTab('manual'); setErrorMsg(null); setResolvedData(null); }}
          >
            <Link2 size={15} />
            <span>Doğrudan Link Yapıştır</span>
          </button>
        </div>

        {/* Body */}
        <div className="vol2-resolver-body custom-scrollbar">

          {/* Resolving In-Progress Card */}
          {isResolving && (
            <div className="vol2-resolving-card">
              {selectedMovie?.poster && (
                <img src={selectedMovie.poster} alt={selectedMovie.title} className="vol2-resolving-poster" />
              )}
              <div className="vol2-resolving-info">
                <div className="vol2-loading-header">
                  <span className="vol2-loading-text">
                    <div className="vol2-spinner" />
                    <strong>{selectedMovie?.title || 'Film Akışı'}</strong> hazırlanıyor...
                  </span>
                  <span className="vol2-loading-timer">{(elapsedMs / 1000).toFixed(1)}s</span>
                </div>
                <p className="vol2-resolving-sub">
                  {resolvingModeLabel || 'Yayın akışı hazırlanıyor...'}
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
                    {resolvedData.pageTitle || 'Video Akışı Hazır'}
                  </h4>
                  <p className="vol2-result-url-sub">Güvenli oynatma akışı başlatılmaya hazır</p>
                </div>
                <CheckCircle2 size={20} color="#ffffff" style={{ flexShrink: 0 }} />
              </div>

              <div className="vol2-result-meta">
                <span className="vol2-meta-tag success">Hazır</span>
                <span className="vol2-meta-tag">Format: {resolvedData.type?.toUpperCase() || 'HLS'}</span>
                {resolvedData.resolvedIn > 0 && (
                  <span className="vol2-meta-tag">{resolvedData.resolvedIn} ms</span>
                )}
              </div>
            </div>
          )}

          {/* Error Message + Quick Alternative Source Picker */}
          {!isResolving && errorMsg && (
            <div className="vol2-error-box-wrap">
              <div className="vol2-error-box">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
              {selectedMovie && Array.isArray(selectedMovie.sources) && selectedMovie.sources.length > 0 && (
                <div className="vol2-error-alt-row">
                  <span className="vol2-error-alt-label">Alternatif Kaynak Dene:</span>
                  <div className="vol2-error-alt-btns">
                    {selectedMovie.sources.map((src, i) => (
                      <button
                        key={src.token}
                        type="button"
                        className="vol2-error-alt-btn"
                        onClick={() => startResolveMovie(selectedMovie, src)}
                      >
                        <Play size={11} fill="currentColor" />
                        <span>{src.label || `Kaynak ${i + 1}`}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: FILM ARA */}
          {activeTab === 'search' && !isResolving && !resolvedData && (
            <div className="vol2-search-container">
              <form
                className="vol2-search-bar"
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              >
                <div className="vol2-search-input-wrap">
                  <Search size={16} className="vol2-search-icon" />
                  <input
                    type="text"
                    className="vol2-search-input"
                    placeholder="Film adı yazın (örn: Matrix, Batman, Inception)..."
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

              {searchError && (
                <div className="vol2-error-box">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Unified Search Results Grid (1 card per movie, ZERO provider logos/names) */}
              {searchResults.length > 0 && (
                <div className="vol2-results-grid">
                  {searchResults.map((movie, idx) => {
                    const cardId = movie.id || `${idx}`;

                    return (
                      <div
                        key={cardId}
                        className="vol2-movie-card"
                        onClick={() => startResolveMovie(movie, null)}
                        title={`${movie.title} — En hızlı kaynaktan oynat`}
                      >
                        <div className="vol2-movie-poster-wrap">
                          {movie.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="vol2-movie-poster"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="vol2-poster-fallback" style={{ display: movie.poster ? 'none' : 'flex' }}>
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
                Video akış bağlantısını (.m3u8, .mp4 veya yayın sayfası linki) doğrudan yapıştırın.
              </p>

              <form className="vol2-input-group" onSubmit={handleManualResolveSubmit}>
                <label className="vol2-input-label">Hedef Yayın veya Akış Bağlantısı</label>
                <div className={`vol2-input-box ${errorMsg ? 'error' : ''}`}>
                  <div className="vol2-input-icon">
                    <Link2 size={16} />
                  </div>
                  <input
                    type="text"
                    className="vol2-input-field"
                    placeholder="https://... veya https://.../master.m3u8"
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
                  Hazırlanıyor...
                </>
              ) : (
                <>
                  Kaynağı Hazırla
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
