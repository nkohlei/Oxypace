import { pubClient } from '../sockets/redisAdapter.js';

// Bellek tabanlı yedek önbellek
if (!global.presenceCache) {
    global.presenceCache = new Map();
}

/**
 * Kullanıcının varlık (presence) bilgisini kaydeder.
 * Redis varsa EX (TTL) seçeneğiyle, yoksa in-memory Map ile saklar.
 */
export const savePresence = async (userId, data) => {
    const redisKey = `presence:user:${userId}`;
    const presenceData = {
        ...data,
        timestamp: Date.now()
    };

    if (pubClient) {
        try {
            await pubClient.set(redisKey, JSON.stringify(presenceData), 'EX', 90); // 90 saniye geçerlilik süresi (TTL)
        } catch (err) {
            console.error('⚠️ Redis presence set error:', err);
            // Hata durumunda in-memory önbelleğe yaz
            global.presenceCache.set(userId.toString(), presenceData);
        }
    } else {
        global.presenceCache.set(userId.toString(), presenceData);
    }
};

/**
 * Kullanıcı çıkış yaptığında veya koptuğunda presence bilgisini anında siler.
 */
export const removePresence = async (userId) => {
    const redisKey = `presence:user:${userId}`;
    if (pubClient) {
        try {
            await pubClient.del(redisKey);
        } catch (err) {
            console.error('⚠️ Redis presence delete error:', err);
            global.presenceCache.delete(userId.toString());
        }
    } else {
        global.presenceCache.delete(userId.toString());
    }
};

/**
 * Aktif durumdaki tüm oturumları listeler.
 * Süresi dolmuş (90 sn) verileri temizler ve eler.
 */
export const getActivePresences = async () => {
    if (pubClient) {
        try {
            let keys = [];
            let cursor = '0';
            do {
                const reply = await pubClient.scan(cursor, 'MATCH', 'presence:user:*', 'COUNT', 100);
                cursor = reply[0];
                keys = keys.concat(reply[1]);
            } while (cursor !== '0');

            if (keys.length === 0) {return [];}

            const pipeline = pubClient.pipeline();
            keys.forEach(key => pipeline.get(key));
            const results = await pipeline.exec();

            const users = [];
            results.forEach(([err, val]) => {
                if (!err && val) {
                    try {
                        users.push(JSON.parse(val));
                    } catch {
                    }
                }
            });
            return users;
        } catch (err) {
            console.error('⚠️ Redis scan/pipeline presence error:', err);
            // Hata durumunda bellek tabanlı listeden oku
            return getInMemoryPresences();
        }
    } else {
        return getInMemoryPresences();
    }
};

// Bellek tabanlı listeleme ve temizleme yardımcı fonksiyonu
const getInMemoryPresences = () => {
    const now = Date.now();
    const users = [];
    for (const [userId, data] of global.presenceCache.entries()) {
        if (now - data.timestamp < 90000) {
            users.push(data);
        } else {
            global.presenceCache.delete(userId);
        }
    }
    return users;
};
