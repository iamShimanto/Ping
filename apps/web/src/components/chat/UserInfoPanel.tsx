import { RiCloseLine, RiHeartLine, RiPhoneLine, RiVideoLine, RiMoreLine, RiMailLine, RiMapPinLine, RiUserLine } from "react-icons/ri";
import { useGetUserProfileQuery } from "../../api/user/userApi";

interface UserInfoPanelProps {
  userId: string;
  name: string;
  avatar?: string | null;
  online?: boolean;
  onClose: () => void;
}

export default function UserInfoPanel({ userId, name, avatar, online, onClose }: UserInfoPanelProps) {
  const { data: profile } = useGetUserProfileQuery(userId, { skip: !userId });

  const displayName = profile?.fullName ?? name;
  const displayAvatar = profile?.avatar ?? avatar;
  const displayEmail = profile?.email;
  const displayBio = profile?.bio;
  const displayLocation = profile?.location;
  const displayStatus = profile?.status ?? (online ? "online" : "offline");
  const isOnline = displayStatus === "online";

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
            {displayAvatar ? (
              <img src={displayAvatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#7269ef] flex items-center justify-center text-white font-bold text-2xl">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#2a3042] ${isOnline ? "bg-green-400" : "bg-[#6b7280]"}`} />
          </div>
          <p className="text-white font-semibold mt-3 text-sm">{displayName}</p>
          <p className={`text-xs mt-0.5 capitalize ${isOnline ? "text-green-400" : "text-[#6b7280]"}`}>
            {displayStatus}
          </p>

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

        {/* Bio / Status */}
        {displayBio && (
          <>
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Status</p>
              <p className="text-xs text-[#a3aed0] leading-relaxed">{displayBio}</p>
            </div>
            <div className="border-t border-[#323a4d]" />
          </>
        )}

        {/* Info */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Info</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <RiUserLine size={13} className="text-[#6b7280] shrink-0" />
              <p className="text-xs text-[#6b7280] shrink-0 w-14">Name</p>
              <p className="text-xs text-[#a3aed0] truncate">{displayName}</p>
            </div>
            {displayEmail && (
              <div className="flex items-center gap-2 min-w-0">
                <RiMailLine size={13} className="text-[#6b7280] shrink-0" />
                <p className="text-xs text-[#6b7280] shrink-0 w-14">Email</p>
                <p className="text-xs text-[#a3aed0] truncate">{displayEmail}</p>
              </div>
            )}
            {displayLocation && (
              <div className="flex items-center gap-2 min-w-0">
                <RiMapPinLine size={13} className="text-[#6b7280] shrink-0" />
                <p className="text-xs text-[#6b7280] shrink-0 w-14">Location</p>
                <p className="text-xs text-[#a3aed0] truncate">{displayLocation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
