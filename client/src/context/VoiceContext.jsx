import { createContext, useContext, useReducer, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';

const VoiceContext = createContext();

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoice must be used within VoiceProvider');
    }
    return context;
};

// ─── State ───
const initialState = {
    currentRoom: null, // { portalId, channelId, roomName, serverUrl, token, channelName }
    participants: [],
    isMuted: true,
    isCameraOn: false,
    isScreenSharing: false,
    isConnecting: false,
    isConnected: false,
    raisedHands: [], // [{ userId, username, avatar, timestamp }]
    roomMode: 'free', // 'free' | 'stage'
    canSpeak: true,
    userRole: 'member',
    error: null,
};

// ─── Reducer ───
function voiceReducer(state, action) {
    switch (action.type) {
        case 'SET_CONNECTING':
            return { ...state, isConnecting: true, error: null };

        case 'JOIN_ROOM':
            return {
                ...state,
                currentRoom: action.payload,
                isConnecting: false,
                isConnected: true,
                isMuted: true,
                isCameraOn: false,
                roomMode: action.payload.roomMode || 'free',
                userRole: action.payload.userRole || 'member',
                canSpeak: action.payload.roomMode !== 'stage' ||
                    ['owner', 'admin'].includes(action.payload.userRole),
                raisedHands: [],
                error: null,
            };

        case 'LEAVE_ROOM':
            return { ...initialState };

        case 'SET_PARTICIPANTS':
            return { ...state, participants: action.payload };

        case 'TOGGLE_MUTE':
            return { ...state, isMuted: !state.isMuted };

        case 'SET_MUTED':
            return { ...state, isMuted: action.payload };

        case 'TOGGLE_CAMERA':
            return { ...state, isCameraOn: !state.isCameraOn };

        case 'SET_CAMERA':
            return { ...state, isCameraOn: action.payload };

        case 'TOGGLE_SCREEN_SHARE':
            return { ...state, isScreenSharing: !state.isScreenSharing };

        case 'SET_SCREEN_SHARE':
            return { ...state, isScreenSharing: action.payload };

        case 'RAISE_HAND': {
            const exists = state.raisedHands.find(h => h.userId === action.payload.userId);
            if (action.payload.raised) {
                if (exists) return state;
                return {
                    ...state,
                    raisedHands: [...state.raisedHands, action.payload],
                };
            } else {
                return {
                    ...state,
                    raisedHands: state.raisedHands.filter(h => h.userId !== action.payload.userId),
                };
            }
        }

        case 'UPDATE_PERMISSIONS':
            if (action.payload.userId === action.payload.currentUserId) {
                return { ...state, canSpeak: action.payload.canPublish };
            }
            return state;

        case 'SET_ERROR':
            return { ...state, error: action.payload, isConnecting: false };

        default:
            return state;
    }
}

