// Pure-JS zero-dependency ZIP Store builder (with UTF-8 filename flag support)
// Bundles a directory selection (FileList with webkitRelativePath) into a standard .zip File.

const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();

const computeCrc32 = (bytes) => {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const toDosTimeAndDate = (ms) => {
    const d = new Date(ms || Date.now());
    const year = Math.max(1980, d.getFullYear()) - 1980;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = Math.floor(d.getSeconds() / 2);

    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    const dosDate = (year << 9) | (month << 5) | day;
    return { dosTime, dosDate };
};

const MAX_FOLDER_ZIP_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB limit

/**
 * Packages selected folder files into a downloadable standard .zip File and metadata summary.
 * @param {FileList|File[]} fileList
 * @returns {Promise<{ zipFile: File, folderName: string, fileCount: number, totalSize: number, folderFiles: Array<{ path: string, size: number, mimeType: string }> }>}
 */
export const buildFolderZipArchive = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f && f.name !== '.DS_Store' && f.name !== 'Thumbs.db');
    if (files.length === 0) {
        throw new Error('Seçilen klasörde yüklenecek dosya bulunamadı.');
    }

    let rawTotalSize = 0;
    for (const f of files) {
        rawTotalSize += f.size || 0;
    }
    if (rawTotalSize > MAX_FOLDER_ZIP_BYTES) {
        throw new Error('Klasör toplam boyutu standart 2 GB sınırını aşıyor.');
    }

    const firstRel = files[0].webkitRelativePath || files[0].name;
    const rootSegment = firstRel.includes('/') ? firstRel.split('/')[0] : 'Klasor';
    const folderName = rootSegment || 'Klasor';

    const encoder = new TextEncoder();
    const localParts = [];
    const centralRecords = [];
    const folderFiles = [];
    let offset = 0;

    for (const file of files) {
        const relPath = (file.webkitRelativePath || `${folderName}/${file.name}`)
            .replace(/\\/g, '/')
            .replace(/^\/+/, '');
        const nameBytes = encoder.encode(relPath);
        const arrayBuf = await file.arrayBuffer();
        const dataBytes = new Uint8Array(arrayBuf);
        const crc = computeCrc32(dataBytes);
        const { dosTime, dosDate } = toDosTimeAndDate(file.lastModified);

        // Local File Header (30 bytes + filename)
        const localHeader = new ArrayBuffer(30);
        const lv = new DataView(localHeader);
        lv.setUint32(0, 0x04034b50, true); // signature
        lv.setUint16(4, 20, true); // version needed (2.0)
        lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
        lv.setUint16(8, 0, true); // compression: 0 (STORE)
        lv.setUint16(10, dosTime, true);
        lv.setUint16(12, dosDate, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, dataBytes.length, true); // compressed size
        lv.setUint32(22, dataBytes.length, true); // uncompressed size
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true); // extra field length

        localParts.push(new Uint8Array(localHeader), nameBytes, dataBytes);

        // Central Directory Header (46 bytes + filename)
        const centralHeader = new ArrayBuffer(46);
        const cv = new DataView(centralHeader);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true); // UTF-8 flag
        cv.setUint16(10, 0, true); // STORE
        cv.setUint16(12, dosTime, true);
        cv.setUint16(14, dosDate, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, dataBytes.length, true);
        cv.setUint32(24, dataBytes.length, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true);
        cv.setUint32(42, offset, true);

        centralRecords.push(new Uint8Array(centralHeader), nameBytes);
        offset += 30 + nameBytes.length + dataBytes.length;

        folderFiles.push({
            path: relPath,
            size: dataBytes.length,
            mimeType: file.type || 'application/octet-stream',
        });
    }

    const centralStart = offset;
    let centralSize = 0;
    for (const part of centralRecords) {
        centralSize += part.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralStart, true);
    ev.setUint16(20, 0, true);

    const zipBlob = new Blob([...localParts, ...centralRecords, new Uint8Array(eocd)], {
        type: 'application/zip',
    });

    if (zipBlob.size > MAX_FOLDER_ZIP_BYTES) {
        throw new Error('Oluşturulan klasör arşivi standart 2 GB sınırını aşıyor.');
    }

    const zipFileName = `${folderName}.zip`;
    const zipFile = new File([zipBlob], zipFileName, { type: 'application/zip' });

    return {
        zipFile,
        folderName,
        fileCount: files.length,
        totalSize: zipFile.size,
        folderFiles: folderFiles.slice(0, 300),
    };
};

