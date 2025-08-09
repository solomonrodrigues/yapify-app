// Common User shape
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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
  author: User;
  quoted_user: User;
  is_public: boolean;
  is_active: boolean;
  // Add more fields if needed
}

// Notifications
export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
}
