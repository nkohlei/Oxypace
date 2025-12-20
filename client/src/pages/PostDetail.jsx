import { useState, useEffect } from 'react';
import { shouldShowTranslation } from '../utils/languageUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CommentSection from '../components/CommentSection';
import { getImageUrl } from '../utils/imageUtils';
import Badge from '../components/Badge';
import Footer from '../components/Footer';
import ShareModal from '../components/ShareModal';
import './PostDetail.css';

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [saved, setSaved] = useState(false);

    // Translation State
    const [isTranslated, setIsTranslated] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

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
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(post.content)}&langpair=AUTODETECT|tr`);
            const data = await response.json();

            if (data.responseData) {
                setTranslatedText(data.responseData.translatedText);
                setIsTranslated(true);
            }
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Çeviri yapılamadı.');
        } finally {
            setIsTranslating(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        try {
            const response = await axios.get(`/api/posts/${postId}`);
            setPost(response.data);
            setLiked(response.data.likes?.includes(user?._id) || false);
            setLikeCount(response.data.likeCount || 0);
        } catch (error) {
            console.error('Failed to fetch post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.post(`/api/likes/post/${postId}`);
            setLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('Like error:', error);
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
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const [showShareModal, setShowShareModal] = useState(false);

    const handleShare = () => {
        setShowShareModal(true);
    };

    const formatDate = (date) => {
        const postDate = new Date(date);
        return postDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="empty-state">
                        <p>Gönderi bulunamadı</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="post-detail-container">
                    {/* Back Button */}
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    {/* Post Content */}
                    <article className="post-detail">
                        <header className="post-detail-header">
                            <Link to={`/profile/${post.author?.username}`} className="author-link">
                                {post.author?.profile?.avatar ? (
                                    <img src={getImageUrl(post.author.profile.avatar)} alt="" className="author-avatar" />
                                ) : (
                                    <div className="author-avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="author-info">
                                    <span className="author-name">
                                        {post.author?.profile?.displayName || post.author?.username}
                                        <Badge type={post.author?.verificationBadge} />
                                    </span>
                                    <span className="author-username">@{post.author?.username}</span>
                                </div>
                            </Link>
                        </header>

                        {/* Post Text */}
                        {post.content && (
                            <div className="post-detail-text">
                                <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {isTranslated ? translatedText : post.content}
                                </p>
                                {shouldShowTranslation(post.content) && (
                                    <button
                                        className="translation-toggle"
                                        onClick={(e) => { e.stopPropagation(); handleTranslate(); }}
                                        style={{ marginTop: '12px' }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="2" y1="12" x2="22" y2="12"></line>
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                        </svg>
                                        {isTranslating ? 'Çevriliyor...' : (isTranslated ? 'Orijinalini gör' : 'Çevirisini gör')}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Post Media */}
                        {post.media && post.media.length > 0 && (
                            <div className="post-detail-media">
                                {Array.isArray(post.media) ? (
                                    post.media.map((mediaUrl, index) => (
                                        <img key={index} src={getImageUrl(mediaUrl)} alt={`Post media ${index + 1}`} />
                                    ))
                                ) : (
                                    <img src={getImageUrl(post.media)} alt="Post" />
                                )}
                            </div>
                        )}

                        {/* Post Meta */}
                        <div className="post-detail-meta">
                            <span className="post-date">{formatDate(post.createdAt)}</span>
                        </div>

                        {/* Post Stats */}
                        <div className="post-detail-stats">
                            <span><strong>{likeCount}</strong> beğenme</span>
                            <span><strong>{post.commentCount || 0}</strong> yorum</span>
                        </div>

                        {/* Post Actions */}
                        <div className="post-detail-actions">
                            <button
                                className={`action-btn ${liked ? 'liked' : ''}`}
                                onClick={handleLike}
                            >
                                <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>
                            <button className="action-btn comment-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </button>
                            <button className="action-btn" onClick={handleShare}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                            <button
                                className={`action-btn ${saved ? 'saved' : ''}`}
                                onClick={handleSave}
                            >
                                <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </button>
                        </div>
                    </article>

                    {/* Comments Section */}
                    <div className="post-detail-comments">
                        <h3>Yorumlar</h3>
                        <CommentSection postId={postId} />
                    </div>
                </div>
                <Footer />

                {showShareModal && (
                    <ShareModal postId={postId} onClose={() => setShowShareModal(false)} />
                )}
            </main>
        </div>
    );
};

export default PostDetail;
