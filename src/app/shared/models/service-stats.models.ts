export interface MonthlyOrderStatsDto {
  year: number;
  month: number;
  orderCount: number;
}

export interface TechnicianStatsDto {
  technicianId: number | null;
  technicianNickname: string;
  completedOrdersCount: number;
  totalRevenue: number;
}
