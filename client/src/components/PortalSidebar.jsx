import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import CreatePortalModal from './CreatePortalModal';
import { getImageUrl } from '../utils/imageUtils';
import './PortalSidebar.css';

const PortalSidebar = () => {
    const { user, isAuthenticated } = useAuth();
    const { closeSidebar, toggleSidebar } = useUI();
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // If not authenticated, don't show sidebar (or show limited version)
    if (!isAuthenticated) return null;

    const isActive = (path) => {
        return location.pathname === path;
    };

    const isPortalActive = (portalId) => {
        return location.pathname === `/portal/${portalId}`;
    };

    const handleNavigation = (path) => {
        navigate(path);
        closeSidebar();
    };

    return (
        <>
            <div className="portal-sidebar">
                {/* Close/Back Button at top */}
                {/* Close/Back Button Removed - Integrated into Toggle Arrow */}

                {/* Messages / Inbox */}
                <div
                    className={`sidebar-item ${isActive('/inbox') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/inbox')}
                    data-tooltip="Mesajlar"
                >
                    <div className="portal-icon">
                        <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                </div>

                <div className="sidebar-separator"></div>

                {/* User's Portals */}
                {user?.joinedPortals &&
                    user.joinedPortals
                        .filter((p) => p && p._id && p.name) // Strict filter
                        .map((portal) => (
                            <div
                                key={portal._id}
                                className={`sidebar-item ${isPortalActive(portal._id) ? 'active' : ''}`}
                                onClick={() => handleNavigation(`/portal/${portal._id}`)}
                            >
                                <div className="portal-icon">
                                    {portal.avatar ? (
                                        <img src={getImageUrl(portal.avatar)} alt={portal.name} />
                                    ) : (
                                        <span>{portal.name.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>

                                {/* Hover Tooltip (Simple Bubble Style) */}
                                <div className="portal-tooltip">
                                    <span className="tooltip-text">{portal.name}</span>
                                    <div className="tooltip-arrow"></div>
                                </div>
                            </div>
                        ))}

                <style>{`
                .portal-tooltip {
                    position: absolute;
                    left: 78px; /* Default Desktop (72px + gap) */
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: var(--bg-card);
                    color: var(--text-primary);
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 700;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.1s cubic-bezier(0.1, 0.7, 1.0, 0.1);
                    z-index: 1000;
                    pointer-events: none;
                    box-shadow: var(--shadow-popover);
                    border: 1px solid var(--border-subtle);
                }

                @media (max-width: 768px) {
                    .portal-tooltip {
                        left: 48px; /* Mobile (42px + gap) */
                    }
                }

                .portal-tooltip .tooltip-arrow {
                    position: absolute;
                    left: -6px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: 0;
                    border-top: 6px solid transparent;
                    border-bottom: 6px solid transparent;
                    border-right: 6px solid var(--bg-card);
                }

                .sidebar-item:hover .portal-tooltip {
                    opacity: 1;
                    visibility: visible;
                }
            `}</style>

                <div className="sidebar-separator"></div>

                {/* Search / Discover */}
                <div
                    className={`sidebar-item ${isActive('/search') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/search')}
                    data-tooltip="Keşfet"
                >
                    <div className="portal-icon">
                        <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>

                {/* Create Portal Button */}
                <div
                    className="sidebar-item"
                    onClick={() => {
                        setShowCreateModal(true);
                        // Do not close sidebar as per request
                    }}
                    data-tooltip="Portal Oluştur"
                >
                    <div className="portal-icon create-portal-btn">
                        <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </div>

                {/* Channel Sidebar Toggle (Mobile/Window Mode) */}
                <div
                    className="sidebar-item toggle-channels-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSidebar();
                    }}
                    title="Yan Menüyü Aç/Kapat"
                >
                    <div className="portal-icon">
                        <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="13 17 18 12 13 7"></polyline>
                            <polyline points="6 17 11 12 6 7"></polyline>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Create Portal Modal */}
            {showCreateModal && <CreatePortalModal onClose={() => setShowCreateModal(false)} />}
        </>
    );
};

export default PortalSidebar;
