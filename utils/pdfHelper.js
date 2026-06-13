import { pdfToPng } from 'pdf-to-png-converter';
import sharp from 'sharp';

/**
 * Generates a compressed JPEG thumbnail from the first page of a PDF.
 * @param {Buffer} pdfBuffer - The buffer of the PDF file.
 * @returns {Promise<Buffer>} - A promise that resolves to the JPEG thumbnail buffer.
 */
export async function generatePdfThumbnail(pdfBuffer) {
    try {
        console.log('[PDF Helper] Starting conversion of PDF first page to PNG');
        const pngPages = await pdfToPng(pdfBuffer, {
            pagesToProcess: [1],
            strictPagesToProcess: false
        });

        if (!pngPages || pngPages.length === 0) {
            throw new Error('No pages returned from PDF converter');
        }

        const firstPage = pngPages[0];
        console.log('[PDF Helper] PNG page conversion complete, optimizing with sharp');

        // Convert the PNG buffer to compressed JPEG
        const optimizedBuffer = await sharp(firstPage.content)
            .resize({ width: 320 }) // Scale down to reasonable width for cover thumbnail
            .jpeg({ quality: 80 })
            .toBuffer();

        console.log('[PDF Helper] Thumbnail optimization complete');
        return optimizedBuffer;
    } catch (error) {
        console.error('[PDF Helper] Error generating PDF thumbnail:', error);
        throw error;
    }
}
