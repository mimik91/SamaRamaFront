// ============================================
// ADMIN PANEL MODELS
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

/**
 * Stan ładowania (ogólny)
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ============================================
// HELPER FUNCTIONS
// ============================================

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