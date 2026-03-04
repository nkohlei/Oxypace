import React from 'react';
import { useBadges } from '../context/BadgeContext';
import './Badge.css';

// SVG icon paths for each badge shape
const ICON_PATHS = {
    checkmark: {
        // Cloud/flower badge shape with checkmark inside
        outer: 'M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z',
        inner: 'M9.64 15.166l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z',
        check: 'M9.5 16.5l-3.5-3.5 1.06-1.06L9.5 14.38l7.44-7.44L18 8l-8.5 8.5z',
        viewBox: '0 0 24 24',
    },
    star: {
        outer: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        viewBox: '0 0 24 24',
    },
    shield: {
        outer: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        check: 'M9.5 15.5l-3-3 1.06-1.06L9.5 13.38l5.44-5.44L16 9l-6.5 6.5z',
        viewBox: '0 0 24 24',
    },
    lightning: {
        outer: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
        viewBox: '0 0 24 24',
    },
    diamond: {
        outer: 'M12 2L2 9l10 13L22 9 12 2zm0 2.5L19 9l-7 9.2L5 9l7-4.5z',
        filled: 'M12 2L2 9l10 13L22 9 12 2z',
        viewBox: '0 0 24 24',
    },
    crown: {
        outer: 'M2 17l2-9 4 4 4-8 4 8 4-4 2 9H2zm3-1h14l-1.2-5.4L15 14l-3-6-3 6-2.8-3.4L5 16z',
        filled: 'M2 17l2-9 4 4 4-8 4 8 4-4 2 9H2z',
        viewBox: '0 0 24 24',
    },
    fire: {
        outer: 'M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.13-5.8 4-7.57V6c0-.55.22-1.08.62-1.45C9.24 3.05 11.2 2 12 2c.8 0 2.76 1.05 4.38 2.55.4.37.62.9.62 1.45v1.43C18.87 9.2 21 11.93 21 15c0 4.42-4.03 8-9 8zm0-19c-.5.3-1.76 1.2-2.76 2.15-.18.17-.24.38-.24.6v2.58l-.64.52C6.87 11.13 5 13.4 5 15c0 3.31 3.13 6 7 6s7-2.69 7-6c0-1.6-1.87-3.87-3.36-5.15l-.64-.52V6.75c0-.22-.06-.43-.24-.6C13.76 5.2 12.5 4.3 12 4z',
        filled: 'M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.13-5.8 4-7.57V6c0-.55.22-1.08.62-1.45C9.24 3.05 11.2 2 12 2c.8 0 2.76 1.05 4.38 2.55.4.37.62.9.62 1.45v1.43C18.87 9.2 21 11.93 21 15c0 4.42-4.03 8-9 8z',
        viewBox: '0 0 24 24',
    },
    heart: {
        outer: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        viewBox: '0 0 24 24',
    },
};

const Badge = ({ type, size = 20, className = '' }) => {
    const { getBadge } = useBadges();

    if (!type || type === 'none') return null;

    // Look up badge definition
    const badgeDef = getBadge(type);

    // Handle special admin creator preview types
    if (type === '_preview') return null;

    // Icon picker preview: _icon_checkmark, _icon_star, etc.
    if (type.startsWith('_icon_')) {
        const iconName = type.replace('_icon_', '');
        const iconData = ICON_PATHS[iconName] || ICON_PATHS.checkmark;
        return (
            <span className={`verification-badge ${className}`} style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'sub', color: '#888' }}>
                <svg width={size} height={size} viewBox={iconData.viewBox} fill="currentColor">
                    {iconData.filled ? <path d={iconData.filled} /> : <path d={iconData.outer} />}
                </svg>
            </span>
        );
    }

    if (!badgeDef) {
        // Legacy fallback — render blue checkmark
        return (
            <span
                className={`verification-badge ${type} ${className}`}
                style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'sub', color: '#1d9bf0' }}
                title={type.charAt(0).toUpperCase() + type.slice(1) + ' Badge'}
            >
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d={ICON_PATHS.checkmark.outer} />
                </svg>
            </span>
        );
    }

    const { icon, style, name } = badgeDef;
    const iconData = ICON_PATHS[icon] || ICON_PATHS.checkmark;
    const styleType = style?.type || 'solid';
    const primaryColor = style?.primaryColor || '#1d9bf0';
    const secondaryColor = style?.secondaryColor || primaryColor;
    const animationType = style?.animationType || 'none';
    const glowColor = style?.glowColor || '';

    // Build CSS class list
    const animClass = animationType !== 'none' ? `badge-anim-${animationType}` : '';
    const styleClass = styleType === 'iridescent' ? 'badge-style-iridescent' : '';

    // Unique gradient ID
    const gradientId = `badge-grad-${type}-${Math.random().toString(36).substr(2, 6)}`;

    // Determine fill
    const useGradient = styleType === 'gradient' || styleType === 'iridescent';
    const fillValue = useGradient ? `url(#${gradientId})` : primaryColor;

    // Check icon rendering
    const renderIcon = () => {
        if (icon === 'checkmark') {
            // Outer shape filled, inner checkmark white
            return (
                <>
                    <path d={iconData.outer} fill={fillValue} />
                    {iconData.check && (
                        <path d={iconData.check} fill="#fff" />
                    )}
                </>
            );
        }

        if (icon === 'shield') {
            return (
                <>
                    <path d={iconData.outer} fill={fillValue} />
                    {iconData.check && (
                        <path d={iconData.check} fill="#fff" />
                    )}
                </>
            );
        }

        // For filled icons (diamond, crown, fire)
        if (iconData.filled) {
            return <path d={iconData.filled} fill={fillValue} />;
        }

        // Default: use outer path
        return <path d={iconData.outer} fill={fillValue} />;
    };

    return (
        <span
            className={`verification-badge ${type} ${animClass} ${styleClass} ${className}`.trim()}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'sub',
                '--badge-glow-color': glowColor || primaryColor + '66',
            }}
            title={name || type}
        >
            <svg width={size} height={size} viewBox={iconData.viewBox} fill="none">
                {useGradient && (
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>
                    </defs>
                )}
                {renderIcon()}
            </svg>
        </span>
    );
};

export default Badge;
