/**
 * gifProcessor.js
 *
 * Client-side animated GIF crop utility.
 * Uses gifuct-js to decode frames and gif.js to re-encode the cropped result.
 * Everything runs in the browser — no server round-trip, no Netlify timeout.
 */

import { parseGIF, decompressFrames } from 'gifuct-js';
import GIF from 'gif.js';

/**
 * Fetch and parse the GIF into decompressed frames.
 * @param {File} file  The GIF File object selected by the user.
 * @returns {Promise<{ frames: object[], width: number, height: number }>}
 */
const loadGifFrames = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const gif = parseGIF(arrayBuffer);
    const frames = decompressFrames(gif, true); // true = patch full frames
    return {
        frames,
        width: gif.lsd.width,
        height: gif.lsd.height,
    };
};

/**
 * Crop every frame of an animated GIF and return a cropped Blob.
 *
 * @param {File}   file       Original GIF file
 * @param {number} cropX      Crop origin X in source image coordinates
 * @param {number} cropY      Crop origin Y in source image coordinates
 * @param {number} cropW      Crop width  in source image coordinates
 * @param {number} cropH      Crop height in source image coordinates
 * @returns {Promise<Blob>}   Cropped animated GIF as a Blob
 */
export const cropGifClientSide = (file, cropX, cropY, cropW, cropH) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { frames, width: gifWidth, height: gifHeight } = await loadGifFrames(file);

            // Clamp crop to image bounds
            const sx = Math.max(0, Math.round(cropX));
            const sy = Math.max(0, Math.round(cropY));
            const sw = Math.min(Math.round(cropW), gifWidth  - sx);
            const sh = Math.min(Math.round(cropH), gifHeight - sy);

            if (sw <= 0 || sh <= 0) {
                return reject(new Error('Geçersiz kırpma boyutları'));
            }

            // Canvas for compositing individual frames
            const frameCanvas  = document.createElement('canvas');
            frameCanvas.width  = gifWidth;
            frameCanvas.height = gifHeight;
            const frameCtx = frameCanvas.getContext('2d');

            // Canvas for the final cropped output
            const cropCanvas  = document.createElement('canvas');
            cropCanvas.width  = sw;
            cropCanvas.height = sh;
            const cropCtx = cropCanvas.getContext('2d');

            // gif.js encoder — uses a Worker script bundled from node_modules
            const encoder = new GIF({
                workers: 2,
                quality: 10,          // 1 = best, 20 = fastest
                width:  sw,
                height: sh,
                workerScript: '/gif.worker.js', // copied by Vite plugin / public dir
                transparent: null,
            });

            // Composite each frame onto a full-size canvas, then crop
            for (const frame of frames) {
                const { patch, dims, delay, disposalType } = frame;

                // Clear or keep previous frame based on disposal method
                if (disposalType === 2) {
                    frameCtx.clearRect(0, 0, gifWidth, gifHeight);
                }

                // Draw this frame's patch at its offset
                const imageData = new ImageData(
                    new Uint8ClampedArray(patch),
                    dims.width,
                    dims.height
                );
                frameCtx.putImageData(imageData, dims.left, dims.top);

                // Crop the composited frame
                cropCtx.clearRect(0, 0, sw, sh);
                cropCtx.drawImage(frameCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

                encoder.addFrame(cropCtx, {
                    copy: true,
                    delay: delay || 100,
                });
            }

            encoder.on('finished', (blob) => resolve(blob));
            encoder.on('error',    (err)  => reject(err));
            encoder.render();

        } catch (err) {
            reject(err);
        }
    });
};
