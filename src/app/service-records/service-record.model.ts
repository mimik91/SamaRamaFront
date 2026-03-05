export interface ItemDto {
  name: string;
  quantity: number;
  price: number;
}

export interface ServiceRecord {
  id: number;
  serviceDate: string;
  serviceName: string;
  items: ItemDto[];
  totalPrice: number;
  orderNotes?: string;
  serviceNotes?: string;
  maintenanceAdvice?: string;
  recommendedRepairs?: string;
}
