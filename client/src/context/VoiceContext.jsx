import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';

const VoiceContext = createContext();

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) throw new Error('useVoice must be used within VoiceProvider');
    return context;
};

// WebRTC ICE configuration
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
];

// Helper to prioritize AV1/VP9 video codec in SDP
const prioritizeVideoCodec = (sdp) => {
    const lines = sdp.split('\r\n');
    let mVideoIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('m=video ')) {
            mVideoIndex = i;
            break;
        }
    }
    if (mVideoIndex === -1) return sdp;

    const codecs = [];
    for (const line of lines) {
        if (line.startsWith('a=rtpmap:')) {
            const match = line.match(/^a=rtpmap:(\d+)\s+([A-Za-z0-9-]+)\//);
            if (match) {
                codecs.push({
                    payloadType: match[1],
                    name: match[2].toUpperCase()
                });
            }
        }
    }

    const preferredPayloads = codecs
        .filter(c => c.name === 'VP9' || c.name === 'AV1')
        .sort((a, b) => {
            if (a.name === 'AV1') return -1;
            if (b.name === 'AV1') return 1;
            return 0;
        })
        .map(c => c.payloadType);

    if (preferredPayloads.length === 0) return sdp;

    const parts = lines[mVideoIndex].split(' ');
    const media = parts[0];
    const port = parts[1];
    const proto = parts[2];
    const formats = parts.slice(3);

    const otherFormats = formats.filter(f => !preferredPayloads.includes(f));
    const newFormats = [...preferredPayloads, ...otherFormats];

    lines[mVideoIndex] = `${media} ${port} ${proto} ${newFormats.join(' ')}`;
    return lines.join('\r\n');
};

