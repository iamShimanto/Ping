import { useEffect, useRef, useState } from "react";
import {
  RiPhoneLine, RiPhoneFill, RiMicLine, RiMicOffLine,
  RiVideoLine, RiVideoOffLine,
} from "react-icons/ri";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { toggleMute, toggleCamera } from "../../store/slices/callSlice";
import { useWebRTC } from "../../hooks/useWebRTC";
import Avatar from "./Avatar";

function useRingtone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playRing = () => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    [440, 480].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.16);
    });
    setTimeout(() => { ctx.close(); ctxRef.current = null; }, 600);
  };

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    playRing();
    intervalRef.current = setInterval(playRing, 3000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      ctxRef.current?.close();
    };
  }, [active]);
}

export default function CallModal() {
  const dispatch = useAppDispatch();
  const call = useAppSelector((s) => s.call);
  const { remoteAudioRef, localVideoRef, remoteVideoRef, hangUp, rejectCall, acceptCall } = useWebRTC();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRinging = (call.status === "calling" && call.peerOnline) || call.status === "incoming";
  useRingtone(isRinging);

  useEffect(() => {
    if (call.status === "connected") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [call.status]);

  if (call.status === "idle") return null;

  const formatElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const statusLabel =
    call.status === "incoming"
      ? `Incoming ${call.callType} call…`
      : call.status === "calling"
        ? call.peerOnline ? "Ringing…" : "Calling…"
        : formatElapsed(elapsed);

  const isVideo = call.callType === "video";

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isVideo ? "bg-black" : "bg-black/70 backdrop-blur-sm p-4"}`}>
        <div className={`bg-[#1e2433] overflow-hidden shadow-2xl ${isVideo ? "w-full h-full flex flex-col" : "w-full max-w-xs rounded-2xl border border-[#323a4d]"}`}>

          {/* Video area */}
          {isVideo ? (
            <div className="relative bg-black flex-1 min-h-0">
              {/* Remote video (full) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Fallback avatar when no remote video yet */}
              {call.status !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1e2433]">
                  <div className="relative">
                    <Avatar initials={call.peerName.slice(0, 2).toUpperCase()} name={call.peerName} size="xl" src={call.peerAvatar} />
                    {isRinging && (
                      <>
                        <span className="absolute inset-0 rounded-full border-2 border-[#7269ef]/50 animate-ping" />
                        <span className="absolute -inset-2 rounded-full border border-[#7269ef]/30 animate-ping [animation-delay:300ms]" />
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">{call.peerName}</p>
                    <p className="text-[#a3aed0] text-sm animate-pulse">{statusLabel}</p>
                  </div>
                </div>
              )}
              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-xl overflow-hidden border-2 border-white/20 bg-[#2a3042] shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${call.isCameraOff ? "opacity-0" : ""}`}
                />
                {call.isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RiVideoOffLine size={20} className="text-[#6b7280]" />
                  </div>
                )}
              </div>
              {/* Status overlay when connected */}
              {call.status === "connected" && (
                <div className="absolute top-3 left-3 bg-black/50 rounded-full px-2.5 py-1">
                  <span className="text-white text-xs font-mono">{formatElapsed(elapsed)}</span>
                </div>
              )}
            </div>
          ) : (
            /* Audio call — avatar layout */
            <div className="bg-linear-to-b from-[#7269ef]/30 to-transparent pt-8 pb-6 flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar initials={call.peerName.slice(0, 2).toUpperCase()} name={call.peerName} size="xl" src={call.peerAvatar} />
                {isRinging && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-[#7269ef]/50 animate-ping" />
                    <span className="absolute -inset-2 rounded-full border border-[#7269ef]/30 animate-ping [animation-delay:300ms]" />
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg leading-tight">{call.peerName}</p>
                <p className={`text-sm mt-0.5 ${call.status === "connected" ? "text-green-400" : "text-[#a3aed0] animate-pulse"}`}>
                  {statusLabel}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={`flex items-center justify-center gap-6 shrink-0 ${isVideo ? "px-8 py-5 bg-black/80" : "px-8 py-6"}`}>
            {call.status === "incoming" ? (
              <>
                <div className="flex flex-col items-center gap-1.5">
                  <button onClick={rejectCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg">
                    <RiPhoneLine size={24} className="rotate-[135deg]" />
                  </button>
                  <span className="text-[11px] text-[#6b7280]">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <button onClick={acceptCall} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg">
                    {isVideo ? <RiVideoLine size={22} /> : <RiPhoneFill size={24} />}
                  </button>
                  <span className="text-[11px] text-[#6b7280]">Accept</span>
                </div>
              </>
            ) : (
              <>
                {/* Mute */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => dispatch(toggleMute())}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                      ${call.isMuted ? "bg-[#7269ef] text-white" : "bg-[#2a3042] text-[#a3aed0] hover:bg-[#323a4d]"}`}
                  >
                    {call.isMuted ? <RiMicOffLine size={20} /> : <RiMicLine size={20} />}
                  </button>
                  <span className="text-[11px] text-[#6b7280]">{call.isMuted ? "Unmute" : "Mute"}</span>
                </div>

                {/* Camera (video only) */}
                {isVideo && (
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => dispatch(toggleCamera())}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                        ${call.isCameraOff ? "bg-[#7269ef] text-white" : "bg-[#2a3042] text-[#a3aed0] hover:bg-[#323a4d]"}`}
                    >
                      {call.isCameraOff ? <RiVideoOffLine size={20} /> : <RiVideoLine size={20} />}
                    </button>
                    <span className="text-[11px] text-[#6b7280]">{call.isCameraOff ? "Show" : "Hide"}</span>
                  </div>
                )}

                {/* End */}
                <div className="flex flex-col items-center gap-1.5">
                  <button onClick={hangUp} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg">
                    <RiPhoneLine size={24} className="rotate-[135deg]" />
                  </button>
                  <span className="text-[11px] text-[#6b7280]">End</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
