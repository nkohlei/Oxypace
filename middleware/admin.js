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
 * Granular Permission Checker for Tourist Admins
 * Root admin and Full Admins automatically bypass this check.
 * Tourist admins must explicitly have the specified permission set to true.
 *
 * @param {string} permissionKey - e.g. 'canManageUsers', 'canBanUsers', 'canViewLogs', etc.
 */
export const requirePermission = (permissionKey) => {
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

            // Check granular permission
            const perms = req.user.touristAdminPermissions || {};
            if (perms[permissionKey]) {
                return next();
            }

            return res.status(403).json({
                message: 'Bu eylem için yetkiniz bulunmamaktadır.',
                requiredPermission: permissionKey
            });
        }

        res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
    };
};
