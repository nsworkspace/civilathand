export const PROFILE_AVATAR_OPTIONS = [
  { id: "avatar-01", label: "Professional Avatar 1", imageUrl: "/profile-avatars/avatar-01.jpg", order: 1, category: "profile-avatar", active: true },
  { id: "avatar-02", label: "Professional Avatar 2", imageUrl: "/profile-avatars/avatar-02.jpg", order: 2, category: "profile-avatar", active: true },
  { id: "avatar-03", label: "Professional Avatar 3", imageUrl: "/profile-avatars/avatar-03.jpg", order: 3, category: "profile-avatar", active: true },
  { id: "avatar-04", label: "Professional Avatar 4", imageUrl: "/profile-avatars/avatar-04.jpg", order: 4, category: "profile-avatar", active: true },
  { id: "avatar-05", label: "Professional Avatar 5", imageUrl: "/profile-avatars/avatar-05.jpg", order: 5, category: "profile-avatar", active: true },
  { id: "avatar-06", label: "Professional Avatar 6", imageUrl: "/profile-avatars/avatar-06.jpg", order: 6, category: "profile-avatar", active: true },
] as const;

const LEGACY_PROFILE_AVATAR_IDS: Record<string, string> = {
  "professional-avatar-01": "avatar-01",
  "professional-avatar-02": "avatar-02",
  "professional-avatar-03": "avatar-03",
  "professional-avatar-04": "avatar-04",
  "professional-avatar-05": "avatar-05",
  "professional-avatar-06": "avatar-06",
};

export function normalizeProfileAvatarId(profileImageId?: string | null) {
  if (!profileImageId) return "avatar-01";
  return LEGACY_PROFILE_AVATAR_IDS[profileImageId] || profileImageId;
}

export function getProfileAvatarOption(profileImageId?: string | null) {
  const normalizedId = normalizeProfileAvatarId(profileImageId);
  return PROFILE_AVATAR_OPTIONS.find((option) => option.id === normalizedId) || null;
}
