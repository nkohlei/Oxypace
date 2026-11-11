// Pure-JS audio embedded artwork extractor & adaptive color palette generator

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

const rgbToHex = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

const rgbToHsl = (r, g, b) => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn:
                h = (gn - bn) / d + (gn < bn ? 6 : 0);
                break;
            case gn:
                h = (bn - rn) / d + 2;
                break;
            default:
                h = (rn - gn) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l];
};

const hslToRgb = (h, s, l) => {
    if (s === 0) {
        const v = l * 255;
        return [v, v, v];
    }
    const hue2rgb = (p, q, t) => {
        let tn = t;
        if (tn < 0) tn += 1;
        if (tn > 1) tn -= 1;
        if (tn < 1 / 6) return p + (q - p) * 6 * tn;
        if (tn < 1 / 2) return q;
        if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
        hue2rgb(p, q, h + 1 / 3) * 255,
        hue2rgb(p, q, h) * 255,
        hue2rgb(p, q, h - 1 / 3) * 255,
    ];
};

const shapeTone = (r, g, b, targetL = 0.28, satBoost = 1.08) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    const ns = s < 0.08 ? s : clamp(s * satBoost, 0.22, 0.72);
    const nl = clamp(l * 0.45 + targetL * 0.55, 0.16, 0.42);
    const [nr, ng, nb] = hslToRgb(h, ns, nl);
    return rgbToHex(nr, ng, nb);
};

const sniffImageMime = (bytes) => {
    if (!bytes || bytes.length < 4) return '';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
    if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
        return 'image/webp';
    }
    return '';
};

const readAscii = (bytes, start, len) => {
    let out = '';
    for (let i = 0; i < len && start + i < bytes.length; i += 1) {
        out += String.fromCharCode(bytes[start + i]);
    }
    return out;
};

const findNullTerminatedEnd = (bytes, start, isUtf16, maxEnd) => {
    if (isUtf16) {
        for (let i = start; i + 1 < maxEnd; i += 2) {
            if (bytes[i] === 0 && bytes[i + 1] === 0) return i + 2;
        }
        return maxEnd;
    }
    for (let i = start; i < maxEnd; i += 1) {
        if (bytes[i] === 0) return i + 1;
    }
    return maxEnd;
};

const parseId3Cover = (bytes) => {
    if (bytes.length < 10) return null;
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null; // "ID3"

    const version = bytes[3];
    const flags = bytes[5];
    const tagSize =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);

    let offset = 10;
    const limit = Math.min(bytes.length, 10 + tagSize);

    // Skip extended header (v2.3 / v2.4)
    if (version >= 3 && (flags & 0x40) !== 0 && offset + 4 <= limit) {
        const extSize =
            version === 4
                ? ((bytes[offset] & 0x7f) << 21) |
                  ((bytes[offset + 1] & 0x7f) << 14) |
                  ((bytes[offset + 2] & 0x7f) << 7) |
                  (bytes[offset + 3] & 0x7f)
                : ((bytes[offset] << 24) |
                   (bytes[offset + 1] << 16) |
                   (bytes[offset + 2] << 8) |
                   bytes[offset + 3]) + 4;
        offset += extSize;
    }

    while (offset < limit) {
        if (bytes[offset] === 0) break;

        if (version === 2) {
            if (offset + 6 > limit) break;
            const frameId = readAscii(bytes, offset, 3);
            const frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
            const frameStart = offset + 6;
            const frameEnd = Math.min(limit, frameStart + frameSize);
            if (frameSize <= 0) break;

            if (frameId === 'PIC' && frameStart + 6 < frameEnd) {
                const encoding = bytes[frameStart];
                const fmt = readAscii(bytes, frameStart + 1, 3).toUpperCase();
                let pos = frameStart + 5; // encoding + 3-char fmt + picType
                pos = findNullTerminatedEnd(bytes, pos, encoding === 1 || encoding === 2, frameEnd);
                const imgBytes = bytes.slice(pos, frameEnd);
                const mime = sniffImageMime(imgBytes) || (fmt === 'PNG' ? 'image/png' : 'image/jpeg');
                if (imgBytes.length > 32) return new Blob([imgBytes], { type: mime });
            }
            offset = frameEnd;
            continue;
        }

        if (offset + 10 > limit) break;
        const frameId = readAscii(bytes, offset, 4);
        const frameSize =
            version === 4
                ? ((bytes[offset + 4] & 0x7f) << 21) |
                  ((bytes[offset + 5] & 0x7f) << 14) |
                  ((bytes[offset + 6] & 0x7f) << 7) |
                  (bytes[offset + 7] & 0x7f)
                : ((bytes[offset + 4] << 24) |
                   (bytes[offset + 5] << 16) |
                   (bytes[offset + 6] << 8) |
                   bytes[offset + 7]) >>> 0;
        const frameStart = offset + 10;
        const frameEnd = Math.min(limit, frameStart + frameSize);
        if (frameSize <= 0) break;

        if (frameId === 'APIC' && frameStart + 4 < frameEnd) {
            const encoding = bytes[frameStart];
            const mimeEnd = findNullTerminatedEnd(bytes, frameStart + 1, false, frameEnd);
            const rawMime = readAscii(bytes, frameStart + 1, Math.max(0, mimeEnd - (frameStart + 2)));
            let pos = mimeEnd + 1; // +1 picture type
            pos = findNullTerminatedEnd(bytes, pos, encoding === 1 || encoding === 2, frameEnd);
            const imgBytes = bytes.slice(pos, frameEnd);
            const mime = sniffImageMime(imgBytes) || (rawMime.startsWith('image/') ? rawMime : 'image/jpeg');
            if (imgBytes.length > 32) return new Blob([imgBytes], { type: mime });
        }

        offset = frameEnd;
    }

    return null;
};

