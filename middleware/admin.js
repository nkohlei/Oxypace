const admin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.isTouristAdmin)) {
        next();
    } else {
        res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
    }
};

export { admin };
