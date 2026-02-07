import React from 'react';
import './ProfileImageModal.css';

const ProfileImageModal = ({ isOpen, onClose, imageSrc, isOwnProfile, onEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="profile-image-modal-overlay" onClick={onClose}>
            <div className="profile-image-modal-content" onClick={e => e.stopPropagation()}>
                <button className="profile-image-modal-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="profile-image-container">
                    <img src={imageSrc} alt="Profile" className="profile-image-full" />
                </div>

                {isOwnProfile && (
                    <button className="profile-image-edit-btn" onClick={() => {
                        onEdit();
                        onClose(); // Optional: close modal after clicking edit, or keep it open? 
                        // User request implies "edit button is IN the modal", so clicking it likely triggers the file selector.
                        // The file selector change will eventually trigger the cropper, which is a separate modal.
                        // So closing this view modal seems appropriate when transitioning to the edit flow.
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Profil Fotoğrafını Düzenle
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileImageModal;
