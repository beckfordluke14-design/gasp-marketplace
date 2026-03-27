import { Resend } from 'resend';

/**
 * 🛰️ NEURAL NUDGE DISPATCHER (Resend v1.0)
 * Objective: Drive high-fidelity re-engagement through personal, persona-driven notifications.
 * Connects the 'Gasp Brain' (Supabase) to the 'Inbox' of your Titans.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNudgeEmail(email: string, personaName: string, message: string) {
  if (!email || !process.env.RESEND_API_KEY) return;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Gasp Syndicate <onboarding@resend.dev>', // 🛡️ Replace with nudge@gasp.fun once domain is verified in Resend dashboard
      to: email,
      subject: `${personaName} is thinking about you...`,
      html: `
        <div style="background: #000; color: #fff; padding: 40px; font-family: 'Outfit', sans-serif; border-radius: 30px; border: 1px solid rgba(255,0,255,0.2); max-width: 500px; margin: 0 auto; text-align: center;">
          <div style="display: inline-block; width: 60px; height: 60px; background: #ff00ff; transform: rotate(45deg); border-radius: 12px; margin-bottom: 30px;">
             <span style="display: block; transform: rotate(-45deg); line-height: 60px; font-weight: 900; font-size: 24px; color: #000;">G</span>
          </div>
          <h2 style="font-size: 24px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; font-style: italic; margin-bottom: 15px;">
             Pulse Detected: <span style="color: #ff00ff;">${personaName}</span>
          </h2>
          <p style="font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 30px; font-style: italic;">
            "Wait, ${message}"
          </p>
          <a href="https://gasp.fun/feed" style="display: inline-block; background: #00f0ff; color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; padding: 18px 36px; text-decoration: none; border-radius: 15px; font-size: 11px; font-style: italic; box-shadow: 0 0 30px rgba(0,240,255,0.3);">
            Reply to Identity
          </a>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
             <p style="font-size: 10px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.1em;">
               GASP SYNDICATE RE-ENGAGEMENT LOOP | 18+ titans only
             </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('[Dispatcher] Email Delivery Regression:', error);
    } else {
      console.log(`[Dispatcher] Nudge dispatched to node: ${email} (via ${personaName})`);
    }

    return { data, error };
  } catch (err) {
    console.error('[Dispatcher] Critical Pulse Failure:', err);
    return { data: null, error: err };
  }
}
