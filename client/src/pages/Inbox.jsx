import React, { Fragment, useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Search,
    MoreVertical,
    Info,
    CheckSquare,
    BellOff,
    Bell,
    Timer,
    Palette,
    Heart,
    Download,
    XCircle,
    Flag,
    Ban,
    MinusCircle,
    Trash2,
    Pin,
    X,
    ChevronUp,
    ChevronDown,
    Copy,
    Star,
    Forward,
    Lock,
} from 'lucide-react';
import { uploadFile } from '../utils/uploadUtils';
import { normalizeImageFilesForBrowser } from '../utils/heicHelper';
import { copyTextSafely } from '../utils/shareUtils';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import MessageBubble from '../components/MessageBubble';
import NewMessageModal from '../components/NewMessageModal';
import ReportModal from '../components/ReportModal';
import {
    CHAT_THEMES,
    ContactInfoDrawer,
    MessageInfoModal,
    ForwardMessageModal,
    ChatThemeModal,
    DisappearingMessagesModal,
    MuteChatModal,
    DeleteMessageModal,
    ConfirmChatActionModal,
    formatDisappearingLabel,
} from '../components/ChatModals';
import UserAvatar from '../components/UserAvatar';
import { getImageUrl } from '../utils/imageUtils';
import UserBadges from '../components/UserBadges';
import UserBar from '../components/UserBar';
import { useGlobalStore } from '../store/useGlobalStore';
import { dismissDeliveredMessageNotifications, setActiveChatPartner } from '../utils/notificationUtils';
import { preloadUsers } from '../utils/preloadUtils';
import './Inbox.css';

const formatDateDivider = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) {
        return 'Bugün';
    } else if (isSameDay(date, yesterday)) {
        return 'Dün';
    } else {
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
    }
};

