import React from 'react';
import Badge from './Badge';
import { getImageUrl } from '../utils/imageUtils';
import './PortalBadges.css';

const PortalBadges = ({ portal, size = 18 }) => {
    if (!portal) return null;

    // Badges list from portal
    const rawBadges = Array.isArray(portal.badges)
        ? portal.badges.filter(b => b && typeof b === 'string' && b !== 'none')
        : (typeof portal.badges === 'string' && portal.badges !== 'none' ? [portal.badges] : []);

    // Fallback: If badges array is empty, but isVerified is true, use 'verified'
    const systemBadges = rawBadges.length > 0
        ? rawBadges
        : (portal.isVerified ? ['verified'] : []);

    const hasCustom = Boolean(portal.customBadge && portal.customBadge.url);

    if (systemBadges.length === 0 && !hasCustom) return null;

    const shape = portal.customBadge?.shape || 'round';
    const borderStyle = portal.customBadge?.borderStyle || 'thin';
    const customSize = Math.max(12, Math.round(size * 0.88));

    return (
        <span className="portal-badges-container" onClick={(e) => e.stopPropagation()}>
            {systemBadges.map((slug, idx) => (
                <Badge key={`${slug}-${idx}`} type={slug} size={size} />
            ))}
            {hasCustom && (
                <span
                    className={`custom-badge-frame shape-${shape} border-${borderStyle}`}
                    style={{
                        width: `${customSize}px`,
                        height: `${customSize}px`,
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

