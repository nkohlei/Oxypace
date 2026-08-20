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
 * Fullscreen Lightbox Modal Portal
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

    return ReactDOM.createPortal(
        <div className="oxypace-lightbox-backdrop" onClick={onClose}>
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

                {/* Main Enlarge Image Display */}
                <div className="oxypace-lightbox-main">
                    <img
                        src={getImageUrl(images[currentIndex])}
                        alt={`Büyütülmüş Görsel ${currentIndex + 1}`}
                        className="oxypace-lightbox-img"
                    />
                </div>

                {/* Nav Arrows */}
                {isMultiple && (
                    <>
                        <button
                            type="button"
                            className="oxypace-lightbox-nav-btn prev"
                            onClick={onPrev}
                            title="Önceki (Sol Ok)"
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            type="button"
                            className="oxypace-lightbox-nav-btn next"
                            onClick={onNext}
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
                                        onClick={() => onSelectIndex(idx)}
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
