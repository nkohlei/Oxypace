import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
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
    
    // Reorder State
    const [orderedPortals, setOrderedPortals] = useState([]);
    const [isReordering, setIsReordering] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.joinedPortals) {
            setOrderedPortals(user.joinedPortals.filter((p) => p && p._id && p.name));
        }
    }, [user?.joinedPortals]);

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
                >
                    <div className="portal-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <div className="portal-tooltip">
                        <span className="tooltip-text">Mesajlar</span>
                        <div className="tooltip-arrow"></div>
                    </div>
                </div>

                <div className="sidebar-separator"></div>

                {/* User's Portals (Scrollable Area) */}
                <div className="portals-scroll-area">
                    {orderedPortals.map((portal, index) => (
                        <div
                            key={portal._id}
                            className={`sidebar-item ${isPortalActive(portal._id) ? 'active' : ''} ${isReordering ? 'reordering' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                            onClick={() => !isReordering && handleNavigation(`/portal/${portal._id}`)}
                            draggable={isReordering}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="portal-icon">
                                {portal.avatar ? (
                                    <img src={getImageUrl(portal.avatar)} alt={portal.name} draggable="false" />
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
                </div>

                <div className="sidebar-separator"></div>

                {/* Bottom Actions: Create Portal and Sidebar Toggle */}
                <div className="sidebar-bottom-actions">
                    <div
                        className={`sidebar-item ${isActive('/search') ? 'active' : ''}`}
                        onClick={() => handleNavigation('/search')}
                        style={isReordering ? { opacity: 0.3, pointerEvents: 'none' } : {}}
                    >
                        <div className="portal-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <div className="portal-tooltip">
                            <span className="tooltip-text">Keşfet</span>
                            <div className="tooltip-arrow"></div>
                        </div>
                    </div>

                    <div
                        className="sidebar-item create-action"
                        onClick={() => setShowCreateModal(true)}
                        style={isReordering ? { opacity: 0.3, pointerEvents: 'none' } : {}}
                    >
                        <div className="portal-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <div className="portal-tooltip">
                            <span className="tooltip-text">Portal Oluştur</span>
                            <div className="tooltip-arrow"></div>
                        </div>
                    </div>

                    <div className="sidebar-separator" style={{ margin: '4px auto' }}></div>
                    
                    <div
                        className={`sidebar-item ${isReordering ? 'active' : ''}`}
                        onClick={toggleReorderMode}
                        style={isSaving ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                    >
                        <div className="portal-icon" style={{ background: isReordering ? 'var(--primary-color)' : 'transparent', color: isReordering ? '#fff' : 'inherit' }}>
                            {isReordering ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            )}
                        </div>
                        <div className="portal-tooltip">
                            <span className="tooltip-text">{isReordering ? 'Kaydet' : 'Sırayı Düzenle'}</span>
                            <div className="tooltip-arrow"></div>
                        </div>
                    </div>
                </div>

                <style>{`
                .portal-tooltip {
                    position: absolute;
                    left: 50%;
                    bottom: calc(100% + 12px); /* Positioned above the icon */
                    transform: translateX(-50%) translateY(5px);
                    background-color: var(--bg-card);
                    color: var(--text-primary);
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 700;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
                    z-index: 1000;
                    pointer-events: none;
                    box-shadow: var(--shadow-popover);
                    border: 1px solid var(--border-subtle);
                }

                @media (max-width: 768px) {
                    .portal-tooltip {
                        bottom: calc(100% + 10px);
                        font-size: 12px;
                        padding: 6px 10px;
                    }
                }

                .portal-tooltip .tooltip-arrow {
                    position: absolute;
                    bottom: -6px; /* Arrow at bottom pointing down */
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid var(--bg-card);
                }

                .sidebar-item:hover .portal-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(0);
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
                .sidebar-item.dragging .portal-icon {
                    border: 2px dashed var(--primary-color);
                }
            `}</style>

            </div>

            {/* Create Portal Modal - Rendered at root level to bypass sidebar transforms */}
            {showCreateModal && createPortal(
                <CreatePortalModal onClose={() => setShowCreateModal(false)} />,
                document.body
            )}
        </>
    );
};

export default PortalSidebar;
