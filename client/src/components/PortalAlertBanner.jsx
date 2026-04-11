import { useState, useEffect } from 'react';
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
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
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
};

export default PortalAlertBanner;
