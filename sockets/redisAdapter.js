import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const pubClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error', err));

export const setupRedisAdapter = (io) => {
    try {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('🔗 Redis Pub/Sub adapter connected to Socket.IO');
    } catch (err) {
        console.error('❌ Failed to connect Redis adapter to Socket.IO:', err);
    }
};

export { pubClient, subClient };
