import { useState } from "react";
import { RiPencilLine, RiCameraLine, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { useAppSelector } from "../../../store/hooks";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";

const sections = [
  { id: "personal", label: "Personal Info", icon: "👤" },
  { id: "themes", label: "Themes", icon: "🎨" },
  { id: "privacy", label: "Privacy", icon: "🔒" },
  { id: "security", label: "Security", icon: "🛡️" },
  { id: "help", label: "Help", icon: "❓" },
];

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  return (
    <>
      <div className="w-[300px] bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] flex-shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-semibold text-base">Settings</h2>
          <button className="text-[#6b7280] hover:text-[#a3aed0]">
            <RiPencilLine size={18} />
          </button>
        </div>

        {/* Cover + avatar */}
        <div className="flex-shrink-0">
          <div className="h-24 overflow-hidden">
            <img src="https://picsum.photos/300/96?random=20" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="px-5 -mt-7 pb-4">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-[#2a3042]">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {user?.fullName?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-5 h-5 bg-[#7269ef] rounded-full flex items-center justify-center">
                <RiCameraLine size={11} className="text-white" />
              </button>
            </div>
            <div className="mt-2">
              <p className="text-white font-semibold text-sm">{user?.fullName || "Kathryn Swarey"}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-[#a3aed0]">Active</span>
                <RiArrowDownSLine size={14} className="text-[#6b7280]" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#323a4d]" />

        {/* Accordion sections */}
        <div className="flex-1 px-4 py-3 space-y-1">
          {sections.map(({ id, label, icon }) => (
            <div key={id} className="rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(id)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#323a4d] rounded-lg"
              >
                <span className="text-base">{icon}</span>
                <span className="flex-1 text-sm text-[#a3aed0] text-left font-medium">{label}</span>
                {openSection === id ? (
                  <RiArrowUpSLine size={16} className="text-[#6b7280]" />
                ) : (
                  <RiArrowDownSLine size={16} className="text-[#6b7280]" />
                )}
              </button>
              {openSection === id && (
                <div className="px-4 pb-3 bg-[#323a4d] rounded-b-lg">
                  {id === "personal" && (
                    <div className="space-y-2 pt-2">
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase">Full Name</label>
                        <input defaultValue={user?.fullName || ""} className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase">Email</label>
                        <input defaultValue={user?.email || ""} className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]" />
                      </div>
                      <button className="w-full mt-2 py-1.5 bg-[#7269ef] text-white text-xs rounded font-medium hover:bg-[#6055d8]">
                        Save
                      </button>
                    </div>
                  )}
                  {id === "themes" && (
                    <div className="pt-2 space-y-2">
                      {["Dark", "Light", "Default"].map((theme) => (
                        <div key={theme} className="flex items-center gap-2">
                          <input type="radio" name="theme" id={theme} className="accent-[#7269ef]" defaultChecked={theme === "Dark"} />
                          <label htmlFor={theme} className="text-xs text-[#a3aed0]">{theme}</label>
                        </div>
                      ))}
                    </div>
                  )}
                  {(id === "privacy" || id === "security" || id === "help") && (
                    <p className="pt-2 text-xs text-[#6b7280]">Settings options coming soon.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <WelcomeScreen />
    </>
  );
}
