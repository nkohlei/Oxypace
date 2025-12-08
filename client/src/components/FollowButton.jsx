import { useState, useEffect } from 'react';
import axios from 'axios';
import './FollowButton.css';

const FollowButton = ({ userId, initialIsFollowing, onFollowChange }) => {
    const [following, setFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const [hover, setHover] = useState(false);

    useEffect(() => {
        setFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    const handleFollow = async () => {
        if (loading) return;

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await axios.post(`/api/follow/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFollowing(response.data.following);

            if (onFollowChange) {
                onFollowChange(response.data.following);
            }
        } catch (error) {
            console.error('Follow error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... render
    return (
        <button
            className={`follow-button ${following ? 'following' : ''}`}
            onClick={handleFollow}
            disabled={loading}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {following ? (hover ? 'Takibi Bırak' : 'Takip Ediliyor') : 'Takip Et'}
        </button>
    );
};

export default FollowButton;
