import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BadgeContext = createContext();

// Fallback badge definitions for when API is unavailable
const FALLBACK_BADGES = [
    { slug: 'x-blue', name: 'X Mavi Onay (Twitter Blue)', shape: 'rosette', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(29, 155, 240, 0.45)' } },
    { slug: 'x-gold', name: 'X Altın Onay (Kuruluş)', shape: 'rounded_square', icon: 'checkmark', category: 'both', style: { type: 'gradient', primaryColor: '#ffd700', secondaryColor: '#f59e0b', gradientAngle: 135, metallicType: 'gold', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(255, 215, 0, 0.45)' } },
    { slug: 'x-grey', name: 'X Gri Onay (Hükümet & Resmi)', shape: 'rosette', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#829aab', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(130, 154, 171, 0.4)' } },
    { slug: 'x-affiliate', name: 'X Bağlı Kuruluş', shape: 'rounded_square', icon: 'shield', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(29, 155, 240, 0.4)' } },
    { slug: 'blue', name: 'Mavi Onay', shape: 'rosette', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
    { slug: 'gold', name: 'Altın Onay', shape: 'rounded_square', icon: 'checkmark', category: 'both', style: { type: 'gradient', primaryColor: '#ffd700', secondaryColor: '#ff8c00', gradientAngle: 135, metallicType: 'gold', innerIconColor: '#ffffff', animationType: 'glow', glowColor: 'rgba(255, 215, 0, 0.4)' } },
    { slug: 'platinum', name: 'Platin Onay', shape: 'rosette', icon: 'checkmark', category: 'both', style: { type: 'metallic', metallicType: 'platinum', primaryColor: '#f1f5f9', secondaryColor: '#94a3b8', gradientAngle: 135, innerIconColor: '#1e293b', animationType: 'shimmer', glowColor: 'rgba(229, 228, 226, 0.3)' } },
    { slug: 'special', name: 'Özel Rozet', shape: 'starburst', icon: 'star', category: 'user', style: { type: 'gradient', primaryColor: '#d600ad', secondaryColor: '#ff4081', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'pulse', glowColor: 'rgba(214, 0, 173, 0.4)' } },
    { slug: 'staff', name: 'Platform Yöneticisi', shape: 'shield', icon: 'shield', category: 'user', style: { type: 'solid', primaryColor: '#248046', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
    { slug: 'partner', name: 'Partner', shape: 'diamond', icon: 'diamond', category: 'both', style: { type: 'gradient', primaryColor: '#5865F2', secondaryColor: '#9b59b6', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'glow', glowColor: 'rgba(88, 101, 242, 0.4)' } },
    { slug: 'verified', name: 'Onaylı Portal', shape: 'rosette', icon: 'checkmark', category: 'portal', style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
    { slug: 'official', name: 'Resmi Hesap', shape: 'rosette', icon: 'shield', category: 'both', style: { type: 'solid', primaryColor: '#808080', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
    { slug: 'vip', name: 'VIP Lider', shape: 'octagon', icon: 'crown', category: 'both', style: { type: 'gradient', primaryColor: '#f59e0b', secondaryColor: '#ec4899', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'glow', glowColor: 'rgba(245, 158, 11, 0.45)' } },
    { slug: 'founder', name: 'Kurucu / Pioneer', shape: 'hexagon', icon: 'rocket', category: 'both', style: { type: 'gradient', primaryColor: '#06b6d4', secondaryColor: '#8b5cf6', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'pulse', glowColor: 'rgba(6, 182, 212, 0.45)' } },
    { slug: 'dev', name: 'Çekirdek Geliştirici', shape: 'hexagon', icon: 'atom', category: 'both', style: { type: 'neon', primaryColor: '#10b981', secondaryColor: '#3b82f6', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'shimmer', glowColor: 'rgba(16, 185, 129, 0.45)' } },
    { slug: 'science', name: 'Bilim & Araştırma', shape: 'circle', icon: 'atom', category: 'both', style: { type: 'gradient', primaryColor: '#38bdf8', secondaryColor: '#6366f1', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'glow', glowColor: 'rgba(56, 189, 248, 0.45)' } },
    { slug: 'creator', name: 'İçerik Üreticisi', shape: 'starburst', icon: 'sparkle', category: 'both', style: { type: 'gradient', primaryColor: '#ec4899', secondaryColor: '#f43f5e', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'pulse', glowColor: 'rgba(236, 72, 153, 0.4)' } },
];

export const BadgeProvider = ({ children }) => {
    const [badges, setBadges] = useState(FALLBACK_BADGES);
    const [badgeMap, setBadgeMap] = useState({});
    const [loaded, setLoaded] = useState(false);

    const fetchBadges = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/badges');
            if (data && data.length > 0) {
                setBadges(data);
                const map = {};
                data.forEach(b => { map[b.slug] = b; });
                setBadgeMap(map);
            } else {
                // Use fallbacks
                const map = {};
                FALLBACK_BADGES.forEach(b => { map[b.slug] = b; });
                setBadgeMap(map);
            }
        } catch (err) {
            // Silent fail — use fallbacks
            const map = {};
            FALLBACK_BADGES.forEach(b => { map[b.slug] = b; });
            setBadgeMap(map);
        } finally {
            setLoaded(true);
        }
    }, []);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    const getBadge = useCallback((slug) => {
        return badgeMap[slug] || null;
    }, [badgeMap]);

    const refreshBadges = useCallback(() => {
        fetchBadges();
    }, [fetchBadges]);

    return (
        <BadgeContext.Provider value={{ badges, badgeMap, getBadge, loaded, refreshBadges }}>
            {children}
        </BadgeContext.Provider>
    );
};

export const useBadges = () => {
    const context = useContext(BadgeContext);
    if (!context) {
        // Return fallback if not wrapped in provider
        return {
            badges: FALLBACK_BADGES,
            badgeMap: Object.fromEntries(FALLBACK_BADGES.map(b => [b.slug, b])),
            getBadge: (slug) => FALLBACK_BADGES.find(b => b.slug === slug) || null,
            loaded: true,
            refreshBadges: () => { },
        };
    }
    return context;
};

export default BadgeContext;
