import { MaterialIcon } from "@/components/ui/Icons";

export default function ChatMessage({ message }) {
  const isAI = message.role === "ai";

  return (
    <div
      className={`flex ${isAI ? "justify-start" : "justify-end"} items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {isAI && (
        /* REFACTOR: bg-input & border-surface agar adaptif */
        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-input flex items-center justify-center border border-surface shrink-0 mb-6 shadow-soft">
          <MaterialIcon
            name="smart_toy"
            /* REFACTOR: text-primary-light */
            className="text-primary-light text-sm lg:text-base"
          />
        </div>
      )}

      <div className={`max-w-[85%] lg:max-w-[70%] space-y-1`}>
        <div
          className={`px-6 py-4 rounded-[2rem] text-sm lg:text-base leading-relaxed shadow-soft transition-all ${
            !isAI
              ? /* REFACTOR: User bubble pakai bg-primary */
                "bg-primary text-white rounded-br-none shadow-primary/10"
              : /* REFACTOR: AI bubble pakai bg-surface & text-main */
                "bg-surface text-main rounded-bl-none font-medium border border-surface"
          }`}
        >
          <p className="whitespace-pre-line">{message.text}</p>
        </div>
        <p
          /* REFACTOR: text-muted */
          className={`text-[10px] lg:text-xs text-muted font-medium px-4 ${!isAI ? "text-right" : "text-left"}`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
