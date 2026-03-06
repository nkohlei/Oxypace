import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
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

        case 'TOKEN_RECEIVED':
            // Token received from API — store room data but DON'T set isConnected yet
            // isConnected will be set when LiveKit actually connects
            return {
                ...state,
                currentRoom: action.payload,
                isConnecting: true, // Still connecting until LiveKit connects
                roomMode: action.payload.roomMode || 'free',
                userRole: action.payload.userRole || 'member',
                canSpeak: action.payload.roomMode !== 'stage' ||
                    ['owner', 'admin'].includes(action.payload.userRole),
                raisedHands: [],
                error: null,
            };

        case 'CONNECTED':
            // LiveKit WebRTC connection established
            return {
                ...state,
                isConnecting: false,
                isConnected: true,
                isMuted: true,
                isCameraOn: false,
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
    const stateRef = useRef(state);
    stateRef.current = state;

    // ─── Mark Connected (called by components when LiveKit connects) ───
    const setConnected = useCallback(() => {
        dispatch({ type: 'CONNECTED' });
    }, []);

    // ─── Leave Voice Channel ───
    const leaveVoiceChannel = useCallback(() => {
        if (stateRef.current.currentRoom && socket) {
            socket.emit('voice:leave', {
                roomName: stateRef.current.currentRoom.roomName,
                userId: user?._id,
            });
        }
        dispatch({ type: 'LEAVE_ROOM' });
    }, [socket, user]);

    // ─── Join Voice Channel ───
    const joinVoiceChannel = useCallback(async (portalId, channelId) => {
        const s = stateRef.current;

        if (s.isConnecting) return;

        // If already in this channel, skip
        if (s.currentRoom?.channelId === channelId && (s.isConnected || s.isConnecting)) return;

        // If in a different room, leave first
        if (s.currentRoom) {
            leaveVoiceChannel();
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

            // Store token but don't mark as connected yet
            dispatch({ type: 'TOKEN_RECEIVED', payload: roomData });

            // Notify socket for presence tracking
            if (socket) {
                socket.emit('voice:join', {
                    roomName,
                    userId: user._id,
                    username: user.username,
                    avatar: user.profile?.avatar || '',
                });
            }
        } catch (error) {
            console.error('Failed to join voice channel:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || 'Failed to join voice channel',
            });
        }
    }, [socket, user, leaveVoiceChannel]);

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
        if (!stateRef.current.currentRoom || !socket) return;

        socket.emit('voice:raise-hand', {
            roomName: stateRef.current.currentRoom.roomName,
            userId: user._id,
            username: user.username,
            avatar: user.profile?.avatar || '',
            raised,
        });
    }, [socket, user]);

    // ─── Grant/Revoke Speak (Moderator) ───
    const grantSpeak = useCallback(async (targetUserId) => {
        if (!stateRef.current.currentRoom) return;

        try {
            const { portalId, channelId } = stateRef.current.currentRoom;
            await axios.post(`/api/voice/rooms/${portalId}/${channelId}/permissions`, {
                targetUserId,
                canPublish: true,
            });

            if (socket) {
                socket.emit('voice:grant-speak', {
                    roomName: stateRef.current.currentRoom.roomName,
                    targetUserId,
                });
            }
        } catch (error) {
            console.error('Failed to grant speak:', error);
        }
    }, [socket]);

    const revokeSpeak = useCallback(async (targetUserId) => {
        if (!stateRef.current.currentRoom) return;

        try {
            const { portalId, channelId } = stateRef.current.currentRoom;
            await axios.post(`/api/voice/rooms/${portalId}/${channelId}/permissions`, {
                targetUserId,
                canPublish: false,
            });

            if (socket) {
                socket.emit('voice:revoke-speak', {
                    roomName: stateRef.current.currentRoom.roomName,
                    targetUserId,
                });
            }
        } catch (error) {
            console.error('Failed to revoke speak:', error);
        }
    }, [socket]);

    // ─── Socket Event Listeners ───
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
        setConnected,
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
