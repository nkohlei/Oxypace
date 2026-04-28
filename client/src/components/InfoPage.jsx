import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InfoPage.css';

const InfoPage = ({ title, children, showBack = true }) => {
    const navigate = useNavigate();

    return (
        <div className="info-page-container animation-slide-in">
            <div className="info-page-header">
                <div className="title-group">
                    {showBack && (
                        <button 
                            className="minimal-back-btn" 
                            onClick={() => navigate(-1)}
                            aria-label="Geri"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    )}
                    <h1 className="gradient-title">{title}</h1>
                </div>
            </div>
            <div className="info-page-content">
                {children}
            </div>
        </div>
    );
};

export default InfoPage;
