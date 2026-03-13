import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './SubHeader.css';

const SubHeader = ({ title, onBack, showBack = true, rightAction }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="sub-header">
            <div className="sub-header-container">
                <div className="sub-header-left">
                    {showBack && (
                        <button className="sub-header-back" onClick={handleBack} aria-label="Geri">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <h2 className="sub-header-title">{title}</h2>
                </div>
                {rightAction && (
                    <div className="sub-header-right">
                        {rightAction}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubHeader;
