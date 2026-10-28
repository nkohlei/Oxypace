import mongoose from 'mongoose';

let listenersAttached = false;

const connectDB = async () => {
    const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    let cached = global.mongoose;

    if (!cached) {
        cached = global.mongoose = { conn: null, promise: null };
    }

    if (!listenersAttached) {
        listenersAttached = true;
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected — clearing cached connection for auto-reconnect');
            if (global.mongoose) {
                global.mongoose.conn = null;
                global.mongoose.promise = null;
            }
        });
        mongoose.connection.on('error', (err) => {
            console.error('⚠️ MongoDB connection error:', err.message);
        });
    }

    // Return cached connection ONLY if readyState is 1 (connected)
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // If disconnected or disconnecting, reset cached promise so we reconnect cleanly
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: true,
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.conn = null;
        cached.promise = null;
        throw e;
    }

    return cached.conn;
};

export default connectDB;
