import React from 'react';
import Badge from './Badge';
import { getImageUrl } from '../utils/imageUtils';
import './PortalBadges.css';

const PortalBadges = ({ portal, size = 18 }) => {
    if (!portal) return null;

    const systemBadge = portal.isVerified
        ? 'verified'
        : (portal.badges && portal.badges.length > 0 && portal.badges[0] !== 'none'
            ? portal.badges[0]
            : null);

    const hasCustom = Boolean(portal.customBadge && portal.customBadge.url);

    if (!systemBadge && !hasCustom) return null;

    const shape = portal.customBadge?.shape || 'round';
    const borderStyle = portal.customBadge?.borderStyle || 'thin';

    return (
        <span className="portal-badges-container" onClick={(e) => e.stopPropagation()}>
            {systemBadge && (
                <Badge type={systemBadge} size={size} />
            )}
            {hasCustom && (
                <span
                    className={`custom-badge-frame shape-${shape} border-${borderStyle}`}
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                    }}
                    title={portal.customBadge.name || 'Özel Portal Rozeti'}
                >
                    <img
                        src={getImageUrl(portal.customBadge.url)}
                        alt={portal.customBadge.name || 'Özel Portal Rozeti'}
                        className="custom-badge-icon"
                    />
                </span>
            )}
        </span>
    );
};

export default PortalBadges;
