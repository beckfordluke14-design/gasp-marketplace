import { NextResponse } from 'next/server';
import { initialPersonas } from '@/lib/profiles';

export async function GET() {
    const tia = initialPersonas.find(p => p.id === 'tia-jamaica');
    const zola = initialPersonas.find(p => p.id === 'zola-nigeria');
    
    return NextResponse.json({ 
        status: "online", 
        timestamp: new Date().toISOString(),
        tia_master_id: tia?.broadcasts?.[0]?.id,
        zola_master_id: zola?.broadcasts?.[0]?.id
    });
}



