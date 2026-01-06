// ============================================
// USER & ACCOUNT MODELS
// ============================================

/**
 * Profil użytkownika
 */
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

/**
 * Dane do aktualizacji profilu użytkownika
 */
export interface UserUpdateData {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}

/**
 * Dane do zmiany hasła
 */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}
