import React from 'react';
import Badge from './Badge';
import './UserBadges.css';

const UserBadges = ({ user, size = 18 }) => {
    if (!user) return null;
    
    const hasVerified = !!user.verificationBadge && user.verificationBadge !== 'none';
    const hasCustom = !!(user.customBadge && user.customBadge.url);

    if (!hasVerified && !hasCustom) return null;

    return (
        <span className="user-badges-container" onClick={(e) => e.stopPropagation()}>
            {hasVerified && (
                <Badge type={user.verificationBadge} size={size} />
            )}
            {hasCustom && (
                <img
                    src={user.customBadge.url}
                    alt={user.customBadge.name || 'Özel Rozet'}
                    title={user.customBadge.name || 'Özel Rozet'}
                    className="user-custom-badge"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`
                    }}
                />
            )}
        </span>
    );
};

export default UserBadges;
