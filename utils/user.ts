import { User } from "@/types/api";
import { use } from "react";

export function getInitials(user: User | null) {
  if (user == null) {
    return "?"
  }
  const initial = user.display_name?.trim()?.[0]?.toUpperCase() ?? "";
  return initial || "?";
}