// ─── Provider ───
export const VoiceProvider = ({ children }) => {
    const [state, dispatch] = useReducer(voiceReducer, initialState);
    const { socket } = useSocket();
    const { user } = useAuth();

    // ─── Join Voice Channel ───
    const joinVoiceChannel = useCallback(async (portalId, channelId) => {
        if (state.isConnecting || state.isConnected) {
            // Already connected — leave first
            if (state.currentRoom?.channelId === channelId) return;
            await leaveVoiceChannel();
        }

        dispatch({ type: 'SET_CONNECTING' });

        try {
            // Request token from backend
            const response = await axios.post('/api/voice/token', { portalId, channelId });
            const { token, serverUrl, roomName, roomMode, userRole, channelName } = response.data;

            const roomData = {
                portalId,
                channelId,
                roomName,
                serverUrl,
                token,
                roomMode,
                userRole,
                channelName,
            };

            dispatch({ type: 'JOIN_ROOM', payload: roomData });

            // Notify socket for presence tracking
            if (socket) {
                socket.emit('voice:join', {
                    roomName,
                    userId: user._id,
                    username: user.username,
                    avatar: user.profileImage || '',
                });
            }
        } catch (error) {
            console.error('Failed to join voice channel:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || 'Failed to join voice channel',
            });
        }
    }, [state.isConnecting, state.isConnected, state.currentRoom, socket, user]);

    // ─── Leave Voice Channel ───
    const leaveVoiceChannel = useCallback(() => {
        if (state.currentRoom && socket) {
            socket.emit('voice:leave', {
                roomName: state.currentRoom.roomName,
                userId: user?._id,
            });
        }
        dispatch({ type: 'LEAVE_ROOM' });
    }, [state.currentRoom, socket, user]);

    // ─── Media Controls ───
    const toggleMute = useCallback(() => {
        dispatch({ type: 'TOGGLE_MUTE' });
    }, []);

    const toggleCamera = useCallback(() => {
        dispatch({ type: 'TOGGLE_CAMERA' });
    }, []);

    const toggleScreenShare = useCallback(() => {
        dispatch({ type: 'TOGGLE_SCREEN_SHARE' });
    }, []);

    // ─── Raise Hand (Stage Mode) ───
    const raiseHand = useCallback((raised = true) => {
        if (!state.currentRoom || !socket) return;

        socket.emit('voice:raise-hand', {
            roomName: state.currentRoom.roomName,
            userId: user._id,
            username: user.username,
            avatar: user.profileImage || '',
            raised,
        });
    }, [state.currentRoom, socket, user]);

    // ─── Grant/Revoke Speak (Moderator) ───
    const grantSpeak = useCallback(async (targetUserId) => {
        if (!state.currentRoom) return;

        try {
            const { portalId, channelId } = state.currentRoom;
            await axios.post(`/api/voice/rooms/${portalId}/${channelId}/permissions`, {
                targetUserId,
                canPublish: true,
            });

            if (socket) {
                socket.emit('voice:grant-speak', {
                    roomName: state.currentRoom.roomName,
                    targetUserId,
                });
            }
        } catch (error) {
            console.error('Failed to grant speak:', error);
        }
    }, [state.currentRoom, socket]);

    const revokeSpeak = useCallback(async (targetUserId) => {
        if (!state.currentRoom) return;

        try {
            const { portalId, channelId } = state.currentRoom;
            await axios.post(`/api/voice/rooms/${portalId}/${channelId}/permissions`, {
                targetUserId,
                canPublish: false,
            });

            if (socket) {
                socket.emit('voice:revoke-speak', {
                    roomName: state.currentRoom.roomName,
                    targetUserId,
                });
            }
        } catch (error) {
            console.error('Failed to revoke speak:', error);
        }
    }, [state.currentRoom, socket]);

    // ─── Socket Event Listeners ───
    // Register socket listeners when in a room
    const registerSocketListeners = useCallback(() => {
        if (!socket) return () => { };

        const handleParticipants = ({ participants }) => {
            dispatch({ type: 'SET_PARTICIPANTS', payload: participants });
        };

        const handleRaiseHand = (data) => {
            dispatch({ type: 'RAISE_HAND', payload: data });
        };

        const handlePermissions = ({ userId, canPublish }) => {
            dispatch({
                type: 'UPDATE_PERMISSIONS',
                payload: { userId, canPublish, currentUserId: user?._id },
            });
        };

        socket.on('voice:participants', handleParticipants);
        socket.on('voice:raise-hand', handleRaiseHand);
        socket.on('voice:permissions-updated', handlePermissions);

        return () => {
            socket.off('voice:participants', handleParticipants);
            socket.off('voice:raise-hand', handleRaiseHand);
            socket.off('voice:permissions-updated', handlePermissions);
        };
    }, [socket, user]);

    const value = {
        ...state,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        raiseHand,
        grantSpeak,
        revokeSpeak,
        registerSocketListeners,
    };

    return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
