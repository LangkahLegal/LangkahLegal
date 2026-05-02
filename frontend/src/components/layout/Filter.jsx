"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

/**
 * Filter Component
 * @param {function} onClick
 * @param {boolean} isActive
 */
export default function Filter({ onClick, isActive = false }) {
  return (
    <Button
      onClick={onClick}
      type="button"
      // Jika aktif pakai variant primary, jika tidak pakai variant secondary
      variant={isActive ? "primary" : "secondary"}
      className={`
        !w-14 !h-14 lg:!w-[60px] lg:!h-[60px]
        !rounded-2xl !p-0 shrink-0 border transition-all duration-300 group
        ${
          isActive
            ? "!bg-primary/20 !text-primary !border-primary shadow-soft"
            : "!bg-input !border-surface hover:!border-muted/50"
        }
      `}
    >
      <MaterialIcon
        name="tune"
        className={`
          text-2xl transition-all duration-300
          ${
            isActive
              ? "text-primary scale-110"
              : "text-muted group-hover:text-primary-light"
          }
        `}
        // Menyalakan Fill jika aktif agar terlihat lebih "solid"
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      />
    </Button>
  );
}
