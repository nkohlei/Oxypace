import { useEffect, useState } from 'react';
import { X, FileText, Folder, Music, Mic, Video, Youtube } from 'lucide-react';
import { formatDuration, formatFileSize } from '../utils/mediaAttachments';
import './ComposerAttachmentTray.css';

const AudioDraftChip = ({ att, onRemoveAttachment }) => {
    const [coverUrl, setCoverUrl] = useState(att.coverPreviewUrl || '');
    const [palette, setPalette] = useState(att.palette || []);

    useEffect(() => {
        if (att.coverPreviewUrl) {
            setCoverUrl(att.coverPreviewUrl);
        }
        if (Array.isArray(att.palette) && att.palette.length >= 2) {
            setPalette(att.palette);
        }
        let active = true;
        if (!att.isVoiceRecording && att.coverMetaPromise) {
            att.coverMetaPromise.then((res) => {
                if (!active || !res) return;
                if (res.coverPreviewUrl) {
                    att.coverPreviewUrl = res.coverPreviewUrl;
                    setCoverUrl(res.coverPreviewUrl);
                }
                if (Array.isArray(res.palette) && res.palette.length >= 2) {
                    att.palette = res.palette;
                    setPalette(res.palette);
                }
            }).catch(() => {});
        }
        return () => { active = false; };
    }, [att]);

    const chipStyle = !att.isVoiceRecording && palette.length >= 2
        ? {
            background: `linear-gradient(125deg, ${palette[0]}, ${palette[1]})`,
            borderColor: 'rgba(255, 255, 255, 0.24)',
        }
        : undefined;

    return (
        <div
            className={`cat-file-chip ${!att.isVoiceRecording && palette.length >= 2 ? 'has-palette' : ''}`}
            style={chipStyle}
        >
            {coverUrl ? (
                <img src={coverUrl} alt="" className="cat-chip-cover" />
            ) : (
                <div className="cat-chip-icon">
                    {att.isVoiceRecording ? (
                        <Mic size={16} strokeWidth={2} />
                    ) : (
                        <Music size={16} strokeWidth={2} />
                    )}
                </div>
            )}
            <div className="cat-chip-meta">
                <span className="cat-chip-name" title={att.name}>{att.name}</span>
                <span className="cat-chip-sub">
                    {att.isVoiceRecording ? 'SES KAYDI' : (att.badge || 'SES DOSYASI')}
                    {att.duration ? ` • ${formatDuration(att.duration)}` : ''}
                    {` • ${formatFileSize(att.size)}`}
                </span>
            </div>
            <button
                type="button"
                className="cat-chip-del"
                onClick={() => onRemoveAttachment?.(att.id)}
                aria-label="Kaldır"
            >
                <X size={14} strokeWidth={2.2} />
            </button>
        </div>
    );
};

const ComposerAttachmentTray = ({
    attachments = [],
    detectedYouTube = null,
    onRemoveAttachment,
    onClearAll,
}) => {
    if (attachments.length === 0 && !detectedYouTube) return null;

    return (
        <div className="cat-tray">
            {detectedYouTube && (
                <div className="cat-youtube-chip">
                    <div className="cat-yt-thumb-wrap">
                        <img
                            src={`https://img.youtube.com/vi/${detectedYouTube.id}/mqdefault.jpg`}
                            alt="YouTube Önizleme"
                            className="cat-yt-thumb"
                        />
                    </div>
                    <div className="cat-yt-meta">
                        <span className="cat-yt-tag">
                            <Youtube size={12} strokeWidth={2.2} />
                            <span>YouTube Algılandı</span>
                        </span>
                        <span className="cat-yt-url">{detectedYouTube.url}</span>
                    </div>
                </div>
            )}

            {attachments.length > 0 && (
                <div className="cat-items-strip">
                    {attachments.map((att) => {
                        if (att.kind === 'image' || att.kind === 'gif') {
                            return (
                                <div key={att.id} className="cat-thumb-card">
                                    <img src={att.previewUrl} alt={att.name} className="cat-thumb-img" />
                                    {att.kind === 'gif' && <span className="cat-corner-badge">GIF</span>}
                                    <button
                                        type="button"
                                        className="cat-remove-btn"
                                        onClick={() => onRemoveAttachment?.(att.id)}
                                        title="Kaldır"
                                    >
                                        <X size={13} strokeWidth={2.4} />
                                    </button>
                                </div>
                            );
                        }

                        if (att.kind === 'video') {
                            return (
                                <div key={att.id} className="cat-thumb-card is-video">
                                    <video src={att.previewUrl} muted playsInline className="cat-thumb-img" />
                                    <span className="cat-corner-badge">
                                        <Video size={10} />
                                        <span>VİDEO</span>
                                    </span>
                                    <button
                                        type="button"
                                        className="cat-remove-btn"
                                        onClick={() => onRemoveAttachment?.(att.id)}
                                        title="Kaldır"
                                    >
                                        <X size={13} strokeWidth={2.4} />
                                    </button>
                                </div>
                            );
                        }

                        if (att.kind === 'audio') {
                            return (
                                <AudioDraftChip
                                    key={att.id}
                                    att={att}
                                    onRemoveAttachment={onRemoveAttachment}
                                />
                            );
                        }

                        if (att.kind === 'folder') {
                            return (
                                <div key={att.id} className="cat-file-chip">
                                    <div className="cat-chip-icon">
                                        <Folder size={16} strokeWidth={2} />
                                    </div>
                                    <div className="cat-chip-meta">
                                        <span className="cat-chip-name" title={att.folderName || att.name}>
                                            {att.folderName || att.name}
                                        </span>
                                        <span className="cat-chip-sub">
                                            KLASÖR • {att.fileCount} dosya • {formatFileSize(att.size)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="cat-chip-del"
                                        onClick={() => onRemoveAttachment?.(att.id)}
                                        aria-label="Kaldır"
                                    >
                                        <X size={14} strokeWidth={2.2} />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={att.id} className="cat-file-chip">
                                <div className="cat-chip-icon">
                                    <FileText size={16} strokeWidth={2} />
                                </div>
                                <div className="cat-chip-meta">
                                    <span className="cat-chip-name" title={att.name}>{att.name}</span>
                                    <span className="cat-chip-sub">
                                        {att.badge || 'DOSYA'} • {formatFileSize(att.size)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="cat-chip-del"
                                    onClick={() => onRemoveAttachment?.(att.id)}
                                    aria-label="Kaldır"
                                >
                                    <X size={14} strokeWidth={2.2} />
                                </button>
                            </div>
                        );
                    })}

                    {attachments.length > 1 && onClearAll && (
                        <button type="button" className="cat-clear-all-btn" onClick={onClearAll}>
                            Tümünü Temizle ({attachments.length})
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ComposerAttachmentTray;

