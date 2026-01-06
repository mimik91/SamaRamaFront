// ============================================
// API MODELS - WSPÓLNE DLA CAŁEJ APLIKACJI
// ============================================

/**
 * Odpowiedź z ID serwisu
 */
export interface ServiceIdResponse {
  id: number;
}

/**
 * Odpowiedź z URL obrazu serwisu
 */
export interface ServiceImageResponse {
  url: string;
}

/**
 * Błąd API
 */
export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp?: string;
}

/**
 * Błąd walidacji
 */
export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

/**
 * Standardowa odpowiedź sukcesu
 */
export interface SuccessResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Odpowiedź z informacją o usunięciu
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
  deletedId: number;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Sprawdza czy obiekt jest błędem API
 */
export function isApiError(error: any): error is ApiError {
  return error && 
    typeof error === 'object' && 
    'error' in error && 
    'message' in error && 
    'status' in error;
}

/**
 * Sprawdza czy obiekt jest błędem walidacji
 */
export function isValidationError(error: any): error is ValidationError {
  return error && 
    typeof error === 'object' && 
    'field' in error && 
    'message' in error;
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Formatuje błąd do wyświetlenia użytkownikowi
 */
export function formatErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
}

/**
 * Formatuje błędy walidacji do wyświetlenia
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => `${e.field}: ${e.message}`).join(', ');
}