export interface BikeService {
  id: number;
  name: string;
  street?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  email?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  transportCost?: number;
}