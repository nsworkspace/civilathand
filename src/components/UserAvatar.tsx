"use client";

import React, { useEffect, useState } from "react";
import { getProfileAvatarOption, normalizeProfileAvatarId } from "@/lib/profile-avatar-options";

type UserAvatarProps = {
  name?: string | null;
  profileImageId?: string | null;
  profileImageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  title?: string;
};

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "h-7 w-7 text-[9px]",
  sm: "h-9 w-9 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-2xl",
};

function initialsFor(name?: string | null) {
  return (name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

function readCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cah_user");
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

export function UserAvatar({
  name,
  profileImageId,
  profileImageUrl,
  size = "md",
  className = "",
  title,
}: UserAvatarProps) {
  const [cachedUser, setCachedUser] = useState<any>(null);

  useEffect(() => {
    const sync = () => setCachedUser(readCachedUser());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const effectiveName = name || cachedUser?.name;
  const effectiveProfileImageId = profileImageId || cachedUser?.profileImageId;
  const effectiveProfileImageUrl = profileImageUrl || cachedUser?.profileImageUrl;
  const normalizedId = effectiveProfileImageId ? normalizeProfileAvatarId(effectiveProfileImageId) : null;
  const canonical = normalizedId ? getProfileAvatarOption(normalizedId) : null;
  const candidateUrl = canonical?.imageUrl || effectiveProfileImageUrl || "";
  const imageUrl = candidateUrl.startsWith("/profile-avatars/") || candidateUrl.startsWith("data:image/") ? candidateUrl : "";

  return (
    <span
      title={title || effectiveName || "User profile"}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-gradient-to-br from-orange-400 to-orange-600 font-extrabold text-white shadow-sm ring-1 ring-black/10 ${SIZE_CLASSES[size]} ${className}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={effectiveName ? `${effectiveName} profile avatar` : "Profile avatar"}
          className="absolute inset-0 z-10 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <span className="relative z-0 flex h-full w-full items-center justify-center">
        {initialsFor(effectiveName)}
      </span>
    </span>
  );
}

export default UserAvatar;
