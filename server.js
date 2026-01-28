import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
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

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://oxypace.vercel.app',
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
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
    if (req.path.startsWith('/api')) {
        try {
            await connectDB();
        } catch (error) {
            console.error('DB Connection Error in Middleware:', error);
            return res.status(500).json({ message: 'Database Connection Error' });
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

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for Passport)
app.use(
    session({
        secret: process.env.JWT_SECRET || 'fallback-secret',
        resave: false,
        saveUninitialized: false,
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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        message: err.message || 'Global Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'GlobalMessage API is running',
        version: '2.3 - Feature Settings Active',
        timestamp: new Date().toISOString()
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
        console.log('✅ Backend updated: v2.4 - DB Connection & Auth Fixes');
    });
}

export default app;
