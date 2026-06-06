import { useState, useRef, useEffect, useCallback } from 'react';
import { loadImage, cropImage, clampPosition } from '../utils/cropperUtils';
import { X, RotateCcw, RotateCw } from 'lucide-react';
import './ImageCropper.css';

/**
 * ImageCropper - Sıfırdan Canvas API ile görsel kırpma bileşeni
 *
 * Avatar: Sabit 1:1 kilitli aspect ratio, slider/wheel zoom, sürükle-bırak, köşe tutamaçları ile yeniden boyutlandırma
 * Cover: Sabit 3:1 kilitli aspect ratio, wheel zoom, sürükle-bırak, köşe tutamaçları ile yeniden boyutlandırma
 */
const ImageCropper = ({ image, mode = 'avatar', onComplete, onCancel, title }) => {
    const containerRef = useRef(null);
    const [imageObj, setImageObj] = useState(null);
    const [rotatedImageObj, setRotatedImageObj] = useState(null);
    const [displaySrc, setDisplaySrc] = useState(image);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Resizable crop area size
    const [cropSize, setCropSize] = useState(() => {
        if (mode === 'avatar') {
            return { width: 220, height: 220 }; // Initial 1:1 size
        } else if (mode === 'cover') {
            return { width: 360, height: 160 }; // Profile banner aspect ratio 2.25 (450x200)
        } else {
            return { width: 350, height: 160 }; // Portal banner aspect ratio 2.1875 (350x160)
        }
    });

    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const MIN_CROP_WIDTH = 120;
    const MIN_CROP_HEIGHT = mode === 'avatar' ? 120 : 40;

    // Mod'a göre kırpma alanı boyutları
    const getCropAreaSize = useCallback(() => {
        return cropSize;
    }, [cropSize]);

    // Çıktı boyutları - cover mode uses actual crop size ratio
    const getOutputSize = useCallback(() => {
        if (mode === 'avatar') {
            return { width: 500, height: 500 };
        } else {
            // High resolution output for sharp header images
            const ratio = cropSize.width / cropSize.height;
            const targetWidth = 1200; // Full HD width for crisp display
            return { width: targetWidth, height: Math.round(targetWidth / ratio) };
        }
    }, [mode, cropSize]);

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
            height: size.height,
        };
    }, [getCropAreaSize]);

    // Görsel yükle
    useEffect(() => {
        if (!image) return;

        setLoading(true);
        loadImage(image)
            .then((img) => {
                setImageObj(img);
                setRotatedImageObj(img);
                setDisplaySrc(image);
                setRotation(0);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Görsel yükleme hatası:', err);
                setLoading(false);
            });
    }, [image]);

    // Rotation effect: Rotate imageObj and update rotatedImageObj & displaySrc
    useEffect(() => {
        if (!imageObj) return;

        if (rotation === 0) {
            setRotatedImageObj(imageObj);
            setDisplaySrc(image);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const normalizedAngle = ((rotation % 360) + 360) % 360;
        const is90or270 = normalizedAngle === 90 || normalizedAngle === 270;
        canvas.width = is90or270 ? imageObj.height : imageObj.width;
        canvas.height = is90or270 ? imageObj.width : imageObj.height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalizedAngle * Math.PI) / 180);
        ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);

        setRotatedImageObj(canvas);
        setDisplaySrc(canvas.toDataURL('image/jpeg', 0.95));
    }, [imageObj, rotation, image]);

    // Recalculate zoom and position to center/fit when rotatedImageObj or cropSize changes
    const resetImagePosition = useCallback((img) => {
        const container = containerRef.current;
        if (!container || !img) return;

        const containerRect = container.getBoundingClientRect();
        const cropArea = getCropArea();

        // Görseli kırpma alanını kaplayacak şekilde zoom
        const minZoom = Math.max(
            cropArea.width / img.width,
            cropArea.height / img.height
        );

        const initialZoom = minZoom * 1.1; // Slightly larger for safe crop border
        setZoom(initialZoom);

        // Center the image
        const scaledWidth = img.width * initialZoom;
        const scaledHeight = img.height * initialZoom;
        setPosition({
            x: (containerRect.width - scaledWidth) / 2,
            y: (containerRect.height - scaledHeight) / 2,
        });
    }, [getCropArea]);

    // Reset position only when rotated image object is loaded or changed
    useEffect(() => {
        if (rotatedImageObj) {
            resetImagePosition(rotatedImageObj);
        }
    }, [rotatedImageObj]);

    // Recalculate position when crop size changes (cover/avatar mode resize)
    useEffect(() => {
        const activeImg = rotatedImageObj || imageObj;
        if (!activeImg) return;

        const cropArea = getCropArea();
        const clampedPosition = clampPosition(
            position,
            { width: activeImg.width, height: activeImg.height },
            zoom,
            cropArea
        );

        if (clampedPosition.x !== position.x || clampedPosition.y !== position.y) {
            setPosition(clampedPosition);
        }
    }, [cropSize]);

    // Mouse/Touch sürükleme başlat
    const handleDragStart = (e) => {
        if (isResizing) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        setIsDragging(true);
        setDragStart({
            x: clientX - position.x,
            y: clientY - position.y,
        });
    };

    // Sürükleme
    const handleDragMove = useCallback(
        (e) => {
            const activeImg = rotatedImageObj || imageObj;
            if (!isDragging || !activeImg || isResizing) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const newPosition = {
                x: clientX - dragStart.x,
                y: clientY - dragStart.y,
            };

            const cropArea = getCropArea();
            const clampedPosition = clampPosition(
                newPosition,
                { width: activeImg.width, height: activeImg.height },
                zoom,
                cropArea
            );

            setPosition(clampedPosition);
        },
        [isDragging, rotatedImageObj, imageObj, dragStart, zoom, getCropArea, isResizing]
    );

    // Sürükleme bitir
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Resize handlers for crop mode
    const handleResizeStart = (e, handle) => {
        e.preventDefault();
        e.stopPropagation();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStart({
            x: clientX,
            y: clientY,
            width: cropSize.width,
            height: cropSize.height,
        });
    };

    // Calculate the maximum allowed crop size based on image bounds
    const getMaxCropSize = useCallback(() => {
        const activeImg = rotatedImageObj || imageObj;
        if (!activeImg || !containerRef.current) {
            return { width: 600, height: 400 };
        }

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        // Scaled image dimensions
        const scaledWidth = activeImg.width * zoom;
        const scaledHeight = activeImg.height * zoom;

        // Image bounds in container coordinates
        const imageLeft = position.x;
        const imageTop = position.y;
        const imageRight = position.x + scaledWidth;
        const imageBottom = position.y + scaledHeight;

        // Crop area center
        const cropCenterX = containerRect.width / 2;
        const cropCenterY = containerRect.height / 2;

        // Max dimensions such that crop stays within image
        const maxWidth = Math.min(
            (cropCenterX - imageLeft) * 2,
            (imageRight - cropCenterX) * 2
        );
        const maxHeight = Math.min(
            (cropCenterY - imageTop) * 2,
            (imageBottom - cropCenterY) * 2
        );

        return {
            width: Math.max(MIN_CROP_WIDTH, maxWidth),
            height: Math.max(MIN_CROP_HEIGHT, maxHeight),
        };
    }, [rotatedImageObj, imageObj, zoom, position]);

    const handleResizeMove = useCallback(
        (e) => {
            const activeImg = rotatedImageObj || imageObj;
            if (!isResizing || !resizeHandle || !activeImg) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - resizeStart.x;
            const deltaY = clientY - resizeStart.y;

            const targetRatio = mode === 'avatar' ? 1.0 : (mode === 'cover' ? 2.25 : (350 / 160));
            let newWidth = resizeStart.width;

            // Bidirectional adjustments because crop box is always centered via translate(-50%, -50%)
            if (resizeHandle.includes('e')) {
                newWidth = resizeStart.width + deltaX * 2;
            } else if (resizeHandle.includes('w')) {
                newWidth = resizeStart.width - deltaX * 2;
            } else {
                const newHeight = resizeHandle.includes('s')
                    ? resizeStart.height + deltaY * 2
                    : resizeStart.height - deltaY * 2;
                newWidth = newHeight * targetRatio;
            }

            // Get dynamic max based on image bounds
            const maxCrop = getMaxCropSize();
            const absoluteMaxWidth = Math.min(maxCrop.width, maxCrop.height * targetRatio);

            // Clamp width
            newWidth = Math.max(MIN_CROP_WIDTH, Math.min(absoluteMaxWidth, newWidth));
            const newHeight = newWidth / targetRatio;

            setCropSize({ width: newWidth, height: newHeight });
        },
        [isResizing, resizeHandle, resizeStart, rotatedImageObj, imageObj, mode, getMaxCropSize]
    );

    const handleResizeEnd = () => {
        setIsResizing(false);
        setResizeHandle(null);
    };

    // Global event listeners for drag
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

    // Global event listeners for resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            document.addEventListener('touchmove', handleResizeMove);
            document.addEventListener('touchend', handleResizeEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
            document.removeEventListener('touchmove', handleResizeMove);
            document.removeEventListener('touchend', handleResizeEnd);
        };
    }, [isResizing, handleResizeMove]);

    // Mouse wheel zoom
    const handleWheel = useCallback(
        (e) => {
            const activeImg = rotatedImageObj || imageObj;
            if (!activeImg) return;

            e.preventDefault();

            const zoomSpeed = 0.08;
            const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;

            const container = containerRef.current;
            if (!container) return;

            const cropArea = getCropArea();

            const minZoomForCrop = Math.max(
                cropArea.width / activeImg.width,
                cropArea.height / activeImg.height
            );

            const absoluteMinZoom = minZoomForCrop * 0.9;
            const maxZoom = 12;

            const newZoom = zoom * (1 + delta);
            const clampedZoom = Math.max(absoluteMinZoom, Math.min(maxZoom, newZoom));

            const cropCenterX = cropArea.x + cropArea.width / 2;
            const cropCenterY = cropArea.y + cropArea.height / 2;

            const imageCenterX = (cropCenterX - position.x) / zoom;
            const imageCenterY = (cropCenterY - position.y) / zoom;

            const newPosition = {
                x: cropCenterX - imageCenterX * clampedZoom,
                y: cropCenterY - imageCenterY * clampedZoom,
            };

            let finalPosition = newPosition;
            if (clampedZoom >= minZoomForCrop) {
                finalPosition = clampPosition(
                    newPosition,
                    { width: activeImg.width, height: activeImg.height },
                    clampedZoom,
                    cropArea
                );
            }

            setZoom(clampedZoom);
            setPosition(finalPosition);
        },
        [rotatedImageObj, imageObj, zoom, position, getCropArea]
    );

    // Attach wheel listener
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    // Zoom slider handler
    const handleZoomChange = (e) => {
        const activeImg = rotatedImageObj || imageObj;
        if (!activeImg) return;

        const newZoom = parseFloat(e.target.value);
        const cropArea = getCropArea();

        const minZoom = Math.max(
            cropArea.width / activeImg.width,
            cropArea.height / activeImg.height
        );

        const clampedZoom = Math.max(newZoom, minZoom);

        const cropCenterX = cropArea.x + cropArea.width / 2;
        const cropCenterY = cropArea.y + cropArea.height / 2;

        const imageCenterX = (cropCenterX - position.x) / zoom;
        const imageCenterY = (cropCenterY - position.y) / zoom;

        const newPosition = {
            x: cropCenterX - imageCenterX * clampedZoom,
            y: cropCenterY - imageCenterY * clampedZoom,
        };

        const clampedPosition = clampPosition(
            newPosition,
            { width: activeImg.width, height: activeImg.height },
            clampedZoom,
            cropArea
        );

        setZoom(clampedZoom);
        setPosition(clampedPosition);
    };

    // Kırpma uygula
    const handleApply = async () => {
        const activeImg = rotatedImageObj || imageObj;
        if (!activeImg) return;

        setProcessing(true);
        try {
            const cropArea = getCropArea();
            const outputSize = getOutputSize();

            const blob = await cropImage(activeImg, cropArea, zoom, position, outputSize, 0);

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
        <div className="cropper-overlay" onClick={(e) => e.stopPropagation()}>
            <div className={`cropper-modal ${mode === 'cover' ? 'cropper-modal-wide' : ''}`}>
                {/* Header */}
                <div className="cropper-header">
                    <h3>{title || (mode === 'avatar' ? 'Profil Fotoğrafı' : 'Kapak Resmi')}</h3>
                    <button className="cropper-close-btn" onClick={onCancel} aria-label="Kapat">
                        <X size={24} strokeWidth={2} />
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
                        <div className="cropper-loading">
                            <span className="cropper-spinner"></span>
                            Yükleniyor...
                        </div>
                    ) : (
                        <>
                            {/* Görsel */}
                            {displaySrc && (
                                <img
                                    src={displaySrc}
                                    alt="Kırpılacak görsel"
                                    className="cropper-image"
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        transformOrigin: '0 0',
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                    }}
                                    draggable="false"
                                />
                            )}

                            {/* Karartma Overlay */}
                            <div className="cropper-overlay-mask">
                                <div
                                    className="mask-section mask-top"
                                    style={{ height: `calc(50% - ${cropAreaSize.height / 2}px)` }}
                                />
                                <div
                                    className="mask-section mask-bottom"
                                    style={{ height: `calc(50% - ${cropAreaSize.height / 2}px)` }}
                                />
                                <div
                                    className="mask-section mask-left"
                                    style={{
                                        width: `calc(50% - ${cropAreaSize.width / 2}px)`,
                                        top: `calc(50% - ${cropAreaSize.height / 2}px)`,
                                        height: `${cropAreaSize.height}px`,
                                    }}
                                />
                                <div
                                    className="mask-section mask-right"
                                    style={{
                                        width: `calc(50% - ${cropAreaSize.width / 2}px)`,
                                        top: `calc(50% - ${cropAreaSize.height / 2}px)`,
                                        height: `${cropAreaSize.height}px`,
                                    }}
                                />
                            </div>

                            {/* Kırpma Çerçevesi */}
                            <div
                                className={`cropper-frame ${mode === 'avatar' ? 'cropper-frame-circle' : 'cropper-frame-rect'}`}
                                style={{
                                    width: `${cropAreaSize.width}px`,
                                    height: `${cropAreaSize.height}px`,
                                }}
                            >
                                {/* Resize handles (locked aspect ratio) */}
                                <>
                                    <div
                                        className="resize-handle resize-corner resize-ne"
                                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                                        onTouchStart={(e) => handleResizeStart(e, 'ne')}
                                    />
                                    <div
                                        className="resize-handle resize-corner resize-nw"
                                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                                        onTouchStart={(e) => handleResizeStart(e, 'nw')}
                                    />
                                    <div
                                        className="resize-handle resize-corner resize-se"
                                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                                        onTouchStart={(e) => handleResizeStart(e, 'se')}
                                    />
                                    <div
                                        className="resize-handle resize-corner resize-sw"
                                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                                        onTouchStart={(e) => handleResizeStart(e, 'sw')}
                                    />
                                </>
                            </div>

                            {/* Zoom hint */}
                            <div className="cropper-hint">
                                Yakınlaştırmak için kaydırın veya fare tekerleğini kullanın
                            </div>
                        </>
                    )}
                </div>

                {/* Controls & Rotation Area */}
                <div className="cropper-controls-wrapper">
                    {/* Zoom Slider */}
                    {rotatedImageObj && (
                        <div className="cropper-zoom-bar">
                            <input
                                type="range"
                                min={Math.max(
                                    getCropArea().width / rotatedImageObj.width,
                                    getCropArea().height / rotatedImageObj.height
                                )}
                                max={5}
                                step={0.01}
                                value={zoom}
                                onChange={handleZoomChange}
                                className="zoom-slider"
                            />
                        </div>
                    )}

                    {/* Rotation controls */}
                    <div className="cropper-rotation-bar">
                        <button
                            className="rotation-btn"
                            onClick={() => setRotation((prev) => prev - 90)}
                            title="Sola 90 Derece Döndür"
                        >
                            <RotateCcw size={16} />
                            <span>🔄 Sola Döndür</span>
                        </button>
                        <button
                            className="rotation-btn"
                            onClick={() => setRotation((prev) => prev + 90)}
                            title="Sağa 90 Derece Döndür"
                        >
                            <RotateCw size={16} />
                            <span>🔄 Sağa Döndür</span>
                        </button>
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
                        {processing ? 'İşleniyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
