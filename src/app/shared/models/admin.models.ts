// ============================================
// ADMIN PANEL MODELS
// ============================================

/**
 * Statystyki dla dashboardu admina
 */
export interface DashboardStats {
  totalUsers: number;
  totalBicycles: number;
  totalServices: number;
  pendingOrders: number;
  user?: any;
  authorities?: string[];
}

/**
 * Użytkownik w panelu admina
 */
export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
  verified: boolean;
  createdAt: string;
}

/**
 * Generyczna odpowiedź paginowana
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
