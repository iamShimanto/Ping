import { useState } from "react";
import {
  RiEmotionLine, RiDownloadLine, RiThumbUpLine,
  RiDeleteBinLine, RiBookmarkLine, RiBookmarkFill, RiCloseLine, RiCheckLine,
} from "react-icons/ri";
import Avatar from "./Avatar";
import VoiceMessage from "./VoiceMessage";
import type { Message } from "../../api/conversation/conversationApi";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  bookmarked: boolean;
  emojiPickerOpen: boolean;
  formatTime: (iso: string) => string;
  onReact: (messageId: string, emoji: string) => void;
  onLike: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onToggleBookmark: (messageId: string) => void;
  onOpenLightbox: (url: string) => void;
  onToggleEmojiPicker: (id: string | null) => void;
  msgRef: (el: HTMLDivElement | null) => void;
}

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥", "🎉"];

export default function MessageBubble({
  msg, isMe, currentUserId, bookmarked, emojiPickerOpen,
  formatTime, onReact, onLike, onDelete, onToggleBookmark,
  onOpenLightbox, onToggleEmojiPicker, msgRef,
}: MessageBubbleProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reactionGroups = (msg.reactions ?? []).reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].mine = true;
    return acc;
  }, {});

  return (
    <div
      ref={msgRef}
      className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isMe && (
        <Avatar
          initials={msg.sender.fullName.slice(0, 2).toUpperCase()}
          name={msg.sender.fullName}
          size="xs"
          className="mb-4 shrink-0"
          src={msg.sender.avatar ?? undefined}
        />
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-xs ${isMe ? "items-end" : "items-start"}`}>
        {msg.isDeleted ? (
          <div className={`px-3 sm:px-4 py-2.5 rounded-2xl text-sm italic text-[#6b7280]
            ${isMe ? "bg-[#3d4554] rounded-br-sm" : "bg-[#2e3547] rounded-bl-sm"}`}>
            This message was deleted
          </div>
        ) : msg.contentType === "image" ? (
          <div
            className={`rounded-2xl overflow-hidden cursor-pointer ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
            onClick={() => onOpenLightbox(msg.fileUrl ?? msg.content)}
          >
            <img
              src={msg.fileUrl ?? msg.content}
              alt="image"
              className="max-w-55 sm:max-w-xs max-h-64 object-cover block"
              loading="lazy"
            />
          </div>
        ) : msg.contentType === "voice" ? (
          <VoiceMessage src={msg.fileUrl ?? msg.content} isMe={isMe} />
        ) : msg.contentType === "file" ? (
          <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border
            ${isMe ? "bg-[#7269ef] border-[#6055d8]" : "bg-[#2e3547] border-[#323a4d]"}`}>
            <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center shrink-0">
              <span className="text-green-400 text-xs">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${isMe ? "text-white" : "text-[#a3aed0]"}`}>{msg.fileName ?? msg.content}</p>
              {msg.fileSize && <p className={`text-xs ${isMe ? "text-white/70" : "text-[#6b7280]"}`}>{msg.fileSize} bytes</p>}
            </div>
            <button className={`hover:opacity-80 ${isMe ? "text-white" : "text-[#6b7280]"}`}><RiDownloadLine size={16} /></button>
          </div>
        ) : (
          <div className={`px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isMe ? "bg-[#7269ef] text-white rounded-br-sm" : "bg-[#2e3547] text-[#a3aed0] rounded-bl-sm"}`}>
            {msg.content}
          </div>
        )}

        {/* Reaction chips */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg._id, emoji)}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors
                  ${mine
                    ? "bg-[#7269ef]/20 border-[#7269ef]/60 text-[#7269ef]"
                    : "bg-[#323a4d] border-[#3d4554] text-[#a3aed0] hover:border-[#7269ef]/40"}`}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px]">{count}</span>}
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1.5 text-[10px] text-[#6b7280] ${isMe ? "flex-row-reverse" : ""}`}>
          {isMe && !msg.isDeleted && (
            msg.readBy.some((id) => id !== currentUserId)
              ? <span className="text-[#7269ef]" title="Seen">✓✓</span>
              : <span className="text-[#6b7280]" title="Delivered">✓✓</span>
          )}
          <span>{formatTime(msg.createdAt)}</span>
          {!isMe && <span className="text-[#6b7280] hidden sm:inline">{msg.sender.fullName}</span>}
          {!msg.isDeleted && (msg.likes?.length ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-yellow-400">
              👍 {msg.likes.length > 1 ? msg.likes.length : ""}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="opacity-0 group-hover:opacity-100 mb-6 hidden sm:flex flex-col gap-1 relative">
        {!msg.isDeleted && (
          <div className="relative">
            <button
              onClick={() => onToggleEmojiPicker(emojiPickerOpen ? null : msg._id)}
              className="text-[#6b7280] hover:text-[#a3aed0]"
              title="React"
            >
              <RiEmotionLine size={14} />
            </button>
            {emojiPickerOpen && (
              <div className={`absolute bottom-full mb-1 z-20 bg-[#2a3042] border border-[#323a4d] rounded-xl px-2 py-1.5 flex gap-1 shadow-xl
                ${isMe ? "right-0" : "left-0"}`}>
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onReact(msg._id, e); onToggleEmojiPicker(null); }}
                    className="text-lg hover:scale-125 transition-transform leading-none"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {!msg.isDeleted && (
          <button
            onClick={() => onToggleBookmark(msg._id)}
            className={`${bookmarked ? "text-[#7269ef]" : "text-[#6b7280] hover:text-[#7269ef]"}`}
            title="Bookmark"
          >
            {bookmarked ? <RiBookmarkFill size={14} /> : <RiBookmarkLine size={14} />}
          </button>
        )}
        {isMe && !msg.isDeleted && (
          confirmDelete ? (
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => { onDelete(msg._id); setConfirmDelete(false); }}
                className="text-red-400 hover:text-red-300"
                title="Confirm delete"
              >
                <RiCheckLine size={14} />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[#6b7280] hover:text-[#a3aed0]"
                title="Cancel"
              >
                <RiCloseLine size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-[#6b7280] hover:text-red-400" title="Delete">
              <RiDeleteBinLine size={14} />
            </button>
          )
        )}
        {!isMe && !msg.isDeleted && (
          <button
            onClick={() => onLike(msg._id)}
            className={`${(msg.likes ?? []).includes(currentUserId) ? "text-yellow-400" : "text-[#6b7280] hover:text-yellow-400"}`}
            title="Like"
          >
            <RiThumbUpLine size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
