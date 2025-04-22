import { Bicycle } from '../bicycles/bicycle.model';

export interface ServiceRecord {
  id: number;
  bicycle: Bicycle;
  name: string;
  description: string;
  serviceDate: string;
  price?: number;
}