import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Square, Pause, Play, RotateCcw, Check, FolderOpen } from 'lucide-react';
import { formatDuration, formatFileSize } from '../utils/mediaAttachments';
import './AudioRecorderPopover.css';

const pickSupportedAudioMime = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
    ];
    for (const mime of candidates) {
        try {
            if (MediaRecorder.isTypeSupported(mime)) return mime;
        } catch (_) {}
    }
    return '';
};

const AudioRecorderPopover = ({ isOpen, onClose, onAttach }) => {
    const [phase, setPhase] = useState('idle'); // 'idle' | 'recording' | 'paused' | 'preview'
    const [elapsedSec, setElapsedSec] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [recordedData, setRecordedData] = useState(null); // { file, url, duration }

    // Preview player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSec, setPlaybackSec] = useState(0);

    const streamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);
    const canvasRef = useRef(null);
    const previewAudioRef = useRef(null);
    const audioFileInputRef = useRef(null);
    const elapsedRef = useRef(0);

    const stopVisualizer = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch (_) {}
            audioCtxRef.current = null;
        }
        analyserRef.current = null;
    }, []);

    const stopTracksAndTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            try { recorderRef.current.stop(); } catch (_) {}
        }
        recorderRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => {
                try { t.stop(); } catch (_) {}
            });
            streamRef.current = null;
        }
        stopVisualizer();
    }, [stopVisualizer]);

    const clearRecordedPreview = useCallback(() => {
        if (previewAudioRef.current) {
            try { previewAudioRef.current.pause(); } catch (_) {}
        }
        setIsPlaying(false);
        setPlaybackSec(0);
        setRecordedData((prev) => {
            if (prev?.url && prev.url.startsWith('blob:')) {
                try { URL.revokeObjectURL(prev.url); } catch (_) {}
            }
            return null;
        });
    }, []);

    const drawIdleBars = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        const barCount = 34;
        const gap = 4;
        const barW = Math.max(2, (width - gap * (barCount - 1)) / barCount);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        for (let i = 0; i < barCount; i++) {
            const h = 6;
            const x = i * (barW + gap);
            const y = (height - h) / 2;
            ctx.fillRect(x, y, barW, h);
        }
    }, []);

    const runVisualizerLoop = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        const bufferLen = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLen);
        const barCount = 34;
        const gap = 4;

        const render = () => {
            if (!analyserRef.current || !canvasRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            const { width, height } = canvasRef.current;
            ctx.clearRect(0, 0, width, height);
            const barW = Math.max(2, (width - gap * (barCount - 1)) / barCount);
            const step = Math.max(1, Math.floor(bufferLen / barCount));

            for (let i = 0; i < barCount; i++) {
                const raw = dataArray[i * step] || 0;
                const ratio = raw / 255;
                const barH = Math.max(6, Math.round(ratio * (height - 12)));
                const x = i * (barW + gap);
                const y = (height - barH) / 2;
                ctx.fillStyle = ratio > 0.35 ? '#ffffff' : 'rgba(212, 212, 216, 0.55)';
                ctx.fillRect(x, y, barW, barH);
            }
            rafRef.current = requestAnimationFrame(render);
        };
        rafRef.current = requestAnimationFrame(render);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            stopTracksAndTimer();
            clearRecordedPreview();
            setPhase('idle');
            setElapsedSec(0);
            elapsedRef.current = 0;
            setErrorMsg('');
            return;
        }
        drawIdleBars();
    }, [isOpen, stopTracksAndTimer, clearRecordedPreview, drawIdleBars]);

    useEffect(() => {
        return () => {
            stopTracksAndTimer();
        };
    }, [stopTracksAndTimer]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleClose = () => {
        stopTracksAndTimer();
        clearRecordedPreview();
        onClose?.();
    };

    const startRecording = async () => {
        setErrorMsg('');
        clearRecordedPreview();

        if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setErrorMsg('Bu cihaz veya tarayıcı ses kaydını desteklemiyor. Cihazdan ses dosyası seçebilirsiniz.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioCtx();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 128;
                source.connect(analyser);
                audioCtxRef.current = audioCtx;
                analyserRef.current = analyser;
                runVisualizerLoop();
            } catch (_) {}

            const mimeType = pickSupportedAudioMime();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const usedMime = recorder.mimeType || mimeType || 'audio/webm';
                const ext = usedMime.includes('mp4') ? 'm4a' : (usedMime.includes('ogg') ? 'ogg' : 'webm');
                const blob = new Blob(chunksRef.current, { type: usedMime });
                chunksRef.current = [];
                const finalDur = Math.max(1, elapsedRef.current);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                    streamRef.current = null;
                }
                stopVisualizer();

                if (blob.size > 0) {
                    const file = new File([blob], `ses-kaydi-${Date.now()}.${ext}`, { type: usedMime });
                    const url = URL.createObjectURL(file);
                    setRecordedData({ file, url, duration: finalDur });
                    setPhase('preview');
                } else {
                    setPhase('idle');
                    drawIdleBars();
                }
            };

            recorderRef.current = recorder;
            recorder.start(200);
            elapsedRef.current = 0;
            setElapsedSec(0);
            setPhase('recording');

            timerRef.current = setInterval(() => {
                elapsedRef.current += 1;
                setElapsedSec(elapsedRef.current);
            }, 1000);
        } catch (err) {
            const name = err?.name || '';
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setErrorMsg('Mikrofon izni verilmedi. Ses kaydı için izin verin veya cihazdan ses dosyası yükleyin.');
            } else {
                setErrorMsg('Mikrofon başlatılamadı.');
            }
        }
    };

    const togglePauseResume = () => {
        const rec = recorderRef.current;
        if (!rec || typeof rec.pause !== 'function') return;
        if (phase === 'recording' && rec.state === 'recording') {
            rec.pause();
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase('paused');
        } else if (phase === 'paused' && rec.state === 'paused') {
            rec.resume();
            timerRef.current = setInterval(() => {
                elapsedRef.current += 1;
                setElapsedSec(elapsedRef.current);
            }, 1000);
            setPhase('recording');
        }
    };

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }
    };

    const handleReset = () => {
        clearRecordedPreview();
        setElapsedSec(0);
        elapsedRef.current = 0;
        setPhase('idle');
        setTimeout(() => drawIdleBars(), 0);
    };

    const handleConfirmAttach = () => {
        if (!recordedData?.file) return;
        const fileToAttach = recordedData.file;
        const dur = recordedData.duration;
        stopTracksAndTimer();
        clearRecordedPreview();
        onAttach?.(fileToAttach, { duration: dur });
        onClose?.();
    };

    const handlePickAudioFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        stopTracksAndTimer();
        clearRecordedPreview();
        onAttach?.(file, {});
        onClose?.();
    };

    const togglePreviewPlay = () => {
        const audio = previewAudioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    if (!isOpen) return null;

    const totalPreviewDur = recordedData?.duration || elapsedSec || 1;
    const progressPct = Math.min(100, Math.round((playbackSec / Math.max(1, totalPreviewDur)) * 100));

    return (
        <div className="audio-pop-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-label="Ses Kaydı">
            <div className="audio-pop-card" onClick={(e) => e.stopPropagation()}>
                <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.webm,.wma,.amr"
                    style={{ display: 'none' }}
                    onChange={handlePickAudioFile}
                />

                <header className="audio-pop-header">
                    <div className="audio-pop-title-wrap">
                        <span className="audio-pop-eyebrow">SES STÜDYOSU</span>
                        <h3 className="audio-pop-heading">Ses Kaydı Oluştur</h3>
                    </div>
                    <button
                        type="button"
                        className="audio-pop-close"
                        onClick={handleClose}
                        aria-label="Kapat"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className="audio-pop-body">
                    {errorMsg && (
                        <div className="audio-pop-error">
                            {errorMsg}
                        </div>
                    )}

                    {/* Studio Meter Stage */}
                    <div className="audio-meter-box">
                        <div className="audio-meter-top">
                            <span className={`audio-state-badge ${phase === 'recording' ? 'is-live' : ''}`}>
                                {phase === 'idle' && 'HAZIR'}
                                {phase === 'recording' && 'KAYIT ALINIYOR'}
                                {phase === 'paused' && 'DURAKLATILDI'}
                                {phase === 'preview' && 'KAYIT TAMAMLANDI'}
                            </span>
                            <span className="audio-timer-readout">
                                {formatDuration(phase === 'preview' ? (isPlaying ? playbackSec : recordedData?.duration) : elapsedSec)}
                            </span>
                        </div>

                        {phase === 'preview' && recordedData ? (
                            <div className="audio-preview-deck">
                                <audio
                                    ref={previewAudioRef}
                                    src={recordedData.url}
                                    onTimeUpdate={(e) => setPlaybackSec(e.target.currentTime || 0)}
                                    onEnded={() => {
                                        setIsPlaying(false);
                                        setPlaybackSec(0);
                                    }}
                                />
                                <button
                                    type="button"
                                    className="audio-play-toggle"
                                    onClick={togglePreviewPlay}
                                    aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
                                >
                                    {isPlaying ? <Pause size={16} strokeWidth={2.2} /> : <Play size={16} strokeWidth={2.2} />}
                                </button>
                                <div className="audio-progress-wrap">
                                    <div className="audio-progress-track">
                                        <div className="audio-progress-fill" style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <div className="audio-file-submeta">
                                        <span>{recordedData.file.name}</span>
                                        <span>{formatFileSize(recordedData.file.size)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <canvas
                                ref={canvasRef}
                                width={340}
                                height={64}
                                className="audio-wave-canvas"
                            />
                        )}
                    </div>

                    {/* Transport Controls */}
                    {phase === 'idle' && (
                        <div className="audio-actions-stack">
                            <button
                                type="button"
                                className="audio-primary-btn"
                                onClick={startRecording}
                            >
                                <Mic size={17} strokeWidth={2.2} />
                                <span>Kaydı Başlat</span>
                            </button>

                            <button
                                type="button"
                                className="audio-secondary-btn"
                                onClick={() => audioFileInputRef.current?.click()}
                            >
                                <FolderOpen size={16} strokeWidth={2} />
                                <span>Cihazdan Ses Dosyası Seç</span>
                            </button>
                        </div>
                    )}

                    {(phase === 'recording' || phase === 'paused') && (
                        <div className="audio-transport-row">
                            <button
                                type="button"
                                className="audio-secondary-btn"
                                onClick={togglePauseResume}
                            >
                                {phase === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                                <span>{phase === 'paused' ? 'Devam Et' : 'Duraklat'}</span>
                            </button>
                            <button
                                type="button"
                                className="audio-primary-btn"
                                onClick={stopRecording}
                            >
                                <Square size={15} strokeWidth={2.2} />
                                <span>Kaydı Bitir</span>
                            </button>
                        </div>
                    )}

                    {phase === 'preview' && (
                        <div className="audio-transport-row">
                            <button
                                type="button"
                                className="audio-secondary-btn"
                                onClick={handleReset}
                            >
                                <RotateCcw size={16} strokeWidth={2} />
                                <span>Yeniden Kaydet</span>
                            </button>
                            <button
                                type="button"
                                className="audio-primary-btn"
                                onClick={handleConfirmAttach}
                            >
                                <Check size={17} strokeWidth={2.4} />
                                <span>Ses Kaydını Ekle</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioRecorderPopover;

