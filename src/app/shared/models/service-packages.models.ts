// ============================================
// SERVICE PACKAGES MODELS
// ============================================

/**
 * Poziomy pakietów serwisowych
 */
export enum PackageLevel {
  BASIC = 'BASIC',
  ADVANCED = 'ADVANCED',
  FULL = 'FULL'
}

/**
 * Mapowanie poziomów pakietów na nazwy wyświetlane
 */
export const PackageLevelDisplayNames: Record<PackageLevel, string> = {
  [PackageLevel.BASIC]: 'Podstawowy',
  [PackageLevel.ADVANCED]: 'Rozszerzony',
  [PackageLevel.FULL]: 'Pełny'
};

/**
 * Kolejność poziomów pakietów (do sortowania)
 */
export const PackageLevelOrder: Record<PackageLevel, number> = {
  [PackageLevel.BASIC]: 0,
  [PackageLevel.ADVANCED]: 1,
  [PackageLevel.FULL]: 2
};

/**
 * Wszystkie poziomy pakietów jako tablica (do iteracji)
 */
export const ALL_PACKAGE_LEVELS: PackageLevel[] = [
  PackageLevel.BASIC,
  PackageLevel.ADVANCED,
  PackageLevel.FULL
];

/**
 * Pakiet serwisowy (zwracany z backendu)
 */
export interface ServicePackageDto {
  id: number;
  packageLevel: PackageLevel;
  packageLevelDisplayName: string;
  customName: string | null;
  displayName: string;
  bikeTypes: string[];
  price: number;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Konfiguracja pakietów serwisu
 */
export interface ServicePackagesConfigDto {
  id: number;
  generalDescription: string | null;
  comment: string | null;
  active: boolean;
  defaultBikeType: string | null;
  packages: ServicePackageDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO do aktualizacji ustawień konfiguracji pakietów
 */
export interface PackagesConfigSettingsDto {
  generalDescription: string | null;
  comment: string | null;
  defaultBikeType: string | null;
  active: boolean;
}

/**
 * DTO do tworzenia nowego pakietu
 */
export interface CreatePackageDto {
  packageLevel: PackageLevel;
  customName: string | null;
  bikeTypes: string[];
  price: number;
  description: string | null;
  active: boolean;
}

/**
 * DTO do aktualizacji istniejącego pakietu
 */
export interface UpdatePackageDto {
  customName: string | null;
  bikeTypes: string[];
  price: number;
  description: string | null;
  active: boolean;
}

// ===== POMOCNICZE INTERFEJSY DLA WIDOKU =====

/**
 * Pakiety pogrupowane według typu roweru (dla widoku)
 */
export interface PackagesByBikeType {
  bikeType: string;
  packages: {
    [key in PackageLevel]?: ServicePackageDto;
  };
}

/**
 * Stan edycji pakietu w komponencie
 */
export interface EditingPackage {
  packageId: number | null; // null = nowy pakiet
  packageLevel: PackageLevel;
  customName: string;
  bikeTypes: Set<string>;
  price: number | null;
  description: string;
  active: boolean;
}

/**
 * Typ dla mapy pakietów według poziomu
 */
export type PackagesByLevel = {
  [key in PackageLevel]?: ServicePackageDto;
};

// ============================================
// VALIDATION
// ============================================

/**
 * Reguły walidacji dla pakietów
 */
export interface PackagesValidationRules {
  maxGeneralDescriptionLength: number;
  maxPackageDescriptionLength: number;
  maxCustomNameLength: number;
  minPrice: number;
  maxPrice: number;
  priceDecimalPlaces: number;
  minBikeTypesCount: number;
}

/**
 * Domyślne wartości walidacji pakietów
 */
export const DEFAULT_PACKAGES_VALIDATION: PackagesValidationRules = {
  maxGeneralDescriptionLength: 1000,
  maxPackageDescriptionLength: 2000,
  maxCustomNameLength: 100,
  minPrice: 0.01,
  maxPrice: 99999999.99,
  priceDecimalPlaces: 2,
  minBikeTypesCount: 1
};

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Sprawdza czy wartość jest poprawnym PackageLevel
 */
export function isPackageLevel(value: any): value is PackageLevel {
  return Object.values(PackageLevel).includes(value);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Zwraca nazwę wyświetlaną dla poziomu pakietu
 */
export function getPackageLevelDisplayName(level: PackageLevel): string {
  return PackageLevelDisplayNames[level] || level;
}

/**
 * Porównuje dwa poziomy pakietów (do sortowania)
 */
export function comparePackageLevels(a: PackageLevel, b: PackageLevel): number {
  return PackageLevelOrder[a] - PackageLevelOrder[b];
}

/**
 * Sortuje pakiety według poziomu
 */
export function sortPackagesByLevel(packages: ServicePackageDto[]): ServicePackageDto[] {
  return [...packages].sort((a, b) => comparePackageLevels(a.packageLevel, b.packageLevel));
}

/**
 * Grupuje pakiety według typu roweru
 */
export function groupPackagesByBikeType(packages: ServicePackageDto[]): PackagesByBikeType[] {
  const bikeTypeMap = new Map<string, PackagesByBikeType>();

  packages.forEach(pkg => {
    pkg.bikeTypes.forEach(bikeType => {
      if (!bikeTypeMap.has(bikeType)) {
        bikeTypeMap.set(bikeType, {
          bikeType,
          packages: {}
        });
      }
      const group = bikeTypeMap.get(bikeType)!;
      group.packages[pkg.packageLevel] = pkg;
    });
  });

  return Array.from(bikeTypeMap.values()).sort((a, b) => 
    a.bikeType.localeCompare(b.bikeType, 'pl')
  );
}

/**
 * Filtruje pakiety według wybranego typu roweru
 */
export function filterPackagesByBikeType(
  packages: ServicePackageDto[],
  selectedBikeType: string | null
): ServicePackageDto[] {
  if (!selectedBikeType) {
    return [];
  }
  return sortPackagesByLevel(
    packages.filter(pkg => pkg.bikeTypes.includes(selectedBikeType))
  );
}

/**
 * Formatuje cenę pakietu do wyświetlenia
 */
export function formatPackagePrice(price: number, decimalPlaces: number = 2): string {
  return price.toFixed(decimalPlaces);
}

/**
 * Parsuje cenę pakietu z inputu użytkownika
 */
export function parsePackagePrice(value: string): number | null {
  const cleanedValue = value.replace(',', '.');
  const price = parseFloat(cleanedValue);
  
  if (isNaN(price) || price < 0) {
    return null;
  }
  
  return Math.round(price * 100) / 100;
}

/**
 * Waliduje czy cena pakietu jest poprawna
 */
export function validatePackagePrice(
  price: number | null,
  rules: Partial<PackagesValidationRules> = {}
): boolean {
  if (price === null) {
    return false;
  }
  
  const minPrice = rules.minPrice ?? DEFAULT_PACKAGES_VALIDATION.minPrice;
  const maxPrice = rules.maxPrice ?? DEFAULT_PACKAGES_VALIDATION.maxPrice;
  
  return price >= minPrice && price <= maxPrice;
}

/**
 * Waliduje długość tekstu dla pakietu
 */
export function validatePackageTextLength(
  text: string | null,
  maxLength: number
): boolean {
  if (text === null) {
    return true;
  }
  return text.length <= maxLength;
}