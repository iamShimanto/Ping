import { RiMessage3Fill } from "react-icons/ri";
import { Link } from "react-router";

export default function WelcomeScreen() {
  return (
    <div className="flex-1 chat-bg flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#3d4554] flex items-center justify-center mx-auto mb-5 sm:mb-6">
          <RiMessage3Fill size={28} className="text-[#7269ef] sm:hidden" />
          {/* <RiMessage3Fill
            size={36}
            className="text-[#7269ef] hidden sm:block"
          /> */}
          <img
            src="/ping.svg"
            alt="Ping Logo"
            className="size-14 hidden sm:block"
          />
        </div>
        <h2 className="text-white text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
          Welcome to Ping
        </h2>
        <p className="text-[#6b7280] text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
          One ping. Infinite conversations. Stay close to everyone that matters.
        </p>
        <Link to="/chat" className="block w-fit mx-auto mt-5 sm:mt-6 px-6 py-2 bg-[#7269ef] text-white rounded-md text-sm font-medium hover:bg-[#6055d8] transition-colors">
          Get Started
        </Link>
      </div>
    </div>
  );
}
