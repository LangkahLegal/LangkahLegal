import { MaterialIcon } from "@/components/ui/Icons";

export default function ChatMessage({ message }) {
  const isAI = message.role === "ai";

  return (
    <div
      className={`flex ${isAI ? "justify-start" : "justify-end"} items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {isAI && (
        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#1f1d35] flex items-center justify-center border border-white/10 shrink-0 mb-6 shadow-xl">
          <MaterialIcon
            name="smart_toy"
            className="text-[#ada3ff] text-sm lg:text-base"
          />
        </div>
      )}

      <div className={`max-w-[85%] lg:max-w-[70%] space-y-1`}>
        <div
          className={`px-6 py-4 rounded-[2rem] text-sm lg:text-base leading-relaxed shadow-lg transition-all ${
            !isAI
              ? "bg-[#6f59fe] text-white rounded-br-none shadow-[#6f59fe]/10"
              : "bg-[#e8e2fc] text-[#0e0c1e] rounded-bl-none font-medium"
          }`}
        >
          <p className="whitespace-pre-line">{message.text}</p>
        </div>
        <p
          className={`text-[10px] lg:text-xs text-[#aca8c1] font-medium px-4 ${!isAI ? "text-right" : "text-left"}`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
