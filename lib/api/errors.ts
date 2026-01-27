// lib/api/errors.ts
// Centralized API error handling for Django REST Framework responses

import { AxiosError } from 'axios';

/**
 * Standard DRF error response formats:
 *
 * 1. Detail string:        { "detail": "Not found." }
 * 2. Non-field errors:     { "non_field_errors": ["Invalid credentials."] }
 * 3. Field errors:         { "email": ["This field is required."], "password": ["Too short."] }
 * 4. Nested field errors:  { "profile": { "bio": ["Too long."] } }
 * 5. Mixed:                { "detail": "...", "email": ["..."] }
 */

export interface DRFErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [field: string]: string | string[] | Record<string, string[]> | undefined;
}

export interface FieldError {
  field: string;
  messages: string[];
}

/**
 * Normalized API error that provides a consistent interface
 * regardless of how the backend formats the error.
 */
export class ApiError extends Error {
  public readonly status: number | undefined;
  public readonly data: DRFErrorResponse | undefined;
  public readonly fieldErrors: FieldError[];
  public readonly isNetworkError: boolean;

  constructor(error: unknown) {
    const axiosError = error as AxiosError<DRFErrorResponse>;
    const message = ApiError.extractMessage(axiosError);

    super(message);
    this.name = 'ApiError';
    this.status = axiosError.response?.status;
    this.data = axiosError.response?.data;
    this.fieldErrors = ApiError.extractFieldErrors(axiosError);
    this.isNetworkError = !axiosError.response && !!axiosError.request;
  }

  /**
   * Get the primary error message for display in alerts/toasts.
   */
  static extractMessage(error: AxiosError<DRFErrorResponse>): string {
    const data = error.response?.data;

    // No response data - network error or server crash
    if (!data) {
      if (!error.response && error.request) {
        return 'Network error. Please check your connection.';
      }
      return error.message || 'An unexpected error occurred.';
    }

    // DRF detail field (most common for auth errors, 404s, etc.)
    if (data.detail) {
      return data.detail;
    }

    // DRF non_field_errors (validation errors not tied to a specific field)
    if (data.non_field_errors?.length) {
      return data.non_field_errors[0];
    }

    // Field-specific errors - return first one found
    const fieldError = ApiError.getFirstFieldError(data);
    if (fieldError) {
      return fieldError;
    }

    // Fallback
    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Extract all field-specific errors for form validation display.
   */
  static extractFieldErrors(error: AxiosError<DRFErrorResponse>): FieldError[] {
    const data = error.response?.data;
    if (!data) return [];

    const fieldErrors: FieldError[] = [];
    const skipFields = ['detail', 'non_field_errors'];

    for (const [field, value] of Object.entries(data)) {
      if (skipFields.includes(field)) continue;

      if (Array.isArray(value)) {
        fieldErrors.push({ field, messages: value });
      } else if (typeof value === 'object' && value !== null) {
        // Nested errors (e.g., { profile: { bio: ["..."] } })
        for (const [nestedField, nestedValue] of Object.entries(value)) {
          if (Array.isArray(nestedValue)) {
            fieldErrors.push({
              field: `${field}.${nestedField}`,
              messages: nestedValue
            });
          }
        }
      }
    }

    return fieldErrors;
  }

  /**
   * Get the first field error message (for simple alert display).
   */
  private static getFirstFieldError(data: DRFErrorResponse): string | null {
    const skipFields = ['detail', 'non_field_errors'];

    for (const [field, value] of Object.entries(data)) {
      if (skipFields.includes(field)) continue;

      if (Array.isArray(value) && value.length > 0) {
        return value[0];
      }
    }

    return null;
  }

  /**
   * Check if error is a specific HTTP status.
   */
  isStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if there's an error for a specific field.
   */
  hasFieldError(field: string): boolean {
    return this.fieldErrors.some(e => e.field === field);
  }

  /**
   * Get error messages for a specific field.
   */
  getFieldError(field: string): string[] {
    return this.fieldErrors.find(e => e.field === field)?.messages ?? [];
  }
}

/**
 * Helper function for quick error message extraction.
 * Use this in catch blocks when you just need the message string.
 *
 * @example
 * try {
 *   await api.post('/endpoint', data);
 * } catch (err) {
 *   Alert.alert('Error', getErrorMessage(err));
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check if it's an Axios error
    const axiosError = error as AxiosError<DRFErrorResponse>;
    if (axiosError.isAxiosError) {
      return ApiError.extractMessage(axiosError);
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred.';
}

/**
 * Type guard to check if an error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
