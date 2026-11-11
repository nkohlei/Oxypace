import { useState, useRef } from 'react';
import {
    Play,
    Pause,
    Download,
    FileText,
    Folder,
    ChevronDown,
    ChevronUp,
    Music,
    Film,
    Copy,
    Check,
    Youtube,
    FileSpreadsheet,
    FileCode,
    Archive,
    Presentation,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import { downloadFile as nativeDownloadFile } from '../utils/downloadHelper';
import { formatDuration, formatFileSize, extractYouTubeInfo } from '../utils/mediaAttachments';
import VideoPlayer from './VideoPlayer';
import PostImageGallery from './PostImageGallery';
import './PostAttachments.css';

const FILE_TYPE_META = {
    pptx: { label: 'PowerPoint Sunumu', icon: Presentation },
    ppt: { label: 'PowerPoint Sunumu', icon: Presentation },
    ppsx: { label: 'PowerPoint Gösterisi', icon: Presentation },
    odp: { label: 'Sunum Belgesi', icon: Presentation },
    doc: { label: 'Word Belgesi', icon: FileText },
    docx: { label: 'Word Belgesi', icon: FileText },
    odt: { label: 'Metin Belgesi', icon: FileText },
    rtf: { label: 'Zengin Metin Belgesi', icon: FileText },
    xls: { label: 'Excel Tablosu', icon: FileSpreadsheet },
    xlsx: { label: 'Excel Tablosu', icon: FileSpreadsheet },
    xlsm: { label: 'Excel Makrolu Tablo', icon: FileSpreadsheet },
    ods: { label: 'Hesap Tablosu', icon: FileSpreadsheet },
    csv: { label: 'CSV Veri Tablosu', icon: FileSpreadsheet },
    html: { label: 'HTML Web Belgesi', icon: FileCode },
    htm: { label: 'HTML Web Belgesi', icon: FileCode },
    css: { label: 'CSS Stil Dosyası', icon: FileCode },
    js: { label: 'JavaScript Dosyası', icon: FileCode },
    jsx: { label: 'React JSX Dosyası', icon: FileCode },
    ts: { label: 'TypeScript Dosyası', icon: FileCode },
    json: { label: 'JSON Veri Dosyası', icon: FileCode },
    xml: { label: 'XML Belgesi', icon: FileCode },
    py: { label: 'Python Betiği', icon: FileCode },
    zip: { label: 'ZIP Arşivi', icon: Archive },
    rar: { label: 'RAR Arşivi', icon: Archive },
    '7z': { label: '7z Arşivi', icon: Archive },
    tar: { label: 'TAR Arşivi', icon: Archive },
    gz: { label: 'GZip Arşivi', icon: Archive },
    txt: { label: 'Düz Metin Belgesi', icon: FileText },
    md: { label: 'Markdown Belgesi', icon: FileText },
    pdf: { label: 'PDF Belgesi', icon: FileText },
};

const InlineYouTubeFacade = ({ url, youtubeId }) => {
    const [active, setActive] = useState(false);
    const id = youtubeId || extractYouTubeInfo(url)?.id;
    if (!id) return null;

    return (
        <div className="pa-youtube-card" onClick={(e) => e.stopPropagation()}>
            {!active ? (
                <button
                    type="button"
                    className="pa-youtube-poster-btn"
                    onClick={() => setActive(true)}
                    aria-label="YouTube Videosunu Oynat"
                >
                    <img
                        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                        alt="YouTube Videosu"
                        className="pa-youtube-poster-img"
                        loading="lazy"
                    />
                    <span className="pa-youtube-play-badge">
                        <Youtube size={22} strokeWidth={2} />
                        <span>Oynat</span>
                    </span>
                </button>
            ) : (
                <iframe
                    className="pa-youtube-iframe"
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            )}
        </div>
    );
};

const AudioAttachmentCard = ({ att }) => {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(att.duration || 0);

    const src = getImageUrl(att.url);

    const togglePlay = (e) => {
        e.stopPropagation();
        const el = audioRef.current;
        if (!el) return;
        if (playing) {
            el.pause();
            setPlaying(false);
        } else {
            el.play().then(() => setPlaying(true)).catch(() => {});
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const next = Number(e.target.value) || 0;
        if (audioRef.current) {
            audioRef.current.currentTime = next;
        }
        setCurrentTime(next);
    };

    const extLabel = (att.ext || '.audio').replace('.', '').toUpperCase() || 'SES';
    const totalDur = duration || 0;

    return (
        <div className="pa-audio-card" onClick={(e) => e.stopPropagation()}>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (Number.isFinite(d) && d > 0) setDuration(d);
                }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
                onEnded={() => {
                    setPlaying(false);
                    setCurrentTime(0);
                }}
            />

            <button
                type="button"
                className="pa-audio-play-btn"
                onClick={togglePlay}
                aria-label={playing ? 'Duraklat' : 'Oynat'}
            >
                {playing ? <Pause size={16} strokeWidth={2.3} /> : <Play size={16} strokeWidth={2.3} />}
            </button>

            <div className="pa-audio-center">
                <div className="pa-audio-top">
                    <span className="pa-audio-name" title={att.name || 'Ses Kaydı'}>
                        <Music size={12} strokeWidth={2} />
                        <span>{att.name || 'Ses Kaydı'}</span>
                    </span>
                    <span className="pa-audio-badge">{extLabel}</span>
                </div>

                <input
                    type="range"
                    min={0}
                    max={Math.max(1, totalDur)}
                    step={0.1}
                    value={Math.min(currentTime, Math.max(1, totalDur))}
                    onChange={handleSeek}
                    className="pa-audio-scrubber"
                    aria-label="Ses konumu"
                />

                <div className="pa-audio-meta">
                    <span>
                        {formatDuration(currentTime)} / {formatDuration(totalDur)}
                    </span>
                    {att.size > 0 && <span>{formatFileSize(att.size)}</span>}
                </div>
            </div>

            <button
                type="button"
                className="pa-download-icon-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    nativeDownloadFile(src, att.name || `ses.${extLabel.toLowerCase()}`);
                }}
                title="Ses Dosyasını İndir"
                aria-label="İndir"
            >
                <Download size={16} strokeWidth={2} />
            </button>
        </div>
    );
};

