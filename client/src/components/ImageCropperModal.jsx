import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';
import './ImageCropperModal.css';

const ImageCropperModal = ({ image, onCropComplete, onCancel, aspect, title }) => {
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

    const handleApply = async () => {
        if (loading) return;
        if (!croppedAreaPixels) {
            alert("Lütfen bir alan seçin.");
            return;
        }

        setLoading(true);
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
            // Modal'ı kapatma işlemi ebeveyn bileşende yapılıyor
        } catch (e) {
            console.error("Cropping failed:", e);
            alert("Hata: " + (e.message || "Bilinmeyen hata oluştu"));
        } finally {
            setLoading(false);
        }
    };

    // Determine shape and styles based on aspect ratio
    // If aspect is 1, it's a circle (avatar). If null/undefined, it's strictly rectangular (cover).
    const isAvatar = aspect === 1;

    return (
        <div className="cropper-modal-overlay">
            <div className="cropper-modal-container">
                <div className="cropper-modal-header">
                    <h3>{title || (isAvatar ? 'Profil Fotoğrafı' : 'Kapak Fotoğrafı')}</h3>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>

                <div className="cropper-wrapper">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect} // might be null for cover
                        cropShape={isAvatar ? 'round' : 'rect'}
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        // Restrict drag if needed, or allow free movement
                        restrictPosition={false}
                    />
                </div>

                <div className="cropper-controls">
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
                </div>

                <div className="cropper-actions">
                    <button className="cancel-btn" onClick={onCancel}>İptal</button>
                    <button
                        className="apply-btn"
                        onClick={handleApply}
                        disabled={loading}
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet ve Uygula'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
