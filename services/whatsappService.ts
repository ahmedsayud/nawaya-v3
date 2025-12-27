import { normalizePhoneNumber } from '../utils';

// This is a placeholder for your actual WhatsApp API service provider's endpoint and credentials.
// For example: const WHATSAPP_API_ENDPOINT = 'https://api.yourprovider.com/v1/messages';
// const WHATSAPP_API_KEY = 'YOUR_API_KEY';

export interface WhatsAppMedia {
  url: string; // This will be a data URL in our mock implementation
  mimeType: string;
}

/**
 * Sends a WhatsApp message by opening a pre-filled wa.me link.
 * This uses the user's own "regular" WhatsApp account to send messages manually.
 * Note: Media attachments are not supported by this method.
 * 
 * @param phoneNumber The recipient's full phone number with country code.
 * @param message The text message to send.
 * @param media Optional media attachment (will be ignored).
 */
export const sendWhatsAppMessage = async (phoneNumber: string, message: string, media?: WhatsAppMedia): Promise<void> => {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedNumber) {

    return;
  }

  if (media) {

  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${normalizedNumber}?text=${encodedMessage}`;

  // Open the link in a new tab. This will prompt the user to open their WhatsApp client.
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');



  return Promise.resolve();
};
