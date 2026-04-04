import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGlobalStore } from '../store/useGlobalStore';

export const useRealtimeSync = () => {
    // Rely on the existing authenticated socket from SocketContext
    const { socket, connected } = useSocket();
    const { addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent } = useGlobalStore();

    useEffect(() => {
        if (!socket || !connected) return;

        // Scoped events (Portal/Channel specific) are now handled inside the specific page components
        // (e.g., Portal.jsx) to ensure strict context isolation and avoid "leakage" between rooms.

        // Global events that still apply everywhere
        socket.on('global:post_deleted', ({ _id }) => {
            deletePostEvent(_id);
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
