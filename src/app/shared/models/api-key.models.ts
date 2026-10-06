export interface ApiKeyStatus {
  hasKey: boolean;
  keyPrefix?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

export interface ApiKeyGeneratedResponse {
  message: string;
  apiKey: string;
}

export interface ApiKeyRegistrantRequest {
  email: string;
  phone: string;
  name?: string;
  company?: string;
  privacyAccepted: boolean;
}
