// src/app/bicycles/bicycle.model.ts
export interface Bicycle {
    id: number;
    frameNumber?: string | null; // Zmodyfikowano, aby pole było opcjonalne i mogło być null
    brand: string;
    model?: string;
    type?: string;
    frameMaterial?: string;
    productionDate?: string;
    photo?: string; // Base64 string for display purposes
}
  
export interface BicycleForm {
    frameNumber?: string | null; // Zmodyfikowano, aby pole było opcjonalne i mogło być null
    brand: string;
    model?: string;
    type?: string;
    frameMaterial?: string;
    productionDate?: string;
    photo?: File;
}