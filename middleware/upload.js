import multer from 'multer';
import multerS3 from 'multer-s3';
import r2 from '../config/r2.js';
import path from 'path';

const upload = multer({
    storage: multerS3({
        s3: r2,
        bucket: function (req, file, cb) {
            cb(null, process.env.R2_BUCKET_NAME || 'oxypace');
        },
        acl: 'public-read', // R2 doesn't strictly support ACLs the same way but good for compatibility or ignored
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            // Organize files: folder/filename-timestamp.ext
            let folder = 'uploads';

            if (file.fieldname === 'avatar') {
                folder = 'avatars';
            } else if (file.fieldname === 'banner' || file.fieldname === 'coverImage') {
                folder = 'banners';
            } else if (file.fieldname === 'media') {
                folder = `posts/${req.body.portalId || 'general'}`;
            }

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    }),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
        }
    },
});

export default upload;
