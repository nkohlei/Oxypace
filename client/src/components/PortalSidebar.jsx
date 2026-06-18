import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useGlobalStore } from '../store/useGlobalStore';
import CreatePortalModal from './CreatePortalModal';
import { getImageUrl } from '../utils/imageUtils';
import { MessageSquare, Compass, Plus, Save, ArrowUpDown } from 'lucide-react';
import './PortalSidebar.css';

const PortalSidebar = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const { closeSidebar, toggleSidebar } = useUI();
    const unreadPostsByPortal = useGlobalStore(state => state.unreadPostsByPortal);
    const unreadPostsByChannel = useGlobalStore(state => state.unreadPostsByChannel);
    const clearUnreadForPortal = useGlobalStore(state => state.clearUnreadForPortal);
    const syncUnreadCounts = useGlobalStore(state => state.syncUnreadCounts);
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Helper to filter unread counts based on user's muted channels settings
    const getFilteredUnreadCount = (portalId) => {
        if (!portalId) return 0;
        const settings = user?.portalNotificationSettings?.find(
            (s) => s.portal?.toString() === portalId.toString()
        );
        if (settings?.isAllMuted) return 0;
        
        const allUnread = unreadPostsByPortal[portalId.toString()] || [];
        const mutedChannels = settings?.mutedChannels?.map(id => id.toString()) || [];
        
        const filtered = allUnread.filter(postId => {
            const isMuted = mutedChannels.some(channelId => 
                unreadPostsByChannel[channelId]?.includes(postId)
            );
            return !isMuted;
        });
        
        return filtered.length;
    };
    
    // Reorder & Tooltip State
    const [orderedPortals, setOrderedPortals] = useState([]);
    const [isReordering, setIsReordering] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const source = user?.portals || user?.joinedPortals;
        if (source) {
            setOrderedPortals(source.filter((p) => p && p._id && p.name));
            // Sync unread counts from server to ensure offline accuracy
            syncUnreadCounts();
        }
    }, [user?.portals, user?.joinedPortals, syncUnreadCounts]);

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

    const handleDragEnd = async () => {
        setDraggedIndex(null);
        setIsSaving(true);
        try {
            const orderedIds = orderedPortals.map(p => p._id);
            const response = await axios.post('/api/users/updatePortalOrder', { orderedPortalIds: orderedIds });
            
            if (user && response.data.user) {
                updateUser(response.data.user);
            } else if (user) {
                updateUser({ 
                    ...user, 
                    portals: orderedPortals,
                    joinedPortals: orderedPortals 
                });
            }
        } catch (err) {
            console.error('Failed to update portal order:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTouchStart = (e, index) => {
        if (!isReordering) return;
        setDraggedIndex(index);
    };

    const handleTouchMove = (e) => {
        if (!isReordering || draggedIndex === null) return;
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return;
        
        const sidebarItem = element.closest('.sidebar-item');
        if (!sidebarItem) return;
        
        const items = Array.from(document.querySelectorAll('.portals-scroll-area .sidebar-item'));
        const targetIndex = items.indexOf(sidebarItem);
        
        if (targetIndex !== -1 && targetIndex !== draggedIndex) {
            const newOrder = [...orderedPortals];
            const draggedItem = newOrder[draggedIndex];
            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedItem);
            setDraggedIndex(targetIndex);
            setOrderedPortals(newOrder);
        }
    };

    const handleTouchEnd = () => {
        if (draggedIndex !== null) {
            handleDragEnd();
        }
    };

    const toggleReorderMode = () => {
        setIsReordering(!isReordering);
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
                        <MessageSquare size={20} strokeWidth={2} />
                    </div>
                </div>

                <div className="sidebar-separator"></div>

                {/* User's Portals (Scrollable Area) */}
                <div className="portals-scroll-area">
                    {orderedPortals.map((portal, index) => {
                        const filteredCount = getFilteredUnreadCount(portal._id);
                        return (
                            <div
                                key={portal._id}
                                draggable={isReordering}
                                className={`sidebar-item ${isPortalActive(portal._id) ? 'active' : ''} ${isReordering ? 'reordering' : ''} ${draggedIndex === index ? 'dragging' : ''} ${filteredCount > 0 ? 'has-unread' : ''}`}
                                onClick={() => !isReordering && handleNavigation(`/portal/${portal._id}`)}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onTouchStart={(e) => handleTouchStart(e, index)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
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
                                    {filteredCount > 0 && (
                                        <div className="unread-badge">
                                            {filteredCount > 9 ? '9+' : filteredCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                            <Compass size={20} strokeWidth={2} />
                        </div>
                    </div>

                    <div
                        className="sidebar-item create-action"
                        onClick={() => setShowCreateModal(true)}
                        style={isReordering ? { opacity: 0.3, pointerEvents: 'none' } : {}}
                    >
                        <div className="portal-icon">
                            <Plus size={20} strokeWidth={2} />
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
                                <Save size={20} strokeWidth={2.5} />
                            ) : (
                                <ArrowUpDown size={20} strokeWidth={2} />
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
                    touch-action: none;
                }
                .sidebar-item.reordering:active {
                    cursor: grabbing;
                    transform: scale(0.95);
                }
                .sidebar-item.dragging {
                    opacity: 0.5;
                }
                .sidebar-item {
                    width: 100% !important; /* Full sidebar width to align indicator */
                    height: 56px; /* Slightly taller for padding */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: visible !important; /* CRITICAL: Allow badges to overflow */
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
                    top: -2px; /* Moved to top-right for better visibility */
                    right: -2px;
                    background-color: #f23f43; /* Discord-red */
                    color: white;
                    font-size: 11px;
                    font-weight: 800;
                    min-width: 18px;
                    height: 18px;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 3px solid var(--bg-darker);
                    box-shadow: 0 0 0 2px rgba(0,0,0,0.2);
                    pointer-events: none;
                    z-index: 100; /* Ensure it stays above everything */
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

            {/* Floating Tooltip via Portal removed */}

            {/* Create Portal Modal - Rendered at root level to bypass sidebar transforms */}
            {showCreateModal && createPortal(
                <CreatePortalModal onClose={() => setShowCreateModal(false)} />,
                document.body
            )}
        </>
    );
};

export default PortalSidebar;
