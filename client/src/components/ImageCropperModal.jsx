import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';
import './ImageCropperModal.css';

const ImageCropperModal = ({ image, onCropComplete, onCancel, aspect = null, title = "Resmi Düzenle" }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
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
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="cropper-controls">
                    <div className="zoom-control">
                        <span>Yakınlaştır</span>
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
                </div>

                <div className="cropper-actions">
                    <button className="cancel-btn" onClick={onCancel}>İptal</button>
                    <button className="apply-btn" onClick={handleCrop}>Uygula</button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
