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

    const handleCrop = async () => {
        if (loading) return;
        if (!croppedAreaPixels) {
            console.warn("Cropped area pixels not ready");
            return;
        }

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // UI update delay
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);

            if (!croppedImage) throw new Error("Crop result is empty");

            onCropComplete(croppedImage);
        } catch (e) {
            console.error("Crop error:", e);
            alert("Kırpma işlemi sırasında bir hata oluştu. Lütfen görseli değiştirip tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const isAvatar = aspect === 1;

    return (
        <div className="cropper-modal-overlay">
            <div className={`cropper-modal-container ${isAvatar ? 'modal-avatar-mode' : 'modal-cover-mode'}`}>
                <div className="cropper-modal-header">
                    <div className="header-title-group">
                        <h3>{title}</h3>
                        <span className="header-subtitle">{isAvatar ? 'Kişisel profil fotoğrafını ayarla' : 'Profilin için şık bir kapak seç'}</span>
                    </div>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>

                <div className={`cropper-wrapper ${isAvatar ? 'wrapper-avatar' : 'wrapper-cover'}`}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={isAvatar ? 'round' : 'rect'}
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        objectFit="horizontal-cover"
                    />
                </div>

                <div className="cropper-controls">
                    <div className="zoom-control-wrapper">
                        <div className="zoom-icon minus">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.05}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="zoom-range"
                        />
                        <div className="zoom-icon plus">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                    </div>
                </div>

                <div className="cropper-actions">
                    <button className="cancel-btn" onClick={onCancel}>İptal</button>
                    <button
                        className="apply-btn"
                        onClick={handleCrop}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loading-spinner-small"></div>
                        ) : 'Kaydet ve Uygula'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
