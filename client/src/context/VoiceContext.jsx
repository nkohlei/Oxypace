import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { Room, RoomEvent, ConnectionState, Track } from 'livekit-client';
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

    // Core states
    const [activeRoom, setActiveRoom] = useState(null); // { portalId, channelId, roomName, channelName }
    const [room, setRoom] = useState(null); // The actual LiveKit Room instance
    const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
    const [errorMsg, setErrorMsg] = useState('');

    // Derived UI states
    const [participants, setParticipants] = useState([]);
    const [localState, setLocalState] = useState({ isMuted: true, isCameraOn: false, isScreenSharing: false });

    // Ensure room is cleaned up on unmount
    useEffect(() => {
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [room]);

    // Handle participant list updates
    const updateParticipantList = useCallback((currentRoom) => {
        if (!currentRoom) return;
        const list = [];

        // Add Local Participant
        if (currentRoom.localParticipant) {
            const p = currentRoom.localParticipant;
            let avatar = '';
            try { avatar = JSON.parse(p.metadata || '{}').avatar || ''; } catch { }
            const videoPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.Camera);
            const audioPub = Array.from(p.audioTrackPublications.values()).find(pub => pub.track);
            list.push({
                identity: p.identity,
                name: p.name || p.identity,
                avatar,
                isLocal: true,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOn: p.isCameraEnabled,
                isSpeaking: p.isSpeaking,
                videoTrack: videoPub?.track || null,
                audioTrack: audioPub?.track || null,
            });
        }

        // Add Remote Participants
        for (const p of currentRoom.remoteParticipants.values()) {
            let avatar = '';
            try { avatar = JSON.parse(p.metadata || '{}').avatar || ''; } catch { }
            const videoPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.Camera);
            const audioPub = Array.from(p.audioTrackPublications.values()).find(pub => pub.track);
            list.push({
                identity: p.identity,
                name: p.name || p.identity,
                avatar,
                isLocal: false,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOn: p.isCameraEnabled,
                isSpeaking: p.isSpeaking,
                videoTrack: videoPub?.track || null,
                audioTrack: audioPub?.track || null,
            });
        }
        setParticipants(list);
    }, []);

    // Main connection function
    const connectToChannel = useCallback(async (portalId, channelId) => {
        if (room) {
            await room.disconnect();
            setRoom(null);
        }

        setConnectionState(ConnectionState.Connecting);
        setErrorMsg('');

        try {
            // 1. Fetch Token
            const response = await axios.post('/api/voice/token', { portalId, channelId });
            const { token, serverUrl, roomName, channelName, roomMode, userRole: returnRole } = response.data;

            // 2. Instantiate Room
            const newRoom = new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                videoCaptureDefaults: { resolution: { width: 640, height: 480, frameRate: 24 } },
            });

            // 3. Bind Events
            newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
                setConnectionState(state);
                if (state === ConnectionState.Disconnected) {
                    setActiveRoom(null);
                    setParticipants([]);
                    if (socket) {
                        socket.emit('voice:leave', { roomName, userId: user?._id });
                    }
                }
            });

            const updateList = () => updateParticipantList(newRoom);
            newRoom.on(RoomEvent.ParticipantConnected, updateList);
            newRoom.on(RoomEvent.ParticipantDisconnected, updateList);
            newRoom.on(RoomEvent.TrackSubscribed, updateList);
            newRoom.on(RoomEvent.TrackUnsubscribed, updateList);
            newRoom.on(RoomEvent.TrackMuted, updateList);
            newRoom.on(RoomEvent.TrackUnmuted, updateList);
            newRoom.on(RoomEvent.ActiveSpeakersChanged, updateList);
            newRoom.on(RoomEvent.LocalTrackPublished, updateList);
            newRoom.on(RoomEvent.LocalTrackUnpublished, updateList);

            // 4. Connect
            await newRoom.connect(serverUrl, token);
            setRoom(newRoom);
            setActiveRoom({ portalId, channelId, roomName, channelName, roomMode, userRole: returnRole });
            updateList();

            // 5. Notify Presence Socket
            if (socket) {
                socket.emit('voice:join', {
                    roomName,
                    userId: user?._id,
                    username: user?.username,
                    avatar: user?.profile?.avatar || '',
                });
            }

            // 6. Connect Microphone automatically by default (Optional UX decision, keeping muted for now)
            // await newRoom.localParticipant.setMicrophoneEnabled(true);
            // setLocalState(prev => ({ ...prev, isMuted: false }));

        } catch (err) {
            console.error('Failed to connect to LiveKit:', err);
            setErrorMsg(err.message || 'Bağlantı kurulamadı.');
            setConnectionState(ConnectionState.Disconnected);
        }
    }, [room, socket, user, updateParticipantList]);

    const disconnectFromChannel = useCallback(async () => {
        if (room) {
            await room.disconnect();
            setRoom(null);
        }
        setActiveRoom(null);
        setParticipants([]);
        setConnectionState(ConnectionState.Disconnected);
    }, [room]);

    // Media Controls
    const toggleMicrophone = useCallback(async () => {
        if (!room || !room.localParticipant) return;
        const willEnable = localState.isMuted;
        await room.localParticipant.setMicrophoneEnabled(willEnable);
        setLocalState(prev => ({ ...prev, isMuted: !willEnable }));
    }, [room, localState.isMuted]);

    const toggleCamera = useCallback(async () => {
        if (!room || !room.localParticipant) return;
        const willEnable = !localState.isCameraOn;
        await room.localParticipant.setCameraEnabled(willEnable);
        setLocalState(prev => ({ ...prev, isCameraOn: willEnable }));
    }, [room, localState.isCameraOn]);

    // Permissions (Admin)
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
        room,
        activeRoom,
        connectionState,
        participants,
        errorMsg,
        localState,
        connectToChannel,
        disconnectFromChannel,
        toggleMicrophone,
        toggleCamera,
        grantSpeak,
        revokeSpeak,
    };

    return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
