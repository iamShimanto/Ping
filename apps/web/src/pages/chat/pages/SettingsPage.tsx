import { useState, useRef } from "react";
import {
  RiPencilLine, RiCameraLine, RiArrowDownSLine, RiArrowUpSLine,
  RiCheckLine, RiMapPinLine, RiMailLine, RiUserLine, RiLockLine,
} from "react-icons/ri";
import { useAppSelector } from "../../../store/hooks";
import WelcomeScreen from "../../../components/chat/WelcomeScreen";
import { useUpdateProfileMutation, useUpdateStatusMutation, useChangePasswordMutation } from "../../../api/auth/authAPi";
import { toast } from "@repo/ui";

const STATUS_OPTIONS = [
  { value: "online", label: "Online", color: "bg-green-400" },
  { value: "away", label: "Away", color: "bg-yellow-400" },
  { value: "busy", label: "Busy", color: "bg-red-400" },
  { value: "offline", label: "Offline", color: "bg-[#6b7280]" },
] as const;

const sections = [
  { id: "personal", label: "Personal Info", icon: <RiUserLine size={16} /> },
  { id: "security", label: "Change Password", icon: <RiLockLine size={16} /> },
] as const;

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateStatusMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  // Personal info form state
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      await updateProfile(formData).unwrap();
      toast.success("Avatar updated!", "Settings");
    } catch {
      toast.error("Failed to update avatar", "Settings");
    }
    e.target.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    const formData = new FormData();
    formData.append("fullName", fullName.trim());
    formData.append("bio", bio.trim());
    formData.append("location", location.trim());
    try {
      await updateProfile(formData).unwrap();
      toast.success("Profile updated!", "Settings");
    } catch {
      toast.error("Failed to update profile", "Settings");
    }
  };

  const handleStatusChange = async (status: typeof STATUS_OPTIONS[number]["value"]) => {
    try {
      await updateStatus({ status }).unwrap();
    } catch {
      toast.error("Failed to update status", "Settings");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", "Settings");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters", "Settings");
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success("Password changed. Please log in again.", "Settings");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? "Failed to change password", "Settings");
    }
  };

  const panel = (
    <div className="w-full sm:w-75 bg-[#2a3042] flex flex-col h-full border-r border-[#323a4d] shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between shrink-0">
        <h2 className="text-white font-semibold text-base">Settings</h2>
        <button className="text-[#6b7280] hover:text-[#a3aed0]">
          <RiPencilLine size={18} />
        </button>
      </div>

      {/* Avatar + name */}
      <div className="px-4 sm:px-5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-[#2a3042]">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#7269ef] flex items-center justify-center text-white font-bold text-lg">
                  {user?.fullName?.slice(0, 2).toUpperCase() ?? "U"}
                </div>
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 w-5 h-5 bg-[#7269ef] rounded-full flex items-center justify-center hover:bg-[#6055d8]"
            >
              <RiCameraLine size={11} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.fullName ?? "—"}</p>
            <p className="text-xs text-[#a3aed0] truncate">{user?.email ?? "—"}</p>
          </div>
        </div>

        {/* Status selector */}
        <div className="mt-3">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Status</p>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = user?.status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                    ${isActive ? "bg-[#7269ef] text-white" : "bg-[#323a4d] text-[#a3aed0] hover:bg-[#3d4554]"}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.color}`} />
                  {opt.label}
                  {isActive && <RiCheckLine size={12} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-[#323a4d]" />

      {/* Accordion sections */}
      <div className="flex-1 px-3 sm:px-4 py-3 space-y-1 pb-24 sm:pb-4">
        {sections.map(({ id, label, icon }) => (
          <div key={id} className="rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(id)}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#323a4d] active:bg-[#323a4d] rounded-lg"
            >
              <span className="text-[#6b7280]">{icon}</span>
              <span className="flex-1 text-sm text-[#a3aed0] text-left font-medium">{label}</span>
              {openSection === id
                ? <RiArrowUpSLine size={16} className="text-[#6b7280]" />
                : <RiArrowDownSLine size={16} className="text-[#6b7280]" />}
            </button>

            {openSection === id && (
              <div className="px-3 pb-3 bg-[#323a4d] rounded-b-lg">
                {id === "personal" && (
                  <form onSubmit={handleSaveProfile} className="space-y-2 pt-2">
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase flex items-center gap-1">
                        <RiUserLine size={11} /> Full Name
                      </label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase flex items-center gap-1">
                        <RiMailLine size={11} /> Email
                      </label>
                      <input
                        value={user?.email ?? ""}
                        readOnly
                        className="w-full bg-[#2a3042] text-xs text-[#6b7280] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase flex items-center gap-1">
                        <RiMapPinLine size={11} /> Location
                      </label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full mt-1 py-1.5 bg-[#7269ef] text-white text-xs rounded font-medium hover:bg-[#6055d8] disabled:opacity-50"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                )}

                {id === "security" && (
                  <form onSubmit={handleChangePassword} className="space-y-2 pt-2">
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#2a3042] text-xs text-[#a3aed0] rounded px-2 py-1.5 mt-1 outline-none border border-[#3d4554] focus:border-[#7269ef]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full mt-1 py-1.5 bg-[#7269ef] text-white text-xs rounded font-medium hover:bg-[#6055d8] disabled:opacity-50"
                    >
                      {isChangingPassword ? "Updating..." : "Change Password"}
                    </button>
                  </form>
                )}
              </div>
            )}
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
