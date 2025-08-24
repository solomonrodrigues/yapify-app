import { resendVerificationCode } from "@/api/auth";
import { Alert } from "react-native";

export interface LoginError {
  non_field_errors?: string[];
  detail?: string;
  message?: string;
}

export default class LoginErrorHandler {
  private router: any;
  private email: string

  constructor(router: any, email: string) {
    this.router = router;
    this.email = email;
  }

  handle(error: any): void {
    const errorData: LoginError = error.response?.data || {};
    const status = error.response?.status;

    // Get the first non_field_error message
    const errorMessage = this.getErrorMessage(errorData);

    // Check for specific backend error messages from your Django serializer
    if (errorMessage === 'Email not verified') {
      this.showEmailVerificationDialog();
    } else if (errorMessage === 'User account is disabled') {
      this.showAccountDisabledDialog();
    } else if (errorMessage === 'Invalid credentials') {
      this.showCredentialsDialog();
    } else if (errorMessage === 'Must include email and password') {
      this.showMissingFieldsDialog();
    } else if (this.isRateLimitError(errorData, status)) {
      this.showRateLimitDialog();
    } else {
      this.showGenericError(errorData);
    }
  }

  private getErrorMessage(errorData: LoginError): string {
    // Check non_field_errors first (Django DRF format)
    if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
      return errorData.non_field_errors[0];
    }
    
    // Fallback to detail or message
    return errorData.detail || errorData.message || '';
  }

  private isRateLimitError(errorData: LoginError, status?: number): boolean {
    // Keep status code check for rate limiting as it's typically handled at server/nginx level
    return status === 429;
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
            await resendVerificationCode(this.email);
            this.router.push(`/auth/email-verification?email=${encodeURIComponent(this.email)}`)
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

  private showMissingFieldsDialog(): void {
    Alert.alert(
      "Missing Information",
      "Please enter both email and password.",
      [{ text: "OK" }]
    );
  }

  private showGenericError(errorData: LoginError): void {
    const message = this.getErrorMessage(errorData) || "Login failed. Please try again.";
    Alert.alert("Login Failed", message);
  }
}
