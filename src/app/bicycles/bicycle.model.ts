// src/app/bicycles/bicycle.model.ts
import { User } from '../core/models/user.models';

export interface Bicycle {
    id: number;
    frameNumber?: string | null;
    brand: string;
    model?: string;
    type?: string;
    frameMaterial?: string;
    productionDate?: string;
    hasPhoto: boolean;
    owner?: User;  // Added owner property
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