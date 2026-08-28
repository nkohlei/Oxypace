import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
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

        socket.on('global:user_updated', (data) => {
            updateUserEvent(data._id, data.fullDocument);
        });

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
            // Fetch updated unread messages count
            useGlobalStore.getState().fetchUnreadMessagesCount();
        });

        return () => {
            socket.off('global:post_deleted');
            socket.off('global:user_updated');
            socket.off('global:portal_activity');
            socket.off('newMessage');
        };
    }, [socket, connected, addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent, addUnreadPost, addUnreadChannelPost]);

    return socket;
};
