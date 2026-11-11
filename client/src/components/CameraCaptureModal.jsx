import { useState, useEffect, useRef, useCallback } from 'react';
import { X, SwitchCamera, Mic, MicOff, RotateCcw, Check, Camera, Video, FolderOpen } from 'lucide-react';
import { formatDuration, formatFileSize } from '../utils/mediaAttachments';
import './CameraCaptureModal.css';

const pickSupportedVideoMime = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
    ];
    for (const mime of candidates) {
        try {
            if (MediaRecorder.isTypeSupported(mime)) return mime;
        } catch (_) {}
    }
    return '';
};

const CameraCaptureModal = ({ isOpen, onClose, onCapture }) => {
    const [mode, setMode] = useState('photo'); // 'photo' | 'video'
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
    const [withAudio, setWithAudio] = useState(true);
    const [streamReady, setStreamReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [capturedItem, setCapturedItem] = useState(null); // { file, url, kind: 'image' | 'video' }

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const mountedRef = useRef(true);
    const nativePhotoFallbackRef = useRef(null);
    const nativeVideoFallbackRef = useRef(null);

    const stopStream = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            try {
                recorderRef.current.stop();
            } catch (_) {}
        }
        recorderRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                try { track.stop(); } catch (_) {}
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setStreamReady(false);
        setIsRecording(false);
    }, []);

    const clearCapturedPreview = useCallback(() => {
        setCapturedItem((prev) => {
            if (prev?.url && prev.url.startsWith('blob:')) {
                try { URL.revokeObjectURL(prev.url); } catch (_) {}
            }
            return null;
        });
    }, []);

    const startCamera = useCallback(async (targetFacing = facingMode, targetMode = mode, enableAudio = withAudio) => {
        stopStream();
        setErrorMsg('');

        if (!navigator?.mediaDevices?.getUserMedia) {
            setErrorMsg('Bu cihaz veya tarayıcı canlı kamera akışını desteklemiyor. Aşağıdan sistem kamerasını kullanabilirsiniz.');
            return;
        }

        const wantAudio = targetMode === 'video' && enableAudio;
        const constraintsList = [
            {
                video: {
                    facingMode: { ideal: targetFacing },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: wantAudio,
            },
            {
                video: { facingMode: targetFacing },
                audio: wantAudio,
            },
            {
                video: true,
                audio: wantAudio,
            },
        ];

        let acquired = null;
        let lastErr = null;
        for (const constraints of constraintsList) {
            try {
                acquired = await navigator.mediaDevices.getUserMedia(constraints);
                if (acquired) break;
            } catch (err) {
                lastErr = err;
            }
        }

        // If mic failed for video, retry video-only cleanly
        if (!acquired && wantAudio) {
            try {
                acquired = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: targetFacing } },
                    audio: false,
                });
            } catch (err) {
                lastErr = err;
            }
        }

        if (!mountedRef.current || !isOpen) {
            if (acquired) acquired.getTracks().forEach((t) => t.stop());
            return;
        }

        if (!acquired) {
            const name = lastErr?.name || '';
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setErrorMsg('Kamera izni verilmedi. Lütfen uygulama ayarlarından kamera iznini etkinleştirin veya sistem kamerasını açın.');
            } else {
                setErrorMsg('Kamera başlatılamadı. Cihaz kamerası başka bir uygulama tarafından kullanılıyor olabilir.');
            }
            return;
        }

        streamRef.current = acquired;
        if (videoRef.current) {
            videoRef.current.srcObject = acquired;
            try {
                await videoRef.current.play();
            } catch (_) {}
        }
        setStreamReady(true);
    }, [facingMode, mode, withAudio, isOpen, stopStream]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            stopStream();
        };
    }, [stopStream]);

    useEffect(() => {
        if (!isOpen) {
            stopStream();
            clearCapturedPreview();
            setRecordingSeconds(0);
            setErrorMsg('');
            return;
        }
        if (!capturedItem) {
            startCamera(facingMode, mode, withAudio);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, facingMode, mode, withAudio]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleClose = () => {
        stopStream();
        clearCapturedPreview();
        onClose?.();
    };

    const handleModeSwitch = (nextMode) => {
        if (isRecording || nextMode === mode) return;
        clearCapturedPreview();
        setMode(nextMode);
    };

    const handleToggleFacing = () => {
        if (isRecording) return;
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    const handleTakePhoto = () => {
        const video = videoRef.current;
        if (!video || !streamReady) return;

        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (facingMode === 'user') {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, w, h);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `oxypace-foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const url = URL.createObjectURL(file);
            stopStream();
            setCapturedItem({ file, url, kind: 'image' });
        }, 'image/jpeg', 0.92);
    };

    const handleStartVideo = () => {
        if (!streamRef.current || isRecording) return;
        const mimeType = pickSupportedVideoMime();
        chunksRef.current = [];

        let recorder;
        try {
            recorder = mimeType
                ? new MediaRecorder(streamRef.current, { mimeType })
                : new MediaRecorder(streamRef.current);
        } catch (err) {
            setErrorMsg('Video kaydı başlatılamadı.');
            return;
        }

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setIsRecording(false);

            const recordedMime = recorder.mimeType || mimeType || 'video/webm';
            const ext = recordedMime.includes('mp4') ? 'mp4' : 'webm';
            const blob = new Blob(chunksRef.current, { type: recordedMime });
            chunksRef.current = [];

            if (blob.size > 0 && mountedRef.current) {
                const file = new File([blob], `oxypace-video-${Date.now()}.${ext}`, { type: recordedMime });
                const url = URL.createObjectURL(file);
                stopStream();
                setCapturedItem({ file, url, kind: 'video' });
            }
        };

        recorderRef.current = recorder;
        recorder.start(250);
        setIsRecording(true);
        setRecordingSeconds(0);
        timerRef.current = setInterval(() => {
            setRecordingSeconds((s) => s + 1);
        }, 1000);
    };

    const handleStopVideo = () => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }
    };

    const handleShutter = () => {
        if (mode === 'photo') {
            handleTakePhoto();
        } else if (isRecording) {
            handleStopVideo();
        } else {
            handleStartVideo();
        }
    };

    const handleRetake = () => {
        clearCapturedPreview();
        setRecordingSeconds(0);
        startCamera(facingMode, mode, withAudio);
    };

    const handleConfirm = () => {
        if (!capturedItem?.file) return;
        const capturedFile = capturedItem.file;
        stopStream();
        clearCapturedPreview();
        onCapture?.(capturedFile);
        onClose?.();
    };

    const handleNativeFallbackFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        stopStream();
        onCapture?.(file);
        onClose?.();
    };

    if (!isOpen) return null;

    return (
        <div className="cam-studio-overlay" role="dialog" aria-modal="true" aria-label="Kamera Stüdyosu">
            <div className="cam-studio-shell">
                {/* Hidden OS fallback inputs */}
                <input
                    ref={nativePhotoFallbackRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleNativeFallbackFile}
                />
                <input
                    ref={nativeVideoFallbackRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleNativeFallbackFile}
                />

                {/* Top Control Bar */}
                <header className="cam-studio-topbar">
                    <button
                        type="button"
                        className="cam-icon-btn"
                        onClick={handleClose}
                        aria-label="Kamerayı Kapat"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>

                    <div className="cam-status-pill">
                        <span className={`cam-status-dot ${isRecording ? 'is-live' : ''}`} />
                        <span className="cam-status-text">
                            {capturedItem
                                ? (capturedItem.kind === 'video' ? 'VİDEO ÖNİZLEME' : 'FOTOĞRAF ÖNİZLEME')
                                : isRecording
                                    ? `KAYIT ${formatDuration(recordingSeconds)}`
                                    : (mode === 'photo' ? 'FOTOĞRAF MODU' : 'VİDEO MODU')}
                        </span>
                    </div>

                    <div className="cam-topbar-right">
                        {!capturedItem && mode === 'video' && !isRecording && (
                            <button
                                type="button"
                                className="cam-icon-btn"
                                onClick={() => setWithAudio((v) => !v)}
                                title={withAudio ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
                                aria-label="Mikrofon"
                            >
                                {withAudio ? <Mic size={18} strokeWidth={2} /> : <MicOff size={18} strokeWidth={2} />}
                            </button>
                        )}
                        {!capturedItem && (
                            <button
                                type="button"
                                className="cam-icon-btn"
                                onClick={handleToggleFacing}
                                disabled={isRecording}
                                title="Kamerayı Çevir"
                                aria-label="Kamerayı Çevir"
                            >
                                <SwitchCamera size={18} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Viewfinder / Preview Stage */}
                <main className="cam-studio-stage">
                    {capturedItem ? (
                        <div className="cam-preview-frame">
                            {capturedItem.kind === 'video' ? (
                                <video
                                    src={capturedItem.url}
                                    controls
                                    playsInline
                                    autoPlay
                                    className="cam-preview-media"
                                />
                            ) : (
                                <img
                                    src={capturedItem.url}
                                    alt="Çekilen fotoğraf"
                                    className="cam-preview-media"
                                />
                            )}
                            <div className="cam-preview-meta-chip">
                                {capturedItem.kind === 'video' ? 'Video' : 'JPEG'} • {formatFileSize(capturedItem.file.size)}
                            </div>
                        </div>
                    ) : errorMsg ? (
                        <div className="cam-error-card">
                            <div className="cam-error-icon">
                                <Camera size={28} strokeWidth={1.7} />
                            </div>
                            <h4 className="cam-error-title">Kamera Erişilemiyor</h4>
                            <p className="cam-error-desc">{errorMsg}</p>
                            <div className="cam-fallback-actions">
                                <button
                                    type="button"
                                    className="cam-fallback-btn"
                                    onClick={() => nativePhotoFallbackRef.current?.click()}
                                >
                                    <Camera size={16} />
                                    <span>Sistem Kamerası (Foto)</span>
                                </button>
                                <button
                                    type="button"
                                    className="cam-fallback-btn"
                                    onClick={() => nativeVideoFallbackRef.current?.click()}
                                >
                                    <Video size={16} />
                                    <span>Sistem Kamerası (Video)</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="cam-viewfinder-box">
                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                autoPlay
                                className={`cam-live-video ${facingMode === 'user' ? 'is-mirrored' : ''}`}
                            />
                            {/* Architectural Silver Corner Guides */}
                            <span className="cam-corner cam-corner-tl" aria-hidden="true" />
                            <span className="cam-corner cam-corner-tr" aria-hidden="true" />
                            <span className="cam-corner cam-corner-bl" aria-hidden="true" />
                            <span className="cam-corner cam-corner-br" aria-hidden="true" />

                            <div className="cam-lens-badge">
                                {facingMode === 'user' ? 'ÖN KAMERA' : 'ARKA KAMERA'}
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Studio Dock */}
                <footer className="cam-studio-dock">
                    {capturedItem ? (
                        <div className="cam-review-actions">
                            <button
                                type="button"
                                className="cam-retake-btn"
                                onClick={handleRetake}
                            >
                                <RotateCcw size={16} strokeWidth={2} />
                                <span>Yeniden Çek</span>
                            </button>
                            <button
                                type="button"
                                className="cam-attach-btn"
                                onClick={handleConfirm}
                            >
                                <Check size={17} strokeWidth={2.4} />
                                <span>Gönderiye Ekle</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="cam-mode-switch" role="tablist" aria-label="Çekim Modu">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === 'photo'}
                                    disabled={isRecording}
                                    className={`cam-mode-tab ${mode === 'photo' ? 'is-active' : ''}`}
                                    onClick={() => handleModeSwitch('photo')}
                                >
                                    <Camera size={14} strokeWidth={2} />
                                    <span>Fotoğraf</span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === 'video'}
                                    disabled={isRecording}
                                    className={`cam-mode-tab ${mode === 'video' ? 'is-active' : ''}`}
                                    onClick={() => handleModeSwitch('video')}
                                >
                                    <Video size={14} strokeWidth={2} />
                                    <span>Video</span>
                                </button>
                            </div>

                            <div className="cam-shutter-row">
                                <button
                                    type="button"
                                    className="cam-side-tool"
                                    onClick={() => (mode === 'photo' ? nativePhotoFallbackRef.current?.click() : nativeVideoFallbackRef.current?.click())}
                                    disabled={isRecording}
                                    title="Cihaz Kamerasını Kullan"
                                >
                                    <FolderOpen size={18} strokeWidth={1.9} />
                                </button>

                                <button
                                    type="button"
                                    className={`cam-shutter-btn ${mode === 'video' ? 'is-video' : ''} ${isRecording ? 'is-recording' : ''}`}
                                    onClick={handleShutter}
                                    disabled={!streamReady}
                                    aria-label={mode === 'photo' ? 'Fotoğraf Çek' : (isRecording ? 'Kaydı Durdur' : 'Kaydı Başlat')}
                                >
                                    <span className="cam-shutter-core" />
                                </button>

                                <button
                                    type="button"
                                    className="cam-side-tool"
                                    onClick={handleToggleFacing}
                                    disabled={isRecording}
                                    title="Kamera Yönünü Değiştir"
                                >
                                    <SwitchCamera size={18} strokeWidth={1.9} />
                                </button>
                            </div>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default CameraCaptureModal;

