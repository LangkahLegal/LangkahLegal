import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

export default function ActionButtons({ onAction, isLoading }) {
  return (
    <div className="flex gap-4 pt-6">
      {/* Tombol Tolak */}
      <Button 
        variant="outline" 
        fullWidth 
        onClick={() => onAction("reject")}
        disabled={isLoading}
        className="!border-[#f87171]/30 !text-[#f87171] hover:!bg-[#f87171]/10 !rounded-2xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          <MaterialIcon name="close" />
          <span>Tolak</span>
        </div>
      </Button>

      {/* Tombol Terima */}
      <Button 
        fullWidth 
        onClick={() => onAction("approve")}
        isLoading={isLoading}
        disabled={isLoading}
        className="!bg-[#6f59fe] hover:!bg-[#5b46e0] !rounded-2xl py-4 shadow-[0_10px_20px_rgba(111,89,254,0.3)] disabled:opacity-70"
      >
        <div className="flex items-center gap-2">
          <MaterialIcon name="check_circle" />
          <span>Terima</span>
        </div>
      </Button>
    </div>
  );
}