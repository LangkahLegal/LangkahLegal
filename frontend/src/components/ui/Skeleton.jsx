import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface/60 ${className}`}
      {...props}
    />
  );
}
