import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
    const { addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent, addUnreadPost } = useGlobalStore();

    useEffect(() => {
        if (!socket || !connected) return;

        // Global deletion sync
        socket.on('global:post_deleted', ({ _id }) => {
            console.log('📡 Post deleted globally:', _id);
            deletePostEvent(_id);
        });

        socket.on('global:user_updated', (data) => {
            updateUserEvent(data._id, data.fullDocument);
        });

        socket.on('global:portal_activity', ({ portalId, postId }) => {
            console.log('📡 Portal activity detected:', portalId, 'Post:', postId);
            // Only mark unread if not currently in that portal
            if (!window.location.pathname.includes(`/portal/${portalId}`)) {
                if (postId) {
                    addUnreadPost(portalId, postId);
                }
            }
        });

        return () => {
            socket.off('global:post_deleted');
            socket.off('global:user_updated');
            socket.off('global:portal_activity');
        };
    }, [socket, connected, addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent, addUnreadPost]);

    return socket;
};
