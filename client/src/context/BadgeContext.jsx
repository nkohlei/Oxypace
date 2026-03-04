import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BadgeContext = createContext();

// Fallback badge definitions for when API is unavailable
const FALLBACK_BADGES = [
    { slug: 'blue', name: 'Mavi Onay', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', animationType: 'none', glowColor: '' } },
    { slug: 'gold', name: 'Altın Onay', icon: 'checkmark', category: 'both', style: { type: 'gradient', primaryColor: '#ffd700', secondaryColor: '#ff8c00', animationType: 'glow', glowColor: 'rgba(255, 215, 0, 0.4)' } },
    { slug: 'platinum', name: 'Platin Onay', icon: 'checkmark', category: 'both', style: { type: 'iridescent', primaryColor: '#e5e4e2', secondaryColor: '#c0c0c0', animationType: 'shimmer', glowColor: 'rgba(229, 228, 226, 0.3)' } },
    { slug: 'special', name: 'Özel Rozet', icon: 'star', category: 'user', style: { type: 'gradient', primaryColor: '#d600ad', secondaryColor: '#ff4081', animationType: 'pulse', glowColor: 'rgba(214, 0, 173, 0.4)' } },
    { slug: 'staff', name: 'Platform Yöneticisi', icon: 'shield', category: 'user', style: { type: 'solid', primaryColor: '#248046', secondaryColor: '', animationType: 'none', glowColor: '' } },
    { slug: 'partner', name: 'Partner', icon: 'diamond', category: 'both', style: { type: 'gradient', primaryColor: '#5865F2', secondaryColor: '#9b59b6', animationType: 'glow', glowColor: 'rgba(88, 101, 242, 0.4)' } },
    { slug: 'verified', name: 'Onaylı Portal', icon: 'checkmark', category: 'portal', style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', animationType: 'none', glowColor: '' } },
    { slug: 'official', name: 'Resmi Hesap', icon: 'shield', category: 'both', style: { type: 'solid', primaryColor: '#808080', secondaryColor: '', animationType: 'none', glowColor: '' } },
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
