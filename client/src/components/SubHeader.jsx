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

    return (
        <div className={`sub-header ${isFrosted ? 'frosted' : ''}`}>
            <div className={isFrosted ? '' : 'sub-header-container'}>
                <div className={isFrosted ? '' : 'sub-header-left'}>
                    {showBack && (
                        <button 
                            className={`sub-header-back-circle ${isFrosted ? 'frosted' : ''}`} 
                            onClick={handleBack} 
                            aria-label="Geri"
                        >
                            <ArrowLeft size={isFrosted ? 24 : 20} strokeWidth={2.5} />
                        </button>
                    )}
                    {!isFrosted && <h2 className="sub-header-title">{title}</h2>}
                </div>
                {!isFrosted && rightAction && (
                    <div className="sub-header-right">
                        {rightAction}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubHeader;
