import { User } from "@/types/api";
import { use } from "react";

export function getInitials(user: User | null) {
  if (user == null) {
    return "?"
  }
  const firstInitial = user.first_name?.trim()?.[0]?.toUpperCase() ?? "";
  const lastInitial = user.last_name?.trim()?.[0]?.toUpperCase() ?? "";
  return (firstInitial + lastInitial) || "?";
}
