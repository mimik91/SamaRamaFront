import { User } from '../../core/models/user.models';

export interface Bicycle {
    id: number;
    frameNumber?: string | null;
    brand: string;
    model?: string;
    type?: string;
    frameMaterial?: string;
    productionDate?: string;
    mainPhotoUrl?: string | null;
    owner?: User;
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

export interface BicycleFormData {
  brand: string;
  model: string;
  type: string;
  frameMaterial?: string;
  description?: string;
}

export interface BicycleData {
  brand: string;
  model: string;
  type: string;
  frameMaterial?: string;
  description?: string;
}

export interface BicycleSummary {
  brand: string;
  model: string;
}

export interface BicycleForOrder {
  brand: string;
  model: string;
  additionalInfo?: string;
}