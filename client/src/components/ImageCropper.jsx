import { useState, useRef, useEffect, useCallback } from 'react';
import { loadImage, cropImage, clampPosition } from '../utils/cropperUtils';
import './ImageCropper.css';

/**
 * ImageCropper - Sıfırdan Canvas API ile görsel kırpma bileşeni
 * 
 * Avatar: Sabit 1:1 daire, slider ile zoom
 * Cover: Serbest boyut, kenarlardan resize, mouse wheel zoom
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

    // Cover mode: resizable crop area
    const [cropSize, setCropSize] = useState({ width: 400, height: 225 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Min crop sizes for cover mode (no max - dynamically calculated from image)
    const MIN_CROP_WIDTH = 100;
    const MIN_CROP_HEIGHT = 60;

    // Mod'a göre kırpma alanı boyutları
    const getCropAreaSize = useCallback(() => {
        if (mode === 'avatar') {
            return { width: 200, height: 200 }; // Fixed 1:1
        } else {
            return cropSize; // Dynamic for cover
        }
    }, [mode, cropSize]);

    // Çıktı boyutları - cover mode uses actual crop size ratio
    const getOutputSize = useCallback(() => {
        if (mode === 'avatar') {
            return { width: 400, height: 400 };
        } else {
            // Scale up proportionally for quality
            const ratio = cropSize.width / cropSize.height;
            const targetWidth = 1200;
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

                const container = containerRef.current;
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const cropArea = getCropArea();

                    // Görseli kırpma alanını kaplayacak şekilde zoom
                    const minZoom = Math.max(
                        cropArea.width / img.width,
                        cropArea.height / img.height
                    );

                    const initialZoom = minZoom * 1.1; // Slightly larger
                    setZoom(initialZoom);

                    // Center the image
                    const scaledWidth = img.width * initialZoom;
                    const scaledHeight = img.height * initialZoom;
                    setPosition({
                        x: (containerRect.width - scaledWidth) / 2,
                        y: (containerRect.height - scaledHeight) / 2
                    });
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Görsel yükleme hatası:', err);
                setLoading(false);
            });
    }, [image]);

    // Recalculate position when crop size changes (cover mode)
    useEffect(() => {
        if (!imageObj || mode === 'avatar') return;

        const cropArea = getCropArea();
        const clampedPosition = clampPosition(
            position,
            { width: imageObj.width, height: imageObj.height },
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
            y: clientY - position.y
        });
    };

    // Sürükleme
    const handleDragMove = useCallback((e) => {
        if (!isDragging || !imageObj || isResizing) return;

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
    }, [isDragging, imageObj, dragStart, zoom, getCropArea, isResizing]);

    // Sürükleme bitir
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Resize handlers for cover mode
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
            height: cropSize.height
        });
    };

    // Calculate the maximum allowed crop size based on image bounds
    const getMaxCropSize = useCallback(() => {
        if (!imageObj || !containerRef.current) {
            return { width: 600, height: 400 };
        }

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        // Scaled image dimensions
        const scaledWidth = imageObj.width * zoom;
        const scaledHeight = imageObj.height * zoom;

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
            (cropCenterX - imageLeft) * 2,  // Left edge constraint
            (imageRight - cropCenterX) * 2   // Right edge constraint
        );
        const maxHeight = Math.min(
            (cropCenterY - imageTop) * 2,    // Top edge constraint
            (imageBottom - cropCenterY) * 2  // Bottom edge constraint
        );

        return {
            width: Math.max(MIN_CROP_WIDTH, maxWidth),
            height: Math.max(MIN_CROP_HEIGHT, maxHeight)
        };
    }, [imageObj, zoom, position]);

    const handleResizeMove = useCallback((e) => {
        if (!isResizing || !resizeHandle || !imageObj) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - resizeStart.x;
        const deltaY = clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        // Handle different resize directions
        if (resizeHandle.includes('e')) newWidth += deltaX;
        if (resizeHandle.includes('w')) newWidth -= deltaX;
        if (resizeHandle.includes('s')) newHeight += deltaY;
        if (resizeHandle.includes('n')) newHeight -= deltaY;

        // Get dynamic max based on image bounds
        const maxCrop = getMaxCropSize();

        // Clamp to min and dynamic max
        newWidth = Math.max(MIN_CROP_WIDTH, Math.min(maxCrop.width, newWidth));
        newHeight = Math.max(MIN_CROP_HEIGHT, Math.min(maxCrop.height, newHeight));

        setCropSize({ width: newWidth, height: newHeight });
    }, [isResizing, resizeHandle, resizeStart, imageObj, getMaxCropSize]);

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

    // Mouse wheel zoom for both modes
    const handleWheel = useCallback((e) => {
        if (!imageObj) return;

        e.preventDefault();

        // Larger delta for faster zooming, proportional to current zoom
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;

        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const cropArea = getCropArea();

        // Minimum zoom: image should at least cover the crop area
        // Allow zooming out until the smallest dimension just covers the crop
        const minZoomForCrop = Math.max(
            cropArea.width / imageObj.width,
            cropArea.height / imageObj.height
        );

        // Allow slightly more zoom out for flexibility (80% of minimum)
        const absoluteMinZoom = minZoomForCrop * 0.5;

        // Maximum zoom: up to 10x for detailed cropping
        const maxZoom = 10;

        // Calculate new zoom
        const newZoom = zoom * (1 + delta);
        const clampedZoom = Math.max(absoluteMinZoom, Math.min(maxZoom, newZoom));

        // Zoom değişirken merkezi koru
        const cropCenterX = cropArea.x + cropArea.width / 2;
        const cropCenterY = cropArea.y + cropArea.height / 2;

        const imageCenterX = (cropCenterX - position.x) / zoom;
        const imageCenterY = (cropCenterY - position.y) / zoom;

        const newPosition = {
            x: cropCenterX - imageCenterX * clampedZoom,
            y: cropCenterY - imageCenterY * clampedZoom
        };

        // Only clamp position if zoomed in enough to cover crop area
        let finalPosition = newPosition;
        if (clampedZoom >= minZoomForCrop) {
            finalPosition = clampPosition(
                newPosition,
                { width: imageObj.width, height: imageObj.height },
                clampedZoom,
                cropArea
            );
        }

        setZoom(clampedZoom);
        setPosition(finalPosition);
    }, [imageObj, zoom, position, getCropArea]);

    // Attach wheel listener for all modes
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    // Zoom slider for avatar mode only
    const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);

        if (!imageObj) return;

        const cropArea = getCropArea();

        const minZoom = Math.max(
            cropArea.width / imageObj.width,
            cropArea.height / imageObj.height
        );

        const clampedZoom = Math.max(newZoom, minZoom);

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
            <div className={`cropper-modal ${mode === 'cover' ? 'cropper-modal-wide' : ''}`}>
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
                                        height: `${cropAreaSize.height}px`
                                    }}
                                />
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
                            >
                                {/* Resize handles for cover mode */}
                                {mode === 'cover' && (
                                    <>
                                        <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} onTouchStart={(e) => handleResizeStart(e, 'n')} />
                                        <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} onTouchStart={(e) => handleResizeStart(e, 's')} />
                                        <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} onTouchStart={(e) => handleResizeStart(e, 'e')} />
                                        <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} onTouchStart={(e) => handleResizeStart(e, 'w')} />
                                        <div className="resize-handle resize-corner resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} onTouchStart={(e) => handleResizeStart(e, 'ne')} />
                                        <div className="resize-handle resize-corner resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} onTouchStart={(e) => handleResizeStart(e, 'nw')} />
                                        <div className="resize-handle resize-corner resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} onTouchStart={(e) => handleResizeStart(e, 'se')} />
                                        <div className="resize-handle resize-corner resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} onTouchStart={(e) => handleResizeStart(e, 'sw')} />
                                    </>
                                )}
                            </div>

                            {/* Zoom hint for all modes */}
                            <div className="cropper-hint">Yakınlaştırmak için fare tekerleğini kullanın</div>
                        </>
                    )}
                </div>

                {/* Slider removed - mouse wheel zoom for all modes */}

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
