/**
 * Generates a pre-filled WhatsApp API link.
 * @param phone The international phone number (e.g., '1234567890')
 * @param message The pre-filled greeting message
 */
export function getWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export const PROFILE_PHONES = {
  VALERIA: '1234567890', // Placeholder
  ISABELLA: '1234567890',
  CAMILA: '1234567890',
};

export const PROFILE_MESSAGES = {
  VALERIA: 'Hola Valeria, me encantó tu perfil en Mi Amor. ¿Podemos hablar? 🇨🇴',
  ISABELLA: 'Hey Isabella, vi tu contenido en Mi Amor y me pareció increíble. ¿Qué onda? 🇩🇴',
  CAMILA: 'Oi Camila, tudo bem? Vi seu perfil no Mi Amor e adoraria conversar. 🇧🇷',
};


