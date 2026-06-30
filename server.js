import 'dotenv/config';
import express from 'express'; // v2.7 - Added Visual Channels
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { configurePassport } from './config/passport.js';
import { initializeSocket } from './sockets/index.js';
import { setupRedisAdapter } from './sockets/redisAdapter.js';
import { setupChangeStreams } from './services/realtimeChangeStream.js';
import cron from 'node-cron';
import axios from 'axios';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import likesRoutes from './routes/likes.js';
import commentsRoutes from './routes/comments.js';
import followRoutes from './routes/follow.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import portalRoutes from './routes/portals.js';
import mediaRoutes from './routes/media.js';
import badgeRoutes from './routes/badges.js';
import voiceRoutes from './routes/voice.js';
import translateRoutes from './routes/translate.js';
import previewRoutes from './routes/preview.js';
import reportRoutes from './routes/reports.js';
import ogRoutes from './routes/og.js';
import { initFirebase } from './utils/firebase.js';

// Initialize Firebase Admin SDK for FCM push notifications
initFirebase();
// Models for Sitemap
import Portal from './models/Portal.js';
import User from './models/User.js';

// Security middleware imports
import helmetConfig from './middleware/helmet-config.js';
import { generalLimiter } from './middleware/rate-limit.js';
import mongoSanitize from 'express-mongo-sanitize';
import { checkMaintenance } from './middleware/maintenance.js';
import { banCheckMiddleware } from './middleware/banCheck.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (already handled at top of file via import 'dotenv/config')
console.log('🔍 Checking Environment Variables...');
console.log('Available Env Keys:', Object.keys(process.env).join(', '));
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Not Defined');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Defined' : 'Not Defined');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Defined' : 'Not Defined');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Defined' : 'Not Defined');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
    console.error('❌ CRITICAL ERROR: MongoDB URI is missing. Session storage will fail.');
}

// Initialize Express app
const app = express();
app.use(compression());
// Enable proxy trust for Vercel/Heroku (fixes HTTP/HTTPS redirect loop)
app.set('trust proxy', 1);

const httpServer = createServer(app);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://oxypace.vercel.app',
    'https://oxypace.netlify.app',
    'https://oxypace.com.tr',
    'https://www.oxypace.com.tr',
    process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.netlify.app') ||
            origin.includes('localhost') ||
            /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)
        ) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
};

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 25000,
});
global.io = io;

// Push Trigger: efee3de
app.set('io', io);

// Connect to MongoDB
// Middleware (Database Connection)
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.includes('sitemap.xml')) {
        try {
            await connectDB();
        } catch (error) {
            console.error('DB Connection Error in Middleware:', error);
            // Don't block sitemap on DB error if possible, but we need DB for sitemap
            if (req.path.includes('sitemap.xml')) {
                console.error('Sitemap DB connection failed');
            } else {
                return res.status(500).json({ message: 'Database Connection Error' });
            }
        }
    }
    next();
});

// Middleware

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
// Only create directory if NOT in a serverless/read-only environment
const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isServerless && !fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created uploads directory');
    } catch (err) {
        console.warn('Could not create uploads directory (likely read-only fs):', err.message);
    }
}

// Configure Passport
configurePassport();

// Import Bot
import startBotLoop from './bots/newsBot.js';

import cookieParser from 'cookie-parser';

// ... (existing imports)

// Middleware
app.use(helmetConfig); // Security headers
app.use(cors(corsOptions));
app.use(mongoSanitize()); // Prevent NoSQL injection
// Rate limiting only for /api routes, NOT sitemap
app.use('/api', (req, res, next) => {
    if (req.path.includes('sitemap.xml')) return next();
    return generalLimiter(req, res, next);
});

app.use(express.json({ limit: '100mb' })); // Increased limit for large metadata
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser()); // Add cookie-parser middleware
app.use('/api', banCheckMiddleware); // Global IP and Account Ban check middleware
app.use('/api', checkMaintenance); // Global maintenance mode check for all API routes

if (!process.env.JWT_SECRET) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is missing.');
    process.exit(1);
}

