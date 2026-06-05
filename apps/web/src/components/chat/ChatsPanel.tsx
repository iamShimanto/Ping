import { useState } from "react";
import { RiSearchLine, RiAddLine } from "react-icons/ri";
import Avatar from "./Avatar";
import { favourites, directMessages, channels } from "../../pages/chat/data/mockData";

interface ChatsPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ChatsPanel({ selectedId, onSelect }: ChatsPanelProps) {
  const [search, setSearch] = useState("");

  const filterList = <T extends { name: string }>(list: T[]) =>
    list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full sm:w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Chats</h2>
        <button className="w-7 h-7 bg-[#7269ef] rounded flex items-center justify-center text-white hover:bg-[#6055d8]">
          <RiAddLine size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 pb-3">
        <div className="flex items-center bg-[#323a4d] rounded-md px-3 py-2 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search here.."
            className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none min-w-0"
          />
          <RiSearchLine size={16} className="text-[#6b7280] flex-shrink-0" />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto pb-16 sm:pb-0">
        {/* Favourites */}
        <div className="px-4 sm:px-5 pb-1">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Favourites</p>
          {filterList(favourites).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg transition-colors text-left
                ${selectedId === item.id ? "bg-[#7269ef]" : "hover:bg-[#323a4d] active:bg-[#323a4d]"}`}
            >
              <Avatar initials={item.initials} name={item.name} size="sm" online={item.online} />
              <span className={`flex-1 text-sm font-medium truncate ${selectedId === item.id ? "text-white" : "text-[#a3aed0]"}`}>
                {item.name}
              </span>
              {item.unread > 0 && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0
                  ${selectedId === item.id ? "bg-white text-[#7269ef]" : "bg-[#7269ef] text-white"}`}>
                  {item.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div className="px-4 sm:px-5 pb-1 mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Direct Messages</p>
            <button className="w-5 h-5 bg-[#323a4d] rounded flex items-center justify-center text-[#6b7280] hover:text-white">
              <RiAddLine size={12} />
            </button>
          </div>
          {filterList(directMessages).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg transition-colors text-left
                ${selectedId === item.id ? "bg-[#7269ef]" : "hover:bg-[#323a4d] active:bg-[#323a4d]"}`}
            >
              <Avatar initials={item.initials} name={item.name} size="sm" online={item.online} />
              <span className={`flex-1 text-sm font-medium truncate ${selectedId === item.id ? "text-white" : "text-[#a3aed0]"}`}>
                {item.name}
              </span>
              {item.unread > 0 && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0
                  ${selectedId === item.id ? "bg-white text-[#7269ef]" : "bg-[#7269ef] text-white"}`}>
                  {item.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Channels */}
        <div className="px-4 sm:px-5 pb-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Channels</p>
            <button className="w-5 h-5 bg-[#323a4d] rounded flex items-center justify-center text-[#6b7280] hover:text-white">
              <RiAddLine size={12} />
            </button>
          </div>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelect(ch.id)}
              className={`w-full flex items-center gap-3 px-2 py-2.5 sm:py-2 rounded-lg transition-colors text-left
                ${selectedId === ch.id ? "bg-[#7269ef]" : "hover:bg-[#323a4d] active:bg-[#323a4d]"}`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-[#3d4554] flex items-center justify-center flex-shrink-0">
                <span className={`text-xs font-bold ${selectedId === ch.id ? "text-white" : "text-[#6b7280]"}`}>#</span>
              </div>
              <span className={`flex-1 text-sm font-medium truncate ${selectedId === ch.id ? "text-white" : "text-[#a3aed0]"}`}>
                {ch.name}
              </span>
              {ch.unread > 0 && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0
                  ${selectedId === ch.id ? "bg-white text-[#7269ef]" : "bg-[#7269ef] text-white"}`}>
                  {ch.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
