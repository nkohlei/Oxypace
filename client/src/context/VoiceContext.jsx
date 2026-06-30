import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { registerPlugin, Capacitor } from '@capacitor/core';

const CallManager = registerPlugin('CallManager');

const VoiceContext = createContext();

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) throw new Error('useVoice must be used within VoiceProvider');
    return context;
};

// WebRTC ICE configuration (STUN + free public TURN servers for mobile carrier NAT traversal)
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    }
];

// Helper to create a 1fps, 16x16 black canvas video track as placeholder
const createPlaceholderVideoTrack = () => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 16, 16);
        }
        const stream = canvas.captureStream(1); // 1 Frame Per Second
        const track = stream.getVideoTracks()[0];
        if (track) {
            track.enabled = true;
            track.isPlaceholder = true; // Mark as placeholder
            return track;
        }
    } catch (e) {
        console.error("[WebRTC] Failed to create placeholder video track:", e);
    }
    return null;
};

// Helper to prioritize universally supported H264/VP8 codecs in SDP (prevents black screens/decoding issues on mobile WebViews)
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
        .filter(c => c.name === 'H264' || c.name === 'VP8')
        .sort((a, b) => {
            if (a.name === 'H264') return -1;
            if (b.name === 'H264') return 1;
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

    // Watch Party State
    const [watchParty, setWatchParty] = useState(null);

    // WebRTC connection references
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // userId -> RTCPeerConnection
    const remoteTracksRef = useRef(new Map()); // userId -> { audio: Track, video: Track, screen: Track }
    const remoteStatesRef = useRef(new Map()); // userId -> { isMuted, isCameraOn, isScreenSharing }
    const rawParticipantsRef = useRef([]); // list of current participants in socket room
    
    // ICE candidate queue to prevent early candidate addition error before setRemoteDescription completes
    const candidateQueuesRef = useRef(new Map()); // userId -> [RTCIceCandidate]

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

    // Safe Socket Emit with try-catch and connection checks
    const safeEmit = useCallback((eventName, data) => {
        if (socket && socket.connected) {
            try {
                socket.emit(eventName, data);
            } catch (err) {
                console.error(`[WebRTC Socket error] Failed to emit ${eventName}:`, err);
            }
        } else {
            console.warn(`[WebRTC Socket warning] Socket not connected or missing. Postponed ${eventName}`);
        }
    }, [socket]);

    // Create custom wrapper for tracks to expose attach/detach functions for UI compatibility
    const makeTrackObject = (track) => {
        if (!track) return null;
        return {
            track,
            attach: (el) => {
                if (el) {
                    el.srcObject = new MediaStream([track]);
                    el.autoplay = true;
                    el.playsInline = true;
                    if (track.kind === 'video') {
                        el.muted = true; // Video elements are only for visual rendering, audio is handled by GlobalAudioRenderer
                    }
                    el.play().catch(e => console.warn("[WebRTC] Autoplay prevented on element, but it is muted:", e));
                    console.log(`[WebRTC] Attached track ${track.id} to element. Autoplay: ${el.autoplay}, playsInline: ${el.playsInline}, muted: ${el.muted}`);
                }
            },
            detach: (el) => {
                if (el) {
                    el.srcObject = null;
                    console.log(`[WebRTC] Detached track ${track.id} from element`);
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

            // Camera/Avatar card
            list.push({
                identity: localUserId,
                name: user?.profile?.displayName || user?.username || 'Sen',
                avatar: user?.profile?.avatar || '',
                role: activeRoom?.userRole || 'member',
                isLocal: true,
                isMuted: localState.isMuted,
                isCameraOn: localState.isCameraOn,
                isScreenSharing: false,
                isSpeaking: false,
                videoTrack: makeTrackObject(localVideoTrack),
                audioTrack: makeTrackObject(localAudioTrack),
                screenShareTrack: null,
            });

            // Independent screenshare card
            if (localState.isScreenSharing && localScreenTrack) {
                list.push({
                    identity: `${localUserId}-screen`,
                    name: `${user?.profile?.displayName || user?.username || 'Sen'} (Ekran)`,
                    avatar: user?.profile?.avatar || '',
                    role: activeRoom?.userRole || 'member',
                    isLocal: true,
                    isMuted: true,
                    isCameraOn: true,
                    isScreenSharing: true,
                    isSpeaking: false,
                    videoTrack: null,
                    audioTrack: null,
                    screenShareTrack: makeTrackObject(localScreenTrack),
                });
            }
        }

        // 2. Add Remote Participants
        rawParticipantsRef.current.forEach(p => {
            if (p.userId === localUserId) return;

            const rState = remoteStatesRef.current.get(p.userId) || { isMuted: true, isCameraOn: false, isScreenSharing: false };
            const rTracks = remoteTracksRef.current.get(p.userId) || {};

            // Camera/Avatar card
            list.push({
                identity: p.userId,
                name: p.username,
                avatar: p.avatar,
                role: 'member',
                isLocal: false,
                isMuted: rState.isMuted,
                isCameraOn: rState.isCameraOn,
                isScreenSharing: false,
                isSpeaking: false,
                videoTrack: makeTrackObject(rTracks.video),
                audioTrack: makeTrackObject(rTracks.audio),
                screenShareTrack: null,
            });

            // Independent screenshare card
            if (rState.isScreenSharing && rTracks.screen) {
                list.push({
                    identity: `${p.userId}-screen`,
                    name: `${p.username} (Ekran)`,
                    avatar: p.avatar,
                    role: 'member',
                    isLocal: false,
                    isMuted: true,
                    isCameraOn: true,
                    isScreenSharing: true,
                    isSpeaking: false,
                    videoTrack: null,
                    audioTrack: null,
                    screenShareTrack: makeTrackObject(rTracks.screen),
                });
            }
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
    const renegotiateAll = useCallback(async () => {
        for (const [targetUserId, pc] of peerConnectionsRef.current.entries()) {
            try {
                console.log(`[WebRTC] Starting renegotiation for peer ${targetUserId}`);
                const offer = await pc.createOffer();
                const prioritizedOffer = prioritizeVideoCodec(offer.sdp);
                await pc.setLocalDescription({ type: 'offer', sdp: prioritizedOffer });
                if (activeRoom) {
                    safeEmit('voice:video-offer', {
                        roomName: activeRoom.roomName,
                        targetUserId,
                        sdp: prioritizedOffer
                    });
                    console.log(`[Socket] video-offer gönderildi to ${targetUserId}`);
                }
            } catch (err) {
                console.error("Renegotiation failed for:", targetUserId, err);
            }
        }
    }, [activeRoom, safeEmit]);

    // Helper to process queued candidates for a peer
    const processQueuedCandidates = async (userId, pc) => {
        const queue = candidateQueuesRef.current.get(userId);
        if (queue && queue.length > 0) {
            console.log(`[WebRTC] Processing ${queue.length} queued ICE candidates for ${userId}`);
            while (queue.length > 0) {
                const candidate = queue.shift();
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error(`[WebRTC] Error adding queued ice candidate for ${userId}:`, err);
                }
            }
        }
    };

    // WebRTC connection builder
    const getOrCreatePC = useCallback((targetUserId, isOfferCreator) => {
        if (peerConnectionsRef.current.has(targetUserId)) {
            return peerConnectionsRef.current.get(targetUserId);
        }

        console.log(`[WebRTC] Creating new RTCPeerConnection for user ${targetUserId}. IsOfferCreator: ${isOfferCreator}`);
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionsRef.current.set(targetUserId, pc);

        // Add local camera/mic stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                const sender = pc.addTrack(track, localStreamRef.current);
                console.log(`[WebRTC] Added local track ${track.kind} (${track.id}) to peer connection for ${targetUserId}`);
            });
        }

        // Add local screen share track if currently screen sharing
        if (localState.isScreenSharing && screenStreamRef.current) {
            const screenTrack = screenStreamRef.current.getVideoTracks()[0];
            if (screenTrack) {
                pc.addTrack(screenTrack, screenStreamRef.current);
                console.log(`[WebRTC] Added independent screen track to peer connection for ${targetUserId}`);
            }
        }

        // Bind onnegotiationneeded to trigger renegotiation automatically
        pc.onnegotiationneeded = async () => {
            try {
                // To avoid glare/collision on initial track addition, only the designated offer creator
                // initiates offers unless the connection is already stable and we are explicitly renegotiating.
                if (pc.signalingState !== 'stable') {
                    console.log(`[WebRTC] onnegotiationneeded ignored because signalingState is ${pc.signalingState}`);
                    return;
                }
                if (!isOfferCreator) {
                    console.log(`[WebRTC] onnegotiationneeded ignored for non-offer creator ${targetUserId}`);
                    return;
                }
                console.log(`[WebRTC] onnegotiationneeded triggered for user ${targetUserId}`);
                const offer = await pc.createOffer();
                const prioritizedOffer = prioritizeVideoCodec(offer.sdp);
                await pc.setLocalDescription({ type: 'offer', sdp: prioritizedOffer });
                if (activeRoom) {
                    safeEmit('voice:video-offer', {
                        roomName: activeRoom.roomName,
                        targetUserId,
                        sdp: prioritizedOffer
                    });
                    console.log(`[Socket] renegotiation video-offer sent to ${targetUserId}`);
                }
            } catch (err) {
                console.error(`[WebRTC] Negotiation offer generation failed for user ${targetUserId}:`, err);
            }
        };

        // Monitor ICE Connection State Changes
        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC Log] ICE Connection State değişti for ${targetUserId}: ${pc.iceConnectionState}`);
        };

        // ICE candidate handler
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC Log] onicecandidate event triggered for user ${targetUserId}: candidate gathered`);
                if (activeRoom) {
                    safeEmit('voice:new-ice-candidate', {
                        roomName: activeRoom.roomName,
                        targetUserId,
                        candidate: event.candidate
                    });
                }
            } else {
                console.log(`[WebRTC Log] onicecandidate gathering completed for user ${targetUserId}`);
            }
        };

        // Incoming track handler
        pc.ontrack = (event) => {
            const stream = event.streams[0] || new MediaStream([event.track]);
            console.log(`[WebRTC] Received remote track ${event.track.kind} (${event.track.id}) from ${targetUserId}`);
            
            if (!remoteTracksRef.current.has(targetUserId)) {
                remoteTracksRef.current.set(targetUserId, {});
            }
            const tracks = remoteTracksRef.current.get(targetUserId);

            if (event.track.kind === 'audio') {
                tracks.audio = event.track;
            } else if (event.track.kind === 'video') {
                // Determine if screenshare: check content hint, stream ID string, track ID difference, or custom stream ID mismatch
                const isScreen = event.track.contentHint === 'text' || 
                                 stream.id.includes('screen') || 
                                 (tracks.video && tracks.video.id !== event.track.id) ||
                                 (tracks.camStreamId && stream.id !== tracks.camStreamId);

                if (isScreen) {
                    tracks.screen = event.track;
                    console.log(`[WebRTC] remote screenShareTrack set for user ${targetUserId} (track ID: ${event.track.id})`);
                } else {
                    if (!tracks.camStreamId) {
                        tracks.camStreamId = stream.id;
                    }
                    tracks.video = event.track;
                    console.log(`[WebRTC] remote videoTrack set for user ${targetUserId} (track ID: ${event.track.id})`);
                }
            }

            updateParticipantList();
        };

        return pc;
    }, [activeRoom, updateParticipantList, safeEmit, localState]);

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
            // Get local audio media (camera/video stream will be requested dynamically when activated)
            let localStream;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                });
                localStreamRef.current = localStream;
                console.log('[WebRTC Log] getUserMedia Success (Audio Only)');
                console.log('[WebRTC] Yerel ses akışı (Local Audio Stream) başarıyla alındı', localStream);
                
                // Keep tracks disabled by default
                localStream.getAudioTracks().forEach(t => t.enabled = false);
            } catch (permErr) {
                console.error('[WebRTC Log] getUserMedia Error:', permErr);
                console.warn("Could not get local media permissions:", permErr);
                
                // If audio permission fails, create an empty MediaStream
                localStream = new MediaStream();
                localStreamRef.current = localStream;
            }

            // Always add a placeholder video track to ensure the video transceiver/channel is pre-negotiated at join.
            const placeholderTrack = createPlaceholderVideoTrack();
            if (placeholderTrack) {
                localStream.addTrack(placeholderTrack);
                console.log('[WebRTC] Placeholder video track added to localStream');
            }

            // Fetch Token details
            const response = await axios.post('/api/voice/token', { portalId, channelId });
            const { roomName, channelName, roomMode, userRole: returnRole, startedAt, serverNow } = response.data;

            if (startedAt && serverNow) {
                const localNow = Date.now();
                const offset = serverNow - localNow;
                setRoomStartTime(startedAt - offset);
            }

            console.log(`[Socket] Joining signaling room: ${roomName} as user: ${user?._id}`);
            // Join socket.io channel signaling
            safeEmit('voice:join', {
                roomName,
                userId: user?._id?.toString(),
                username: user?.username || 'Unknown',
                avatar: user?.profile?.avatar || '',
            });

            safeEmit('voice:state-update', {
                roomName,
                userId: user?._id?.toString(),
                isMuted: true,
                isCameraOn: false,
                isScreenSharing: false
            });

            setActiveRoom({ portalId, channelId, roomName, channelName, roomMode, userRole: returnRole });
            setConnectionState(ConnectionState.Connected);
            setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });

            if (Capacitor.isNativePlatform()) {
                const joinRoute = `/portal/${portalId}?channel=${channelId}&joinVoice=true`;
                CallManager.setInCall({
                    isInCall: true,
                    channelName: channelName || 'Görüntülü Sohbet',
                    route: joinRoute
                }).catch(err => console.warn(err));
            }

        } catch (err) {
            console.error('Failed to connect via WebRTC:', err);
            setErrorMsg(err.message || 'Bağlantı kurulamadı.');
            setConnectionState(ConnectionState.Disconnected);
        }
    }, [user, connectionState, safeEmit]);

    const disconnectFromChannel = useCallback(async () => {
        console.log("[WebRTC] Disconnecting from channel...");
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
        candidateQueuesRef.current.clear();

        // Notify socket
        if (activeRoom) {
            safeEmit('voice:leave', {
                roomName: activeRoom.roomName,
                userId: user?._id?.toString()
            });
        }

        setActiveRoom(null);
        setParticipants([]);
        setChatMessages([]);
        setPinnedParticipant(null);
        setActiveRoom(null);
        setConnectionState(ConnectionState.Disconnected);

        if (Capacitor.isNativePlatform()) {
            CallManager.setInCall({ isInCall: false }).catch(err => console.warn(err));
        }
    }, [activeRoom, user, safeEmit]);

    // Handle WebSocket Signaling Events
    useEffect(() => {
        if (!socket || !activeRoom) return;

        const handleParticipants = async (data) => {
            console.log(`[Socket] Received voice:participants. Count: ${data.participants?.length}`);
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
            
            if (data.watchParty) {
                const wp = { ...data.watchParty };
                if (wp.isPlaying && wp.lastUpdated) {
                    const elapsed = (Date.now() - wp.lastUpdated) / 1000;
                    wp.currentTime += elapsed;
                }
                setWatchParty(wp);
            } else {
                setWatchParty(null);
            }
            
            // Map initial states for remote users
            rawParticipantsRef.current.forEach(p => {
                if (p.userId !== user?._id?.toString()) {
                    remoteStatesRef.current.set(p.userId, {
                        isMuted: p.isMuted !== false,
                        isCameraOn: !!p.isCameraOn,
                        isScreenSharing: !!p.isScreenSharing
                    });
                }
            });
            
            // Initiate WebRTC offers deterministically to prevent glare collisions
            rawParticipantsRef.current.forEach(async (p) => {
                const localUserId = user?._id?.toString();
                if (p.userId !== localUserId && !peerConnectionsRef.current.has(p.userId)) {
                    const isOfferCreator = localUserId.localeCompare(p.userId) < 0;
                    if (isOfferCreator) {
                        const pc = getOrCreatePC(p.userId, true);
                        try {
                            console.log(`[WebRTC] Creating and sending offer to existing user ${p.userId}`);
                            const offer = await pc.createOffer();
                            const prioritizedOffer = prioritizeVideoCodec(offer.sdp);
                            await pc.setLocalDescription({ type: 'offer', sdp: prioritizedOffer });
                            safeEmit('voice:video-offer', {
                                roomName: activeRoom.roomName,
                                targetUserId: p.userId,
                                sdp: prioritizedOffer
                            });
                            console.log(`[Socket] video-offer gönderildi to user ${p.userId}`);
                        } catch (err) {
                            console.error("Failed to create offer for:", p.userId, err);
                        }
                    } else {
                        getOrCreatePC(p.userId, false);
                        console.log(`[WebRTC] Prepared peer connection as answerer for user ${p.userId}, waiting for offer.`);
                    }
                }
            });

            updateParticipantList();
        };

        const handleUserJoined = (data) => {
            console.log(`[Socket] voice:user-joined: ${data.username} (${data.userId})`);
            if (data.userId !== user?._id?.toString()) {
                playInteractionSound('join');
            }
        };

        const handleUserLeft = (data) => {
            console.log(`[Socket] voice:user-left: (${data.userId})`);
            if (data.userId !== user?._id?.toString()) {
                playInteractionSound('leave');
                
                // Cleanup connection
                if (peerConnectionsRef.current.has(data.userId)) {
                    peerConnectionsRef.current.get(data.userId).close();
                    peerConnectionsRef.current.delete(data.userId);
                }
                remoteTracksRef.current.delete(data.userId);
                remoteStatesRef.current.delete(data.userId);
                candidateQueuesRef.current.delete(data.userId);
                rawParticipantsRef.current = rawParticipantsRef.current.filter(p => p.userId !== data.userId);
                updateParticipantList();
            }
        };

        const handleVideoOffer = async ({ senderId, sdp }) => {
            console.log(`[Socket] video-offer alındı from user: ${senderId}`);
            const pc = getOrCreatePC(senderId, false);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
                console.log(`[WebRTC] setRemoteDescription completed for offer from ${senderId}`);
                
                // Process any ICE candidates that arrived early
                await processQueuedCandidates(senderId, pc);

                const answer = await pc.createAnswer();
                const prioritizedAnswer = prioritizeVideoCodec(answer.sdp);
                await pc.setLocalDescription({ type: 'answer', sdp: prioritizedAnswer });
                safeEmit('voice:video-answer', {
                    roomName: activeRoom.roomName,
                    targetUserId: senderId,
                    sdp: prioritizedAnswer
                });
                console.log(`[Socket] video-answer gönderildi to ${senderId}`);
            } catch (err) {
                console.error("Error setting video offer from remote:", err);
            }
        };

        const handleVideoAnswer = async ({ senderId, sdp }) => {
            console.log(`[Socket] video-answer alındı from user: ${senderId}`);
            const pc = peerConnectionsRef.current.get(senderId);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
                    console.log(`[WebRTC] Successfully set remote answer for peer ${senderId}`);
                    
                    // Process any ICE candidates that arrived early
                    await processQueuedCandidates(senderId, pc);
                } catch (err) {
                    console.error("Error setting video answer from remote:", err);
                }
            }
        };

        const handleNewIceCandidate = async ({ senderId, candidate }) => {
            console.log(`[Socket] new-ice-candidate received from user: ${senderId}`);
            // If peer connection doesn't exist yet (e.g. ICE candidates arrived before the offer),
            // prepare the peer connection as answerer so we don't drop candidates.
            const pc = getOrCreatePC(senderId, false);
            if (pc) {
                try {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log(`[WebRTC] Added ICE candidate immediately for user ${senderId}`);
                    } else {
                        if (!candidateQueuesRef.current.has(senderId)) {
                            candidateQueuesRef.current.set(senderId, []);
                        }
                        candidateQueuesRef.current.get(senderId).push(candidate);
                        console.log(`[WebRTC] Queued ICE candidate for user ${senderId} (remoteDescription is not yet set)`);
                    }
                } catch (err) {
                    console.error("Error adding ice candidate:", err);
                }
            }
        };

        const handleStateUpdate = ({ userId, isMuted, isCameraOn, isScreenSharing }) => {
            console.log(`[Socket] voice:state-update received for user ${userId}: Mute=${isMuted}, Camera=${isCameraOn}, Screen=${isScreenSharing}`);
            remoteStatesRef.current.set(userId, { isMuted, isCameraOn, isScreenSharing });
            updateParticipantList();
        };

        const handleWatchState = (wp) => {
            if (wp && wp.url) {
                const updatedWp = { ...wp };
                if (updatedWp.isPlaying && updatedWp.lastUpdated) {
                    const elapsed = (Date.now() - updatedWp.lastUpdated) / 1000;
                    updatedWp.currentTime += elapsed;
                }
                setWatchParty(updatedWp);
            } else {
                setWatchParty(null);
            }
        };

        const handleWatchPlay = ({ time }) => {
            setWatchParty(prev => prev ? { ...prev, isPlaying: true, currentTime: time, lastUpdated: Date.now() } : null);
        };

        const handleWatchPause = ({ time }) => {
            setWatchParty(prev => prev ? { ...prev, isPlaying: false, currentTime: time, lastUpdated: Date.now() } : null);
        };

        const handleWatchSeek = ({ time }) => {
            setWatchParty(prev => prev ? { ...prev, currentTime: time, lastUpdated: Date.now() } : null);
        };

        const handleWatchStop = () => {
            setWatchParty(null);
        };

        socket.on('voice:participants', handleParticipants);
        socket.on('voice:user-joined', handleUserJoined);
        socket.on('voice:user-left', handleUserLeft);
        socket.on('voice:video-offer', handleVideoOffer);
        socket.on('voice:video-answer', handleVideoAnswer);
        socket.on('voice:new-ice-candidate', handleNewIceCandidate);
        socket.on('voice:state-update', handleStateUpdate);
        socket.on('voice:watch-state', handleWatchState);
        socket.on('voice:watch-play', handleWatchPlay);
        socket.on('voice:watch-pause', handleWatchPause);
        socket.on('voice:watch-seek', handleWatchSeek);
        socket.on('voice:watch-stop', handleWatchStop);

        return () => {
            socket.off('voice:participants', handleParticipants);
            socket.off('voice:user-joined', handleUserJoined);
            socket.off('voice:user-left', handleUserLeft);
            socket.off('voice:video-offer', handleVideoOffer);
            socket.off('voice:video-answer', handleVideoAnswer);
            socket.off('voice:new-ice-candidate', handleNewIceCandidate);
            socket.off('voice:state-update', handleStateUpdate);
            socket.off('voice:watch-state', handleWatchState);
            socket.off('voice:watch-play', handleWatchPlay);
            socket.off('voice:watch-pause', handleWatchPause);
            socket.off('voice:watch-seek', handleWatchSeek);
            socket.off('voice:watch-stop', handleWatchStop);
        };
    }, [socket, activeRoom, user, getOrCreatePC, playInteractionSound, updateParticipantList, safeEmit]);

    // Reconnection listener to recover signalling state automatically
    useEffect(() => {
        if (!socket) return;
        const handleConnect = () => {
            if (activeRoom) {
                console.log("[WebRTC Reconnect] Restoring voice channel session:", activeRoom.roomName);
                safeEmit('voice:join', {
                    roomName: activeRoom.roomName,
                    userId: user?._id?.toString(),
                    username: user?.username || 'Unknown',
                    avatar: user?.profile?.avatar || '',
                });
                safeEmit('voice:state-update', {
                    roomName: activeRoom.roomName,
                    userId: user?._id?.toString(),
                    isMuted: localState.isMuted,
                    isCameraOn: localState.isCameraOn,
                    isScreenSharing: localState.isScreenSharing
                });
            }
        };
        socket.on('connect', handleConnect);
        return () => {
            socket.off('connect', handleConnect);
        };
    }, [socket, activeRoom, user, localState, safeEmit]);

    // Media toggle functions
    const toggleMicrophone = useCallback(async () => {
        if (!localStreamRef.current) return;
        const track = localStreamRef.current.getAudioTracks()[0];
        if (track) {
            const willMute = !localState.isMuted;
            track.enabled = !willMute;

            setLocalState(prev => {
                const next = { ...prev, isMuted: willMute };
                if (activeRoom) {
                    safeEmit('voice:state-update', {
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
    }, [localState, activeRoom, user, safeEmit]);

    const toggleCamera = useCallback(async () => {
        if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
        }
        
        // Find the active camera track (any video track that is not the placeholder)
        let cameraTrack = localStreamRef.current.getVideoTracks().find(t => !t.isPlaceholder);
        const willCameraOn = !localState.isCameraOn;

        if (willCameraOn) {
            if (!cameraTrack) {
                try {
                    console.log("[WebRTC] Requesting local camera stream...");
                    const videoStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 640, height: 480, frameRate: 24 }
                    });
                    const videoTrack = videoStream.getVideoTracks()[0];
                    if (videoTrack) {
                        localStreamRef.current.addTrack(videoTrack);
                        cameraTrack = videoTrack;
                    }
                } catch (err) {
                    console.error('Failed to start camera dynamically:', err);
                    return;
                }
            }

            if (cameraTrack) {
                cameraTrack.enabled = true;
                
                // Remove the placeholder track from the local stream
                const placeholder = localStreamRef.current.getVideoTracks().find(t => t.isPlaceholder);
                if (placeholder) {
                    placeholder.stop();
                    localStreamRef.current.removeTrack(placeholder);
                }

                // Swap placeholder track with real camera track on all active peer connections
                peerConnectionsRef.current.forEach(pc => {
                    const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                    const videoSender = videoTransceiver ? videoTransceiver.sender : null;
                    if (videoSender) {
                        videoSender.replaceTrack(cameraTrack).catch(e => {
                            console.warn("[WebRTC] replaceTrack error (ON):", e);
                        });
                    }
                });
            }
        } else {
            // Turning camera OFF
            if (cameraTrack) {
                cameraTrack.enabled = false;
                cameraTrack.stop(); // Stops the camera light
                localStreamRef.current.removeTrack(cameraTrack);
            }

            // Create a new placeholder track
            const placeholderTrack = createPlaceholderVideoTrack();
            if (placeholderTrack) {
                localStreamRef.current.addTrack(placeholderTrack);
                
                // Swap camera track with placeholder track on all active peer connections
                peerConnectionsRef.current.forEach(pc => {
                    const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                    const videoSender = videoTransceiver ? videoTransceiver.sender : null;
                    if (videoSender) {
                        videoSender.replaceTrack(placeholderTrack).catch(e => {
                            console.warn("[WebRTC] replaceTrack error (OFF):", e);
                        });
                    }
                });
            }
        }

        setLocalState(prev => {
            const next = { ...prev, isCameraOn: willCameraOn };
            if (activeRoom) {
                safeEmit('voice:state-update', {
                    roomName: activeRoom.roomName,
                    userId: user?._id?.toString(),
                    isMuted: next.isMuted,
                    isCameraOn: next.isCameraOn,
                    isScreenSharing: next.isScreenSharing
                });
            }
            return next;
        });
    }, [localState, activeRoom, user, safeEmit]);

    const stopScreenShareAndRevert = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }

        const localCamVideoTrack = localStreamRef.current?.getVideoTracks()[0];

        peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const screenSender = senders.find(s => s.track && s.track.kind === 'video' && s.track !== localCamVideoTrack);
            if (screenSender) {
                pc.removeTrack(screenSender);
                console.log(`[WebRTC] Removed independent screen track from peer connection`);
            }
        });

        renegotiateAll();

        setLocalState(prev => {
            const next = { ...prev, isScreenSharing: false };
            if (activeRoom) {
                safeEmit('voice:state-update', {
                    roomName: activeRoom.roomName,
                    userId: user?._id?.toString(),
                    isMuted: next.isMuted,
                    isCameraOn: next.isCameraOn,
                    isScreenSharing: false
                });
            }
            return next;
        });
    }, [activeRoom, user, safeEmit, renegotiateAll]);

    const toggleScreenShare = useCallback(async () => {
        if (localState.isScreenSharing) {
            stopScreenShareAndRevert();
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

                    peerConnectionsRef.current.forEach(pc => {
                        pc.addTrack(videoTrack, screenStream);
                        console.log(`[WebRTC] Added independent screen track to peer connection`);
                    });

                    renegotiateAll();

                    videoTrack.onended = () => {
                        stopScreenShareAndRevert();
                    };
                }

                setLocalState(prev => {
                    const next = { ...prev, isScreenSharing: true };
                    if (activeRoom) {
                        safeEmit('voice:state-update', {
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
    }, [localState, activeRoom, user, safeEmit, stopScreenShareAndRevert, renegotiateAll]);

    const toggleDeafen = useCallback(() => {
        setLocalState(prev => ({ ...prev, isDeafened: !prev.isDeafened }));
    }, []);

    const toggleFacingMode = useCallback(async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
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
        if (!text.trim() || !activeRoom) return;

        safeEmit('voice:chat-message', {
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
    }, [activeRoom, user, playInteractionSound, safeEmit]);

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

    const startWatchParty = useCallback((url) => {
        if (activeRoom) {
            safeEmit('voice:watch-start', { roomName: activeRoom.roomName, url });
        }
    }, [activeRoom, safeEmit]);

    const stopWatchParty = useCallback(() => {
        if (activeRoom) {
            safeEmit('voice:watch-stop', { roomName: activeRoom.roomName });
        }
    }, [activeRoom, safeEmit]);

    const sendWatchPlay = useCallback((time) => {
        if (activeRoom) {
            safeEmit('voice:watch-play', { roomName: activeRoom.roomName, time });
            setWatchParty(prev => prev ? { ...prev, isPlaying: true, currentTime: time, lastUpdated: Date.now() } : null);
        }
    }, [activeRoom, safeEmit]);

    const sendWatchPause = useCallback((time) => {
        if (activeRoom) {
            safeEmit('voice:watch-pause', { roomName: activeRoom.roomName, time });
            setWatchParty(prev => prev ? { ...prev, isPlaying: false, currentTime: time, lastUpdated: Date.now() } : null);
        }
    }, [activeRoom, safeEmit]);

    const sendWatchSeek = useCallback((time) => {
        if (activeRoom) {
            safeEmit('voice:watch-seek', { roomName: activeRoom.roomName, time });
            setWatchParty(prev => prev ? { ...prev, currentTime: time, lastUpdated: Date.now() } : null);
        }
    }, [activeRoom, safeEmit]);

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
        selectedVideoInput,
        watchParty,
        startWatchParty,
        stopWatchParty,
        sendWatchPlay,
        sendWatchPause,
        sendWatchSeek
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
        <div style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
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

    return <audio ref={audioEl} autoPlay playsInline />;
};
