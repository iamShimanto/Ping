import {
  RiSearchLine, RiPhoneLine, RiVideoLine, RiInformationLine,
  RiMoreLine, RiArrowLeftLine, RiCloseLine,
} from "react-icons/ri";
import Avatar from "./Avatar";
import type { Message } from "../../api/conversation/conversationApi";

interface ChatHeaderProps {
  contactName: string;
  contactAvatar: string | null;
  isOnline: boolean;
  contactStatus?: string;
  showInfo: boolean;
  showSearch: boolean;
  searchQuery: string;
  isSearching: boolean;
  searchResults: Message[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onBack?: () => void;
  onToggleInfo: () => void;
  onToggleSearch: () => void;
  onSearchChange: (val: string) => void;
  onScrollToMessage: (id: string) => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
  formatTime: (iso: string) => string;
}

export default function ChatHeader({
  contactName, contactAvatar, isOnline, contactStatus,
  showSearch, searchQuery, isSearching, searchResults,
  searchInputRef,
  onBack, onToggleInfo, onToggleSearch, onSearchChange, onScrollToMessage,
  onAudioCall, onVideoCall, formatTime,
}: ChatHeaderProps) {
  return (
    <>
      <div className="h-14 bg-[#2a3042] border-b border-[#323a4d] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0">
        {onBack && (
          <button onClick={onBack} className="sm:hidden text-[#6b7280] hover:text-[#a3aed0] p-1 -ml-1 shrink-0">
            <RiArrowLeftLine size={20} />
          </button>
        )}
        <Avatar
          initials={contactName.slice(0, 2).toUpperCase()}
          name={contactName}
          size="sm"
          online={isOnline}
          src={contactAvatar}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">{contactName}</p>
          <p className={`text-xs ${isOnline ? "text-green-400" : "text-[#6b7280]"}`}>
            {isOnline ? "Active" : contactStatus ?? "Offline"}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[#6b7280] shrink-0">
          <button
            onClick={onToggleSearch}
            className={`hidden sm:block hover:text-[#a3aed0] transition-colors ${showSearch ? "text-[#7269ef]" : ""}`}
          >
            <RiSearchLine size={18} />
          </button>
          <button onClick={onAudioCall} className="hover:text-[#a3aed0]"><RiPhoneLine size={18} /></button>
          <button onClick={onVideoCall} className="hidden xs:block hover:text-[#a3aed0]"><RiVideoLine size={18} /></button>
          <button onClick={onToggleInfo} className="hover:text-[#a3aed0]"><RiInformationLine size={18} /></button>
          <button className="hover:text-[#a3aed0]"><RiMoreLine size={18} /></button>
        </div>
      </div>

      {showSearch && (
        <div className="bg-[#2a3042] border-b border-[#323a4d] px-3 py-2 shrink-0">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <RiSearchLine size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-[#1e2433] text-sm text-[#a3aed0] placeholder-[#6b7280] rounded-lg pl-8 pr-3 py-1.5 outline-none border border-[#323a4d] focus:border-[#7269ef]"
              />
              {isSearching && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs animate-pulse">...</span>
              )}
            </div>
            <button onClick={onToggleSearch} className="text-[#6b7280] hover:text-[#a3aed0]">
              <RiCloseLine size={18} />
            </button>
          </div>
          {searchQuery.trim().length >= 1 && !isSearching && (
            <div className="mt-2 max-h-52 overflow-y-auto flex flex-col gap-1">
              {searchResults.length === 0 ? (
                <p className="text-xs text-[#6b7280] text-center py-2">No messages found</p>
              ) : (
                searchResults.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => onScrollToMessage(r._id)}
                    className="text-left w-full px-3 py-2 rounded-lg hover:bg-[#323a4d] transition-colors"
                  >
                    <p className="text-xs text-[#6b7280] mb-0.5">{r.sender.fullName} · {formatTime(r.createdAt)}</p>
                    <p className="text-sm text-[#a3aed0] truncate">{r.content}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
