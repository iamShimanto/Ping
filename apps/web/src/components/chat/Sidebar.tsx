import { NavLink, useNavigate } from "react-router";
import { useState } from "react";
import {
  RiMessage3Line, RiContactsLine, RiPhoneLine,
  RiBookmarkLine, RiSettings3Line, RiUser3Line, RiSunLine,
} from "react-icons/ri";
import { useAppSelector } from "../../store/hooks";
import { authApi } from "../../api/auth/authAPi";
import Avatar from "./Avatar";

const navItems = [
  { to: "/chat/profile", icon: RiUser3Line },
  { to: "/chat/chats", icon: RiMessage3Line },
  { to: "/chat/contacts", icon: RiContactsLine },
  { to: "/chat/calls", icon: RiPhoneLine },
  { to: "/chat/bookmarks", icon: RiBookmarkLine },
  { to: "/chat/settings", icon: RiSettings3Line },
];

export default function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [logout] = authApi.useLogoutMutation();

  const handleLogout = async () => {
    await logout(undefined);
    navigate("/login");
  };

  return (
    <div className="w-[70px] bg-[#2a3042] flex flex-col items-center py-4 h-full relative flex-shrink-0">
      {/* Nav icons */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-lg transition-colors relative
              ${isActive ? "text-[#7269ef]" : "text-[#6b7280] hover:text-[#a3aed0]"}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#7269ef] rounded-r-full -ml-2" />
                )}
                <Icon size={20} />
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-3 mt-auto">
        <button className="text-[#6b7280] hover:text-[#a3aed0] w-10 h-10 flex items-center justify-center">
          <RiSunLine size={20} />
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="focus:outline-none">
            <Avatar
              src={user?.avatar}
              name={user?.fullName || "U"}
              initials={user?.fullName?.slice(0, 2).toUpperCase()}
              size="sm"
              online
            />
          </button>

          {showMenu && (
            <div className="absolute bottom-full left-full ml-2 mb-1 w-44 bg-[#2a3042] border border-[#3d4554] rounded-lg shadow-xl z-50 overflow-hidden">
              <NavLink to="/chat/profile" onClick={() => setShowMenu(false)}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-[#a3aed0] hover:bg-[#374151]">
                Profile <RiUser3Line size={16} />
              </NavLink>
              <NavLink to="/chat/settings" onClick={() => setShowMenu(false)}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-[#a3aed0] hover:bg-[#374151]">
                Setting <RiSettings3Line size={16} />
              </NavLink>
              <button className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[#a3aed0] hover:bg-[#374151]">
                Change Password <span className="text-base">🔒</span>
              </button>
              <button onClick={handleLogout}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[#a3aed0] hover:bg-[#374151]">
                Log out <span className="text-base">↩</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
