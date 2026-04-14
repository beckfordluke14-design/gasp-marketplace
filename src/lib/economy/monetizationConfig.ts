/**
 * 🛰️ SYNDICATE MONETIZATION CONFIG
 * Use this to instantly switch between Ogads (Safe) and Trafee (High Payout)
 */

export const SYNDICATE_CONFIG = {
    // 🚦 PROVIDER MODE: 'OGADS' | 'TRAFEE' | 'MLEAD'
    provider: 'MLEAD', 

    // 🛡️ COMPLIANCE MODE: Set to TRUE to hide 'Credits/Rewards' for Trafee/Mlead audits.
    // Set to FALSE once approved to show the high-conversion 'Free Credits' labels.
    compliance: true,

    // 🔗 SMART LINKS
    ogads_link: 'https://appchecker.space/sl/3181j',
    trafee_link: 'REPLACE_WITH_YOUR_TRAFEE_SMARTLINK',
    mlead_link: 'REPLACE_WITH_YOUR_MLEAD_SMARTLINK',

    // 🧬 TRACKING
    getSmartLink: (guestId: string) => {
        if (SYNDICATE_CONFIG.provider === 'TRAFEE') {
            return `${SYNDICATE_CONFIG.trafee_link}?subid=${guestId}`;
        }
        if (SYNDICATE_CONFIG.provider === 'MLEAD') {
            return `${SYNDICATE_CONFIG.mlead_link}?s1=${guestId}`;
        }
        return `${SYNDICATE_CONFIG.ogads_link}?aff_sub=${guestId}`;
    }
};
