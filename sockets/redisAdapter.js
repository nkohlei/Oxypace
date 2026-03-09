import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
let pubClient = null;
let subClient = null;

if (REDIS_URL) {
    try {
        pubClient = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // Prevent infinite reconnection loop if Redis is down
        });
        subClient = pubClient.duplicate();

        pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
        subClient.on('error', (err) => console.error('Redis Sub Client Error', err));
    } catch (err) {
        console.error('Failed to initialize Redis clients', err);
    }
}

export const setupRedisAdapter = (io) => {
    if (!pubClient || !subClient) {
        console.log('⚠️ REDIS_URL is not set or Redis failed to initialize. Falling back to default in-memory Socket.IO adapter.');
        return;
    }

    try {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('🔗 Redis Pub/Sub adapter connected to Socket.IO');
    } catch (err) {
        console.error('❌ Failed to connect Redis adapter to Socket.IO, continuing without it:', err);
    }
};

export { pubClient, subClient };
