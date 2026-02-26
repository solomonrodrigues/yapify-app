// lib/api/errors.ts
// Centralized API error handling for Django REST Framework responses

import { AxiosError } from 'axios';

/**
 * Standard API error response formats:
 *
 * 1. Domain / auth error:
 *    { "code": "INVALID_CREDENTIALS", "detail": "Invalid credentials." }
 *
 * 2. Field validation error:
 *    { "code": "VALIDATION_ERROR", "errors": { "email": [{ "code": "REQUIRED", "detail": "This field is required." }] } }
 *
 * 3. Framework errors (NotFound, Throttled, etc.):
 *    { "code": "NOT_FOUND", "detail": "Not found." }
 */

export interface FieldErrorDetail {
  code: string;
  detail: string;
}

export interface DRFErrorResponse {
  code?: string;
  detail?: string;
  errors?: Record<string, FieldErrorDetail[] | Record<string, FieldErrorDetail[]>>;
}

export interface FieldError {
  field: string;
  messages: string[];
  codes: string[];
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
  public readonly code: string | undefined;

  constructor(error: unknown) {
    const axiosError = error as AxiosError<DRFErrorResponse>;
    const message = ApiError.extractMessage(axiosError);

    super(message);
    this.name = 'ApiError';
    this.status = axiosError.response?.status;
    this.data = axiosError.response?.data;
    this.fieldErrors = ApiError.extractFieldErrors(axiosError);
    this.isNetworkError = !axiosError.response && !!axiosError.request;
    this.code = axiosError.response?.data?.code;
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

    // Domain / auth / framework errors: { code, detail }
    if (data.detail) {
      return data.detail;
    }

    // Field validation errors: { code: "VALIDATION_ERROR", errors: { field: [{ code, detail }] } }
    if (data.errors) {
      const firstFieldMessage = ApiError.getFirstFieldErrorMessage(data.errors);
      if (firstFieldMessage) {
        return firstFieldMessage;
      }
    }

    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Extract all field-specific errors for form validation display.
   */
  static extractFieldErrors(error: AxiosError<DRFErrorResponse>): FieldError[] {
    const data = error.response?.data;
    if (!data?.errors) return [];

    const fieldErrors: FieldError[] = [];

    for (const [field, value] of Object.entries(data.errors)) {
      if (Array.isArray(value)) {
        // { email: [{ code, detail }] }
        fieldErrors.push({
          field,
          messages: value.map(e => e.detail),
          codes: value.map(e => e.code),
        });
      } else if (typeof value === 'object' && value !== null) {
        // Nested serializer: { nested_field: { sub_field: [{ code, detail }] } }
        for (const [nestedField, nestedValue] of Object.entries(value)) {
          if (Array.isArray(nestedValue)) {
            fieldErrors.push({
              field: `${field}.${nestedField}`,
              messages: nestedValue.map((e: FieldErrorDetail) => e.detail),
              codes: nestedValue.map((e: FieldErrorDetail) => e.code),
            });
          }
        }
      }
    }

    return fieldErrors;
  }

  /**
   * Get the first field error message string (for simple alert display).
   */
  private static getFirstFieldErrorMessage(
    errors: Record<string, FieldErrorDetail[] | Record<string, FieldErrorDetail[]>>
  ): string | null {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && value.length > 0) {
        return value[0].detail;
      }
      if (typeof value === 'object' && value !== null) {
        for (const nestedValue of Object.values(value)) {
          if (Array.isArray(nestedValue) && nestedValue.length > 0) {
            return (nestedValue[0] as FieldErrorDetail).detail;
          }
        }
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

  /**
   * Get error codes for a specific field.
   */
  getFieldErrorCodes(field: string): string[] {
    return this.fieldErrors.find(e => e.field === field)?.codes ?? [];
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
 * Extract the machine-readable error code from a response.
 * Returns undefined if the error has no code or isn't an Axios error.
 */
export function getErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<DRFErrorResponse>;
  return axiosError?.response?.data?.code;
}

/**
 * Type guard to check if an error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
