import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './SubHeader.css';

const SubHeader = ({ title, onBack, showBack = true, rightAction, variant }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const isFrosted = variant === 'frosted';

    if (isFrosted) {
        return (
            <div className="sub-header frosted">
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
        <div className="sub-header">
            <div className="sub-header-container">
                <div className="sub-header-left">
                    {showBack && (
                        <button 
                            className="sub-header-back-circle" 
                            onClick={handleBack} 
                            aria-label="Geri"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
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
