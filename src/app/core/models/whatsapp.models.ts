export interface WhatsAppConfigurationResponse {
  isConnected: boolean;
  phoneNumber: string | null;
  monthlyLimit: number;
  monthlySent: number;
  remainingMessages: number;
  lastConnectedAt: string | null;
  lastStatusCheckAt: string | null;
  lastMessageSentAt: string | null;
}

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