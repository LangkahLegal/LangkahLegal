"use client";

import { useState } from "react";
import {
  getAvatarToneClasses,
  getInitials,
  getSafeAvatarUrl,
} from "@/lib/avatarTone";

const SIZE_TEXT_CLASSES = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

export function UserAvatar({
  src,
  name = "User",
  alt,
  size = "md",
  className = "w-full h-full object-cover",
  textClassName = "",
}) {
  const [failedSrc, setFailedSrc] = useState(null);

  const safeSrc = getSafeAvatarUrl(src);
  const accessibleName = alt || name || "User";
  const showImage = Boolean(safeSrc) && failedSrc !== safeSrc;

  if (showImage) {
    return (
      <img
        src={safeSrc}
        alt={accessibleName}
        className={className}
        onError={() => setFailedSrc(safeSrc)}
      />
    );
  }

  const toneClass = getAvatarToneClasses(name);
  const initials = getInitials(name);
  const sizeText = SIZE_TEXT_CLASSES[size] || SIZE_TEXT_CLASSES.md;

  return (
    <div
      role="img"
      aria-label={accessibleName}
      className={`flex items-center justify-center font-headline font-bold select-none uppercase ${toneClass} ${sizeText} ${textClassName} ${className}`}
    >
      {initials}
    </div>
  );
}

export default UserAvatar;

