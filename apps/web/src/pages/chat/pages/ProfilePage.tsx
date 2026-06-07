import { RiMoreLine, RiMapPinLine, RiMailLine, RiUserLine } from "react-icons/ri";
import { useAppSelector } from "../../../store/hooks";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);

  const panel = (
    <div className="w-full sm:w-75 bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between shrink-0">
        <h2 className="text-white font-semibold text-base">My Profile</h2>
        <button className="text-[#6b7280] hover:text-[#a3aed0]">
          <RiMoreLine size={20} />
        </button>
      </div>

      {/* Avatar */}
      <div className="px-4 sm:px-5 pb-4 flex flex-col items-center text-center shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#323a4d]">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#7269ef] flex items-center justify-center text-white font-bold text-2xl">
              {user?.fullName?.slice(0, 2).toUpperCase() ?? "U"}
            </div>
          )}
        </div>
        <p className="text-white font-semibold text-sm mt-3">{user?.fullName ?? "—"}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${user?.status === "online" ? "bg-green-400" : "bg-[#6b7280]"}`} />
          <span className="text-xs text-[#a3aed0] capitalize">{user?.status ?? "offline"}</span>
        </div>
      </div>

      <div className="border-t border-[#323a4d]" />

      {/* Bio */}
      {user?.bio && (
        <>
          <div className="px-4 sm:px-5 py-4">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">About</p>
            <p className="text-xs text-[#a3aed0] leading-relaxed">{user.bio}</p>
          </div>
          <div className="border-t border-[#323a4d]" />
        </>
      )}

      {/* Info */}
      <div className="px-4 sm:px-5 py-4 space-y-3">
        <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Info</p>
        <div className="flex items-center gap-3">
          <RiUserLine size={15} className="text-[#6b7280] shrink-0" />
          <span className="text-xs text-[#a3aed0] truncate">{user?.fullName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          <RiMailLine size={15} className="text-[#6b7280] shrink-0" />
          <span className="text-xs text-[#a3aed0] truncate">{user?.email ?? "—"}</span>
        </div>
        {user?.location && (
          <div className="flex items-center gap-3">
            <RiMapPinLine size={15} className="text-[#6b7280] shrink-0" />
            <span className="text-xs text-[#a3aed0] truncate">{user.location}</span>
          </div>
        )}
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
