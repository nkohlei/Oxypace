import React, { useMemo } from 'react';
import {
    CheckCircle2, Star, Shield, Zap, Diamond, Crown, Flame, Heart,
    Rocket, Globe, Sparkles, Music, Award, Gem, BadgeCheck,
    Eye, Swords, Atom
} from 'lucide-react';
import { useBadges } from '../context/BadgeContext';
import './Badge.css';

// Lucide icon mapping fallback
const LUCIDE_MAP = {
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
    atom: Atom,
};

// Precise Vector Paths for inner icons (24x24 viewBox, centered at 12, 12)
const INNER_ICON_PATHS = {
    // Official Twitter / X crisp checkmark
    checkmark: 'M9.86 16.29l-3.3-3.3a1 1 0 0 1 1.41-1.41l1.89 1.89 5.3-5.3a1 1 0 0 1 1.41 1.41l-6.71 6.71z',
    verified: 'M9.86 16.29l-3.3-3.3a1 1 0 0 1 1.41-1.41l1.89 1.89 5.3-5.3a1 1 0 0 1 1.41 1.41l-6.71 6.71z',
    star: 'M12 6.5l1.65 3.35 3.7.54-2.68 2.61.63 3.69L12 14.95l-3.3 1.74.63-3.69-2.68-2.61 3.7-.54L12 6.5z',
    shield: 'M12 6L7 8.2v4.2c0 3.2 2.1 6.2 5 7 2.9-.8 5-3.8 5-7V8.2L12 6z',
    crown: 'M7 16h10l1-7-3.5 2.5L12 7l-2.5 4.5L6 9l1 7z',
    lightning: 'M13 5.5l-5 7.5h4l-1 5.5 5-7.5h-4l1-5.5z',
    fire: 'M12 5.5c.5 1.5 0 2.5-1 3.5-1 1-1.5 2-1.5 3 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.8-1-3-2-4 .5 1.5 0 2.5-1 3-.3-1.5-.2-3.5-1.5-5.5z',
    heart: 'M12 16.7l-.9-.82C7.9 13.01 5.75 11.06 5.75 8.67 5.75 6.72 7.3 5.2 9.25 5.2c1.1 0 2.16.51 2.75 1.32.59-.81 1.65-1.32 2.75-1.32 1.95 0 3.5 1.52 3.5 3.47 0 2.39-2.15 4.34-5.35 7.21l-.9.82z',
    diamond: 'M12 6L17.5 12 12 18 6.5 12 12 6z',
    rocket: 'M12 5.5c1.6 1.4 2.2 3.8 2.2 5.3l1.3 1.3-.8.8-1.1-.4c-.5.8-1.1 1.4-1.8 1.8-.7-.4-1.3-1-1.8-1.8l-1.1.4-.8-.8 1.3-1.3c0-1.5.6-3.9 2.2-5.3z',
    sparkle: 'M12 5.5l1.3 3.9 3.9 1.3-3.9 1.3L12 15.9l-1.3-3.9-3.9-1.3 3.9-1.3L12 5.5z',
    atom: 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm0-3.5c-3.6 0-6.5 2.7-6.5 6s2.9 6 6.5 6 6.5-2.7 6.5-6-2.9-6-6.5-6zm0 10.5c-2.8 0-5-2-5-4.5s2.2-4.5 5-4.5 5 2 5 4.5-2.2 4.5-5 4.5z',
    gem: 'M7.5 7.5h9l3 3.8-7.5 5.7-7.5-5.7 3-3.8z',
    award: 'M12 6a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm-2.2 8.2l-2 3.8 3.8-1.2 3.8 1.2-2-3.8',
    globe: 'M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 1.2c.9 1.2 1.5 2.9 1.6 4.8H10.4c.1-1.9.7-3.6 1.6-4.8zm-1.8.4c-.8 1.2-1.3 2.7-1.5 4.4H6.8a5.3 5.3 0 0 1 3.4-4.4zm3.6 0a5.3 5.3 0 0 1 3.4 4.4h-1.9c-.2-1.7-.7-3.2-1.5-4.4zm1.8 5.6h1.9a5.3 5.3 0 0 1-3.4 4.4c.8-1.2 1.3-2.7 1.5-4.4zm-3.6 4.4c-.9-1.2-1.5-2.9-1.6-4.4h3.2c-.1 1.5-.7 3.2-1.6 4.4zm-1.8-.4a5.3 5.3 0 0 1-3.4-4h1.9c.2 1.7.7 3.2 1.5 4z',
    music: 'M9 16.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 0V7.5l8-2V14.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0-7l8-2',
    swords: 'M7 7l10 10m0-10L7 17',
    eye: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
};

