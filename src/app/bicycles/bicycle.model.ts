// src/app/bicycles/bicycle.model.ts
export interface Bicycle {
    id: number;
    frameNumber?: string | null;
    brand: string;
    model?: string;
    type?: string;
    frameMaterial?: string;
    productionDate?: string;
    hasPhoto: boolean; // Pole informujące, czy rower ma zdjęcie
}
  
export interface BicycleForm {
    frameNumber?: string | null;
    brand: string;
    model?: string;
    type?: string;
    frameMaterial?: string;
    productionDate?: string;
    photo?: File;
}