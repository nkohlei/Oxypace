import { body, param, query, validationResult } from 'express-validator';

/**
 * Input Validation & Sanitization Middleware
 * Protects against XSS, SQL/NoSQL injection
 */

// Validation result handler
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation error',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

// Auth validation rules
export const registerValidation = [
    body('email').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail().trim(),
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Kullanıcı adı 3-30 karakter arasında olmalı')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir')
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Şifre en az 8 karakter olmalı')
        .matches(/[A-Z]/)
        .withMessage('Şifre en az bir büyük harf içermeli')
        .matches(/[a-z]/)
        .withMessage('Şifre en az bir küçük harf içermeli')
        .matches(/[0-9]/)
        .withMessage('Şifre en az bir rakam içermeli'),
    validate,
];

export const loginValidation = [
    body('email').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail().trim(),
    body('password').notEmpty().withMessage('Şifre gerekli'),
    validate,
];

// Post validation rules
export const postValidation = [
    body('content')
        .optional()
        .isLength({ max: 5000 })
        .withMessage('İçerik en fazla 5000 karakter olabilir')
        .trim(),
    body('portalId').optional().isMongoId().withMessage('Geçersiz portal ID'),
    validate,
];

// Comment validation rules
export const commentValidation = [
    body('content')
        .notEmpty()
        .withMessage('Yorum içeriği gerekli')
        .isLength({ max: 2000 })
        .withMessage('Yorum en fazla 2000 karakter olabilir')
        .trim(),
    validate,
];

// Message validation rules
export const messageValidation = [
    body('content')
        .optional()
        .isLength({ max: 5000 })
        .withMessage('Mesaj en fazla 5000 karakter olabilir')
        .trim(),
    validate,
];

// Profile update validation
export const profileValidation = [
    body('displayName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Görünen isim en fazla 50 karakter olabilir')
        .trim()
        .escape(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio en fazla 500 karakter olabilir')
        .trim(),
    validate,
];

// MongoDB ObjectId validation
export const mongoIdValidation = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage('Geçersiz ID formatı'),
    validate,
];

// Pagination validation
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Sayfa numarası pozitif bir tam sayı olmalı')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit 1-100 arasında olmalı')
        .toInt(),
    validate,
];

// Password reset validation
export const passwordResetValidation = [
    body('email').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail().trim(),
    validate,
];

export const newPasswordValidation = [
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Şifre en az 8 karakter olmalı')
        .matches(/[A-Z]/)
        .withMessage('Şifre en az bir büyük harf içermeli')
        .matches(/[a-z]/)
        .withMessage('Şifre en az bir küçük harf içermeli')
        .matches(/[0-9]/)
        .withMessage('Şifre en az bir rakam içermeli'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Geçersiz doğrulama kodu'),
    body('email').isEmail().withMessage('Geçerli bir email adresi girin').normalizeEmail(),
    validate,
];
