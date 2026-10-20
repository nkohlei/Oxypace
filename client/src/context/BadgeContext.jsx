import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BadgeContext = createContext();

// Fallback badge definitions for when API is unavailable
const FALLBACK_BADGES = [
    { slug: 'x-blue', name: 'X Mavi Onay (Twitter Blue)', shape: 'rosette_10', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(29, 155, 240, 0.45)' } },
    { slug: 'x-gold', name: 'X Altın Onay (Kuruluş)', shape: 'rounded_square', icon: 'checkmark', category: 'both', style: { type: 'metallic', primaryColor: '#ffd700', secondaryColor: '#f59e0b', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(255, 215, 0, 0.45)' } },
    { slug: 'x-grey', name: 'X Gri Onay (Hükümet & Resmi)', shape: 'rosette_10', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#829aab', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(130, 154, 171, 0.4)' } },
    { slug: 'x-affiliate', name: 'X Bağlı Kuruluş', shape: 'rounded_square', icon: 'shield', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(29, 155, 240, 0.4)' } },
    { slug: 'meta-verified', name: 'Meta Onaylı Rozet', shape: 'rosette_12', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#0095f6', innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(0, 149, 246, 0.4)' } },
    { slug: 'oxypace-official', name: 'Oxypace Resmi Doğrulama', shape: 'rosette_12', icon: 'checkmark', category: 'both', style: { type: 'titanium', primaryColor: '#ffffff', secondaryColor: '#71717a', gradientAngle: 135, innerIconColor: '#000000', animationType: 'shimmer', glowColor: 'rgba(255, 255, 255, 0.4)' } },
    { slug: 'oxypace-gold', name: 'Oxypace Kurumsal Altın', shape: 'rounded_square', icon: 'checkmark', category: 'both', style: { type: 'metallic', primaryColor: '#ffd700', secondaryColor: '#b45309', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(255, 215, 0, 0.4)' } },
    { slug: 'oxypace-executive', name: 'Oxypace Yönetim & Lider', shape: 'rosette_10', icon: 'crown', category: 'both', style: { type: 'obsidian', primaryColor: '#18181b', secondaryColor: '#27272a', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(255, 255, 255, 0.15)' } },
    { slug: 'oxypace-partner', name: 'Oxypace Stratejik Partner', shape: 'rounded_square', icon: 'shield', category: 'both', style: { type: 'metallic', primaryColor: '#3b82f6', secondaryColor: '#6366f1', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(59, 130, 246, 0.4)' } },
    { slug: 'blue', name: 'Mavi Onay', shape: 'rosette_10', icon: 'checkmark', category: 'both', style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
    { slug: 'gold', name: 'Altın Onay', shape: 'rounded_square', icon: 'checkmark', category: 'both', style: { type: 'metallic', primaryColor: '#ffd700', secondaryColor: '#f59e0b', gradientAngle: 135, innerIconColor: '#ffffff', animationType: 'none', glowColor: 'rgba(255, 215, 0, 0.4)' } },
    { slug: 'platinum', name: 'Platin Onay', shape: 'rosette_12', icon: 'checkmark', category: 'both', style: { type: 'titanium', primaryColor: '#f1f5f9', secondaryColor: '#94a3b8', gradientAngle: 135, innerIconColor: '#0f172a', animationType: 'shimmer', glowColor: 'rgba(241, 245, 249, 0.3)' } },
    { slug: 'verified', name: 'Onaylı Portal', shape: 'rounded_square', icon: 'checkmark', category: 'portal', style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
    { slug: 'official', name: 'Resmi Hesap', shape: 'rosette_10', icon: 'shield', category: 'both', style: { type: 'solid', primaryColor: '#829aab', secondaryColor: '', innerIconColor: '#ffffff', animationType: 'none', glowColor: '' } },
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
