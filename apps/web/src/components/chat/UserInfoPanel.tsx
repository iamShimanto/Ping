import { RiCloseLine, RiHeartLine, RiPhoneLine, RiVideoLine, RiMoreLine } from "react-icons/ri";

interface Contact {
  id: string;
  name: string;
  initials: string;
  online?: boolean;
}

interface UserInfoPanelProps {
  contact: Contact;
  onClose: () => void;
}

export default function UserInfoPanel({ contact, onClose }: UserInfoPanelProps) {
  return (
    <>
      {/* Backdrop — mobile only */}
      <div className="sm:hidden fixed inset-0 z-20 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed sm:relative inset-y-0 right-0 z-30 w-[85vw] sm:w-72 bg-[#2a3042] border-l border-[#323a4d] flex flex-col h-full shrink-0 overflow-y-auto shadow-2xl sm:shadow-none">
        {/* Close */}
        <div className="p-4 flex items-center justify-end shrink-0">
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#a3aed0] p-1">
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center px-4 pb-4">
          <div className="relative">
            <img src="https://picsum.photos/80/80?random=55" alt="" className="w-20 h-20 rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#2a3042]" />
          </div>
          <p className="text-white font-semibold mt-3 text-sm">{contact.name}</p>
          <p className="text-green-400 text-xs mt-0.5">{contact.online ? "Active" : "Offline"}</p>

          {/* Actions */}
          <div className="flex gap-3 sm:gap-4 mt-4 flex-wrap justify-center">
            {[
              { icon: RiMoreLine, label: "Message" },
              { icon: RiHeartLine, label: "Favourite" },
              { icon: RiPhoneLine, label: "Audio" },
              { icon: RiVideoLine, label: "Video" },
              { icon: RiMoreLine, label: "More" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <button className="w-9 h-9 bg-[#323a4d] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#a3aed0] hover:bg-[#3d4554]">
                  <Icon size={16} />
                </button>
                <span className="text-[10px] text-[#6b7280]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Status */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Status :</p>
          <p className="text-xs text-[#a3aed0] leading-relaxed">
            If several languages coalesce, the grammar of the resulting.
          </p>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Info */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Info :</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#6b7280] shrink-0">Name</p>
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs text-[#a3aed0] truncate">{contact.name}</p>
                <button className="text-xs text-[#7269ef] hover:underline shrink-0">Edit</button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#6b7280] shrink-0">Email</p>
              <p className="text-xs text-[#a3aed0] truncate">
                {contact.name.split(" ")[0]}@{contact.name.split(" ")[1]?.toLowerCase() || "mail"}.com
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#6b7280] shrink-0">Location</p>
              <p className="text-xs text-[#a3aed0]">California, USA</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Group in common */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Group in Common</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-[#3d4554] flex items-center justify-center shrink-0">
              <span className="text-[10px] text-[#6b7280]">#</span>
            </div>
            <span className="text-xs text-[#a3aed0]">Landing Design</span>
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Media */}
        <div className="px-5 py-4 pb-20 sm:pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Media</p>
            <button className="text-xs text-[#7269ef] hover:underline">Show all</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#323a4d]">
                <img src={`https://picsum.photos/80/80?random=${i + 10}`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
