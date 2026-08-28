export interface WhatsAppConfigurationResponse {
  isConnected: boolean;
  phoneNumber?: string;
  packageSize: number;
  usedMessages: number;
  remainingMessages: number;
  lastConnectedAt?: string;
  lastStatusCheckAt?: string;
  lastMessageSentAt?: string;
}

// ⚠️ افتراض - مش مؤكد من الباك إند، عدّل لو مختلف
export interface SendWhatsAppMessageRequest {
  phoneNumber: string;
  message: string;
}
export interface WhatsAppRecipientResponse {
  userId: number;
  phoneNumber: string;
  name: string;
  address?: string | null;
}