const FolderAttachmentCard = ({ att }) => {
    const [expanded, setExpanded] = useState(false);
    const files = Array.isArray(att.folderFiles) ? att.folderFiles : [];
    const folderLabel = att.folderName || (att.name ? att.name.replace(/\.zip$/i, '') : 'Klasör');
    const src = getImageUrl(att.url);

    return (
        <div className="pa-folder-card" onClick={(e) => e.stopPropagation()}>
            <div className="pa-folder-row">
                <div className="pa-doc-badge-box">
                    <Folder size={20} strokeWidth={1.9} />
                    <span>KLASÖR</span>
                </div>

                <div className="pa-doc-info">
                    <span className="pa-doc-name" title={folderLabel}>{folderLabel}</span>
                    <span className="pa-doc-sub">
                        {att.fileCount || files.length || 0} dosya • {formatFileSize(att.size)}
                    </span>
                </div>

                <div className="pa-folder-actions">
                    {files.length > 0 && (
                        <button
                            type="button"
                            className="pa-folder-toggle-btn"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            <span>{expanded ? 'Gizle' : 'İçerik'}</span>
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}

                    <button
                        type="button"
                        className="pa-download-icon-btn"
                        onClick={() => nativeDownloadFile(src, att.name || `${folderLabel}.zip`)}
                        title="Klasörü Arşiv Olarak İndir (.zip)"
                        aria-label="İndir"
                    >
                        <Download size={16} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {expanded && files.length > 0 && (
                <div className="pa-folder-tree custom-scrollbar">
                    {files.map((item, idx) => (
                        <div key={`${item.path}-${idx}`} className="pa-folder-file-row">
                            <span className="pa-folder-file-path" title={item.path}>{item.path}</span>
                            <span className="pa-folder-file-size">{formatFileSize(item.size)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const DocumentAttachmentCard = ({ att }) => {
    const rawName = att.name || 'Belge';
    const ext = (att.ext || (rawName.includes('.') ? '.' + rawName.split('.').pop() : ''))
        .replace('.', '')
        .toLowerCase();
    const extUpper = ext ? ext.toUpperCase() : 'DOSYA';
    const meta = FILE_TYPE_META[ext] || { label: 'Dosya Eki', icon: FileText };
    const IconComp = meta.icon;
    const src = getImageUrl(att.url);

    return (
        <div
            className="pa-doc-card"
            onClick={(e) => {
                e.stopPropagation();
                nativeDownloadFile(src, rawName);
            }}
        >
            {att.kind === 'pdf' && att.thumbnailUrl ? (
                <div className="pa-pdf-thumb-box">
                    <img
                        src={getImageUrl(att.thumbnailUrl)}
                        alt={rawName}
                        className="pa-pdf-thumb-img"
                        loading="lazy"
                    />
                    <span className="pa-pdf-thumb-tag">PDF</span>
                </div>
            ) : (
                <div className="pa-doc-badge-box">
                    <IconComp size={19} strokeWidth={1.9} />
                    <span>{extUpper.slice(0, 5)}</span>
                </div>
            )}

            <div className="pa-doc-info">
                <span className="pa-doc-name" title={rawName}>{rawName}</span>
                <span className="pa-doc-sub">
                    {meta.label}
                    {att.size > 0 ? ` • ${formatFileSize(att.size)}` : ''}
                </span>
            </div>

            <button
                type="button"
                className="pa-download-icon-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    nativeDownloadFile(src, rawName);
                }}
                title="Dosyayı İndir"
                aria-label="İndir"
            >
                <Download size={16} strokeWidth={2} />
            </button>
        </div>
    );
};

const PostAttachments = ({
    post,
    showVideoIdBadge = true,
    onCopyVideoId,
    copiedVideoId = false,
}) => {
    const attachments = Array.isArray(post?.attachments) ? post.attachments : [];
    if (attachments.length === 0) return null;

    const visualItems = attachments.filter((a) => a.kind === 'image' || a.kind === 'gif');
    const videoItems = attachments.filter((a) => a.kind === 'video' || a.kind === 'videoUrl');
    const youtubeItems = attachments.filter((a) => a.kind === 'youtube');
    const audioItems = attachments.filter((a) => a.kind === 'audio');
    const pdfItems = attachments.filter((a) => a.kind === 'pdf');
    const fileItems = attachments.filter((a) => a.kind === 'file');
    const folderItems = attachments.filter((a) => a.kind === 'folder');

    return (
        <div className="pa-stack" onClick={(e) => e.stopPropagation()}>
            {/* Visual Photos / GIFs Gallery */}
            {visualItems.length > 0 && (
                <div className="pa-visual-wrap">
                    <PostImageGallery media={visualItems.map((v) => v.url)} />
                </div>
            )}

            {/* Video Players */}
            {videoItems.map((vid, idx) => {
                const isFirst = idx === 0;
                const videoSrc = vid.kind === 'videoUrl' ? vid.url : getImageUrl(vid.url);
                const posterSrc = vid.thumbnailUrl
                    ? getImageUrl(vid.thumbnailUrl)
                    : (isFirst && post.videoThumbnail ? getImageUrl(post.videoThumbnail) : null);

                return (
                    <div key={`vid-${idx}`} className="pa-video-wrap">
                        <VideoPlayer
                            src={videoSrc}
                            poster={posterSrc}
                            qualities={isFirst ? post.videoQualities : undefined}
                            videoUrl={isFirst ? (vid.kind === 'videoUrl' ? vid.url : getImageUrl(post.videoUrl || vid.url)) : videoSrc}
                            lowVideoUrl={isFirst ? getImageUrl(post.lowVideoUrl) : undefined}
                            video144={isFirst ? getImageUrl(post.video144) : ''}
                            video360={isFirst ? getImageUrl(post.video360) : ''}
                            video720={isFirst ? getImageUrl(post.video720) : ''}
                            video1080={isFirst ? getImageUrl(post.video1080) : ''}
                            video1440={isFirst ? getImageUrl(post.video1440) : ''}
                            video2160={isFirst ? getImageUrl(post.video2160) : ''}
                            originalHeight={isFirst ? post.videoOriginalHeight : undefined}
                            className="post-video-player"
                            isProcessing={isFirst ? Boolean(post.isProcessing) : false}
                            processingProgress={isFirst ? post.processingProgress : 100}
                            processingStage={isFirst ? post.processingStage : ''}
                            estimatedTime={isFirst ? post.estimatedTime : ''}
                        />
                        {isFirst && showVideoIdBadge && onCopyVideoId && (
                            <div className="post-video-id-wrapper">
                                <span
                                    className="post-video-id-badge"
                                    onClick={onCopyVideoId}
                                    title="Birlikte İzle için Video ID'sini Kopyala"
                                >
                                    <Film size={12} className="video-id-icon" />
                                    <span className="video-id-label">Video ID:</span>
                                    <code className="video-id-val">{post._id}</code>
                                    {copiedVideoId ? <Check size={12} color="#10b981" /> : <Copy size={12} className="copy-icon" />}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* YouTube Cards */}
            {youtubeItems.map((yt, idx) => (
                <InlineYouTubeFacade key={`yt-${idx}`} url={yt.url} youtubeId={yt.youtubeId} />
            ))}

            {/* Audio Players */}
            {audioItems.map((aud, idx) => (
                <AudioAttachmentCard key={`aud-${idx}`} att={aud} />
            ))}

            {/* PDF Cards */}
            {pdfItems.map((pdf, idx) => (
                <DocumentAttachmentCard
                    key={`pdf-${idx}`}
                    att={{
                        ...pdf,
                        thumbnailUrl: pdf.thumbnailUrl || (idx === 0 ? post.pdfThumbnailUrl : ''),
                    }}
                />
            ))}

            {/* Office / Web / Code / Archive Files */}
            {fileItems.map((file, idx) => (
                <DocumentAttachmentCard key={`file-${idx}`} att={file} />
            ))}

            {/* Folder Cards */}
            {folderItems.map((folder, idx) => (
                <FolderAttachmentCard key={`folder-${idx}`} att={folder} />
            ))}
        </div>
    );
};

export default PostAttachments;

