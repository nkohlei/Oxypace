import { useState } from 'react';
import axios from 'axios';
import './FollowButton.css';

const FollowButton = ({ userId, initialIsFollowing, onFollowChange }) => {
    const [following, setFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

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

            // Toggle state based on previous state or response
            // Assuming backend returns the NEW state or we toggle it locally
            // Let's check the backend response structure if possible, but standard is usually toggle
            // For now, let's rely on the response if available, or toggle.
            // The previous code used response.data.following. Let's assume that's correct but the endpoint was likely /api/users/follow/:id based on other files I've seen in previous turns (routes/users.js usually handles this).
            // Wait, previous code had /api/follow/${userId}. I need to be careful about the route.
            // Let me check routes to be sure.

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
        >
            {following ? 'Takip Ediliyor' : 'Takip Et'}
        </button>
    );
};

export default FollowButton;