const parseFlacPictureBlock = (bytes, start, end) => {
    if (start + 32 > end) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let pos = start + 4; // skip picture type
    const mimeLen = view.getUint32(pos, false);
    pos += 4;
    if (pos + mimeLen + 4 > end) return null;
    const mimeRaw = readAscii(bytes, pos, mimeLen);
    pos += mimeLen;
    const descLen = view.getUint32(pos, false);
    pos += 4 + descLen + 16; // desc + width/height/depth/colors (16 bytes)
    if (pos + 4 > end) return null;
    const dataLen = view.getUint32(pos, false);
    pos += 4;
    const imgEnd = Math.min(end, pos + dataLen);
    const imgBytes = bytes.slice(pos, imgEnd);
    const mime = sniffImageMime(imgBytes) || (mimeRaw.startsWith('image/') ? mimeRaw : 'image/jpeg');
    return imgBytes.length > 32 ? new Blob([imgBytes], { type: mime }) : null;
};

const parseFlacCover = (bytes) => {
    if (bytes.length < 8 || readAscii(bytes, 0, 4) !== 'fLaC') return null;
    let offset = 4;
    while (offset + 4 <= bytes.length) {
        const header = bytes[offset];
        const isLast = (header & 0x80) !== 0;
        const blockType = header & 0x7f;
        const blockLen = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
        const blockStart = offset + 4;
        const blockEnd = Math.min(bytes.length, blockStart + blockLen);
        if (blockType === 6) {
            const blob = parseFlacPictureBlock(bytes, blockStart, blockEnd);
            if (blob) return blob;
        }
        if (isLast || blockLen <= 0) break;
        offset = blockEnd;
    }
    return null;
};

const parseMp4Cover = (bytes) => {
    // Scan for "covr" atom followed by inner "data" atom (fast and handles both moov positions)
    for (let i = 4; i + 24 < bytes.length; i += 1) {
        if (
            bytes[i] === 0x63 && // 'c'
            bytes[i + 1] === 0x6f && // 'o'
            bytes[i + 2] === 0x76 && // 'v'
            bytes[i + 3] === 0x72 && // 'r'
            i + 15 < bytes.length &&
            bytes[i + 8] === 0x64 && // 'd'
            bytes[i + 9] === 0x61 && // 'a'
            bytes[i + 10] === 0x74 && // 't'
            bytes[i + 11] === 0x61 // 'a'
        ) {
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            const covrSize = view.getUint32(i - 4, false);
            const dataSize = view.getUint32(i + 4, false);
            if (covrSize >= dataSize && dataSize > 24 && i + 4 + dataSize <= bytes.length) {
                const payloadStart = i + 20; // skip 8-byte data header + 8-byte type/locale
                const payloadEnd = i + 4 + dataSize;
                const imgBytes = bytes.slice(payloadStart, payloadEnd);
                const mime = sniffImageMime(imgBytes);
                if (mime && imgBytes.length > 32) {
                    return new Blob([imgBytes], { type: mime });
                }
            }
        }
    }
    return null;
};

/**
 * Extract embedded cover art Blob from MP3 (ID3v2), FLAC, or M4A/MP4 audio files.
 */
export const extractAudioCoverBlob = async (file) => {
    if (!file || typeof file.slice !== 'function') return null;

    try {
        const headLimit = Math.min(file.size || 0, 2.5 * 1024 * 1024);
        if (headLimit < 32) return null;

        const headBuf = await file.slice(0, headLimit).arrayBuffer();
        const headBytes = new Uint8Array(headBuf);

        if (headBytes[0] === 0x49 && headBytes[1] === 0x44 && headBytes[2] === 0x33) {
            const blob = parseId3Cover(headBytes);
            if (blob) return blob;
        }

        if (readAscii(headBytes, 0, 4) === 'fLaC') {
            const blob = parseFlacCover(headBytes);
            if (blob) return blob;
        }

        const mp4HeadBlob = parseMp4Cover(headBytes);
        if (mp4HeadBlob) return mp4HeadBlob;

        // If MP4/M4A moov box is located at EOF (> 2.5MB)
        const nameLower = String(file.name || '').toLowerCase();
        if (file.size > headLimit && /\.(m4a|mp4|aac|mov|alac)$/i.test(nameLower)) {
            const tailStart = Math.max(0, file.size - 1.5 * 1024 * 1024);
            const tailBuf = await file.slice(tailStart, file.size).arrayBuffer();
            const tailBlob = parseMp4Cover(new Uint8Array(tailBuf));
            if (tailBlob) return tailBlob;
        }
    } catch {
        return null;
    }
    return null;
};

