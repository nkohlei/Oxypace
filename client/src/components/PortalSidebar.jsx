import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useGlobalStore } from '../store/useGlobalStore';
import CreatePortalModal from './CreatePortalModal';
import { getImageUrl } from '../utils/imageUtils';
import './PortalSidebar.css';

const PortalSidebar = () => {
    const { user, isAuthenticated } = useAuth();
    const { closeSidebar, toggleSidebar } = useUI();
    const { unreadPostsByPortal, clearUnreadForPortal } = useGlobalStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Reorder & Tooltip State
    const [orderedPortals, setOrderedPortals] = useState([]);
    const [isReordering, setIsReordering] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleMouseEnter = (e, text) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveTooltip({
            text,
            top: rect.top + rect.height / 2,
            left: rect.right + 12
        });
    };

    const handleMouseLeave = () => {
        setActiveTooltip(null);
    };

    useEffect(() => {
        if (user?.joinedPortals) {
            setOrderedPortals(user.joinedPortals.filter((p) => p && p._id && p.name));
        }
    }, [user?.joinedPortals]);

    useEffect(() => {
        // Clear unread status when entering a portal
        const match = location.pathname.match(/\/portal\/([a-f\d]{24})/i);
        if (match && match[1]) {
            clearUnreadForPortal(match[1]);
        }
    }, [location.pathname, clearUnreadForPortal]);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newOrder = [...orderedPortals];
        const draggedItem = newOrder[draggedIndex];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, draggedItem);
        setDraggedIndex(index);
        setOrderedPortals(newOrder);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const toggleReorderMode = async () => {
        if (isReordering) {
            setIsSaving(true);
            try {
                const orderedIds = orderedPortals.map(p => p._id);
                await axios.put('/api/users/portals/reorder', { orderedPortalIds: orderedIds });
                setIsReordering(false);
            } catch (err) {
                console.error(err);
                alert('Sıralama güncellenemedi.');
            } finally {
                setIsSaving(false);
            }
        } else {
            setIsReordering(true);
        }
    };


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
                {/* Top Actions: Messages and Search */}
                <div
                    className={`sidebar-item ${isActive('/inbox') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/inbox')}
                    onMouseEnter={(e) => handleMouseEnter(e, 'Mesajlar')}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="portal-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                </div>

                <div className="sidebar-separator"></div>

                {/* User's Portals (Scrollable Area) */}
                <div className="portals-scroll-area">
                    {orderedPortals.map((portal, index) => (
                        <div
                            key={portal._id}
                            className={`sidebar-item ${isPortalActive(portal._id) ? 'active' : ''} ${isReordering ? 'reordering' : ''} ${draggedIndex === index ? 'dragging' : ''} ${unreadPostsByPortal[portal._id?.toString()]?.length > 0 ? 'has-unread' : ''}`}
                            onClick={() => !isReordering && handleNavigation(`/portal/${portal._id}`)}
                            draggable={isReordering}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onMouseEnter={(e) => handleMouseEnter(e, portal.name)}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* Discord-style left indicator bar - Edge Aligned */}
                            <div className="sidebar-indicator" />

                            <div className="portal-icon-container">
                                <div className="portal-icon">
                                    {portal.avatar ? (
                                        <img src={getImageUrl(portal.avatar)} alt={portal.name} draggable="false" />
                                    ) : (
                                        <span>{portal.name.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>

                                {/* Red Notification Badge - Moved outside .portal-icon to avoid clipping */}
                                {unreadPostsByPortal[portal._id?.toString()]?.length > 0 && (
                                    <div className="unread-badge">
                                        {unreadPostsByPortal[portal._id.toString()].length > 9 ? '9+' : unreadPostsByPortal[portal._id.toString()].length}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sidebar-separator"></div>

                {/* Bottom Actions: Create Portal and Sidebar Toggle */}
                <div className="sidebar-bottom-actions">
                    <div
                        className={`sidebar-item ${isActive('/search') ? 'active' : ''}`}
                        onClick={() => handleNavigation('/search')}
                        style={isReordering ? { opacity: 0.3, pointerEvents: 'none' } : {}}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Keşfet')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="portal-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                    </div>

                    <div
                        className="sidebar-item create-action"
                        onClick={() => setShowCreateModal(true)}
                        style={isReordering ? { opacity: 0.3, pointerEvents: 'none' } : {}}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Portal Oluştur')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="portal-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                    </div>

                    <div className="sidebar-separator" style={{ margin: '4px auto' }}></div>
                    
                    <div
                        className={`sidebar-item ${isReordering ? 'active' : ''}`}
                        onClick={toggleReorderMode}
                        style={isSaving ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                        onMouseEnter={(e) => handleMouseEnter(e, isReordering ? 'Kaydet' : 'Sırayı Düzenle')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="portal-icon" style={{ background: isReordering ? 'var(--primary-color)' : 'transparent', color: isReordering ? '#fff' : 'inherit' }}>
                            {isReordering ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            )}
                        </div>
                    </div>
                </div>

                <style>{`
                .portal-floating-tooltip {
                    position: fixed;
                    transform: translateY(-50%);
                    background-color: rgba(10, 15, 32, 0.95);
                    color: white;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                    z-index: 100000;
                    pointer-events: none;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    animation: tooltipFadeIn 0.15s ease-out;
                }

                @keyframes tooltipFadeIn {
                    from { opacity: 0; transform: translateY(-50%) translateX(-5px); }
                    to { opacity: 1; transform: translateY(-50%) translateX(0); }
                }

                @media (max-width: 768px) {
                    .portal-floating-tooltip {
                        font-size: 11px;
                        padding: 3px 8px;
                    }
                }

                .sidebar-item.reordering {
                    cursor: grab;
                }
                .sidebar-item.reordering:active {
                    cursor: grabbing;
                    transform: scale(0.95);
                }
                .sidebar-item.dragging {
                    opacity: 0.5;
                }
                .sidebar-item {
                    width: 72px !important; /* Full sidebar width */
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .sidebar-item.dragging .portal-icon {
                    border: 2px dashed var(--primary-color);
                }

                /* --- Discord-style Sidebar Enhancements --- */

                /* Left Indicator Bar - Fixed to very left edge */
                .sidebar-indicator {
                    position: absolute;
                    left: 0;
                    width: 4px;
                    height: 8px;
                    background-color: white;
                    border-radius: 0 4px 4px 0;
                    transform: scaleY(0);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0;
                    z-index: 100 !important; /* Always on top */
                }

                .sidebar-item.active .sidebar-indicator {
                    transform: scaleY(5); /* ~40px */
                    opacity: 1;
                }

                .sidebar-item:hover .sidebar-indicator {
                    transform: scaleY(2.5); /* ~20px */
                    opacity: 1;
                }

                .sidebar-item.has-unread:not(.active):not(:hover) .sidebar-indicator {
                    transform: scaleY(1); /* 8px small dot */
                    opacity: 1;
                }

                /* New container for icon + badge + pulse */
                .portal-icon-container {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 5;
                }

                /* Red Notification Badge - Outside the clipped circle */
                .unread-badge {
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    background-color: #f23f43; /* Discord-red */
                    color: white;
                    font-size: 11px;
                    font-weight: 800;
                    min-width: 18px;
                    height: 18px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 3.5px solid var(--bg-darker);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    pointer-events: none;
                    z-index: 80; /* Above the icon and pulse */
                }

                /* Blue Pulsing Frame ("Çerçeve") - Now on the container to avoid clipping */
                .sidebar-item.has-unread:not(.active) .portal-icon-container::after {
                    content: '';
                    position: absolute;
                    inset: -3px;
                    border: 2px solid #00d2ff;
                    border-radius: 50%;
                    animation: portalUnreadPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    pointer-events: none;
                    box-shadow: 0 0 12px rgba(0, 210, 255, 0.7);
                    z-index: 60; /* Below badge, above icon */
                }

                @keyframes portalUnreadPulse {
                    0% {
                        opacity: 0.7;
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(0, 210, 255, 0.7);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05);
                        box-shadow: 0 0 0 8px rgba(0, 210, 255, 0);
                    }
                    100% {
                        opacity: 0.7;
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(0, 210, 255, 0);
                    }
                }

                /* Subtle pulse for the whole icon area */
                .sidebar-item.has-unread:not(.active) .portal-icon-container {
                    animation: subtlePulse 2s infinite ease-in-out;
                }

                @keyframes subtlePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }

                .portal-icon {
                    /* Original styles from PortalSidebar.css are preserved, 
                       but we ensure it stays exactly 48x48 here */
                    width: 48px;
                    height: 48px;
                    z-index: 10;
                }
            `}</style>

            </div>

            {/* Floating Tooltip via Portal */}
            {activeTooltip && createPortal(
                <div 
                    className="portal-floating-tooltip"
                    style={{ top: `${activeTooltip.top}px`, left: `${activeTooltip.left}px` }}
                >
                    {activeTooltip.text}
                </div>,
                document.body
            )}

            {/* Create Portal Modal - Rendered at root level to bypass sidebar transforms */}
            {showCreateModal && createPortal(
                <CreatePortalModal onClose={() => setShowCreateModal(false)} />,
                document.body
            )}
        </>
    );
};

export default PortalSidebar;
