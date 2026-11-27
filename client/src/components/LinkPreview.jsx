import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Repeat, Heart } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import PortalBadges from './PortalBadges';
import './LinkPreview.css';

const TweetVideo = ({ src, poster }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.intersectionRatio < 0.20) {
                    if (videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.muted = true;
                    }
                }
            },
            { threshold: [0, 0.20, 1.0] }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            className="tweet-card-video"
            onClick={(e) => e.stopPropagation()}
        />
    );
};

/**
 * Main LinkPreview component
 * For Twitter/X: renders a tweet-styled card with author info, text, media
 * For other sites: renders a generic OG-based preview card
 */
const LINK_PREVIEW_CACHE = new Map();
const MAX_LINK_PREVIEW_CACHE = 300;

const LinkPreview = ({ url, postId }) => {
    const normalizedUrl = url ? (url.startsWith('http') ? url : `https://${url}`) : '';
    const cachedEntry = normalizedUrl ? LINK_PREVIEW_CACHE.get(normalizedUrl) : undefined;

    const [data, setData] = useState(cachedEntry && !cachedEntry.error ? cachedEntry.data : null);
    const [loading, setLoading] = useState(cachedEntry === undefined);
    const [error, setError] = useState(Boolean(cachedEntry?.error));

    useEffect(() => {
        if (!normalizedUrl) {
            setLoading(false);
            return;
        }
        const hit = LINK_PREVIEW_CACHE.get(normalizedUrl);
        if (hit !== undefined) {
            setData(hit.error ? null : hit.data);
            setError(Boolean(hit.error));
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchPreview = async () => {
            try {
                const response = await axios.get(`/api/preview?url=${encodeURIComponent(normalizedUrl)}&postId=${postId || ''}`);
                if (response.data && (response.data.title || response.data.type === 'tweet')) {
                    if (LINK_PREVIEW_CACHE.size >= MAX_LINK_PREVIEW_CACHE) {
                        const oldest = LINK_PREVIEW_CACHE.keys().next().value;
                        if (oldest) LINK_PREVIEW_CACHE.delete(oldest);
                    }
                    LINK_PREVIEW_CACHE.set(normalizedUrl, { data: response.data, error: false });
                    if (!cancelled) {
                        setData(response.data);
                        setError(false);
                    }
                } else {
                    LINK_PREVIEW_CACHE.set(normalizedUrl, { data: null, error: true });
                    if (!cancelled) setError(true);
                }
            } catch (err) {
                LINK_PREVIEW_CACHE.set(normalizedUrl, { data: null, error: true });
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPreview();
        return () => {
            cancelled = true;
        };
    }, [normalizedUrl, postId]);

    useEffect(() => {
        if (data && data.type === 'tweet') {
            if (!window.twttr) {
                const script = document.createElement('script');
                script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
                script.setAttribute('async', 'true');
                script.setAttribute('charset', 'utf-8');
                document.head.appendChild(script);
            } else if (window.twttr.widgets) {
                window.twttr.widgets.load();
            }
        }
    }, [data]);

    if (loading) {
        return (
            <div className="link-preview-container loading">
                <div className="link-preview-skeleton-image"></div>
                <div className="link-preview-skeleton-text">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                </div>
            </div>
        );
    }

    if (error || !data) return null;

    // Tweet-styled card
    if (data.type === 'tweet') {
        return (
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tweet-card"
                onClick={async (e) => {
                    e.stopPropagation();
                    if (Capacitor.isNativePlatform()) {
                        e.preventDefault();
                        try {
                            const targetUrl = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                            await Browser.open({
                                url: targetUrl,
                                toolbarColor: '#060913',
                                presentationStyle: 'fullscreen'
                            });
                        } catch (err) {
                            window.open(data.url, '_system');
                        }
                    }
                }}
            >
                {/* Tweet Header */}
                <div className="tweet-card-header">
                    {data.authorAvatar && (
                        <img
                            src={data.authorAvatar}
                            alt={data.authorName}
                            className="tweet-card-avatar"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}
                    <div className="tweet-card-author">
                        <span className="tweet-card-name">{data.authorName}</span>
                        <span className="tweet-card-handle">@{data.authorHandle}</span>
                    </div>
                    <svg className="tweet-card-x-logo" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </div>

                {/* Tweet Text */}
                {data.description && (
                    <p className="tweet-card-text">{data.description}</p>
                )}


                {/* Tweet Photos */}
                {data.tweetPhotos && data.tweetPhotos.length > 0 && (
                    <div className={`tweet-card-media ${data.tweetPhotos.length > 1 ? 'tweet-card-media-grid' : ''}`}>
                        {data.tweetPhotos.slice(0, 4).map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt={`Tweet media ${i + 1}`}
                                className="tweet-card-media-img"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        ))}
                    </div>
                )}

                {/* Tweet Videos */}
                {data.tweetVideos && data.tweetVideos.length > 0 && (
                    <div className="tweet-card-media">
                        {data.tweetVideos.map((vid, i) => {
                            const apiBase = axios.defaults.baseURL || '';
                            const cleanBase = apiBase.replace(/\/$/, '');
                            const videoUrl = `${cleanBase}/api/preview/video?url=${encodeURIComponent(vid.url)}`;

                            return (
                                <TweetVideo
                                    key={i}
                                    src={videoUrl}
                                    poster={vid.thumbnail}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Tweet Stats */}
                <div className="tweet-card-stats">
                    <span className="tweet-card-stat">
                        <MessageCircle size={16} strokeWidth={1.5} />
                        {data.replies > 0 ? data.replies.toLocaleString() : ''}
                    </span>
                    <span className="tweet-card-stat">
                        <Repeat size={16} strokeWidth={1.5} />
                        {data.retweets > 0 ? data.retweets.toLocaleString() : ''}
                    </span>
                    <span className="tweet-card-stat">
                        <Heart size={16} strokeWidth={1.5} />
                        {data.likes > 0 ? data.likes.toLocaleString() : ''}
                    </span>
                </div>
            </a>
        );
    }

    // Internal Oxypace card (Portal, Profile, Post)
    if (data.type === 'internal') {
        const isPortal = data.subType === 'portal';
        return (
            <a
                href={data.url}
                className={`internal-preview-card${isPortal ? ' msg-portal-card' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Banner/Cover Image */}
                <div className="internal-card-banner">
                    {data.image ? (
                        <img
                            src={data.image}
                            alt={data.title}
                            className="internal-banner-img"
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <div className="internal-banner-placeholder" />
                    )}
                    {isPortal && data.privacy === 'private' && (
                        <span className="internal-banner-privacy-pill" title="Gizli Portal">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Gizli</span>
                        </span>
                    )}
                </div>

                {/* Content Section */}
                <div className="internal-card-content">
                    <div className="internal-card-head-row">
                        {(data.avatar || isPortal) && (
                            <div className="internal-avatar-wrapper">
                                {data.avatar ? (
                                    <img
                                        src={data.avatar}
                                        alt={data.title || 'Avatar'}
                                        className="internal-avatar-img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="internal-avatar-placeholder">
                                        {(data.title || 'P').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="internal-card-header">
                            {!isPortal && data.siteName && (
                                <span className="internal-site-tag">{data.siteName}</span>
                            )}
                            <h4 className="internal-card-title">
                                <span className="internal-card-title-text">{data.title}</span>
                                {isPortal && <PortalBadges portal={data} size={16} />}
                            </h4>
                        </div>
                    </div>
                    {data.description && (
                        <p className="internal-card-description">{data.description}</p>
                    )}
                </div>
            </a>
        );
    }

    return (
        <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-preview-container"
            onClick={async (e) => {
                e.stopPropagation();
                if (Capacitor.isNativePlatform()) {
                    e.preventDefault();
                    try {
                        const targetUrl = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                        await Browser.open({
                            url: targetUrl,
                            toolbarColor: '#060913',
                            presentationStyle: 'fullscreen'
                        });
                    } catch (err) {
                        window.open(data.url, '_system');
                    }
                }
            }}
        >
            <div className="link-preview-content">
                {data.image && (
                    <div className="link-preview-image-container">
                        <img
                            src={data.image}
                            alt={data.title}
                            className="link-preview-image" referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                )}
                <div className="link-preview-text">
                    <span className="link-preview-site">{data.siteName || (data.url ? new URL(data.url).hostname.replace("www.", "") : "")}</span>
                    <h4 className="link-preview-title">{data.title}</h4>
                    {data.description && (
                        <p className="link-preview-description">{data.description}</p>
                    )}
                </div>
            </div>
        </a>
    );
};

export default LinkPreview;