/**
 * Sample an image Blob or URL on an offscreen canvas and return a 3-color dark-rich animated palette.
 */
export const extractPaletteFromImageSource = (srcOrBlob) =>
    new Promise((resolve) => {
        if (!srcOrBlob || typeof document === 'undefined') {
            resolve([]);
            return;
        }

        const isBlob = typeof Blob !== 'undefined' && srcOrBlob instanceof Blob;
        const objectUrl = isBlob ? URL.createObjectURL(srcOrBlob) : '';
        const img = new Image();
        if (!isBlob) {
            img.crossOrigin = 'anonymous';
        }

        let settled = false;
        const finish = (palette) => {
            if (settled) return;
            settled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            resolve(palette);
        };

        const timer = setTimeout(() => finish([]), 3500);

        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 16;
                canvas.height = 16;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    finish([]);
                    return;
                }
                ctx.drawImage(img, 0, 0, 16, 16);
                const { data } = ctx.getImageData(0, 0, 16, 16);

                // Quantize sampled pixels into coarse buckets weighted by chroma & mid-brightness
                const buckets = new Map();
                for (let i = 0; i < data.length; i += 4) {
                    const a = data[i + 3];
                    if (a < 120) continue;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const [, s, l] = rgbToHsl(r, g, b);
                    const weight = (l > 0.08 && l < 0.92 ? 1.2 : 0.4) * (1 + s * 2.5);
                    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
                    const entry = buckets.get(key) || { rSum: 0, gSum: 0, bSum: 0, weight: 0, count: 0 };
                    entry.rSum += r * weight;
                    entry.gSum += g * weight;
                    entry.bSum += b * weight;
                    entry.weight += weight;
                    entry.count += 1;
                    buckets.set(key, entry);
                }

                const sorted = Array.from(buckets.values())
                    .filter((item) => item.weight > 0)
                    .sort((a, b) => b.weight - a.weight);

                if (sorted.length === 0) {
                    finish(['#1d1d24', '#282834', '#141419']);
                    return;
                }

                const chosen = [];
                for (const bucket of sorted) {
                    const avgR = bucket.rSum / bucket.weight;
                    const avgG = bucket.gSum / bucket.weight;
                    const avgB = bucket.bSum / bucket.weight;
                    const tooClose = chosen.some((c) => {
                        const dist = Math.hypot(c[0] - avgR, c[1] - avgG, c[2] - avgB);
                        return dist < 48;
                    });
                    if (!tooClose) {
                        chosen.push([avgR, avgG, avgB]);
                        if (chosen.length === 3) break;
                    }
                }

                if (chosen.length === 1) {
                    const [r, g, b] = chosen[0];
                    chosen.push([clamp(r * 0.72 + 18, 0, 255), clamp(g * 0.72 + 18, 0, 255), clamp(b * 0.72 + 28, 0, 255)]);
                    chosen.push([clamp(r * 0.52, 0, 255), clamp(g * 0.52, 0, 255), clamp(b * 0.52, 0, 255)]);
                } else if (chosen.length === 2) {
                    const [r, g, b] = chosen[0];
                    chosen.push([clamp(r * 0.6, 0, 255), clamp(g * 0.6, 0, 255), clamp(b * 0.6, 0, 255)]);
                }

                const palette = [
                    shapeTone(chosen[0][0], chosen[0][1], chosen[0][2], 0.27, 1.15),
                    shapeTone(chosen[1][0], chosen[1][1], chosen[1][2], 0.34, 1.2),
                    shapeTone(chosen[2][0], chosen[2][1], chosen[2][2], 0.2, 1.05),
                ];
                finish(palette);
            } catch {
                finish([]);
            }
        };

        img.onerror = () => {
            clearTimeout(timer);
            finish([]);
        };

        img.src = objectUrl || srcOrBlob;
    });

/**
 * Extract both a temporary preview ObjectURL/Blob and adaptive color palette from an audio File.
 */
export const createCoverPreviewAndPalette = async (file) => {
    const coverBlob = await extractAudioCoverBlob(file);
    if (!coverBlob) {
        return { coverBlob: null, coverPreviewUrl: '', palette: [] };
    }
    const coverPreviewUrl = URL.createObjectURL(coverBlob);
    const palette = await extractPaletteFromImageSource(coverBlob);
    return { coverBlob, coverPreviewUrl, palette };
};

