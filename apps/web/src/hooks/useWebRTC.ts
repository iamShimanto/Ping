import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCallConnected, endCall, setScreenSharing } from "../store/slices/callSlice";
import { socket } from "../socket/socket";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC() {
  const dispatch = useAppDispatch();
  const callState = useAppSelector((s) => s.call);
  const currentUser = useAppSelector((s) => s.auth.user);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Refs for video elements — set by CallModal
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingOfferRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && callState.peerId) {
        socket.emit("call:ice-candidate", {
          conversationId: callState.conversationId,
          to: callState.peerId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (callState.callType === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      } else if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") dispatch(setCallConnected());
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanup();
        dispatch(endCall());
      }
    };

    return pc;
  }, [callState.peerId, callState.conversationId, callState.callType, dispatch, cleanup]);

  const getLocalStream = useCallback(async () => {
    const constraints = callState.callType === "video"
      ? { audio: true, video: { width: 1280, height: 720 } }
      : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (callState.callType === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
    return stream;
  }, [callState.callType]);

  // ── Start outgoing call ───────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!callState.peerId || !callState.conversationId) return;
    const stream = await getLocalStream();
    const pc = createPeerConnection();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call:offer", { conversationId: callState.conversationId, to: callState.peerId, offer });
  }, [callState.peerId, callState.conversationId, getLocalStream, createPeerConnection]);

  // ── Accept incoming call (user clicks Accept) ─────────────────────────────
  const acceptCall = useCallback(async () => {
    const offer = pendingOfferRef.current;
    if (!offer || !callState.peerId || !callState.conversationId) return;
    const stream = await getLocalStream();
    const pc = createPeerConnection();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("call:answer", { conversationId: callState.conversationId, to: callState.peerId, answer });
    pendingOfferRef.current = null;
  }, [callState.peerId, callState.conversationId, getLocalStream, createPeerConnection]);

  // ── Hang up ───────────────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    if (callState.peerId && callState.conversationId) {
      socket.emit("call:end", { conversationId: callState.conversationId, to: callState.peerId });
    }
    cleanup();
    dispatch(endCall());
  }, [callState.peerId, callState.conversationId, cleanup, dispatch]);

  // ── Reject ────────────────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (callState.peerId && callState.conversationId) {
      socket.emit("call:reject", { conversationId: callState.conversationId, to: callState.peerId });
    }
    dispatch(endCall());
  }, [callState.peerId, callState.conversationId, dispatch]);

  // ── Mute / camera ─────────────────────────────────────────────────────────
  const setMuted = useCallback((muted: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
  }, []);

  const setCameraOff = useCallback((off: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !off; });
  }, []);

  // ── Screen share ───────────────────────────────────────────────────────────
  const stopScreenShare = useCallback(async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    const cameraTrack = localStreamRef.current.getVideoTracks()[0];
    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    dispatch(setScreenSharing(false));
  }, [dispatch]);

  const startScreenShare = useCallback(async () => {
    if (!pcRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      dispatch(setScreenSharing(true));

      // Revert when user stops via browser's native stop button
      screenTrack.onended = () => { stopScreenShare(); };
    } catch {
      // User cancelled or permission denied
    }
  }, [dispatch, stopScreenShare]);

  // ── Socket signal handlers ────────────────────────────────────────────────
  useEffect(() => {
    const onOffer = ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      pendingOfferRef.current = offer;
    };
    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        dispatch(setCallConnected());
      }
    };
    const onIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };
    const onRejected = () => { cleanup(); dispatch(endCall()); };
    const onEnded = () => { cleanup(); dispatch(endCall()); };

    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
    };
  }, [cleanup, dispatch]);

  // Auto-start when outgoing call is initiated
  useEffect(() => {
    if (callState.status === "calling" && currentUser) startCall();
  }, [callState.status, currentUser, startCall]);

  // Sync mute/camera to tracks when toggled
  useEffect(() => { setMuted(callState.isMuted); }, [callState.isMuted, setMuted]);
  useEffect(() => { setCameraOff(callState.isCameraOff); }, [callState.isCameraOff, setCameraOff]);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  return { remoteAudioRef, localVideoRef, remoteVideoRef, hangUp, rejectCall, acceptCall, startScreenShare, stopScreenShare };
}
