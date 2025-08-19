import { User, PublicUser } from "@/types/api";

export function getInitials(user: User | PublicUser | null) {
  if (user == null) {
    return "?"
  }
  const initial = user.display_name?.trim()?.[0]?.toUpperCase() ?? "";
  return initial || "?";
}