// Enterprise-Grade Verification Rosette Paths
// 10-Point Scalloped Rosette (Official X / Twitter geometry)
const ROSETTE_10_PATH = "M 12 3.2 A 2.9 2.9 0 0 1 17.173 4.881 A 2.9 2.9 0 0 1 20.369 9.281 A 2.9 2.9 0 0 1 20.369 14.719 A 2.9 2.9 0 0 1 17.173 19.119 A 2.9 2.9 0 0 1 12 20.8 A 2.9 2.9 0 0 1 6.827 19.119 A 2.9 2.9 0 0 1 3.631 14.719 A 2.9 2.9 0 0 1 3.631 9.281 A 2.9 2.9 0 0 1 6.827 4.881 A 2.9 2.9 0 0 1 12 3.2 Z";

// 12-Point Scalloped Rosette (Official Twitter Classic & Meta / Instagram geometry)
const ROSETTE_12_PATH = "M 12 2.9 A 2.5 2.5 0 0 1 16.55 4.119 A 2.5 2.5 0 0 1 19.881 7.45 A 2.5 2.5 0 0 1 21.1 12 A 2.5 2.5 0 0 1 19.881 16.55 A 2.5 2.5 0 0 1 16.55 19.881 A 2.5 2.5 0 0 1 12 21.1 A 2.5 2.5 0 0 1 7.45 19.881 A 2.5 2.5 0 0 1 4.119 16.55 A 2.5 2.5 0 0 1 2.9 12 A 2.5 2.5 0 0 1 4.119 7.45 A 2.5 2.5 0 0 1 7.45 4.119 A 2.5 2.5 0 0 1 12 2.9 Z";

// 8-Point Scalloped Rosette (X / Twitter classic vector)
const ROSETTE_8_PATH = "M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z";

