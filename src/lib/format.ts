/**
 * APEX-WEALTH FORMATTER v5.2
 * High-Impact status-driven numerical display for a Sovereign Economy.
 */

export function formatCredits(credits: number, options: { compact?: boolean } = {}): string {
    if (credits === undefined || credits === null) return '0';
    
    // 💎 Case 1: The "Wealth Impact" Full-Digit Display (Default)
    // Used in Profiles and Wallets to show every single digit of net worth.
    if (!options.compact) {
        return new Intl.NumberFormat('en-US').format(credits);
    }

    // 🏎️ Case 2: The "Apex Compact" Fallback (Header/Mobile)
    // Used in tight UI containers to preserve elite look.
    if (credits >= 1000000) {
        return (credits / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (credits >= 1000) {
        return (credits / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }

    return credits.toString();
}
