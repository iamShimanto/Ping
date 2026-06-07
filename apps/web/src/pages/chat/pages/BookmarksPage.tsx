import { useState } from "react";
import { RiBookmarkLine, RiSearchLine, RiDeleteBinLine, RiMessageLine } from "react-icons/ri";
import { useNavigate } from "react-router";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { useGetBookmarksQuery, useRemoveBookmarkMutation } from "../../../api/bookmark/bookmarkApi";
import { toast } from "@repo/ui";

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: bookmarks = [], isLoading } = useGetBookmarksQuery();
  const [removeBookmark] = useRemoveBookmarkMutation();

  const filtered = bookmarks.filter((b) =>
    !search.trim() ||
    b.content.toLowerCase().includes(search.toLowerCase()) ||
    b.conversationName.toLowerCase().includes(search.toLowerCase()) ||
    b.sender.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = async (messageId: string) => {
    try {
      await removeBookmark(messageId).unwrap();
    } catch {
      toast.error("Failed to remove bookmark", "Bookmarks");
    }
  };

  const handleGoToChat = (conversationId: string) => {
    navigate(`/chat/chats?conv=${conversationId}`);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const panel = (
    <div className="w-full sm:w-75 bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between shrink-0">
        <h2 className="text-white font-semibold text-base">Bookmarks</h2>
        {bookmarks.length > 0 && (
          <span className="text-xs text-[#6b7280] bg-[#323a4d] px-2 py-0.5 rounded-full">
            {bookmarks.length}
          </span>
        )}
      </div>

      {/* Search */}
      {bookmarks.length > 0 && (
        <div className="px-3 sm:px-4 pb-3 shrink-0">
          <div className="flex items-center bg-[#323a4d] rounded-md px-3 py-2 gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks…"
              className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none min-w-0"
            />
            <RiSearchLine size={16} className="text-[#6b7280] shrink-0" />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-4">
        {isLoading && (
          <p className="text-xs text-[#6b7280] px-5 py-4 animate-pulse">Loading…</p>
        )}

        {!isLoading && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-14 h-14 rounded-full bg-[#323a4d] flex items-center justify-center mb-3">
              <RiBookmarkLine size={24} className="text-[#6b7280]" />
            </div>
            <p className="text-sm text-[#6b7280]">No bookmarks yet</p>
            <p className="text-xs text-[#4b5563] mt-1">Hover a message and click the bookmark icon to save it</p>
          </div>
        )}

        {!isLoading && bookmarks.length > 0 && filtered.length === 0 && (
          <p className="text-xs text-[#6b7280] px-5 py-4">No results found.</p>
        )}

        {filtered.map((b) => (
          <div
            key={b.bookmarkId}
            className="flex items-start gap-3 px-4 py-3 hover:bg-[#323a4d] group border-b border-[#323a4d]/50"
          >
            <Avatar
              initials={b.sender.fullName.slice(0, 2).toUpperCase()}
              name={b.sender.fullName}
              size="sm"
              src={b.sender.avatar ?? undefined}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-semibold text-[#a3aed0] truncate">{b.sender.fullName}</span>
                <span className="text-[10px] text-[#6b7280] shrink-0">{formatTime(b.createdAt)}</span>
              </div>
              <p className="text-[10px] text-[#7269ef] truncate mb-1"># {b.conversationName}</p>
              {b.isDeleted ? (
                <p className="text-xs text-[#6b7280] italic">This message was deleted</p>
              ) : b.contentType === "file" ? (
                <p className="text-xs text-[#a3aed0] truncate">📄 {b.fileName ?? b.content}</p>
              ) : (
                <p className="text-xs text-[#a3aed0] line-clamp-2 leading-relaxed">{b.content}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 shrink-0">
              <button
                onClick={() => handleGoToChat(b.conversationId)}
                className="text-[#6b7280] hover:text-[#7269ef] p-0.5"
                title="Go to chat"
              >
                <RiMessageLine size={14} />
              </button>
              <button
                onClick={() => handleRemove(b.messageId)}
                className="text-[#6b7280] hover:text-red-400 p-0.5"
                title="Remove bookmark"
              >
                <RiDeleteBinLine size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="sm:hidden w-full h-full flex">{panel}</div>
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {panel}
        <WelcomeScreen />
      </div>
    </>
  );
}