// Color utility functions for dynamic material shaders
const hexToRgb = (hex) => {
    if (!hex) return { r: 255, g: 255, b: 255 };
    hex = String(hex).replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return { r: 255, g: 255, b: 255 };
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const rgbToHex = (r, g, b) => {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
};

const adjustLightness = (hex, percent) => {
    const { r, g, b } = hexToRgb(hex);
    if (percent > 0) {
        const f = percent / 100;
        return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
    } else {
        const f = 1 + (percent / 100);
        return rgbToHex(r * f, g * f, b * f);
    }
};

// Unique gradient ID generator
let _badgeGradCounter = 0;

// Resolve shape to top-tier enterprise verified shapes
const resolveShape = (shape, slug, icon) => {
    if (shape === 'rosette_10' || shape === 'rosette_12' || shape === 'rosette_8' || shape === 'rounded_square' || shape === 'icon_only') {
        return shape;
    }
    if (shape === 'rosette') return 'rosette_10';
    if (shape === 'starburst') return 'rosette_12';

    const s = String(slug || '').toLowerCase();
    if (s.includes('gold') || s === 'x-gold' || s.includes('affiliate') || s.includes('partner') || s.includes('verified')) {
        return 'rounded_square';
    }
    if (s.includes('meta') || s.includes('official') || s.includes('platinum')) {
        return 'rosette_12';
    }
    return 'rosette_10';
};

const Badge = ({ type, badge, size = 20, className = '' }) => {
    const { getBadge } = useBadges();
    const badgeDef = badge || getBadge(type);
    const gradId = useMemo(() => `badge-fx-${++_badgeGradCounter}`, []);

    // Standalone icon or shape preview helper
    if (typeof type === 'string' && type.startsWith('_icon_')) {
        const iconName = type.replace('_icon_', '');
        const IconComp = LUCIDE_MAP[iconName] || CheckCircle2;
        return (
            <span className={`verification-badge ${className}`} style={{ width: size, height: size }}>
                <IconComp size={size} strokeWidth={2} />
            </span>
        );
    }

    if (typeof type === 'string' && type.startsWith('_shape_')) {
        const shapeName = type.replace('_shape_', '');
        return (
            <Badge
                badge={{
                    name: shapeName,
                    slug: `_shape_${shapeName}`,
                    shape: shapeName,
                    icon: 'checkmark',
                    style: { type: 'solid', primaryColor: '#1d9bf0', innerIconColor: '#ffffff' }
                }}
                size={size}
                className={className}
            />
        );
    }

    if (!type && !badge) return null;
    if (type === 'none') return null;

    // Fallback if badge definition doesn't exist yet
    const resolvedBadge = badgeDef || {
        name: type,
        slug: type,
        shape: type === 'gold' ? 'rounded_square' : 'rosette_10',
        icon: 'checkmark',
        style: {
            type: 'solid',
            primaryColor: type === 'gold' ? '#ffd700' : (type === 'grey' ? '#829aab' : '#1d9bf0'),
            innerIconColor: '#ffffff'
        }
    };

    const {
        name,
        slug,
        shape: rawShape,
        icon = 'checkmark',
        style = {}
    } = resolvedBadge;

    const shape = resolveShape(rawShape, slug, icon);
    const styleType = style.type || 'solid';
    const primaryColor = style.primaryColor || '#1d9bf0';
    const secondaryColor = style.secondaryColor || primaryColor;
    const gradientAngle = style.gradientAngle ?? 135;
    const innerIconColor = style.innerIconColor || '#ffffff';
    const animationType = style.animationType || 'none';
    const glowColor = style.glowColor || '';

    // Calculate dynamic gradient coordinates based on angle
    const angleRad = ((gradientAngle - 90) * Math.PI) / 180;
    const x1 = Math.round(50 + Math.cos(angleRad + Math.PI) * 50);
    const y1 = Math.round(50 + Math.sin(angleRad + Math.PI) * 50);
    const x2 = Math.round(50 + Math.cos(angleRad) * 50);
    const y2 = Math.round(50 + Math.sin(angleRad) * 50);

    const isSolid = styleType === 'solid';
    const isGradient = !isSolid;

    // Dynamic fill attribute
    const fillAttr = isGradient ? `url(#${gradId})` : primaryColor;

    // Animation & filter CSS classes
    const animClass = animationType !== 'none' ? `badge-anim-${animationType}` : '';
    const styleClass = styleType === 'iridescent' ? 'badge-style-iridescent' : (styleType === 'neon' ? 'badge-style-neon' : '');

    const wrapperStyle = {
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        position: 'relative',
        lineHeight: 1,
        '--badge-glow-color': glowColor || (styleType === 'neon' ? primaryColor : `${primaryColor}80`),
    };

    // Render verified shape path
    const renderShapePath = () => {
        switch (shape) {
            case 'rosette_10':
            case 'rosette':
                // Official Twitter / X 10-point scalloped rosette
                return <path d={ROSETTE_10_PATH} fill={fillAttr} />;
            case 'rosette_12':
            case 'starburst':
                // Official Twitter Classic & Meta / Instagram 12-point scalloped rosette
                return <path d={ROSETTE_12_PATH} fill={fillAttr} />;
            case 'rosette_8':
                // Official Twitter 8-point scalloped rosette
                return <path d={ROSETTE_8_PATH} fill={fillAttr} />;
            case 'rounded_square':
                // Official Twitter / X Gold Verified Organizations Squircle
                return (
                    <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5.5"
                        ry="5.5"
                        fill={fillAttr}
                    />
                );
            case 'icon_only':
                return null;
            default:
                // Graceful fallback to 10-point rosette
                return <path d={ROSETTE_10_PATH} fill={fillAttr} />;
        }
    };

    // Render inner icon/symbol
    const renderInnerIcon = () => {
        if (shape === 'icon_only') {
            const IconComp = LUCIDE_MAP[icon] || CheckCircle2;
            return (
                <IconComp
                    size={size}
                    strokeWidth={2}
                    color={primaryColor}
                    fill={icon === 'checkmark' || icon === 'verified' ? primaryColor : 'none'}
                />
            );
        }

        const pathData = INNER_ICON_PATHS[icon] || INNER_ICON_PATHS.checkmark;
        return (
            <path
                d={pathData}
                fill={innerIconColor}
                stroke={innerIconColor}
                strokeWidth={icon === 'swords' || icon === 'music' ? 1.5 : 0.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        );
    };

    // Render dynamic gradient stops tailored to user colors and material shaders
    const renderGradientStops = () => {
        const base = primaryColor;
        const sec = secondaryColor || primaryColor;

        switch (styleType) {
            case 'metallic':
                // Dynamic 7-stop specular chrome reflection based on user's primary & secondary colors
                return (
                    <>
                        <stop offset="0%" stopColor={adjustLightness(base, -35)} />
                        <stop offset="18%" stopColor={adjustLightness(base, -10)} />
                        <stop offset="36%" stopColor={adjustLightness(base, 75)} />
                        <stop offset="52%" stopColor={base} />
                        <stop offset="68%" stopColor={adjustLightness(sec, 40)} />
                        <stop offset="85%" stopColor={adjustLightness(sec, -35)} />
                        <stop offset="100%" stopColor={adjustLightness(base, -20)} />
                    </>
                );

            case 'titanium':
                // Brushed titanium multi-band specular reflection
                return (
                    <>
                        <stop offset="0%" stopColor={adjustLightness(base, -50)} />
                        <stop offset="20%" stopColor={adjustLightness(base, 35)} />
                        <stop offset="38%" stopColor={adjustLightness(base, -20)} />
                        <stop offset="58%" stopColor={adjustLightness(base, 60)} />
                        <stop offset="78%" stopColor={adjustLightness(sec, -35)} />
                        <stop offset="100%" stopColor={adjustLightness(sec, 20)} />
                    </>
                );

            case 'glass':
                // Liquid glass refraction with rim specular glint
                return (
                    <>
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="25%" stopColor={adjustLightness(base, 35)} stopOpacity="0.8" />
                        <stop offset="65%" stopColor={base} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={adjustLightness(sec, -40)} stopOpacity="0.85" />
                    </>
                );

            case 'obsidian':
                // Stealth carbon & obsidian dark gloss
                return (
                    <>
                        <stop offset="0%" stopColor="#08080a" />
                        <stop offset="30%" stopColor={adjustLightness(base, -30)} />
                        <stop offset="50%" stopColor={adjustLightness(base, 45)} />
                        <stop offset="75%" stopColor="#141418" />
                        <stop offset="100%" stopColor="#020203" />
                    </>
                );

            case 'neon':
                // Intense cyber luminescence core
                return (
                    <>
                        <stop offset="0%" stopColor={base} />
                        <stop offset="45%" stopColor={adjustLightness(base, 65)} />
                        <stop offset="100%" stopColor={sec} />
                    </>
                );

            case 'cosmic':
                // Interstellar nebula deep gradient
                return (
                    <>
                        <stop offset="0%" stopColor={base} />
                        <stop offset="45%" stopColor={adjustLightness(sec, 20)} />
                        <stop offset="80%" stopColor={adjustLightness(base, -30)} />
                        <stop offset="100%" stopColor={sec} />
                    </>
                );

            case 'iridescent':
                // Multi-spectral chromatic diffraction
                return (
                    <>
                        <stop offset="0%" stopColor={base} />
                        <stop offset="25%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="75%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor={sec} />
                    </>
                );

            case 'gradient':
            default:
                // Standard 2-stop linear gradient
                return (
                    <>
                        <stop offset="0%" stopColor={base} />
                        <stop offset="100%" stopColor={sec} />
                    </>
                );
        }
    };

    return (
        <span
            className={`verification-badge badge-shape-${shape} ${animClass} ${styleClass} ${className}`.trim()}
            style={wrapperStyle}
            title={name || type}
            data-badge-slug={slug}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', overflow: 'visible' }}
            >
                <defs>
                    {/* Dynamic Shader Gradient */}
                    {isGradient && (
                        <linearGradient
                            id={gradId}
                            x1={`${x1}%`}
                            y1={`${y1}%`}
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                        >
                            {renderGradientStops()}
                        </linearGradient>
                    )}

                    {/* Specular Glint Reflection */}
                    <linearGradient id={`specular-${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                    </linearGradient>
                </defs>

                {/* Outer Shape Background */}
                {renderShapePath()}

                {/* Inner Icon / Checkmark */}
                {renderInnerIcon()}
            </svg>
        </span>
    );
};

export default Badge;
