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

    const ALIAS_MAP = {
        'notifications': 'mass-notification',
        'notification': 'mass-notification',
        'mass_notification': 'mass-notification',
        'canSendNotifications': 'mass-notification',
        'canManageNotifications': 'mass-notification',
        'system': 'mobile-designs',
        'mobile': 'mobile-designs',
        'mobile-design': 'mobile-designs',
        'mobile-version': 'mobile-versions',
        'custom_badges': 'custom-badges',
        'customBadge': 'custom-badges',
        'customBadges': 'custom-badges',
        'ip_bans': 'ipbans',
        'ip-bans': 'ipbans',
        'ipban': 'ipbans',
        'canBanUsers': 'users',
        'canManageUsers': 'users',
        'canManageRequests': 'requests',
        'canManageRecovery': 'recovery',
        'canManageFeedback': 'feedback',
        'canManageBadges': 'badges',
        'canManageBots': 'bots',
        'canManagePortals': 'portals',
        'canManageBlog': 'blog',
        'canManageReports': 'reports',
        'canViewLogs': 'activity',
        'canManageMobile': 'mobile-designs',
        'canManageSystem': 'mobile-designs',
        'logs': 'activity',
        'log': 'activity',
        'report': 'reports'
    };

    const targetModule = ALIAS_MAP[moduleOrPerm] || moduleOrPerm;

    // 1. Check nested module permissions if present
    const mod = (perms.modules && (perms.modules[targetModule] || perms.modules[moduleOrPerm])) || null;
    if (mod) {
        const access = mod.access || 'none';
        const isFull = access === 'full';
        const isView = access === 'view' || isFull;

        if (level === 'view') {
            return isView;
        }
        if (level === 'full' || level === 'edit') {
            return isFull;
        }
        if (level === 'details') {
            return isView && mod.canViewDetails !== false;
        }
        if (level === 'canBan') {
            if (mod.canBan === false) return false;
            return !!mod.canBan || (isFull && mod.canBan !== false) || perms.modules?.ipbans?.access === 'full';
        }
        if (level === 'canManageBadges') {
            if (mod.canManageBadges === false) return false;
            return !!mod.canManageBadges || (isFull && mod.canManageBadges !== false) || perms.modules?.badges?.access === 'full' || perms.modules?.['custom-badges']?.access === 'full';
        }
        if (level === 'canExport') {
            if (mod.canExport === false) return false;
            return !!mod.canExport || (isFull && mod.canExport !== false);
        }

        // If level matches a sub-permission key in mod
        if (mod[level] !== undefined) {
            return !!mod[level];
        }

        return isFull;
    }

    // 2. Direct boolean check on perms root
    if (perms[moduleOrPerm] === true) {
        return true;
    }

    // 3. Reverse legacy check
    const MODULE_TO_LEGACY = {
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

    const legacyKey = MODULE_TO_LEGACY[targetModule];
    if (legacyKey && (perms[legacyKey] === true || (legacyKey === 'canSendNotifications' && perms.canManageNotifications === true))) {
        return true;
    }

    // 4. Special sub-permission fallback checks
    if (level === 'canBan' && (perms.canBanUsers === true || perms.canManageUsers === true)) return true;
    if (level === 'canManageBadges' && perms.canManageBadges === true) return true;
    if (level === 'canExport' && perms.canViewLogs === true) return true;
    if (level === 'details' && (perms[legacyKey] === true || perms.canManageUsers === true)) return true;

    return false;
};

/**
 * Granular Permission Checker for Tourist Admins
 * Root admin and Full Admins automatically bypass this check.
 * Tourist admins must explicitly have the specified permission or module access level.
 *
 * @param {string} moduleOrPerm - e.g. 'users', 'canManageUsers', 'mass-notification', etc.
 * @param {string} [level=null] - 'view', 'full', 'details', 'canBan', etc. Defaults to 'view' for GET/HEAD, 'full' for mutations.
 */
export const requirePermission = (moduleOrPerm, level = null) => {
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

            // Determine effective level:
            // If level was explicitly specified, use it.
            // If level was omitted:
            //   - GET/HEAD requests require 'view'
            //   - POST/PUT/DELETE/PATCH mutations require 'full'
            const effectiveLevel = level || (['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? 'view' : 'full');

            if (checkTouristModuleAccess(req.user, moduleOrPerm, effectiveLevel)) {
                return next();
            }

            return res.status(403).json({
                message: 'Bu modül veya işlem için yetkiniz bulunmamaktadır.',
                requiredPermission: moduleOrPerm,
                requiredLevel: effectiveLevel
            });
        }

        res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
    };
};
