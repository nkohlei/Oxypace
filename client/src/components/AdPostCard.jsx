import React from 'react';
import { adsConfig } from '../config/ads';
import './AdPostCard.css';

const AdPostCard = ({ index = 0 }) => {
    // Pick an ad based on index or randomly
    const adList = adsConfig.postAds;
    if (!adList || adList.length === 0) return null;
    
    const adIndex = index % adList.length;
    const ad = adList[adIndex];

    const handleClick = (e) => {
        // If it starts with #, handle action (e.g. creating portal)
        if (ad.ctaUrl.startsWith('#')) {
            e.preventDefault();
            if (ad.ctaUrl === '#create-portal') {
                // Find and click the portal creation button, or redirect/trigger event
                const createBtn = document.querySelector('.add-portal-btn') || document.querySelector('[title="Sunucu Ekle"]');
                if (createBtn) {
                    createBtn.click();
                } else {
                    window.location.hash = 'create-portal';
                }
            }
        } else {
            // Normal navigation
            window.open(ad.ctaUrl, '_blank');
        }
    };

    return (
        <div className="ad-post-card">
            <div className="ad-avatar-container">
                <div className="ad-avatar">📢</div>
            </div>
            <div className="ad-content-wrapper">
                <div className="ad-header-row">
                    <div className="ad-brand-info">
                        <span className="ad-brand-name">Sponsor</span>
                        <span className="ad-sponsored-badge">Sponsorlu</span>
                    </div>
                </div>
                <h4 className="ad-title">{ad.title}</h4>
                <p className="ad-description">{ad.content}</p>
                {ad.image && (
                    <div className="ad-media-container">
                        <img 
                            src={ad.image} 
                            alt={ad.title} 
                            className="ad-image" 
                            loading="lazy"
                        />
                    </div>
                )}
                <div className="ad-footer">
                    <button className="ad-cta-button" onClick={handleClick}>
                        {ad.ctaText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdPostCard;
