import React, { useMemo } from 'react';
import { useBadges } from '../context/BadgeContext';
import './Badge.css';

// ————————————————————————————————————————————
// Modern SVG icon paths — each icon gets a filled path
// ————————————————————————————————————————————
const ICON_PATHS = {
    checkmark: {
        outer: 'M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z',
        check: 'M9.5 16.5l-3.5-3.5 1.06-1.06L9.5 14.38l7.44-7.44L18 8l-8.5 8.5z',
        viewBox: '0 0 24 24',
    },
    star: {
        filled: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        viewBox: '0 0 24 24',
    },
    shield: {
        outer: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        check: 'M9.5 15.5l-3-3 1.06-1.06L9.5 13.38l5.44-5.44L16 9l-6.5 6.5z',
        viewBox: '0 0 24 24',
    },
    lightning: {
        filled: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
        viewBox: '0 0 24 24',
    },
    diamond: {
        filled: 'M12 2L2 9l10 13L22 9 12 2z',
        viewBox: '0 0 24 24',
    },
    crown: {
        filled: 'M2 17l2-9 4 4 4-8 4 8 4-4 2 9H2z',
        viewBox: '0 0 24 24',
    },
    fire: {
        filled: 'M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.13-5.8 4-7.57V6c0-.55.22-1.08.62-1.45C9.24 3.05 11.2 2 12 2c.8 0 2.76 1.05 4.38 2.55.4.37.62.9.62 1.45v1.43C18.87 9.2 21 11.93 21 15c0 4.42-4.03 8-9 8z',
        viewBox: '0 0 24 24',
    },
    heart: {
        filled: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        viewBox: '0 0 24 24',
    },
    rocket: {
        filled: 'M12 2C8 2 4 6 4 10c0 2 1 4 2 6l6 6 6-6c1-2 2-4 2-6 0-4-4-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z',
        viewBox: '0 0 24 24',
    },
    globe: {
        filled: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
        viewBox: '0 0 24 24',
    },
    sparkle: {
        filled: 'M12 1l2.88 8.62L24 12l-9.12 2.38L12 23l-2.88-8.62L0 12l9.12-2.38L12 1z',
        viewBox: '0 0 24 24',
    },
    music: {
        filled: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
        viewBox: '0 0 24 24',
    },
    award: {
        filled: 'M12 2a7 7 0 00-4.28 12.54L6 22l6-3 6 3-1.72-7.46A7 7 0 0012 2zm0 12a5 5 0 110-10 5 5 0 010 10z',
        viewBox: '0 0 24 24',
    },
    gem: {
        filled: 'M6 3l-6 8 12 13L24 11l-6-8H6zm1.5 1h9l4.5 6-9 10-9-10 4.5-6z',
        viewBox: '0 0 24 24',
    },
};

// Stable counter for gradient IDs (avoids Math.random on every render)
let _gradientCounter = 0;

const Badge = ({ type, size = 20, className = '' }) => {
    const { getBadge } = useBadges();

    // Stable gradient ID — memoized per badge instance
    const gradientId = useMemo(() => `bg-${type}-${++_gradientCounter}`, [type]);

    if (!type || type === 'none') return null;

    // Handle admin creator special types
    if (type === '_preview') return null;
    if (type.startsWith('_icon_')) {
        const iconName = type.replace('_icon_', '');
        const iconData = ICON_PATHS[iconName] || ICON_PATHS.checkmark;
        const pathD = iconData.filled || iconData.outer;
        return (
            <span className={`verification-badge ${className}`} style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'sub', color: '#999' }}>
                <svg width={size} height={size} viewBox={iconData.viewBox} fill="currentColor">
                    <path d={pathD} />
                </svg>
            </span>
        );
    }

    // Look up badge definition
    const badgeDef = getBadge(type);

    if (!badgeDef) {
        // Legacy fallback — plain solid-color checkmark
        return (
            <span className={`verification-badge ${type} ${className}`} style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'sub', color: '#1d9bf0' }} title={type}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d={ICON_PATHS.checkmark.outer} />
                    <path d={ICON_PATHS.checkmark.check} fill="#fff" />
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

    const animClass = animationType !== 'none' ? `badge-anim-${animationType}` : '';
    const styleClass = styleType === 'iridescent' ? 'badge-style-iridescent' : '';
    const useGradient = styleType === 'gradient' || styleType === 'iridescent';
    const fillValue = useGradient ? `url(#${gradientId})` : primaryColor;

    // Render the icon SVG paths
    const renderIcon = () => {
        // For checkmark & shield: filled background + white inner check
        if ((icon === 'checkmark' || icon === 'shield') && iconData.check) {
            return (
                <>
                    <path d={iconData.outer || iconData.filled} fill={fillValue} />
                    <path d={iconData.check} fill="#fff" />
                </>
            );
        }
        // All other icons: single filled path
        return <path d={iconData.filled || iconData.outer} fill={fillValue} />;
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
