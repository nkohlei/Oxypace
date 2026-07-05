import mongoose from 'mongoose';
import Portal from '../models/Portal.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

dotenv.config();

// Cache mechanism outside the handler
let sitemapCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
    if (sitemapCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        return res.send(sitemapCache);
    }

    try {
        await connectDB();

        const baseUrl = process.env.CLIENT_URL || 'https://oxypace.com.tr';
        const now = new Date().toISOString();

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Static Pages
        const staticPages = [
            { url: '/', priority: '1.0', freq: 'daily' },
            { url: '/login', priority: '0.5', freq: 'monthly' },
            { url: '/register', priority: '0.5', freq: 'monthly' },
            { url: '/search', priority: '0.8', freq: 'daily' }
        ];

        staticPages.forEach(p => {
            xml += `<url><loc>${baseUrl}${p.url}</loc><lastmod>${now}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`;
        });

        // Portals (public only, including channels)
        let publicPortalIds = [];
        try {
            const portals = await Portal.find(
                { privacy: 'public' },
                '_id name channels updatedAt createdAt'
            ).limit(1000).sort({ updatedAt: -1 }).lean();

            if (portals) {
                publicPortalIds = portals.map(p => p._id);
                portals.forEach(p => {
                    const lastmod = (p.updatedAt || p.createdAt || new Date()).toISOString();
                    xml += `<url><loc>${baseUrl}/portal/${p._id}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`;
                    if (p.channels && p.channels.length > 0) {
                        p.channels.forEach(ch => {
                            xml += `<url><loc>${baseUrl}/portal/${p._id}?channel=${ch._id}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`;
                        });
                    }
                });
            }
        } catch (e) { console.error('Sitemap Portal Error', e); }

        // Users
        try {
            const users = await User.find(
                {},
                'username createdAt updatedAt'
            ).limit(1000).sort({ createdAt: -1 }).lean();

            if (users) users.forEach(u => {
                const lastmod = (u.updatedAt || u.createdAt || new Date()).toISOString();
                xml += `<url><loc>${baseUrl}/profile/${u.username}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
            });
        } catch (e) { console.error('Sitemap User Error', e); }

        // Posts of Public Portals
        try {
            if (publicPortalIds.length > 0) {
                const posts = await Post.find(
                    { portal: { $in: publicPortalIds }, isArchived: { $ne: true } },
                    '_id portal channel updatedAt createdAt'
                ).limit(2000).sort({ createdAt: -1 }).lean();

                if (posts) posts.forEach(p => {
                    const lastmod = (p.updatedAt || p.createdAt || new Date()).toISOString();
                    const channelId = p.channel ? (p.channel._id || p.channel) : 'general';
                    xml += `<url><loc>${baseUrl}/portal/${p.portal}?channel=${channelId}&amp;post=${p._id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.65</priority></url>`;
                });
            }
        } catch (e) { console.error('Sitemap Post Error', e); }

        xml += '</urlset>';

        sitemapCache = xml;
        lastCacheTime = Date.now();

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.send(xml);

    } catch (e) {
        console.error('Sitemap function error:', e);
        res.status(500).send('Error generating sitemap');
    }
}