const Inbox = () => {
    const [searchParams] = useSearchParams();
    const { userId: routeUserId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const isGhost = typeof window !== 'undefined' && !!localStorage.getItem('admin_backup_token');
    const [conversations, setConversations] = useState(() => {
        try {
            const cached = localStorage.getItem('oxypace_cached_conversations');
            if (cached) {
                const parsed = JSON.parse(cached);
                preloadUsers(parsed.map(c => c.user).filter(Boolean));
                return parsed;
            }
        } catch (_) {}
        return [];
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(() => {
        try {
            return !localStorage.getItem('oxypace_cached_conversations');
        } catch (_) {
            return true;
        }
    });
    const [messagesLoading, setMessagesLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [media, setMedia] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [typingUsers, setTypingUsers] = useState({}); // userId -> boolean
    const typingTimeoutRef = useRef(null);
    const [isTypingSent, setIsTypingSent] = useState(false);
    const [showNewMessageModal, setShowNewMessageModal] = useState(false); // Modal State
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [activeFloatingDate, setActiveFloatingDate] = useState('');
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const docInputRef = useRef(null);
    const plusMenuRef = useRef(null);
    const plusButtonRef = useRef(null);
    const selectedUserRef = useRef(selectedUser);

    // WhatsApp-style Chat Settings, Search, Multi-Select & Modals State
    const [chatPreferences, setChatPreferences] = useState({});
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'favorites'
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [chatMenuPos, setChatMenuPos] = useState({ top: 0, right: 16 });
    const chatMenuBtnRef = useRef(null);
    const chatMenuRef = useRef(null);

    const [showChatSearch, setShowChatSearch] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [chatSearchIdx, setChatSearchIdx] = useState(0);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [activePinnedIdx, setActivePinnedIdx] = useState(0);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [chatScrollReady, setChatScrollReady] = useState(true);
    const isNearBottomRef = useRef(true);
    const lastMessageIdRef = useRef(null);
    const initialPinUntilRef = useRef(0);

    const [selectMode, setSelectMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);

    const [showContactInfo, setShowContactInfo] = useState(false);
    const [infoModalData, setInfoModalData] = useState(null); // { message, isOwn }
    const [forwardMessages, setForwardMessages] = useState(null); // Message[]
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showDisappearingModal, setShowDisappearingModal] = useState(false);
    const [showMuteModal, setShowMuteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { ids: string[], canDeleteForEveryone: boolean }
    const [confirmAction, setConfirmAction] = useState(null); // 'clear' | 'deleteChat'
    const [inboxToast, setInboxToast] = useState('');
    const toastTimerRef = useRef(null);

    const showToast = useCallback((msg) => {
        setInboxToast(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setInboxToast(''), 2600);
    }, []);

    const fetchChatPreferences = useCallback(async () => {
        try {
            const res = await axios.get('/api/messages/preferences');
            if (res.data && typeof res.data === 'object') {
                setChatPreferences(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch chat preferences:', err);
        }
    }, []);

    useEffect(() => {
        fetchChatPreferences();
    }, [fetchChatPreferences]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    const selectedPartnerId = selectedUser?._id ? String(selectedUser._id) : null;
    const currentPrefs = useMemo(() => {
        const defaults = {
            mutedUntil: null,
            isFavorite: false,
            theme: 'default',
            disappearingSeconds: 0,
            isBlocked: false,
            blockedByPartner: false,
        };
        if (!selectedPartnerId) return defaults;
        return { ...defaults, ...(chatPreferences[selectedPartnerId] || {}) };
    }, [chatPreferences, selectedPartnerId]);

    const isCurrentChatMuted = Boolean(
        currentPrefs.mutedUntil && new Date(currentPrefs.mutedUntil) > new Date()
    );

    const pinnedMessages = useMemo(
        () => messages.filter((m) => Boolean(m.pinned)),
        [messages]
    );

    const searchMatchedIds = useMemo(() => {
        const q = chatSearchQuery.trim().toLowerCase();
        if (!showChatSearch || !q) return [];
        return messages
            .filter((m) => (m.content || '').toLowerCase().includes(q) || (m.mediaName || '').toLowerCase().includes(q))
            .map((m) => String(m._id));
    }, [messages, showChatSearch, chatSearchQuery]);

    const jumpToMessage = useCallback((messageId) => {
        const idStr = String(messageId);
        const container = messagesContainerRef.current;
        if (!container) return;
        const el = container.querySelector(`[data-message-id="${idStr}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(idStr);
            setTimeout(() => {
                setHighlightedMessageId((prev) => (prev === idStr ? null : prev));
            }, 1700);
        }
    }, []);

    useEffect(() => {
        if (searchMatchedIds.length > 0) {
            const safeIdx = Math.min(chatSearchIdx, searchMatchedIds.length - 1);
            if (safeIdx !== chatSearchIdx) setChatSearchIdx(safeIdx);
            jumpToMessage(searchMatchedIds[safeIdx]);
        }
    }, [searchMatchedIds, chatSearchIdx, jumpToMessage]);

    // Close chat header menu on outside click or Escape
    useEffect(() => {
        if (!showChatMenu) return;
        const handleOutside = (e) => {
            if (chatMenuRef.current?.contains(e.target)) return;
            if (chatMenuBtnRef.current?.contains(e.target)) return;
            setShowChatMenu(false);
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') setShowChatMenu(false);
        };
        const t = setTimeout(() => {
            document.addEventListener('mousedown', handleOutside);
            document.addEventListener('touchstart', handleOutside, { passive: true });
            document.addEventListener('keydown', handleKey);
        }, 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [showChatMenu]);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const markConversationAsRead = useCallback(async (targetUserId) => {
        if (!targetUserId || isGhost) return;
        const targetIdStr = String(targetUserId);
        try {
            if (socket) {
                socket.emit('mark_messages_read', { senderId: targetIdStr });
            }
            await axios.put(`/api/messages/${targetIdStr}/read`);
            useGlobalStore.getState().fetchUnreadMessagesCount();
        } catch (err) {
            console.error('Failed to mark conversation as read:', err);
        }
    }, [socket, isGhost]);

    useEffect(() => {
        if (selectedUser?._id) {
            const partnerId = String(selectedUser._id);
            useGlobalStore.getState().setActiveChatUserId(partnerId);
            markConversationAsRead(partnerId);
            dismissDeliveredMessageNotifications(partnerId);
            setActiveChatPartner(partnerId);
            if (socket) {
                socket.emit('enter_conversation', { partnerId });
            }
        } else {
            useGlobalStore.getState().setActiveChatUserId(null);
            setActiveChatPartner(null);
            if (socket) {
                socket.emit('leave_conversation');
            }
        }

        return () => {
            setActiveChatPartner(null);
            if (socket) {
                socket.emit('leave_conversation');
            }
        };
    }, [selectedUser, markConversationAsRead, socket]);

    useEffect(() => {
        return () => {
            useGlobalStore.getState().setActiveChatUserId(null);
            setActiveChatPartner(null);
            if (socket) {
                socket.emit('leave_conversation');
            }
        };
    }, [socket]);

    // Compute menu position from button's bounding rect
    const computeMenuPosition = useCallback(() => {
        if (plusButtonRef.current) {
            const rect = plusButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.top - 8, // 8px gap above the button
                left: rect.left,
            });
        }
    }, []);

    // Toggle handler for the plus button
    const handlePlusToggle = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPlusMenu(prev => {
            if (!prev) {
                // Opening: compute position now
                if (plusButtonRef.current) {
                    const rect = plusButtonRef.current.getBoundingClientRect();
                    setMenuPosition({
                        top: rect.top - 8,
                        left: rect.left,
                    });
                }
            }
            return !prev;
        });
    }, []);

    // Close menu on outside click/tap
    useEffect(() => {
        if (!showPlusMenu) return;

        const handleClickOutside = (e) => {
            const clickedMenu = e.target.closest('.inbox-plus-menu-portal');
            const clickedButton = e.target.closest('.upload-btn');
            if (!clickedMenu && !clickedButton) {
                setShowPlusMenu(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showPlusMenu]);

    // Reset on unmount
    useEffect(() => {
        return () => setShowPlusMenu(false);
    }, []);

    // Reset when switching conversations
    useEffect(() => {
        setShowPlusMenu(false);
        setShowChatMenu(false);
        setShowChatSearch(false);
        setChatSearchQuery('');
        setChatSearchIdx(0);
        setSelectMode(false);
        setSelectedMessageIds([]);
        setActivePinnedIdx(0);
        setShowContactInfo(false);
        setShowScrollToBottom(false);
    }, [selectedUser]);

    const scrollToBottom = useCallback((instant = true) => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
        }
    }, []);

    useEffect(() => {
        fetchConversations();

        const targetUserParam = routeUserId || searchParams.get('user');
        if (targetUserParam) {
            fetchUserByUsername(targetUserParam);
        }
    }, [searchParams, routeUserId]);

    const updateConversationInstant = useCallback((message, incrementUnread = false) => {
        setConversations((prevConvs) => {
            const senderId = String(message.sender?._id || message.sender);
            const recipientId = String(message.recipient?._id || message.recipient);
            const currentUserId = String(user._id);
            const otherUserId = senderId === currentUserId ? recipientId : senderId;

            const existingIndex = prevConvs.findIndex(c => String(c.user?._id) === String(otherUserId));
            const isCurrentlySelected = selectedUserRef.current && String(selectedUserRef.current._id) === String(otherUserId);

            if (existingIndex > -1) {
                const existing = prevConvs[existingIndex];
                const updatedConv = {
                    ...existing,
                    lastMessage: {
                        ...message,
                        sender: typeof message.sender === 'object' ? message.sender : { _id: senderId }
                    },
                    unreadCount: isCurrentlySelected ? 0 : (incrementUnread ? (existing.unreadCount || 0) + 1 : (existing.unreadCount || 0))
                };
                const newConvs = [...prevConvs];
                newConvs.splice(existingIndex, 1);
                return [updatedConv, ...newConvs];
            } else {
                const otherUserObj = senderId === currentUserId 
                    ? (typeof message.recipient === 'object' ? message.recipient : selectedUserRef.current)
                    : (typeof message.sender === 'object' ? message.sender : null);
                
                if (!otherUserObj || !otherUserObj._id) return prevConvs;

                const newConv = {
                    user: otherUserObj,
                    lastMessage: {
                        ...message,
                        sender: typeof message.sender === 'object' ? message.sender : { _id: senderId }
                    },
                    unreadCount: isCurrentlySelected ? 0 : (incrementUnread ? 1 : 0)
                };
                return [newConv, ...prevConvs];
            }
        });
    }, [user._id]);

    useEffect(() => {
        if (socket) {
            const handleIncomingMessage = (message) => {
                const messageSenderId = String(message.sender?._id || message.sender);
                const messageRecipientId = String(message.recipient?._id || message.recipient);
                const currentUserId = String(user._id);
                const activeSelectedId = selectedUserRef.current ? String(selectedUserRef.current._id) : null;

                const isForCurrentChat =
                    (messageSenderId === activeSelectedId && messageRecipientId === currentUserId) ||
                    (messageSenderId === currentUserId && messageRecipientId === activeSelectedId);

                if (isForCurrentChat) {
                    setMessages((prev) => {
                        const messageIdStr = String(message._id);
                        if (prev.some((m) => String(m._id) === messageIdStr)) return prev;
                        const filtered = prev.filter((m) => !m.isOptimistic || (m.content !== message.content && m.media !== message.media));
                        return [...filtered, message];
                    });

                    // If message is from the other person in the active conversation, mark as read immediately!
                    if (messageSenderId !== currentUserId) {
                        markConversationAsRead(messageSenderId);
                        dismissDeliveredMessageNotifications(messageSenderId);
                    }
                }

                const isUnread = messageSenderId !== currentUserId && (!activeSelectedId || activeSelectedId !== messageSenderId);
                updateConversationInstant(message, isUnread);
                fetchConversations();
            };

            const handleMessagesRead = ({ readerId, readAt }) => {
                const activeSelectedId = selectedUserRef.current ? String(selectedUserRef.current._id) : null;
                if (activeSelectedId && activeSelectedId === String(readerId)) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            String(msg.sender?._id || msg.sender) === String(user._id)
                                ? { ...msg, read: true, readAt: msg.readAt || readAt || new Date().toISOString() }
                                : msg
                        )
                    );
                }
            };

            const handleMessageDeleted = (id) => {
                setMessages((prev) => prev.filter((msg) => String(msg._id) !== String(id)));
                fetchConversations();
            };

            const handleMessageReaction = ({ messageId, reactions }) => {
                setMessages((prev) =>
                    prev.map((msg) => (String(msg._id) === String(messageId) ? { ...msg, reactions } : msg))
                );
            };

            const handleMessagePinned = ({ messageId, pinned, pinnedBy, pinnedAt }) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        String(msg._id) === String(messageId)
                            ? { ...msg, pinned, pinnedBy, pinnedAt }
                            : msg
                    )
                );
            };

            const handleChatSettingsUpdated = ({ partnerId, disappearingSeconds, blockedByPartner }) => {
                if (!partnerId) return;
                const pid = String(partnerId);
                setChatPreferences((prev) => {
                    const existing = prev[pid] || {};
                    return {
                        ...prev,
                        [pid]: {
                            ...existing,
                            ...(disappearingSeconds !== undefined ? { disappearingSeconds } : {}),
                            ...(blockedByPartner !== undefined ? { blockedByPartner } : {}),
                        },
                    };
                });
            };

            const handleDmTypingUpdate = ({ senderId, isTyping }) => {
                setTypingUsers((prev) => ({
                    ...prev,
                    [senderId]: isTyping
                }));
            };

            socket.on('message', handleIncomingMessage);
            socket.on('newMessage', handleIncomingMessage);
            socket.on('messageSent', handleIncomingMessage);
            socket.on('messagesRead', handleMessagesRead);
            socket.on('messageDeleted', handleMessageDeleted);
            socket.on('messageReaction', handleMessageReaction);
            socket.on('messagePinned', handleMessagePinned);
            socket.on('chatSettingsUpdated', handleChatSettingsUpdated);
            socket.on('dm_typing_update', handleDmTypingUpdate);

            return () => {
                socket.off('message', handleIncomingMessage);
                socket.off('newMessage', handleIncomingMessage);
                socket.off('messageSent', handleIncomingMessage);
                socket.off('messagesRead', handleMessagesRead);
                socket.off('messageDeleted', handleMessageDeleted);
                socket.off('messageReaction', handleMessageReaction);
                socket.off('messagePinned', handleMessagePinned);
                socket.off('chatSettingsUpdated', handleChatSettingsUpdated);
                socket.off('dm_typing_update', handleDmTypingUpdate);
            };
        }
    }, [socket, selectedUser, user._id, updateConversationInstant, markConversationAsRead]);

    // Track scroll position & show/hide "Aşağı in" button (never triggers scroll on message mutations)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!selectedUser || !container) return undefined;

        const handleScroll = () => {
            const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
            isNearBottomRef.current = distanceFromBottom <= 120;
            setShowScrollToBottom(distanceFromBottom > 180);
            if (distanceFromBottom > 120) {
                initialPinUntilRef.current = 0;
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [selectedUser?._id]);

    // Synchronous pre-paint jump to bottom when a conversation finishes loading (first visible frame is ALWAYS at the bottom)
    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (!selectedUser || messagesLoading || !container) return undefined;

        container.scrollTop = container.scrollHeight;
        isNearBottomRef.current = true;
        setShowScrollToBottom(false);
        lastMessageIdRef.current = messages.length > 0 ? String(messages[messages.length - 1]._id) : null;
        initialPinUntilRef.current = Date.now() + 700;
        setChatScrollReady(true);

        // Keep pinned to bottom briefly if images/media finish sizing right after initial open
        const handleMediaResize = () => {
            if (Date.now() <= initialPinUntilRef.current && isNearBottomRef.current && messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        };

        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(handleMediaResize);
            resizeObserver.observe(container);
        }
        container.addEventListener('load', handleMediaResize, true);
        const rafId = requestAnimationFrame(handleMediaResize);

        return () => {
            cancelAnimationFrame(rafId);
            container.removeEventListener('load', handleMediaResize, true);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [selectedUser?._id, messagesLoading]);

    // Auto-scroll ONLY when a brand-new message is appended (never on emoji reactions, pin, star, read receipts, or edits)
    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (!selectedUser || messagesLoading || !container || messages.length === 0) return;

        const latestMsg = messages[messages.length - 1];
        const latestId = latestMsg?._id ? String(latestMsg._id) : null;
        if (!latestId || latestId === lastMessageIdRef.current) {
            return;
        }

        const prevLastId = lastMessageIdRef.current;
        lastMessageIdRef.current = latestId;

        const senderId = String(latestMsg.sender?._id || latestMsg.sender || '');
        const isMyNewMessage = senderId && String(user?._id || '') === senderId;

        if (!prevLastId || isMyNewMessage || isNearBottomRef.current) {
            container.scrollTop = container.scrollHeight;
            isNearBottomRef.current = true;
            setShowScrollToBottom(false);
        }
    }, [messages, selectedUser?._id, messagesLoading, user?._id]);

    // Smart Floating Sticky Date Header: hidden whenever ANY inline date divider is visible on screen
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || messages.length === 0) {
            setActiveFloatingDate('');
            return undefined;
        }

        let rafId = null;
        let throttleTimer = null;

        const updateFloatingDate = () => {
            const dividers = container.querySelectorAll('.chat-date-divider');
            if (dividers.length === 0) {
                setActiveFloatingDate((prev) => (prev === '' ? prev : ''));
                return;
            }

            const containerRect = container.getBoundingClientRect();
            let anyDividerVisible = false;
            let lastAboveHeader = '';

            dividers.forEach((divider) => {
                const rect = divider.getBoundingClientRect();
                const isVisible =
                    rect.bottom > containerRect.top + 6 &&
                    rect.top < containerRect.bottom - 6;
                if (isVisible) {
                    anyDividerVisible = true;
                } else if (rect.bottom <= containerRect.top + 6) {
                    lastAboveHeader = divider.getAttribute('data-date-str') || '';
                }
            });

            const nextDate = anyDividerVisible ? '' : lastAboveHeader;
            setActiveFloatingDate((prev) => (prev === nextDate ? prev : nextDate));
        };

        const handleDateScroll = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                throttleTimer = null;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(updateFloatingDate);
            }, 120);
        };

        container.addEventListener('scroll', handleDateScroll, { passive: true });
        rafId = requestAnimationFrame(updateFloatingDate);

        return () => {
            if (throttleTimer) clearTimeout(throttleTimer);
            if (rafId) cancelAnimationFrame(rafId);
            container.removeEventListener('scroll', handleDateScroll);
        };
    }, [messages, selectedUser?._id, chatScrollReady]);

    // Direct Message Typing Indicator Persistence
    useEffect(() => {
        if (isGhost) return;
        if (!socket || !selectedUser) return;

        if (newMessage.trim().length > 0 || media.length > 0) {
            if (!isTypingSent) {
                setIsTypingSent(true);
                socket.emit('dm_typing', { recipientId: selectedUser._id, isTyping: true });
            }
        } else {
            if (isTypingSent) {
                socket.emit('dm_typing', { recipientId: selectedUser._id, isTyping: false });
                setIsTypingSent(false);
            }
        }
    }, [newMessage, media, selectedUser?._id, socket, isTypingSent]);

    useEffect(() => {
        return () => {
            if (socket && selectedUser && isTypingSent) {
                socket.emit('dm_typing', { recipientId: selectedUser._id, isTyping: false });
            }
        };
    }, [selectedUser?._id, socket, isTypingSent]);

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/messages/conversations');
            if (Array.isArray(response.data)) {
                const activeId = selectedUserRef.current?._id ? String(selectedUserRef.current._id) : null;
                const sanitized = response.data.map((conv) => {
                    if (activeId && String(conv.user?._id) === activeId) {
                        setSelectedUser((prev) =>
                            prev && String(prev._id) === activeId
                                ? {
                                      ...prev,
                                      canMessage: conv.user.canMessage,
                                      dmSettings: conv.user.dmSettings,
                                      dmBlockReason: conv.user.dmBlockReason,
                                      isSystemAccount: conv.user.isSystemAccount,
                                  }
                                : prev
                        );
                        return { ...conv, unreadCount: 0 };
                    }
                    return conv;
                });
                setConversations(sanitized);
                try {
                    localStorage.setItem('oxypace_cached_conversations', JSON.stringify(sanitized));
                } catch (_) {}
                preloadUsers(sanitized.map(c => c.user).filter(Boolean));
            } else {
                setConversations([]);
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            if (conversations.length === 0) setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserByUsername = async (username) => {
        try {
            const response = await axios.get(`/api/users/${username}`);
            setSelectedUser(response.data);
            setMessages([]);
            fetchMessages(response.data._id);
        } catch (err) {
            console.error('Failed to fetch user:', err);
        }
    };

    const fetchMessages = async (userId) => {
        setMessagesLoading(true);
        setChatScrollReady(false);
        lastMessageIdRef.current = null;
        isNearBottomRef.current = true;
        try {
            const response = await axios.get(`/api/messages/${userId}`);
            setMessages(response.data);
            // Refresh global unread count
            useGlobalStore.getState().fetchUnreadMessagesCount();
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setChatScrollReady(true);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleConversationClick = (conversation) => {
        setSelectedUser(conversation.user);
        // Clear unread count immediately in UI
        setConversations(prev => prev.map(c => 
            String(c.user?._id) === String(conversation.user._id)
                ? { ...c, unreadCount: 0 }
                : c
        ));
        setMessages([]);
        fetchMessages(conversation.user._id);
    };

    const handleBackToList = () => {
        setSelectedUser(null);
        useGlobalStore.getState().setActiveChatUserId(null);
        setMessages([]);
    };

    const handleStartNewConversation = (user) => {
        if (!user || user.canMessage === false || user.isSystemAccount) return;
        setSelectedUser(user);
        setMessages([]);
        fetchMessages(user._id);
        setShowNewMessageModal(false);
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        const input = document.querySelector('.message-input-wrapper input');
        if (input) input.focus();
    };

    const handleReact = async (messageId, emoji) => {
        if (isGhost) return; // Ghost observer cannot react
        try {
            await axios.post(`/api/messages/${messageId}/react`, { emoji });
        } catch (error) {
            console.error('Reaction failed:', error);
        }
    };

    const handleFileSelect = async (e) => {
        if (isGhost) return;
        if (e.target.files && e.target.files.length > 0) {
            const rawFiles = Array.from(e.target.files);
            e.target.value = '';
            for (const file of rawFiles) {
                if (file.size > 2 * 1024 * 1024 * 1024) {
                    showToast("Dosya boyutu 2 GB'dan büyük olamaz.");
                    return;
                }
            }
            try {
                const files = await normalizeImageFilesForBrowser(rawFiles);
                setMedia((prev) => [...prev, ...files]);
            } catch (err) {
                showToast(err?.message || 'HEIC görseli dönüştürülemedi.');
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (isGhost) {
            showToast('Hayalet Modu: Salt okunur izleme modundasınız. Mesaj gönderemezsiniz.');
            return;
        }
        if ((!newMessage.trim() && media.length === 0) || !selectedUser) return;
        if (selectedUser.canMessage === false || selectedUser.isSystemAccount) return;

        // Clear typing indicator instantly on send
        if (socket && selectedUser) {
            socket.emit('dm_typing', { recipientId: selectedUser._id, isTyping: false });
        }
        setIsTypingSent(false);

        if (!selectedUser._id) {
            showToast('Hata: Kullanıcı ID bulunamadı.');
            return;
        }

        const tempContent = newMessage;
        const tempMediaList = [...media];
        const tempReplyTo = replyingTo;

        setNewMessage('');
        setMedia([]);
        setReplyingTo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (docInputRef.current) docInputRef.current.value = '';

        const sendOneMessage = async (content, fileObj, replyTo) => {
            const optimisticId = Date.now().toString() + Math.random().toString();
            const optimisticMessage = {
                _id: optimisticId,
                sender: { _id: user._id, username: user.username, profile: user.profile },
                recipient: {
                    _id: selectedUser._id,
                    username: selectedUser.username,
                    profile: selectedUser.profile,
                },
                content: content,
                media: fileObj ? URL.createObjectURL(fileObj) : null,
                mediaName: fileObj?.name,
                mediaSize: fileObj?.size,
                mediaType: fileObj?.type,
                createdAt: new Date().toISOString(),
                isOptimistic: true,
                replyTo: replyTo,
            };

            setMessages((prev) => [...prev, optimisticMessage]);
            updateConversationInstant(optimisticMessage, false);

            try {
                let mediaKey = null;
                if (fileObj) {
                    mediaKey = await uploadFile(fileObj, 'message', selectedUser._id);
                }

                const messageData = {
                    recipientId: selectedUser._id,
                    content: content,
                    replyToId: replyTo ? replyTo._id : undefined,
                };

                if (mediaKey) {
                    messageData.mediaKey = mediaKey;
                    if (fileObj) {
                        messageData.mediaName = fileObj.name;
                        messageData.mediaSize = fileObj.size;
                        messageData.mediaType = fileObj.type;
                    }
                }

                const response = await axios.post('/api/messages', messageData);

                updateConversationInstant(response.data, false);

                setMessages((prev) => {
                    const responseId = String(response.data._id);
                    const alreadyExists = prev.some((m) => String(m._id) === responseId);
                    
                    if (alreadyExists) {
                        return prev.filter((msg) => String(msg._id) !== String(optimisticId));
                    } else {
                        return prev.map((msg) => (String(msg._id) === String(optimisticId) ? response.data : msg));
                    }
                });
            } catch (err) {
                console.error('Failed to send message:', err);
                setMessages((prev) => prev.filter((msg) => msg._id !== optimisticId));
                if (err?.response?.status === 403) {
                    const reason =
                        err.response?.data?.message ||
                        'Bu kullanıcıya mesaj gönderilemiyor.';
                    setSelectedUser((prev) =>
                        prev ? { ...prev, canMessage: false, dmBlockReason: reason } : prev
                    );
                    showToast(reason);
                } else {
                    showToast(err?.response?.data?.message || 'Mesaj gönderilemedi.');
                }
            }
        };

        try {
            if (tempMediaList.length === 0) {
                await sendOneMessage(tempContent, null, tempReplyTo);
            } else {
                for (let i = 0; i < tempMediaList.length; i++) {
                    const file = tempMediaList[i];
                    const content = i === 0 ? tempContent : '';
                    await sendOneMessage(content, file, i === 0 ? tempReplyTo : null);
                }
            }
        } catch (error) {
            console.error('Error sending message sequence:', error);
        }
    };

    const updateChatPref = async (patch, successMsg) => {
        if (!selectedPartnerId || isGhost) return;
        const previous = chatPreferences[selectedPartnerId];
        setChatPreferences((prev) => ({
            ...prev,
            [selectedPartnerId]: { ...(prev[selectedPartnerId] || {}), ...patch },
        }));
        try {
            const res = await axios.put(`/api/messages/preferences/${selectedPartnerId}`, patch);
            setChatPreferences((prev) => ({
                ...prev,
                [selectedPartnerId]: res.data,
            }));
            if (successMsg) showToast(successMsg);
        } catch (err) {
            console.error('Update chat preference failed:', err);
            setChatPreferences((prev) => ({
                ...prev,
                [selectedPartnerId]: previous || {},
            }));
            showToast(err?.response?.data?.message || 'Ayar güncellenemedi.');
        }
    };

    const handleDeleteMessage = async (messageIds, scope = 'everyone') => {
        const ids = Array.isArray(messageIds) ? messageIds.map(String) : [String(messageIds)];
        if (ids.length === 0) return;
        const previousMessages = [...messages];
        setMessages((prev) => prev.filter((msg) => !ids.includes(String(msg._id))));
        setDeleteTarget(null);
        if (selectMode) {
            setSelectMode(false);
            setSelectedMessageIds([]);
        }

        try {
            if (ids.length === 1) {
                await axios.delete(`/api/messages/${ids[0]}?scope=${scope}`);
            } else {
                await axios.post('/api/messages/bulk-delete', { messageIds: ids, scope });
            }
            fetchConversations();
            showToast(ids.length > 1 ? `${ids.length} mesaj silindi.` : 'Mesaj silindi.');
        } catch (err) {
            console.error('Failed to delete message:', err);
            setMessages(previousMessages);
            showToast(err?.response?.data?.message || 'Mesaj silinemedi.');
        }
    };

    const handleCopyMessage = async (msg) => {
        if (!msg?.content) return;
        await copyTextSafely(msg.content);
        showToast('Mesaj kopyalandı.');
    };

    const handlePinMessage = async (messageId) => {
        if (isGhost) return;
        try {
            const res = await axios.post(`/api/messages/${messageId}/pin`);
            setMessages((prev) =>
                prev.map((m) =>
                    String(m._id) === String(messageId)
                        ? { ...m, pinned: res.data.pinned, pinnedBy: res.data.pinnedBy, pinnedAt: res.data.pinnedAt }
                        : m
                )
            );
            showToast(res.data.pinned ? 'Mesaj sabitlendi.' : 'Sabitleme kaldırıldı.');
        } catch (err) {
            console.error('Pin failed:', err);
            showToast('İşlem yapılamadı.');
        }
    };

    const handleStarMessage = async (messageId) => {
        try {
            const res = await axios.post(`/api/messages/${messageId}/star`);
            setMessages((prev) =>
                prev.map((m) =>
                    String(m._id) === String(messageId) ? { ...m, starredBy: res.data.starredBy } : m
                )
            );
            showToast(res.data.starred ? 'Yıldız eklendi.' : 'Yıldız kaldırıldı.');
        } catch (err) {
            console.error('Star failed:', err);
            showToast('İşlem yapılamadı.');
        }
    };

    const handleEnterSelectMode = (initialId) => {
        setSelectMode(true);
        setSelectedMessageIds(initialId ? [String(initialId)] : []);
    };

    const handleToggleSelectMessage = (messageId) => {
        const idStr = String(messageId);
        setSelectedMessageIds((prev) =>
            prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
        );
    };

    const handleBulkCopy = async () => {
        const selectedMsgs = messages.filter((m) => selectedMessageIds.includes(String(m._id)));
        const text = selectedMsgs
            .map((m) => m.content)
            .filter(Boolean)
            .join('\n');
        if (!text) {
            showToast('Seçili mesajlarda kopyalanacak metin yok.');
            return;
        }
        await copyTextSafely(text);
        showToast(`${selectedMsgs.length} mesaj kopyalandı.`);
        setSelectMode(false);
        setSelectedMessageIds([]);
    };

    const handleBulkStar = async () => {
        const ids = [...selectedMessageIds];
        for (const id of ids) {
            try {
                const res = await axios.post(`/api/messages/${id}/star`);
                setMessages((prev) =>
                    prev.map((m) => (String(m._id) === id ? { ...m, starredBy: res.data.starredBy } : m))
                );
            } catch (_) {}
        }
        showToast(`${ids.length} mesaj için yıldız güncellendi.`);
        setSelectMode(false);
        setSelectedMessageIds([]);
    };

    const handleBulkForward = () => {
        const selectedMsgs = messages.filter((m) => selectedMessageIds.includes(String(m._id)));
        if (selectedMsgs.length === 0) return;
        setForwardMessages(selectedMsgs);
    };

    const handleBulkDeleteRequest = () => {
        const selectedMsgs = messages.filter((m) => selectedMessageIds.includes(String(m._id)));
        if (selectedMsgs.length === 0) return;
        const myId = String(user?._id || '');
        const allOwn = selectedMsgs.every((m) => String(m.sender?._id || m.sender) === myId);
        setDeleteTarget({
            ids: selectedMsgs.map((m) => String(m._id)),
            canDeleteForEveryone: allOwn,
        });
    };

    const handleExportChat = () => {
        if (!selectedUser) return;
        const lines = [
            `Oxypace Sohbet Dışa Aktarımı — ${selectedUser.profile?.displayName || selectedUser.username} (@${selectedUser.username})`,
            `Tarih: ${new Date().toLocaleString('tr-TR')}`,
            '--------------------------------------------------',
            '',
        ];
        messages.forEach((m) => {
            const dt = new Date(m.createdAt).toLocaleString('tr-TR');
            const senderName = m.sender?.profile?.displayName || m.sender?.username || 'Kullanıcı';
            const body = [m.content, m.media ? `[Medya: ${m.mediaName || 'ek'}]` : ''].filter(Boolean).join(' ');
            lines.push(`[${dt}] ${senderName}: ${body || '[Mesaj]'}`);
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oxypace-sohbet-${selectedUser.username || 'export'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Sohbet .txt olarak indirildi.');
    };

    const handleClearConversation = async () => {
        if (!selectedPartnerId) return;
        try {
            await axios.post(`/api/messages/conversation/${selectedPartnerId}/clear`);
            setMessages([]);
            setConfirmAction(null);
            fetchConversations();
            showToast('Sohbet temizlendi.');
        } catch (err) {
            console.error('Clear conversation failed:', err);
            showToast('Sohbet temizlenemedi.');
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedPartnerId) return;
        try {
            await axios.delete(`/api/messages/conversation/${selectedPartnerId}`);
            setConfirmAction(null);
            setSelectedUser(null);
            setMessages([]);
            useGlobalStore.getState().setActiveChatUserId(null);
            fetchConversations();
            showToast('Sohbet silindi.');
        } catch (err) {
            console.error('Delete conversation failed:', err);
            showToast('Sohbet silinemedi.');
        }
    };

    const handleToggleChatMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowChatMenu((prev) => {
            if (!prev && chatMenuBtnRef.current) {
                const rect = chatMenuBtnRef.current.getBoundingClientRect();
                setChatMenuPos({
                    top: rect.bottom + 8,
                    right: Math.max(12, window.innerWidth - rect.right),
                });
            }
            return !prev;
        });
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return msgDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Dün';
        } else if (diffDays < 7) {
            return msgDate.toLocaleDateString('tr-TR', { weekday: 'short' });
        } else {
            return msgDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }
    };

    const formatJoinedDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `Katıldı ${date.getFullYear()}`;
    };

    const filteredConversations = Array.isArray(conversations)
        ? conversations.filter((conv) => {
              const name = conv.user?.profile?.displayName || conv.user?.username || '';
              if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
              const pid = String(conv.user?._id || '');
              const pref = chatPreferences[pid] || conv.preferences || {};
              if (activeFilter === 'unread') return (conv.unreadCount || 0) > 0;
              if (activeFilter === 'favorites') return Boolean(pref.isFavorite);
              return true;
          })
        : [];

    return (
        <div className="app-wrapper inbox-wrapper">
            <Navbar />
            <main className="app-content">
                <div className={`inbox-container ${selectedUser ? 'chat-active' : ''}`}>
                    {/* Left Side: Conversations */}
                    <div className="conversations-view">
                        <div className="inbox-header">
                            <div className="title-with-back">
                                <button 
                                    className="mobile-back-btn-inline" 
                                    onClick={() => {
                                        if (user?.joinedPortals && user.joinedPortals.length > 0) {
                                            const firstPortalId = user.joinedPortals[0]._id || user.joinedPortals[0];
                                            navigate(`/portal/${firstPortalId}`);
                                        } else {
                                            navigate('/');
                                        }
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        width="24"
                                        height="24"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <h1>Mesajlar</h1>
                            </div>
                            <button
                                className="compose-btn"
                                onClick={() => setShowNewMessageModal(true)}
                                title="Yeni Mesaj"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="search-container">
                            <div className="oxypace-search-input-wrapper">
                                <svg
                                    className="oxypace-search-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="text"
                                    className="oxypace-search-input"
                                    placeholder="Mesajlarda ara"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="inbox-filter-pills">
                                <button
                                    type="button"
                                    className={`inbox-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('all')}
                                >
                                    Tümü
                                </button>
                                <button
                                    type="button"
                                    className={`inbox-filter-pill ${activeFilter === 'unread' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('unread')}
                                >
                                    Okunmamış
                                </button>
                                <button
                                    type="button"
                                    className={`inbox-filter-pill ${activeFilter === 'favorites' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('favorites')}
                                >
                                    Favoriler
                                </button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="spinner-container">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="empty-inbox">
                                <p>Henüz mesajın yok.</p>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowNewMessageModal(true)}
                                    style={{ marginTop: '10px' }}
                                >
                                    Mesaj Başlat
                                </button>
                            </div>
                        ) : (
                            <div className="conversations-list">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.user._id}
                                        className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''} ${selectedUser?._id === conv.user._id ? 'active' : ''}`}
                                        onClick={() => handleConversationClick(conv)}
                                    >
                                        <div className="conv-avatar-wrapper">
                                            <UserAvatar
                                                src={conv.user.profile?.lowResAvatar || conv.user.profile?.avatar}
                                                alt={conv.user.username}
                                                size={52}
                                                className="conv-avatar"
                                                isDeleted={conv.user.isDeleted}
                                            />
                                        </div>
                                        <div className="conv-content">
                                            <div className="conv-header">
                                                <div className="conv-user-info">
                                                    <span className="conv-name">
                                                        {conv.user.profile?.displayName ||
                                                            conv.user.username}
                                                    </span>
                                                    <UserBadges user={conv.user} size={16} />
                                                </div>
                                                <span className="conv-time">
                                                    {(() => {
                                                        const pid = String(conv.user?._id || '');
                                                        const pref = chatPreferences[pid] || conv.preferences || {};
                                                        const muted = Boolean(pref.mutedUntil && new Date(pref.mutedUntil) > new Date());
                                                        return (
                                                            <span className="conv-meta-icons">
                                                                {pref.isFavorite && <Heart size={11} fill="currentColor" className="conv-fav-icon" />}
                                                                {muted && <BellOff size={11} className="conv-muted-icon" />}
                                                                {formatTime(conv.lastMessage.createdAt)}
                                                            </span>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                            <p className="conv-preview" style={{ color: typingUsers[conv.user._id] ? 'var(--text-primary)' : 'inherit', fontWeight: typingUsers[conv.user._id] ? '600' : 'normal' }}>
                                                {typingUsers[conv.user._id] ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span className="sidebar-typing-dots">
                                                            <span className="dot"></span>
                                                            <span className="dot"></span>
                                                            <span className="dot"></span>
                                                        </span>
                                                        Yazıyor...
                                                    </span>
                                                ) : (
                                                    <>
                                                        {conv.user._id === conv.lastMessage.sender._id
                                                            ? ''
                                                            : 'Sen: '}
                                                        {conv.lastMessage.content ||
                                                            (conv.lastMessage.media
                                                                ? '📷 Fotoğraf'
                                                                : 'Mesaj')}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <UserBar />
                    </div>

                    {/* Right Side: Chat */}
                    {selectedUser ? (
                        <div className="chat-view" data-chat-theme={currentPrefs.theme || 'default'}>
                            <div className="chat-header">
                                <button className="back-btn" onClick={handleBackToList}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        width="24"
                                        height="24"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <div
                                    className="chat-header-content"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setShowContactInfo(true)}
                                    title="Kişi bilgisi"
                                >
                                    <UserAvatar
                                        src={selectedUser.profile?.lowResAvatar || selectedUser.profile?.avatar}
                                        alt={selectedUser.username}
                                        size={38}
                                        className="chat-header-avatar"
                                        isDeleted={selectedUser.isDeleted}
                                    />
                                    <div className="chat-header-details">
                                        <span className="chat-header-name">
                                            {selectedUser.profile?.displayName || selectedUser.username}
                                            <UserBadges user={selectedUser} size={18} />
                                        </span>
                                        {selectedUser.username && (
                                            <span className="chat-header-joined">
                                                @{selectedUser.username}
                                                {isCurrentChatMuted && (
                                                    <span className="chat-header-pill" title="Bildirimler sessiz">
                                                        <BellOff size={11} />
                                                    </span>
                                                )}
                                                {currentPrefs.disappearingSeconds > 0 && (
                                                    <span className="chat-header-pill" title="Süreli mesajlar açık">
                                                        <Timer size={11} />
                                                        {formatDisappearingLabel(currentPrefs.disappearingSeconds)}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="chat-header-actions">
                                    <button
                                        type="button"
                                        className={`chat-header-icon-btn ${showChatSearch ? 'active' : ''}`}
                                        onClick={() => {
                                            setShowChatSearch((prev) => {
                                                if (prev) {
                                                    setChatSearchQuery('');
                                                    setChatSearchIdx(0);
                                                }
                                                return !prev;
                                            });
                                        }}
                                        title="Sohbette ara"
                                        aria-label="Sohbette ara"
                                    >
                                        <Search size={18} strokeWidth={2} />
                                    </button>
                                    <button
                                        ref={chatMenuBtnRef}
                                        type="button"
                                        className={`chat-header-icon-btn ${showChatMenu ? 'active' : ''}`}
                                        onClick={handleToggleChatMenu}
                                        title="Sohbet seçenekleri"
                                        aria-label="Sohbet seçenekleri"
                                    >
                                        <MoreVertical size={18} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>

                            {/* In-Chat Search Bar */}
                            {showChatSearch && (
                                <div className="chat-search-bar">
                                    <Search size={15} className="chat-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Bu sohbette mesaj ara..."
                                        value={chatSearchQuery}
                                        onChange={(e) => {
                                            setChatSearchQuery(e.target.value);
                                            setChatSearchIdx(0);
                                        }}
                                        autoFocus
                                    />
                                    {chatSearchQuery.trim() && (
                                        <span className="chat-search-count">
                                            {searchMatchedIds.length > 0
                                                ? `${chatSearchIdx + 1} / ${searchMatchedIds.length}`
                                                : '0 / 0'}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        className="chat-search-nav-btn"
                                        disabled={searchMatchedIds.length === 0}
                                        onClick={() =>
                                            setChatSearchIdx((prev) =>
                                                prev <= 0 ? searchMatchedIds.length - 1 : prev - 1
                                            )
                                        }
                                        title="Önceki sonuç"
                                    >
                                        <ChevronUp size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        className="chat-search-nav-btn"
                                        disabled={searchMatchedIds.length === 0}
                                        onClick={() =>
                                            setChatSearchIdx((prev) =>
                                                prev >= searchMatchedIds.length - 1 ? 0 : prev + 1
                                            )
                                        }
                                        title="Sonraki sonuç"
                                    >
                                        <ChevronDown size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        className="chat-search-nav-btn"
                                        onClick={() => {
                                            setShowChatSearch(false);
                                            setChatSearchQuery('');
                                            setChatSearchIdx(0);
                                        }}
                                        title="Aramayı kapat"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            )}

                            {/* Pinned Message Banner */}
                            {pinnedMessages.length > 0 && (() => {
                                const safePinIdx = activePinnedIdx % pinnedMessages.length;
                                const activePin = pinnedMessages[pinnedMessages.length - 1 - safePinIdx];
                                return (
                                    <div
                                        className="chat-pinned-banner"
                                        onClick={() => {
                                            jumpToMessage(activePin._id);
                                            if (pinnedMessages.length > 1) {
                                                setActivePinnedIdx((prev) => (prev + 1) % pinnedMessages.length);
                                            }
                                        }}
                                    >
                                        <Pin size={14} className="chat-pinned-icon" />
                                        <div className="chat-pinned-text">
                                            <span className="chat-pinned-title">
                                                Sabitlenen mesaj{pinnedMessages.length > 1 ? ` (${safePinIdx + 1}/${pinnedMessages.length})` : ''}
                                            </span>
                                            <span className="chat-pinned-preview">
                                                {activePin.content || (activePin.media ? '📷 Medya' : 'Mesaj')}
                                            </span>
                                        </div>
                                        {!isGhost && (
                                            <button
                                                type="button"
                                                className="chat-pinned-close"
                                                title="Sabitlemeyi kaldır"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePinMessage(activePin._id);
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {activeFloatingDate && (
                                <div className="floating-date-sticky">
                                    <span>{activeFloatingDate}</span>
                                </div>
                            )}

                            <div
                                className="messages-container"
                                ref={messagesContainerRef}
                                style={{ visibility: !messagesLoading && !chatScrollReady ? 'hidden' : 'visible' }}
                            >
                                {messagesLoading ? (
                                    <div className="spinner-container" style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
                                        <div className="spinner"></div>
                                    </div>
                                ) : (() => {
                                    let lastDateStr = null;
                                    const getSenderId = (m) => {
                                        if (!m) return '';
                                        const s = m.sender;
                                        if (!s) return '';
                                        if (typeof s === 'object') return String(s._id || s.id || '');
                                        return String(s);
                                    };

                                    const partnerId = selectedUser ? String(selectedUser._id || selectedUser.id || '') : '';
                                    const myId = user ? String(user._id || user.id || '') : '';

                                    return messages.map((message, index) => {
                                        const formattedDate = formatDateDivider(message.createdAt);
                                        const showDateDivider = formattedDate && formattedDate !== lastDateStr;
                                        if (showDateDivider) {
                                            lastDateStr = formattedDate;
                                        }

                                        const currentSenderId = getSenderId(message);
                                        const prevMessage = index > 0 ? messages[index - 1] : null;
                                        const prevSenderId = getSenderId(prevMessage);

                                        let isOwn = false;
                                        if (partnerId && currentSenderId) {
                                            isOwn = currentSenderId !== partnerId;
                                        } else if (myId && currentSenderId) {
                                            isOwn = currentSenderId === myId;
                                        }

                                        let prevIsOwn = false;
                                        if (partnerId && prevSenderId) {
                                            prevIsOwn = prevSenderId !== partnerId;
                                        } else if (myId && prevSenderId) {
                                            prevIsOwn = prevSenderId === myId;
                                        }

                                        const isSameSenderAsPrev = Boolean(
                                            prevMessage && (
                                                (currentSenderId && prevSenderId && currentSenderId === prevSenderId) ||
                                                (isOwn === prevIsOwn)
                                            )
                                        );
                                        const isConsecutive = !showDateDivider && isSameSenderAsPrev;

                                        return (
                                            <React.Fragment key={message._id}>
                                                {showDateDivider && (
                                                    <div className="chat-date-divider" data-date-str={formattedDate}>
                                                        <span>{formattedDate}</span>
                                                    </div>
                                                )}
                                                <MessageBubble
                                                    message={message}
                                                    isOwn={isOwn}
                                                    isConsecutive={isConsecutive}
                                                    currentUserId={myId}
                                                    isGhost={isGhost}
                                                    selectMode={selectMode}
                                                    isSelected={selectedMessageIds.includes(String(message._id))}
                                                    isHighlighted={highlightedMessageId === String(message._id)}
                                                    isSearchMatch={searchMatchedIds.includes(String(message._id))}
                                                    onToggleSelect={handleToggleSelectMessage}
                                                    onEnterSelect={handleEnterSelectMode}
                                                    onRequestDelete={(msg, ownFlag) =>
                                                        setDeleteTarget({
                                                            ids: [String(msg._id)],
                                                            canDeleteForEveryone: ownFlag,
                                                        })
                                                    }
                                                    onReply={handleReply}
                                                    onReact={handleReact}
                                                    onCopy={handleCopyMessage}
                                                    onForward={(msg) => setForwardMessages([msg])}
                                                    onPin={handlePinMessage}
                                                    onStar={handleStarMessage}
                                                    onShowInfo={(msg, ownFlag) => setInfoModalData({ message: msg, isOwn: ownFlag })}
                                                    onJumpToMessage={jumpToMessage}
                                                />
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                                {/* DM Typing Indicator inside scroll container */}
                                {selectedUser && typingUsers[selectedUser._id] && (
                                    <div className="dm-typing-indicator" style={{ margin: '10px 0 20px 0' }}>
                                        <div className="typing-bubble">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </div>
                                        <span className="typing-text">{selectedUser.profile?.displayName || selectedUser.username} yazıyor...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {showScrollToBottom && (
                                <button
                                    type="button"
                                    className="chat-scroll-bottom-btn"
                                    onClick={() => scrollToBottom(false)}
                                    title="En aşağı in"
                                    aria-label="En aşağı in"
                                >
                                    <ChevronDown size={18} strokeWidth={2.2} />
                                </button>
                            )}

                            {replyingTo && (
                                <div className="reply-preview-bar">
                                    <div className="reply-info">
                                        <span className="reply-to-label">
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="14"
                                                height="14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <polyline points="9 10 4 15 9 20" />
                                                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                            </svg>
                                            {replyingTo.sender.profile?.displayName ||
                                                replyingTo.sender.username}
                                        </span>
                                        <p className="reply-text">
                                            {replyingTo.content || '📷 Medya'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="close-reply-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {selectMode ? (
                                <div className="chat-multiselect-bar">
                                    <button
                                        type="button"
                                        className="chat-ms-close"
                                        onClick={() => {
                                            setSelectMode(false);
                                            setSelectedMessageIds([]);
                                        }}
                                        title="Seçimi kapat"
                                    >
                                        <X size={18} />
                                    </button>
                                    <span className="chat-ms-count">{selectedMessageIds.length} seçildi</span>
                                    <div className="chat-ms-actions">
                                        <button
                                            type="button"
                                            className="chat-ms-btn"
                                            disabled={selectedMessageIds.length === 0}
                                            onClick={handleBulkCopy}
                                            title="Kopyala"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="chat-ms-btn"
                                            disabled={selectedMessageIds.length === 0}
                                            onClick={handleBulkStar}
                                            title="Yıldızla"
                                        >
                                            <Star size={16} />
                                        </button>
                                        {!isGhost && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="chat-ms-btn"
                                                    disabled={selectedMessageIds.length === 0}
                                                    onClick={handleBulkForward}
                                                    title="İlet"
                                                >
                                                    <Forward size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="chat-ms-btn danger"
                                                    disabled={selectedMessageIds.length === 0}
                                                    onClick={handleBulkDeleteRequest}
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : isGhost ? (
                                <div className="system-no-reply-notice" style={{ backgroundColor: '#0c0c0c', borderTop: '1px solid #222', color: '#888', padding: '14px 20px' }}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}>
                                        <path d="M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z" />
                                        <circle cx="10" cy="8" r="1" fill="currentColor" />
                                        <circle cx="14" cy="8" r="1" fill="currentColor" />
                                    </svg>
                                    <span>Hayalet Modu: Salt okunur izleme modundasınız. Mesaj veya medya gönderilemez.</span>
                                </div>
                            ) : selectedUser.isSystemAccount ? (
                                <div className="system-no-reply-notice">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <span>Bu hesap doğrudan mesaj kabul etmemektedir.</span>
                                </div>
                            ) : currentPrefs.isBlocked ? (
                                <div className="system-no-reply-notice chat-blocked-bar">
                                    <Ban size={16} />
                                    <span>Bu kullanıcıyı engellediniz.</span>
                                    <button
                                        type="button"
                                        className="chat-unblock-inline-btn"
                                        onClick={() => updateChatPref({ isBlocked: false }, 'Kullanıcının engeli kaldırıldı.')}
                                    >
                                        Engeli kaldır
                                    </button>
                                </div>
                            ) : currentPrefs.blockedByPartner ? (
                                <div className="system-no-reply-notice">
                                    <Ban size={16} />
                                    <span>Bu kullanıcıya şu anda mesaj gönderilemiyor.</span>
                                </div>
                            ) : selectedUser.canMessage === false ? (
                                <div className="system-no-reply-notice">
                                    <Lock size={16} />
                                    <span>{selectedUser.dmBlockReason || 'Bu kullanıcıya yalnızca arkadaşları doğrudan mesaj gönderebilir.'}</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="message-form">
                                    {media && media.length > 0 && (
                                        <div className="media-preview-container-above">
                                            {media.map((file, idx) => (
                                                <div key={idx} className="selected-media-pill-minimal">
                                                    <span className="media-pill-icon">
                                                        {file.type.startsWith('image') ? '🖼️' : file.type.startsWith('video') ? '🎥' : '📄'}
                                                    </span>
                                                    <span className="media-pill-name">{file.name}</span>
                                                    <button 
                                                        type="button" 
                                                        className="remove-media-btn-minimal"
                                                        onClick={() => {
                                                            setMedia((prev) => prev.filter((_, i) => i !== idx));
                                                        }}
                                                        title="Kaldır"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="message-input-wrapper">
                                        {/* Plus / Upload Button */}
                                        <button
                                            ref={plusButtonRef}
                                            type="button"
                                            className={`upload-btn ${showPlusMenu ? 'active' : ''}`}
                                            onClick={handlePlusToggle}
                                            title="Yükle"
                                        >
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" style={{ pointerEvents: 'none' }} />
                                            </svg>
                                        </button>

                                        {/* Plus Menu Popover — rendered via Portal to escape overflow:hidden ancestors */}
                                        {showPlusMenu && createPortal(
                                            <div
                                                ref={plusMenuRef}
                                                className="inbox-plus-menu-portal"
                                                style={{
                                                    position: 'fixed',
                                                    top: menuPosition.top,
                                                    left: menuPosition.left,
                                                    transform: 'translateY(-100%)',
                                                    zIndex: 99999,
                                                }}
                                            >
                                                    <div
                                                        className="plus-menu-item"
                                                        onClick={() => {
                                                            fileInputRef.current.click();
                                                            setShowPlusMenu(false);
                                                        }}
                                                    >
                                                        <div className="plus-menu-icon">
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <rect
                                                                    x="3"
                                                                    y="3"
                                                                    width="18"
                                                                    height="18"
                                                                    rx="2"
                                                                    ry="2"
                                                                ></rect>
                                                                <circle
                                                                    cx="8.5"
                                                                    cy="8.5"
                                                                    r="1.5"
                                                                ></circle>
                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                            </svg>
                                                        </div>
                                                        Görsel
                                                    </div>
                                                    <div
                                                        className="plus-menu-item"
                                                        onClick={() => {
                                                            videoInputRef.current.click();
                                                            setShowPlusMenu(false);
                                                        }}
                                                    >
                                                        <div className="plus-menu-icon">
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                                <rect
                                                                    x="1"
                                                                    y="5"
                                                                    width="15"
                                                                    height="14"
                                                                    rx="2"
                                                                    ry="2"
                                                                ></rect>
                                                            </svg>
                                                        </div>
                                                        Video
                                                    </div>
                                                    <div
                                                        className="plus-menu-item"
                                                        onClick={() => {
                                                            docInputRef.current.click();
                                                            setShowPlusMenu(false);
                                                        }}
                                                    >
                                                        <div className="plus-menu-icon">
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                            </svg>
                                                        </div>
                                                        Dosya
                                                    </div>
                                            </div>,
                                            document.body
                                        )}
 
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept="image/*,.heic,.heif,image/heic,image/heif"
                                            multiple
                                            onChange={handleFileSelect}
                                        />
 
                                        <input
                                            type="file"
                                            ref={videoInputRef}
                                            style={{ display: 'none' }}
                                            accept="video/*"
                                            multiple
                                            onChange={handleFileSelect}
                                        />
 
                                        <input
                                            type="file"
                                            ref={docInputRef}
                                            style={{ display: 'none' }}
                                            accept="*/*"
                                            multiple
                                            onChange={handleFileSelect}
                                        />

                                        <input
                                            type="text"
                                            placeholder="Mesaj"
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />

                                        {/* Right Side Action - Send Button */}
                                        <div className="input-right-actions">
                                            <button
                                                type="submit"
                                                className="send-message-btn"
                                                title="Gönder"
                                                disabled={(!newMessage.trim() && media.length === 0)}
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div
                            className="chat-view"
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <h2>Mesaj seç</h2>
                                <p>Mevcut sohbetlerinden birini seç veya yeni bir mesaj başlat.</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => setShowNewMessageModal(true)}
                                    style={{
                                        marginTop: '20px',
                                        padding: '10px 24px',
                                        borderRadius: '24px',
                                    }}
                                >
                                    Yeni Mesaj
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Message Modal */}
                {showNewMessageModal && (
                    <NewMessageModal
                        currentUser={user}
                        onClose={() => setShowNewMessageModal(false)}
                        onSelectUser={handleStartNewConversation}
                    />
                )}

                {/* Chat Options Dropdown Menu (Top Right ⋮) */}
                {showChatMenu && selectedUser && createPortal(
                    <div
                        ref={chatMenuRef}
                        className="chat-options-dropdown"
                        style={{ top: chatMenuPos.top, right: chatMenuPos.right }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="chat-opt-item"
                            onClick={() => {
                                setShowChatMenu(false);
                                setShowContactInfo(true);
                            }}
                        >
                            <Info size={13} />
                            <span>Kişi bilgisi</span>
                        </button>
                        <button
                            type="button"
                            className="chat-opt-item"
                            onClick={() => {
                                setShowChatMenu(false);
                                setShowChatSearch(true);
                            }}
                        >
                            <Search size={13} />
                            <span>Ara</span>
                        </button>
                        <button
                            type="button"
                            className="chat-opt-item"
                            onClick={() => {
                                setShowChatMenu(false);
                                handleEnterSelectMode(null);
                            }}
                        >
                            <CheckSquare size={13} />
                            <span>Mesaj seç</span>
                        </button>
                        {!isGhost && (
                            <>
                                <button
                                    type="button"
                                    className="chat-opt-item"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        setShowMuteModal(true);
                                    }}
                                >
                                    {isCurrentChatMuted ? <Bell size={13} /> : <BellOff size={13} />}
                                    <span>{isCurrentChatMuted ? 'Bildirimlerin sesini aç' : 'Bildirimleri sessize al'}</span>
                                </button>
                                <button
                                    type="button"
                                    className="chat-opt-item"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        setShowDisappearingModal(true);
                                    }}
                                >
                                    <Timer size={13} />
                                    <span>Süreli mesajlar</span>
                                </button>
                                <button
                                    type="button"
                                    className="chat-opt-item"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        setShowThemeModal(true);
                                    }}
                                >
                                    <Palette size={13} />
                                    <span>Sohbet teması</span>
                                </button>
                                <button
                                    type="button"
                                    className="chat-opt-item"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        updateChatPref(
                                            { isFavorite: !currentPrefs.isFavorite },
                                            !currentPrefs.isFavorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.'
                                        );
                                    }}
                                >
                                    <Heart size={13} fill={currentPrefs.isFavorite ? 'currentColor' : 'none'} />
                                    <span>{currentPrefs.isFavorite ? 'Favorilerden çıkar' : "Favoriler'e ekle"}</span>
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            className="chat-opt-item"
                            onClick={() => {
                                setShowChatMenu(false);
                                handleExportChat();
                            }}
                        >
                            <Download size={13} />
                            <span>Sohbeti dışa aktar</span>
                        </button>
                        <button
                            type="button"
                            className="chat-opt-item"
                            onClick={() => {
                                setShowChatMenu(false);
                                handleBackToList();
                            }}
                        >
                            <XCircle size={13} />
                            <span>Sohbeti kapat</span>
                        </button>

                        {!isGhost && (
                            <>
                                <div className="chat-opt-divider" />
                                <button
                                    type="button"
                                    className="chat-opt-item"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        setShowReportModal(true);
                                    }}
                                >
                                    <Flag size={13} />
                                    <span>Şikayet et</span>
                                </button>
                                <button
                                    type="button"
                                    className="chat-opt-item danger"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        updateChatPref(
                                            { isBlocked: !currentPrefs.isBlocked },
                                            !currentPrefs.isBlocked ? 'Kullanıcı engellendi.' : 'Kullanıcının engeli kaldırıldı.'
                                        );
                                    }}
                                >
                                    <Ban size={13} />
                                    <span>{currentPrefs.isBlocked ? 'Engeli kaldır' : 'Engelle'}</span>
                                </button>
                                <button
                                    type="button"
                                    className="chat-opt-item danger"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        setConfirmAction('clear');
                                    }}
                                >
                                    <MinusCircle size={13} />
                                    <span>Sohbeti temizle</span>
                                </button>
                                <button
                                    type="button"
                                    className="chat-opt-item danger"
                                    onClick={() => {
                                        setShowChatMenu(false);
                                        setConfirmAction('deleteChat');
                                    }}
                                >
                                    <Trash2 size={13} />
                                    <span>Sohbeti sil</span>
                                </button>
                            </>
                        )}
                    </div>,
                    document.body
                )}

                {/* Contact Info Drawer */}
                {showContactInfo && selectedUser && (
                    <ContactInfoDrawer
                        partner={selectedUser}
                        messages={messages}
                        currentUserId={user?._id}
                        preferences={currentPrefs}
                        onClose={() => setShowContactInfo(false)}
                        onNavigateProfile={() => navigate(`/profile/${selectedUser.username}`)}
                        onOpenMute={() => {
                            setShowContactInfo(false);
                            setShowMuteModal(true);
                        }}
                        onToggleFavorite={() =>
                            updateChatPref(
                                { isFavorite: !currentPrefs.isFavorite },
                                !currentPrefs.isFavorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.'
                            )
                        }
                        onOpenDisappearing={() => {
                            setShowContactInfo(false);
                            setShowDisappearingModal(true);
                        }}
                        onOpenTheme={() => {
                            setShowContactInfo(false);
                            setShowThemeModal(true);
                        }}
                        onExportChat={handleExportChat}
                        onOpenReport={() => {
                            setShowContactInfo(false);
                            setShowReportModal(true);
                        }}
                        onToggleBlock={() =>
                            updateChatPref(
                                { isBlocked: !currentPrefs.isBlocked },
                                !currentPrefs.isBlocked ? 'Kullanıcı engellendi.' : 'Kullanıcının engeli kaldırıldı.'
                            )
                        }
                        onJumpToMessage={jumpToMessage}
                    />
                )}

                {/* Message Info Modal */}
                {infoModalData && (
                    <MessageInfoModal
                        message={infoModalData.message}
                        isOwn={infoModalData.isOwn}
                        currentUserId={user?._id}
                        onClose={() => setInfoModalData(null)}
                    />
                )}

                {/* Forward Message Modal */}
                {forwardMessages && (
                    <ForwardMessageModal
                        messagesToForward={forwardMessages}
                        conversations={conversations}
                        currentUserId={user?._id}
                        onClose={() => setForwardMessages(null)}
                        onForwarded={(recipientCount, msgCount) => {
                            fetchConversations();
                            setSelectMode(false);
                            setSelectedMessageIds([]);
                            showToast(`${msgCount} mesaj ${recipientCount} kişiye iletildi.`);
                        }}
                    />
                )}

                {/* Chat Theme Modal */}
                {showThemeModal && (
                    <ChatThemeModal
                        currentTheme={currentPrefs.theme}
                        onSelect={(themeId) => {
                            updateChatPref({ theme: themeId }, 'Sohbet teması güncellendi.');
                            setShowThemeModal(false);
                        }}
                        onClose={() => setShowThemeModal(false)}
                    />
                )}

                {/* Disappearing Messages Modal */}
                {showDisappearingModal && (
                    <DisappearingMessagesModal
                        currentSeconds={currentPrefs.disappearingSeconds}
                        onSelect={(seconds) => {
                            updateChatPref(
                                { disappearingSeconds: seconds },
                                seconds > 0
                                    ? `Süreli mesajlar açıldı (${formatDisappearingLabel(seconds)}).`
                                    : 'Süreli mesajlar kapatıldı.'
                            );
                            setShowDisappearingModal(false);
                        }}
                        onClose={() => setShowDisappearingModal(false)}
                    />
                )}

                {/* Mute Notifications Modal */}
                {showMuteModal && (
                    <MuteChatModal
                        mutedUntil={currentPrefs.mutedUntil}
                        onSelect={(until) => {
                            updateChatPref(
                                { mutedUntil: until },
                                until ? 'Sohbet bildirimleri sessize alındı.' : 'Sohbet bildirimlerinin sesi açıldı.'
                            );
                            setShowMuteModal(false);
                        }}
                        onClose={() => setShowMuteModal(false)}
                    />
                )}

                {/* Delete Message Modal */}
                {deleteTarget && (
                    <DeleteMessageModal
                        count={deleteTarget.ids.length}
                        canDeleteForEveryone={deleteTarget.canDeleteForEveryone}
                        onDeleteForMe={() => handleDeleteMessage(deleteTarget.ids, 'me')}
                        onDeleteForEveryone={() => handleDeleteMessage(deleteTarget.ids, 'everyone')}
                        onClose={() => setDeleteTarget(null)}
                    />
                )}

                {/* Clear / Delete Conversation Confirm Modal */}
                {confirmAction && selectedUser && (
                    <ConfirmChatActionModal
                        title={confirmAction === 'clear' ? 'Sohbeti temizle?' : 'Sohbeti sil?'}
                        description={
                            confirmAction === 'clear'
                                ? 'Bu sohbetteki tüm mesajlar yalnızca sizin görünümünüzden temizlenecektir.'
                                : 'Bu sohbet ve içindeki mesajlar yalnızca sizin gelen kutunuzdan kaldırılacaktır.'
                        }
                        confirmLabel={confirmAction === 'clear' ? 'Temizle' : 'Sohbeti sil'}
                        onConfirm={confirmAction === 'clear' ? handleClearConversation : handleDeleteConversation}
                        onClose={() => setConfirmAction(null)}
                    />
                )}

                {/* Report User Modal */}
                {showReportModal && selectedUser && (
                    <ReportModal
                        targetType="user"
                        targetId={selectedUser._id}
                        targetName={selectedUser.profile?.displayName || selectedUser.username}
                        onClose={() => setShowReportModal(false)}
                    />
                )}

                {/* Subtle Toast Feedback */}
                {inboxToast && createPortal(
                    <div className="inbox-action-toast">{inboxToast}</div>,
                    document.body
                )}
            </main>
        </div>
    );
};

export default Inbox;