// Session middleware (required for Passport)
const isProduction = process.env.NODE_ENV === 'production';
app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: mongoUri,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60, // 1 day
        }),
        proxy: true, // Required for Vercel/proxies
        cookie: {
            secure: isProduction, // Secure only in production (HTTPS)
            sameSite: isProduction ? 'none' : 'lax', // None required for cross-site auth flows
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── OG (Open Graph) Bot Middleware ───────────────────────────────────────────
// WhatsApp, Telegram, Facebook ve diğer mesajlaşma uygulamaları bir URL
// paylaşıldığında preview oluşturmak için bot olarak sunucuya GET isteği atar.
// Bu botlar JavaScript çalıştırmaz — sadece HTML'deki OG meta etiketlerini okur.
//
// Bu middleware bot User-Agent'larını tespit eder ve ilgili OG route'una yönlendirir.
// Normal kullanıcılar etkilenmez; SPA'ya gitmelerine izin verilir.

const BOT_USER_AGENTS = [
    'whatsapp', 'facebookexternalhit', 'facebot', 'twitterbot', 'telegrambot',
    'linkedinbot', 'slackbot', 'discordbot', 'pinterest', 'vkshare',
    'skype', 'viber', 'googlebot', 'bingbot', 'applebot', 'duckduckbot',
    'baiduspider', 'yandexbot', 'semrushbot', 'ahrefsbot', 'curl/',
    'python-requests', 'go-http-client', 'ogpreviewfetcher', 'preview',
    'ia_archiver', 'rogerbot',
];

const OG_PATH_PATTERNS = [
    { pattern: /^\/post\/([a-f\d]{24})$/i, route: '/og/post/$1' },
    { pattern: /^\/profile\/([a-zA-Z0-9_.]+)$/i, route: '/og/profile/$1' },
    { pattern: /^\/portal\/([a-f\d]{24})$/i, route: '/og/portal/$1' },
];

app.use((req, res, next) => {
    // Sadece GET isteklerini kontrol et
    if (req.method !== 'GET') return next();

    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = BOT_USER_AGENTS.some(pattern => ua.includes(pattern));

    if (!isBot) return next();

    // Bot ise path'i OG route'u ile eşleştir
    for (const { pattern, route } of OG_PATH_PATTERNS) {
        const match = req.path.match(pattern);
        if (match) {
            // Route placeholder'larını gerçek değerlerle değiştir
            const ogPath = route.replace('$1', match[1]);
            console.log(`🤖 Bot detected (${ua.substring(0, 40)}...) → Serving OG: ${ogPath}`);
            req.url = ogPath;
            return next();
        }
    }

    return next();
});

// OG Meta Injection Routes (bot'lar için)
app.use('/og', ogRoutes);
// ─────────────────────────────────────────────────────────────────────────────

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/portals', portalRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/reports', reportRoutes);

// App version check endpoint (public) - used by clients on startup to detect newer APK
app.get('/api/app/version', (req, res) => {
    res.json({
        latestVersion: '1.0.7',
        versionCode: 8,
        downloadUrl: 'https://oxypace.com.tr/downloads/oxypace.apk',
        forceUpdate: false,
        changelog: 'Tüm push bildirimlerinin (mesaj, arkadaşlık vb.) native olarak gösterilmesi düzeltildi.',
    });
});

import contactRoutes from './routes/contact.js';
import feedbackRoutes from './routes/feedback.js';

// ...
app.use('/api/contact', contactRoutes);
app.use('/api/feedback', feedbackRoutes);

// DIRECT SITEMAP ROUTE
app.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res) => {
    res.header('Content-Type', 'application/xml');
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://oxypace.netlify.app';
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
        res.send(xml);
    } catch (e) {
        console.error('Sitemap Generation Error:', e);
        res.status(500).send('<error>Sitemap failed</error>');
    }
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        message: err.message || 'Global Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'GlobalMessage API is running',
        version: '2.6 - Sitemap Integrated',
        timestamp: new Date().toISOString(),
    });
});

// Initialize Socket.IO
setupRedisAdapter(io);
initializeSocket(io);
setupChangeStreams(io);

