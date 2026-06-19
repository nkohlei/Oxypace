import { useState, useEffect, useRef } from 'react';
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
    Globe
} from 'lucide-react';
import { downloadFile as nativeDownloadFile } from '../utils/downloadHelper';
import './PostDetail.css';
import { linkifyText, extractFirstUrl } from '../utils/linkify';
import LinkPreview from '../components/LinkPreview';
import QuotedPost from '../components/QuotedPost';

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
    const menuRef = useRef(null);

    // Translation State
    const [isTranslated, setIsTranslated] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        fetchPost();
        
        // Click outside listener for menu
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [postId]);

    const fetchPost = async () => {
        try {
            const response = await axios.get(`/api/posts/${postId}`);
            setPost(response.data);
            // Check if user has saved this post (if user exists)
            // This usually requires a separate check or part of user object, 
            // but for now we rely on the handleSave toggle logic
        } catch (error) {
            console.error('Failed to fetch post:', error);
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

    const handleDownload = async () => {
        if (!post.media || post.media.length === 0) return;
        const mediaUrl = Array.isArray(post.media) ? post.media[0] : post.media;
        const url = getImageUrl(mediaUrl);
        const filename = url.split('/').pop() || `oxypace_post_${postId}`;
        await nativeDownloadFile(url, filename);
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
                <h2>Gönderi bulunamadı</h2>
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
                url={`https://oxypace.netlify.app/post/${postId}`}
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

                            <div className="pd-actions-wrapper" ref={menuRef}>
                                <button 
                                    className={`pd-menu-trigger ${isMenuOpen ? 'active' : ''}`}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {isMenuOpen && (
                                    <div className="pd-dropdown-menu">
                                        <button onClick={handleShare}>
                                            <Share2 size={16} />
                                            <span>Gönder</span>
                                        </button>
                                        <button onClick={handleSave}>
                                            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                                            <span>{saved ? 'Kaydedildi' : 'Kaydet'}</span>
                                        </button>
                                        {post.media && post.media.length > 0 && (
                                            <button onClick={handleDownload}>
                                                <Download size={16} />
                                                <span>İndir</span>
                                            </button>
                                        )}
                                        {isOwner && (
                                            <button onClick={handleDelete} className="pd-delete-action">
                                                <Trash2 size={16} />
                                                <span>Sil</span>
                                            </button>
                                        )}
                                    </div>
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

                            {post.quotedPost && (
                                <QuotedPost quotedPost={post.quotedPost} viewer={user} />
                            )}

                            {post.media && post.media.length > 0 && (
                                <div className="pd-media-showcase">
                                    {(Array.isArray(post.media) ? post.media : [post.media]).map((m, i) => (
                                        <div key={i} className="pd-media-item">
                                            {post.mediaType === 'video' ? (
                                                 <VideoPlayer 
                                                    src={getImageUrl(m)} 
                                                    qualities={post.videoQualities} 
                                                    videoUrl={getImageUrl(post.videoUrl)} 
                                                    lowVideoUrl={getImageUrl(post.lowVideoUrl)} 
                                                    video144={getImageUrl(post.video144)}
                                                    video360={getImageUrl(post.video360)}
                                                    video720={getImageUrl(post.video720)}
                                                    video1080={getImageUrl(post.video1080)}
                                                    video2160={getImageUrl(post.video2160)}
                                                />
                                            ) : (
                                                <img src={getImageUrl(m)} alt="" />
                                            )}
                                        </div>
                                    ))}
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
            </main>
        </div>
    );
};

export default PostDetail;
