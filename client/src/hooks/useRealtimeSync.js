import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
    const { addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent, addUnreadPost, addUnreadChannelPost } = useGlobalStore();

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
            
            // 1. Portal Level Notification: Only if not currently in that portal
            if (!window.location.pathname.includes(`/portal/${portalId}`)) {
                if (postId) {
                    addUnreadPost(portalId, postId);
                }
            }

            // 2. Channel Level Notification: If we are in the portal but NOT in that specific channel,
            // or if we aren't in the portal at all (track it for when we enter).
            // (Note: The UI will filter which channel badges to show based on the active portal)
            if (channelId && postId) {
                // Check if we are currently "in" this channel. 
                // Since URL is just /portal/:id, we'd ideally check the store's currentChannelId if available,
                // but usually the UI handles the 'active' state. For simplicity, we add it if the post isn't
                // from the portal we are currently strictly looking at if we want to be safe, 
                // OR we just add it and let the Sidebar component clear it if it's the active one.
                addUnreadChannelPost(channelId, postId);
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
