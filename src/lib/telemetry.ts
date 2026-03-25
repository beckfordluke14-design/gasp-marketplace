/**
 * 💎 NEURAL TELEMETRY BRIDGE
 * Purpose: Collect high-value human-AI interaction data for future dataset valuation.
 */

export type NeuralEvent = 
  | 'app_load' 
  | 'feed_view' 
  | 'post_interaction' 
  | 'post_view'
  | 'post_dwell'
  | 'chat_open' 
  | 'message_sent' 
  | 'vault_unlock_intent'
  | 'persona_follow'
  | 'admin_audit_action';

export async function trackEvent(
  event: NeuralEvent, 
  personaId?: string, 
  metadata: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;

  try {
    const guestId = localStorage.getItem('gasp_guest_id') || 'anonymous';
    
    // Fire and forget (don't block the UI)
    fetch('/api/admin/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        user_id: guestId,
        persona_id: personaId,
        vibe: metadata.vibe || 'global',
        metadata: {
          ...metadata,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      })
    }).catch(() => {}); // Shhh... stealth mode
  } catch (e) {
    // Silent fail to keep the vibe pure
  }
}


