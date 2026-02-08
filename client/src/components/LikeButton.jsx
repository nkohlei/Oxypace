import { useState } from 'react';
import axios from 'axios';
import './LikeButton.css';

const LikeButton = ({ type, id, initialLiked, initialCount }) => {
    const [liked, setLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    const handleLike = async () => {
        if (loading) return;

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const endpoint = type === 'post' ? `/api/likes/post/${id}` : `/api/likes/comment/${id}`;

            const response = await axios.post(
                endpoint,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('Like error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`like-button ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={loading}
        >
            <svg
                className="heart-icon"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="like-count">{likeCount}</span>
        </button>
    );
};

export default LikeButton;
