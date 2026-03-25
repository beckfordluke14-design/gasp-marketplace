import { type Agency, type Persona } from './profiles';

const MASTER_ADMIN_UUID = "master-uuid-1"; // YOUR SPECIFIC UUID

/**
 * GASP REVENUE SPLIT ALGORITHM
 * 80% to Agency Owner
 * 20% to Master Admin (Platform)
 */
export function calculateGaspRevenueSplit(amount: number) {
    const platformFee = amount * 0.20;
    const agencyShare = amount * 0.80;
    
    return {
        platformShare: platformFee,
        agencyShare: agencyShare,
        currency: 'USD',
        timestamp: new Date().toISOString()
    };
}

/**
 * MULTI-TENANT CAPACITY GUARD
 * Prevents non-master agencies from creating > 3 personas
 */
export function canCreatePersona(agency: Agency, currentCount: number): boolean {
    if (agency.owner_id === MASTER_ADMIN_UUID) return true; // BYPASS
    if (agency.tier === 'pro') return currentCount < 10; // PRO TIER
    return currentCount < 3; // FREE TIER
}

/**
 * BRANDING INJECTION
 * Ensures "Persona by Agency" naming consistency
 */
export function getGaspBranding(persona: Persona): string {
    return `${persona.name} by ${persona.agency_name}`;
}


