import { RiMessage3Fill } from "react-icons/ri";

export default function WelcomeScreen() {
  return (
    <div className="flex-1 chat-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#3d4554] flex items-center justify-center mx-auto mb-6">
          <RiMessage3Fill size={36} className="text-[#7269ef]" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-3">Welcome to Doot Chat App</h2>
        <p className="text-[#6b7280] text-sm max-w-xs mx-auto leading-relaxed">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. cum sociis natoque penatibus et
        </p>
        <button className="mt-6 px-6 py-2 bg-[#7269ef] text-white rounded-md text-sm font-medium hover:bg-[#6055d8] transition-colors">
          Get Started
        </button>
      </div>
    </div>
  );
}
