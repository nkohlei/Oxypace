import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import Badge from '../models/Badge.js';

const router = express.Router();

// Default badges to seed
const DEFAULT_BADGES = [
    {
        name: 'Mavi Onay',
        slug: 'blue',
        icon: 'checkmark',
        category: 'both',
        style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', animationType: 'none', glowColor: '', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Altın Onay',
        slug: 'gold',
        icon: 'checkmark',
        category: 'both',
        style: { type: 'gradient', primaryColor: '#ffd700', secondaryColor: '#ff8c00', animationType: 'glow', glowColor: 'rgba(255, 215, 0, 0.4)', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Platin Onay',
        slug: 'platinum',
        icon: 'checkmark',
        category: 'both',
        style: { type: 'iridescent', primaryColor: '#e5e4e2', secondaryColor: '#c0c0c0', animationType: 'shimmer', glowColor: 'rgba(229, 228, 226, 0.3)', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Özel Rozet',
        slug: 'special',
        icon: 'star',
        category: 'user',
        style: { type: 'gradient', primaryColor: '#d600ad', secondaryColor: '#ff4081', animationType: 'pulse', glowColor: 'rgba(214, 0, 173, 0.4)', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Platform Yöneticisi',
        slug: 'staff',
        icon: 'shield',
        category: 'user',
        style: { type: 'solid', primaryColor: '#248046', secondaryColor: '', animationType: 'none', glowColor: '', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Partner',
        slug: 'partner',
        icon: 'diamond',
        category: 'both',
        style: { type: 'gradient', primaryColor: '#5865F2', secondaryColor: '#9b59b6', animationType: 'glow', glowColor: 'rgba(88, 101, 242, 0.4)', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Onaylı Portal',
        slug: 'verified',
        icon: 'checkmark',
        category: 'portal',
        style: { type: 'solid', primaryColor: '#1d9bf0', secondaryColor: '', animationType: 'none', glowColor: '', borderStyle: 'none' },
        isDefault: true,
    },
    {
        name: 'Resmi Hesap',
        slug: 'official',
        icon: 'shield',
        category: 'both',
        style: { type: 'solid', primaryColor: '#808080', secondaryColor: '', animationType: 'none', glowColor: '', borderStyle: 'none' },
        isDefault: true,
    },
];

// @route   GET /api/badges/seed
// @desc    Seed default badges (run once)
// @access  Private/Admin
router.post('/seed', protect, admin, async (req, res) => {
    try {
        let created = 0;
        for (const badge of DEFAULT_BADGES) {
            const exists = await Badge.findOne({ slug: badge.slug });
            if (!exists) {
                await Badge.create(badge);
                created++;
            }
        }
        res.json({ message: `Seeded ${created} default badges.`, total: DEFAULT_BADGES.length });
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
        const badges = await Badge.find().sort({ isDefault: -1, createdAt: 1 });
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
        const { name, slug, icon, category, style } = req.body;

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

        const { name, slug, icon, category, style } = req.body;

        if (name) badge.name = name;
        if (slug && slug !== badge.slug) {
            const existing = await Badge.findOne({ slug: slug.toLowerCase() });
            if (existing) {
                return res.status(400).json({ message: 'Bu slug zaten kullanımda.' });
            }
            badge.slug = slug.toLowerCase();
        }
        if (icon) badge.icon = icon;
        if (category) badge.category = category;
        if (style) badge.style = { ...badge.style.toObject?.() || badge.style, ...style };

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
