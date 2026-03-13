import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './SubHeader.css';

const SubHeader = ({ title, showBack = true, onBack, rightAction, variant, desktopHidden = false }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const isFrosted = variant === 'frosted';

    if (isFrosted && !title) {
        return (
            <div className={`sub-header frosted ${desktopHidden ? 'desktop-hidden' : ''}`}>
                {showBack && (
                    <button 
                        className="sub-header-back-circle frosted" 
                        onClick={handleBack} 
                        aria-label="Geri"
                    >
                        <ArrowLeft size={24} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`sub-header ${isFrosted ? 'frosted' : ''} ${desktopHidden ? 'desktop-hidden' : ''}`}>
            <div className="sub-header-container">
                <div className="sub-header-left">
                    {showBack && (
                        <button 
                            className={`sub-header-back-circle ${isFrosted ? 'frosted' : ''}`}
                            onClick={handleBack} 
                            aria-label="Geri"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>
                    )}
                    {title && <h2 className="sub-header-title">{title}</h2>}
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
