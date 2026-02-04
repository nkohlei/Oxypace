import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';
import './ImageCropperModal.css';

const ImageCropperModal = ({ image, onCropComplete, onCancel, aspect = null, title = "Resmi Düzenle" }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        if (loading) return; // Prevent double click
        setLoading(true);
        try {
            // Slight delay to allow UI to show loading state if image processing is instant
            await new Promise(resolve => setTimeout(resolve, 50));
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
            alert("Kırpma işlemi başarısız oldu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cropper-modal-overlay">
            <div className="cropper-modal-container">
                <div className="cropper-modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>

                <div className="cropper-wrapper">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={aspect === 1 ? 'round' : 'rect'} // Circular mask for Avatar
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="cropper-controls">
                    <div className="zoom-control">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="zoom-range"
                        />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </div>
                </div>

                <div className="cropper-actions">
                    <button className="cancel-btn" onClick={onCancel}>İptal</button>
                    <button
                        className="apply-btn"
                        onClick={handleCrop}
                        disabled={loading}
                    >
                        {loading ? 'İşleniyor...' : 'Uygula'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
