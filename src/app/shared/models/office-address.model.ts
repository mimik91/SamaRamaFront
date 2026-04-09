export interface OfficeAddressDto {
  id: number;
  name: string;
  street: string;
  building: string;
  apartment: string | null;
  city: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}
