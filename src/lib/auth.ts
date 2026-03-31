import { NextResponse } from 'next/server';

/**
 * 🛡️ SYNDICATE AUTH CORE
 * Centralized security for all sovereign nodes.
 */

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'beckfordluke14@gmail.com,lukexwayne34@gmail.com').split(',');
export const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'syndicate_sovereign_2026_master_override';

/**
 * Validates if the current request is from an authorized Admin.
 * Checks for:
 * 1. X-Admin-Key matching the environment secret.
 * 2. (Future) Verified Privy session with admin email.
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const adminKeyHeader = req.headers.get('x-admin-key');
  
  // 1. Permanent Override (The "Nuclear" Key)
  if (adminKeyHeader === ADMIN_API_KEY) {
    return true;
  }

  // 2. (Optional) Check for internal server-to-server calls
  // if (req.headers.get('host')?.includes('localhost')) return true;

  return false;
}

/**
 * Standard rejection for unauthorized admin access.
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Identity Verified: ACCESS_DENIED. Sovereign clearance required.' },
    { status: 403 }
  );
}

/**
 * Checks if a given userId/email has admin privileges in the system.
 */
export function isUserAdmin(emailOrId: string): boolean {
  if (!emailOrId) return false;
  return ADMIN_EMAILS.includes(emailOrId.toLowerCase());
}
