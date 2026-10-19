import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import Badge from '../models/Badge.js';

const router = express.Router();

// Default badges to seed (including authentic Twitter / X verification badges)
export const DEFAULT_BADGES = [
    {
        name: 'X Mavi Onay (Twitter Blue)',
        slug: 'x-blue',
        shape: 'rosette',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#1d9bf0',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(29, 155, 240, 0.45)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'X Altın Onay (Kuruluş)',
        slug: 'x-gold',
        shape: 'rounded_square',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'gradient',
            primaryColor: '#ffd700',
            secondaryColor: '#f59e0b',
            gradientAngle: 135,
            metallicType: 'gold',
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(255, 215, 0, 0.45)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'X Gri Onay (Hükümet & Resmi)',
        slug: 'x-grey',
        shape: 'rosette',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#829aab',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(130, 154, 171, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'X Bağlı Kuruluş',
        slug: 'x-affiliate',
        shape: 'rounded_square',
        icon: 'shield',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#1d9bf0',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(29, 155, 240, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Mavi Onay',
        slug: 'blue',
        shape: 'rosette',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#1d9bf0',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: '',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Altın Onay',
        slug: 'gold',
        shape: 'rounded_square',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'gradient',
            primaryColor: '#ffd700',
            secondaryColor: '#f59e0b',
            gradientAngle: 135,
            metallicType: 'gold',
            innerIconColor: '#ffffff',
            animationType: 'glow',
            glowColor: 'rgba(255, 215, 0, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Platin Onay',
        slug: 'platinum',
        shape: 'rosette',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'metallic',
            metallicType: 'platinum',
            primaryColor: '#f1f5f9',
            secondaryColor: '#94a3b8',
            gradientAngle: 135,
            innerIconColor: '#1e293b',
            animationType: 'shimmer',
            glowColor: 'rgba(229, 228, 226, 0.3)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Özel Rozet',
        slug: 'special',
        shape: 'starburst',
        icon: 'star',
        category: 'user',
        style: {
            type: 'gradient',
            primaryColor: '#d600ad',
            secondaryColor: '#ff4081',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'pulse',
            glowColor: 'rgba(214, 0, 173, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Platform Yöneticisi',
        slug: 'staff',
        shape: 'shield',
        icon: 'shield',
        category: 'user',
        style: {
            type: 'solid',
            primaryColor: '#10b981',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: '',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Partner',
        slug: 'partner',
        shape: 'diamond',
        icon: 'diamond',
        category: 'both',
        style: {
            type: 'gradient',
            primaryColor: '#5865F2',
            secondaryColor: '#9b59b6',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'glow',
            glowColor: 'rgba(88, 101, 242, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Onaylı Portal',
        slug: 'verified',
        shape: 'rosette',
        icon: 'checkmark',
        category: 'portal',
        style: {
            type: 'solid',
            primaryColor: '#1d9bf0',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: '',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Resmi Hesap',
        slug: 'official',
        shape: 'rosette',
        icon: 'shield',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#829aab',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: '',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'VIP Lider',
        slug: 'vip',
        shape: 'octagon',
        icon: 'crown',
        category: 'both',
        style: {
            type: 'metallic',
            metallicType: 'gold',
            primaryColor: '#f59e0b',
            secondaryColor: '#ec4899',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'glow',
            glowColor: 'rgba(245, 158, 11, 0.45)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Kurucu / Pioneer',
        slug: 'founder',
        shape: 'hexagon',
        icon: 'rocket',
        category: 'both',
        style: {
            type: 'cosmic',
            primaryColor: '#06b6d4',
            secondaryColor: '#8b5cf6',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'pulse',
            glowColor: 'rgba(6, 182, 212, 0.45)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Çekirdek Geliştirici',
        slug: 'dev',
        shape: 'hexagon',
        icon: 'atom',
        category: 'both',
        style: {
            type: 'neon',
            primaryColor: '#10b981',
            secondaryColor: '#3b82f6',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'shimmer',
            glowColor: 'rgba(16, 185, 129, 0.45)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Bilim & Araştırma',
        slug: 'science',
        shape: 'circle',
        icon: 'atom',
        category: 'both',
        style: {
            type: 'gradient',
            primaryColor: '#38bdf8',
            secondaryColor: '#6366f1',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'glow',
            glowColor: 'rgba(56, 189, 248, 0.45)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'İçerik Üreticisi',
        slug: 'creator',
        shape: 'starburst',
        icon: 'sparkle',
        category: 'both',
        style: {
            type: 'gradient',
            primaryColor: '#ec4899',
            secondaryColor: '#f43f5e',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'pulse',
            glowColor: 'rgba(236, 72, 153, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
];

// @route   POST /api/badges/seed
// @desc    Seed default badges (creates missing or refreshes defaults without touching user custom badges)
// @access  Private/Admin
router.post('/seed', protect, admin, async (req, res) => {
    try {
        let created = 0;
        let updated = 0;
        for (const badge of DEFAULT_BADGES) {
            const exists = await Badge.findOne({ slug: badge.slug });
            if (!exists) {
                await Badge.create(badge);
                created++;
            } else if (exists.isDefault) {
                // Keep default badges modern and updated with shapes & styling
                exists.shape = badge.shape;
                exists.name = badge.name;
                exists.icon = badge.icon;
                exists.category = badge.category;
                exists.style = { ...exists.style?.toObject?.() || exists.style, ...badge.style };
                await exists.save();
                updated++;
            }
        }
        res.json({ message: `Varsayılan rozetler senkronize edildi: ${created} yeni eklendi, ${updated} güncellendi.`, total: DEFAULT_BADGES.length });
    } catch (error) {
        console.error('Seed badges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/badges
// @desc    Get all badge definitions
// @access  Public (needed to render badges everywhere)
router.get('/', async (req, res) => {
    try {
        const badges = await Badge.find().sort({ isDefault: -1, name: 1 });
        res.json(badges);
    } catch (error) {
        console.error('Fetch badges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/badges
// @desc    Create a new badge definition
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, slug, shape, icon, category, style } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: 'Name and slug are required.' });
        }

        // Check slug uniqueness
        const existing = await Badge.findOne({ slug: slug.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Bu slug zaten kullanımda.' });
        }

        const badge = await Badge.create({
            name,
            slug: slug.toLowerCase(),
            shape: shape || 'rosette',
            icon: icon || 'checkmark',
            category: category || 'both',
            style: style || {},
            isDefault: false,
        });

        res.status(201).json(badge);
    } catch (error) {
        console.error('Create badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/badges/:id
// @desc    Update a badge definition
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        const { name, slug, shape, icon, category, style } = req.body;

        if (name) badge.name = name;
        if (slug && slug !== badge.slug) {
            const existing = await Badge.findOne({ slug: slug.toLowerCase() });
            if (existing) {
                return res.status(400).json({ message: 'Bu slug zaten kullanımda.' });
            }
            badge.slug = slug.toLowerCase();
        }
        if (shape) badge.shape = shape;
        if (icon) badge.icon = icon;
        if (category) badge.category = category;
        if (style) badge.style = { ...badge.style?.toObject?.() || badge.style, ...style };

        await badge.save();
        res.json(badge);
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/badges/:id
// @desc    Delete a badge definition (non-default only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: 'Badge not found' });
        }

        if (badge.isDefault) {
            return res.status(403).json({ message: 'Varsayılan rozetler silinemez.' });
        }

        await Badge.findByIdAndDelete(req.params.id);
        res.json({ message: 'Badge deleted' });
    } catch (error) {
        console.error('Delete badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
