import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directory on Koyeb (root/uploads)
const uploadPath = path.join(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadPath)) {
    try {
        fs.mkdirSync(uploadPath, { recursive: true });
    } catch (err) {
        console.error('Migration: Error creating uploads directory:', err);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We can sub-categorize if needed, e.g., uploads/feedback
        const feedbackPath = path.join(uploadPath, 'feedback');
        if (!fs.existsSync(feedbackPath)) {
            fs.mkdirSync(feedbackPath, { recursive: true });
        }
        cb(null, feedbackPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

const localUpload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|txt|json/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Desteklenmeyen dosya türü. (Görsel, Video, PDF, TXT veya JSON yüklenebilir)'));
        }
    },
});

export default localUpload;
