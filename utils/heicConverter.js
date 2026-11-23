import sharp from 'sharp';
import ffmpegStatic from 'ffmpeg-static';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

const HEIC_BRANDS = new Set([
    'heic', 'heix', 'hevc', 'hevx',
    'mif1', 'msf1', 'heif', 'heis', 'hevm', 'hevs'
]);

/**
 * Inspect ISO BMFF ftyp box header to detect HEIC/HEIF images.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export function isHeicBuffer(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
    const ftyp = buffer.slice(4, 8).toString('ascii');
    if (ftyp !== 'ftyp') return false;

    const boxSize = buffer.readUInt32BE(0);
    const maxScan = Math.min(buffer.length, Math.max(12, Math.min(boxSize || 64, 64)));
    for (let offset = 8; offset + 4 <= maxScan; offset += 4) {
        if (offset === 12) continue; // skip minor_version
        const brand = buffer.slice(offset, offset + 4).toString('ascii').toLowerCase();
        if (HEIC_BRANDS.has(brand)) return true;
    }
    return false;
}

/**
 * Check whether filename, mimetype, or magic bytes indicate HEIC/HEIF.
 * @param {{ originalname?: string, mimetype?: string, buffer?: Buffer } | string} fileOrName
 * @param {string} [mimetype]
 * @returns {boolean}
 */
export function isHeicFile(fileOrName, mimetype = '') {
    if (!fileOrName) return false;
    if (typeof fileOrName === 'string') {
        const ext = path.extname(fileOrName).toLowerCase();
        const mime = (mimetype || '').toLowerCase();
        return ext === '.heic' || ext === '.heif' || mime === 'image/heic' || mime === 'image/heif' || mime === 'image/heic-sequence' || mime === 'image/heif-sequence';
    }
    const ext = path.extname(fileOrName.originalname || fileOrName.name || '').toLowerCase();
    const mime = (fileOrName.mimetype || fileOrName.type || mimetype || '').toLowerCase();
    if (ext === '.heic' || ext === '.heif') return true;
    if (mime === 'image/heic' || mime === 'image/heif' || mime === 'image/heic-sequence' || mime === 'image/heif-sequence') return true;
    if (Buffer.isBuffer(fileOrName.buffer) && isHeicBuffer(fileOrName.buffer)) return true;
    return false;
}

/**
 * Decode full HEIC/HEIF image using libheif's heif-convert CLI (reconstructs tiled grids accurately).
 * @param {Buffer} buffer
 * @param {number} [quality=95]
 * @returns {Promise<Buffer>}
 */
async function convertViaHeifConvert(buffer, quality = 95) {
    const tmpId = crypto.randomBytes(8).toString('hex');
    const tmpDir = os.tmpdir();
    const inPath = path.join(tmpDir, `heic-in-${tmpId}.heic`);
    const outPath = path.join(tmpDir, `heic-out-${tmpId}.jpg`);

    try {
        await fs.writeFile(inPath, buffer);
        await execFileAsync('heif-convert', ['-q', String(quality), inPath, outPath], { timeout: 30000 });

        try {
            return await fs.readFile(outPath);
        } catch (_) {
            // Multi-image HEIC files may emit heic-out-<id>-1.jpg
            const altPath = outPath.replace(/\.jpg$/, '-1.jpg');
            return await fs.readFile(altPath);
        }
    } finally {
        await fs.unlink(inPath).catch(() => {});
        try {
            const entries = await fs.readdir(tmpDir);
            const prefix = `heic-out-${tmpId}`;
            await Promise.all(
                entries
                    .filter((name) => name.startsWith(prefix))
                    .map((name) => fs.unlink(path.join(tmpDir, name)).catch(() => {}))
            );
        } catch (_) {}
    }
}

async function convertViaFfmpeg(buffer, format = 'jpg', quality = 92) {
    if (!ffmpegStatic) {
        throw new Error('ffmpeg-static binary not available for HEIC fallback');
    }
    const tmpId = crypto.randomBytes(8).toString('hex');
    const inPath = path.join(os.tmpdir(), `heic-in-${tmpId}.heic`);
    const outExt = format === 'webp' ? 'webp' : 'jpg';
    const outPath = path.join(os.tmpdir(), `heic-out-${tmpId}.${outExt}`);

    try {
        await fs.writeFile(inPath, buffer);
        const args = format === 'webp'
            ? ['-y', '-i', inPath, '-frames:v', '1', '-q:v', String(quality), outPath]
            : ['-y', '-i', inPath, '-frames:v', '1', '-q:v', '2', outPath];
        await execFileAsync(ffmpegStatic, args, { timeout: 30000 });
        return await fs.readFile(outPath);
    } finally {
        await fs.unlink(inPath).catch(() => {});
        await fs.unlink(outPath).catch(() => {});
    }
}

/**
 * Convert a HEIC/HEIF buffer into a high-quality auto-oriented JPEG buffer.
 * Uses heif-convert (full HEIC grid + libde265) first, then sharp, then ffmpeg-static.
 * @param {Buffer} buffer
 * @param {number} [quality=92]
 * @returns {Promise<Buffer>}
 */
export async function convertHeicBufferToJpeg(buffer, quality = 92) {
    try {
        const rawJpg = await convertViaHeifConvert(buffer, Math.max(quality, 95));
        return await sharp(rawJpg).rotate().jpeg({ quality, mozjpeg: true }).toBuffer();
    } catch (heifErr) {
        try {
            return await sharp(buffer)
                .rotate()
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
        } catch (sharpErr) {
            try {
                const rawJpg = await convertViaFfmpeg(buffer, 'jpg', quality);
                return await sharp(rawJpg).rotate().jpeg({ quality, mozjpeg: true }).toBuffer();
            } catch (ffmpegErr) {
                throw new Error(`HEIC to JPEG conversion failed: heif-convert=${heifErr.message}; sharp=${sharpErr.message}; ffmpeg=${ffmpegErr.message}`);
            }
        }
    }
}

/**
 * Convert a HEIC/HEIF buffer into a WebP buffer.
 * Uses heif-convert (full HEIC grid + libde265) first, then sharp, then ffmpeg-static.
 * @param {Buffer} buffer
 * @param {number} [quality=90]
 * @returns {Promise<Buffer>}
 */
export async function convertHeicBufferToWebp(buffer, quality = 90) {
    try {
        const rawJpg = await convertViaHeifConvert(buffer, 95);
        return await sharp(rawJpg).rotate().webp({ quality }).toBuffer();
    } catch (heifErr) {
        try {
            return await sharp(buffer)
                .rotate()
                .webp({ quality })
                .toBuffer();
        } catch (sharpErr) {
            try {
                const rawJpg = await convertViaFfmpeg(buffer, 'jpg', 95);
                return await sharp(rawJpg).rotate().webp({ quality }).toBuffer();
            } catch (ffmpegErr) {
                throw new Error(`HEIC to WebP conversion failed: heif-convert=${heifErr.message}; sharp=${sharpErr.message}; ffmpeg=${ffmpegErr.message}`);
            }
        }
    }
}
