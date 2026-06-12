/**
 * gifProcessor.js
 *
 * Client-side animated GIF crop utility.
 *
 * Key fixes vs. naive implementation:
 *  1. Frame compositing uses drawImage (not putImageData) so transparent pixels
 *     correctly show the previous frame instead of clearing it.
 *  2. All four GIF disposal methods are handled correctly.
 *  3. Delay is converted from centiseconds → milliseconds (* 10).
 *  4. gif.js is configured for maximum quality (quality: 1).
 */

import { parseGIF, decompressFrames } from 'gifuct-js';
import GIF from 'gif.js';

/**
 * Crop every frame of an animated GIF and return a cropped Blob.
 *
 * @param {File}   file    Original GIF file
 * @param {number} cropX   Crop origin X in source image pixels
 * @param {number} cropY   Crop origin Y in source image pixels
 * @param {number} cropW   Crop width  in source image pixels
 * @param {number} cropH   Crop height in source image pixels
 * @returns {Promise<Blob>}  Cropped animated GIF blob
 */
export const cropGifClientSide = (file, cropX, cropY, cropW, cropH) => {
    return new Promise(async (resolve, reject) => {
        try {
            // ── 1. Parse & decode ────────────────────────────────────────────
            const arrayBuffer = await file.arrayBuffer();
            const parsedGif   = parseGIF(arrayBuffer);
            // buildImagePatches=true → each frame.patch is RGBA for its sub-rect
            const frames      = decompressFrames(parsedGif, true);

            if (!frames || frames.length === 0) {
                return reject(new Error('GIF içinde kare bulunamadı'));
            }

            const gifWidth  = parsedGif.lsd.width;
            const gifHeight = parsedGif.lsd.height;

            // Clamp crop region to image bounds
            const sx = Math.max(0, Math.round(cropX));
            const sy = Math.max(0, Math.round(cropY));
            const sw = Math.min(Math.max(1, Math.round(cropW)), gifWidth  - sx);
            const sh = Math.min(Math.max(1, Math.round(cropH)), gifHeight - sy);

            if (sw <= 0 || sh <= 0) {
                return reject(new Error('Geçersiz kırpma boyutları'));
            }

            // ── 2. Set up canvases ───────────────────────────────────────────

            // "Accumulator" canvas — tracks the fully composited GIF state
            const accumCanvas  = document.createElement('canvas');
            accumCanvas.width  = gifWidth;
            accumCanvas.height = gifHeight;
            const accumCtx = accumCanvas.getContext('2d');
            accumCtx.clearRect(0, 0, gifWidth, gifHeight);

            // Reusable temp canvas for a single sub-frame patch
            const patchCanvas = document.createElement('canvas');
            const patchCtx    = patchCanvas.getContext('2d');

            // Output canvas for the cropped region
            const cropCanvas  = document.createElement('canvas');
            cropCanvas.width  = sw;
            cropCanvas.height = sh;
            const cropCtx = cropCanvas.getContext('2d');

            // ── 3. gif.js encoder ────────────────────────────────────────────
            const encoder = new GIF({
                workers:      2,
                quality:      1,      // 1 = best quality, 20 = fastest
                width:        sw,
                height:       sh,
                workerScript: '/gif.worker.js',
                transparent:  null,
            });

            // ── 4. Process each frame ────────────────────────────────────────
            let savedImageData = null; // for disposal type 3

            for (const frame of frames) {
                const { patch, dims, delay, disposalType } = frame;

                // Before drawing this frame, save state if disposal will be "restore to previous"
                if (disposalType === 3) {
                    savedImageData = accumCtx.getImageData(0, 0, gifWidth, gifHeight);
                }

                // Draw the sub-frame patch onto a correctly-sized temp canvas …
                patchCanvas.width  = dims.width;
                patchCanvas.height = dims.height;
                patchCtx.clearRect(0, 0, dims.width, dims.height);

                const imageData = new ImageData(
                    new Uint8ClampedArray(patch),
                    dims.width,
                    dims.height
                );
                patchCtx.putImageData(imageData, 0, 0);

                // … then composite onto the accumulator with drawImage.
                // drawImage respects alpha — transparent patch pixels reveal the
                // previous frame, which is what browsers do when rendering GIFs.
                accumCtx.drawImage(patchCanvas, dims.left, dims.top);

                // Crop the composited frame and hand it to the encoder
                cropCtx.clearRect(0, 0, sw, sh);
                cropCtx.drawImage(accumCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

                // delay from gifuct-js is in centiseconds; gif.js wants milliseconds
                const delayMs = (delay || 10) * 10;
                encoder.addFrame(cropCtx, { copy: true, delay: delayMs });

                // Apply disposal method (affects what the NEXT frame sees)
                switch (disposalType) {
                    case 2:
                        // Restore to background color (clear canvas)
                        accumCtx.clearRect(0, 0, gifWidth, gifHeight);
                        break;
                    case 3:
                        // Restore to state before this frame
                        if (savedImageData) {
                            accumCtx.putImageData(savedImageData, 0, 0);
                        }
                        break;
                    // 0 (unspecified) and 1 (do not dispose): leave accumulator as is
                    default:
                        break;
                }
            }

            // ── 5. Encode & resolve ──────────────────────────────────────────
            encoder.on('finished', (blob) => resolve(blob));
            encoder.on('error',    (err)  => reject(err));
            encoder.render();

        } catch (err) {
            reject(err);
        }
    });
};