const repairUserFriendships = async () => {
    try {
        console.log('🔧 Starting user friendship repair & deduplication...');
        const users = await User.find({});
        let repairedCount = 0;
        for (const user of users) {
            let modified = false;

            const deduplicateArray = (arr) => {
                if (!Array.isArray(arr)) return [];
                const seen = new Set();
                return arr.filter(item => {
                    if (!item) return false;
                    const strVal = item.toString();
                    if (seen.has(strVal)) return false;
                    seen.add(strVal);
                    return true;
                });
            };

            const cleanFollowers = deduplicateArray(user.followers);
            if (cleanFollowers.length !== (user.followers || []).length) {
                user.followers = cleanFollowers;
                modified = true;
            }

            const cleanFollowing = deduplicateArray(user.following);
            if (cleanFollowing.length !== (user.following || []).length) {
                user.following = cleanFollowing;
                modified = true;
            }

            const cleanRequests = deduplicateArray(user.followRequests);
            if (cleanRequests.length !== (user.followRequests || []).length) {
                user.followRequests = cleanRequests;
                modified = true;
            }

            if (user.followerCount !== user.followers.length) {
                user.followerCount = user.followers.length;
                modified = true;
            }
            if (user.followingCount !== user.following.length) {
                user.followingCount = user.following.length;
                modified = true;
            }

            if (modified) {
                await user.save();
                repairedCount++;
                console.log(`🔧 Repaired friendship arrays & counts for user: @${user.username}`);
            }
        }
        console.log(`✅ User friendship repair complete. Repaired ${repairedCount} users.`);
    } catch (err) {
        console.error('⚠️ Error running user friendship repair:', err);
    }
};

const cleanupExpiredTouristAdmins = async () => {
    try {
        const now = new Date();
        const expiredUsers = await User.find({
            isTouristAdmin: true,
            touristAdminExpiresAt: { $lt: now }
        });

        if (expiredUsers.length > 0) {
            console.log(`🧹 Found ${expiredUsers.length} expired tourist admins. Revoking permissions...`);
            const Notification = await import('./models/Notification.js').then(m => m.default);
            for (const user of expiredUsers) {
                user.isTouristAdmin = false;
                user.touristAdminExpiresAt = null;
                user.assignedBy = '';
                await user.save();

                try {
                    const systemEnabled = user.settings?.notifications?.system !== false;
                    if (systemEnabled) {
                        await Notification.create({
                            recipient: user._id,
                            type: 'system',
                            content: 'Turist Admin yetkilerinizin süresi doldu. Standart yetkilere geri döndünüz.',
                        });
                    }

                    if (user.fcmTokens && user.fcmTokens.length > 0 && user.settings?.notifications?.push !== false) {
                        const { sendPushNotification } = await import('./services/pushService.js');
                        await sendPushNotification(user.fcmTokens, {
                            title: 'Yetki Süresi Doldu',
                            body: 'Turist Admin yetkilerinizin süresi doldu.',
                            data: { url: '/' }
                        });
                    }

                    const io = app.get('io');
                    if (io) {
                        io.to(user._id.toString()).emit('tourist_admin_expired', {
                            message: 'Turist Admin yetkilerinizin süresi doldu.'
                        });
                        io.to(user._id.toString()).emit('tourist_admin_revoked', {
                            message: 'Turist Admin yetkilerinizin süresi doldu.'
                        });
                    }
                } catch (notifErr) {
                    console.error(`Error notifying expired tourist admin ${user.username}:`, notifErr);
                }
            }
        }
    } catch (err) {
        console.error('⚠️ Error cleaning up expired tourist admins:', err);
    }
};

// Start server
// Start server only if run directly
if (process.argv[1] === __filename) {
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, async () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Socket.IO ready for real-time connections`);
        console.log('✅ Backend updated: v2.6 - Sitemap Integrated');

        // Database repair on boot
        try {
            await connectDB();
            await repairUserFriendships();
            await cleanupExpiredTouristAdmins();
        } catch (err) {
            console.error('⚠️ Boot DB connect/repair failed:', err.message);
        }

        // Start Bot Loop (in background)
        startBotLoop(io);

        // Keep-Alive Cron Job
        cron.schedule('*/10 * * * *', async () => {
            try {
                const port = process.env.PORT || 5000;
                // Ping local health endpoint
                await axios.get(`http://127.0.0.1:${port}/api/health`);
                console.log('🔄 Self-ping successful to prevent sleep');
            } catch (error) {
                console.error('⚠️ Self-ping failed:', error.message);
            }
        });

        // Expired Tourist Admin Cleanup Cron Job (Runs every minute)
        cron.schedule('* * * * *', async () => {
            await cleanupExpiredTouristAdmins();
        });

    });
}

export default app;
