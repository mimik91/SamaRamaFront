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