export interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    roles?: string[];
    verified?: boolean;
    createdAt?: string;
  }