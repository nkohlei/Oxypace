import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
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

// Models for Sitemap
import Portal from './models/Portal.js';
import User from './models/User.js';

// Security middleware imports
import helmetConfig from './middleware/helmet-config.js';
import { generalLimiter } from './middleware/rate-limit.js';
import mongoSanitize from 'express-mongo-sanitize';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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
// Enable proxy trust for Vercel/Heroku (fixes HTTP/HTTPS redirect loop)
app.set('trust proxy', 1);

const httpServer = createServer(app);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://oxypace.vercel.app',
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
            origin.includes('localhost')
        ) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: corsOptions,
});

// Make io accessible in routes
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
// Only create directory if NOT in Vercel environment to avoid Read-Only Filesystem errors
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
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

app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Add cookie-parser middleware

// Session middleware (required for Passport)
const isProduction = process.env.NODE_ENV === 'production';
app.use(
    session({
        secret: process.env.JWT_SECRET || 'fallback-secret',
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

// DIRECT SITEMAP ROUTE
app.get('/api/sitemap', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    try {
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
initializeSocket(io);

// Start server
// Start server only if run directly
if (process.argv[1] === __filename) {
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Socket.IO ready for real-time connections`);
        console.log('✅ Backend updated: v2.6 - Sitemap Integrated');

        // Start Bot Loop (in background)
        startBotLoop();
    });
}

export default app;
