import mongoose from 'mongoose';
import Portal from '../models/Portal.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

dotenv.config();

// Cache mechanism outside the handler (preserved across invocations if container is reused)
let sitemapCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
    if (sitemapCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        res.setHeader('Content-Type', 'application/xml');
        return res.send(sitemapCache);
    }

    try {
        await connectDB();

        const baseUrl = 'https://oxypace.vercel.app';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Static Pages
        const staticPages = [
            { url: '/', priority: '1.0', freq: 'daily' },
            { url: '/login', priority: '0.5', freq: 'monthly' },
            { url: '/register', priority: '0.5', freq: 'monthly' },
            { url: '/search', priority: '0.8', freq: 'weekly' }
        ];

        staticPages.forEach(p => {
            xml += `<url><loc>${baseUrl}${p.url}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`;
        });

        // Portals
        try {
            const portals = await Portal.find({ privacy: 'public' }, '_id updatedAt').limit(500).sort({ createdAt: -1 }).lean();
            if (portals) portals.forEach(p => {
                xml += `<url><loc>${baseUrl}/portal/${p._id}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;
            });
        } catch (e) { console.error('Sitemap Portal Error', e); }

        // Users
        try {
            const users = await User.find({}, 'username createdAt').limit(500).sort({ createdAt: -1 }).lean();
            if (users) users.forEach(u => {
                xml += `<url><loc>${baseUrl}/profile/${u.username}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
            });
        } catch (e) { console.error('Sitemap User Error', e); }

        xml += '</urlset>';

        sitemapCache = xml;
        lastCacheTime = Date.now();

        res.setHeader('Content-Type', 'application/xml');
        res.send(xml);

    } catch (e) {
        console.error('Sitemap function error:', e);
        res.status(500).send('Error generating sitemap');
    }
}
