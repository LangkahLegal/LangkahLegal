import { MaterialIcon } from "@/components/ui";

export default function LegalCard({ item, index }) {
  return (
    <div className="bg-card border border-surface hover:border-primary/20 transition-all duration-300 rounded-2xl p-4 md:p-6 shadow-sm group flex flex-col sm:flex-row gap-3 md:gap-4 items-start">
      <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl bg-surface group-hover:bg-primary-light/10 flex items-center justify-center transition-colors">
        <MaterialIcon name={item.icon} className="text-lg md:text-xl text-muted group-hover:text-primary transition-colors" />
      </div>
      <div className="space-y-1 md:space-y-2">
        <h2 className="text-lg md:text-xl font-bold text-main font-headline group-hover:text-primary transition-colors">
          {index ? `${index}. ` : ""}{item.title}
        </h2>
        <div className="text-xs md:text-sm text-muted leading-relaxed">
          {item.content}
        </div>
      </div>
    </div>
  );
}
