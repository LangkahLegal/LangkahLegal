import { MaterialIcon } from "@/components/ui/Icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AIConsultantCard from "./AIConsultantCard";

export default function ChatMessage({ message }) {
  const isAI = message.role === "ai";

  return (
    <div
      className={`flex ${isAI ? "justify-start" : "justify-end"} items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      data-testid={isAI ? "ai-message" : "user-message"}
    >
      {isAI && (
        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-input flex items-center justify-center border border-surface shrink-0 mb-6 shadow-soft">
          <MaterialIcon
            name="smart_toy"
            className="text-primary-light text-sm lg:text-base"
          />
        </div>
      )}

      <div className={`max-w-[85%] lg:max-w-[70%] space-y-1`}>
        <div
          className={`px-6 py-4 rounded-[2rem] text-sm lg:text-base leading-relaxed shadow-soft transition-all ${
            !isAI
              ? 
                "bg-primary text-white rounded-br-none shadow-primary/10"
              : 
                "bg-surface text-main rounded-bl-none font-medium border border-surface"
          }`}
        >
          {isAI ? (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-3 last:mb-0 whitespace-pre-wrap" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                  a: ({ node, ...props }) => <a className="text-primary-light hover:underline" {...props} />,
                  h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-4" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-2 mt-3" {...props} />,
                }}
              >
                {message.text}
              </ReactMarkdown>

              {/* Agentic Output: Render Consultants if tool was called */}
              {message.type === "consultant_list" && message.consultants && message.consultants.length > 0 && (
                <div className="mt-6 space-y-3 pt-4 border-t border-surface/50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary-light mb-4">
                    Rekomendasi Konsultan:
                  </p>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {message.consultants.map((c) => (
                      <AIConsultantCard key={c.id_konsultan} consultant={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-line">{message.text}</p>
          )}
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
          className={`text-[10px] lg:text-xs text-muted font-medium px-4 ${!isAI ? "text-right" : "text-left"}`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}
