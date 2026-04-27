import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';
import './ProfileImageModal.css';

const ProfileImageModal = ({ isOpen, onClose, imageSrc, isOwnProfile, onEdit, username }) => {
    const [imgError, setImgError] = useState(false);

    if (!isOpen) return null;

    const hasValidImage = imageSrc && !imgError;

    return (
        <div className="profile-image-modal-overlay" onClick={onClose}>
            <div className="profile-image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="profile-image-modal-close" onClick={onClose}>
                    <X size={24} strokeWidth={2} />
                </button>

                <div className="profile-image-container">
                    {hasValidImage ? (
                        <img
                            src={imageSrc}
                            alt="Profile"
                            className="profile-image-full"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="profile-image-placeholder-large">
                            {username?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>

                {isOwnProfile && (
                    <button
                        className="profile-image-edit-btn"
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                    >
                        <Edit size={20} strokeWidth={2} />
                        Profil Fotoğrafını Düzenle
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileImageModal;
