import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNudgeEmail } from '@/lib/emails';
import { initialPersonas } from '@/lib/profiles';
import { getPersonas } from '@/lib/sovereign';

export async function POST(req: Request) {
  const authHeader = req.headers.get('x-admin-key');
  const masterKey = process.env.ADMIN_SECRET_KEY || 'gasp-secret-2024';

  if (authHeader !== masterKey) {
    return NextResponse.json({ error: 'Unauthorized Command Node' }, { status: 401 });
  }

  try {
    const { email, personaId } = await req.json();
    if (!email) return NextResponse.json({ error: 'Target Email Required' }, { status: 400 });

    // 🧬 Persona Lookup
    const dbPersonas = await getPersonas();
    const allPersonas = [...initialPersonas, ...dbPersonas];
    const persona = allPersonas.find(p => p.id === personaId) || allPersonas[0];

    const testMessage = "I was just looking at your profile... we should talk about that new trade route you mentioned.";
    
    console.log(`[Admin Test] Dispatching Neural Nudge to ${email} via ${persona.name}`);
    await sendNudgeEmail(email, persona.name, testMessage);

    return NextResponse.json({ success: true, message: `Nudge dispatched to ${email}` });
  } catch (err: any) {
    console.error('[Admin Test] Failure:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
