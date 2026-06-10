import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { MaterialIcon } from "@/components/ui/Icons";

export default function VerificationCardSkeleton() {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-card border-surface relative overflow-hidden">
      {/* HEADER SECTION SKELETON */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl" />
          </div>

          {/* Content Section Skeleton */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <Skeleton className="h-4 sm:h-5 w-3/4 max-w-[200px]" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full max-w-[150px]" />
              <Skeleton className="h-3 w-1/2 max-w-[100px]" />
            </div>
          </div>
        </div>

        {/* Status Badge Skeleton */}
        <Skeleton className="h-5 w-16 rounded-lg shrink-0 mt-0.5" />
      </div>

      {/* FOOTER SECTION SKELETON */}
      <div className="mt-5 pt-4 border-t border-surface flex justify-between items-center">
        <div className="flex items-center gap-1.5 w-full">
          <MaterialIcon name="calendar_today" className="text-sm text-muted/30" />
          <Skeleton className="h-3 sm:h-4 w-3/4 max-w-[150px]" />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Skeleton className="hidden sm:block h-3 sm:h-4 w-16" />
          <MaterialIcon name="chevron_right" className="text-lg text-muted/30" />
        </div>
      </div>
    </div>
  );
}
