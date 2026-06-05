import { useState } from "react";
import { RiSearchLine, RiAddLine, RiMoreLine } from "react-icons/ri";
import Avatar from "../../../components/chat/Avatar";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { contacts } from "../data/mockData";

export default function ContactsPage() {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof contacts>>((acc, c) => {
    const letter = c.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(c);
    return acc;
  }, {});

  return (
    <>
      <div className="w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Contacts</h2>
          <button className="w-7 h-7 bg-[#7269ef] rounded flex items-center justify-center text-white hover:bg-[#6055d8]">
            <RiAddLine size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center bg-[#323a4d] rounded-md px-3 py-2 gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Contacts.."
              className="flex-1 bg-transparent text-sm text-[#a3aed0] placeholder-[#6b7280] outline-none"
            />
            <RiSearchLine size={16} className="text-[#6b7280]" />
          </div>
        </div>

        {/* Grouped list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {Object.entries(grouped).sort().map(([letter, group]) => (
            <div key={letter} className="mb-2">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest px-1 py-1 border-b border-[#323a4d] mb-1">
                {letter}
              </p>
              {group.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#323a4d] group">
                  <Avatar initials={c.initials} name={c.name} size="sm" />
                  <span className="flex-1 text-sm text-[#a3aed0] font-medium">{c.name}</span>
                  <button className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#a3aed0]">
                    <RiMoreLine size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <WelcomeScreen />
    </>
  );
}
