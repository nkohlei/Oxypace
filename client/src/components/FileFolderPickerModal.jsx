import { useRef, useState } from 'react';
import { X, FileText, FolderOpen, Upload } from 'lucide-react';
import { buildFolderZipArchive } from '../utils/folderZip';
import { MAX_FILE_SIZE_LABEL } from '../utils/mediaAttachments';
import './FileFolderPickerModal.css';

const traverseDroppedEntry = async (entry, basePath = '') => {
    const collected = [];
    if (!entry) return collected;

    if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        const rel = basePath ? `${basePath}/${file.name}` : file.name;
        try {
            Object.defineProperty(file, 'webkitRelativePath', { value: rel, configurable: true });
        } catch (_) {}
        collected.push(file);
    } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const folderRel = basePath ? `${basePath}/${entry.name}` : entry.name;
        const readAll = async () => {
            const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
            if (batch.length === 0) return [];
            const more = await readAll();
            return [...batch, ...more];
        };
        const entries = await readAll();
        for (const child of entries) {
            const nested = await traverseDroppedEntry(child, folderRel);
            collected.push(...nested);
        }
    }
    return collected;
};

const FileFolderPickerModal = ({ isOpen, onClose, onFilesSelected, onFolderPackaged }) => {
    const anyFileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const [packingFolder, setPackingFolder] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleFilesChange = (e) => {
        const list = Array.from(e.target.files || []);
        e.target.value = '';
        if (list.length === 0) return;
        setErrorMsg('');
        onFilesSelected?.(list);
        onClose?.();
    };

    const handleFolderChange = async (e) => {
        const list = Array.from(e.target.files || []);
        e.target.value = '';
        if (list.length === 0) return;
        setErrorMsg('');
        setPackingFolder(true);
        try {
            const packaged = await buildFolderZipArchive(list);
            onFolderPackaged?.(packaged);
            onClose?.();
        } catch (err) {
            setErrorMsg(err?.message || 'Klasör paketlenirken bir hata oluştu.');
        } finally {
            setPackingFolder(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        setErrorMsg('');

        const items = Array.from(e.dataTransfer?.items || []);
        const entries = items
            .map((item) => (typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null))
            .filter(Boolean);

        const dirEntry = entries.find((entry) => entry.isDirectory);
        if (dirEntry) {
            setPackingFolder(true);
            try {
                const nestedFiles = await traverseDroppedEntry(dirEntry, '');
                const packaged = await buildFolderZipArchive(nestedFiles);
                onFolderPackaged?.(packaged);
                onClose?.();
            } catch (err) {
                setErrorMsg(err?.message || 'Klasör paketlenemedi.');
            } finally {
                setPackingFolder(false);
            }
            return;
        }

        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        if (droppedFiles.length > 0) {
            onFilesSelected?.(droppedFiles);
            onClose?.();
        }
    };

    return (
        <div className="ffp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Dosya veya Klasör Seç">
            <div className="ffp-card" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={anyFileInputRef}
                    type="file"
                    multiple
                    accept="*/*"
                    style={{ display: 'none' }}
                    onChange={handleFilesChange}
                />
                <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    webkitdirectory=""
                    directory=""
                    style={{ display: 'none' }}
                    onChange={handleFolderChange}
                />

                <header className="ffp-header">
                    <div className="ffp-title-wrap">
                        <span className="ffp-eyebrow">BELGE • SES • KLASÖR</span>
                        <h3 className="ffp-heading">Dosya veya Klasör Ekle</h3>
                    </div>
                    <button
                        type="button"
                        className="ffp-close-btn"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className="ffp-body">
                    {errorMsg && (
                        <div className="ffp-error-banner">{errorMsg}</div>
                    )}

                    <div
                        className={`ffp-dropzone ${dragOver ? 'is-drag' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <Upload size={22} strokeWidth={1.8} className="ffp-drop-icon" />
                        <span className="ffp-drop-title">
                            {packingFolder ? 'Klasör arşivleniyor...' : 'Dosya veya klasörü buraya bırakın'}
                        </span>
                        <span className="ffp-drop-sub">
                            .pptx, .doc, .docx, .xlsx, .html, .pdf, .mp3, .wav, .zip ve tüm formatlar desteklenir
                        </span>
                    </div>

                    <div className="ffp-choice-grid">
                        <button
                            type="button"
                            className="ffp-choice-tile"
                            disabled={packingFolder}
                            onClick={() => anyFileInputRef.current?.click()}
                        >
                            <div className="ffp-choice-icon">
                                <FileText size={20} strokeWidth={1.9} />
                            </div>
                            <div className="ffp-choice-copy">
                                <span className="ffp-choice-title">Dosya Seç</span>
                                <span className="ffp-choice-desc">Belge, ses veya arşiv</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="ffp-choice-tile"
                            disabled={packingFolder}
                            onClick={() => folderInputRef.current?.click()}
                        >
                            <div className="ffp-choice-icon">
                                <FolderOpen size={20} strokeWidth={1.9} />
                            </div>
                            <div className="ffp-choice-copy">
                                <span className="ffp-choice-title">
                                    {packingFolder ? 'Hazırlanıyor...' : 'Klasör Seç'}
                                </span>
                                <span className="ffp-choice-desc">İçeriğiyle klasör ekle</span>
                            </div>
                        </button>
                    </div>

                    <div className="ffp-limit-note">
                        Standart dosya ve klasör yükleme sınırı: <strong>{MAX_FILE_SIZE_LABEL}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileFolderPickerModal;

