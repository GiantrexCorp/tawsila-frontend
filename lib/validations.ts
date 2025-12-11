/**
 * Form Validation Utilities
 *
 * Centralized validation functions for Egyptian phone numbers, emails, and other common patterns.
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate Egyptian mobile number
 * Must start with 01 and be exactly 11 digits
 * Valid formats: 01XXXXXXXXX (e.g., 01111293179)
 *
 * Egyptian mobile prefixes:
 * - 010: Vodafone
 * - 011: Etisalat
 * - 012: Orange
 * - 015: WE
 */
export function validateEgyptianMobile(mobile: string): ValidationResult {
  // Remove any spaces, dashes, or formatting
  const cleaned = mobile.replace(/[\s\-\(\)]/g, '');

  // Check if empty
  if (!cleaned) {
    return { isValid: false, message: 'mobileRequired' };
  }

  // Check length (must be exactly 11 digits)
  if (cleaned.length !== 11) {
    return { isValid: false, message: 'mobileMustBe11Digits' };
  }

  // Check if starts with 01
  if (!cleaned.startsWith('01')) {
    return { isValid: false, message: 'mobileMustStartWith01' };
  }

  // Check if third digit is valid (0, 1, 2, or 5)
  const thirdDigit = cleaned[2];
  if (!['0', '1', '2', '5'].includes(thirdDigit)) {
    return { isValid: false, message: 'mobileInvalidPrefix' };
  }

  // Check if all characters are digits
  if (!/^\d{11}$/.test(cleaned)) {
    return { isValid: false, message: 'mobileMustBeDigitsOnly' };
  }

  return { isValid: true };
}

/**
 * Validate email format
 * Checks for standard email pattern
 */
export function validateEmail(email: string): ValidationResult {
  // Check if empty
  if (!email || !email.trim()) {
    return { isValid: false, message: 'emailRequired' };
  }

  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'emailInvalidFormat' };
  }

  // Additional checks
  const trimmed = email.trim();

  // Check for double dots
  if (trimmed.includes('..')) {
    return { isValid: false, message: 'emailInvalidFormat' };
  }

  // Check domain has at least 2 characters after last dot
  const parts = trimmed.split('@');
  if (parts.length === 2) {
    const domainParts = parts[1].split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return { isValid: false, message: 'emailInvalidFormat' };
    }
  }

  return { isValid: true };
}

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName?: string): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, message: fieldName ? `${fieldName}Required` : 'fieldRequired' };
  }
  return { isValid: true };
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number): ValidationResult {
  if (!value || value.trim().length < minLength) {
    return { isValid: false, message: 'minLengthNotMet' };
  }
  return { isValid: true };
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number): ValidationResult {
  if (value && value.length > maxLength) {
    return { isValid: false, message: 'maxLengthExceeded' };
  }
  return { isValid: true };
}

/**
 * Validate password requirements
 * - Minimum 6 characters
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: 'passwordRequired' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'passwordMinLength' };
  }

  return { isValid: true };
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmation: string): ValidationResult {
  if (!confirmation) {
    return { isValid: false, message: 'confirmPasswordRequired' };
  }

  if (password !== confirmation) {
    return { isValid: false, message: 'passwordsDoNotMatch' };
  }

  return { isValid: true };
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number | string): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, message: 'mustBeNumber' };
  }

  if (num <= 0) {
    return { isValid: false, message: 'mustBePositive' };
  }

  return { isValid: true };
}

/**
 * Validate non-negative number (0 or greater)
 */
export function validateNonNegativeNumber(value: number | string): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, message: 'mustBeNumber' };
  }

  if (num < 0) {
    return { isValid: false, message: 'mustBeNonNegative' };
  }

  return { isValid: true };
}

/**
 * Validate coordinates (latitude/longitude)
 */
export function validateCoordinates(lat: string | number, lng: string | number): ValidationResult {
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;

  if (isNaN(latitude) || isNaN(longitude)) {
    return { isValid: false, message: 'invalidCoordinates' };
  }

  // Valid latitude range: -90 to 90
  if (latitude < -90 || latitude > 90) {
    return { isValid: false, message: 'latitudeOutOfRange' };
  }

  // Valid longitude range: -180 to 180
  if (longitude < -180 || longitude > 180) {
    return { isValid: false, message: 'longitudeOutOfRange' };
  }

  return { isValid: true };
}

/**
 * Validate select field (must not be 0 or empty)
 */
export function validateSelect(value: number | string): ValidationResult {
  if (!value || value === 0 || value === '0' || value === '') {
    return { isValid: false, message: 'selectionRequired' };
  }
  return { isValid: true };
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(file: File, maxSizeInMB: number = 5): ValidationResult {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return { isValid: false, message: 'fileTooLarge' };
  }

  return { isValid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  const isValidType = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      // Check extension
      return fileName.endsWith(type);
    }
    // Check MIME type
    return fileType === type || fileType.startsWith(type.replace('*', ''));
  });

  if (!isValidType) {
    return { isValid: false, message: 'invalidFileType' };
  }

  return { isValid: true };
}

/**
 * Validate Arabic text (must contain Arabic characters)
 */
export function validateArabicText(text: string): ValidationResult {
  if (!text || !text.trim()) {
    return { isValid: false, message: 'fieldRequired' };
  }

  // Arabic Unicode range
  const arabicRegex = /[\u0600-\u06FF]/;

  if (!arabicRegex.test(text)) {
    return { isValid: false, message: 'mustContainArabic' };
  }

  return { isValid: true };
}

/**
 * Validate English text (must contain only English characters, numbers, spaces, and common punctuation)
 */
export function validateEnglishText(text: string): ValidationResult {
  if (!text || !text.trim()) {
    return { isValid: false, message: 'fieldRequired' };
  }

  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;

  if (arabicRegex.test(text)) {
    return { isValid: false, message: 'mustBeEnglishOnly' };
  }

  return { isValid: true };
}

/**
 * Helper to format Egyptian mobile for display
 * Formats as: 0XXX XXX XXXX
 */
export function formatEgyptianMobile(mobile: string): string {
  const cleaned = mobile.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return mobile;
}

/**
 * Helper to clean mobile number (remove formatting)
 */
export function cleanMobileNumber(mobile: string): string {
  return mobile.replace(/[\s\-\(\)]/g, '');
}
