import React from 'react';
import Badge from './Badge';
import { getImageUrl } from '../utils/imageUtils';
import './UserBadges.css';

const UserBadges = ({ user, size = 18 }) => {
    if (!user) return null;
    
    const hasVerified = !!user.verificationBadge && user.verificationBadge !== 'none';
    const hasCustom = !!(user.customBadge && user.customBadge.url);

    if (!hasVerified && !hasCustom) return null;

    const shape = user.customBadge?.shape || 'round';
    const borderStyle = user.customBadge?.borderStyle || 'thin';

    return (
        <span className="user-badges-container" onClick={(e) => e.stopPropagation()}>
            {hasVerified && (
                <Badge type={user.verificationBadge} size={size} />
            )}
            {hasCustom && (
                <span
                    className={`custom-badge-frame shape-${shape} border-${borderStyle}`}
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                    }}
                    title={user.customBadge.name || 'Özel Rozet'}
                >
                    <img
                        src={getImageUrl(user.customBadge.url)}
                        alt={user.customBadge.name || 'Özel Rozet'}
                        className="custom-badge-icon"
                    />
                </span>
            )}
        </span>
    );
};

export default UserBadges;
