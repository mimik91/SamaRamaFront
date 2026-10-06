// ============================================
// KATALOG CZĘŚCI — wspólne nazwy, ceny per serwis (bez kategorii, bez kolejki zatwierdzania)
// ============================================

/** Pozycja katalogu części (sama nazwa, bez ceny — admin CRUD) */
export interface PartCatalogItemDto {
  id: number;
  name: string;
}

/** Pozycja katalogu wraz z ceną danego serwisu — price jest null, jeśli serwis jej jeszcze nie ustawił */
export interface MyPartPriceDto {
  partCatalogItemId: number;
  name: string;
  price: number | null;
}

export interface UpdateMyPartPriceRequest {
  price: number;
}
