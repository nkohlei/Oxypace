import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LinkPreview.css';

/**
 * Check if a URL is a Twitter/X tweet link
 */
function isTwitterUrl(url) {
    return /(?:x\.com|twitter\.com)\/\w+\/status\/\d+/i.test(url);
}

/**
 * Extract tweet ID from a Twitter/X URL
 */
function getTweetId(url) {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Twitter Embed Component — renders the actual tweet
 */
const TwitterEmbed = ({ url }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let timeout;

        const renderTweet = () => {
            if (!containerRef.current) return;

            // If Twitter widgets script is already loaded
            if (window.twttr && window.twttr.widgets) {
                window.twttr.widgets.createTweet(
                    getTweetId(url),
                    containerRef.current,
                    {
                        theme: 'dark',
                        dnt: true,
                        align: 'center',
                        conversation: 'none',
                    }
                ).then((el) => {
                    setLoading(false);
                    if (!el) setFailed(true);
                }).catch(() => {
                    setLoading(false);
                    setFailed(true);
                });
            } else {
                // Load the Twitter widget script
                const script = document.createElement('script');
                script.src = 'https://platform.twitter.com/widgets.js';
                script.async = true;
                script.onload = () => {
                    if (window.twttr && window.twttr.widgets) {
                        window.twttr.widgets.createTweet(
                            getTweetId(url),
                            containerRef.current,
                            {
                                theme: 'dark',
                                dnt: true,
                                align: 'center',
                                conversation: 'none',
                            }
                        ).then((el) => {
                            setLoading(false);
                            if (!el) setFailed(true);
                        }).catch(() => {
                            setLoading(false);
                            setFailed(true);
                        });
                    }
                };
                script.onerror = () => {
                    setLoading(false);
                    setFailed(true);
                };
                document.head.appendChild(script);
            }

            // Timeout fallback — if embed doesn't load in 10s, show fallback
            timeout = setTimeout(() => {
                setLoading(false);
                setFailed(true);
            }, 10000);
        };

        renderTweet();

        return () => {
            clearTimeout(timeout);
        };
    }, [url]);

    // If embed failed, fall back to generic preview
    if (failed) {
        return <GenericLinkPreview url={url} />;
    }

    return (
        <div className="twitter-embed-wrapper" onClick={(e) => e.stopPropagation()}>
            {loading && (
                <div className="link-preview-container loading">
                    <div className="link-preview-skeleton-image"></div>
                    <div className="link-preview-skeleton-text">
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                    </div>
                </div>
            )}
            <div ref={containerRef} style={{ display: loading ? 'none' : 'block' }} />
        </div>
    );
};

/**
 * Generic Link Preview (for non-Twitter URLs)
 */
const GenericLinkPreview = ({ url }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                let targetUrl = url;
                if (!targetUrl.startsWith('http')) {
                    targetUrl = `https://${targetUrl}`;
                }

                const response = await axios.get(`/api/preview?url=${encodeURIComponent(targetUrl)}`);
                if (response.data && response.data.title) {
                    setData(response.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Failed to fetch link preview:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (url) {
            fetchPreview();
        }
    }, [url]);

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

    if (error || !data || !data.title) {
        return null;
    }

    let domain;
    try {
        domain = new URL(data.url).hostname.replace('www.', '');
    } catch {
        domain = '';
    }

    return (
        <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-preview-container"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="link-preview-content">
                {data.image && (
                    <div className="link-preview-image-container">
                        <img 
                            src={data.image} 
                            alt={data.title} 
                            className="link-preview-image"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}
                <div className="link-preview-text">
                    <span className="link-preview-site">{data.siteName || domain}</span>
                    <h4 className="link-preview-title">{data.title}</h4>
                    {data.description && (
                        <p className="link-preview-description">{data.description}</p>
                    )}
                </div>
            </div>
        </a>
    );
};

/**
 * Main LinkPreview component — routes to the right renderer
 */
const LinkPreview = ({ url }) => {
    if (!url) return null;

    // Twitter/X tweets get the real embed
    if (isTwitterUrl(url)) {
        return <TwitterEmbed url={url} />;
    }

    // Everything else gets the OG-based preview card
    return <GenericLinkPreview url={url} />;
};

export default LinkPreview;
