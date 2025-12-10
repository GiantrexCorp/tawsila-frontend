/**
 * Error handling utilities for consistent error management across the application
 */

/**
 * API Error with additional metadata
 */
export interface ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Extracts a user-friendly error message from an unknown error
 * @param error - The error to extract message from
 * @param fallback - Fallback message if no message can be extracted
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

/**
 * Extracts validation errors from a Laravel-style API error response
 * @param error - The error object from API
 * @returns Record of field names to error messages, or null if not a validation error
 */
export function getValidationErrors(error: unknown): Record<string, string> | null {
  if (!error || typeof error !== 'object' || !('errors' in error)) {
    return null;
  }

  const apiError = error as { errors?: Record<string, string[]> };
  if (!apiError.errors) {
    return null;
  }

  const formattedErrors: Record<string, string> = {};
  Object.entries(apiError.errors).forEach(([key, messages]) => {
    formattedErrors[key] = messages[0];
  });

  return formattedErrors;
}

/**
 * Checks if an error is a specific HTTP status
 * @param error - The error to check
 * @param status - The HTTP status code to check for
 * @returns True if the error matches the status
 */
export function isHttpError(error: unknown, status: number): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return 'status' in error && error.status === status;
}

/**
 * Checks if error is a 403 Forbidden
 */
export function isForbiddenError(error: unknown): boolean {
  return isHttpError(error, 403);
}

/**
 * Checks if error is a 404 Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  return isHttpError(error, 404);
}

/**
 * Checks if error is a 401 Unauthorized
 */
export function isUnauthorizedError(error: unknown): boolean {
  return isHttpError(error, 401);
}

/**
 * Formats all validation error messages into a single string
 * @param error - The error object from API
 * @returns Comma-separated error messages or null
 */
export function formatValidationErrors(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('errors' in error)) {
    return null;
  }

  const apiError = error as { errors?: Record<string, string[]> };
  if (!apiError.errors) {
    return null;
  }

  return Object.values(apiError.errors).flat().join(', ');
}
