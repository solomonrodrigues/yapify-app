import { User, PublicUser, MinimalUser } from "@/types/api";

export function getInitials(user: User | PublicUser | MinimalUser | null) {
  if (user == null) {
    return "?"
  }
  const initial = user.display_name?.trim()?.[0]?.toUpperCase() ?? "";
  return initial || "?";
}
