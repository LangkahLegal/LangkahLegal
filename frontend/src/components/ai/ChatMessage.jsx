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

        {/* Pasal References — only shown for AI messages with citations */}
        {isAI && message.pasal_referensi && message.pasal_referensi.length > 0 && (
          <div className="px-4 pt-2 space-y-1">
            <p className="text-[10px] lg:text-xs text-muted font-semibold uppercase tracking-wider">
              📚 Referensi Pasal:
            </p>
            {message.pasal_referensi.map((ref, idx) => (
              <div
                key={idx}
                className="text-[10px] lg:text-xs text-muted/80 bg-surface/50 px-3 py-1.5 rounded-lg border border-surface inline-block mr-1.5 mb-1"
              >
                <span className="font-medium">{ref.nama_uu}</span>
                {ref.pasal_bagian && (
                  <span> — {ref.pasal_bagian}</span>
                )}
                <span className="text-primary-light ml-1.5 font-mono">
                  {Math.round(ref.similarity * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer — shown for AI messages that have one */}
        {isAI && message.disclaimer && (
          <p className="text-[9px] lg:text-[10px] text-muted/60 px-4 pt-1 italic">
            {message.disclaimer}
          </p>
        )}

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
