import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MediaHandler {
    constructor() {
        this.tempDir = path.join(__dirname, '../../temp_media');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async downloadImage(url) {
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
            });

            // Get extension (default to jpg if not found)
            const ext = path.extname(url).split('?')[0] || '.jpg';
            const filename = `bot_${Date.now()}${ext}`;
            const filepath = path.join(this.tempDir, filename);

            const writer = fs.createWriteStream(filepath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filepath));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('[MediaHandler] Download failed:', error.message);
            return null;
        }
    }

    cleanup(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        } catch (error) {
            console.error('[MediaHandler] Cleanup error:', error);
        }
    }
}

export default MediaHandler;
