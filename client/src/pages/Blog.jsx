import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Calendar, Sparkles, BookOpen, Search, Share2, Copy, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import './Blog.css';

const CATEGORIES = ['Tümü', 'Teorik Fizik', 'Astrofizik', 'Ekstrem Doğa Fiziği', 'Kozmoloji', 'Kuantum'];

const Blog = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeSlug = searchParams.get('post');

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [postLoading, setPostLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Tümü');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);

    // Fetch list of articles
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const categoryParam = activeCategory !== 'Tümü' ? `?category=${encodeURIComponent(activeCategory)}` : '';
                const res = await axios.get(`/api/blog${categoryParam}`);
                if (res.data && res.data.posts) {
                    setPosts(res.data.posts);
                }
            } catch (err) {
                console.error('Error fetching blog posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [activeCategory]);

    // Fetch individual post if activeSlug is set
    useEffect(() => {
        if (!activeSlug) {
            setSelectedPost(null);
            return;
        }

        const fetchSinglePost = async () => {
            try {
                setPostLoading(true);
                const res = await axios.get(`/api/blog/${activeSlug}`);
                if (res.data && res.data.post) {
                    setSelectedPost(res.data.post);
                }
            } catch (err) {
                console.error('Error fetching single post:', err);
            } finally {
                setPostLoading(false);
            }
        };

        fetchSinglePost();
    }, [activeSlug]);

    const handleSelectPost = (slug) => {
        setSearchParams({ post: slug });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToList = () => {
        setSearchParams({});
        setSelectedPost(null);
    };

    const handleShare = async () => {
        const shareUrl = `https://oxypace.com.tr/blog/${selectedPost?.slug || ''}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: selectedPost?.title || 'EVENT HORIZON',
                    url: shareUrl
                });
            } catch (e) {
                console.error(e);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const filteredPosts = posts.filter(post => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return post.title?.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q);
    });

    return (
        <div className="eh-blog-page-root">
            <SEO
                title={selectedPost ? `${selectedPost.title} - EVENT HORIZON` : 'EVENT HORIZON - Popüler Bilim Arşivi'}
                description={selectedPost ? selectedPost.excerpt : 'Evrenin fizik sınırları ve ekstrem doğa koşulları üzerine bağımsız bilimsel arşiv.'}
            />

            <Navbar hideThemeToggle />

            {/* If Single Post View */}
            {selectedPost ? (
                <article className="eh-single-article-container">
                    <div className="eh-article-top-bar">
                        <button className="eh-back-btn" onClick={handleBackToList}>
                            <ArrowLeft size={18} />
                            <span>Arşive Dön</span>
                        </button>
                        <button className="eh-share-btn" onClick={handleShare} title="Paylaş">
                            {copied ? <Check size={16} color="#34d399" /> : <Share2 size={16} />}
                            <span>{copied ? 'Kopyalandı' : 'Paylaş'}</span>
                        </button>
                    </div>

                    <header className="eh-article-header">
                        <div className="eh-article-meta-badge">
                            <span className="eh-category-pill">{selectedPost.category || 'Teorik Fizik'}</span>
                            <span className="eh-meta-item">
                                <Clock size={13} /> {selectedPost.readTime || '8 dk okuma'}
                            </span>
                            <span className="eh-meta-item">
                                <Calendar size={13} /> {selectedPost.date || 'Bugün'}
                            </span>
                        </div>
                        <h1 className="eh-article-title">{selectedPost.title}</h1>
                        {selectedPost.excerpt && (
                            <p className="eh-article-lead">{selectedPost.excerpt}</p>
                        )}
                    </header>

                    {selectedPost.image && (
                        <div className="eh-article-cover-wrap">
                            <img src={selectedPost.image} alt={selectedPost.title} className="eh-article-cover-img" />
                        </div>
                    )}

                    <div 
                        className="eh-article-content-body"
                        dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                    />
                </article>
            ) : (
                /* Archive List View */
                <main className="eh-archive-main">
                    {/* Header Banner */}
                    <div className="eh-banner-hero">
                        <div className="eh-hero-eyebrow">
                            <Sparkles size={14} /> POPÜLER BİLİM ARŞİVİ
                        </div>
                        <h1 className="eh-hero-title">EVENT HORIZON</h1>
                        <p className="eh-hero-desc">
                            Evrenin fizik sınırları, termodinamik yasalar, astrofiziksel anomaliler ve ekstrem doğa şartları üzerine derinlemesine bilimsel analizler.
                        </p>

                        {/* Search & Categories Bar */}
                        <div className="eh-controls-row">
                            <div className="eh-search-box">
                                <Search size={16} className="eh-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Makalelerde ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="eh-search-input"
                                />
                            </div>

                            <div className="eh-categories-scroll">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        className={`eh-cat-chip ${activeCategory === cat ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    <div className="eh-posts-grid-container">
                        {loading ? (
                            <div className="eh-loading-box">
                                <div className="eh-spinner"></div>
                                <span>Makaleler yükleniyor...</span>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="eh-empty-box">
                                <BookOpen size={32} />
                                <p>Aradığınız kriterlere uygun makale bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="eh-cards-grid">
                                {filteredPosts.map(post => (
                                    <div 
                                        key={post._id || post.slug} 
                                        className="eh-card-item"
                                        onClick={() => handleSelectPost(post.slug)}
                                    >
                                        {post.image && (
                                            <div className="eh-card-img-wrap">
                                                <img src={post.image} alt={post.title} className="eh-card-img" loading="lazy" />
                                                <span className="eh-card-category">{post.category}</span>
                                            </div>
                                        )}
                                        <div className="eh-card-body">
                                            <div className="eh-card-meta">
                                                <span><Clock size={12} /> {post.readTime}</span>
                                                <span>•</span>
                                                <span>{post.date}</span>
                                            </div>
                                            <h3 className="eh-card-title">{post.title}</h3>
                                            <p className="eh-card-excerpt">{post.excerpt}</p>
                                            <div className="eh-card-footer">
                                                <span className="eh-read-btn">Makaleyi Oku →</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            )}
        </div>
    );
};

export default Blog;
