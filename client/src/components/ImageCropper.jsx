import { useState, useRef, useEffect, useCallback } from 'react';
import {
    loadImage,
    getMinScale,
    clampOffset,
    cropImage,
} from '../utils/cropperUtils';
import { X, RotateCcw, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { uploadFile } from '../utils/uploadUtils';
import './ImageCropper.css';

/**
 * ImageCropper - Oxypace Profesyonel & Agresif Profil/Görsel Düzenleyici
 *
 * - Siyah-beyaz, keskin hatlı, agresif endüstriyel estetik (sıfır neon, sıfır yuvarlak buton).
 * - Merkez odaklı kararlı transformasyon motoru.
 * - Sürükleme, tekerlek zoom, pinch-to-zoom ve 90° adımlı rotasyon.
 * - Animasyonlu GIF dosyaları için doğrudan kayıpsız upload desteği.
 */
const ImageCropper = ({
    image,
    file,
    portalId,
    mode = 'avatar',
    onComplete,
    onCancel,
    title,
    aspectRatio,
}) => {
    const isGif = Boolean(
        file &&
            (file.type === 'image/gif' ||
                file.name.toLowerCase().endsWith('.gif') ||
                (typeof image === 'string' && image.startsWith('data:image/gif')))
    );

    const containerRef = useRef(null);
    const [imageObj, setImageObj] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Kırpma vizörü boyutları
    const getCropSize = useCallback(() => {
        if (aspectRatio) {
            if (aspectRatio >= 1) {
                const w = 260;
                return { width: w, height: Math.round(w / aspectRatio) };
            } else {
                const h = 260;
                return { width: Math.round(h * aspectRatio), height: h };
            }
        }
        if (mode === 'avatar') {
            return { width: 260, height: 260 };
        } else if (mode === 'cover') {
            return { width: 440, height: 195 }; // 2.25:1 aspect ratio
        } else {
            return { width: 320, height: 200 };
        }
    }, [aspectRatio, mode]);

    const cropSize = getCropSize();

    // Çıktı çözünürlüğü
    const getOutputSize = useCallback(() => {
        if (mode === 'avatar') {
            return { width: 512, height: 512 };
        } else if (mode === 'cover') {
            const ratio = cropSize.width / cropSize.height;
            return { width: 1200, height: Math.round(1200 / ratio) };
        } else {
            const ratio = cropSize.width / cropSize.height;
            return { width: 600, height: Math.round(600 / ratio) };
        }
    }, [mode, cropSize]);

    // Transform durumları
    const [scale, setScale] = useState(1);
    const [minScale, setMinScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);

    // Sürükleme ve dokunma durumları
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });
    const pinchStartRef = useRef({ distance: 0, initialScale: 1 });

    // Görseli yükle
    useEffect(() => {
        if (!image) return;
        setLoading(true);

        loadImage(image)
            .then((img) => {
                setImageObj(img);
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                const initialMin = getMinScale(w, h, cropSize.width, cropSize.height, 0);

                setMinScale(initialMin);
                setScale(initialMin);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Görsel yüklenemedi:', err);
                setLoading(false);
            });
    }, [image, cropSize.width, cropSize.height]);

    // Rotasyon değiştir (90 derecelik adımlarla)
    const handleRotate = (direction) => {
        if (!imageObj) return;
        const delta = direction === 'cw' ? 90 : -90;
        const newRotation = ((rotation + delta) % 360 + 360) % 360;

        const w = imageObj.naturalWidth || imageObj.width;
        const h = imageObj.naturalHeight || imageObj.height;
        const newMin = getMinScale(w, h, cropSize.width, cropSize.height, newRotation);
        const newScale = Math.max(scale, newMin);
        const newOffset = clampOffset(
            offset,
            w,
            h,
            newScale,
            cropSize.width,
            cropSize.height,
            newRotation
        );

        setRotation(newRotation);
        setMinScale(newMin);
        setScale(newScale);
        setOffset(newOffset);
    };

    // Sıfırla
    const handleReset = () => {
        if (!imageObj) return;
        const w = imageObj.naturalWidth || imageObj.width;
        const h = imageObj.naturalHeight || imageObj.height;
        const initialMin = getMinScale(w, h, cropSize.width, cropSize.height, 0);

        setRotation(0);
        setMinScale(initialMin);
        setScale(initialMin);
        setOffset({ x: 0, y: 0 });
    };

    // Zoom slider değişimi
    const handleZoomSlider = (e) => {
        if (!imageObj) return;
        const newScale = parseFloat(e.target.value);
        const w = imageObj.naturalWidth || imageObj.width;
        const h = imageObj.naturalHeight || imageObj.height;
        const clamped = clampOffset(
            offset,
            w,
            h,
            newScale,
            cropSize.width,
            cropSize.height,
            rotation
        );

        setScale(newScale);
        setOffset(clamped);
    };

    // Adımlı Zoom
    const handleZoomStep = (factor) => {
        if (!imageObj) return;
        const maxScale = minScale * 4;
        const newScale = Math.max(minScale, Math.min(maxScale, scale * factor));
        const w = imageObj.naturalWidth || imageObj.width;
        const h = imageObj.naturalHeight || imageObj.height;
        const clamped = clampOffset(
            offset,
            w,
            h,
            newScale,
            cropSize.width,
            cropSize.height,
            rotation
        );

        setScale(newScale);
        setOffset(clamped);
    };

    // Fare tekerleği ile zoom
    const handleWheel = useCallback(
        (e) => {
            if (!imageObj) return;
            e.preventDefault();

            const factor = e.deltaY < 0 ? 1.08 : 0.92;
            const maxScale = minScale * 4;
            const newScale = Math.max(minScale, Math.min(maxScale, scale * factor));
            const w = imageObj.naturalWidth || imageObj.width;
            const h = imageObj.naturalHeight || imageObj.height;
            const clamped = clampOffset(
                offset,
                w,
                h,
                newScale,
                cropSize.width,
                cropSize.height,
                rotation
            );

            setScale(newScale);
            setOffset(clamped);
        },
        [imageObj, minScale, scale, offset, cropSize.width, cropSize.height, rotation]
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Fare Sürükleme Başlat
    const handleMouseDown = (e) => {
        if (e.button !== 0 || !imageObj) return; // Sadece sol tık
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialOffsetX: offset.x,
            initialOffsetY: offset.y,
        };
    };

    // Dokunma Başlat (Tek parmak: Pan, Çift parmak: Pinch)
    const handleTouchStart = (e) => {
        if (!imageObj) return;
        if (e.touches.length === 1) {
            setIsDragging(true);
            dragStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                initialOffsetX: offset.x,
                initialOffsetY: offset.y,
            };
        } else if (e.touches.length === 2) {
            setIsDragging(false);
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchStartRef.current = {
                distance: Math.hypot(dx, dy),
                initialScale: scale,
            };
        }
    };

    // Sürükleme ve Pinch Hareketleri
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !imageObj) return;
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;

            const w = imageObj.naturalWidth || imageObj.width;
            const h = imageObj.naturalHeight || imageObj.height;
            const newOffset = {
                x: dragStartRef.current.initialOffsetX + dx,
                y: dragStartRef.current.initialOffsetY + dy,
            };

            const clamped = clampOffset(
                newOffset,
                w,
                h,
                scale,
                cropSize.width,
                cropSize.height,
                rotation
            );
            setOffset(clamped);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        const handleTouchMove = (e) => {
            if (!imageObj) return;

            if (e.touches.length === 1 && isDragging) {
                const dx = e.touches[0].clientX - dragStartRef.current.x;
                const dy = e.touches[0].clientY - dragStartRef.current.y;

                const w = imageObj.naturalWidth || imageObj.width;
                const h = imageObj.naturalHeight || imageObj.height;
                const newOffset = {
                    x: dragStartRef.current.initialOffsetX + dx,
                    y: dragStartRef.current.initialOffsetY + dy,
                };

                const clamped = clampOffset(
                    newOffset,
                    w,
                    h,
                    scale,
                    cropSize.width,
                    cropSize.height,
                    rotation
                );
                setOffset(clamped);
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDist = Math.hypot(dx, dy);

                if (pinchStartRef.current.distance > 0) {
                    const ratio = currentDist / pinchStartRef.current.distance;
                    const maxScale = minScale * 4;
                    const newScale = Math.max(
                        minScale,
                        Math.min(maxScale, pinchStartRef.current.initialScale * ratio)
                    );

                    const w = imageObj.naturalWidth || imageObj.width;
                    const h = imageObj.naturalHeight || imageObj.height;
                    const clamped = clampOffset(
                        offset,
                        w,
                        h,
                        newScale,
                        cropSize.width,
                        cropSize.height,
                        rotation
                    );

                    setScale(newScale);
                    setOffset(clamped);
                }
            }
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            pinchStartRef.current.distance = 0;
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, imageObj, scale, offset, cropSize.width, cropSize.height, rotation, minScale]);

    // Kırpmayı uygula ve kaydet
    const handleApply = async () => {
        if (!imageObj) return;
        setProcessing(true);

        try {
            if (isGif) {
                // GIF dosyası için kalite bozulmaması adına orijinal dosyayı doğrudan yükle
                const uploadPurpose = mode === 'avatar' ? 'avatar' : 'cover';
                const mediaKey = await uploadFile(file, uploadPurpose, portalId);
                onComplete(mediaKey);
            } else {
                const outputSize = getOutputSize();
                const blob = await cropImage(
                    imageObj,
                    cropSize,
                    scale,
                    offset,
                    rotation,
                    outputSize
                );
                onComplete(blob);
            }
        } catch (err) {
            console.error('Kırpma hatası:', err);
            const errMsg = err.response?.data?.message || err.message || 'Bilinmeyen hata';
            alert(`Görsel işlenirken bir hata oluştu: ${errMsg}`);
        } finally {
            setProcessing(false);
        }
    };

    // Görsel transform stili (Merkez odaklı)
    const getImageTransformStyle = () => {
        if (!imageObj) return {};

        const normAngle = ((rotation % 360) + 360) % 360;
        return {
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${normAngle}deg) scale(${scale})`,
            transformOrigin: 'center center',
            cursor: isDragging ? 'grabbing' : 'grab',
        };
    };

    const maxScale = minScale * 4;
    const zoomPercent = Math.round((scale / minScale) * 100);

    return (
        <div className="cropper-overlay" onClick={(e) => e.stopPropagation()}>
            <div className={`cropper-modal ${mode === 'cover' ? 'cropper-modal-wide' : ''}`}>
                {/* Header: Agresif & Keskin */}
                <div className="cropper-header">
                    <div className="cropper-header-title-box">
                        <span className="cropper-header-tag">[ KADRAJ & DÜZENLEME ]</span>
                        <h3 className="cropper-header-title">
                            {title || (mode === 'avatar' ? 'PROFİL FOTOĞRAFI' : 'KAPAK RESMİ')}
                        </h3>
                    </div>
                    <button
                        className="cropper-close-btn"
                        onClick={onCancel}
                        aria-label="Kapat"
                        title="Kapat"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Viewport / Kırpma Alanı */}
                <div
                    className="cropper-container"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    {loading ? (
                        <div className="cropper-loading">
                            <div className="cropper-spinner" />
                            <span className="cropper-loading-text">GÖRSEL İŞLENİYOR...</span>
                        </div>
                    ) : (
                        <>
                            {/* Orijinal Görsel */}
                            {imageObj && (
                                <img
                                    src={image}
                                    alt="Kırpılacak görsel"
                                    className="cropper-image"
                                    style={getImageTransformStyle()}
                                    draggable="false"
                                />
                            )}

                            {/* Taktiksel Odak Vizörü */}
                            <div
                                className={`cropper-frame ${mode === 'avatar' ? 'cropper-frame-circle' : 'cropper-frame-rect'}`}
                                style={{
                                    width: `${cropSize.width}px`,
                                    height: `${cropSize.height}px`,
                                }}
                            >
                                {/* 4 Köşe Taktiksel Reticle / Braket */}
                                <div className="cropper-reticle reticle-tl" />
                                <div className="cropper-reticle reticle-tr" />
                                <div className="cropper-reticle reticle-bl" />
                                <div className="cropper-reticle reticle-br" />

                                {/* Kılavuz Çapraz / Üçte Bir Çizgileri */}
                                <div className="cropper-grid-overlay">
                                    <div className="cropper-grid-line grid-v1" />
                                    <div className="cropper-grid-line grid-v2" />
                                    <div className="cropper-grid-line grid-h1" />
                                    <div className="cropper-grid-line grid-h2" />
                                </div>
                            </div>

                            {/* Taktiksel Kullanım Bilgisi */}
                            <div className="cropper-hint-badge">
                                SÜRÜKLE: KONUMU AYARLA • TEKERLEK: YAKINLAŞTIR
                            </div>
                        </>
                    )}
                </div>

                {/* Kontrol Paneli */}
                <div className="cropper-controls-wrapper">
                    {/* Zoom Kontrol Barı */}
                    <div className="cropper-zoom-section">
                        <div className="cropper-control-label">
                            <span>ÖLÇEK</span>
                            <span className="cropper-zoom-val">{zoomPercent}%</span>
                        </div>

                        <div className="cropper-zoom-bar">
                            <button
                                type="button"
                                className="cropper-icon-btn"
                                onClick={() => handleZoomStep(0.9)}
                                title="Uzaklaştır"
                                disabled={scale <= minScale || loading}
                            >
                                <ZoomOut size={16} strokeWidth={2.5} />
                            </button>

                            <input
                                type="range"
                                min={minScale}
                                max={maxScale}
                                step={(maxScale - minScale) / 100 || 0.01}
                                value={scale}
                                onChange={handleZoomSlider}
                                className="zoom-slider"
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="cropper-icon-btn"
                                onClick={() => handleZoomStep(1.1)}
                                title="Yakınlaştır"
                                disabled={scale >= maxScale || loading}
                            >
                                <ZoomIn size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Araç Çubuğu: Rotasyon & Sıfırlama */}
                    {isGif ? (
                        <div className="cropper-gif-notice">
                            [!] HAREKETLİ GIF: ANİMASYONUN KORUNMASI İÇİN ROTASYON DEVRE DIŞIDIR
                        </div>
                    ) : (
                        <div className="cropper-tool-bar">
                            <button
                                type="button"
                                className="cropper-tool-btn"
                                onClick={() => handleRotate('ccw')}
                                title="Sola 90° Döndür"
                                disabled={loading}
                            >
                                <RotateCcw size={15} strokeWidth={2.5} />
                                <span>90° SOLA</span>
                            </button>

                            <button
                                type="button"
                                className="cropper-tool-btn"
                                onClick={() => handleRotate('cw')}
                                title="Sağa 90° Döndür"
                                disabled={loading}
                            >
                                <RotateCw size={15} strokeWidth={2.5} />
                                <span>90° SAĞA</span>
                            </button>

                            <button
                                type="button"
                                className="cropper-tool-btn cropper-tool-btn-reset"
                                onClick={handleReset}
                                title="Pozisyon ve Ölçeği Sıfırla"
                                disabled={loading}
                            >
                                <RefreshCw size={15} strokeWidth={2.5} />
                                <span>SIFIRLA</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Alt Aksiyonlar: Agresif Butonlar */}
                <div className="cropper-actions">
                    <button
                        type="button"
                        className="cropper-btn cropper-btn-cancel"
                        onClick={onCancel}
                        disabled={processing}
                    >
                        İPTAL
                    </button>
                    <button
                        type="button"
                        className="cropper-btn cropper-btn-apply"
                        onClick={handleApply}
                        disabled={processing || loading}
                    >
                        {processing ? 'İŞLENİYOR...' : 'KAYDET VE UYGULA'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