export const VoiceProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    // Core states
    const [activeRoom, setActiveRoom] = useState(null); // { portalId, channelId, roomName, channelName, roomMode, userRole }
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

    // WebRTC connection references
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // userId -> RTCPeerConnection
    const remoteTracksRef = useRef(new Map()); // userId -> { audio: Track, video: Track, screen: Track }
    const remoteStatesRef = useRef(new Map()); // userId -> { isMuted, isCameraOn, isScreenSharing }
    const rawParticipantsRef = useRef([]); // list of current participants in socket room

    // Local Sound Helper
    const playInteractionSound = useCallback((type) => {
        try {
            const soundFile = `/sounds/${type}.mp3`;
            const audio = new Audio(soundFile);
            audio.volume = type === 'message' ? 0.2 : 0.4;
            audio.play().catch((err) => {
                console.warn(`Audio play blocked: ${soundFile}`, err);
            });
        } catch (e) {
            console.error("Sound play error", e);
        }
    }, []);

    // Create custom wrapper for tracks to expose attach/detach functions for UI compatibility
    const makeTrackObject = (track) => {
        if (!track) return null;
        return {
            track,
            attach: (el) => {
                if (el) {
                    el.srcObject = new MediaStream([track]);
                }
            },
            detach: (el) => {
                if (el) {
                    el.srcObject = null;
                }
            }
        };
    };

    // Update derived participants array for React components
    const updateParticipantList = useCallback(() => {
        const list = [];
        const localUserId = user?._id?.toString();

        // 1. Add Local Participant
        if (localUserId) {
            let localVideoTrack = null;
            let localAudioTrack = null;
            let localScreenTrack = null;

            if (localStreamRef.current) {
                localVideoTrack = localStreamRef.current.getVideoTracks()[0] || null;
                localAudioTrack = localStreamRef.current.getAudioTracks()[0] || null;
            }
            if (screenStreamRef.current) {
                localScreenTrack = screenStreamRef.current.getVideoTracks()[0] || null;
            }

            list.push({
                identity: localUserId,
                name: user?.profile?.displayName || user?.username || 'Sen',
                avatar: user?.profile?.avatar || '',
                role: activeRoom?.userRole || 'member',
                isLocal: true,
                isMuted: localState.isMuted,
                isCameraOn: localState.isCameraOn,
                isScreenSharing: localState.isScreenSharing,
                isSpeaking: false,
                videoTrack: makeTrackObject(localVideoTrack),
                audioTrack: makeTrackObject(localAudioTrack),
                screenShareTrack: makeTrackObject(localScreenTrack),
            });
        }

        // 2. Add Remote Participants
        rawParticipantsRef.current.forEach(p => {
            if (p.userId === localUserId) return;

            const rState = remoteStatesRef.current.get(p.userId) || { isMuted: true, isCameraOn: false, isScreenSharing: false };
            const rTracks = remoteTracksRef.current.get(p.userId) || {};

            list.push({
                identity: p.userId,
                name: p.username,
                avatar: p.avatar,
                role: 'member',
                isLocal: false,
                isMuted: rState.isMuted,
                isCameraOn: rState.isCameraOn,
                isScreenSharing: rState.isScreenSharing,
                isSpeaking: false,
                videoTrack: makeTrackObject(rTracks.video),
                audioTrack: makeTrackObject(rTracks.audio),
                screenShareTrack: makeTrackObject(rTracks.screen),
            });
        });

        setParticipants(list);
    }, [user, activeRoom, localState]);

    // Enumerate devices
    const enumerateDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
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

    // Renegotiate all WebRTC connections (e.g. after adding screen share)
    const renegotiateAll = async () => {
        for (const [targetUserId, pc] of peerConnectionsRef.current.entries()) {
            try {
                const offer = await pc.createOffer();
                const prioritizedOffer = prioritizeVideoCodec(offer.sdp);
                await pc.setLocalDescription({ type: 'offer', sdp: prioritizedOffer });
                if (socket && activeRoom) {
                    socket.emit('voice:video-offer', {
                        roomName: activeRoom.roomName,
                        targetUserId,
                        sdp: prioritizedOffer
                    });
                }
            } catch (err) {
                console.error("Renegotiation failed for:", targetUserId, err);
            }
        }
    };

    // WebRTC connection builder
    const getOrCreatePC = useCallback((targetUserId, isOfferCreator) => {
        if (peerConnectionsRef.current.has(targetUserId)) {
            return peerConnectionsRef.current.get(targetUserId);
        }

        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionsRef.current.set(targetUserId, pc);

        // Add local camera/mic stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }
        // Add screen share tracks
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, screenStreamRef.current);
            });
        }

        // ICE candidate handler
        pc.onicecandidate = (event) => {
            if (event.candidate && socket && activeRoom) {
                socket.emit('voice:new-ice-candidate', {
                    roomName: activeRoom.roomName,
                    targetUserId,
                    candidate: event.candidate
                });
            }
        };

        // Incoming track handler
        pc.ontrack = (event) => {
            const stream = event.streams[0] || new MediaStream([event.track]);
            if (!remoteTracksRef.current.has(targetUserId)) {
                remoteTracksRef.current.set(targetUserId, {});
            }
            const tracks = remoteTracksRef.current.get(targetUserId);

            if (event.track.kind === 'audio') {
                tracks.audio = event.track;
            } else if (event.track.kind === 'video') {
                if (event.track.contentHint === 'text' || stream.id.includes('screen')) {
                    tracks.screen = event.track;
                } else {
                    tracks.video = event.track;
                }
            }

            updateParticipantList();
        };

        return pc;
    }, [socket, activeRoom, updateParticipantList]);

    // Handle joining room and configuring media
    const connectToChannel = useCallback(async (portalId, channelId) => {
        if (connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Connected) {
            return;
        }

        setConnectionState(ConnectionState.Connecting);
        setErrorMsg('');
        setChatMessages([]);
        setRoomStartTime(null);

        try {
            // Get local audio and video media
            let localStream;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    video: { width: 640, height: 480, frameRate: 24 }
                });
                localStreamRef.current = localStream;
                
                // Keep tracks disabled by default
                localStream.getAudioTracks().forEach(t => t.enabled = false);
                localStream.getVideoTracks().forEach(t => t.enabled = false);
            } catch (permErr) {
                console.warn("Could not get local media permissions:", permErr);
            }

            // Fetch Token details
            const response = await axios.post('/api/voice/token', { portalId, channelId });
            const { roomName, channelName, roomMode, userRole: returnRole, startedAt, serverNow } = response.data;

            if (startedAt && serverNow) {
                const localNow = Date.now();
                const offset = serverNow - localNow;
                setRoomStartTime(startedAt - offset);
            }

            // Join socket.io channel signaling
            if (socket) {
                socket.emit('voice:join', {
                    roomName,
                    userId: user?._id?.toString(),
                    username: user?.username || 'Unknown',
                    avatar: user?.profile?.avatar || '',
                });

                socket.emit('voice:state-update', {
                    roomName,
                    userId: user?._id?.toString(),
                    isMuted: true,
                    isCameraOn: false,
                    isScreenSharing: false
                });
            }

            setActiveRoom({ portalId, channelId, roomName, channelName, roomMode, userRole: returnRole });
            setConnectionState(ConnectionState.Connected);
            setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });

        } catch (err) {
            console.error('Failed to connect via WebRTC:', err);
            setErrorMsg(err.message || 'Bağlantı kurulamadı.');
            setConnectionState(ConnectionState.Disconnected);
        }
    }, [socket, user, connectionState]);

    const disconnectFromChannel = useCallback(async () => {
        // Stop local streams
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }

        // Close peer connections
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
        remoteTracksRef.current.clear();
        remoteStatesRef.current.clear();

        // Notify socket
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
    }, [socket, activeRoom, user]);

    // Handle WebSocket Signaling Events
    useEffect(() => {
        if (!socket || !activeRoom) return;

        const handleParticipants = async (data) => {
            if (activeRoom && data.startedAt) {
                if (data.serverNow) {
                    const localNow = Date.now();
                    const offset = data.serverNow - localNow;
                    setRoomStartTime(data.startedAt - offset);
                } else {
                    setRoomStartTime(data.startedAt);
                }
            }

            rawParticipantsRef.current = data.participants || [];
            
            // Initiate WebRTC offers to everyone already in the room
            rawParticipantsRef.current.forEach(async (p) => {
                const localUserId = user?._id?.toString();
                if (p.userId !== localUserId && !peerConnectionsRef.current.has(p.userId)) {
                    const pc = getOrCreatePC(p.userId, true);
                    try {
                        const offer = await pc.createOffer();
                        const prioritizedOffer = prioritizeVideoCodec(offer.sdp);
                        await pc.setLocalDescription({ type: 'offer', sdp: prioritizedOffer });
                        socket.emit('voice:video-offer', {
                            roomName: activeRoom.roomName,
                            targetUserId: p.userId,
                            sdp: prioritizedOffer
                        });
                    } catch (err) {
                        console.error("Failed to create offer for:", p.userId, err);
                    }
                }
            });

            updateParticipantList();
        };

        const handleUserJoined = (data) => {
            if (data.userId !== user?._id?.toString()) {
                playInteractionSound('join');
            }
        };

        const handleUserLeft = (data) => {
            if (data.userId !== user?._id?.toString()) {
                playInteractionSound('leave');
                
                // Cleanup connection
                if (peerConnectionsRef.current.has(data.userId)) {
                    peerConnectionsRef.current.get(data.userId).close();
                    peerConnectionsRef.current.delete(data.userId);
                }
                remoteTracksRef.current.delete(data.userId);
                remoteStatesRef.current.delete(data.userId);
                rawParticipantsRef.current = rawParticipantsRef.current.filter(p => p.userId !== data.userId);
                updateParticipantList();
            }
        };

        const handleVideoOffer = async ({ senderId, sdp }) => {
            const pc = getOrCreatePC(senderId, false);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
                const answer = await pc.createAnswer();
                const prioritizedAnswer = prioritizeVideoCodec(answer.sdp);
                await pc.setLocalDescription({ type: 'answer', sdp: prioritizedAnswer });
                socket.emit('voice:video-answer', {
                    roomName: activeRoom.roomName,
                    targetUserId: senderId,
                    sdp: prioritizedAnswer
                });
            } catch (err) {
                console.error("Error setting video offer from remote:", err);
            }
        };

        const handleVideoAnswer = async ({ senderId, sdp }) => {
            const pc = peerConnectionsRef.current.get(senderId);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
                } catch (err) {
                    console.error("Error setting video answer from remote:", err);
                }
            }
        };

        const handleNewIceCandidate = async ({ senderId, candidate }) => {
            const pc = peerConnectionsRef.current.get(senderId);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ice candidate:", err);
                }
            }
        };

        const handleStateUpdate = ({ userId, isMuted, isCameraOn, isScreenSharing }) => {
            remoteStatesRef.current.set(userId, { isMuted, isCameraOn, isScreenSharing });
            updateParticipantList();
        };

        socket.on('voice:participants', handleParticipants);
        socket.on('voice:user-joined', handleUserJoined);
        socket.on('voice:user-left', handleUserLeft);
        socket.on('voice:video-offer', handleVideoOffer);
        socket.on('voice:video-answer', handleVideoAnswer);
        socket.on('voice:new-ice-candidate', handleNewIceCandidate);
        socket.on('voice:state-update', handleStateUpdate);

        return () => {
            socket.off('voice:participants', handleParticipants);
            socket.off('voice:user-joined', handleUserJoined);
            socket.off('voice:user-left', handleUserLeft);
            socket.off('voice:video-offer', handleVideoOffer);
            socket.off('voice:video-answer', handleVideoAnswer);
            socket.off('voice:new-ice-candidate', handleNewIceCandidate);
            socket.off('voice:state-update', handleStateUpdate);
        };
    }, [socket, activeRoom, user, getOrCreatePC, playInteractionSound, updateParticipantList]);

    // Media toggle functions
    const toggleMicrophone = useCallback(async () => {
        if (!localStreamRef.current) return;
        const track = localStreamRef.current.getAudioTracks()[0];
        if (track) {
            const willMute = !localState.isMuted;
            track.enabled = !willMute;

            setLocalState(prev => {
                const next = { ...prev, isMuted: willMute };
                if (socket && activeRoom) {
                    socket.emit('voice:state-update', {
                        roomName: activeRoom.roomName,
                        userId: user?._id?.toString(),
                        isMuted: next.isMuted,
                        isCameraOn: next.isCameraOn,
                        isScreenSharing: next.isScreenSharing
                    });
                }
                return next;
            });
        }
    }, [localState, socket, activeRoom, user]);

    const toggleCamera = useCallback(async () => {
        if (!localStreamRef.current) return;
        const track = localStreamRef.current.getVideoTracks()[0];
        if (track) {
            const willCameraOn = !localState.isCameraOn;
            track.enabled = willCameraOn;

            setLocalState(prev => {
                const next = { ...prev, isCameraOn: willCameraOn };
                if (socket && activeRoom) {
                    socket.emit('voice:state-update', {
                        roomName: activeRoom.roomName,
                        userId: user?._id?.toString(),
                        isMuted: next.isMuted,
                        isCameraOn: next.isCameraOn,
                        isScreenSharing: next.isScreenSharing
                    });
                }
                return next;
            });
        }
    }, [localState, socket, activeRoom, user]);

    const toggleScreenShare = useCallback(async () => {
        if (localState.isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }

            peerConnectionsRef.current.forEach(pc => {
                const senders = pc.getSenders();
                senders.forEach(sender => {
                    if (sender.track && (sender.track.contentHint === 'text' || sender.track.label.includes('screen'))) {
                        pc.removeTrack(sender);
                    }
                });
            });

            setLocalState(prev => {
                const next = { ...prev, isScreenSharing: false };
                if (socket && activeRoom) {
                    socket.emit('voice:state-update', {
                        roomName: activeRoom.roomName,
                        userId: user?._id?.toString(),
                        isMuted: next.isMuted,
                        isCameraOn: next.isCameraOn,
                        isScreenSharing: false
                    });
                }
                return next;
            });
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: 60 },
                    audio: true
                });
                screenStreamRef.current = screenStream;
                const videoTrack = screenStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.contentHint = 'text';

                    // Add screen share tracks to all active peer connections
                    peerConnectionsRef.current.forEach(pc => {
                        pc.addTrack(videoTrack, screenStream);
                    });

                    renegotiateAll();

                    videoTrack.onended = () => {
                        toggleScreenShare();
                    };
                }

                setLocalState(prev => {
                    const next = { ...prev, isScreenSharing: true };
                    if (socket && activeRoom) {
                        socket.emit('voice:state-update', {
                            roomName: activeRoom.roomName,
                            userId: user?._id?.toString(),
                            isMuted: next.isMuted,
                            isCameraOn: next.isCameraOn,
                            isScreenSharing: true
                        });
                    }
                    return next;
                });
            } catch (err) {
                console.warn("Screen sharing failed:", err);
            }
        }
    }, [localState, socket, activeRoom, user]);

    const toggleDeafen = useCallback(() => {
        setLocalState(prev => ({ ...prev, isDeafened: !prev.isDeafened }));
    }, []);

    const toggleFacingMode = useCallback(async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        // Under WebRTC connection renegotiation is not needed for camera swap if track is replaced
    }, [facingMode]);

    const setAudioOutput = useCallback(async (deviceId) => {
        setSelectedAudioOutput(deviceId);
    }, []);

    const setAudioInput = useCallback(async (deviceId) => {
        setSelectedAudioInput(deviceId);
    }, []);

    const setVideoInput = useCallback(async (deviceId) => {
        setSelectedVideoInput(deviceId);
    }, []);

    // Chat messaging
    const sendChatMessage = useCallback(async (text) => {
        if (!text.trim() || !socket || !activeRoom) return;

        // Since we are not using LiveKit's publishData, we can use socket.io to send chat messages
        socket.emit('voice:chat-message', {
            roomName: activeRoom.roomName,
            text,
            senderName: user?.profile?.displayName || user?.username || 'Sen',
            senderId: user?._id?.toString(),
        });

        setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            senderName: user?.profile?.displayName || user?.username || 'Sen',
            senderId: user?._id?.toString(),
            text,
            timestamp: new Date().toISOString(),
            isLocal: true
        }]);
        playInteractionSound('message');
    }, [socket, activeRoom, user, playInteractionSound]);

    // Handle incoming chat messages via socket
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (msgObj) => {
            if (msgObj.senderId !== user?._id?.toString()) {
                setChatMessages(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    senderName: msgObj.senderName,
                    senderId: msgObj.senderId,
                    text: msgObj.text,
                    timestamp: new Date().toISOString(),
                    isLocal: false
                }]);
                playInteractionSound('message');
            }
        };

        socket.on('voice:chat-message', handleChatMessage);
        return () => {
            socket.off('voice:chat-message', handleChatMessage);
        };
    }, [socket, user, playInteractionSound]);

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

    // Trigger update on state change
    useEffect(() => {
        updateParticipantList();
    }, [localState, updateParticipantList]);

    const value = {
        room: { localParticipant: { identity: user?._id?.toString() } },
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
                <AudioTrackPlayer key={`global-audio-${p.identity}`} track={p.audioTrack.track} muted={isDeafened} />
            ))}
        </div>
    );
};

const AudioTrackPlayer = ({ track, muted }) => {
    const audioEl = useRef(null);
    useEffect(() => {
        if (audioEl.current && track) {
            audioEl.current.srcObject = new MediaStream([track]);
        }
        return () => {
            if (audioEl.current) audioEl.current.srcObject = null;
        };
    }, [track]);

    useEffect(() => {
        if (audioEl.current) {
            audioEl.current.muted = muted;
        }
    }, [muted]);

    return <audio ref={audioEl} autoPlay />;
};
