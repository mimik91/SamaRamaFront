// ============================================
// SERVICE PRICELIST MODELS
// ============================================

/**
 * Kategoria cennika
 */
export interface PricelistCategoryDto {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
}

/**
 * Element cennika (pojedyncza usługa)
 */
export interface PricelistItemDto {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Kategoria z listą itemów
 */
export interface CategoryWithItemsDto {
  category: PricelistCategoryDto;
  items: PricelistItemDto[];
}

/**
 * Cennik serwisu (zwracany z backendu)
 */
export interface ServicePricelistDto {
  items: { [itemId: number]: number }; // itemId -> price
  pricelistInfo: string | null;
  pricelistNote: string | null;
  pricelistActive: boolean;
}

/**
 * DTO do aktualizacji cennika serwisu
 */
export interface ServicePricelistUpdateDto {
  items: { [itemId: number]: number }; // itemId -> price
  pricelistInfo: string | null;
  pricelistNote: string | null;
  pricelistActive: boolean;
}

// ===== POMOCNICZE INTERFEJSY DLA WIDOKU =====

/**
 * Item cennika z ceną i statusem przypisania (dla widoku)
 */
export interface PricelistItemWithPrice extends PricelistItemDto {
  price: number | null;
  isAssigned: boolean;
}

/**
 * Kategoria z itemami i cenami (dla widoku)
 */
export interface CategoryWithPrices {
  category: PricelistCategoryDto;
  items: PricelistItemWithPrice[];
}

/**
 * Typ dla mapy cen (itemId -> price)
 */
export type PriceMap = { [itemId: number]: number };

// ============================================
// VALIDATION
// ============================================

/**
 * Reguły walidacji dla cennika
 */
export interface PricelistValidationRules {
  maxDescriptionLength: number;
  maxInfoLength: number;
  maxNoteLength: number;
  minPrice: number;
  maxPrice: number;
  priceDecimalPlaces: number;
}

/**
 * Domyślne wartości walidacji cennika
 */
export const DEFAULT_PRICELIST_VALIDATION: PricelistValidationRules = {
  maxDescriptionLength: 500,
  maxInfoLength: 500,
  maxNoteLength: 500,
  minPrice: 0.01,
  maxPrice: 99999999.99,
  priceDecimalPlaces: 2
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formatuje cenę do wyświetlenia
 */
export function formatPrice(price: number, decimalPlaces: number = 2): string {
  return price.toFixed(decimalPlaces);
}

/**
 * Parsuje cenę z inputu użytkownika
 */
export function parsePrice(value: string): number | null {
  const cleanedValue = value.replace(',', '.');
  const price = parseFloat(cleanedValue);
  
  if (isNaN(price) || price < 0) {
    return null;
  }
  
  return Math.round(price * 100) / 100;
}

/**
 * Waliduje czy cena jest poprawna
 */
export function validatePrice(
  price: number | null,
  rules: Partial<PricelistValidationRules> = {}
): boolean {
  if (price === null) {
    return false;
  }
  
  const minPrice = rules.minPrice ?? DEFAULT_PRICELIST_VALIDATION.minPrice;
  const maxPrice = rules.maxPrice ?? DEFAULT_PRICELIST_VALIDATION.maxPrice;
  
  return price >= minPrice && price <= maxPrice;
}

/**
 * Waliduje długość tekstu
 */
export function validateTextLength(
  text: string | null,
  maxLength: number
): boolean {
  if (text === null) {
    return true;
  }
  return text.length <= maxLength;
}

/**
 * Domyślna waluta
 */
export const DEFAULT_CURRENCY = 'zł';