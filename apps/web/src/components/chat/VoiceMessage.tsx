import { useRef, useState, useEffect } from "react";
import { RiPlayFill, RiPauseFill } from "react-icons/ri";

interface VoiceMessageProps {
  src: string;
  isMe: boolean;
}

export default function VoiceMessage({ src, isMe }: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);       // 0–100
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoaded = () => setDurationSec(isFinite(a.duration) ? a.duration : 0);
    const onTime = () => {
      setCurrentSec(a.currentTime);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentSec(0); };

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); } else { a.pause(); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const BAR_COUNT = 24;
  // deterministic heights from src hash — consistent across re-renders
  const bars = Array.from({ length: BAR_COUNT }, (_, i) =>
    25 + Math.abs(Math.sin(i * 0.72 + src.charCodeAt(i % src.length) * 0.01)) * 75
  );
  const filledBars = Math.round((progress / 100) * BAR_COUNT);

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl min-w-[210px] max-w-[260px]
      ${isMe ? "bg-[#7269ef] rounded-br-sm" : "bg-[#2e3547] rounded-bl-sm"}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
          ${isMe ? "bg-white/20 hover:bg-white/30" : "bg-[#7269ef]/20 hover:bg-[#7269ef]/30"}`}
      >
        {isPlaying
          ? <RiPauseFill size={16} className={isMe ? "text-white" : "text-[#7269ef]"} />
          : <RiPlayFill  size={16} className={isMe ? "text-white" : "text-[#7269ef]"} />}
      </button>

      {/* Waveform + scrub bar */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Waveform bars — clickable for seek */}
        <div
          className="flex gap-[2px] items-end h-6 cursor-pointer"
          onClick={handleSeek}
        >
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-full transition-colors"
              style={{
                height: `${h}%`,
                background: i < filledBars
                  ? (isMe ? "rgba(255,255,255,0.95)" : "#7269ef")
                  : (isMe ? "rgba(255,255,255,0.35)" : "rgba(114,105,239,0.3)"),
              }}
            />
          ))}
        </div>

        {/* Scrub track */}
        <div
          className="h-0.5 rounded-full overflow-hidden cursor-pointer"
          style={{ background: isMe ? "rgba(255,255,255,0.2)" : "rgba(114,105,239,0.2)" }}
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: isMe ? "rgba(255,255,255,0.8)" : "#7269ef",
            }}
          />
        </div>
      </div>

      {/* Time */}
      <span className={`text-[10px] shrink-0 tabular-nums ${isMe ? "text-white/70" : "text-[#6b7280]"}`}>
        {isPlaying || currentSec > 0 ? fmt(currentSec) : fmt(durationSec)}
      </span>
    </div>
  );
}
