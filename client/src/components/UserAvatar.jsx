import React from 'react';
import { getImageUrl } from '../utils/imageUtils';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const UserAvatar = ({ src, alt, className = '', style = {}, size, onClick, onError }) => {
    const handleImageError = (e) => {
        e.target.src = DEFAULT_AVATAR;
        if (onError) {
            onError(e);
        }
    };

    const combinedStyle = {
        borderRadius: '50%',
        objectFit: 'cover',
        border: 'none',
        outline: 'none',
        display: 'block',
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        ...style
    };

    if (size) {
        combinedStyle.width = typeof size === 'number' ? `${size}px` : size;
        combinedStyle.height = typeof size === 'number' ? `${size}px` : size;
    }

    const resolvedSrc = src ? (src.startsWith('data:') ? src : getImageUrl(src)) : DEFAULT_AVATAR;

    return (
        <img
            src={resolvedSrc}
            onError={handleImageError}
            alt={alt || "Avatar"}
            className={`global-user-avatar ${className}`}
            style={combinedStyle}
            onClick={onClick}
        />
    );
};

export default UserAvatar;
export { DEFAULT_AVATAR };
