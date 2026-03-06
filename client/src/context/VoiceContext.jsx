import { createContext, useContext, useCallback, useRef, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';

const VoiceContext = createContext();

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) throw new Error('useVoice must be used within VoiceProvider');
    return context;
};

export const VoiceProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [activeRoom, setActiveRoom] = useState(null); // { portalId, channelId, roomName }

    // Fetch a LiveKit token from backend
    const getToken = useCallback(async (portalId, channelId) => {
        const response = await axios.post('/api/voice/token', { portalId, channelId });
        return response.data; // { token, serverUrl, roomName, roomMode, userRole, channelName }
    }, []);

    // Track which room we're in for presence
    const joinRoom = useCallback((portalId, channelId, roomName) => {
        setActiveRoom({ portalId, channelId, roomName });
        if (socket) {
            socket.emit('voice:join', {
                roomName,
                userId: user?._id,
                username: user?.username,
                avatar: user?.profile?.avatar || '',
            });
        }
    }, [socket, user]);

    const leaveRoom = useCallback(() => {
        if (activeRoom && socket) {
            socket.emit('voice:leave', {
                roomName: activeRoom.roomName,
                userId: user?._id,
            });
        }
        setActiveRoom(null);
    }, [activeRoom, socket, user]);

    // Grant/Revoke speak permissions
    const grantSpeak = useCallback(async (portalId, channelId, targetUserId) => {
        await axios.post(`/api/voice/rooms/${portalId}/${channelId}/permissions`, {
            targetUserId, canPublish: true,
        });
    }, []);

    const revokeSpeak = useCallback(async (portalId, channelId, targetUserId) => {
        await axios.post(`/api/voice/rooms/${portalId}/${channelId}/permissions`, {
            targetUserId, canPublish: false,
        });
    }, []);

    const value = {
        activeRoom,
        getToken,
        joinRoom,
        leaveRoom,
        grantSpeak,
        revokeSpeak,
        user,
        socket,
    };

    return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
