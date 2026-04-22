import { User, PublicUser, PublicUserSummary, MinimalUser } from "@/types/api";

export function getInitials(user: User | PublicUser | PublicUserSummary | MinimalUser | null) {
  if (user == null) {
    return "?"
  }
  const initial = user.display_name?.trim()?.[0]?.toUpperCase() ?? "";
  return initial || "?";
}
