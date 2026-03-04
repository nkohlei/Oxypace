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

const Badge = ({ type, size = 20, className = '' }) => {
    const { getBadge } = useBadges();
    const gradientId = useMemo(() => `bg-${type}-${++_gradientCounter}`, [type]);

    if (!type || type === 'none') return null;

    // Admin creator special types
    if (type === '_preview') return null;
    if (type.startsWith('_icon_')) {
        const iconName = type.replace('_icon_', '');
        const IconComp = ICON_MAP[iconName] || CheckCircle2;
        return (
            <span className={`verification-badge ${className}`} style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'sub', color: '#999' }}>
                <IconComp size={size} strokeWidth={2} />
            </span>
        );
    }

    const badgeDef = getBadge(type);

    if (!badgeDef) {
        // Legacy fallback
        return (
            <span className={`verification-badge ${type} ${className}`} style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'sub', color: '#1d9bf0' }} title={type}>
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

    // Solid / animated / gradient / iridescent: use Lucide with CSS styling
    const isFilled = (icon === 'checkmark' || icon === 'verified' || icon === 'shield');

    const wrapperStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'sub',
        color: primaryColor,
        '--badge-glow-color': glowColor || primaryColor + '66',
    };

    // For gradient: use a CSS background gradient with mask approach
    if (useGradient) {
        return (
            <span
                className={`verification-badge ${type} ${animClass} ${styleClass} ${className}`.trim()}
                style={{
                    ...wrapperStyle,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
                title={name || type}
            >
                <IconComp
                    size={size}
                    strokeWidth={2}
                    style={{ stroke: `url(#${gradientId})` }}
                    fill="none"
                />
                {/* Hidden SVG for gradient reference */}
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>
                    </defs>
                </svg>
            </span>
        );
    }

    return (
        <span
            className={`verification-badge ${type} ${animClass} ${styleClass} ${className}`.trim()}
            style={wrapperStyle}
            title={name || type}
        >
            <IconComp
                size={size}
                strokeWidth={2}
                fill={isFilled ? 'currentColor' : 'none'}
                stroke={isFilled ? '#fff' : 'currentColor'}
            />
        </span>
    );
};

export default Badge;
