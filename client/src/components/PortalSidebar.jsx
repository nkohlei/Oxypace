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
                            className={`sidebar-item ${isPortalActive(portal._id) ? 'active' : ''} ${isReordering ? 'reordering' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                            onClick={() => !isReordering && handleNavigation(`/portal/${portal._id}`)}
                            draggable={isReordering}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onMouseEnter={(e) => handleMouseEnter(e, portal.name)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="portal-icon">
                                {portal.avatar ? (
                                    <img src={getImageUrl(portal.avatar)} alt={portal.name} draggable="false" />
                                ) : (
                                    <span>{portal.name.substring(0, 2).toUpperCase()}</span>
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
                .sidebar-item.dragging .portal-icon {
                    border: 2px dashed var(--primary-color);
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
