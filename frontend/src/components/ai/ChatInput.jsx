import { MaterialIcon } from "@/components/ui/Icons";

export default function ChatInput({ input, setInput, onSend }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSend();
  };

  return (
    <div className="px-6 pb-28 lg:pb-10 pt-4 bg-gradient-to-t from-[#0e0c1e] via-[#0e0c1e] to-transparent">
      <div className="max-w-5xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-[#1f1d35] rounded-[2rem] border border-[#48455a]/50 p-2 lg:p-3 flex items-center gap-2 shadow-2xl focus-within:border-[#6f59fe]/50 transition-all"
        >

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan hukum Anda..."
            className="flex-1 bg-transparent border-none outline-none text-[#e8e2fc] text-sm lg:text-base placeholder:text-[#aca8c1]/40 py-3 px-2"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full transition-all flex items-center justify-center shadow-xl ${
              input.trim()
                ? "bg-[#6f59fe] text-white hover:scale-105 active:scale-95"
                : "bg-white/5 text-[#aca8c1] opacity-50 cursor-not-allowed"
            }`}
          >
            <MaterialIcon
              name="send"
              className={
                input.trim()
                  ? "rotate-[-45deg] translate-x-0.5 text-2xl"
                  : "text-2xl"
              }
            />
          </button>
        </form>
      </div>
    </div>
  );
}
