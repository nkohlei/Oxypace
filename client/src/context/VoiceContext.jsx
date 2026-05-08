import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { Room, RoomEvent, ConnectionState, Track, setLogLevel, LogLevel } from 'livekit-client';

// Silence LiveKit standard logs as requested by user
setLogLevel(LogLevel.error);
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

    // Device persistence state
    const [selectedAudioInput, setSelectedAudioInput] = useState(null);
    const [selectedAudioOutput, setSelectedAudioOutput] = useState(null);
    const [selectedVideoInput, setSelectedVideoInput] = useState(null);

    // Derived UI states
    const [participants, setParticipants] = useState([]);
    const [localState, setLocalState] = useState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });
    const [pinnedParticipant, setPinnedParticipant] = useState(null);

    // Device management
    const [availableDevices, setAvailableDevices] = useState({ audioInputs: [], audioOutputs: [], videoInputs: [] });
    const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

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
            const soundFile = `/sounds/${type}.mp3`;
            const audio = new Audio(soundFile);
            audio.volume = type === 'message' ? 0.2 : 0.4; // Reduced from 0.6 to 0.4 for better balance
            audio.play().catch((err) => {
                // Autoplay might be blocked if no user interaction yet
                console.warn(`Audio play blocked: ${soundFile}`, err);
            });
        } catch (e) {
            console.error("Sound play error", e);
        }
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

            setLocalState(prev => ({
                ...prev,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOn: p.isCameraEnabled,
                isScreenSharing: p.isScreenShareEnabled
            }));
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

    // Enumerate devices
    const enumerateDevices = useCallback(async () => {
        try {
            const audioInputs = await Room.getLocalDevices('audioinput');
            const audioOutputs = await Room.getLocalDevices('audiooutput');
            const videoInputs = await Room.getLocalDevices('videoinput');
            setAvailableDevices({ audioInputs, audioOutputs, videoInputs });
        } catch (err) {
            console.error("Failed to enumerate devices", err);
        }
    }, []);

    // Initialize device listener
    useEffect(() => {
        enumerateDevices();
        navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);
        return () => {
            navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
        };
    }, [enumerateDevices]);

    // Main connection function
    const connectToChannel = useCallback(async (portalId, channelId) => {
        if (room) {
            await room.disconnect();
            setRoom(null);
        }

        setConnectionState(ConnectionState.Connecting);
        setErrorMsg('');
        setChatMessages([]); // Clear chat on new room connect
        setRoomStartTime(null); // Clear timer before join

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
            newRoom.on(RoomEvent.ParticipantConnected, (p) => { updateList(); });
            newRoom.on(RoomEvent.ParticipantDisconnected, (p) => { updateList(); });
            newRoom.on(RoomEvent.TrackSubscribed, updateList);
            newRoom.on(RoomEvent.TrackUnsubscribed, updateList);
            newRoom.on(RoomEvent.TrackMuted, updateList);
            newRoom.on(RoomEvent.TrackUnmuted, updateList);
            // newRoom.on(RoomEvent.ActiveSpeakersChanged, updateList); // Removed to prevent slow-down from high frequency events
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

            // 4. Connect with pre-selected devices if any
            const connectOptions = {};
            if (selectedAudioInput) connectOptions.audio = { deviceId: selectedAudioInput };
            if (selectedVideoInput) connectOptions.video = { deviceId: selectedVideoInput };

            await newRoom.connect(serverUrl, token, connectOptions);
            
            // Set audio output if selected
            if (selectedAudioOutput) {
                try { await newRoom.setAudioOutputDevice(selectedAudioOutput); } catch(e) {}
            }

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
            }

            // 6. Join muted by default to avoid immediate permission prompt (as requested)
            setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });

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
        if (socket && activeRoom) {
            socket.emit('voice:leave', {
                roomName: activeRoom.roomName,
                userId: user?._id?.toString()
            });
        }
        
        setActiveRoom(null);
        setParticipants([]);
        setChatMessages([]);
        setPinnedParticipant(null);
        setRoomStartTime(null);
        setConnectionState(ConnectionState.Disconnected);
    }, [room, socket, activeRoom, user]);

    // Socket Event Handlers
    useEffect(() => {
        if (!socket) return;

        const handleParticipants = (data) => {
            // Only update timer if we are actually in a room and it matches the data
            if (activeRoom && data.startedAt) {
                if (data.serverNow) {
                    const localNow = Date.now();
                    const offset = data.serverNow - localNow;
                    // Adjust startedAt to be relative to this client's local clock
                    setRoomStartTime(data.startedAt - offset);
                } else {
                    setRoomStartTime(data.startedAt);
                }
            }
        };

        const handleUserJoined = (data) => {
            if (data.userId !== user?._id?.toString()) {
                playInteractionSound('join');
            }
        };

        const handleUserLeft = (data) => {
            if (data.userId !== user?._id?.toString()) {
                playInteractionSound('leave');
            }
        };

        socket.on('voice:participants', handleParticipants);
        socket.on('voice:user-joined', handleUserJoined);
        socket.on('voice:user-left', handleUserLeft);

        return () => {
            socket.off('voice:participants', handleParticipants);
            socket.off('voice:user-joined', handleUserJoined);
            socket.off('voice:user-left', handleUserLeft);
        };
    }, [socket, user, playInteractionSound, activeRoom]);

    // Media Controls with Optimistic Updates
    const toggleMicrophone = useCallback(async () => {
        if (!room || !room.localParticipant) return;
        const willEnable = !room.localParticipant.isMicrophoneEnabled;
        
        try {
            await room.localParticipant.setMicrophoneEnabled(willEnable, {
                deviceId: selectedAudioInput || undefined
            });
        } catch (err) {
            console.error("Mic toggle failed", err);
        }
    }, [room, selectedAudioInput]);

    const toggleDeafen = useCallback(() => {
        setLocalState(prev => ({ ...prev, isDeafened: !prev.isDeafened }));
    }, []);

    const toggleCamera = useCallback(async () => {
        if (!room || !room.localParticipant) return;
        const willEnable = !room.localParticipant.isCameraEnabled;
        
        try {
            await room.localParticipant.setCameraEnabled(willEnable);
            // State will be updated via updateList through LiveKit events
        } catch (err) {
            console.error("Camera toggle failed", err);
        }
    }, [room]);

    const toggleFacingMode = useCallback(async () => {
        if (!room || !room.localParticipant) return;
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (localState.isCameraOn) {
            await room.localParticipant.setCameraEnabled(true, { facingMode: newMode });
        }
    }, [room, facingMode, localState.isCameraOn]);

    const setAudioOutput = useCallback(async (deviceId) => {
        setSelectedAudioOutput(deviceId);
        if (room) {
            try {
                await room.setAudioOutputDevice(deviceId);
            } catch (err) {
                console.error("Failed to set audio output device", err);
            }
        }
    }, [room]);

    const setAudioInput = useCallback(async (deviceId) => {
        setSelectedAudioInput(deviceId);
        if (room) {
            try {
                await room.switchActiveDevice('audioinput', deviceId);
            } catch (err) {
                console.error("Failed to set audio input device", err);
            }
        }
    }, [room]);

    const setVideoInput = useCallback(async (deviceId) => {
        if (!room) return;
        try {
            await room.switchActiveDevice('videoinput', deviceId);
        } catch (err) {
            console.error("Failed to set video input device", err);
        }
    }, [room]);

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
        roomStartTime,
        errorMsg,
        localState,
        chatMessages,
        connectToChannel,
        disconnectFromChannel,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        sendChatMessage,
        grantSpeak,
        revokeSpeak,
        pinnedParticipant,
        setPinnedParticipant,
        availableDevices,
        facingMode,
        toggleFacingMode,
        setAudioOutput,
        setAudioInput,
        setVideoInput,
        toggleDeafen,
        enumerateDevices,
        selectedAudioInput,
        selectedAudioOutput,
        selectedVideoInput
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
            <GlobalAudioRenderer participants={participants} isDeafened={localState.isDeafened} />
        </VoiceContext.Provider>
    );
};

// Global Audio Component for cross-navigation persistence
const GlobalAudioRenderer = ({ participants, isDeafened }) => {
    return (
        <div style={{ display: 'none' }}>
            {participants.filter(p => !p.isLocal && p.audioTrack).map(p => (
                <AudioTrackPlayer key={`global-audio-${p.identity}`} track={p.audioTrack} muted={isDeafened} />
            ))}
        </div>
    );
};

const AudioTrackPlayer = ({ track, muted }) => {
    const audioEl = useRef(null);
    useEffect(() => {
        if (audioEl.current && track) {
            track.attach(audioEl.current);
        }
        return () => {
            if (track) track.detach();
        };
    }, [track]);

    useEffect(() => {
        if (audioEl.current) {
            audioEl.current.muted = muted;
        }
    }, [muted]);

    return <audio ref={audioEl} autoPlay />;
};
