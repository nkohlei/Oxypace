import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
    const { user: currentUser, updateUser, syncPortalInUser, syncPortalMembership } = useAuth();
    const deletePostEvent = useGlobalStore(state => state.deletePostEvent);
    const updateUserEvent = useGlobalStore(state => state.updateUserEvent);
    const addUnreadPost = useGlobalStore(state => state.addUnreadPost);
    const addUnreadChannelPost = useGlobalStore(state => state.addUnreadChannelPost);

    // Keep latest userId in ref so socket listeners bind once per connection and never churn on auth updates
    const currentUserIdRef = useRef(currentUser?._id ? String(currentUser._id) : null);
    currentUserIdRef.current = currentUser?._id ? String(currentUser._id) : null;

    useEffect(() => {
        if (!socket || !connected) return;

        // Global deletion sync
        const handleGlobalPostDeleted = ({ _id }) => {
            deletePostEvent(_id);
        };

        const handleUserProfileSync = (raw) => {
            const payload = raw?.fullDocument || raw;
            const targetId = raw?._id || payload?._id;
            if (!targetId) return;

            updateUserEvent(targetId, payload);

            if (currentUserIdRef.current && String(targetId) === currentUserIdRef.current && typeof updateUser === 'function') {
                updateUser((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        ...(payload.username ? { username: payload.username } : {}),
                        profile: {
                            ...(prev.profile || {}),
                            ...(payload.profile || {}),
                        },
                    };
                });
            }

            window.dispatchEvent(new CustomEvent('oxypace:user_updated', {
                detail: { ...payload, _id: targetId }
            }));
        };

        const handlePortalUpdated = (portalPayload) => {
            if (!portalPayload?._id) return;
            if (typeof syncPortalInUser === 'function') {
                syncPortalInUser(portalPayload);
            }
            window.dispatchEvent(new CustomEvent('oxypace:portal_updated', { detail: portalPayload }));
        };

        const handlePortalMembershipChanged = (data) => {
            if (!data?.portalId) return;
            if (currentUserIdRef.current && String(data.userId) === currentUserIdRef.current && typeof syncPortalMembership === 'function') {
                syncPortalMembership(data.portal || data.portalId, data.action);
            }
            window.dispatchEvent(new CustomEvent('oxypace:portal_membership_changed', { detail: data }));
        };

        const handlePortalActivity = ({ portalId, channelId, postId }) => {
            if (!portalId || !postId) return;
            const strPortalId = portalId.toString();
            const strChannelId = channelId ? channelId.toString() : null;
            const strPostId = postId.toString();

            if (!window.location.pathname.includes(`/portal/${strPortalId}`)) {
                addUnreadPost(strPortalId, strPostId, strChannelId);
            }

            if (strChannelId) {
                addUnreadChannelPost(strChannelId, strPostId, strPortalId);
            }
        };

        const handleNewMessage = (message) => {
            const activeChatUserId = useGlobalStore.getState().activeChatUserId;
            const senderId = String(message?.sender?._id || message?.sender || '');
            if (activeChatUserId && String(activeChatUserId) === senderId) {
                return;
            }
            useGlobalStore.getState().fetchUnreadMessagesCount();
        };

        const handleMessagesRead = () => {
            useGlobalStore.getState().fetchUnreadMessagesCount();
        };

        socket.on('global:post_deleted', handleGlobalPostDeleted);
        socket.on('global:user_updated', handleUserProfileSync);
        socket.on('user:profile_updated', handleUserProfileSync);
        socket.on('portal:updated', handlePortalUpdated);
        socket.on('portal:membership_changed', handlePortalMembershipChanged);
        socket.on('global:portal_activity', handlePortalActivity);
        socket.on('newMessage', handleNewMessage);
        socket.on('messagesRead', handleMessagesRead);

        return () => {
            socket.off('global:post_deleted', handleGlobalPostDeleted);
            socket.off('global:user_updated', handleUserProfileSync);
            socket.off('user:profile_updated', handleUserProfileSync);
            socket.off('portal:updated', handlePortalUpdated);
            socket.off('portal:membership_changed', handlePortalMembershipChanged);
            socket.off('global:portal_activity', handlePortalActivity);
            socket.off('newMessage', handleNewMessage);
            socket.off('messagesRead', handleMessagesRead);
        };
    }, [socket, connected, updateUser, syncPortalInUser, syncPortalMembership, deletePostEvent, updateUserEvent, addUnreadPost, addUnreadChannelPost]);

    return socket;
};
