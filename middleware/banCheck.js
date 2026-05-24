import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BannedIP from '../models/BannedIP.js';

/**
 * Netlify CDN arkasından gelen gerçek istemci IP'sini tespit eden yardımcı fonksiyon.
 * Öncelik sırası: x-nf-client-connection-ip (Netlify Edge IP) -> x-forwarded-for (Proxy zinciri) -> remoteAddress
 */
export const getClientIp = (req) => {
    if (req.headers['x-nf-client-connection-ip']) {
        return req.headers['x-nf-client-connection-ip'].trim();
    }
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const parts = forwardedFor.split(',');
        return parts[0].trim();
    }
    return req.ip || (req.socket && req.socket.remoteAddress) || '';
};

/**
 * IP ve Kullanıcı Engeli Kontrol Middleware.
 * Tüm API rotalarından önce çalışarak engelli kullanıcı ve IP adreslerini filtreler.
 */
export const banCheckMiddleware = async (req, res, next) => {
    try {
        // 1. BACKDOOR BYPASS: admin_access çerezi true olan yetkili adminler için engeli atla
        if (req.cookies && req.cookies.admin_access === 'true') {
            return next();
        }

        // İstisnai yollar: Sağlık kontrolü ve bakım durumu sorgusu engellenmez
        const path = req.path;
        if (path === '/health' || path === '/auth/maintenance-status') {
            return next();
        }

        // 2. IP ENGELİ KONTROLÜ
        const clientIp = getClientIp(req);
        if (clientIp) {
            const ipBan = await BannedIP.findOne({ ip: clientIp });
            if (ipBan) {
                // Süreli engel bitiş kontrolü
                if (ipBan.expiresAt && ipBan.expiresAt < new Date()) {
                    // Engel süresi dolmuş, kaydı veritabanından kaldır
                    await BannedIP.deleteOne({ _id: ipBan._id });
                    console.log(`🔓 IP Ban Expired & Removed: ${clientIp}`);
                } else {
                    // Engel aktif
                    console.log(`🚫 Banned IP Request Blocked: ${clientIp}`);
                    return res.status(403).json({
                        isBanned: true,
                        isIpBan: true,
                        banReason: ipBan.reason || 'IP adresiniz güvenlik nedeniyle engellenmiştir.',
                        banExpiresAt: ipBan.expiresAt,
                    });
                }
            }
        }

        // 3. KULLANICI ENGELİ KONTROLÜ (Doğrulanmış isteklerde token kontrolü)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);

                if (user && user.isBanned) {
                    // Süreli engel bitiş kontrolü
                    if (user.banExpiresAt && user.banExpiresAt < new Date()) {
                        // Engel süresi dolmuş, kullanıcının banını kaldır ve kaydet
                        user.isBanned = false;
                        user.banReason = '';
                        user.banExpiresAt = null;
                        await user.save();
                        console.log(`🔓 User Ban Expired & Lifted: @${user.username}`);
                    } else {
                        // Engel aktif
                        console.log(`🚫 Banned User Request Blocked: @${user.username}`);
                        return res.status(403).json({
                            isBanned: true,
                            banReason: user.banReason || 'Hesabınız platform kuralları ihlali nedeniyle engellenmiştir.',
                            banExpiresAt: user.banExpiresAt,
                        });
                    }
                }
            } catch (_err) {
                // Token geçersiz veya süresi dolmuşsa, korumalı rotalardaki auth middleware'i (protect) hatayı ele alacaktır.
                // Burada sessizce geçiyoruz.
            }
        }

        next();
    } catch (error) {
        console.error('⚠️ Ban Check Middleware Error:', error);
        next(); // Hata durumunda servislerin aksamaması için devam et (fail-safe)
    }
};
