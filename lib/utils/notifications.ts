import { MinimalUser } from "@/types/api";

export const formatNotificationParts = (
    type: string,
    sender: MinimalUser,
    metadata: { fallbackText?: string }
) => {
    const name = sender.display_name || sender.username || "Someone";
  
    switch (type) {
      case "quote_liked":
        return {
          actor: name,
          action: "liked",
          object: "your quote."
        };
  
      case "quote_witnessed":
        return {
          actor: name,
          action: "witnessed",
          object: "your quote."
        };
  
      case "new_quote":
        return {
          actor: name,
          action: "posted a quote from you.",
          object: null
        };
  
      case "friend_request":
        return {
          actor: name,
          action: "sent you a friend request.",
          object: null
        };
  
      case "friend_accepted":
        return {
          actor: name,
          action: "accepted your friend request.",
          object: null
        };
  
      default:
        return {
          actor: name,
          action: metadata?.fallbackText || "",
          object: null
        };
    }
};
