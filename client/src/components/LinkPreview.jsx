import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Repeat, Heart } from 'lucide-react';
import './LinkPreview.css';

/**
 * Main LinkPreview component
 * For Twitter/X: renders a tweet-styled card with author info, text, media
 * For other sites: renders a generic OG-based preview card
 */
const LinkPreview = ({ url }) => {
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
                if (response.data && (response.data.title || response.data.type === 'tweet')) {
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

    if (error || !data) return null;

    // Tweet-styled card
    if (data.type === 'tweet') {
        return (
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tweet-card"
                onClick={(e) => e.stopPropagation()}
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
                        {data.tweetVideos.map((vid, i) => (
                            <video
                                key={i}
                                src={`/api/preview/video?url=${encodeURIComponent(vid.url)}`}
                                poster={vid.thumbnail}
                                controls
                                playsInline
                                preload="metadata"
                                className="tweet-card-video"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ))}
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
        return (
            <a
                href={data.url}
                className="internal-preview-card"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Banner/Cover Image */}
                <div className="internal-card-banner">
                    {data.image ? (
                        <img 
                            src={data.image} 
                            alt={data.title} 
                            className="internal-banner-img"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    ) : (
                        <div className="internal-banner-placeholder" />
                    )}
                    
                    {/* Avatar Overlay */}
                    {data.avatar && (
                        <div className="internal-avatar-wrapper">
                            <img 
                                src={data.avatar} 
                                alt="Avatar" 
                                className="internal-avatar-img"
                                onError={(e) => e.target.parentElement.style.display = 'none'}
                            />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="internal-card-content">
                    <div className="internal-card-header">
                        <span className="internal-site-tag">{data.siteName}</span>
                        <h4 className="internal-card-title">{data.title}</h4>
                    </div>
                    {data.description && (
                        <p className="internal-card-description">{data.description}</p>
                    )}
                </div>
            </a>
        );
    }

    // Generic OG preview card
    if (!data.title) return null;

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

export default LinkPreview;
