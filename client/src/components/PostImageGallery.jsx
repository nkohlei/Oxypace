import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import './PostImageGallery.css';

export const PostImageGallery = ({ media, isOptimistic = false }) => {
    // Normalise media into an array of string URLs
    let images = [];
    if (Array.isArray(media)) {
        images = media.filter(Boolean);
    } else if (typeof media === 'string' && media.trim()) {
        images = [media];
    }

    const [currentIndex, setCurrentIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    const isMultiple = images.length > 1;

    // Handle scroll snap events to sync currentIndex
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const width = container.clientWidth;
        if (width > 0) {
            const index = Math.round(scrollLeft / width);
            if (index >= 0 && index < images.length && index !== currentIndex) {
                setCurrentIndex(index);
            }
        }
    };

    const scrollToIndex = (index) => {
        if (!scrollContainerRef.current) return;
        const clamped = Math.max(0, Math.min(index, images.length - 1));
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({
            left: clamped * width,
            behavior: 'smooth',
        });
        setCurrentIndex(clamped);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        scrollToIndex(currentIndex - 1);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        scrollToIndex(currentIndex + 1);
    };

    const openLightbox = (index, e) => {
        if (e) e.stopPropagation();
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = (e) => {
        if (e) e.stopPropagation();
        setLightboxOpen(false);
    };

    const nextLightbox = useCallback((e) => {
        if (e) e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevLightbox = useCallback((e) => {
        if (e) e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Keyboard navigation inside lightbox
    useEffect(() => {
        if (!lightboxOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setLightboxOpen(false);
            } else if (e.key === 'ArrowRight') {
                setLightboxIndex((prev) => (prev + 1) % images.length);
            } else if (e.key === 'ArrowLeft') {
                setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, images.length]);

    if (images.length === 0) return null;

    // ── Single Image View ──────────────────────────────────────────
    if (!isMultiple) {
        return (
            <>
                <div
                    className="gallery-single-image-wrapper"
                    onClick={(e) => openLightbox(0, e)}
                    title="Görseli büyüt"
                >
                    <img
                        src={getImageUrl(images[0])}
                        alt="Gönderi görseli"
                        loading="lazy"
                        decoding="async"
                        className="gallery-image single-img"
                    />
                    <div className="gallery-zoom-hint">
                        <ZoomIn size={16} />
                    </div>
                </div>

                {lightboxOpen && (
                    <LightboxModal
                        images={images}
                        currentIndex={lightboxIndex}
                        onClose={closeLightbox}
                        onPrev={prevLightbox}
                        onNext={nextLightbox}
                        onSelectIndex={setLightboxIndex}
                    />
                )}
            </>
        );
    }

    // ── Multi Image Carousel View (Max 10) ──────────────────────────
    return (
        <div className="post-gallery-carousel-wrapper" onClick={(e) => e.stopPropagation()}>
            <div
                ref={scrollContainerRef}
                className="post-gallery-scroll-container"
                onScroll={handleScroll}
            >
                {images.map((imgUrl, index) => (
                    <div
                        key={index}
                        className="post-gallery-slide"
                        onClick={(e) => openLightbox(index, e)}
                        title="Görseli büyütmek için tıkla"
                    >
                        <img
                            src={getImageUrl(imgUrl)}
                            alt={`Görsel ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="gallery-image slide-img"
                        />
                    </div>
                ))}
            </div>

            {/* Left/Right Arrow Buttons (Desktop & Touch accessible) */}
            {currentIndex > 0 && (
                <button
                    type="button"
                    className="gallery-nav-btn prev-btn"
                    onClick={handlePrev}
                    aria-label="Önceki Görsel"
                >
                    <ChevronLeft size={22} />
                </button>
            )}
            {currentIndex < images.length - 1 && (
                <button
                    type="button"
                    className="gallery-nav-btn next-btn"
                    onClick={handleNext}
                    aria-label="Sonraki Görsel"
                >
                    <ChevronRight size={22} />
                </button>
            )}

            {/* Badge Counter (e.g. 1/4) */}
            <div className="gallery-counter-badge">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Bottom Pagination Dots */}
            <div className="gallery-dots-indicator">
                {images.map((_, dotIdx) => (
                    <button
                        key={dotIdx}
                        type="button"
                        className={`gallery-dot ${dotIdx === currentIndex ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            scrollToIndex(dotIdx);
                        }}
                        aria-label={`Görsele git ${dotIdx + 1}`}
                    />
                ))}
            </div>

            {/* Lightbox Modal when clicked */}
            {lightboxOpen && (
                <LightboxModal
                    images={images}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onPrev={prevLightbox}
                    onNext={nextLightbox}
                    onSelectIndex={setLightboxIndex}
                />
            )}
        </div>
    );
};

/**
 * Fullscreen Lightbox Modal Portal with Wheel & Pinch Zoom (No extra buttons)
 */
const LightboxModal = ({
    images,
    currentIndex,
    onClose,
    onPrev,
    onNext,
    onSelectIndex,
}) => {
    const isMultiple = images.length > 1;

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const imgRef = useRef(null);
    const containerRef = useRef(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef({ x: 0, y: 0 });
    const isPinchingRef = useRef(false);
    const initialPinchDistRef = useRef(0);
    const initialPinchScaleRef = useRef(1);
    const lastTapRef = useRef(0);

    // Reset zoom when active image changes
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
    }, [currentIndex]);

    // Handle mouse wheel zoom centered on cursor
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;

            setScale((prevScale) => {
                const targetScale = Math.min(Math.max(prevScale * zoomFactor, 1), 6);
                if (targetScale <= 1.01) {
                    setPosition({ x: 0, y: 0 });
                    return 1;
                }

                // Smooth zoom toward cursor position
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - (rect.left + rect.width / 2);
                const mouseY = e.clientY - (rect.top + rect.height / 2);

                setPosition((prevPos) => {
                    const ratio = targetScale / prevScale;
                    return {
                        x: mouseX - (mouseX - prevPos.x) * ratio,
                        y: mouseY - (mouseY - prevPos.y) * ratio,
                    };
                });

                return targetScale;
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Mouse drag / pan handlers
    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        if (scale <= 1) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startPosRef.current = { ...position };
    };

    const handleMouseMove = (e) => {
        if (!isDragging || scale <= 1) return;
        e.preventDefault();
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setPosition({
            x: startPosRef.current.x + deltaX,
            y: startPosRef.current.y + deltaY,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Double click / Double tap to toggle zoom
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (scale > 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const clientX = e.clientX ?? (rect.left + rect.width / 2);
                const clientY = e.clientY ?? (rect.top + rect.height / 2);
                const mouseX = clientX - (rect.left + rect.width / 2);
                const mouseY = clientY - (rect.top + rect.height / 2);
                setScale(2.5);
                setPosition({
                    x: -mouseX * 1.5,
                    y: -mouseY * 1.5,
                });
            } else {
                setScale(2.5);
                setPosition({ x: 0, y: 0 });
            }
        }
    };

    // Mobile Touch Handlers: Pinch-to-zoom and Pan
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            // Two fingers: Pinch to zoom
            isPinchingRef.current = true;
            setIsDragging(false);
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchDistRef.current = dist;
            initialPinchScaleRef.current = scale;
        } else if (e.touches.length === 1) {
            // One finger: detect double tap or pan
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
                handleDoubleClick(e.touches[0]);
                lastTapRef.current = 0;
                return;
            }
            lastTapRef.current = now;

            if (scale > 1) {
                setIsDragging(true);
                dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                startPosRef.current = { ...position };
            }
        }
    };

    const handleTouchMove = (e) => {
        if (isPinchingRef.current && e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (initialPinchDistRef.current > 0) {
                const factor = dist / initialPinchDistRef.current;
                const newScale = Math.min(Math.max(initialPinchScaleRef.current * factor, 1), 6);
                setScale(newScale);
                if (newScale <= 1.05) {
                    setPosition({ x: 0, y: 0 });
                }
            }
        } else if (isDragging && e.touches.length === 1 && scale > 1) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - dragStartRef.current.x;
            const deltaY = e.touches[0].clientY - dragStartRef.current.y;
            setPosition({
                x: startPosRef.current.x + deltaX,
                y: startPosRef.current.y + deltaY,
            });
        }
    };

    const handleTouchEnd = (e) => {
        if (e.touches.length < 2) {
            isPinchingRef.current = false;
        }
        if (e.touches.length === 0) {
            setIsDragging(false);
            if (scale <= 1.05) {
                setScale(1);
                setPosition({ x: 0, y: 0 });
            }
        }
    };

    return ReactDOM.createPortal(
        <div
            className="oxypace-lightbox-backdrop"
            onClick={scale > 1 ? () => { setScale(1); setPosition({ x: 0, y: 0 }); } : onClose}
        >
            <div className="oxypace-lightbox-content" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    type="button"
                    className="oxypace-lightbox-close-btn"
                    onClick={onClose}
                    title="Kapat (Esc)"
                >
                    <X size={24} />
                </button>

                {/* Main Enlarge Image Display with Wheel & Touch Zoom */}
                <div
                    ref={containerRef}
                    className={`oxypace-lightbox-main ${scale > 1 ? 'is-zoomed' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    style={{
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                        touchAction: 'none',
                    }}
                >
                    <img
                        ref={imgRef}
                        src={getImageUrl(images[currentIndex])}
                        alt={`Büyütülmüş Görsel ${currentIndex + 1}`}
                        className="oxypace-lightbox-img"
                        draggable={false}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transition: isDragging || isPinchingRef.current ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                            transformOrigin: 'center center',
                            willChange: 'transform',
                        }}
                    />
                </div>

                {/* Nav Arrows */}
                {isMultiple && (
                    <>
                        <button
                            type="button"
                            className="oxypace-lightbox-nav-btn prev"
                            onClick={(e) => {
                                setScale(1);
                                setPosition({ x: 0, y: 0 });
                                onPrev(e);
                            }}
                            title="Önceki (Sol Ok)"
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            type="button"
                            className="oxypace-lightbox-nav-btn next"
                            onClick={(e) => {
                                setScale(1);
                                setPosition({ x: 0, y: 0 });
                                onNext(e);
                            }}
                            title="Sonraki (Sağ Ok)"
                        >
                            <ChevronRight size={32} />
                        </button>

                        {/* Top/Bottom Counter and Thumbs */}
                        <div className="oxypace-lightbox-footer">
                            <span className="oxypace-lightbox-counter">
                                {currentIndex + 1} / {images.length}
                            </span>
                            <div className="oxypace-lightbox-thumbs">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`oxypace-lightbox-thumb-btn ${idx === currentIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            setScale(1);
                                            setPosition({ x: 0, y: 0 });
                                            onSelectIndex(idx);
                                        }}
                                    >
                                        <img src={getImageUrl(img)} alt="" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default PostImageGallery;
