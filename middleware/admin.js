/**
 * Admin and Granular Permission Middleware
 * Validates root admin ('oxypace'), full admins, and tourist admins with granular permissions and expiry.
 */

export const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
    }

    // Root admin ('oxypace') or Full Admin (isAdmin && !isTouristAdmin)
    if (req.user.username === 'oxypace' || (req.user.isAdmin && !req.user.isTouristAdmin)) {
        return next();
    }

    // Tourist Admin Check
    if (req.user.isTouristAdmin) {
        // Expiry check
        if (req.user.touristAdminExpiresAt && new Date(req.user.touristAdminExpiresAt) < new Date()) {
            req.user.isTouristAdmin = false;
            return res.status(403).json({ message: 'Turist Admin yetkilerinizin süresi doldu.' });
        }
        return next();
    }

    res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
};

/**
 * Helper to check tourist admin access for module and level
 */
export const checkTouristModuleAccess = (user, moduleOrPerm, level = 'view') => {
    if (!user) return false;
    if (user.username === 'oxypace' || (user.isAdmin && !user.isTouristAdmin)) return true;
    if (!user.isTouristAdmin) return false;

    // Check expiry
    if (user.touristAdminExpiresAt && new Date(user.touristAdminExpiresAt) < new Date()) {
        user.isTouristAdmin = false;
        return false;
    }

    const perms = user.touristAdminPermissions || {};

    // 1. Check nested modules
    if (perms.modules && perms.modules[moduleOrPerm]) {
        const mod = perms.modules[moduleOrPerm];
        const access = mod.access || 'none';

        if (level === 'view') {
            return access === 'view' || access === 'full';
        }
        if (level === 'full' || level === 'edit') {
            return access === 'full';
        }
        if (level === 'details') {
            return (access === 'view' || access === 'full') && mod.canViewDetails !== false;
        }
        if (level === 'canBan') {
            return access === 'full' || !!mod.canBan;
        }
        if (level === 'canManageBadges') {
            return access === 'full' || !!mod.canManageBadges;
        }
        if (level === 'canExport') {
            return access === 'full' || !!mod.canExport;
        }
    }

    // 2. Direct boolean check on perms
    if (perms[moduleOrPerm] === true) {
        return true;
    }

    // 3. Fallback map for legacy permission keys
    const LEGACY_MAP = {
        'requests': 'canManageRequests',
        'recovery': 'canManageRecovery',
        'feedback': 'canManageFeedback',
        'users': 'canManageUsers',
        'activity': 'canViewLogs',
        'ipbans': 'canBanUsers',
        'badges': 'canManageBadges',
        'custom-badges': 'canManageBadges',
        'bots': 'canManageBots',
        'portals': 'canManagePortals',
        'blog': 'canManageBlog',
        'reports': 'canManageReports',
        'mass-notification': 'canSendNotifications',
        'mobile-designs': 'canManageMobile',
        'mobile-versions': 'canManageMobile'
    };

    const legacyKey = LEGACY_MAP[moduleOrPerm];
    if (legacyKey && perms[legacyKey] === true) {
        return true;
    }

    return false;
};

/**
 * Granular Permission Checker for Tourist Admins
 * Root admin and Full Admins automatically bypass this check.
 * Tourist admins must explicitly have the specified permission or module access level.
 *
 * @param {string} moduleOrPerm - e.g. 'users', 'canManageUsers', 'activity', etc.
 * @param {string} [level='view'] - 'view', 'full', 'details', 'canBan', etc.
 */
export const requirePermission = (moduleOrPerm, level = 'view') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
        }

        // Root super admin ('oxypace') or Full Admin bypass all granular restrictions
        if (req.user.username === 'oxypace' || (req.user.isAdmin && !req.user.isTouristAdmin)) {
            return next();
        }

        // Tourist Admin validation
        if (req.user.isTouristAdmin) {
            // Check expiry first
            if (req.user.touristAdminExpiresAt && new Date(req.user.touristAdminExpiresAt) < new Date()) {
                req.user.isTouristAdmin = false;
                return res.status(403).json({ message: 'Turist Admin yetkilerinizin süresi doldu.' });
            }

            if (checkTouristModuleAccess(req.user, moduleOrPerm, level)) {
                return next();
            }

            return res.status(403).json({
                message: 'Bu modül veya işlem için yetkiniz bulunmamaktadır.',
                requiredPermission: moduleOrPerm,
                requiredLevel: level
            });
        }

        res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
    };
};
