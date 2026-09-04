import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
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
    const activeRoomRef = useRef(null); // Ref to always hold latest activeRoom (avoids stale closures in WebRTC callbacks)
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

    const [roomStartTime, setRoomStartTime] = useState(null);
    const [roomDuration, setRoomDuration] = useState(0);

    // Ref to roomStartTime so connectToChannel closure always reads the latest value
    const roomStartTimeRef = useRef(null);
    const _setRoomStartTime = (val) => {
        roomStartTimeRef.current = val;
        setRoomStartTime(val);
    };

    // Helper to keep activeRoomRef and activeRoom state in sync
    const _setActiveRoom = (val) => {
        activeRoomRef.current = val;
        setActiveRoom(val);
    };

    useEffect(() => {
        if (!roomStartTime) {
            setRoomDuration(0);
            return;
        }
        const update = () => {
            const diff = Math.floor((Date.now() - roomStartTime) / 1000);
            setRoomDuration(diff >= 0 ? diff : 0);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [roomStartTime]);

    // Chat states
    const [chatMessages, setChatMessages] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isChatOpen) {
            setUnreadCount(0);
        }
    }, [isChatOpen]);

    // Watch Party State
    const [watchParty, setWatchParty] = useState(null);

    const [userVolume, setUserVolume] = useState(() => {
        const saved = localStorage.getItem('voiceUserVolume');
        return saved !== null ? parseFloat(saved) : 1.0;
    });

    useEffect(() => {
        localStorage.setItem('voiceUserVolume', userVolume.toString());
    }, [userVolume]);

    // Prompt "Siteden çıkılsın mı?" browser confirmation modal if user attempts to close tab/window or reload during active live room call
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            const isLiveCallActive = activeRoomRef.current || activeRoom || connectionState === ConnectionState.Connected || connectionState === ConnectionState.Connecting;
            if (isLiveCallActive) {
                e.preventDefault();
                e.returnValue = ''; // Triggers Chrome/Edge/Safari/Firefox native "Siteden çıkılsın mı?" confirmation modal
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeRoom, connectionState]);

    // WebRTC connection references
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // userId -> RTCPeerConnection
    const remoteTracksRef = useRef(new Map()); // userId -> { audio: Track, video: Track, screen: Track }
    const remoteStatesRef = useRef(new Map()); // userId -> { isMuted, isCameraOn, isScreenSharing }
    const rawParticipantsRef = useRef([]); // list of current participants in socket room
    
    // ICE candidate queue to prevent early candidate addition error before setRemoteDescription completes
    const candidateQueuesRef = useRef(new Map()); // userId -> [RTCIceCandidate]

    // NTP Server Clock Offset Ref (ms)
    const serverOffsetRef = useRef(0);

    const syncServerTime = useCallback(() => {
        if (!socket || !socket.connected) return;
        const t0 = Date.now();
        socket.emit('voice:time-ping', t0, (res) => {
            if (res && res.serverTime) {
                const t1 = Date.now();
                const rtt = Math.max(0, t1 - res.clientSendTime);
                const offset = (res.serverTime + rtt / 2) - t1;
                serverOffsetRef.current = offset;
            }
        });
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        syncServerTime();
        const interval = setInterval(syncServerTime, 10000);
        return () => clearInterval(interval);
    }, [socket, syncServerTime]);

    const getServerNow = useCallback(() => {
        return Date.now() + (serverOffsetRef.current || 0);
    }, []);

    // Local Sound Helper with anti-overlap debouncing
    const lastSoundTimesRef = useRef({ join: 0, leave: 0, message: 0, general: 0 });

    const playInteractionSound = useCallback((type) => {
        try {
            const now = Date.now();
            const lastTypeTime = lastSoundTimesRef.current[type] || 0;
            const lastGeneralTime = lastSoundTimesRef.current.general || 0;

            // Anti-overlap: Prevent duplicate sound effects within 1.2s and audio collision within 600ms
            if (now - lastTypeTime < 1200 || now - lastGeneralTime < 600) {
                return;
            }

            lastSoundTimesRef.current[type] = now;
            lastSoundTimesRef.current.general = now;

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

    // Voice Activity Detection (VAD) state & references
    const speakingMapRef = useRef(new Map()); // identity -> boolean
    const audioContextRef = useRef(null);
    const audioAnalysersRef = useRef(new Map()); // identity -> { analyser, dataArray, source, cleanup }
    const vadIntervalRef = useRef(null);

    // Helper to start/stop VAD analysis for a track
    const attachVAD = useCallback((identity, track) => {
        if (!track || track.kind !== 'audio') return;

        // Cleanup existing analyser if any
        if (audioAnalysersRef.current.has(identity)) {
            try {
                const old = audioAnalysersRef.current.get(identity);
                if (old?.cleanup) old.cleanup();
            } catch (e) {}
            audioAnalysersRef.current.delete(identity);
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContextClass();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const stream = new MediaStream([track]);
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            audioAnalysersRef.current.set(identity, {
                analyser,
                dataArray,
                source,
                cleanup: () => {
                    try {
                        source.disconnect();
                        analyser.disconnect();
                    } catch (e) {}
                }
            });
        } catch (err) {
            console.warn(`[VAD] Failed to attach audio analyser for ${identity}:`, err);
        }
    }, []);

    const detachVAD = useCallback((identity) => {
        if (audioAnalysersRef.current.has(identity)) {
            try {
                const item = audioAnalysersRef.current.get(identity);
                if (item?.cleanup) item.cleanup();
            } catch (e) {}
            audioAnalysersRef.current.delete(identity);
        }
        speakingMapRef.current.delete(identity);
    }, []);

    // Periodic VAD evaluation loop (runs every 100ms for lightweight, snappy speaking detection)
    useEffect(() => {
        vadIntervalRef.current = setInterval(() => {
            if (audioAnalysersRef.current.size === 0) return;

            let stateChanged = false;
            audioAnalysersRef.current.forEach(({ analyser, dataArray }, identity) => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const averageVolume = sum / dataArray.length;
                // Threshold of 14 captures natural speaking voice without triggering on faint background hum
                const isNowSpeaking = averageVolume > 14;
                const wasSpeaking = speakingMapRef.current.get(identity) || false;

                if (isNowSpeaking !== wasSpeaking) {
                    speakingMapRef.current.set(identity, isNowSpeaking);
                    stateChanged = true;
                }
            });

            if (stateChanged) {
                setParticipants(prev => prev.map(p => {
                    const active = speakingMapRef.current.get(p.identity) || false;
                    return p.isSpeaking !== active ? { ...p, isSpeaking: active } : p;
                }));
            }
        }, 100);

        return () => {
            if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
            audioAnalysersRef.current.forEach(item => {
                try { if (item?.cleanup) item.cleanup(); } catch (e) {}
            });
            audioAnalysersRef.current.clear();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);

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

            if (localAudioTrack && !localState.isMuted) {
                attachVAD(localUserId, localAudioTrack);
            } else {
                detachVAD(localUserId);
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
                isSpeaking: speakingMapRef.current.get(localUserId) || false,
                videoTrack: makeTrackObject(localVideoTrack),
                audioTrack: makeTrackObject(localAudioTrack),
                screenShareTrack: null,
            });

            // Independent screenshare card
            if (localState.isScreenSharing && localScreenTrack) {
                const localScreenAudioTrack = screenStreamRef.current?.getAudioTracks()[0] || null;
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
                    audioTrack: localScreenAudioTrack ? makeTrackObject(localScreenAudioTrack) : null,
                    screenShareTrack: makeTrackObject(localScreenTrack),
                });
            }
        }

        // 2. Add Remote Participants
        rawParticipantsRef.current.forEach(p => {
            if (p.userId === localUserId) return;

            const rState = remoteStatesRef.current.get(p.userId) || { isMuted: true, isCameraOn: false, isScreenSharing: false };
            const rTracks = remoteTracksRef.current.get(p.userId) || {};

            if (rTracks.audio && !rState.isMuted) {
                attachVAD(p.userId, rTracks.audio);
            } else {
                detachVAD(p.userId);
            }

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
                isSpeaking: speakingMapRef.current.get(p.userId) || false,
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
                    audioTrack: rTracks.screenAudio ? makeTrackObject(rTracks.screenAudio) : null,
                    screenShareTrack: makeTrackObject(rTracks.screen),
                });
            }
        });

        setParticipants(list);
    }, [user, activeRoom, localState, attachVAD, detachVAD]);

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
            const screenAudioTrack = screenStreamRef.current.getAudioTracks()[0];
            if (screenTrack) {
                const sender = pc.addTrack(screenTrack, screenStreamRef.current);
                if (sender) {
                    try {
                        sender.degradationPreference = 'maintain-resolution';
                    } catch (e) {
                        console.warn("[WebRTC] Failed to set degradationPreference:", e);
                    }
                    try {
                        const params = sender.getParameters();
                        if (!params.encodings) {
                            params.encodings = [{}];
                        }
                        params.encodings.forEach(enc => {
                            enc.maxBitrate = 2000000; // Balanced 2 Mbps for smooth high quality without network congestion
                            enc.priority = 'high';
                            enc.networkPriority = 'high';
                        });
                        sender.setParameters(params);
                    } catch (e) {
                        console.warn("[WebRTC] Failed to set sender parameters:", e);
                    }
                }
                console.log(`[WebRTC] Added independent screen track to peer connection for ${targetUserId}`);
            }
            if (screenAudioTrack) {
                pc.addTrack(screenAudioTrack, screenStreamRef.current);
                console.log(`[WebRTC] Added independent screen audio track to peer connection for ${targetUserId}`);
            }
        }

        // Bind onnegotiationneeded to trigger renegotiation automatically
        // Uses activeRoomRef.current to avoid stale closure — always reads the latest activeRoom value
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
                const currentRoom = activeRoomRef.current;
                if (currentRoom) {
                    safeEmit('voice:video-offer', {
                        roomName: currentRoom.roomName,
                        targetUserId,
                        sdp: prioritizedOffer
                    });
                    console.log(`[Socket] renegotiation video-offer sent to ${targetUserId}`);
                } else {
                    console.warn(`[WebRTC] onnegotiationneeded: activeRoom is null, cannot send offer to ${targetUserId}`);
                }
            } catch (err) {
                console.error(`[WebRTC] Negotiation offer generation failed for user ${targetUserId}:`, err);
            }
        };

        // Monitor ICE & Connection State Changes
        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC Log] ICE Connection State changed for ${targetUserId}: ${pc.iceConnectionState}`);
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC Log] Peer connection state for ${targetUserId}: ${pc.connectionState}`);
            if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
                remoteTracksRef.current.delete(targetUserId);
                updateParticipantList();
            }
        };

        // ICE candidate handler
        // Uses activeRoomRef.current to avoid stale closure — always reads the latest activeRoom value
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC Log] onicecandidate event triggered for user ${targetUserId}: candidate gathered`);
                const currentRoom = activeRoomRef.current;
                if (currentRoom) {
                    safeEmit('voice:new-ice-candidate', {
                        roomName: currentRoom.roomName,
                        targetUserId,
                        candidate: event.candidate
                    });
                } else {
                    console.warn(`[WebRTC] onicecandidate: activeRoom is null, dropping candidate for ${targetUserId}`);
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
                const isScreenAudio = stream.id.includes('screen') || 
                                     (tracks.camStreamId && stream.id !== tracks.camStreamId);
                
                if (isScreenAudio) {
                    tracks.screenAudio = event.track;
                    console.log(`[WebRTC] remote screenAudioTrack set for user ${targetUserId} (track ID: ${event.track.id})`);
                } else {
                    if (!tracks.camStreamId) {
                        tracks.camStreamId = stream.id;
                    }
                    tracks.audio = event.track;
                    console.log(`[WebRTC] remote audioTrack set for user ${targetUserId} (track ID: ${event.track.id})`);
                }
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
    }, [updateParticipantList, safeEmit, localState]); // activeRoom intentionally removed — callbacks use activeRoomRef.current to avoid stale closures

    // Handle joining room and configuring media
    const connectToChannel = useCallback(async (portalId, channelId) => {
        if (connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Connected) {
            return;
        }

        setConnectionState(ConnectionState.Connecting);
        setErrorMsg('');
        setChatMessages([]);
        _setRoomStartTime(null);


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
                _setRoomStartTime(startedAt - offset);
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

            _setActiveRoom({ portalId, channelId, roomName, channelName, roomMode, userRole: returnRole });
            setConnectionState(ConnectionState.Connected);
            setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });

            if (Capacitor.isNativePlatform()) {
                const joinRoute = `/portal/${portalId}?channel=${channelId}&joinVoice=true`;
                // roomStartTime is already corrected for server<->client clock offset (set a few lines above).
                // We pass it to the Android foreground service so its MM:SS counter matches the JS RoomTimer exactly.
                const nativeStartedAt = roomStartTimeRef.current ?? Date.now();
                
                // Extract WebRTC parameters for native LiveKit client fallback in background
                const livekitToken = response.data.token;
                const livekitServerUrl = response.data.serverUrl;
                
                CallManager.setInCall({
                    isInCall: true,
                    channelName: channelName || 'Görüntülü Sohbet',
                    route: joinRoute,
                    startedAt: nativeStartedAt,
                    token: livekitToken,
                    serverUrl: livekitServerUrl,
                    userId: user?._id?.toString() || '',
                }).catch(err => console.warn('[CallManager] setInCall error:', err));
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

        _setActiveRoom(null);
        setParticipants([]);
        setChatMessages([]);
        setPinnedParticipant(null);
        setWatchParty(null);
        setIsChatOpen(false);
        setUnreadCount(0);
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
                    _setRoomStartTime(data.startedAt - offset);
                } else {
                    _setRoomStartTime(data.startedAt);
                }
            }

            const incomingParticipants = (data.participants || []).map(p => ({
                ...p,
                userId: String(p.userId)
            }));
            rawParticipantsRef.current = incomingParticipants;

            // Prune stale peer connections, tracks and states of users who left
            const activeUserIds = new Set(incomingParticipants.map(p => p.userId));
            const localUserId = user?._id?.toString();
            for (const uid of Array.from(peerConnectionsRef.current.keys())) {
                if (!activeUserIds.has(uid) && uid !== localUserId) {
                    try {
                        peerConnectionsRef.current.get(uid)?.close();
                    } catch (e) {}
                    peerConnectionsRef.current.delete(uid);
                    remoteTracksRef.current.delete(uid);
                    remoteStatesRef.current.delete(uid);
                    candidateQueuesRef.current.delete(uid);
                }
            }
            for (const uid of Array.from(remoteStatesRef.current.keys())) {
                if (!activeUserIds.has(uid) && uid !== localUserId) {
                    remoteStatesRef.current.delete(uid);
                }
            }
            for (const uid of Array.from(remoteTracksRef.current.keys())) {
                if (!activeUserIds.has(uid) && uid !== localUserId) {
                    remoteTracksRef.current.delete(uid);
                }
            }
            
            if (data.watchParty) {
                const wp = { ...data.watchParty };
                const referenceTime = wp.serverTimestamp || wp.lastUpdated;
                if (wp.isPlaying && referenceTime) {
                    const elapsed = Math.max(0, (getServerNow() - referenceTime) / 1000);
                    wp.currentTime += elapsed;
                }
                const now = getServerNow();
                wp.lastUpdated = now;
                wp.serverTimestamp = now;
                setWatchParty(wp);
            } else {
                setWatchParty(null);
            }
            
            // Map initial states for remote users
            rawParticipantsRef.current.forEach(p => {
                if (p.userId !== localUserId) {
                    remoteStatesRef.current.set(p.userId, {
                        isMuted: p.isMuted === true,
                        isCameraOn: p.isCameraOn === true,
                        isScreenSharing: !!p.isScreenSharing
                    });
                }
            });
            
            // Initiate WebRTC offers deterministically to prevent glare collisions
            rawParticipantsRef.current.forEach(async (p) => {
                if (p.userId !== localUserId && !peerConnectionsRef.current.has(p.userId)) {
                    const isOfferCreator = localUserId.localeCompare(p.userId) < 0;
                    if (isOfferCreator) {
                        const pc = getOrCreatePC(p.userId, true);
                        try {
                            console.log(`[WebRTC] Creating and sending offer to existing user ${p.userId}`);
                            const offer = await pc.createOffer();
                            const prioritizedOffer = prioritizeVideoCodec(offer.sdp);
                            await pc.setLocalDescription({ type: 'offer', sdp: prioritizedOffer });
                            // Use activeRoomRef.current to always read latest room (not stale closure)
                            const currentRoom = activeRoomRef.current;
                            if (currentRoom) {
                                safeEmit('voice:video-offer', {
                                    roomName: currentRoom.roomName,
                                    targetUserId: p.userId,
                                    sdp: prioritizedOffer
                                });
                                console.log(`[Socket] video-offer gönderildi to user ${p.userId}`);
                            } else {
                                console.warn(`[WebRTC] handleParticipants: activeRoomRef is null, cannot send offer to ${p.userId}`);
                            }
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
            if (String(data.userId) !== user?._id?.toString()) {
                playInteractionSound('join');
            }
        };

        const handleUserLeft = (data) => {
            const targetId = String(data.userId);
            console.log(`[Socket] voice:user-left: (${targetId})`);
            if (targetId !== user?._id?.toString()) {
                playInteractionSound('leave');
                
                // Cleanup connection & tracks
                if (peerConnectionsRef.current.has(targetId)) {
                    try {
                        peerConnectionsRef.current.get(targetId).close();
                    } catch (e) {}
                    peerConnectionsRef.current.delete(targetId);
                }
                remoteTracksRef.current.delete(targetId);
                remoteStatesRef.current.delete(targetId);
                candidateQueuesRef.current.delete(targetId);
                rawParticipantsRef.current = rawParticipantsRef.current.filter(p => String(p.userId) !== targetId);
                updateParticipantList();
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
                const referenceTime = updatedWp.serverTimestamp || updatedWp.lastUpdated;
                if (updatedWp.isPlaying && referenceTime) {
                    const elapsed = Math.max(0, (getServerNow() - referenceTime) / 1000);
                    updatedWp.currentTime += elapsed;
                }
                const now = getServerNow();
                updatedWp.lastUpdated = now;
                updatedWp.serverTimestamp = now;
                setWatchParty(updatedWp);
            } else {
                setWatchParty(null);
            }
        };

        const handleWatchPlay = ({ time, serverTimestamp, senderId }) => {
            const now = getServerNow();
            setWatchParty(prev => prev ? { 
                ...prev, 
                isPlaying: true, 
                currentTime: time, 
                lastUpdated: now,
                serverTimestamp: serverTimestamp || now,
                lastActionBy: senderId
            } : null);
        };

        const handleWatchPause = ({ time, serverTimestamp, senderId }) => {
            const now = getServerNow();
            setWatchParty(prev => prev ? { 
                ...prev, 
                isPlaying: false, 
                currentTime: time, 
                lastUpdated: now,
                serverTimestamp: serverTimestamp || now,
                lastActionBy: senderId
            } : null);
        };

        const handleWatchSeek = ({ time, serverTimestamp, senderId }) => {
            const now = getServerNow();
            setWatchParty(prev => {
                if (!prev) return null;
                return { 
                    ...prev, 
                    currentTime: time, 
                    lastUpdated: now,
                    serverTimestamp: serverTimestamp || now,
                    lastActionBy: senderId
                };
            });
        };

        const handleWatchStop = () => {
            setWatchParty(null);
        };

        socket.on('voice:participants', handleParticipants);
        socket.on('voice:user-joined', handleUserJoined);
        socket.on('voice:user-left', handleUserLeft);
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
            socket.off('voice:state-update', handleStateUpdate);
            socket.off('voice:watch-state', handleWatchState);
            socket.off('voice:watch-play', handleWatchPlay);
            socket.off('voice:watch-pause', handleWatchPause);
            socket.off('voice:watch-seek', handleWatchSeek);
            socket.off('voice:watch-stop', handleWatchStop);
        };
    }, [socket, activeRoom, user, getOrCreatePC, playInteractionSound, updateParticipantList, safeEmit]);

    // ─── Persistent WebRTC Signaling Effect ───
    // Registered independently of activeRoom so that offer/answer/ice signals are NEVER dropped.
    // Uses activeRoomRef.current (not closed-over activeRoom) for room name lookups.
    useEffect(() => {
        if (!socket) return;

        const handleVideoOffer = async ({ senderId, sdp }) => {
            console.log(`[Socket] video-offer alındı from user: ${senderId}`);
            const pc = getOrCreatePC(senderId, false);
            try {
                const localUserId = user?._id?.toString() || '';
                const isPolite = localUserId ? (localUserId.localeCompare(String(senderId)) > 0) : true;
                const offerCollision = pc.signalingState !== 'stable';

                if (offerCollision) {
                    if (!isPolite) {
                        console.log(`[WebRTC Perfect Negotiation] Impolite peer ignoring colliding offer from ${senderId}`);
                        return;
                    }
                    console.log(`[WebRTC Perfect Negotiation] Polite peer rolling back colliding local offer for ${senderId}`);
                    try {
                        await pc.setLocalDescription({ type: 'rollback' });
                    } catch (rollbackErr) {
                        console.warn("[WebRTC Perfect Negotiation] Rollback warning:", rollbackErr);
                    }
                }

                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
                console.log(`[WebRTC] setRemoteDescription completed for offer from ${senderId}`);

                // Process any ICE candidates that arrived early
                await processQueuedCandidates(senderId, pc);

                const answer = await pc.createAnswer();
                const prioritizedAnswer = prioritizeVideoCodec(answer.sdp);
                await pc.setLocalDescription({ type: 'answer', sdp: prioritizedAnswer });
                const currentRoom = activeRoomRef.current;
                if (currentRoom) {
                    safeEmit('voice:video-answer', {
                        roomName: currentRoom.roomName,
                        targetUserId: senderId,
                        sdp: prioritizedAnswer
                    });
                    console.log(`[Socket] video-answer gönderildi to ${senderId}`);
                } else {
                    console.error(`[WebRTC] handleVideoOffer: activeRoom is null, cannot send answer to ${senderId}`);
                }
            } catch (err) {
                console.error("Error setting video offer from remote:", err);
            }
        };

        const handleVideoAnswer = async ({ senderId, sdp }) => {
            console.log(`[Socket] video-answer alındı from user: ${senderId}`);
            const pc = peerConnectionsRef.current.get(senderId);
            if (pc) {
                try {
                    if (pc.signalingState !== 'have-local-offer') {
                        console.warn(`[WebRTC] Ignoring video answer from ${senderId} because signalingState is ${pc.signalingState}`);
                        return;
                    }
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

        socket.on('voice:video-offer', handleVideoOffer);
        socket.on('voice:video-answer', handleVideoAnswer);
        socket.on('voice:new-ice-candidate', handleNewIceCandidate);

        return () => {
            socket.off('voice:video-offer', handleVideoOffer);
            socket.off('voice:video-answer', handleVideoAnswer);
            socket.off('voice:new-ice-candidate', handleNewIceCandidate);
        };
    }, [socket, getOrCreatePC, safeEmit]);

    // Reconnection listener to recover signalling state automatically
    useEffect(() => {
        if (!socket) return;
        const handleConnect = () => {
            if (activeRoom) {
                console.log("[WebRTC Reconnect] Restoring voice channel session and renegotiating peers:", activeRoom.roomName);
                
                // Clear existing peer connections to prevent glare / ice state conflicts on reconnect
                peerConnectionsRef.current.forEach(pc => pc.close());
                peerConnectionsRef.current.clear();
                remoteTracksRef.current.clear();
                remoteStatesRef.current.clear();
                candidateQueuesRef.current.clear();

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
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !s.track.label?.includes('screen')) ||
                                        pc.getTransceivers().find(t => t.sender && t.sender.track && t.sender.track.kind === 'video')?.sender ||
                                        pc.getTransceivers().find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video')?.sender;
                    if (videoSender) {
                        videoSender.replaceTrack(cameraTrack).catch(e => {
                            console.warn("[WebRTC] replaceTrack error (ON):", e);
                        });
                    }
                });
                renegotiateAll();
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
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !s.track.label?.includes('screen')) ||
                                        pc.getTransceivers().find(t => t.sender && t.sender.track && t.sender.track.kind === 'video')?.sender ||
                                        pc.getTransceivers().find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video')?.sender;
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
        const localMicAudioTrack = localStreamRef.current?.getAudioTracks()[0];

        peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            senders.forEach(s => {
                if (s.track && s.track !== localCamVideoTrack && s.track !== localMicAudioTrack) {
                    pc.removeTrack(s);
                    console.log(`[WebRTC] Removed independent screenshare track (${s.track.kind}) from peer connection`);
                }
            });
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
                const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                const audioConstraints = {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: 2
                };
                if (supportedConstraints.restrictOwnAudio) {
                    audioConstraints.restrictOwnAudio = true;
                }

                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    },
                    audio: audioConstraints,
                    selfBrowserSurface: "exclude",
                    systemAudio: "include"
                });
                screenStreamRef.current = screenStream;
                const videoTrack = screenStream.getVideoTracks()[0];
                const audioTrack = screenStream.getAudioTracks()[0];

                if (videoTrack) {
                    videoTrack.contentHint = 'text';

                    peerConnectionsRef.current.forEach(pc => {
                        const sender = pc.addTrack(videoTrack, screenStream);
                        if (sender) {
                            try {
                                sender.degradationPreference = 'maintain-resolution';
                            } catch (e) {
                                console.warn("[WebRTC] Failed to set degradationPreference:", e);
                            }
                            try {
                                const params = sender.getParameters();
                                if (!params.encodings) {
                                    params.encodings = [{}];
                                }
                                params.encodings.forEach(enc => {
                                    enc.maxBitrate = 5000000; // 5 Mbps for high quality
                                    enc.priority = 'high';
                                    enc.networkPriority = 'high';
                                });
                                sender.setParameters(params);
                            } catch (e) {
                                console.warn("[WebRTC] Failed to set sender parameters:", e);
                            }
                        }

                        if (audioTrack) {
                            pc.addTrack(audioTrack, screenStream);
                            console.log(`[WebRTC] Added independent screen audio track to peer connection`);
                        }
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
        if (!activeRoom || !localStreamRef.current) return;
        try {
            console.log(`[WebRTC] Switching microphone input device to: ${deviceId}`);
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            const newAudioTrack = newStream.getAudioTracks()[0];
            if (!newAudioTrack) return;

            const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
            if (oldAudioTrack) {
                oldAudioTrack.stop();
                localStreamRef.current.removeTrack(oldAudioTrack);
            }
            newAudioTrack.enabled = !localState.isMuted;
            localStreamRef.current.addTrack(newAudioTrack);

            // Replace track on all active peer connections
            peerConnectionsRef.current.forEach(pc => {
                const senders = pc.getSenders();
                const audioSender = senders.find(s => s.track && s.track.kind === 'audio') ||
                                    pc.getTransceivers().find(t => t.sender && t.sender.track && t.sender.track.kind === 'audio')?.sender;
                if (audioSender) {
                    audioSender.replaceTrack(newAudioTrack).catch(err => {
                        console.warn("[WebRTC] Error replacing audio track on peer connection:", err);
                    });
                }
            });

            updateParticipantList();
        } catch (err) {
            console.error("Failed to switch audio input device:", err);
        }
    }, [activeRoom, localState.isMuted, updateParticipantList]);

    const setVideoInput = useCallback(async (deviceId) => {
        setSelectedVideoInput(deviceId);
        if (!activeRoom || !localState.isCameraOn || !localStreamRef.current) return;
        try {
            console.log(`[WebRTC] Switching camera video input device to: ${deviceId}`);
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: 640,
                    height: 480,
                    frameRate: 24
                }
            });
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (!newVideoTrack) return;

            const oldVideoTrack = localStreamRef.current.getVideoTracks().find(t => !t.isPlaceholder);
            if (oldVideoTrack) {
                oldVideoTrack.stop();
                localStreamRef.current.removeTrack(oldVideoTrack);
            }
            newVideoTrack.enabled = true;
            localStreamRef.current.addTrack(newVideoTrack);

            // Replace track on all active peer connections
            peerConnectionsRef.current.forEach(pc => {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !s.track.label?.includes('screen')) ||
                                    pc.getTransceivers().find(t => t.sender && t.sender.track && t.sender.track.kind === 'video')?.sender;
                if (videoSender) {
                    videoSender.replaceTrack(newVideoTrack).catch(err => {
                        console.warn("[WebRTC] Error replacing video track on peer connection:", err);
                    });
                }
            });

            updateParticipantList();
        } catch (err) {
            console.error("Failed to switch video input device:", err);
        }
    }, [activeRoom, localState.isCameraOn, updateParticipantList]);

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

    // Handle incoming chat messages and history via socket
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
                if (!isChatOpen) {
                    setUnreadCount(prev => prev + 1);
                }
                playInteractionSound('message');
            }
        };

        const handleChatHistory = (history) => {
            if (Array.isArray(history)) {
                setChatMessages(history.map(msg => ({
                    id: msg.id || Date.now() + Math.random(),
                    senderName: msg.senderName,
                    senderId: msg.senderId,
                    text: msg.text,
                    timestamp: msg.timestamp || new Date().toISOString(),
                    isLocal: msg.senderId === user?._id?.toString()
                })));
                if (!isChatOpen) {
                    const unread = history.filter(msg => msg.senderId !== user?._id?.toString()).length;
                    setUnreadCount(unread);
                }
            }
        };

        socket.on('voice:chat-message', handleChatMessage);
        socket.on('voice:chat-history', handleChatHistory);
        return () => {
            socket.off('voice:chat-message', handleChatMessage);
            socket.off('voice:chat-history', handleChatHistory);
        };
    }, [socket, user, playInteractionSound, isChatOpen]);

    const grantSpeak = useCallback((targetUserId) => {
        if (activeRoom) {
            safeEmit('voice:grant-speak', { roomName: activeRoom.roomName, targetUserId });
        }
    }, [activeRoom, safeEmit]);

    const revokeSpeak = useCallback((targetUserId) => {
        if (activeRoom) {
            safeEmit('voice:revoke-speak', { roomName: activeRoom.roomName, targetUserId });
        }
    }, [activeRoom, safeEmit]);

    const startWatchParty = useCallback(async (url, isLive = false) => {
        if (activeRoom && url) {
            try {
                console.log(`[WatchParty] Requesting stream validation for: ${url} (isLiveHint: ${isLive})`);
                const response = await axios.post('/api/media/validate-stream', { 
                    url, 
                    portalId: activeRoom?.portalId,
                    isLiveHint: isLive
                });
                const validatedLive = response.data.isLive;
                let streamUrl = response.data.streamUrl || url;
                if (streamUrl && !streamUrl.startsWith('http') && !streamUrl.startsWith('blob:') && !streamUrl.startsWith('/api/proxy')) {
                    streamUrl = getImageUrl(streamUrl);
                }
                console.log(`[WatchParty] URL validated by server. Final Stream: ${streamUrl}, isLive: ${validatedLive}`);
                safeEmit('voice:watch-start', { roomName: activeRoom.roomName, url: streamUrl, isLive: validatedLive });
            } catch (err) {
                if (err.response?.status === 403 || err.response?.data?.isForbidden) {
                    const msg = err.response?.data?.message || 'Gizli bir portalda paylaşılan video izlenemez.';
                    alert(msg);
                    return;
                }
                console.warn('[WatchParty] Validation failed, falling back to local detection:', err);
                const cleanUrl = url ? url.split('?')[0].split('#')[0].toLowerCase() : '';
                const isStaticVideo = cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.ogg');
                const detectedLive = !isStaticVideo && isLive === true;
                safeEmit('voice:watch-start', { roomName: activeRoom.roomName, url, isLive: detectedLive });
            }
        }
    }, [activeRoom, safeEmit]);

    const stopWatchParty = useCallback(() => {
        if (activeRoom) {
            safeEmit('voice:watch-stop', { roomName: activeRoom.roomName });
        }
    }, [activeRoom, safeEmit]);

    const sendWatchPlay = useCallback((time) => {
        if (activeRoom) {
            const now = getServerNow();
            safeEmit('voice:watch-play', { roomName: activeRoom.roomName, time });
            setWatchParty(prev => prev ? { ...prev, isPlaying: true, currentTime: time, lastUpdated: now, serverTimestamp: now } : null);
        }
    }, [activeRoom, safeEmit, getServerNow]);

    const sendWatchPause = useCallback((time) => {
        if (activeRoom) {
            const now = getServerNow();
            safeEmit('voice:watch-pause', { roomName: activeRoom.roomName, time });
            setWatchParty(prev => prev ? { ...prev, isPlaying: false, currentTime: time, lastUpdated: now, serverTimestamp: now } : null);
        }
    }, [activeRoom, safeEmit, getServerNow]);

    const sendWatchSeek = useCallback((time) => {
        if (activeRoom) {
            const now = getServerNow();
            safeEmit('voice:watch-seek', { roomName: activeRoom.roomName, time });
            setWatchParty(prev => prev ? { ...prev, currentTime: time, lastUpdated: now, serverTimestamp: now } : null);
        }
    }, [activeRoom, safeEmit, getServerNow]);

    // Trigger update on state change
    useEffect(() => {
        updateParticipantList();
    }, [localState, updateParticipantList]);

    // Sync participants and overlay state to Electron standalone overlay window
    useEffect(() => {
        if (window.desktopAPI) {
            const isConnected = !!activeRoom;
            window.desktopAPI.toggleOverlay(isConnected);

            if (isConnected) {
                const simpleParticipants = participants.map(p => ({
                    identity: p.identity,
                    name: p.name,
                    avatar: p.avatar,
                    isSpeaking: p.isSpeaking,
                    isMuted: p.isMuted,
                    isCameraOn: p.isCameraOn
                }));
                // Send as object with channelName and localState so overlay.html can display it
                window.desktopAPI.updateOverlayParticipants({
                    participants: simpleParticipants,
                    channelName: activeRoom?.channelName || 'Ses Odası',
                    localState: localState
                });
            }
        }
    }, [participants, activeRoom, localState]);

    // Handle overlay IPC control actions (mic/cam/screen/leave toggles)
    useEffect(() => {
        if (window.desktopAPI && window.desktopAPI.onOverlayControlAction) {
            const removeListener = window.desktopAPI.onOverlayControlAction((action) => {
                switch(action) {
                    case 'toggle-mic':
                        toggleMicrophone();
                        break;
                    case 'toggle-camera':
                        toggleCamera();
                        break;
                    case 'toggle-screen':
                        toggleScreenShare();
                        break;
                    case 'leave':
                        disconnectFromChannel();
                        break;
                    default:
                        break;
                }
            });
            return removeListener;
        }
    }, [activeRoom, toggleMicrophone, toggleCamera, toggleScreenShare, disconnectFromChannel]);

    const value = {
        room: { localParticipant: { identity: user?._id?.toString() } },
        activeRoom,
        connectionState,
        participants,
        roomStartTime,
        roomDuration,
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
        sendWatchSeek,
        getServerNow,
        serverOffsetRef,
        isChatOpen,
        setIsChatOpen,
        unreadCount,
        setUnreadCount,
        userVolume,
        setUserVolume
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
            <GlobalAudioRenderer 
                participants={participants} 
                isDeafened={localState.isDeafened} 
                userVolume={userVolume} 
                audioOutputId={selectedAudioOutput}
            />
        </VoiceContext.Provider>
    );
};

// Global Audio Component for cross-navigation persistence with screen audio and output sink support
const GlobalAudioRenderer = ({ participants, isDeafened, userVolume, audioOutputId }) => {
    return (
        <div style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {participants.filter(p => !p.isLocal && p.audioTrack?.track).map(p => (
                <AudioTrackPlayer 
                    key={`global-audio-${p.identity}`} 
                    track={p.audioTrack.track} 
                    muted={isDeafened} 
                    volume={userVolume} 
                    audioOutputId={audioOutputId}
                />
            ))}
        </div>
    );
};

const AudioTrackPlayer = ({ track, muted, volume, audioOutputId }) => {
    const audioEl = useRef(null);

    useEffect(() => {
        if (audioEl.current && track) {
            audioEl.current.srcObject = new MediaStream([track]);
            audioEl.current.muted = muted;
            audioEl.current.volume = volume;

            if (audioOutputId && typeof audioEl.current.setSinkId === 'function') {
                audioEl.current.setSinkId(audioOutputId).catch(err => {
                    console.warn("[WebRTC] setSinkId error on audio track:", err);
                });
            }

            audioEl.current.play().catch(err => {
                console.warn('[WebRTC] AudioTrackPlayer: audio.play() failed (likely autoplay policy):', err);
            });
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

    useEffect(() => {
        if (audioEl.current) {
            audioEl.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (audioEl.current && audioOutputId && typeof audioEl.current.setSinkId === 'function') {
            audioEl.current.setSinkId(audioOutputId).catch(err => {
                console.warn("[WebRTC] setSinkId update failed:", err);
            });
        }
    }, [audioOutputId]);

    return <audio ref={audioEl} autoPlay playsInline />;
};
