import { RiMoreLine } from "react-icons/ri";
import { useAppSelector } from "../../../store/hooks";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <>
      {/* Profile panel */}
      <div className="w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-semibold text-base">My Profile</h2>
          <button className="text-[#6b7280] hover:text-[#a3aed0]">
            <RiMoreLine size={20} />
          </button>
        </div>

        {/* Cover + avatar */}
        <div className="flex-shrink-0">
          <div className="h-28 overflow-hidden">
            <img src="https://picsum.photos/300/112?random=20" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="px-5 -mt-8 pb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[#2a3042]">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {user?.fullName?.slice(0, 2).toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-white font-semibold text-sm">{user?.fullName || "User Name"}</p>
              <p className="text-[#6b7280] text-xs mt-0.5">Front end Developer</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Bio */}
        <div className="px-5 py-4">
          <p className="text-xs text-[#a3aed0] leading-relaxed">
            If several languages coalesce, the grammar of the resulting language is more simple.
          </p>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Info */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[#6b7280] text-sm">👤</span>
            <span className="text-xs text-[#a3aed0]">{user?.fullName || "Adam Zampa"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6b7280] text-sm">@</span>
            <span className="text-xs text-[#a3aed0]">{user?.email || "admin@themesbrand.com"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6b7280] text-sm">📍</span>
            <span className="text-xs text-[#a3aed0]">California, USA</span>
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Media */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Media</p>
            <button className="text-xs text-[#7269ef] hover:underline">Show all</button>
          </div>
          <div className="flex gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="w-20 h-16 rounded-lg overflow-hidden bg-[#323a4d]">
                <img src={`https://picsum.photos/80/64?random=${i + 30}`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-20 h-16 rounded-lg bg-[#323a4d] flex items-center justify-center">
              <span className="text-xs text-[#6b7280]">+ 15</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Attached Files */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Attached Files</p>
          <div className="space-y-2">
            {[
              { name: "design-phase-1-...", size: "12.5 MB", icon: "📄", color: "text-green-400" },
              { name: "Image-1.jpg", size: "4.2 MB", icon: "🖼️", color: "text-green-500" },
              { name: "Image-2.jpg", size: "3.1 MB", icon: "🖼️", color: "text-green-500" },
            ].map((file) => (
              <div key={file.name} className="flex items-center gap-3 bg-[#323a4d] rounded-lg px-3 py-2">
                <span className={`text-lg ${file.color}`}>{file.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#a3aed0] font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-[#6b7280]">{file.size}</p>
                </div>
                <button className="text-[#6b7280] hover:text-[#a3aed0]">⬇</button>
                <button className="text-[#6b7280] hover:text-[#a3aed0]">⋯</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WelcomeScreen />
    </>
  );
}
