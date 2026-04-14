/**
 * 🛰️ SYNDICATE MONETIZATION CONFIG
 * Use this to instantly switch between Ogads (Safe) and Trafee (High Payout)
 */

export const SYNDICATE_CONFIG = {
    // 🚦 PROVIDER MODE: 'OGADS' | 'TRAFEE'
    // Switch to 'TRAFEE' once approved for 5x payouts.
    provider: 'OGADS', 

    // 🔗 SMART LINKS
    ogads_link: 'https://appchecker.space/sl/3181j',
    trafee_link: 'REPLACE_WITH_YOUR_TRAFEE_SMARTLINK', // Paste your Trafee link here later

    // 🧬 TRACKING
    // Ogads uses 'aff_sub', Trafee uses 'subid' or 'tracking_id' usually
    getSmartLink: (guestId: string) => {
        if (SYNDICATE_CONFIG.provider === 'TRAFEE') {
            // Updated for Trafee's typical tracking parameter
            return `${SYNDICATE_CONFIG.trafee_link}?subid=${guestId}`;
        }
        return `${SYNDICATE_CONFIG.ogads_link}?aff_sub=${guestId}`;
    }
};
