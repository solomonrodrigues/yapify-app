// Common User shape
export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string;
  // add other fields from your serializer if needed
}

// Auth
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

// Quotes
export interface Quote {
  id: number;
  text: string;
  author_name: string;
  quoted_user_name: string;
  witness_count: number;
  like_count: number;
  is_liked: boolean;
}

export interface CreateQuote {
  text: string;
  quoted_user_email: string;
}

// Notifications
export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
}
