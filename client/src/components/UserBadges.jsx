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
    // Optical scale: The verified rosette path occupies ~75-80% of its bounding box.
    // Scaling the custom badge frame to 0.88 ensures both badges have identical optical height.
    const customSize = Math.max(12, Math.round(size * 0.88));

    return (
        <span className="user-badges-container" onClick={(e) => e.stopPropagation()}>
            {hasVerified && (
                <Badge type={user.verificationBadge} size={size} />
            )}
            {hasCustom && (
                <span
                    className={`custom-badge-frame shape-${shape} border-${borderStyle}`}
                    style={{
                        width: `${customSize}px`,
                        height: `${customSize}px`,
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
