import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
    const { addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent } = useGlobalStore();

    useEffect(() => {
        if (!socket || !connected) return;

        // Scoped events (Portal/Channel specific)
        socket.on('post:created', (newPost) => {
            console.log('📡 Scoped Post Created:', newPost.content.substring(0, 30));
            addPostEvent(newPost);
        });

        socket.on('post:updated', (updatedPost) => {
            console.log('📡 Scoped Post Updated:', updatedPost._id);
            updatePostEvent(updatedPost);
        });

        // Global events
        socket.on('global:post_created', (newPost) => {
            // We keep this for now! If the global store is used for a "Global Feed" elsewhere,
            // we might want it. But for Portal/Channel isolation, the scoped events handle it.
            // addPostEvent(newPost); // REMOVED to avoid duplicates if we are in a portal
        });

        socket.on('global:post_updated', (updatedPost) => {
            // updatePostEvent(updatedPost); // REMOVED
        });

        socket.on('global:post_deleted', ({ _id }) => {
            deletePostEvent(_id);
        });

        socket.on('global:user_updated', (data) => {
            updateUserEvent(data._id, data.fullDocument);
        });

        return () => {
            socket.off('post:created');
            socket.off('post:updated');
            socket.off('global:post_created');
            socket.off('global:post_updated');
            socket.off('global:post_deleted');
            socket.off('global:user_updated');
        };
    }, [socket, connected, addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent]);

    return socket;
};
