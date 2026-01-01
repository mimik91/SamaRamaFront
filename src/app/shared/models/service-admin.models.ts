// ============================================
// SERVICE ADMIN PANEL MODELS
// ============================================

/**
 * Uproszczony DTO z nazwą i ID serwisu (dla listy dropdown)
 */
export interface BikeServiceNameIdDto {
  id: number;
  name: string;
}

/**
 * Pełny DTO zarejestrowanego serwisu rowerowego
 */
export interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email?: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  suffix?: string;
  contactPerson?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  description?: string;
  isRegistered: boolean;
  openingHours?: OpeningHoursDto;
  openingHoursInfo?: string;
  openingHoursNote?: string;
  pricelistInfo?: string;
  pricelistNote?: string;
}

/**
 * DTO godzin otwarcia serwisu
 */
export interface OpeningHoursDto {
  id?: number;
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

/**
 * Godziny otwarcia dla pojedynczego dnia
 */
export interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

// ============================================
// TAB TYPES
// ============================================

/**
 * Typ zakładki w panelu administracyjnym
 */
export type AdminPanelTab = 'basic' | 'services' | 'pricelist' | 'hours' | 'images';

/**
 * Konfiguracja zakładki
 */
export interface TabConfig {
  id: AdminPanelTab;
  labelKey: string;
  component?: string;
  icon?: string;
}

/**
 * Wszystkie dostępne zakładki w panelu
 */
export const ADMIN_PANEL_TABS: TabConfig[] = [
  {
    id: 'basic',
    labelKey: 'service_admin.tabs.basic_info',
    icon: 'info'
  },
  {
    id: 'services',
    labelKey: 'service_admin.tabs.services',
    icon: 'wrench'
  },
  {
    id: 'pricelist',
    labelKey: 'service_admin.tabs.pricelist',
    icon: 'list'
  },
  {
    id: 'hours',
    labelKey: 'service_admin.tabs.hours',
    icon: 'clock'
  },
  {
    id: 'images',
    labelKey: 'service_admin.tabs.images',
    icon: 'image'
  }
];

// ============================================
// LOADING STATES
// ============================================

/**
 * Stan ładowania dla panelu administracyjnego
 */
export interface AdminPanelLoadingState {
  isLoadingServices: boolean;
  isLoadingDetails: boolean;
  servicesError: string;
  detailsError: string;
}

/**
 * Domyślny stan ładowania
 */
export const DEFAULT_LOADING_STATE: AdminPanelLoadingState = {
  isLoadingServices: true,
  isLoadingDetails: false,
  servicesError: '',
  detailsError: ''
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sprawdza czy serwis ma kompletne dane adresowe
 */
export function hasCompleteAddress(service: BikeServiceRegisteredDto): boolean {
  return !!(
    service.street &&
    service.building &&
    service.city &&
    service.postalCode
  );
}

/**
 * Sprawdza czy serwis ma dane kontaktowe
 */
export function hasContactInfo(service: BikeServiceRegisteredDto): boolean {
  return !!(service.phoneNumber || service.email);
}

/**
 * Sprawdza czy serwis ma social media
 */
export function hasSocialMedia(service: BikeServiceRegisteredDto): boolean {
  return !!(
    service.facebook ||
    service.instagram ||
    service.tiktok ||
    service.youtube
  );
}

/**
 * Formatuje adres serwisu do wyświetlenia
 */
export function formatServiceAddress(service: BikeServiceRegisteredDto): string {
  const parts: string[] = [];
  
  if (service.street && service.building) {
    let address = `${service.street} ${service.building}`;
    if (service.flat) {
      address += `/${service.flat}`;
    }
    parts.push(address);
  }
  
  if (service.postalCode && service.city) {
    parts.push(`${service.postalCode} ${service.city}`);
  } else if (service.city) {
    parts.push(service.city);
  }
  
  return parts.join(', ');
}

/**
 * Sprawdza czy zakładka jest aktywna
 */
export function isTabActive(currentTab: AdminPanelTab, tabId: AdminPanelTab): boolean {
  return currentTab === tabId;
}

/**
 * Waliduje czy tab jest poprawnym typem
 */
export function isValidTab(tab: string): tab is AdminPanelTab {
  return ['basic', 'services', 'pricelist', 'hours', 'images'].includes(tab);
}

/**
 * Zwraca domyślną zakładkę
 */
export function getDefaultTab(): AdminPanelTab {
  return 'basic';
}

/**
 * Zwraca konfigurację zakładki po ID
 */
export function getTabConfig(tabId: AdminPanelTab): TabConfig | undefined {
  return ADMIN_PANEL_TABS.find(tab => tab.id === tabId);
}

// ============================================
// VALIDATION
// ============================================

/**
 * Waliduje dane serwisu
 */
export interface ServiceValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Waliduje podstawowe dane serwisu
 */
export function validateServiceBasicInfo(service: Partial<BikeServiceRegisteredDto>): ServiceValidation {
  const errors: string[] = [];
  
  if (!service.name || service.name.trim().length < 3) {
    errors.push('Nazwa serwisu musi mieć co najmniej 3 znaki');
  }
  
  if (service.email && !isValidEmail(service.email)) {
    errors.push('Nieprawidłowy format adresu email');
  }
  
  if (service.phoneNumber && !isValidPhoneNumber(service.phoneNumber)) {
    errors.push('Nieprawidłowy format numeru telefonu');
  }
  
  if (service.website && !isValidUrl(service.website)) {
    errors.push('Nieprawidłowy format adresu strony internetowej');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Waliduje email
 */
function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Waliduje numer telefonu (9 cyfr)
 */
function isValidPhoneNumber(phone: string): boolean {
  const phonePattern = /^\d{9}$/;
  return phonePattern.test(phone.replace(/\s/g, ''));
}

/**
 * Waliduje URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Standardowy błąd API dla panelu administracyjnego
 */
export interface AdminPanelApiError {
  error: string;
  message: string;
  status: number;
  timestamp?: string;
}

/**
 * Sprawdza czy błąd jest błędem API
 */
export function isAdminPanelApiError(error: any): error is AdminPanelApiError {
  return error && 
    typeof error === 'object' && 
    'error' in error && 
    'message' in error && 
    'status' in error;
}

/**
 * Formatuje błąd do wyświetlenia użytkownikowi
 */
export function formatErrorMessage(error: any): string {
  if (isAdminPanelApiError(error)) {
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