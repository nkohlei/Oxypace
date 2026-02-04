import { useState, useRef, useEffect, useCallback } from 'react';
import { loadImage, cropImage, calculateInitialFit, clampPosition } from '../utils/cropperUtils';
import './ImageCropper.css';

/**
 * ImageCropper - Sıfırdan Canvas API ile görsel kırpma bileşeni
 * 
 * @param {Object} props
 * @param {string} props.image - Base64 veya URL
 * @param {string} props.mode - 'avatar' (1:1 daire) veya 'cover' (16:9 dikdörtgen)
 * @param {function} props.onComplete - Kırpılmış blob ile çağrılır
 * @param {function} props.onCancel - İptal edildiğinde çağrılır
 * @param {string} props.title - Modal başlığı
 */
const ImageCropper = ({ image, mode = 'avatar', onComplete, onCancel, title }) => {
    const containerRef = useRef(null);
    const [imageObj, setImageObj] = useState(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Mod'a göre kırpma alanı boyutları
    const getCropAreaSize = useCallback(() => {
        if (mode === 'avatar') {
            return { width: 200, height: 200 }; // 1:1
        } else {
            return { width: 400, height: 225 }; // 16:9
        }
    }, [mode]);

    // Çıktı boyutları
    const getOutputSize = useCallback(() => {
        if (mode === 'avatar') {
            return { width: 400, height: 400 }; // Yüksek çözünürlük avatar
        } else {
            return { width: 1200, height: 675 }; // Yüksek çözünürlük kapak
        }
    }, [mode]);

    // Kırpma alanı pozisyonu (merkez)
    const getCropArea = useCallback(() => {
        const size = getCropAreaSize();
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0, ...size };

        const containerRect = container.getBoundingClientRect();
        return {
            x: (containerRect.width - size.width) / 2,
            y: (containerRect.height - size.height) / 2,
            width: size.width,
            height: size.height
        };
    }, [getCropAreaSize]);

    // Görsel yükle
    useEffect(() => {
        if (!image) return;

        setLoading(true);
        loadImage(image)
            .then((img) => {
                setImageObj(img);

                // Container boyutlarını al
                const container = containerRef.current;
                if (container) {
                    const cropArea = getCropArea();
                    const fit = calculateInitialFit(
                        img.width,
                        img.height,
                        cropArea.width,
                        cropArea.height
                    );

                    // Zoom'u kırpma alanına göre ayarla
                    const minZoom = Math.max(
                        cropArea.width / img.width,
                        cropArea.height / img.height
                    );

                    setZoom(Math.max(fit.zoom, minZoom));
                    setPosition({
                        x: cropArea.x + fit.x,
                        y: cropArea.y + fit.y
                    });
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Görsel yükleme hatası:', err);
                setLoading(false);
            });
    }, [image, getCropArea]);

    // Mouse/Touch sürükleme başlat
    const handleDragStart = (e) => {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        setIsDragging(true);
        setDragStart({
            x: clientX - position.x,
            y: clientY - position.y
        });
    };

    // Sürükleme
    const handleDragMove = useCallback((e) => {
        if (!isDragging || !imageObj) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const newPosition = {
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        };

        const cropArea = getCropArea();
        const clampedPosition = clampPosition(
            newPosition,
            { width: imageObj.width, height: imageObj.height },
            zoom,
            cropArea
        );

        setPosition(clampedPosition);
    }, [isDragging, imageObj, dragStart, zoom, getCropArea]);

    // Sürükleme bitir
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Global event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleDragMove);
            document.addEventListener('touchend', handleDragEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove]);

    // Zoom değişikliği
    const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);

        if (!imageObj) return;

        const cropArea = getCropArea();

        // Minimum zoom: görsel kırpma alanını kaplamalı
        const minZoom = Math.max(
            cropArea.width / imageObj.width,
            cropArea.height / imageObj.height
        );

        const clampedZoom = Math.max(newZoom, minZoom);

        // Zoom değişirken merkezi koru
        const cropCenterX = cropArea.x + cropArea.width / 2;
        const cropCenterY = cropArea.y + cropArea.height / 2;

        const imageCenterX = (cropCenterX - position.x) / zoom;
        const imageCenterY = (cropCenterY - position.y) / zoom;

        const newPosition = {
            x: cropCenterX - imageCenterX * clampedZoom,
            y: cropCenterY - imageCenterY * clampedZoom
        };

        const clampedPosition = clampPosition(
            newPosition,
            { width: imageObj.width, height: imageObj.height },
            clampedZoom,
            cropArea
        );

        setZoom(clampedZoom);
        setPosition(clampedPosition);
    };

    // Kırpma uygula
    const handleApply = async () => {
        if (!imageObj) return;

        setProcessing(true);
        try {
            const cropArea = getCropArea();
            const outputSize = getOutputSize();

            const blob = await cropImage(
                imageObj,
                cropArea,
                zoom,
                position,
                outputSize
            );

            onComplete(blob);
        } catch (err) {
            console.error('Kırpma hatası:', err);
            alert('Görsel işlenirken bir hata oluştu');
        } finally {
            setProcessing(false);
        }
    };

    const cropAreaSize = getCropAreaSize();

    return (
        <div className="cropper-overlay">
            <div className="cropper-modal">
                {/* Header */}
                <div className="cropper-header">
                    <h3>{title || (mode === 'avatar' ? 'Profil Fotoğrafı' : 'Kapak Resmi')}</h3>
                    <button className="cropper-close-btn" onClick={onCancel} aria-label="Kapat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Cropper Area */}
                <div
                    className="cropper-container"
                    ref={containerRef}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                >
                    {loading ? (
                        <div className="cropper-loading">Yükleniyor...</div>
                    ) : (
                        <>
                            {/* Görsel */}
                            {imageObj && (
                                <img
                                    src={image}
                                    alt="Kırpılacak görsel"
                                    className="cropper-image"
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        transformOrigin: '0 0',
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}
                                    draggable="false"
                                />
                            )}

                            {/* Karartma Overlay */}
                            <div className="cropper-overlay-mask">
                                {/* Üst */}
                                <div
                                    className="mask-section mask-top"
                                    style={{ height: `calc(50% - ${cropAreaSize.height / 2}px)` }}
                                />
                                {/* Alt */}
                                <div
                                    className="mask-section mask-bottom"
                                    style={{ height: `calc(50% - ${cropAreaSize.height / 2}px)` }}
                                />
                                {/* Sol */}
                                <div
                                    className="mask-section mask-left"
                                    style={{
                                        width: `calc(50% - ${cropAreaSize.width / 2}px)`,
                                        top: `calc(50% - ${cropAreaSize.height / 2}px)`,
                                        height: `${cropAreaSize.height}px`
                                    }}
                                />
                                {/* Sağ */}
                                <div
                                    className="mask-section mask-right"
                                    style={{
                                        width: `calc(50% - ${cropAreaSize.width / 2}px)`,
                                        top: `calc(50% - ${cropAreaSize.height / 2}px)`,
                                        height: `${cropAreaSize.height}px`
                                    }}
                                />
                            </div>

                            {/* Kırpma Çerçevesi */}
                            <div
                                className={`cropper-frame ${mode === 'avatar' ? 'cropper-frame-circle' : 'cropper-frame-rect'}`}
                                style={{
                                    width: `${cropAreaSize.width}px`,
                                    height: `${cropAreaSize.height}px`
                                }}
                            />
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="cropper-controls">
                    <div className="zoom-control">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="zoom-slider"
                        />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </div>
                </div>

                {/* Actions */}
                <div className="cropper-actions">
                    <button className="cropper-btn cropper-btn-cancel" onClick={onCancel}>
                        İptal
                    </button>
                    <button
                        className="cropper-btn cropper-btn-apply"
                        onClick={handleApply}
                        disabled={processing || loading}
                    >
                        {processing ? 'İşleniyor...' : 'Uygula'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
