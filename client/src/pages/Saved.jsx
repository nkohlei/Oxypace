import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import './Saved.css';

const Saved = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSavedPosts();
    }, []);

    const fetchSavedPosts = async () => {
        try {
            const response = await axios.get('/api/users/me/saved');
            setPosts(response.data.filter((post) => post !== null));
        } catch (error) {
            console.error('Failed to fetch saved posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostRemoved = (postId) => {
        setPosts(posts.filter((post) => post._id !== postId));
    };

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="saved-container">
                    <div className="saved-header">
                        <button className="saved-back-btn" onClick={() => navigate(-1)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <h1 className="saved-title">Kaydedilenler</h1>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📑</div>
                            <h3>Henüz kaydettiğin gönderi yok</h3>
                            <p>Gönderilerdeki kaydet butonuna tıklayarak buraya ekleyebilirsin</p>
                        </div>
                    ) : (
                        <div className="saved-posts">
                            {posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onUnsave={() => handlePostRemoved(post._id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Saved;
