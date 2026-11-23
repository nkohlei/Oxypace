import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
    const { user: currentUser, updateUser, syncPortalInUser, syncPortalMembership } = useAuth();
    const addPostEvent = useGlobalStore(state => state.addPostEvent);
    const updatePostEvent = useGlobalStore(state => state.updatePostEvent);
    const deletePostEvent = useGlobalStore(state => state.deletePostEvent);
    const updateUserEvent = useGlobalStore(state => state.updateUserEvent);
    const addUnreadPost = useGlobalStore(state => state.addUnreadPost);
    const addUnreadChannelPost = useGlobalStore(state => state.addUnreadChannelPost);

    useEffect(() => {
        if (!socket || !connected) return;

        // Global deletion sync
        socket.on('global:post_deleted', ({ _id }) => {
            deletePostEvent(_id);
        });

        const handleUserProfileSync = (raw) => {
            const payload = raw?.fullDocument || raw;
            const targetId = raw?._id || payload?._id;
            if (!targetId) return;

            updateUserEvent(targetId, payload);

            if (currentUser?._id && String(targetId) === String(currentUser._id) && typeof updateUser === 'function') {
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

        socket.on('global:user_updated', handleUserProfileSync);
        socket.on('user:profile_updated', handleUserProfileSync);

        const handlePortalUpdated = (portalPayload) => {
            if (!portalPayload?._id) return;
            if (typeof syncPortalInUser === 'function') {
                syncPortalInUser(portalPayload);
            }
            window.dispatchEvent(new CustomEvent('oxypace:portal_updated', { detail: portalPayload }));
        };

        const handlePortalMembershipChanged = (data) => {
            if (!data?.portalId) return;
            if (currentUser?._id && String(data.userId) === String(currentUser._id) && typeof syncPortalMembership === 'function') {
                syncPortalMembership(data.portal || data.portalId, data.action);
            }
            window.dispatchEvent(new CustomEvent('oxypace:portal_membership_changed', { detail: data }));
        };

        socket.on('portal:updated', handlePortalUpdated);
        socket.on('portal:membership_changed', handlePortalMembershipChanged);

        socket.on('global:portal_activity', ({ portalId, channelId, postId }) => {
            if (!portalId || !postId) return;
            const strPortalId = portalId.toString();
            const strChannelId = channelId ? channelId.toString() : null;
            const strPostId = postId.toString();

            // 1. Portal Level Notification: Only if not currently in that portal
            if (!window.location.pathname.includes(`/portal/${strPortalId}`)) {
                addUnreadPost(strPortalId, strPostId, strChannelId);
            }

            // 2. Channel Level Notification
            if (strChannelId) {
                addUnreadChannelPost(strChannelId, strPostId, strPortalId);
            }
        });

        socket.on('newMessage', (message) => {
            const activeChatUserId = useGlobalStore.getState().activeChatUserId;
            const senderId = String(message?.sender?._id || message?.sender || '');
            // If the user is currently viewing the conversation with this sender, do not fetch unread count
            if (activeChatUserId && String(activeChatUserId) === senderId) {
                return;
            }
            // Fetch updated unread messages count
            useGlobalStore.getState().fetchUnreadMessagesCount();
        });

        socket.on('messagesRead', () => {
            useGlobalStore.getState().fetchUnreadMessagesCount();
        });

        return () => {
            socket.off('global:post_deleted');
            socket.off('global:user_updated', handleUserProfileSync);
            socket.off('user:profile_updated', handleUserProfileSync);
            socket.off('portal:updated', handlePortalUpdated);
            socket.off('portal:membership_changed', handlePortalMembershipChanged);
            socket.off('global:portal_activity');
            socket.off('newMessage');
            socket.off('messagesRead');
        };
    }, [socket, connected, currentUser?._id, updateUser, syncPortalInUser, syncPortalMembership, addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent, addUnreadPost, addUnreadChannelPost]);

    return socket;
};
