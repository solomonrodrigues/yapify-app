import type { Router } from 'expo-router';
import { Alert } from "react-native";

export interface LoginError {
  code?: string;
  detail?: string;
  errors?: Record<string, Array<{ code: string; detail: string }>>;
}

export default class LoginErrorHandler {
  private router: Router;
  private email: string;

  constructor(router: Router, email: string) {
    this.router = router;
    this.email = email;
  }

  handle(error: unknown): void {
    const axiosError = error as { response?: { data?: LoginError } };
    const errorData: LoginError = axiosError.response?.data || {};

    // Switch on the stable machine-readable code from the backend
    switch (errorData.code) {
      case 'EMAIL_NOT_VERIFIED':
        this.showEmailVerificationDialog();
        break;
      case 'ACCOUNT_DISABLED':
        this.showAccountDisabledDialog();
        break;
      case 'INVALID_CREDENTIALS':
        this.showCredentialsDialog();
        break;
      case 'MISSING_CREDENTIALS':
        this.showMissingFieldsDialog();
        break;
      case 'THROTTLED':
        this.showRateLimitDialog();
        break;
      default:
        this.showGenericError(errorData);
    }
  }

  private showEmailVerificationDialog(): void {
    Alert.alert(
      "Email Verification Required",
      "Please verify your email address to continue.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify Now",
          onPress: async () => {
            this.router.push(`/(auth)/email-verification?email=${encodeURIComponent(this.email)}`)
          }
        }
      ]
    );
  }

  private showAccountDisabledDialog(): void {
    Alert.alert(
      "Account Disabled",
      "Your account has been disabled. Please contact support.",
      [{ text: "OK" }]
    );
  }

  private showRateLimitDialog(): void {
    Alert.alert(
      "Too Many Attempts",
      "Please wait before trying again or reset your password.",
      [
        { text: "Wait", style: "cancel" },
        {
          text: "Reset Password",
          onPress: () => this.router.push("/(auth)/reset-password")
        }
      ]
    );
  }

  private showCredentialsDialog(): void {
    Alert.alert(
      "Invalid Credentials",
      "Email or password is incorrect.",
      [
        { text: "Try Again", style: "cancel" },
        {
          text: "Forgot Password?",
          onPress: () => this.router.push("/(auth)/reset-password")
        }
      ]
    );
  }

  private showMissingFieldsDialog(): void {
    Alert.alert(
      "Missing Information",
      "Please enter both email and password.",
      [{ text: "OK" }]
    );
  }

  private showGenericError(errorData: LoginError): void {
    const message = errorData.detail || "Login failed. Please try again.";
    Alert.alert("Login Failed", message);
  }
}
