import { Alert } from "react-native";

export interface LoginError {
  code?: string;
  detail?: string;
  message?: string;
  field_errors?: Record<string, string[]>;
}

export default class LoginErrorHandler {
  private router: any;

  constructor(router: any) {
    this.router = router;
  }

  handle(error: any): void {
    const errorData: LoginError = error.response?.data || {};
    const status = error.response?.status;

    // Check for specific backend error messages from your Django serializer
    if (this.isEmailVerificationError(errorData)) {
      this.showEmailVerificationDialog();
    } else if (this.isAccountDisabledError(errorData)) {
      this.showAccountDisabledDialog();
    } else if (this.isCredentialsError(errorData)) {
      this.showCredentialsDialog();
    } else if (this.isRateLimitError(errorData, status)) {
      this.showRateLimitDialog();
    } else {
      this.showGenericError(errorData);
    }
  }

  private isEmailVerificationError(errorData: LoginError): boolean {
    const detail = errorData.detail || errorData.message || '';
    return detail === 'Email not verified';
  }

  private isAccountDisabledError(errorData: LoginError): boolean {
    const detail = errorData.detail || errorData.message || '';
    return detail === 'User account is disabled';
  }

  private isRateLimitError(errorData: LoginError, status?: number): boolean {
    // Keep status code check for rate limiting as it's typically handled at server/nginx level
    return status === 429;
  }

  private isCredentialsError(errorData: LoginError): boolean {
    const detail = errorData.detail || errorData.message || '';
    return detail === 'Invalid credentials';
  }

  private showEmailVerificationDialog(): void {
    Alert.alert(
      "Email Verification Required",
      "Please verify your email address to continue.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Verify Now", 
          onPress: () => this.router.push("/auth/email-verification") 
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
          onPress: () => this.router.push("/auth/forgot-password") 
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
          onPress: () => this.router.push("/auth/forgot-password") 
        }
      ]
    );
  }

  private showGenericError(errorData: LoginError): void {
    const message = errorData.detail || errorData.message || "Login failed. Please try again.";
    Alert.alert("Login Failed", message);
  }
}
