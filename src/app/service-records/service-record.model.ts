import { BikeService } from '../service-panel/bike-service.model';
import { Bicycle } from '../bicycles/bicycle.model';

export interface ServiceRecord {
  id: number;
  bicycle: Bicycle;
  name: string;
  description: string;
  serviceDate: string;
  price?: number;
  service?: BikeService;
}