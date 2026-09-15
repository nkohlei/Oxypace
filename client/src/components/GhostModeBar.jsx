import React from 'react';
import { Ghost } from 'lucide-react';
import './GhostModeBar.css';

const GhostModeBar = ({ user }) => {
    const handleExitGhostMode = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const backupToken = localStorage.getItem('admin_backup_token');
        if (backupToken) {
            localStorage.setItem('token', backupToken);
            localStorage.removeItem('admin_backup_token');
            window.location.href = '/admin';
        } else {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const targetUsername = user?.username ? `@${user.username}` : '@kullanıcı';

    return (
        <div className="ghost-mode-header-bar" role="status" aria-label="Hayalet Modu Aktif">
            <div className="ghost-bar-indicator">
                <div className="ghost-icon-pulse">
                    <Ghost size={16} className="ghost-svg-animated" />
                </div>
                <div className="ghost-bar-details">
                    <span className="ghost-bar-badge">HAYALET MODU</span>
                    <span className="ghost-bar-separator">//</span>
                    <span className="ghost-bar-target" title={`İzlenen Kullanıcı: ${targetUsername}`}>{targetUsername}</span>
                    <span className="ghost-bar-readonly">(Salt Okunur)</span>
                </div>
            </div>

            <button 
                type="button" 
                onClick={handleExitGhostMode} 
                className="ghost-bar-exit-btn"
                title="Hayalet modundan çıkıp admin paneline geri dön"
            >
                <span className="exit-btn-desktop">MODDAN ÇIK</span>
                <span className="exit-btn-mobile">ÇIK</span>
            </button>
        </div>
    );
};

export default GhostModeBar;
