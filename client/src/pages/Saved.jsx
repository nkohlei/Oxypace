import { useState, useEffect, Fragment, useCallback } from 'react';
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
            setPosts(response.data.filter((post) => post !== null).reverse());
        } catch (error) {
            console.error('Failed to fetch saved posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostRemoved = useCallback((postId) => {
        setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    }, [setPosts]);

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="saved-container">
                    <div className="saved-header">
                        <button className="saved-back-btn" onClick={() => navigate(-1)}>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                width="24"
                                height="24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
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
                            {posts.map((post, index) => (
                                <Fragment key={post._id}>
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onUnsave={handlePostRemoved}
                                />
                                    {index < posts.length - 1 && <div className="post-separator" />}
                                </Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Saved;
