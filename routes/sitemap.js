import express from 'express';
import Portal from '../models/Portal.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
    // Set XML header
    res.header('Content-Type', 'application/xml');

    try {
        const baseUrl = 'https://oxypace.vercel.app';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // 1. Static Pages
        const staticPages = [
            { url: '/', priority: '1.0', freq: 'daily' },
            { url: '/login', priority: '0.5', freq: 'monthly' },
            { url: '/register', priority: '0.5', freq: 'monthly' },
            { url: '/search', priority: '0.8', freq: 'weekly' }
        ];

        staticPages.forEach(page => {
            xml += `<url><loc>${baseUrl}${page.url}</loc><changefreq>${page.freq}</changefreq><priority>${page.priority}</priority></url>`;
        });

        // 2. Portals (Limit 500)
        try {
            const portals = await Portal.find({ privacy: 'public' }, '_id updatedAt').limit(500).sort({ createdAt: -1 }).lean();
            if (portals) {
                portals.forEach(portal => {
                    xml += `<url><loc>${baseUrl}/portal/${portal._id}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;
                });
            }
        } catch (err) {
            console.error('Error fetching portals for sitemap:', err);
        }

        // 3. Profiles (Limit 500)
        try {
            const users = await User.find({}, 'username createdAt').limit(500).sort({ createdAt: -1 }).lean();
            if (users) {
                users.forEach(user => {
                    xml += `<url><loc>${baseUrl}/profile/${user.username}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
                });
            }
        } catch (err) {
            console.error('Error fetching users for sitemap:', err);
        }

        xml += '</urlset>';

        res.send(xml);
    } catch (e) {
        console.error('Critical sitemap error:', e);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
