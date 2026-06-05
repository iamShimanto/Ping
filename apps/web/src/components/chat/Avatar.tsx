interface AvatarProps {
  src?: string | null;
  initials?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-20 h-20 text-2xl",
};

const colorMap: Record<string, string> = {
  A: "bg-pink-500", B: "bg-blue-500", C: "bg-purple-500", D: "bg-yellow-500",
  E: "bg-green-500", F: "bg-red-500", G: "bg-indigo-500", H: "bg-teal-500",
  I: "bg-orange-500", J: "bg-cyan-500", K: "bg-lime-500", L: "bg-violet-500",
  M: "bg-emerald-500", N: "bg-sky-500", O: "bg-rose-500", P: "bg-amber-500",
  Q: "bg-pink-400", R: "bg-blue-400", S: "bg-green-400", T: "bg-purple-400",
  U: "bg-red-400", V: "bg-indigo-400", W: "bg-teal-400", X: "bg-yellow-400",
  Y: "bg-cyan-400", Z: "bg-lime-400",
};

export default function Avatar({ src, initials, name, size = "md", online, className = "" }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const letter = initials?.[0] || name?.[0] || "?";
  const bgColor = colorMap[letter.toUpperCase()] || "bg-gray-500";

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white ${bgColor}`}>
          {initials || name?.slice(0, 2).toUpperCase() || "?"}
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2a3042] ${online ? "bg-green-400" : "bg-gray-500"}`} />
      )}
    </div>
  );
}
