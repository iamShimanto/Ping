import React from "react";
import { Link } from "react-router";

interface AuthLayoutProps {
  children: React.ReactNode;
}

// Decorative blob circles matching the screenshot
const Blobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    {/* Bottom-left cluster */}
    <div className="absolute bottom-16 left-8 flex gap-2">
      <div className="w-7 h-7 rounded-full bg-white/20" />
      <div className="w-5 h-5 rounded-full bg-[#f4a0b0]/60 mt-3" />
      <div className="w-7 h-7 rounded-full bg-white/20 mt-1" />
    </div>
    <div className="absolute bottom-8 left-14 flex gap-2">
      <div className="w-5 h-5 rounded-full bg-[#f4a0b0]/60" />
      <div className="w-6 h-6 rounded-full bg-white/20" />
      <div className="w-4 h-4 rounded-full bg-[#f4a0b0]/60 mt-2" />
    </div>
    {/* Center-right blobs (the pill shapes) */}
    <div className="absolute bottom-32 left-[38%] flex flex-col gap-3 rotate-12">
      <div className="w-10 h-5 rounded-full bg-[#f4a0b0]/50" />
      <div className="w-8 h-4 rounded-full bg-[#f4a0b0]/40 ml-3" />
      <div className="w-6 h-3 rounded-full bg-white/30 ml-6" />
    </div>
    <div className="absolute bottom-16 left-[42%] flex flex-col gap-3 rotate-12">
      <div className="w-5 h-5 rounded-full bg-[#f4a0b0]/50" />
      <div className="w-4 h-4 rounded-full bg-white/30 ml-2" />
      <div className="w-6 h-6 rounded-full bg-[#f4a0b0]/40 -ml-1" />
    </div>
  </div>
);

// Chat bubble with smiley face SVG
const HeroIllustration = () => (
  <div className="absolute bottom-0 left-0 w-[45%] max-w-xs pointer-events-none select-none">
    <svg viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chat bubble */}
      <ellipse cx="130" cy="90" rx="95" ry="75" fill="white" opacity="0.95" />
      <polygon points="80,155 65,185 110,155" fill="white" opacity="0.95" />
      {/* Smiley */}
      <circle cx="130" cy="88" r="32" fill="#4CAF82" />
      <circle cx="118" cy="82" r="4" fill="white" />
      <circle cx="142" cy="82" r="4" fill="white" />
      <path
        d="M115 98 Q130 112 145 98"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Person body */}
      <circle cx="120" cy="220" r="18" fill="#2d2d2d" />
      {/* Hair */}
      <ellipse cx="120" cy="210" rx="20" ry="12" fill="#1a1a1a" />
      {/* Body */}
      <rect x="100" y="238" width="40" height="50" rx="8" fill="#4a7c59" />
      {/* Left arm up */}
      <line
        x1="100"
        y1="248"
        x2="70"
        y2="185"
        stroke="#4a7c59"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Right arm up */}
      <line
        x1="140"
        y1="248"
        x2="160"
        y2="185"
        stroke="#4a7c59"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Legs */}
      <line
        x1="110"
        y1="288"
        x2="100"
        y2="315"
        stroke="#1a1a1a"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1="130"
        y1="288"
        x2="138"
        y2="315"
        stroke="#1a1a1a"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Shoes */}
      <ellipse cx="96" cy="316" rx="10" ry="5" fill="#1a1a1a" />
      <ellipse cx="140" cy="316" rx="10" ry="5" fill="#1a1a1a" />
    </svg>
  </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
    <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl min-h-[560px]">
      {/* Left green panel */}
      <div className="hidden md:flex md:w-[42%] bg-[#43A573] relative flex-col">
        {/* Logo */}
        <div className="p-8 z-10 relative">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-lg">
              💬
            </div>
            <span className="text-xl font-bold tracking-wide">Doot</span>
          </div>
          <p className="text-white/70 text-xs mt-1 ml-10">
            Responsive Bootstrap 5 Chat App
          </p>
        </div>
        <Blobs />
        <HeroIllustration />
      </div>

      {/* Right white panel */}
      <div className="flex-1 bg-white flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="text-center text-xs text-gray-400 py-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Ping. Made with{" "}
            <span className="text-red-400" aria-hidden="true">
              ♥
            </span>{" "}
            by{" "}
            <Link
              to="https://shimanto.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-700 transition-colors"
            >
              Shimanto
            </Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);
