import React, { useMemo } from 'react';
import {
    Check, CheckCircle2, Star, Shield, Zap, Diamond, Crown, Flame, Heart,
    Rocket, Globe, Sparkles, Music, Award, Gem, BadgeCheck, Verified,
    Eye, Swords, Hexagon, Triangle, Atom
} from 'lucide-react';
import { useBadges } from '../context/BadgeContext';
import './Badge.css';

// Map icon names → Lucide components
const ICON_MAP = {
    checkmark: CheckCircle2,
    star: Star,
    shield: Shield,
    lightning: Zap,
    diamond: Diamond,
    crown: Crown,
    fire: Flame,
    heart: Heart,
    rocket: Rocket,
    globe: Globe,
    sparkle: Sparkles,
    music: Music,
    award: Award,
    gem: Gem,
    verified: BadgeCheck,
    eye: Eye,
    swords: Swords,
    hexagon: Hexagon,
    triangle: Triangle,
    atom: Atom,
};

// Stable counter for gradient IDs
let _gradientCounter = 0;

const Badge = ({ type, badge, size = 20, className = '' }) => {
    const { getBadge } = useBadges();
    const cleanType = String(type || badge?.slug || 'badge').replace(/[^a-zA-Z0-9_-]/g, '');
    const gradientId = useMemo(() => `badge-grad-${cleanType}-${++_gradientCounter}`, [cleanType]);

    if ((!type && !badge) || type === 'none') return null;

    // Admin creator special types
    if (type === '_preview' && !badge) return null;
    if (typeof type === 'string' && type.startsWith('_icon_')) {
        const iconName = type.replace('_icon_', '');
        const IconComp = ICON_MAP[iconName] || CheckCircle2;
        return (
            <span
                className={`verification-badge ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    verticalAlign: 'middle',
                    color: '#999',
                    background: 'transparent',
                }}
            >
                <IconComp size={size} strokeWidth={2} />
            </span>
        );
    }

    const badgeDef = badge || getBadge(type);

    if (!badgeDef) {
        // Legacy fallback
        return (
            <span
                className={`verification-badge ${type} ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    verticalAlign: 'middle',
                    color: '#1d9bf0',
                    background: 'transparent',
                }}
                title={type}
            >
                <CheckCircle2 size={size} strokeWidth={2.2} fill="currentColor" stroke="#fff" />
            </span>
        );
    }

    const { icon, style, name } = badgeDef;
    const IconComp = ICON_MAP[icon] || CheckCircle2;
    const styleType = style?.type || 'solid';
    const primaryColor = style?.primaryColor || '#1d9bf0';
    const secondaryColor = style?.secondaryColor || primaryColor;
    const animationType = style?.animationType || 'none';
    const glowColor = style?.glowColor || '';

    const animClass = animationType !== 'none' ? `badge-anim-${animationType}` : '';
    const styleClass = styleType === 'iridescent' ? 'badge-style-iridescent' : '';
    const useGradient = styleType === 'gradient' || styleType === 'iridescent';

    // Filled icons: checkmark, verified, shield
    const isFilled = (icon === 'checkmark' || icon === 'verified' || icon === 'shield');

    const wrapperStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        color: primaryColor,
        background: 'transparent',
        lineHeight: 1,
        '--badge-glow-color': glowColor || `${primaryColor}66`,
    };

    if (useGradient) {
        return (
            <span
                className={`verification-badge ${type || ''} ${animClass} ${styleClass} ${className}`.trim()}
                style={wrapperStyle}
                title={name || type}
            >
                <svg
                    width="0"
                    height="0"
                    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>
                    </defs>
                </svg>
                <IconComp
                    size={size}
                    strokeWidth={2}
                    stroke={isFilled ? '#ffffff' : `url(#${gradientId})`}
                    fill={isFilled ? `url(#${gradientId})` : 'none'}
                />
            </span>
        );
    }

    return (
        <span
            className={`verification-badge ${type || ''} ${animClass} ${styleClass} ${className}`.trim()}
            style={wrapperStyle}
            title={name || type}
        >
            <IconComp
                size={size}
                strokeWidth={2}
                fill={isFilled ? 'currentColor' : 'none'}
                stroke={isFilled ? '#ffffff' : 'currentColor'}
            />
        </span>
    );
};

export default Badge;
