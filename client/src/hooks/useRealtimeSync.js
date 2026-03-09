import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGlobalStore } from '../store/useGlobalStore';

// Get URL from environment or fallback to current origin for relative paths
const SOCKET_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
});

export const useRealtimeSync = () => {
    const { addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent } = useGlobalStore();

    useEffect(() => {
        socket.on('global:post_created', (newPost) => {
            addPostEvent(newPost);
        });

        socket.on('global:post_updated', (updatedPost) => {
            updatePostEvent(updatedPost);
        });

        socket.on('global:post_deleted', ({ _id }) => {
            deletePostEvent(_id);
        });

        socket.on('global:user_updated', (data) => {
            updateUserEvent(data._id, data.fullDocument);
        });

        return () => {
            socket.off('global:post_created');
            socket.off('global:post_updated');
            socket.off('global:post_deleted');
            socket.off('global:user_updated');
        };
    }, [addPostEvent, updatePostEvent, deletePostEvent, updateUserEvent]);

    return socket;
};
