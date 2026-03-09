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
    const [pinnedParticipant, setPinnedParticipant] = useState(null);

    // Additional Voice states
    const [roomStartTime, setRoomStartTime] = useState(null);

    // Chat states
    const [chatMessages, setChatMessages] = useState([]);

    // Ensure room is cleaned up on user logout only
    useEffect(() => {
        if (!user && connectionState !== ConnectionState.Disconnected) {
            if (room) {
                room.disconnect();
            }
            setConnectionState(ConnectionState.Disconnected);
        }
        // Removed aggressive cleanup return on re-renders to prevent sudden disconnects during UI state changes
    }, [room, user, connectionState]);

    // Local Sound Helper
    const playInteractionSound = useCallback((type) => {
        try {
            const audio = new Audio(`/sounds/${type}.mp3`);
            audio.volume = type === 'message' ? 0.3 : 0.5;
            audio.play().catch(() => { });
        } catch (e) { }
    }, []);

    // Handle participant list updates
    const updateParticipantList = useCallback((currentRoom) => {
        if (!currentRoom) return;
        const list = [];

        // Add Local Participant
        if (currentRoom.localParticipant) {
            const p = currentRoom.localParticipant;
            let avatar = '';
            let role = 'member';
            try {
                const meta = JSON.parse(p.metadata || '{}');
                avatar = meta.avatar || '';
                if (meta.role) role = meta.role;
            } catch { }
            const videoPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.Camera);
            const audioPub = Array.from(p.audioTrackPublications.values()).find(pub => pub.track);
            const screenPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.ScreenShare);

            list.push({
                identity: p.identity,
                name: p.name || p.identity,
                avatar,
                role,
                isLocal: true,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOn: p.isCameraEnabled,
                isScreenSharing: p.isScreenShareEnabled,
                isSpeaking: p.isSpeaking,
                connectionQuality: p.connectionQuality,
                videoTrack: videoPub?.track || null,
                audioTrack: audioPub?.track || null,
                screenShareTrack: screenPub?.track || null,
            });
        }

        // Add Remote Participants
        for (const p of currentRoom.remoteParticipants.values()) {
            let avatar = '';
            let role = 'member';
            try {
                const meta = JSON.parse(p.metadata || '{}');
                avatar = meta.avatar || '';
                if (meta.role) role = meta.role;
            } catch { }
            const videoPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.Camera);
            const audioPub = Array.from(p.audioTrackPublications.values()).find(pub => pub.track);
            const screenPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.ScreenShare);

            list.push({
                identity: p.identity,
                name: p.name || p.identity,
                avatar,
                role,
                isLocal: false,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOn: p.isCameraEnabled,
                isScreenSharing: p.isScreenShareEnabled,
                isSpeaking: p.isSpeaking,
                connectionQuality: p.connectionQuality,
                videoTrack: videoPub?.track || null,
                audioTrack: audioPub?.track || null,
                screenShareTrack: screenPub?.track || null,
            });
        }
        setParticipants(list);

        // Check if the currently pinned participant is still in the room
        setPinnedParticipant(prev => {
            if (prev && !list.find(p => p.identity === prev)) return null;
            return prev;
        });
    }, []);

    // Main connection function
    const connectToChannel = useCallback(async (portalId, channelId) => {
        if (room) {
            await room.disconnect();
            setRoom(null);
        }

        setConnectionState(ConnectionState.Connecting);
        setErrorMsg('');
        setChatMessages([]); // Clear chat on new room connect

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
                publishDefaults: {
                    screenShareEncoding: { maxBitrate: 1500000, maxFramerate: 30 } // Bandwidth optimization for low-latency
                }
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
            newRoom.on(RoomEvent.ParticipantConnected, (p) => { playInteractionSound('join'); updateList(); });
            newRoom.on(RoomEvent.ParticipantDisconnected, (p) => { playInteractionSound('leave'); updateList(); });
            newRoom.on(RoomEvent.TrackSubscribed, updateList);
            newRoom.on(RoomEvent.TrackUnsubscribed, updateList);
            newRoom.on(RoomEvent.TrackMuted, updateList);
            newRoom.on(RoomEvent.TrackUnmuted, updateList);
            newRoom.on(RoomEvent.ActiveSpeakersChanged, updateList);
            newRoom.on(RoomEvent.ConnectionQualityChanged, updateList);
            newRoom.on(RoomEvent.LocalTrackPublished, updateList);
            newRoom.on(RoomEvent.LocalTrackUnpublished, updateList);

            // Listen for DataChannel (Chat)
            newRoom.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
                if (topic === 'chat') {
                    const decoder = new TextDecoder();
                    try {
                        const msgObj = JSON.parse(decoder.decode(payload));
                        // Append to messages
                        setChatMessages(prev => [...prev, {
                            id: Date.now() + Math.random(),
                            senderName: participant?.name || participant?.identity || 'Unknown',
                            senderId: participant?.identity,
                            text: msgObj.text,
                            timestamp: new Date().toISOString(),
                            isLocal: false
                        }]);
                        playInteractionSound('message');
                    } catch (e) {
                        console.error("Failed to parse chat message", e);
                    }
                }
            });

            // 4. Connect
            await newRoom.connect(serverUrl, token);
            setRoom(newRoom);
            setActiveRoom({ portalId, channelId, roomName, channelName, roomMode, userRole: returnRole });
            updateList();

            // 5. Notify Presence Socket
            if (socket) {
                socket.emit('voice:join', {
                    roomName,
                    userId: user?._id?.toString(),
                    username: user?.username || 'Unknown',
                    avatar: user?.profile?.avatar || '',
                });

                socket.on('voice:participants', (data) => {
                    if (data.startedAt) {
                        setRoomStartTime(data.startedAt);
                    }
                });
            }

            // 6. Force hardware tracks off (Local UI state is currently initialized to true/false above)
            // Even if browser defaults allow hardware, we strictly enforce muted on join.
            if (newRoom.localParticipant) {
                await newRoom.localParticipant.setMicrophoneEnabled(false);
                await newRoom.localParticipant.setCameraEnabled(false);
                setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false });
            }

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
        setChatMessages([]);
        setPinnedParticipant(null);
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

    const toggleScreenShare = useCallback(async () => {
        if (!room || !room.localParticipant) return;
        const willEnable = !localState.isScreenSharing;
        try {
            await room.localParticipant.setScreenShareEnabled(willEnable);
            setLocalState(prev => ({ ...prev, isScreenSharing: willEnable }));
        } catch (err) {
            console.warn('Screen share failed or cancelled:', err);
        }
    }, [room, localState.isScreenSharing]);

    // Send Chat Message
    const sendChatMessage = useCallback(async (text) => {
        if (!room || !room.localParticipant || !text.trim()) return;

        const payload = JSON.stringify({ text });
        const encoder = new TextEncoder();

        try {
            // Using reliable data delivery
            await room.localParticipant.publishData(encoder.encode(payload), { reliable: true, topic: 'chat' });

            // Re-append to our own local state
            setChatMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                senderName: user?.profile?.displayName || user?.username || room.localParticipant.name || 'Sen',
                senderId: room.localParticipant.identity,
                text: text,
                timestamp: new Date().toISOString(),
                isLocal: true
            }]);
            playInteractionSound('message');
        } catch (err) {
            console.error("Failed to send chat message", err);
        }
    }, [room, user]);

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
        roomStartTime, // Exposed for frontend RoomTimer
        errorMsg,
        localState,
        chatMessages,
        connectToChannel,
        disconnectFromChannel,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare, // Exposed to trigger screen sharing
        sendChatMessage,
        grantSpeak,
        revokeSpeak,
        pinnedParticipant,
        setPinnedParticipant,
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
            <GlobalAudioRenderer participants={participants} />
        </VoiceContext.Provider>
    );
};

// Global Audio Component for cross-navigation persistence
const GlobalAudioRenderer = ({ participants }) => {
    return (
        <div style={{ display: 'none' }}>
            {participants.filter(p => !p.isLocal && p.audioTrack).map(p => (
                <AudioTrackPlayer key={`global-audio-${p.identity}`} track={p.audioTrack} />
            ))}
        </div>
    );
};

const AudioTrackPlayer = ({ track }) => {
    const audioEl = useRef(null);
    useEffect(() => {
        if (audioEl.current && track) {
            track.attach(audioEl.current);
        }
        return () => {
            if (track) track.detach();
        };
    }, [track]);
    return <audio ref={audioEl} autoPlay />;
};
