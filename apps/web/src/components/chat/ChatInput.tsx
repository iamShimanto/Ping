import {
  RiEmotionLine, RiMicLine, RiSendPlaneFill, RiMoreLine,
  RiImageAddLine, RiCloseLine, RiStopCircleLine,
} from "react-icons/ri";

interface ChatInputProps {
  message: string;
  isSending: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  showInputEmoji: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onMessageChange: (val: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecording: (send: boolean) => void;
  onToggleEmoji: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmojiInsert: (emoji: string) => void;
}

const EMOJI_ROWS = [
  ["😀","😂","🤣","😍","🥰","😘","😎","🤩","🥳","😅","😇","🤭"],
  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💯","🔥","✨","⚡"],
  ["👍","👎","👏","🙌","🤝","👋","🤞","✌️","🤙","💪","🫶","🙏"],
  ["😭","😢","😤","😠","😡","🤬","😱","😨","😰","😓","🤔","🤯"],
  ["🎉","🎊","🎈","🎁","🏆","🥇","⭐","🌟","💎","🚀","🌈","🎶"],
  ["🍕","🍔","🍟","🌮","🍜","🍣","🍩","🍪","🎂","☕","🧋","🍺"],
];

const formatDuration = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export default function ChatInput({
  message, isSending, isRecording, recordingSeconds, showInputEmoji,
  inputRef, fileInputRef,
  onMessageChange, onSend, onStartRecording, onStopRecording,
  onToggleEmoji, onFileChange, onEmojiInsert,
}: ChatInputProps) {
  return (
    <>
      {/* Emoji panel */}
      {showInputEmoji && (
        <div className="bg-[#2a3042] border-t border-[#323a4d] px-3 py-2 w-full">
          {EMOJI_ROWS.map((row, ri) => (
            <div key={ri} className="flex w-full mb-1">
              {row.map((emoji) => (
                <button
                  key={emoji}
                  className="flex-1 text-xl hover:scale-125 transition-transform leading-none h-8 flex items-center justify-center rounded hover:bg-[#323a4d]"
                  onClick={() => onEmojiInsert(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="bg-[#2a3042] border-t border-[#323a4d] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shrink-0 mb-14 sm:mb-0">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        {isRecording ? (
          <>
            <button onClick={() => onStopRecording(false)} className="text-red-400 hover:text-red-300 shrink-0" title="Cancel">
              <RiCloseLine size={22} />
            </button>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <div className="flex gap-0.5 items-end h-5 flex-1 overflow-hidden">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-[#7269ef] rounded-full animate-pulse"
                    style={{ height: `${30 + Math.abs(Math.sin(i * 0.6 + recordingSeconds)) * 70}%`, animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
              <span className="text-sm text-red-400 font-mono shrink-0">{formatDuration(recordingSeconds)}</span>
            </div>
            <button
              onClick={() => onStopRecording(true)}
              className="w-9 h-9 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] shrink-0"
              title="Send voice"
            >
              <RiStopCircleLine size={18} />
            </button>
          </>
        ) : (
          <>
            <button className="text-[#6b7280] hover:text-[#a3aed0] shrink-0"><RiMoreLine size={18} /></button>
            <button
              onClick={onToggleEmoji}
              className={`shrink-0 ${showInputEmoji ? "text-[#7269ef]" : "text-[#6b7280] hover:text-[#a3aed0]"}`}
              title="Emoji"
            >
              <RiEmotionLine size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="text-[#6b7280] hover:text-[#a3aed0] shrink-0" title="Send image">
              <RiImageAddLine size={18} />
            </button>
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#4b5563] outline-none min-w-0"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            />
            {message.trim() ? (
              <button
                onClick={onSend}
                disabled={isSending}
                className="w-9 h-9 bg-[#7269ef] rounded-full flex items-center justify-center text-white hover:bg-[#6055d8] shrink-0 disabled:opacity-50"
              >
                <RiSendPlaneFill size={16} />
              </button>
            ) : (
              <button
                onClick={onStartRecording}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6b7280] hover:text-[#7269ef] hover:bg-[#7269ef]/10 shrink-0"
                title="Hold to record"
              >
                <RiMicLine size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
