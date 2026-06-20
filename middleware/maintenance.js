import SystemSettings from '../models/SystemSettings.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const checkMaintenance = async (req, res, next) => {
    // İlk istekte veritabanından değeri yükleyip önbelleğe alalım
    if (global.isMaintenanceActive === undefined) {
        try {
            const setting = await SystemSettings.findOne({ key: 'maintenance_mode' });
            global.isMaintenanceActive = setting ? !!setting.value?.active : false;
            console.log(`🔌 Initialized maintenance mode cache from DB: ${global.isMaintenanceActive}`);
        } catch (err) {
            console.error('Failed to load maintenance mode status from DB:', err);
            global.isMaintenanceActive = false; // Hata durumunda varsayılan olarak pasif yap
        }
    }

    // Bakım modu aktif değilse doğrudan geç
    if (!global.isMaintenanceActive) {
        return next();
    }

    const path = req.path;

    // Engellenmeyecek rotalar (İstisnalar):
    // 1. Sağlık kontrolü
    // 2. Auth rotaları (giriş, durum kontrolü vb.)
    // 3. Admin ayar yolları (bakım modunu kapatabilmek için)
    if (
        path === '/health' ||
        path.startsWith('/auth/') ||
        path.startsWith('/admin/system-settings/')
    ) {
        return next();
    }

    // 4. Yetki kontrolü: Token veya çerez içindeki JWT üzerinden admin doğrulaması yap
    const token = (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
        ? req.headers.authorization.split(' ')[1]
        : (req.cookies && req.cookies.token);

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user && user.isAdmin) {
                return next();
            }
        } catch (_err) {
            // Sessizce geç ve 503 döndür
        }
    }

    // Yetkisi olmayan genel API isteklerini 503 Service Unavailable ile engelle
    return res.status(503).json({
        maintenance: true,
        message: 'Platform geçici olarak bakımdadır. Lütfen daha sonra tekrar deneyin.'
    });
};

export { checkMaintenance };
