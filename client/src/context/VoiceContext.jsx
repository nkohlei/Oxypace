import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { useGlobalStore } from '../store/useGlobalStore';

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

// Helper to prioritize universally supported H264/VP8 codecs in SDP and enable high-fidelity stereo Opus audio
const prioritizeVideoCodec = (sdp) => {
    if (!sdp) return sdp;
    let result = sdp;
    // Optimize audio bitrate and stereo fidelity for Opus so shared media/mic sounds crisp and not like a telephone call
    if (result.includes('opus/48000')) {
        const opusMatch = result.match(/a=rtpmap:(\d+)\s+opus\/48000/i);
        const opusPt = opusMatch ? opusMatch[1] : null;
        if (opusPt) {
            const fmtpRegex = new RegExp(`(a=fmtp:${opusPt}\\s+[^\\r\\n]*)`, 'i');
            if (fmtpRegex.test(result)) {
                result = result.replace(fmtpRegex, (match) => {
                    let fmtp = match;
                    if (!fmtp.includes('minptime=')) fmtp += ';minptime=10';
                    if (!fmtp.includes('ptime=')) fmtp += ';ptime=20';
                    if (!fmtp.includes('stereo=')) fmtp += ';stereo=1';
                    if (!fmtp.includes('sprop-stereo=')) fmtp += ';sprop-stereo=1';
                    if (!fmtp.includes('maxaveragebitrate=')) fmtp += ';maxaveragebitrate=128000';
                    if (!fmtp.includes('cbr=')) fmtp += ';cbr=1';
                    if (!fmtp.includes('useinbandfec=')) fmtp += ';useinbandfec=1';
                    if (!fmtp.includes('usedtx=')) fmtp += ';usedtx=0';
                    return fmtp;
                });
            } else {
                result = result.replace(
                    new RegExp(`(a=rtpmap:${opusPt}\\s+opus\\/48000[^\\r\\n]*)`, 'i'),
                    `$1\r\na=fmtp:${opusPt} minptime=10;ptime=20;stereo=1;sprop-stereo=1;maxaveragebitrate=128000;cbr=1;useinbandfec=1;usedtx=0`
                );
            }
        }
    }

    try {
        const lines = result.split('\r\n');
        // Collect video RTPMAP payloads
        const videoCodecs = [];
        for (const line of lines) {
            if (line.startsWith('a=rtpmap:')) {
                const match = line.match(/^a=rtpmap:(\d+)\s+([A-Za-z0-9-]+)\//);
                if (match) {
                    videoCodecs.push({
                        payloadType: match[1],
                        name: match[2].toUpperCase()
                    });
                }
            }
        }

        // Process all m=video lines
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('m=video ')) {
                const parts = lines[i].split(' ');
                if (parts.length >= 4) {
                    const media = parts[0];
                    const port = parts[1];
                    const proto = parts[2];
                    const formats = parts.slice(3);

                    // Find preferred formats that actually exist in this m=video line
                    const validPreferred = formats.filter(fmt => {
                        const codec = videoCodecs.find(c => c.payloadType === fmt);
                        return codec && (codec.name === 'H264' || codec.name === 'VP8');
                    });

                    // Sort H264 first, then VP8
                    validPreferred.sort((a, b) => {
                        const nameA = videoCodecs.find(c => c.payloadType === a)?.name;
                        const nameB = videoCodecs.find(c => c.payloadType === b)?.name;
                        if (nameA === 'H264' && nameB !== 'H264') return -1;
                        if (nameA !== 'H264' && nameB === 'H264') return 1;
                        return 0;
                    });

                    if (validPreferred.length > 0) {
                        const otherFormats = formats.filter(f => !validPreferred.includes(f));
                        lines[i] = `${media} ${port} ${proto} ${[...validPreferred, ...otherFormats].join(' ')}`;
                    }
                }
            }
        }
        return lines.join('\r\n');
    } catch (e) {
        console.warn("[WebRTC] prioritizeVideoCodec fallback to original sdp:", e);
        return sdp;
    }
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
    const [nativeAudioRoute, setNativeAudioRoute] = useState({
        currentRoute: 'speaker',
        hasHeadset: false,
        headsetName: 'Kulaklık'
    });

    // Derived UI states
    const [participants, setParticipants] = useState([]);
    const [localState, setLocalState] = useState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });
    const localStateRef = useRef(localState);
    useEffect(() => {
        localStateRef.current = localState;
    }, [localState]);
    const [pinnedParticipant, setPinnedParticipant] = useState(null);

    // Device management
    const [availableDevices, setAvailableDevices] = useState({ audioInputs: [], audioOutputs: [], videoInputs: [] });
    const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

    const [roomStartTime, setRoomStartTime] = useState(null);
    // roomDuration removed from context — it caused VoiceProvider to re-render every second.
    // RoomTimer.jsx now calculates elapsed time locally from roomStartTime.

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
        const isLive = !!val;
        useGlobalStore.getState().setIsVoiceActive(isLive);
        if (typeof window !== 'undefined') {
            window.__isOxypaceVoiceActive = isLive;
        }
    };

    // roomDuration interval removed — was triggering full VoiceContext re-render every second.
    // RoomTimer calculates elapsed time independently from roomStartTime.

    // Chat states
    const [chatMessages, setChatMessages] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const isChatOpenRef = useRef(isChatOpen);

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
        if (isChatOpen) {
            setUnreadCount(0);
        }
    }, [isChatOpen]);

    // Watch Party State
    const [watchParty, setWatchParty] = useState(null);
    const [watchStopVoteStatus, setWatchStopVoteStatus] = useState(null);

    // Switch native Android audio routing:
    // Always enforce media mode (MODE_NORMAL + full stereo stream) for crystal clear voices and full-fidelity video/music sound.
    // Completely eliminates the muffled, deep telephone-call (hat araması) narrowband voice filtering.
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            if (activeRoom || (watchParty && watchParty.url)) {
                CallManager.setAudioMode({ mode: 'media' }).catch(() => {});
            }
            CallManager.getAudioRouting().then(res => {
                if (res) {
                    setNativeAudioRoute({
                        currentRoute: res.currentRoute || 'speaker',
                        hasHeadset: !!res.hasHeadset,
                        headsetName: res.headsetName || 'Kulaklık'
                    });
                }
            }).catch(() => {});
        }
    }, [watchParty?.url, activeRoom]);

    const [userVolume, setUserVolume] = useState(() => {
        const saved = localStorage.getItem('voiceUserVolume');
        return saved !== null ? parseFloat(saved) : 1.0;
    });

    useEffect(() => {
        localStorage.setItem('voiceUserVolume', userVolume.toString());
    }, [userVolume]);

    // Data Saver vs High Quality Call Mode (Default: 'saver' for all users)
    const [callQualityMode, setCallQualityModeState] = useState(() => {
        return localStorage.getItem('oxypace_call_quality') || 'saver';
    });
    const callQualityModeRef = useRef(callQualityMode);
    useEffect(() => {
        callQualityModeRef.current = callQualityMode;
    }, [callQualityMode]);

    const updateSendersQuality = useCallback((mode) => {
        const isSaver = mode === 'saver';
        peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            senders.forEach(sender => {
                if (!sender.track) return;
                const isVideo = sender.track.kind === 'video';
                const isAudio = sender.track.kind === 'audio';
                const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
                const isScreen = isVideo && (sender.track === screenTrack || sender.track.label?.toLowerCase().includes('screen'));

                try {
                    const params = sender.getParameters();
                    if (!params.encodings || params.encodings.length === 0) {
                        params.encodings = [{}];
                    }
                    params.encodings.forEach(enc => {
                        if (isScreen) {
                            enc.maxBitrate = isSaver ? 950000 : 3500000;
                            enc.maxFramerate = isSaver ? 20 : 30;
                        } else if (isVideo) {
                            enc.maxBitrate = isSaver ? 550000 : 1800000;
                            enc.maxFramerate = isSaver ? 24 : 30;
                        } else if (isAudio) {
                            enc.maxBitrate = isSaver ? 48000 : 128000;
                        }
                    });
                    sender.setParameters(params).catch(() => {});
                } catch (_) {}
            });
        });
    }, []);

    const setCallQualityMode = useCallback((mode) => {
        const validMode = mode === 'high' ? 'high' : 'saver';
        setCallQualityModeState(validMode);
        localStorage.setItem('oxypace_call_quality', validMode);
        updateSendersQuality(validMode);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('oxypace:call_quality_changed', { detail: { mode: validMode } }));
        }
    }, [updateSendersQuality]);

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

    // Sync active live call state globally so background/foreground presence respects voice
    useEffect(() => {
        const isLiveCallActive = !!(activeRoomRef.current || activeRoom || connectionState === ConnectionState.Connected || connectionState === ConnectionState.Connecting);
        useGlobalStore.getState().setIsVoiceActive(isLiveCallActive);
        if (typeof window !== 'undefined') {
            window.__isOxypaceVoiceActive = isLiveCallActive;
        }

        // If the call ends while the app is in the background, mark user offline immediately
        if (!isLiveCallActive && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            if (socket && socket.connected) {
                console.log('[Voice] Call ended while in background — sending app_background');
                socket.emit('app_background');
                if (Capacitor.isNativePlatform()) {
                    socket.disconnect();
                }
            }
        }
    }, [activeRoom, connectionState, socket]);

    // WebRTC connection references
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const screenCanvasRef = useRef(null);
    const screenImageRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // userId -> RTCPeerConnection
    const watchDataChannelsRef = useRef(new Map()); // userId -> RTCDataChannel ('watch-sync')
    const processedWatchCmdIdsRef = useRef(new Set()); // deduplicate P2P + Socket watch commands
    const remoteTracksRef = useRef(new Map()); // userId -> { audio: Track, video: Track, screen: Track }
    const remoteStatesRef = useRef(new Map()); // userId -> { isMuted, isCameraOn, isScreenSharing }
    const rawParticipantsRef = useRef([]); // list of current participants in socket room
    
    // ICE candidate queue to prevent early candidate addition error before setRemoteDescription completes
    const candidateQueuesRef = useRef(new Map()); // userId -> [RTCIceCandidate]

    // NTP Server Clock Offset Ref (ms)
    const serverOffsetRef = useRef(0);
    const bestRttRef = useRef(Infinity);

    const syncServerTime = useCallback(() => {
        if (!socket || !socket.connected) return;
        const t0 = Date.now();
        socket.emit('voice:time-ping', t0, (res) => {
            if (res && res.serverTime) {
                const t1 = Date.now();
                const rtt = Math.max(0, t1 - res.clientSendTime);
                const offset = (res.serverTime + rtt / 2) - t1;
                if (rtt <= bestRttRef.current || Math.abs(offset - serverOffsetRef.current) > 2000) {
                    bestRttRef.current = Math.min(bestRttRef.current, rtt + 15);
                    serverOffsetRef.current = offset;
                } else {
                    // Exponential moving average favoring low-jitter samples
                    serverOffsetRef.current = serverOffsetRef.current * 0.7 + offset * 0.3;
                }
            }
        });
    }, [socket]);

    useEffect(() => {
        // Rapid multi-sample NTP calibration on room entry, then periodic refresh
        if (!socket || !activeRoom) return;
        bestRttRef.current = Infinity;
        syncServerTime();
        const t1 = setTimeout(syncServerTime, 350);
        const t2 = setTimeout(syncServerTime, 1100);
        const interval = setInterval(syncServerTime, 8000);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearInterval(interval);
        };
    }, [socket, activeRoom, syncServerTime]);

    const getServerNow = useCallback(() => {
        return Date.now() + (serverOffsetRef.current || 0);
    }, []);

    // Zero-latency imperative Watch Party dispatcher (fires synchronously before React re-renders)
    const dispatchWatchImperative = useCallback((actionType, payload) => {
        if (!payload) return false;
        const { cmdId } = payload;
        if (cmdId) {
            if (processedWatchCmdIdsRef.current.has(cmdId)) return false;
            processedWatchCmdIdsRef.current.add(cmdId);
            if (processedWatchCmdIdsRef.current.size > 300) {
                const firstKey = processedWatchCmdIdsRef.current.values().next().value;
                processedWatchCmdIdsRef.current.delete(firstKey);
            }
        }
        const canonicalTs = (typeof payload.serverTimestamp === 'number' && payload.serverTimestamp > 0)
            ? payload.serverTimestamp
            : getServerNow();
        const detail = {
            type: actionType,
            time: typeof payload.time === 'number' ? payload.time : payload.currentTime,
            serverTimestamp: canonicalTs,
            senderId: payload.senderId,
            isPlaying: payload.isPlaying,
            isLive: payload.isLive,
            cmdId: cmdId || ''
        };
        try {
            window.dispatchEvent(new CustomEvent('watchparty:imperative-sync', { detail }));
        } catch (_) {}
        return detail;
    }, [getServerNow]);

    const broadcastWatchDataChannel = useCallback((msgObj) => {
        const raw = JSON.stringify(msgObj);
        watchDataChannelsRef.current.forEach((dc) => {
            if (dc && dc.readyState === 'open') {
                try { dc.send(raw); } catch (_) {}
            }
        });
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
            id: track.id,
            kind: track.kind,
            mediaStreamTrack: track,
            attach: (el) => {
                if (el) {
                    const currentTrack = el.srcObject?.getVideoTracks()[0] || el.srcObject?.getAudioTracks()[0];
                    if (currentTrack && currentTrack.id === track.id && el.srcObject.active) {
                        if (el.paused) el.play().catch(() => {});
                        return;
                    }
                    el.srcObject = new MediaStream([track]);
                    el.autoplay = true;
                    el.playsInline = true;
                    if (track.kind === 'video') {
                        el.muted = true; // Video elements are only for visual rendering, audio is handled by GlobalAudioRenderer
                    }
                    el.play().catch(e => console.warn("[WebRTC] Autoplay prevented on element, but it is muted:", e));
                    console.log(`[WebRTC] Attached track ${track.id} (${track.kind}) to element.`);
                }
            },
            detach: (el) => {
                if (el && el.srcObject) {
                    const currentTrack = el.srcObject?.getVideoTracks()[0] || el.srcObject?.getAudioTracks()[0];
                    if (!currentTrack || currentTrack.id === track.id) {
                        el.srcObject = null;
                        console.log(`[WebRTC] Detached track ${track.id} from element`);
                    }
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
                localVideoTrack = localStreamRef.current.getVideoTracks().find(t => !t.isPlaceholder && t.readyState === 'live') || null;
                localAudioTrack = localStreamRef.current.getAudioTracks().find(t => t.readyState === 'live') || localStreamRef.current.getAudioTracks()[0] || null;
            }
            if (screenStreamRef.current) {
                localScreenTrack = screenStreamRef.current.getVideoTracks().find(t => t.readyState === 'live') || null;
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
                videoTrack: (localState.isCameraOn && localVideoTrack) ? makeTrackObject(localVideoTrack) : null,
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

            // Recover live video track from peer connection transceivers if rTracks.video is missing or ended
            let remoteVideo = rTracks.video;
            if (!remoteVideo || remoteVideo.readyState === 'ended') {
                const pc = peerConnectionsRef.current.get(p.userId);
                if (pc) {
                    const videoTransceiver = pc.getTransceivers?.().find(t => 
                        t.receiver?.track?.kind === 'video' && 
                        t.receiver.track.readyState !== 'ended' &&
                        t.receiver.track !== rTracks.screen
                    );
                    if (videoTransceiver?.receiver?.track) {
                        remoteVideo = videoTransceiver.receiver.track;
                        if (!remoteTracksRef.current.has(p.userId)) {
                            remoteTracksRef.current.set(p.userId, {});
                        }
                        remoteTracksRef.current.get(p.userId).video = remoteVideo;
                    }
                }
            }

            // Valid active camera track for remote user
            const activeVideoTrack = (rState.isCameraOn && remoteVideo && remoteVideo.readyState !== 'ended') 
                ? remoteVideo 
                : null;

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
                videoTrack: makeTrackObject(activeVideoTrack),
                audioTrack: makeTrackObject(rTracks.audio),
                screenShareTrack: null,
            });

            // Independent screenshare card
            const effectiveScreenTrack = rTracks.screen || (rState.isScreenSharing && !rState.isCameraOn ? rTracks.video : null);
            if ((rState.isScreenSharing || rTracks.screen) && effectiveScreenTrack && effectiveScreenTrack.readyState !== 'ended') {
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
                    screenShareTrack: makeTrackObject(effectiveScreenTrack),
                });
            }
        });

        setParticipants(list);
    }, [user, activeRoom, localState, attachVAD, detachVAD]);

    // Enumerate devices
    const enumerateDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput').map((d, idx) => ({
                deviceId: d.deviceId,
                label: d.label || (idx === 0 ? 'Varsayılan Mikrofon' : `Mikrofon ${idx + 1}`)
            }));
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput').map((d, idx) => ({
                deviceId: d.deviceId,
                label: d.label || (idx === 0 ? 'Varsayılan Hoparlör' : `Hoparlör ${idx + 1}`)
            }));
            const videoInputs = devices.filter(d => d.kind === 'videoinput').map((d, idx) => ({
                deviceId: d.deviceId,
                label: d.label || (idx === 0 ? 'Ön Kamera' : `Kamera ${idx + 1}`)
            }));
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

    // Handle Native Android Headset & Speaker Route Change Events
    useEffect(() => {
        const handleNativeAudioRouteChanged = (e) => {
            const detail = e.detail;
            if (detail) {
                console.log("[Native Audio Route Changed]", detail);
                setNativeAudioRoute({
                    currentRoute: detail.currentRoute || 'speaker',
                    hasHeadset: !!detail.hasHeadset,
                    headsetName: detail.headsetName || 'Kulaklık'
                });
                if (detail.hasHeadset) {
                    enumerateDevices();
                }
            }
        };
        window.addEventListener('oxypace:audio_route_changed', handleNativeAudioRouteChanged);
        return () => {
            window.removeEventListener('oxypace:audio_route_changed', handleNativeAudioRouteChanged);
        };
    }, [enumerateDevices]);

    // Renegotiate a specific WebRTC peer connection
    const renegotiatePeer = useCallback(async (targetUserId) => {
        const pc = peerConnectionsRef.current.get(targetUserId);
        if (!pc) return;
        try {
            if (pc.signalingState !== 'stable') {
                console.log(`[WebRTC] renegotiatePeer postponed for ${targetUserId} because state is ${pc.signalingState}`);
                return;
            }
            console.log(`[WebRTC] Starting renegotiation for peer ${targetUserId}`);
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
                console.log(`[Socket] video-offer gönderildi to ${targetUserId}`);
            }
        } catch (err) {
            console.error(`Renegotiation failed for ${targetUserId}:`, err);
        }
    }, [safeEmit]);

    // Renegotiate all WebRTC connections (e.g. after adding screen share or camera)
    const renegotiateAll = useCallback(async () => {
        for (const targetUserId of peerConnectionsRef.current.keys()) {
            await renegotiatePeer(targetUserId);
        }
    }, [renegotiatePeer]);

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
        const pc = new RTCPeerConnection({
            iceServers,
            iceCandidatePoolSize: 8,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        });
        peerConnectionsRef.current.set(targetUserId, pc);

        // Bind ultra-low-latency P2P DataChannel ('watch-sync') for instant (<15ms) Watch Party pause/play/seek
        const bindWatchDataChannel = (dc) => {
            if (!dc) return;
            dc.onopen = () => {
                watchDataChannelsRef.current.set(targetUserId, dc);
            };
            dc.onclose = () => {
                if (watchDataChannelsRef.current.get(targetUserId) === dc) {
                    watchDataChannelsRef.current.delete(targetUserId);
                }
            };
            dc.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    if (!data || !data.type) return;
                    const applied = dispatchWatchImperative(data.type, data);
                    if (!applied) return;
                    if (data.type === 'watch-play') {
                        setWatchParty(prev => prev ? {
                            ...prev,
                            isPlaying: true,
                            currentTime: applied.time,
                            lastUpdated: applied.serverTimestamp,
                            serverTimestamp: applied.serverTimestamp,
                            lastActionBy: applied.senderId
                        } : null);
                    } else if (data.type === 'watch-pause') {
                        setWatchParty(prev => prev ? {
                            ...prev,
                            isPlaying: false,
                            currentTime: applied.time,
                            lastUpdated: applied.serverTimestamp,
                            serverTimestamp: applied.serverTimestamp,
                            lastActionBy: applied.senderId
                        } : null);
                    } else if (data.type === 'watch-seek') {
                        setWatchParty(prev => prev ? {
                            ...prev,
                            currentTime: applied.time,
                            lastUpdated: applied.serverTimestamp,
                            serverTimestamp: applied.serverTimestamp,
                            lastActionBy: applied.senderId
                        } : null);
                    }
                } catch (_) {}
            };
        };

        if (isOfferCreator) {
            try {
                const dc = pc.createDataChannel('watch-sync', { ordered: true });
                bindWatchDataChannel(dc);
            } catch (dcErr) {
                console.warn('[WebRTC] createDataChannel warning:', dcErr);
            }
        }
        pc.ondatachannel = (event) => {
            if (event.channel && event.channel.label === 'watch-sync') {
                bindWatchDataChannel(event.channel);
            }
        };

        // Add local camera/mic stream tracks
        if (localStreamRef.current) {
            let videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length === 0) {
                const pTrack = createPlaceholderVideoTrack();
                if (pTrack) {
                    localStreamRef.current.addTrack(pTrack);
                }
            }
            localStreamRef.current.getTracks().forEach(track => {
                try {
                    const sender = pc.addTrack(track, localStreamRef.current);
                    console.log(`[WebRTC] Added local track ${track.kind} (${track.id}) to peer connection for ${targetUserId}`);
                } catch (addErr) {
                    console.warn(`[WebRTC] addTrack warning for ${targetUserId}:`, addErr);
                }
            });
        }

        // Ensure bidirectional audio transceiver is always present so incoming remote audio
        // and future unmuted local audio are seamlessly negotiated without eager hardware mic lock at join time
        if (!pc.getTransceivers().some(t => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio')) {
            try {
                pc.addTransceiver('audio', { direction: 'sendrecv' });
            } catch (e) {
                console.warn("[WebRTC] addTransceiver audio warning:", e);
            }
        }

        // Add local screen share track if currently screen sharing or active stream exists
        const hasLiveScreen = screenStreamRef.current && 
            screenStreamRef.current.getVideoTracks().some(t => t.readyState === 'live');
        if (hasLiveScreen || (localStateRef.current?.isScreenSharing && screenStreamRef.current)) {
            const screenTrack = screenStreamRef.current.getVideoTracks()[0];
            const screenAudioTrack = screenStreamRef.current.getAudioTracks()[0];
            if (screenTrack) {
                try {
                    screenTrack.contentHint = 'detail';
                } catch (e) {}
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
                        const isSaver = callQualityModeRef.current === 'saver';
                        params.encodings.forEach(enc => {
                            enc.maxBitrate = isSaver ? 950000 : 2500000;
                            enc.maxFramerate = isSaver ? 20 : 30;
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
                // initiates offers unless connection has active screen stream or is stable renegotiating.
                if (pc.signalingState !== 'stable') {
                    console.log(`[WebRTC] onnegotiationneeded ignored because signalingState is ${pc.signalingState}`);
                    return;
                }
                const isScreenLive = screenStreamRef.current?.getVideoTracks().some(t => t.readyState === 'live');
                const isCameraLive = localStreamRef.current?.getVideoTracks().some(t => !t.isPlaceholder && t.readyState === 'live');
                if (!isOfferCreator && !isScreenLive && !isCameraLive) {
                    console.log(`[WebRTC] onnegotiationneeded ignored for idle non-offer creator ${targetUserId}`);
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
            } else if (pc.connectionState === 'connected') {
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
            // Minimize receiver jitter buffer delay (~20ms) for real-time voice & video responsiveness
            try {
                if (event.receiver && 'playoutDelayHint' in event.receiver) {
                    event.receiver.playoutDelayHint = 0.02;
                }
            } catch (_) {}
            const stream = event.streams[0] || new MediaStream([event.track]);
            console.log(`[WebRTC] Received remote track ${event.track.kind} (${event.track.id}) from ${targetUserId}`);
            
            if (!remoteTracksRef.current.has(targetUserId)) {
                remoteTracksRef.current.set(targetUserId, {});
            }
            const tracks = remoteTracksRef.current.get(targetUserId);

            // Track lifecycle listeners to immediately reflect frame delivery or track changes
            event.track.onended = () => {
                console.log(`[WebRTC] Remote track ended: ${event.track.id} (${event.track.kind}) for ${targetUserId}`);
                if (tracks.screen === event.track) {
                    tracks.screen = null;
                }
                updateParticipantList();
            };
            event.track.onunmute = () => {
                console.log(`[WebRTC] Remote track unmuted: ${event.track.id} (${event.track.kind}) for ${targetUserId}`);
                updateParticipantList();
            };

            if (event.track.kind === 'audio') {
                const isScreenAudio = stream.id.includes('screen') || 
                                     (rState?.screenStreamId && stream.id === rState.screenStreamId) ||
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
                const rState = remoteStatesRef.current.get(targetUserId);
                const videoTransceivers = (pc.getTransceivers?.() || []).filter(t => t.receiver?.track?.kind === 'video');
                const isSecondVideoTransceiver = videoTransceivers.length > 1 && event.transceiver && event.transceiver !== videoTransceivers[0];
                const isDifferentStreamFromCam = Boolean(
                    tracks.initialCamStreamId &&
                    stream.id &&
                    stream.id !== tracks.initialCamStreamId &&
                    event.track.id !== tracks.initialCamTrackId
                );

                // Track is explicitly a screenshare if:
                // 1. Content hint is text/detail (set by screenshare)
                // 2. Stream ID or track label explicitly contains 'screen' or matches signaled screenStreamId
                // 3. It arrives on a 2nd video transceiver or a different MediaStream than the initial camera/placeholder stream
                // 4. Remote user is marked as screen sharing AND camera is not on AND we don't have a screen track yet
                const isExplicitScreen = event.track.contentHint === 'text' || 
                                         event.track.contentHint === 'detail' ||
                                         (rState?.screenStreamId && stream.id === rState.screenStreamId) ||
                                         (stream.id && stream.id.toLowerCase().includes('screen')) || 
                                         (event.track.label && event.track.label.toLowerCase().includes('screen'));
                
                const isScreen = isExplicitScreen ||
                                 isSecondVideoTransceiver ||
                                 isDifferentStreamFromCam ||
                                 (rState?.isScreenSharing && !rState?.isCameraOn && !tracks.screen);

                if (isScreen) {
                    tracks.screen = event.track;
                    tracks.screenStreamId = stream.id;
                    console.log(`[WebRTC] remote screenShareTrack set for user ${targetUserId} (track ID: ${event.track.id}, stream ID: ${stream.id})`);
                } else {
                    if (!tracks.initialCamStreamId && stream.id) {
                        tracks.initialCamStreamId = stream.id;
                    }
                    if (!tracks.initialCamTrackId) {
                        tracks.initialCamTrackId = event.track.id;
                    }
                    tracks.camStreamId = stream.id;
                    tracks.video = event.track;
                    console.log(`[WebRTC] remote videoTrack set for user ${targetUserId} (track ID: ${event.track.id}, stream ID: ${stream.id})`);
                }
            }

            updateParticipantList();
        };

        return pc;
    }, [updateParticipantList, safeEmit, localState]); // activeRoom intentionally removed — callbacks use activeRoomRef.current to avoid stale closures

    // Handle joining room and configuring media
    const connectToChannel = useCallback(async (portalId, channelId) => {
        if (connectionState === ConnectionState.Connected && activeRoomRef.current?.channelId === channelId) {
            return;
        }

        setConnectionState(ConnectionState.Connecting);
        setErrorMsg('');
        setChatMessages([]);
        _setRoomStartTime(null);


        try {
            // Do NOT eagerly capture the microphone hardware while the user is muted!
            // Eagerly capturing microphone causes Android to enter recording state, stealing audio focus and muting background music (Spotify).
            // We initialize a clean MediaStream and dynamically capture microphone only when the user taps 'Mikrofonu Aç'.
            const localStream = new MediaStream();
            localStreamRef.current = localStream;
            enumerateDevices();

            // Always add a placeholder video track to ensure the video transceiver/channel is pre-negotiated at join.
            const placeholderTrack = createPlaceholderVideoTrack();
            if (placeholderTrack) {
                localStream.addTrack(placeholderTrack);
                console.log('[WebRTC] Placeholder video track added to localStream');
            }

            // Fetch Token details
            const response = await axios.post('/api/voice/token', { portalId, channelId });
            const { roomName, channelName, roomMode, userRole: returnRole, startedAt, serverNow, consensusRule, portalId: retPortalId } = response.data;

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

            _setActiveRoom({ 
                portalId: retPortalId || portalId, 
                channelId, 
                roomName, 
                channelName, 
                roomMode, 
                userRole: returnRole,
                consensusRule: consensusRule || 'all'
            });
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
        watchDataChannelsRef.current.clear();
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
        setWatchStopVoteStatus(null);
        setIsChatOpen(false);
        setUnreadCount(0);
        setErrorMsg('');
        setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false, isDeafened: false });
        setConnectionState(ConnectionState.Disconnected);

        if (Capacitor.isNativePlatform()) {
            CallManager.setInCall({ isInCall: false }).catch(err => console.warn(err));
        }

        try {
            window.dispatchEvent(new CustomEvent('oxypace:call_ended'));
        } catch (ignored) {}
    }, [activeRoom, user, safeEmit]);

    // Guarantee native call notification is immediately dismissed whenever room ends or disconnects
    const wasInCallRef = useRef(false);
    useEffect(() => {
        if (activeRoom) {
            wasInCallRef.current = true;
        } else if (wasInCallRef.current) {
            wasInCallRef.current = false;
            if (Capacitor.isNativePlatform()) {
                CallManager.setInCall({ isInCall: false }).catch(() => {});
            }
        }
    }, [activeRoom]);

    // Handle WebSocket Signaling Events
    useEffect(() => {
        if (!socket || !activeRoom) return;

        const handleParticipants = async (data) => {
            console.log(`[Socket] Received voice:participants. Count: ${data.participants?.length}`);
            if (activeRoom && data.startedAt) {
                if (data.serverNow) {
                    const localNow = Date.now();
                    const offset = data.serverNow - localNow;
                    if (bestRttRef.current === Infinity) {
                        serverOffsetRef.current = offset;
                    }
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
            
            if (data.watchParty && data.watchParty.url) {
                const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
                const normalizeUrl = (u) => {
                    if (!u || typeof u !== 'string') return u;
                    const t = u.trim();
                    if (t.startsWith('/api/')) return `${apiBase}${t}`;
                    if (t.startsWith('api/')) return `${apiBase}/${t}`;
                    return t;
                };
                setWatchParty({
                    ...data.watchParty,
                    url: normalizeUrl(data.watchParty.url),
                    serverTimestamp: data.watchParty.serverTimestamp || data.serverNow || getServerNow()
                });
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

            // If local user is currently sharing screen, announce state so all peers stay in sync
            const hasLiveScreen = screenStreamRef.current && 
                screenStreamRef.current.getVideoTracks().some(t => t.readyState === 'live');
            if (hasLiveScreen || localStateRef.current?.isScreenSharing) {
                const curRoom = activeRoomRef.current;
                if (curRoom && localUserId) {
                    safeEmit('voice:state-update', {
                        roomName: curRoom.roomName,
                        userId: localUserId,
                        isMuted: localStateRef.current?.isMuted ?? true,
                        isCameraOn: localStateRef.current?.isCameraOn ?? false,
                        isScreenSharing: true
                    });
                }
            }

            updateParticipantList();
        };

        const handleUserJoined = (data) => {
            console.log(`[Socket] voice:user-joined: ${data.username} (${data.userId})`);
            if (String(data.userId) !== user?._id?.toString()) {
                playInteractionSound('join');
                // Re-broadcast local state (especially screen share and camera) to ensure new peer has full state immediately
                const hasLiveScreen = screenStreamRef.current && 
                    screenStreamRef.current.getVideoTracks().some(t => t.readyState === 'live');
                if (hasLiveScreen || localStateRef.current?.isScreenSharing || localStateRef.current?.isCameraOn) {
                    const curRoom = activeRoomRef.current;
                    if (curRoom) {
                        safeEmit('voice:state-update', {
                            roomName: curRoom.roomName,
                            userId: user?._id?.toString(),
                            isMuted: localStateRef.current?.isMuted ?? true,
                            isCameraOn: localStateRef.current?.isCameraOn ?? false,
                            isScreenSharing: !!(hasLiveScreen || localStateRef.current?.isScreenSharing)
                        });
                    }
                }
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

        const handleStateUpdate = ({ userId, isMuted, isCameraOn, isScreenSharing, screenStreamId }) => {
            console.log(`[Socket] voice:state-update received for user ${userId}: Mute=${isMuted}, Camera=${isCameraOn}, Screen=${isScreenSharing}, screenStreamId=${screenStreamId || ''}`);
            const prevState = remoteStatesRef.current.get(userId) || {};
            remoteStatesRef.current.set(userId, {
                isMuted,
                isCameraOn,
                isScreenSharing,
                screenStreamId: screenStreamId || prevState.screenStreamId || null
            });

            const rTracks = remoteTracksRef.current.get(userId);
            const pc = peerConnectionsRef.current.get(userId);
            if (rTracks) {
                if (isScreenSharing && !rTracks.screen) {
                    // Check if peer connection has multiple video transceivers (1st = camera/placeholder, 2nd = screen)
                    const videoTransceivers = (pc?.getTransceivers?.() || []).filter(
                        t => t.receiver?.track?.kind === 'video' && t.receiver.track.readyState !== 'ended'
                    );
                    if (videoTransceivers.length > 1) {
                        const camTrack = videoTransceivers[0].receiver.track;
                        const scrTrack = videoTransceivers[videoTransceivers.length - 1].receiver.track;
                        if (scrTrack && scrTrack !== camTrack) {
                            rTracks.video = camTrack;
                            rTracks.screen = scrTrack;
                        }
                    } else if (rTracks.video && !isCameraOn) {
                        // Track was initially classified as video track because camera was off
                        rTracks.screen = rTracks.video;
                        rTracks.video = null;
                    }
                } else if (!isScreenSharing && rTracks.screen) {
                    // If remote user is NOT screen sharing, but camera is ON, recover the track if video slot is empty
                    if (isCameraOn && (!rTracks.video || rTracks.video.readyState === 'ended')) {
                        rTracks.video = rTracks.screen;
                    }
                    rTracks.screen = null;
                }
            }

            if (isCameraOn && pc) {
                const videoTransceiver = pc.getTransceivers?.().find(t => 
                    t.receiver?.track?.kind === 'video' && 
                    t.receiver.track.readyState !== 'ended' &&
                    t.receiver.track !== rTracks?.screen
                );
                if (videoTransceiver?.receiver?.track) {
                    if (!remoteTracksRef.current.has(userId)) {
                        remoteTracksRef.current.set(userId, {});
                    }
                    remoteTracksRef.current.get(userId).video = videoTransceiver.receiver.track;
                }
            }

            updateParticipantList();
        };

        const normalizeWpUrl = (u) => {
            if (!u || typeof u !== 'string') return u;
            const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
            const t = u.trim();
            if (t.startsWith('/api/')) return `${apiBase}${t}`;
            if (t.startsWith('api/')) return `${apiBase}/${t}`;
            return t;
        };

        const handleWatchState = (wp) => {
            if (wp && wp.url) {
                setWatchParty({
                    ...wp,
                    url: normalizeWpUrl(wp.url),
                    serverTimestamp: wp.serverTimestamp || getServerNow()
                });
            } else {
                setWatchParty(null);
            }
        };

        const handleWatchPlay = (payload) => {
            const applied = dispatchWatchImperative('watch-play', payload);
            if (!applied) return;
            setWatchParty(prev => prev ? { 
                ...prev, 
                isPlaying: true, 
                currentTime: applied.time, 
                lastUpdated: applied.serverTimestamp,
                serverTimestamp: applied.serverTimestamp,
                lastActionBy: applied.senderId
            } : null);
        };

        const handleWatchPause = (payload) => {
            const applied = dispatchWatchImperative('watch-pause', payload);
            if (!applied) return;
            setWatchParty(prev => prev ? { 
                ...prev, 
                isPlaying: false, 
                currentTime: applied.time, 
                lastUpdated: applied.serverTimestamp,
                serverTimestamp: applied.serverTimestamp,
                lastActionBy: applied.senderId
            } : null);
        };

        const handleWatchSeek = (payload) => {
            const applied = dispatchWatchImperative('watch-seek', payload);
            if (!applied) return;
            setWatchParty(prev => {
                if (!prev) return null;
                return { 
                    ...prev, 
                    currentTime: applied.time, 
                    lastUpdated: applied.serverTimestamp,
                    serverTimestamp: applied.serverTimestamp,
                    lastActionBy: applied.senderId
                };
            });
        };

        const handleWatchSync = (payload) => {
            const { currentTime, isPlaying, isLive, serverTimestamp, url } = payload || {};
            const canonicalTs = (typeof serverTimestamp === 'number' && serverTimestamp > 0) ? serverTimestamp : getServerNow();
            dispatchWatchImperative('watch-sync', {
                time: currentTime,
                isPlaying,
                isLive,
                serverTimestamp: canonicalTs
            });
            setWatchParty(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    url: url ? normalizeWpUrl(url) : prev.url,
                    currentTime: typeof currentTime === 'number' ? currentTime : prev.currentTime,
                    isPlaying: typeof isPlaying === 'boolean' ? isPlaying : prev.isPlaying,
                    isLive: typeof isLive === 'boolean' ? isLive : prev.isLive,
                    lastUpdated: canonicalTs,
                    serverTimestamp: canonicalTs
                };
            });
        };

        const handleWatchStop = () => {
            setWatchParty(null);
            setWatchStopVoteStatus(null);
        };

        const handleWatchStopVoteStatus = (status) => {
            setWatchStopVoteStatus(status);
        };

        const handleWatchStopVoteClear = () => {
            setWatchStopVoteStatus(null);
        };

        const handleConsensusRuleUpdated = ({ portalId, consensusRule: newRule }) => {
            _setActiveRoom(prev => (prev && (!portalId || prev.portalId === portalId) ? { ...prev, consensusRule: newRule } : prev));
        };

        const handleWatchSubtitle = ({ subtitle, senderId, senderName }) => {
            console.log(`[VoiceContext] handleWatchSubtitle event received: "${subtitle?.label}" from "${senderName}"`);
            setWatchParty(prev => {
                if (!prev) {
                    console.warn('[VoiceContext] handleWatchSubtitle: watchParty state is currently null');
                    return null;
                }
                const sharedList = Array.isArray(prev.sharedSubtitles) ? [...prev.sharedSubtitles] : [];
                if (subtitle && subtitle.type !== 'off' && subtitle.label) {
                    const existingIdx = sharedList.findIndex(s => s.label === subtitle.label);
                    if (existingIdx >= 0) {
                        sharedList[existingIdx] = subtitle;
                    } else {
                        sharedList.push(subtitle);
                    }
                }
                return {
                    ...prev,
                    activeSubtitle: subtitle,
                    sharedSubtitles: sharedList,
                    lastSubActionBy: senderId,
                    lastSubActionName: senderName
                };
            });
        };

        socket.on('voice:participants', handleParticipants);
        socket.on('voice:user-joined', handleUserJoined);
        socket.on('voice:user-left', handleUserLeft);
        socket.on('voice:state-update', handleStateUpdate);
        socket.on('voice:watch-state', handleWatchState);
        socket.on('voice:watch-play', handleWatchPlay);
        socket.on('voice:watch-pause', handleWatchPause);
        socket.on('voice:watch-seek', handleWatchSeek);
        socket.on('voice:watch-sync', handleWatchSync);
        socket.on('voice:watch-subtitle', handleWatchSubtitle);
        socket.on('voice:watch-stop', handleWatchStop);
        socket.on('voice:watch-stop-vote-status', handleWatchStopVoteStatus);
        socket.on('voice:watch-stop-vote-clear', handleWatchStopVoteClear);
        socket.on('voice:consensus-rule-updated', handleConsensusRuleUpdated);

        return () => {
            socket.off('voice:participants', handleParticipants);
            socket.off('voice:user-joined', handleUserJoined);
            socket.off('voice:user-left', handleUserLeft);
            socket.off('voice:state-update', handleStateUpdate);
            socket.off('voice:watch-state', handleWatchState);
            socket.off('voice:watch-play', handleWatchPlay);
            socket.off('voice:watch-pause', handleWatchPause);
            socket.off('voice:watch-seek', handleWatchSeek);
            socket.off('voice:watch-sync', handleWatchSync);
            socket.off('voice:watch-subtitle', handleWatchSubtitle);
            socket.off('voice:watch-stop', handleWatchStop);
            socket.off('voice:watch-stop-vote-status', handleWatchStopVoteStatus);
            socket.off('voice:watch-stop-vote-clear', handleWatchStopVoteClear);
            socket.off('voice:consensus-rule-updated', handleConsensusRuleUpdated);
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
                    updateParticipantList();
                } else {
                    console.error(`[WebRTC] handleVideoOffer: activeRoom is null, cannot send answer to ${senderId}`);
                }

                if (offerCollision) {
                    // Polite peer rolled back its own offer to answer remote offer.
                    // Now that remote offer is resolved and answered, re-trigger renegotiation to push local tracks.
                    setTimeout(() => {
                        const currentPc = peerConnectionsRef.current.get(senderId);
                        if (currentPc && currentPc.signalingState === 'stable') {
                            renegotiatePeer(senderId);
                        }
                    }, 300);
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
                    updateParticipantList();
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
    }, [socket, getOrCreatePC, safeEmit, renegotiatePeer, updateParticipantList]);

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
        if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
        }
        let track = localStreamRef.current.getAudioTracks()[0];
        const willMute = !localState.isMuted;

        if (willMute) {
            // MUTING: Stop audio track and release hardware mic session so audio returns to pristine stereo
            if (track) {
                try {
                    track.enabled = false;
                    track.stop();
                    localStreamRef.current.removeTrack(track);
                } catch (e) {}
            }
            // Replace track with null on active peer connection senders
            peerConnectionsRef.current.forEach(pc => {
                const senders = pc.getSenders();
                const audioSender = senders.find(s => s.track && s.track.kind === 'audio') ||
                    pc.getTransceivers().find(t => t.sender?.track?.kind === 'audio')?.sender;
                if (audioSender) {
                    audioSender.replaceTrack(null).catch(() => {});
                }
            });

            if (Capacitor.isNativePlatform()) {
                CallManager.setAudioMode({ mode: 'media' }).catch(() => {});
            }
        } else {
            // UNMUTING: Request fresh microphone with proper echoCancellation, noiseSuppression, autoGainControl
            try {
                console.log("[WebRTC] Requesting local audio track dynamically with AEC & noise suppression...");
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 48000
                    }
                });
                const newAudioTrack = audioStream.getAudioTracks()[0];
                if (newAudioTrack) {
                    localStreamRef.current.addTrack(newAudioTrack);
                    track = newAudioTrack;

                    const isSaver = callQualityModeRef.current === 'saver';
                    peerConnectionsRef.current.forEach(pc => {
                        const senders = pc.getSenders();
                        let audioSender = senders.find(s => s.track && s.track.kind === 'audio') ||
                            pc.getTransceivers().find(t => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio')?.sender;

                        if (audioSender) {
                            audioSender.replaceTrack(newAudioTrack).catch(e => console.warn("[WebRTC] audio replaceTrack error:", e));
                            try {
                                const params = audioSender.getParameters();
                                if (!params.encodings) params.encodings = [{}];
                                params.encodings.forEach(enc => {
                                    enc.priority = 'high';
                                    enc.networkPriority = 'high';
                                    enc.maxBitrate = isSaver ? 48000 : 128000;
                                });
                                audioSender.setParameters(params).catch(() => {});
                            } catch (_) {}
                        } else {
                            try { pc.addTrack(newAudioTrack, localStreamRef.current); } catch (e) {}
                        }
                    });

                    if (user?._id) {
                        attachVAD(user._id.toString(), newAudioTrack);
                    }
                    const newDevId = newAudioTrack.getSettings()?.deviceId;
                    if (newDevId) {
                        setSelectedAudioInput(newDevId);
                    }
                    enumerateDevices();

                    if (Capacitor.isNativePlatform()) {
                        CallManager.setAudioMode({ mode: 'call' }).catch(() => {});
                    }
                }
            } catch (permErr) {
                console.warn("[WebRTC] Failed to acquire audio stream dynamically:", permErr);
                return;
            }
        }

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
    }, [localState, activeRoom, user, safeEmit, enumerateDevices]);

    const toggleCamera = useCallback(async () => {
        if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
        }
        
        // Find the active camera track (any live video track that is not the placeholder)
        let cameraTrack = localStreamRef.current.getVideoTracks().find(t => !t.isPlaceholder && t.readyState === 'live');
        const willCameraOn = !localState.isCameraOn;

        if (willCameraOn) {
            if (!cameraTrack) {
                try {
                    console.log("[WebRTC] Requesting local camera stream...");
                    let videoStream;
                    try {
                        const isSaver = callQualityModeRef.current === 'saver';
                        videoStream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                facingMode: { ideal: facingMode || 'user' },
                                width: isSaver ? { ideal: 640, max: 854 } : { ideal: 1280, max: 1280 },
                                height: isSaver ? { ideal: 480, max: 480 } : { ideal: 720, max: 720 },
                                frameRate: isSaver ? { ideal: 24, max: 24 } : { ideal: 30, max: 30 }
                            }
                        });
                    } catch (e1) {
                        console.warn("[WebRTC] Strict camera constraints failed, attempting basic fallback:", e1);
                        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    }
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
                
                // Remove any existing placeholder track from local stream WITHOUT stopping it
                // Stopping an active placeholder kills the remote peer receiver track in WebRTC
                const placeholder = localStreamRef.current.getVideoTracks().find(t => t.isPlaceholder);
                if (placeholder) {
                    try { localStreamRef.current.removeTrack(placeholder); } catch (e) {}
                }

                const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
                const isScreenSender = (s) => (screenTrack && s.track === screenTrack) || (s.track?.label?.toLowerCase().includes('screen'));

                // Swap placeholder track with real camera track on all active peer connections
                let needsRenegotiate = false;
                for (const pc of peerConnectionsRef.current.values()) {
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !isScreenSender(s)) ||
                                        pc.getTransceivers().find(t => (t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video') && !isScreenSender(t.sender))?.sender;
                    if (videoSender) {
                        try {
                            await videoSender.replaceTrack(cameraTrack);
                            const params = videoSender.getParameters();
                            if (!params.encodings) params.encodings = [{}];
                            const isSaver = callQualityModeRef.current === 'saver';
                            params.encodings.forEach(enc => {
                                enc.maxBitrate = isSaver ? 550000 : 1800000;
                                enc.maxFramerate = isSaver ? 24 : 30;
                                enc.priority = 'high';
                                enc.networkPriority = 'high';
                            });
                            videoSender.setParameters(params).catch(() => {});
                        } catch (e) {
                            console.warn("[WebRTC] replaceTrack error (ON):", e);
                        }
                    } else {
                        try {
                            pc.addTrack(cameraTrack, localStreamRef.current);
                            needsRenegotiate = true;
                        } catch (addErr) {
                            console.warn("[WebRTC] addTrack error (ON):", addErr);
                        }
                    }
                }
                if (needsRenegotiate) {
                    await renegotiateAll();
                }
            }
        } else {
            // Turning camera OFF
            // 1. Create a new placeholder track so the transceiver remains active
            const placeholderTrack = createPlaceholderVideoTrack();
            if (placeholderTrack) {
                localStreamRef.current.addTrack(placeholderTrack);
                
                const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
                const isScreenSender = (s) => (screenTrack && s.track === screenTrack) || (s.track?.label?.toLowerCase().includes('screen'));

                // 2. Swap camera track with placeholder track on all active peer connections FIRST
                for (const pc of peerConnectionsRef.current.values()) {
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !isScreenSender(s)) ||
                                        pc.getTransceivers().find(t => (t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video') && !isScreenSender(t.sender))?.sender;
                    if (videoSender) {
                        try {
                            await videoSender.replaceTrack(placeholderTrack);
                        } catch (e) {
                            console.warn("[WebRTC] replaceTrack error (OFF):", e);
                        }
                    }
                }
            }

            // 3. ONLY AFTER replaceTrack completes, safely stop cameraTrack to turn off the physical camera hardware/LED
            if (cameraTrack) {
                cameraTrack.enabled = false;
                try { cameraTrack.stop(); } catch (e) {}
                try { localStreamRef.current.removeTrack(cameraTrack); } catch (e) {}
            }
        }

        setLocalState(prev => {
            const next = { ...prev, isCameraOn: willCameraOn };
            const curRoom = activeRoomRef.current || activeRoom;
            if (curRoom) {
                safeEmit('voice:state-update', {
                    roomName: curRoom.roomName,
                    userId: user?._id?.toString(),
                    isMuted: next.isMuted,
                    isCameraOn: next.isCameraOn,
                    isScreenSharing: next.isScreenSharing
                });
            }
            return next;
        });

        updateParticipantList();
    }, [localState, activeRoom, user, safeEmit, facingMode, renegotiateAll, updateParticipantList]);

    const stopScreenShareAndRevert = useCallback(() => {
        window.onNativeScreenFrame = null;
        if (Capacitor.isNativePlatform()) {
            CallManager.stopScreenCapture().catch(() => {});
        }

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
                let screenStream = null;

                // 1. Mobile Native Real Screen Capture via MediaProjection
                if (Capacitor.isNativePlatform()) {
                    try {
                        const captureResult = await CallManager.startScreenCapture();
                        if (!captureResult || captureResult.success === false) {
                            console.log("[ScreenShare] User cancelled native screen capture prompt.");
                            return;
                        }

                        const initW = (captureResult.width && captureResult.width > 0) ? captureResult.width : 540;
                        const initH = (captureResult.height && captureResult.height > 0) ? captureResult.height : 1200;
                        const canvas = screenCanvasRef.current || document.createElement('canvas');
                        screenCanvasRef.current = canvas;
                        canvas.width = initW;
                        canvas.height = initH;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#0a0d14';
                        ctx.fillRect(0, 0, initW, initH);

                        let isDecoding = false;
                        let pendingBase64 = null;

                        const screenImg = screenImageRef.current || new Image();
                        screenImageRef.current = screenImg;

                        screenImg.onload = () => {
                            try {
                                const iw = screenImg.naturalWidth || canvas.width;
                                const ih = screenImg.naturalHeight || canvas.height;
                                if (iw > 0 && ih > 0) {
                                    const isImgPortrait = ih >= iw;
                                    const isCanvasPortrait = canvas.height >= canvas.width;
                                    if (isImgPortrait !== isCanvasPortrait) {
                                        canvas.width = iw;
                                        canvas.height = ih;
                                    }
                                    const cw = canvas.width;
                                    const ch = canvas.height;
                                    ctx.fillStyle = '#0a0d14';
                                    ctx.fillRect(0, 0, cw, ch);
                                    const scale = Math.min(cw / iw, ch / ih);
                                    const dw = Math.round(iw * scale);
                                    const dh = Math.round(ih * scale);
                                    const dx = Math.round((cw - dw) / 2);
                                    const dy = Math.round((ch - dh) / 2);
                                    ctx.drawImage(screenImg, dx, dy, dw, dh);
                                }
                            } catch (drawErr) {}
                            isDecoding = false;
                            if (pendingBase64) {
                                const next = pendingBase64;
                                pendingBase64 = null;
                                isDecoding = true;
                                screenImg.src = "data:image/jpeg;base64," + next;
                            }
                        };
                        screenImg.onerror = () => {
                            isDecoding = false;
                        };

                        window.onNativeScreenFrame = (base64) => {
                            if (isDecoding) {
                                pendingBase64 = base64;
                                return;
                            }
                            isDecoding = true;
                            screenImg.src = "data:image/jpeg;base64," + base64;
                        };

                        if (typeof canvas.captureStream === 'function') {
                            screenStream = canvas.captureStream(25);
                            const vTrack = screenStream.getVideoTracks()[0];
                            if (vTrack) {
                                try {
                                    vTrack.contentHint = 'detail';
                                } catch (e) {}
                                const origStop = vTrack.stop.bind(vTrack);
                                vTrack.stop = () => {
                                    window.onNativeScreenFrame = null;
                                    CallManager.stopScreenCapture().catch(() => {});
                                    origStop();
                                };
                            }
                        }
                    } catch (nativeErr) {
                        console.warn("[ScreenShare] Native screen capture start error:", nativeErr);
                        return;
                    }
                }

                // 2. Try standard getDisplayMedia if available in desktop browser
                if (!screenStream && navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
                    try {
                        screenStream = await navigator.mediaDevices.getDisplayMedia({
                            video: {
                                width: { ideal: 1920 },
                                height: { ideal: 1080 },
                                frameRate: { ideal: 30, max: 60 }
                            },
                            audio: true
                        });
                    } catch (audioOrParamErr) {
                        console.warn("[ScreenShare] Advanced getDisplayMedia failed, retrying standard constraints:", audioOrParamErr);
                        try {
                            screenStream = await navigator.mediaDevices.getDisplayMedia({
                                video: true
                            });
                        } catch (fallbackErr) {
                            if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
                                console.log("[ScreenShare] User cancelled screen share prompt.");
                                return;
                            }
                            console.warn("[ScreenShare] Native getDisplayMedia error:", fallbackErr);
                        }
                    }
                }

                if (!screenStream) {
                    console.warn("[ScreenShare] Unable to initialize screen stream");
                    return;
                }

                screenStreamRef.current = screenStream;
                const videoTrack = screenStream.getVideoTracks()[0];
                const audioTrack = screenStream.getAudioTracks()[0];

                // Announce screen share state & stream ID BEFORE adding track and renegotiating
                // so remote peers immediately classify the incoming track as tracks.screen
                setLocalState(prev => {
                    const next = { ...prev, isScreenSharing: true };
                    if (activeRoom) {
                        safeEmit('voice:state-update', {
                            roomName: activeRoom.roomName,
                            userId: user?._id?.toString(),
                            isMuted: next.isMuted,
                            isCameraOn: next.isCameraOn,
                            isScreenSharing: true,
                            screenStreamId: screenStream.id
                        });
                    }
                    return next;
                });

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
                                    const isSaver = callQualityModeRef.current === 'saver';
                                    enc.maxBitrate = isSaver ? 950000 : 3500000;
                                    enc.maxFramerate = isSaver ? 20 : 30;
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
            } catch (err) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    console.log("[ScreenShare] Screen share permission was denied or dismissed.");
                } else {
                    console.warn("Screen sharing failed:", err);
                }
            }
        }
    }, [localState, activeRoom, user, safeEmit, stopScreenShareAndRevert, renegotiateAll]);

    const toggleDeafen = useCallback(() => {
        setLocalState(prev => ({ ...prev, isDeafened: !prev.isDeafened }));
    }, []);

    const toggleFacingMode = useCallback(async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        console.log(`[WebRTC] toggleFacingMode called, switching to: ${newMode}`);

        if (localState.isCameraOn && localStreamRef.current) {
            try {
                // 1. Release existing camera sensor lock FIRST (critical for Android Camera2 HAL)
                const oldTracks = localStreamRef.current.getVideoTracks().filter(t => !t.isPlaceholder);
                oldTracks.forEach(t => {
                    try { t.stop(); } catch (e) {}
                    try { localStreamRef.current.removeTrack(t); } catch (e) {}
                });

                // 2. Request new video stream with the new facingMode
                let newStream = null;
                try {
                    newStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: { ideal: newMode },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            frameRate: { ideal: 30 }
                        }
                    });
                } catch (idealErr) {
                    try {
                        newStream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: newMode }
                        });
                    } catch (secErr) {
                        const altDevice = availableDevices?.videoInputs?.find(d => 
                            newMode === 'environment' 
                                ? (d.label?.toLowerCase().includes('back') || d.label?.toLowerCase().includes('arka') || d.label?.toLowerCase().includes('environment') || d.label?.toLowerCase().includes('0'))
                                : (d.label?.toLowerCase().includes('front') || d.label?.toLowerCase().includes('ön') || d.label?.toLowerCase().includes('user') || d.label?.toLowerCase().includes('1'))
                        );
                        if (altDevice && altDevice.deviceId) {
                            newStream = await navigator.mediaDevices.getUserMedia({
                                video: { deviceId: { exact: altDevice.deviceId } }
                            });
                        } else {
                            newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        }
                    }
                }

                const newVideoTrack = newStream?.getVideoTracks()[0];
                if (!newVideoTrack) return;

                newVideoTrack.enabled = true;
                localStreamRef.current.addTrack(newVideoTrack);

                // 3. Replace track on all active peer connections
                for (const pc of peerConnectionsRef.current.values()) {
                    const senders = pc.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !s.track.label?.includes('screen')) ||
                                        pc.getTransceivers().find(t => t.sender && t.sender.track && t.sender.track.kind === 'video')?.sender ||
                                        pc.getTransceivers().find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video')?.sender;
                    if (videoSender) {
                        try {
                            await videoSender.replaceTrack(newVideoTrack);
                        } catch (e) {
                            console.warn("[WebRTC] replaceTrack error in toggleFacingMode:", e);
                        }
                    }
                }

                // 4. Update React participant list so local camera card immediately shows the switched camera
                updateParticipantList();
            } catch (err) {
                console.error("[WebRTC] Failed to switch camera facingMode:", err);
            }
        }
    }, [facingMode, localState.isCameraOn, availableDevices, updateParticipantList]);

    const setAudioOutput = useCallback(async (deviceIdOrRoute) => {
        if (Capacitor.isNativePlatform()) {
            const targetRoute = (deviceIdOrRoute === 'headset' || deviceIdOrRoute === 'speaker')
                ? deviceIdOrRoute
                : (String(deviceIdOrRoute).toLowerCase().includes('headset') || String(deviceIdOrRoute).toLowerCase().includes('kulaklık') ? 'headset' : 'speaker');
            try {
                await CallManager.setAudioOutputRoute({ route: targetRoute });
                setNativeAudioRoute(prev => ({ ...prev, currentRoute: targetRoute }));
            } catch (err) {
                console.warn("[CallManager] setAudioOutputRoute failed:", err);
            }
        } else {
            setSelectedAudioOutput(deviceIdOrRoute);
        }
    }, []);

    const setAudioInput = useCallback(async (deviceId) => {
        setSelectedAudioInput(deviceId);
        if (!activeRoom || !localStreamRef.current) return;
        try {
            console.log(`[WebRTC] Switching microphone input device to: ${deviceId}`);
            let newStream;
            try {
                newStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: deviceId && deviceId !== 'default' ? { ideal: deviceId } : undefined,
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        channelCount: 2,
                        sampleRate: 48000
                    }
                });
            } catch (strictErr) {
                console.warn("[WebRTC] Strict microphone constraints failed, retrying with fallback:", strictErr);
                newStream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
            }

            const newAudioTrack = newStream.getAudioTracks()[0];
            if (!newAudioTrack) return;

            const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
            if (oldAudioTrack) {
                try { oldAudioTrack.stop(); } catch (e) {}
                try { localStreamRef.current.removeTrack(oldAudioTrack); } catch (e) {}
            }
            newAudioTrack.enabled = !localState.isMuted;
            localStreamRef.current.addTrack(newAudioTrack);

            // Re-attach VAD so voice activity and speaking indicators continue working on new microphone!
            const localUserId = user?._id?.toString();
            if (localUserId) {
                attachVAD(localUserId, newAudioTrack);
            }

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
    }, [activeRoom, localState.isMuted, updateParticipantList, user, attachVAD]);

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

            newVideoTrack.enabled = true;
            localStreamRef.current.addTrack(newVideoTrack);

            // Replace track on all active peer connections FIRST
            for (const pc of peerConnectionsRef.current.values()) {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video' && !s.track.label?.includes('screen')) ||
                                    pc.getTransceivers().find(t => t.sender && t.sender.track && t.sender.track.kind === 'video')?.sender;
                if (videoSender) {
                    try {
                        await videoSender.replaceTrack(newVideoTrack);
                    } catch (err) {
                        console.warn("[WebRTC] Error replacing video track on peer connection:", err);
                    }
                }
            }

            // ONLY AFTER replaceTrack completes, stop old camera track
            const oldVideoTracks = localStreamRef.current.getVideoTracks().filter(t => !t.isPlaceholder && t.id !== newVideoTrack.id);
            oldVideoTracks.forEach(oldVideoTrack => {
                try { oldVideoTrack.stop(); } catch (e) {}
                try { localStreamRef.current.removeTrack(oldVideoTrack); } catch (e) {}
            });

            updateParticipantList();
        } catch (err) {
            console.error("Failed to switch video input device:", err);
        }
    }, [activeRoom, localState.isCameraOn, updateParticipantList]);

    // Chat messaging with rapid multi-click debounce
    const lastSentMsgRef = useRef({ text: '', time: 0 });
    const sendChatMessage = useCallback(async (text) => {
        const trimmed = text?.trim();
        if (!trimmed || !activeRoom) return;

        const now = Date.now();
        if (lastSentMsgRef.current.text === trimmed && (now - lastSentMsgRef.current.time) < 800) {
            console.log('[VoiceChat] Ignored duplicate rapid message send:', trimmed);
            return;
        }
        lastSentMsgRef.current = { text: trimmed, time: now };

        const msgId = `${now}-${Math.random().toString(36).substring(2, 9)}`;
        const timestamp = new Date().toISOString();

        safeEmit('voice:chat-message', {
            id: msgId,
            roomName: activeRoom.roomName,
            text: trimmed,
            senderName: user?.profile?.displayName || user?.username || 'Sen',
            senderId: user?._id?.toString(),
            timestamp,
        });
    }, [activeRoom, user, safeEmit]);

    // Handle incoming chat messages and history via socket (Single Source of Truth)
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (msgObj) => {
            const isLocal = String(msgObj.senderId) === String(user?._id);
            const msgId = msgObj.id || `${msgObj.senderId}-${msgObj.timestamp || Date.now()}-${msgObj.text}`;
            
            setChatMessages(prev => {
                const isDuplicate = prev.some(m => 
                    m.id === msgId || 
                    (String(m.senderId) === String(msgObj.senderId) && m.text === msgObj.text && Math.abs(new Date(m.timestamp).getTime() - new Date(msgObj.timestamp || Date.now()).getTime()) < 1000)
                );
                if (isDuplicate) {
                    return prev;
                }
                return [...prev, {
                    id: msgId,
                    senderName: msgObj.senderName,
                    senderId: msgObj.senderId,
                    text: msgObj.text,
                    timestamp: msgObj.timestamp || new Date().toISOString(),
                    isLocal
                }];
            });
            if (!isChatOpenRef.current && !isLocal) {
                setUnreadCount(prev => prev + 1);
            }
            if (!isLocal) {
                playInteractionSound('message');
            }
        };

        const handleChatHistory = (history) => {
            if (Array.isArray(history)) {
                setChatMessages(() => {
                    const uniqueMap = new Map();
                    history.forEach(msg => {
                        const id = msg.id || `${msg.senderId}-${msg.timestamp}-${msg.text}`;
                        if (!uniqueMap.has(id)) {
                            uniqueMap.set(id, {
                                id,
                                senderName: msg.senderName,
                                senderId: msg.senderId,
                                text: msg.text,
                                timestamp: msg.timestamp || new Date().toISOString(),
                                isLocal: String(msg.senderId) === String(user?._id)
                            });
                        }
                    });
                    return Array.from(uniqueMap.values());
                });
                if (!isChatOpenRef.current) {
                    const unread = history.filter(msg => String(msg.senderId) !== String(user?._id)).length;
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
    }, [socket, user, playInteractionSound]);

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

    const startWatchParty = useCallback(async (url, isLive = false, subtitles = [], title = '') => {
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
                safeEmit('voice:watch-start', { roomName: activeRoom.roomName, url: streamUrl, isLive: validatedLive, subtitles, title });
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
                safeEmit('voice:watch-start', { roomName: activeRoom.roomName, url, isLive: detectedLive, subtitles, title });
            }
        }
    }, [activeRoom, safeEmit]);

    const stopWatchParty = useCallback(() => {
        const roomName = activeRoom?.roomName || activeRoomRef.current?.roomName || watchParty?.roomName;
        if (roomName) {
            safeEmit('voice:watch-stop', { roomName });
        }
    }, [activeRoom, watchParty, safeEmit]);

    const sendWatchPlay = useCallback((time) => {
        if (activeRoom) {
            const exactTime = Number(Number(time || 0).toFixed(4));
            const now = getServerNow();
            const senderId = user?._id?.toString() || '';
            const cmdId = `${senderId || 'u'}-play-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const packet = { type: 'watch-play', roomName: activeRoom.roomName, time: exactTime, serverTimestamp: now, senderId, cmdId };
            // 1. P2P DataChannel broadcast (~10ms direct peer-to-peer)
            broadcastWatchDataChannel(packet);
            // 2. Socket.IO broadcast (0ms server relay + Redis persistence)
            safeEmit('voice:watch-play', packet);
            // 3. Immediate local imperative & state update
            dispatchWatchImperative('watch-play', packet);
            setWatchParty(prev => prev ? { ...prev, isPlaying: true, currentTime: exactTime, lastUpdated: now, serverTimestamp: now, lastActionBy: senderId } : null);
        }
    }, [activeRoom, safeEmit, getServerNow, user, broadcastWatchDataChannel, dispatchWatchImperative]);

    const sendWatchPause = useCallback((time) => {
        if (activeRoom) {
            const exactTime = Number(Number(time || 0).toFixed(4));
            const now = getServerNow();
            const senderId = user?._id?.toString() || '';
            const cmdId = `${senderId || 'u'}-pause-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const packet = { type: 'watch-pause', roomName: activeRoom.roomName, time: exactTime, serverTimestamp: now, senderId, cmdId };
            // 1. P2P DataChannel broadcast (~10ms direct peer-to-peer)
            broadcastWatchDataChannel(packet);
            // 2. Socket.IO broadcast (0ms server relay + Redis persistence)
            safeEmit('voice:watch-pause', packet);
            // 3. Immediate local imperative & state update
            dispatchWatchImperative('watch-pause', packet);
            setWatchParty(prev => prev ? { ...prev, isPlaying: false, currentTime: exactTime, lastUpdated: now, serverTimestamp: now, lastActionBy: senderId } : null);
        }
    }, [activeRoom, safeEmit, getServerNow, user, broadcastWatchDataChannel, dispatchWatchImperative]);

    const sendWatchSeek = useCallback((time) => {
        if (activeRoom) {
            const exactTime = Number(Number(time || 0).toFixed(4));
            const now = getServerNow();
            const senderId = user?._id?.toString() || '';
            const cmdId = `${senderId || 'u'}-seek-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const packet = { type: 'watch-seek', roomName: activeRoom.roomName, time: exactTime, serverTimestamp: now, senderId, cmdId };
            broadcastWatchDataChannel(packet);
            safeEmit('voice:watch-seek', packet);
            dispatchWatchImperative('watch-seek', packet);
            setWatchParty(prev => prev ? { ...prev, currentTime: exactTime, lastUpdated: now, serverTimestamp: now, lastActionBy: senderId } : null);
        }
    }, [activeRoom, safeEmit, getServerNow, user, broadcastWatchDataChannel, dispatchWatchImperative]);

    const requestWatchSync = useCallback(() => {
        const roomName = activeRoom?.roomName || activeRoomRef.current?.roomName || watchParty?.roomName;
        if (roomName) {
            safeEmit('voice:watch-request-sync', { roomName });
        }
    }, [activeRoom, watchParty, safeEmit]);

    const sendWatchSubtitle = useCallback((subtitle) => {
        const roomName = activeRoom?.roomName || activeRoomRef.current?.roomName || watchParty?.roomName;
        if (!subtitle) return;

        // Subtitle off is strictly individual / local per-user. Never broadcast 'off' to other users!
        if (subtitle.type === 'off') {
            setWatchParty(prev => prev ? { ...prev, activeSubtitle: { type: 'off', label: 'Kapalı' } } : null);
            return;
        }

        if (roomName && subtitle.rawContent) {
            const subPayload = {
                type: subtitle.type || 'custom',
                label: subtitle.label || 'Altyazı',
                rawContent: subtitle.rawContent || '',
                lang: subtitle.lang || 'tr',
                file: subtitle.file || ''
            };
            console.log(`[VoiceContext] Emitting voice:watch-subtitle to ${roomName}:`, subPayload.label);
            safeEmit('voice:watch-subtitle', { 
                roomName, 
                subtitle: subPayload
            });
            setWatchParty(prev => {
                if (!prev) return null;
                const sharedList = Array.isArray(prev.sharedSubtitles) ? [...prev.sharedSubtitles] : [];
                if (subPayload.label) {
                    const existingIdx = sharedList.findIndex(s => s.label === subPayload.label);
                    if (existingIdx >= 0) {
                        sharedList[existingIdx] = subPayload;
                    } else {
                        sharedList.push(subPayload);
                    }
                }
                return {
                    ...prev,
                    activeSubtitle: subPayload,
                    sharedSubtitles: sharedList,
                    lastSubActionBy: user?._id || user?.id,
                    lastSubActionName: user?.username || 'Siz'
                };
            });
        } else {
            console.warn('[VoiceContext] sendWatchSubtitle skipped: missing roomName or rawContent', { roomName, subtitle });
        }
    }, [activeRoom, watchParty, safeEmit, user]);

    const sendWatchStopVote = useCallback(() => {
        const roomName = activeRoom?.roomName || activeRoomRef.current?.roomName || watchParty?.roomName;
        if (roomName) {
            const uId = user?._id?.toString() || user?.id?.toString();
            const uName = user?.profile?.displayName || user?.username || 'Kullanıcı';
            safeEmit('voice:watch-stop-vote', { roomName, userId: uId, username: uName });
        }
    }, [activeRoom, watchParty, safeEmit, user]);

    const sendWatchStopCancel = useCallback(() => {
        const roomName = activeRoom?.roomName || activeRoomRef.current?.roomName || watchParty?.roomName;
        if (roomName) {
            safeEmit('voice:watch-stop-cancel', { roomName });
            setWatchStopVoteStatus(null);
        }
    }, [activeRoom, watchParty, safeEmit]);

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

    // Sync local call state (mic, camera, screenshare) to Android native PiP & notification bar
    useEffect(() => {
        if (Capacitor.isNativePlatform() && activeRoom) {
            CallManager.updateCallState({
                isMuted: localState.isMuted,
                isCameraOn: localState.isCameraOn,
                isScreenSharing: localState.isScreenSharing
            }).catch(() => {});
        }
    }, [activeRoom, localState.isMuted, localState.isCameraOn, localState.isScreenSharing]);

    // Handle Android Native Notification Bar and PiP RemoteAction Events
    useEffect(() => {
        const handleRemoteLeave = () => {
            console.log("[Native Action] oxypace:leave_call triggered");
            disconnectFromChannel();
        };
        const handleRemoteToggleMic = () => {
            console.log("[Native Action] oxypace:toggle_mic triggered");
            toggleMicrophone();
        };
        const handleRemoteToggleCamera = () => {
            console.log("[Native Action] oxypace:toggle_camera triggered");
            toggleCamera();
        };
        const handleRemoteToggleScreen = () => {
            console.log("[Native Action] oxypace:toggle_screenshare triggered");
            toggleScreenShare();
        };
        const handleRemoteScreenshareStopped = () => {
            console.log("[Native Action] oxypace:screenshare_stopped triggered");
            stopScreenShareAndRevert();
        };

        window.addEventListener('oxypace:leave_call', handleRemoteLeave);
        window.addEventListener('oxypace:toggle_mic', handleRemoteToggleMic);
        window.addEventListener('oxypace:toggle_camera', handleRemoteToggleCamera);
        window.addEventListener('oxypace:toggle_screenshare', handleRemoteToggleScreen);
        window.addEventListener('oxypace:screenshare_stopped', handleRemoteScreenshareStopped);

        return () => {
            window.removeEventListener('oxypace:leave_call', handleRemoteLeave);
            window.removeEventListener('oxypace:toggle_mic', handleRemoteToggleMic);
            window.removeEventListener('oxypace:toggle_camera', handleRemoteToggleCamera);
            window.removeEventListener('oxypace:toggle_screenshare', handleRemoteToggleScreen);
            window.removeEventListener('oxypace:screenshare_stopped', handleRemoteScreenshareStopped);
        };
    }, [disconnectFromChannel, toggleMicrophone, toggleCamera, toggleScreenShare, stopScreenShareAndRevert]);

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
        nativeAudioRoute,
        watchParty,
        startWatchParty,
        stopWatchParty,
        watchStopVoteStatus,
        sendWatchStopVote,
        sendWatchStopCancel,
        sendWatchPlay,
        sendWatchPause,
        sendWatchSeek,
        requestWatchSync,
        sendWatchSubtitle,
        getServerNow,
        serverOffsetRef,
        isChatOpen,
        setIsChatOpen,
        unreadCount,
        setUnreadCount,
        userVolume,
        setUserVolume,
        callQualityMode,
        setCallQualityMode,
        consensusRule: activeRoom?.consensusRule || watchStopVoteStatus?.rule || 'all',
        socket
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
    const audioCtxRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const audioEl = useRef(null);

    useEffect(() => {
        if (!track) return;

        let ctx = null;
        let source = null;
        let gain = null;

        // Use Web Audio API to output directly through Android STREAM_MUSIC (Media channel) at 48kHz Ultra HD Stereo.
        // This completely bypasses Android's telephony STREAM_VOICE_CALL, preventing the telephone speech DSP filter
        // and ensuring background media (Spotify) is never ducked or silenced.
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                ctx = new AudioContextClass({ sampleRate: 48000 });
                audioCtxRef.current = ctx;

                if (audioOutputId && typeof ctx.setSinkId === 'function') {
                    ctx.setSinkId(audioOutputId).catch(() => {});
                }

                const stream = new MediaStream([track]);
                source = ctx.createMediaStreamSource(stream);
                sourceNodeRef.current = source;

                gain = ctx.createGain();
                gain.gain.value = muted ? 0 : (volume ?? 1.0);
                gainNodeRef.current = gain;

                source.connect(gain);
                gain.connect(ctx.destination);

                if (ctx.state === 'suspended') {
                    const resume = () => {
                        ctx.resume().catch(() => {});
                        window.removeEventListener('click', resume);
                        window.removeEventListener('touchstart', resume);
                    };
                    window.addEventListener('click', resume, { once: true });
                    window.addEventListener('touchstart', resume, { once: true });
                }
            }
        } catch (e) {
            console.warn('[Web Audio] Fallback to HTML5 audio element for track:', e);
            if (audioEl.current) {
                audioEl.current.srcObject = new MediaStream([track]);
                audioEl.current.muted = muted;
                audioEl.current.volume = volume ?? 1.0;
                audioEl.current.play().catch(() => {});
            }
        }

        return () => {
            if (source) {
                try { source.disconnect(); } catch (e) {}
            }
            if (gain) {
                try { gain.disconnect(); } catch (e) {}
            }
            if (ctx && ctx.state !== 'closed') {
                try { ctx.close(); } catch (e) {}
            }
            if (audioEl.current) {
                audioEl.current.srcObject = null;
            }
        };
    }, [track, audioOutputId]);

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = muted ? 0 : (volume ?? 1.0);
        }
        if (audioEl.current) {
            audioEl.current.muted = muted;
            audioEl.current.volume = volume ?? 1.0;
        }
    }, [muted, volume]);

    return <audio ref={audioEl} autoPlay playsInline muted style={{ display: 'none' }} />;
};
