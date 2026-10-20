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
        shape: 'rosette_10',
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
            type: 'metallic',
            primaryColor: '#ffd700',
            secondaryColor: '#f59e0b',
            gradientAngle: 135,
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
        shape: 'rosette_10',
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
        name: 'Meta Onaylı Rozet',
        slug: 'meta-verified',
        shape: 'rosette_12',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#0095f6',
            secondaryColor: '',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(0, 149, 246, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Oxypace Resmi Doğrulama',
        slug: 'oxypace-official',
        shape: 'rosette_12',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'titanium',
            primaryColor: '#ffffff',
            secondaryColor: '#71717a',
            gradientAngle: 135,
            innerIconColor: '#000000',
            animationType: 'shimmer',
            glowColor: 'rgba(255, 255, 255, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Oxypace Kurumsal Altın',
        slug: 'oxypace-gold',
        shape: 'rounded_square',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'metallic',
            primaryColor: '#ffd700',
            secondaryColor: '#b45309',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(255, 215, 0, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Oxypace Yönetim & Lider',
        slug: 'oxypace-executive',
        shape: 'rosette_10',
        icon: 'crown',
        category: 'both',
        style: {
            type: 'obsidian',
            primaryColor: '#18181b',
            secondaryColor: '#27272a',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(255, 255, 255, 0.15)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Oxypace Stratejik Partner',
        slug: 'oxypace-partner',
        shape: 'rounded_square',
        icon: 'shield',
        category: 'both',
        style: {
            type: 'metallic',
            primaryColor: '#3b82f6',
            secondaryColor: '#6366f1',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(59, 130, 246, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Mavi Onay',
        slug: 'blue',
        shape: 'rosette_10',
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
            type: 'metallic',
            primaryColor: '#ffd700',
            secondaryColor: '#f59e0b',
            gradientAngle: 135,
            innerIconColor: '#ffffff',
            animationType: 'none',
            glowColor: 'rgba(255, 215, 0, 0.4)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Platin Onay',
        slug: 'platinum',
        shape: 'rosette_12',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'titanium',
            primaryColor: '#f1f5f9',
            secondaryColor: '#94a3b8',
            gradientAngle: 135,
            innerIconColor: '#0f172a',
            animationType: 'shimmer',
            glowColor: 'rgba(241, 245, 249, 0.3)',
            borderStyle: 'none',
        },
        isDefault: true,
    },
    {
        name: 'Onaylı Portal',
        slug: 'verified',
        shape: 'rounded_square',
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
        shape: 'rosette_10',
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
