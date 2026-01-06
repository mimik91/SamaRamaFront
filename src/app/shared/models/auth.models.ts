// ============================================
// AUTHENTICATION & AUTHORIZATION MODELS
// ============================================

/**
 * Dane logowania
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Dane rejestracji użytkownika
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/**
 * Odpowiedź z backendu po zalogowaniu/rejestracji
 */
export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: 'CLIENT' | 'SERVICE' | 'ADMIN' | 'MODERATOR';
  redirectUrl?: string;
  // Dla SERVICE users
  bikeServiceIds?: number[];
  suffixes?: string[];
}

/**
 * Sesja użytkownika (przechowywana lokalnie)
 */
export interface UserSession {
  token: string;
  role: 'CLIENT' | 'SERVICE' | 'ADMIN' | 'MODERATOR';
  userId: number;
  email: string;
  name?: string;
  expiresAt: number;
}

/**
 * Dane serwisu przypisanego do użytkownika
 */
export interface ServiceData {
  serviceId: number;
  suffix: string;
}

/**
 * Dane żądania resetu hasła
 */
export interface PasswordResetRequestDto {
  email: string;
}

/**
 * Dane do zresetowania hasła
 */
export interface PasswordResetDto {
  token: string;
  newPassword: string;
}

/**
 * Status weryfikacji serwisu
 */
export interface ServiceVerificationStatus {
  hasService: boolean;
  serviceId?: number;
  serviceName?: string;
  suffix?: string;
  isActive?: boolean;
  verified?: boolean;
}

/**
 * Odpowiedź po resecie hasła
 */
export interface PasswordResetResponse {
  message: string;
  requiresVerification?: boolean;
  isGuestUser?: boolean;
}
