import { NextResponse } from 'next/server';

/**
 * ⛽ LEGACY TRANSACTION VERIFIER: DECOMMISSIONED v5.0
 * Objective: Manual Crypto Fulfillment has been retired in favor of
 * the Unified Institutional Gateway (MoonPay / Helio / Stripe).
 * This node is maintained as a 410 (Gone) to ensure audit parity.
 */

export async function POST() {
    console.log("📡 [Audit Protocol] Attempted access to retired legacy settlement node.");
    
    return NextResponse.json({ 
        success: false, 
        error: 'System Update Required. Manual Settlement has been retired in favor of the Institutional Sovereign Gateway.' 
    }, { status: 410 });
}

export async function GET() {
    return NextResponse.json({ status: 'DECOMMISSIONED' });
}
