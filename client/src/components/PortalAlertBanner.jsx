import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import './PortalAlertBanner.css';

const PortalAlertBanner = ({ alerts = [] }) => {
    const [dismissedAlerts, setDismissedAlerts] = useState(() => {
        // Load dismissed alerts from sessionStorage
        try {
            const stored = sessionStorage.getItem('dismissed_portal_alerts');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [dismissingId, setDismissingId] = useState(null);

    // Filter out dismissed alerts
    const visibleAlerts = alerts.filter(
        alert => !dismissedAlerts.includes(alert._id)
    );

    const handleDismiss = (alertId) => {
        setDismissingId(alertId);
        // Wait for animation to complete
        setTimeout(() => {
            const updated = [...dismissedAlerts, alertId];
            setDismissedAlerts(updated);
            try {
                sessionStorage.setItem('dismissed_portal_alerts', JSON.stringify(updated));
            } catch { /* ignore */ }
            setDismissingId(null);
        }, 300);
    };

    // Helper: Calculate remaining time
    const getTimeRemaining = (expiresAt) => {
        const now = new Date();
        const end = new Date(expiresAt);
        const diff = end - now;

        if (diff <= 0) return null;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);

        if (days > 0) return `${days} gün ${hours} saat kaldı`;
        if (hours > 0) return `${hours} saat ${minutes} dk kaldı`;
        return `${minutes} dakika kaldı`;
    };

    if (visibleAlerts.length === 0) return null;

    return (
        <>
            {visibleAlerts.map(alert => (
                <div
                    key={alert._id}
                    className={`portal-alert-banner ${dismissingId === alert._id ? 'dismissing' : ''}`}
                >
                    <div className="alert-banner-inner">
                        {/* Icon */}
                        <div className="alert-banner-icon">
                            <AlertTriangle size={18} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <div className="alert-banner-content">
                            <div className="alert-banner-label">
                                <span>Yönetici Uyarısı</span>
                            </div>
                            <div className="alert-banner-message">
                                {alert.message}
                            </div>
                            <div className="alert-banner-meta">
                                <span className="alert-banner-time">
                                    <Clock size={16} strokeWidth={2} />
                                    {getTimeRemaining(alert.expiresAt) || 'Süresi dolmak üzere'}
                                </span>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            className="alert-banner-close"
                            onClick={() => handleDismiss(alert._id)}
                            title="Uyarıyı gizle"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
};

export default PortalAlertBanner;
