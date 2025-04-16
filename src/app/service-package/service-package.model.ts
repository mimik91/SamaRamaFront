// src/app/service-packages/service-package.model.ts

/**
 * Model reprezentujący pakiet serwisowy
 */
export interface ServicePackage {
    id: number;
    code: string;
    name: string;
    description?: string;
    price: number;
    active?: boolean;
    displayOrder?: number;
    features?: string[];
  }
  
  /**
   * Model do tworzenia/aktualizacji pakietu serwisowego
   */
  export interface ServicePackageDto {
    code: string;
    name: string;
    description?: string;
    price: number;
    active?: boolean;
    displayOrder?: number;
    features?: string[];
  }