import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import Footer from '../components/Footer';
import './Home.css';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { socket } = useSocket();

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('newPost', (post) => {
                setPosts((prevPosts) => [post, ...prevPosts]);
            });

            return () => {
                socket.off('newPost');
            };
        }
    }, [socket]);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('/api/posts');
            setPosts(response.data.posts);
        } catch (err) {
            setError('Gönderiler yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="home-feed">
                    {loading && (
                        <div className="spinner-container">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {!loading && !error && posts.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>Henüz gönderi yok</h3>
                            <p className="text-secondary">İlk gönderiyi paylaşan sen ol!</p>
                        </div>
                    )}

                    <div className="posts-feed">
                        {posts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))}
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default Home;
