export interface GuestOrderMessage {
  id: number;
  senderType: 'SERVICE' | 'CLIENT';
  content: string;
  createdAt: string;
  read: boolean;
}

export interface GuestRepairPlanItem {
  id: number;
  name: string;
  price: number;
  position: number;
  excluded: boolean;
}

export interface GuestRepairPlan {
  id: number;
  serviceOrderId: number;
  packageId: number | null;
  packageName: string | null;
  packageDescription: string | null;
  packagePriceSnapshot: number | null;
  packageExcluded: boolean;
  items: GuestRepairPlanItem[];
  customTotal: number | null;
  calculatedTotal: number;
  notes: string | null;
  status: 'DRAFT' | 'SENT_TO_CLIENT' | 'ACCEPTED' | 'REJECTED';
  requiresConfirmation: boolean;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestOrderAccess {
  orderId: number;
  status: string;
  bikeLabel: string | null;
  messages: GuestOrderMessage[];
  unreadCount: number;
  repairPlan: GuestRepairPlan | Record<string, never>;
}
