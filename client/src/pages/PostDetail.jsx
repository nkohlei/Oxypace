import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { shouldShowTranslation } from '../utils/languageUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import { getImageUrl } from '../utils/imageUtils';
import UserBadges from '../components/UserBadges';
import Footer from '../components/Footer';
import ShareModal from '../components/ShareModal';
import SEO from '../components/SEO';
import { useSocket } from '../context/SocketContext';
import VideoPlayer from '../components/VideoPlayer';
import { 
    MoreVertical, 
    Share2, 
    Bookmark, 
    Download, 
    Trash2,
    ChevronLeft,
    Globe,
    Copy,
    Check,
    Film
} from 'lucide-react';
import { downloadFile as nativeDownloadFile } from '../utils/downloadHelper';
import { Capacitor } from '@capacitor/core';
import './PostDetail.css';
import { linkifyText, extractFirstUrl } from '../utils/linkify';
import LinkPreview from '../components/LinkPreview';
import QuotedPost from '../components/QuotedPost';
import VideoDownloadModal from '../components/VideoDownloadModal';
import PostImageGallery from '../components/PostImageGallery';

// YouTube video ID'sini URL'den çıkar
const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// Post için SEO meta verilerini hesapla
const getPostSeoMeta = (post) => {
    if (!post) return {};
    const mediaUrl = Array.isArray(post.media) ? post.media[0] : post.media;
    
    if (post.mediaType === 'youtube') {
        const ytId = extractYouTubeId(mediaUrl);
        return {
            image: ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined,
            videoUrl: undefined,
        };
    }
    
    if (post.mediaType === 'video' && mediaUrl) {
        return {
            image: mediaUrl,  // video URL thumbnail olarak
            videoUrl: mediaUrl,
        };
    }
    
    if ((post.mediaType === 'image' || post.mediaType === 'gif') && mediaUrl) {
        return {
            image: getImageUrl(mediaUrl),
            videoUrl: undefined,
        };
    }
    
    return {};
};

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user, token: authContextToken } = useAuth();
    const { socket, connected } = useSocket();
    
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    
    // Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuBtnRef = useRef(null);
    const menuRef = useRef(null);

    const handleMenuToggle = (e) => {
        e.stopPropagation();
        setIsMenuOpen(prev => {
            if (!prev && menuBtnRef.current) {
                const rect = menuBtnRef.current.getBoundingClientRect();
                const menuWidth = window.innerWidth <= 768 ? 140 : 165;
                setMenuPosition({
                    top: rect.bottom + 6,
                    left: Math.max(10, rect.right - menuWidth),
                });
            }
            return !prev;
        });
    };

    // Menu Click outside & scroll/resize listener
    useEffect(() => {
        if (!isMenuOpen) return;

        const updatePosition = () => {
            if (menuBtnRef.current) {
                const rect = menuBtnRef.current.getBoundingClientRect();
                
                // If post has scrolled behind top header or off-screen, auto-close
                if (rect.bottom < 80 || rect.top > window.innerHeight - 20) {
                    setIsMenuOpen(false);
                    return;
                }

                const menuWidth = window.innerWidth <= 768 ? 140 : 165;
                setMenuPosition({
                    top: rect.bottom + 6,
                    left: Math.max(10, rect.right - menuWidth),
                });
            }
        };

        const handleClickOutside = (event) => {
            const clickedMenu = event.target.closest('.pd-dropdown-menu');
            const clickedBtn = menuBtnRef.current && menuBtnRef.current.contains(event.target);
            if (!clickedMenu && !clickedBtn) {
                setIsMenuOpen(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }, 0);

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isMenuOpen]);

    // Translation State
    const [isTranslated, setIsTranslated] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const [showShareModal, setShowShareModal] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [errorStatus, setErrorStatus] = useState(null);
    const [copiedVideoId, setCopiedVideoId] = useState(false);

    const handleCopyVideoId = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (post && post._id) {
            navigator.clipboard.writeText(post._id);
            setCopiedVideoId(true);
            setTimeout(() => setCopiedVideoId(false), 2000);
        }
    };

    useEffect(() => {
        fetchPost();
        
        // Socket listener for real-time updates
        if (socket && connected) {
            const handleUpdatePost = (updatedPost) => {
                if (String(updatedPost._id) === String(postId)) {
                    console.log('✅ PostDetail real-time update accepted');
                    setPost(updatedPost);
                }
            };
            socket.on('post:updated', handleUpdatePost);
            
            return () => {
                socket.off('post:updated', handleUpdatePost);
            };
        }
    }, [postId, socket, connected]);

    const fetchPost = async () => {
        try {
            const activeToken = authContextToken || localStorage.getItem('token');
            const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
            const response = await axios.get(`/api/posts/${postId}`, config);
            setPost(response.data);
            setErrorStatus(null);
            // Check if user has saved this post (if user exists)
            // This usually requires a separate check or part of user object, 
            // but for now we rely on the handleSave toggle logic
        } catch (error) {
            const status = error.response?.status || 0;
            console.error('Failed to fetch post:', status, error.response?.data || error.message);
            setErrorStatus(status);
        } finally {
            setLoading(false);
        }
    };

    const handleTranslate = async () => {
        if (isTranslated) {
            setIsTranslated(false);
            return;
        }
        if (translatedText) {
            setIsTranslated(true);
            return;
        }
        setIsTranslating(true);
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q=${encodeURIComponent(post.content)}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data && data[0]) {
                const translated = data[0].map((segment) => segment[0]).join('');
                setTranslatedText(translated);
                setIsTranslated(true);
            }
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.post(`/api/users/me/save/${postId}`);
            setSaved(response.data.saved);
            setIsMenuOpen(false);
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleShare = () => {
        setShowShareModal(true);
        setIsMenuOpen(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
            try {
                const activeToken = authContextToken || localStorage.getItem('token');
                const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
                await axios.delete(`/api/posts/${postId}`, config);
                navigate(-1);
            } catch (err) {
                console.error('Delete error:', err);
                alert('Gönderi silinemedi.');
            }
        }
    };

    const getDownloadUrlForQuality = (post, prefQuality) => {
        const qualities = post.videoQualities || {};
        const has2160 = !!(post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p']);
        const has1080 = !!(post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'] || post.videoOriginal || qualities.videoOriginal || qualities.high || post.videoUrl);
        const has720  = !!(post.video720  || qualities.video720  || qualities.p720  || qualities['720p']);
        const has360  = !!(post.video360  || qualities.video360  || qualities.p360  || qualities['360p']);
        const has144  = !!(post.video144  || qualities.video144  || qualities.p144  || qualities['144p']);

        const src144  = post.video144  || qualities.video144  || qualities.p144  || qualities['144p']  || qualities.low || post.lowVideoUrl || post.media;
        const src360  = post.video360  || qualities.video360  || qualities.p360  || qualities['360p']  || src144;
        const src720  = post.video720  || qualities.video720  || qualities.p720  || qualities['720p']  || src360;
        const src1080 = post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'] || post.videoOriginal || qualities.videoOriginal || qualities.high || post.videoUrl || post.media;
        const src2160 = post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p'] || src1080;

        if (prefQuality === '2160' && has2160) return src2160;
        if (prefQuality === '1080' && has1080) return src1080;
        if (prefQuality === '720' && has720) return src720;
        if (prefQuality === '360' && has360) return src360;
        if (prefQuality === '144' && has144) return src144;

        if (has2160) return src2160;
        if (has1080) return src1080;
        if (has720) return src720;
        if (has360) return src360;
        if (has144) return src144;
        return Array.isArray(post.media) ? post.media[0] : post.media;
    };

    const handleDownload = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (post.pdfUrl) {
            const url = getImageUrl(post.pdfUrl);
            const filename = post.pdfName || 'Doküman.pdf';
            await nativeDownloadFile(url, filename);
            setIsMenuOpen(false);
            return;
        }
        if (!post.media || post.media.length === 0) return;

        if (post.mediaType === 'video') {
            const downloadPref = user?.settings?.video?.downloadQuality || 'ask';
            if (downloadPref === 'ask') {
                setShowDownloadModal(true);
                setIsMenuOpen(false);
                return;
            }

            const targetUrl = getDownloadUrlForQuality(post, downloadPref);
            const filename = targetUrl.split('/').pop() || `oxypace-video-${Date.now()}`;
            await nativeDownloadFile(getImageUrl(targetUrl), filename);
        } else if (Array.isArray(post.media)) {
            for (let i = 0; i < post.media.length; i++) {
                const img = post.media[i];
                if (img) {
                    const url = getImageUrl(img);
                    const filename = url.split('/').pop() || `oxypace_post_${postId}_${i + 1}.jpg`;
                    await nativeDownloadFile(url, filename);
                }
            }
        } else {
            const url = getImageUrl(post.media);
            const filename = url.split('/').pop() || `oxypace_post_${postId}`;
            await nativeDownloadFile(url, filename);
        }
        setIsMenuOpen(false);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="pd-loading-screen">
            <div className="pd-spinner"></div>
        </div>
    );

    if (!post) return (
        <div className="pd-empty-screen">
            <Navbar />
            <div className="pd-empty-content">
                {errorStatus === 403 ? (
                    <>
                        <h2>Bu gönderiye erişim izniniz yok</h2>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
                            Bu gönderi özel bir portala ait. Erişmek için üye olmanız gerekiyor.
                        </p>
                    </>
                ) : errorStatus === 401 ? (
                    <>
                        <h2>Giriş yapmanız gerekiyor</h2>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
                            Bu gönderiyi görüntülemek için oturum açın.
                        </p>
                    </>
                ) : (
                    <h2>Gönderi bulunamadı</h2>
                )}
                <button onClick={() => navigate(-1)}>Geri Dön</button>
            </div>
        </div>
    );

    const isOwner = user?._id === post.author?._id;
    const seoMeta = getPostSeoMeta(post);
    const authorName = post.author?.profile?.displayName || post.author?.username || 'Oxypace';

    return (
        <div className="pd-page-root">
            <SEO
                title={`${authorName} bir şey paylaştı`}
                description={post.content?.substring(0, 160) || 'Oxypace\'te paylaşılan bir gönderi.'}
                image={seoMeta.image}
                videoUrl={seoMeta.videoUrl}
                type={seoMeta.videoUrl ? 'video.other' : 'article'}
                url={`https://oxypace.com.tr/post/${postId}`}
                article={{
                    publishedTime: post.createdAt,
                    author: authorName,
                }}
            />

            <Navbar />

            <main className="pd-main-content">
                <div className="pd-card-container">
                    {/* Back Nav */}
                    <button className="pd-back-pill" onClick={() => navigate(-1)}>
                        <ChevronLeft size={18} />
                        <span>Geri</span>
                    </button>

                    <article className="pd-modern-card">
                        <header className="pd-card-header">
                            <Link to={`/profile/${post.author?.username}`} className="pd-author-area">
                                {post.author?.profile?.avatar ? (
                                    <img src={getImageUrl(post.author.profile.avatar)} alt="" className="pd-avatar" />
                                ) : (
                                    <div className="pd-avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="pd-author-meta">
                                    <span className="pd-display-name">
                                        {post.author?.profile?.displayName || post.author?.username}
                                        <UserBadges user={post.author} size={18} />
                                    </span>
                                    <span className="pd-username">@{post.author?.username}</span>
                                </div>
                            </Link>

                            <div className="pd-actions-wrapper">
                                <button 
                                    ref={menuBtnRef}
                                    className={`pd-menu-trigger ${isMenuOpen ? 'active' : ''}`}
                                    onClick={handleMenuToggle}
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {isMenuOpen && createPortal(
                                    <div
                                        ref={menuRef}
                                        className="pd-dropdown-menu"
                                        style={{
                                            position: 'fixed',
                                            top: menuPosition.top,
                                            left: menuPosition.left,
                                            zIndex: 25,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            className="pd-menu-item"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleShare();
                                            }}
                                        >
                                            <div className="pd-menu-item-icon">
                                                <Share2 size={17} />
                                            </div>
                                            <span className="pd-menu-item-label">Gönder</span>
                                        </div>
                                        <div
                                            className="pd-menu-item"
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleSave();
                                            }}
                                        >
                                            <div className="pd-menu-item-icon">
                                                <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
                                            </div>
                                            <span className="pd-menu-item-label">{saved ? 'Kaydı Kaldır' : 'Kaydet'}</span>
                                        </div>
                                        {((post.media && post.media.length > 0) || post.pdfUrl) && (
                                            <div
                                                className="pd-menu-item"
                                                onClick={(e) => {
                                                    setIsMenuOpen(false);
                                                    handleDownload(e);
                                                }}
                                            >
                                                <div className="pd-menu-item-icon">
                                                    <Download size={17} />
                                                </div>
                                                <span className="pd-menu-item-label">İndir</span>
                                            </div>
                                        )}
                                        {isOwner && (
                                            <>
                                                <div className="pd-menu-divider" />
                                                <div
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        handleDelete();
                                                    }}
                                                    className="pd-menu-item pd-delete-action"
                                                >
                                                    <div className="pd-menu-item-icon">
                                                        <Trash2 size={17} />
                                                    </div>
                                                    <span className="pd-menu-item-label">Sil</span>
                                                </div>
                                            </>
                                        )}
                                    </div>,
                                    document.body
                                )}
                            </div>
                        </header>

                        <div className="pd-card-body">
                            {post.content && (
                                <div className="pd-content-text">
                                    {(() => {
                                        const firstUrl = extractFirstUrl(post.content);
                                        const contentToShow = isTranslated ? translatedText : post.content;
                                        return <p>{linkifyText(contentToShow, firstUrl)}</p>;
                                    })()}
                                    
                                    {shouldShowTranslation(post.content) && (
                                        <button className="pd-translate-btn" onClick={handleTranslate}>
                                            <Globe size={14} />
                                            {isTranslating ? 'Çevriliyor...' : isTranslated ? 'Orijinal' : 'Çevir'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Link Preview (Isolated from media) */}
                            {(() => {
                                const firstUrl = extractFirstUrl(post.content);
                                if (firstUrl) {
                                    return <LinkPreview url={firstUrl} postId={post._id} />;
                                }
                                return null;
                            })()}

                            {/* PDF Document Card */}
                            {post.pdfUrl && (
                                <div className="post-pdf-container" onClick={(e) => e.stopPropagation()}>
                                    <div
                                        className="pdf-glass-card"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (Capacitor.isNativePlatform()) {
                                                window.open(getImageUrl(post.pdfUrl), '_system');
                                            } else {
                                                window.open(getImageUrl(post.pdfUrl), '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                    >
                                        {post.pdfThumbnailUrl ? (
                                            <div className="pdf-thumbnail-wrapper">
                                                <img
                                                    src={getImageUrl(post.pdfThumbnailUrl)}
                                                    alt="PDF preview"
                                                    className="pdf-thumbnail"
                                                    loading="lazy"
                                                    decoding="async"
                                                    width="150"
                                                    height="200"
                                                />
                                                <div className="pdf-badge">PDF</div>
                                            </div>
                                        ) : (
                                            <div className="pdf-icon-placeholder">
                                                <div className="pdf-icon-text">PDF</div>
                                            </div>
                                        )}
                                        <div className="pdf-info">
                                            <span className="pdf-name" title={post.pdfName || 'Doküman.pdf'}>
                                                {post.pdfName || 'Doküman.pdf'}
                                            </span>
                                            <span className="pdf-size">
                                                {post.pdfSize ? (post.pdfSize / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
                                            </span>
                                        </div>
                                        <button
                                            className="pdf-download-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(e);
                                            }}
                                            aria-label="PDF İndir"
                                            title="İndir"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {post.quotedPost && (
                                <QuotedPost quotedPost={post.quotedPost} viewer={user} />
                            )}

                            {post.media && (
                                <div className="pd-media-showcase">
                                    {post.mediaType === 'video' || post.mediaType === 'videoUrl' ? (
                                        <div className="pd-media-item">
                                            <VideoPlayer 
                                                src={post.mediaType === 'videoUrl' ? post.media : getImageUrl(post.media)} 
                                                qualities={post.videoQualities} 
                                                videoUrl={post.mediaType === 'videoUrl' ? post.media : getImageUrl(post.videoUrl)} 
                                                lowVideoUrl={post.mediaType === 'videoUrl' ? post.media : getImageUrl(post.lowVideoUrl)} 
                                                video144={post.mediaType === 'videoUrl' ? '' : getImageUrl(post.video144)} 
                                                video360={post.mediaType === 'videoUrl' ? '' : getImageUrl(post.video360)} 
                                                video720={post.mediaType === 'videoUrl' ? '' : getImageUrl(post.video720)} 
                                                video1080={post.mediaType === 'videoUrl' ? '' : getImageUrl(post.video1080)} 
                                                video2160={post.mediaType === 'videoUrl' ? '' : getImageUrl(post.video2160)} 
                                                isProcessing={post.mediaType === 'videoUrl' ? false : post.isProcessing} 
                                                processingProgress={post.processingProgress} 
                                                estimatedTime={post.estimatedTime} 
                                            />
                                            <div className="post-video-id-wrapper">
                                                <span
                                                    className="post-video-id-badge"
                                                    onClick={handleCopyVideoId}
                                                    title="Birlikte İzle için Video ID'sini Kopyala"
                                                >
                                                    <Film size={12} className="video-id-icon" />
                                                    <span className="video-id-label">Video ID:</span>
                                                    <code className="video-id-val">{post._id}</code>
                                                    {copiedVideoId ? <Check size={12} color="#10b981" /> : <Copy size={12} className="copy-icon" />}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <PostImageGallery media={post.media} />
                                    )}
                                </div>
                            )}
                        </div>

                        <footer className="pd-card-footer">
                            <span className="pd-timestamp">{formatDate(post.createdAt)}</span>
                        </footer>
                    </article>
                </div>
                
                {showShareModal && (
                    <ShareModal postId={postId} onClose={() => setShowShareModal(false)} />
                )}

                {showDownloadModal && (
                    <VideoDownloadModal
                        isOpen={showDownloadModal}
                        onClose={() => setShowDownloadModal(false)}
                        post={post}
                        onDownload={async (url, label) => {
                            const filename = url.split('/').pop() || `oxypace-video-${Date.now()}`;
                            await nativeDownloadFile(getImageUrl(url), filename);
                        }}
                    />
                )}
            </main>
        </div>
    );
};

export default PostDetail;
