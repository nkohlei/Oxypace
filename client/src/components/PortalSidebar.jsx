import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [showFlyout, setShowFlyout] = useState(false);


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
            {/* Backdrop for global blur, still rendered in Portal to escape staking contexts */}
            {typeof document !== 'undefined' && createPortal(
                <div className={`flyout-backdrop-container ${showFlyout ? 'active' : ''}`}>
                    <div className="flyout-backdrop"></div>
                </div>,
                document.body
            )}

            <div className={`portal-sidebar ${showFlyout ? 'flyout-active' : ''}`}>
                {/* Hamburger Menu & Dropdown Wrapper - All in one interactive hit-box */}
                <div
                    className="dropdown-wrapper"
                    onMouseEnter={() => setShowFlyout(true)}
                    onMouseLeave={() => setShowFlyout(false)}
                >
                    {/* Hamburger Menu Icon (Trigger) */}
                    <div className={`sidebar-item hamburger-item ${showFlyout ? 'active' : ''}`}>
                        <div className="portal-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </div>
                    </div>

                    {/* Dropdown Menu Panel */}
                    <div className={`dropdown-panel ${showFlyout ? 'active' : ''}`}>
                        {/* Messages / Inbox */}
                        <div
                            className={`dropdown-item ${isActive('/inbox') ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handleNavigation('/inbox'); setShowFlyout(false); }}
                            style={{ transitionDelay: '0.05s' }}
                            title="Mesajlar"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>

                        {/* Search / Discover */}
                        <div
                            className={`dropdown-item ${isActive('/search') ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handleNavigation('/search'); setShowFlyout(false); }}
                            style={{ transitionDelay: '0.1s' }}
                            title="Keşfet"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>

                        {/* Create Portal Button */}
                        <div
                            className="dropdown-item create-action"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateModal(true);
                                setShowFlyout(false);
                            }}
                            style={{ transitionDelay: '0.15s' }}
                            title="Portal Oluştur"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>

                        {/* Channel Sidebar Toggle (Mobile/Window Mode) */}
                        <div
                            className="dropdown-item toggle-action"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSidebar();
                                setShowFlyout(false);
                            }}
                            style={{ transitionDelay: '0.2s' }}
                            title="Menüyü Aç/Kapat"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="13 17 18 12 13 7"></polyline>
                                <polyline points="6 17 11 12 6 7"></polyline>
                            </svg>
                        </div>
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

            </div>

            {/* Create Portal Modal */}
            {showCreateModal && <CreatePortalModal onClose={() => setShowCreateModal(false)} />}
        </>
    );
};

export default PortalSidebar;
