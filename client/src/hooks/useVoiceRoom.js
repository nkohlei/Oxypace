import { useEffect, useRef, useState, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';

/**
 * Custom hook for managing a LiveKit WebRTC room connection.
 * Handles room lifecycle, track management, and participant events.
 */
export const useVoiceRoom = ({
    onConnected,
    onDisconnected,
    onParticipantJoined,
    onParticipantLeft,
    onTrackSubscribed,
    onError,
} = {}) => {
    const roomRef = useRef(null);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [localParticipant, setLocalParticipant] = useState(null);
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    const [activeSpeakers, setActiveSpeakers] = useState([]);
    const [audioTracks, setAudioTracks] = useState([]);
    const [videoTracks, setVideoTracks] = useState([]);

    // ─── Helpers (stable, no dependencies) ───
    const updateParticipants = useCallback((room) => {
        if (!room) return;
        const participants = Array.from(room.remoteParticipants.values()).map((p) => ({
            identity: p.identity,
            name: p.name,
            metadata: p.metadata,
            isSpeaking: p.isSpeaking,
            isMicrophoneEnabled: p.isMicrophoneEnabled,
            isCameraEnabled: p.isCameraEnabled,
            isScreenShareEnabled: p.isScreenShareEnabled,
            connectionQuality: p.connectionQuality,
            audioTracks: Array.from(p.audioTrackPublications.values()),
            videoTracks: Array.from(p.videoTrackPublications.values()),
        }));
        setRemoteParticipants(participants);
    }, []);

    const updateTracks = useCallback((room) => {
        if (!room) return;
        const audio = [];
        const video = [];

        for (const p of room.remoteParticipants.values()) {
            for (const pub of p.audioTrackPublications.values()) {
                if (pub.track) audio.push({ track: pub.track, participant: p });
            }
            for (const pub of p.videoTrackPublications.values()) {
                if (pub.track) video.push({ track: pub.track, participant: p, source: pub.source });
            }
        }

        setAudioTracks(audio);
        setVideoTracks(video);
    }, []);

    // ─── Connect to Room ───
    const connect = useCallback(async (connectToken, connectUrl) => {
        if (!connectToken || !connectUrl) {
            console.error('Token and serverUrl are required to connect');
            return;
        }

        try {
            // Disconnect existing room if any
            if (roomRef.current) {
                await roomRef.current.disconnect();
                roomRef.current = null;
            }

            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: { width: 640, height: 480, frameRate: 24 },
                },
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            // ─── Event Handlers ───
            room.on(RoomEvent.ConnectionStateChanged, (state) => {
                setConnectionState(state);
                if (state === ConnectionState.Connected) {
                    setLocalParticipant(room.localParticipant);
                    updateParticipants(room);
                    onConnected?.();
                } else if (state === ConnectionState.Disconnected) {
                    onDisconnected?.();
                }
            });

            room.on(RoomEvent.ParticipantConnected, (participant) => {
                updateParticipants(room);
                onParticipantJoined?.(participant);
            });

            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                updateParticipants(room);
                onParticipantLeft?.(participant);
            });

            room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                updateTracks(room);
                onTrackSubscribed?.(track, publication, participant);
            });

            room.on(RoomEvent.TrackUnsubscribed, () => {
                updateTracks(room);
            });

            room.on(RoomEvent.TrackMuted, () => {
                updateTracks(room);
                updateParticipants(room);
            });

            room.on(RoomEvent.TrackUnmuted, () => {
                updateTracks(room);
                updateParticipants(room);
            });

            room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                setActiveSpeakers(speakers.map((s) => s.identity));
            });

            room.on(RoomEvent.Disconnected, () => {
                setConnectionState('disconnected');
                setLocalParticipant(null);
                setRemoteParticipants([]);
                setActiveSpeakers([]);
                setAudioTracks([]);
                setVideoTracks([]);
            });

            roomRef.current = room;

            // Connect to LiveKit server
            await room.connect(connectUrl, connectToken);
        } catch (error) {
            console.error('Failed to connect to voice room:', error);
            setConnectionState('disconnected');
            onError?.(error);
        }
    }, [updateParticipants, updateTracks]);

    // ─── Disconnect ───
    const disconnect = useCallback(async () => {
        if (roomRef.current) {
            await roomRef.current.disconnect();
            roomRef.current = null;
        }
        setConnectionState('disconnected');
        setLocalParticipant(null);
        setRemoteParticipants([]);
        setActiveSpeakers([]);
        setAudioTracks([]);
        setVideoTracks([]);
    }, []);

    // ─── Media Controls ───
    const toggleMicrophone = useCallback(async (enabled) => {
        if (!roomRef.current?.localParticipant) return;
        try {
            await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
        } catch (error) {
            console.error('Failed to toggle microphone:', error);
        }
    }, []);

    const toggleCamera = useCallback(async (enabled) => {
        if (!roomRef.current?.localParticipant) return;
        try {
            await roomRef.current.localParticipant.setCameraEnabled(enabled);
        } catch (error) {
            console.error('Failed to toggle camera:', error);
        }
    }, []);

    const toggleScreenShare = useCallback(async (enabled) => {
        if (!roomRef.current?.localParticipant) return;
        try {
            await roomRef.current.localParticipant.setScreenShareEnabled(enabled);
        } catch (error) {
            console.error('Failed to toggle screen share:', error);
        }
    }, []);

    // ─── Cleanup on Unmount ───
    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
        };
    }, []);

    return {
        room: roomRef.current,
        connectionState,
        localParticipant,
        remoteParticipants,
        activeSpeakers,
        audioTracks,
        videoTracks,
        connect,
        disconnect,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        isConnected: connectionState === ConnectionState.Connected || connectionState === 'connected',
        isConnecting: connectionState === ConnectionState.Connecting || connectionState === 'connecting',
    };
};

export default useVoiceRoom;
