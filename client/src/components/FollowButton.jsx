import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './FollowButton.css';

const FollowButton = ({ userId, initialIsFollowing, initialHasRequested, onFollowChange }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [following, setFollowing] = useState(initialIsFollowing);
    const [requested, setRequested] = useState(initialHasRequested);
    const [loading, setLoading] = useState(false);

    const [hover, setHover] = useState(false);

    useEffect(() => {
        setFollowing(initialIsFollowing);
        setRequested(initialHasRequested);
    }, [initialIsFollowing, initialHasRequested]);

    const handleFollow = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (loading) return;

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await axios.post(
                `/api/users/follow/${userId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setFollowing(response.data.isFollowing);
            setRequested(response.data.hasRequested);

            if (onFollowChange) {
                onFollowChange(response.data.isFollowing);
            }
        } catch (error) {
            console.error('Follow error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived state for button class
    const isRequested = requested;
    const isFollowing = following;

    const getButtonText = () => {
        if (loading) {
            return '...';
        }
        if (isFollowing) {
            return hover ? 'Takibi Bırak' : 'Takip Ediliyor';
        }
        if (isRequested) {
            return hover ? 'İsteği İptal Et' : 'İstek Gönderildi';
        }
        return 'Takip Et';
    };

    return (
        <button
            className={`follow-button ${isFollowing ? 'following' : ''} ${isRequested ? 'requested' : ''}`}
            onClick={handleFollow}
            disabled={loading}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {getButtonText()}
        </button>
    );
};

export default FollowButton;
