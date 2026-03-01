// ─────────────────────────────────────────────
//  PLAN LIMITS  (server-side source of truth)
//  BASIC | PRO | KING
//  All limits are per-calendar-month per email.
//  Infinity = unlimited (skip counter check)
// ─────────────────────────────────────────────

export const PLAN_LIMITS = {
    basic: {
        name: 'Basic',
        price: 0,
        imageCount: 5,
        videoCount: 5,
        deepSearchCount: 20,
        audioConvertCount: 10,
        documentConvertCount: 15,
        codeWriterCount: 50,
        chatCount: Infinity   // Standard AI response - unlimited
    },
    pro: {
        name: 'Pro',
        price: 499,
        imageCount: 200,
        videoCount: 20,
        deepSearchCount: 200,
        audioConvertCount: 100,
        documentConvertCount: 200,
        codeWriterCount: Infinity,  // Unlimited Code Writer
        chatCount: Infinity
    },
    king: {
        name: 'King',
        price: 2499,
        imageCount: Infinity,  // Unlimited Images
        videoCount: 200,
        deepSearchCount: Infinity,  // Unlimited Deep Search
        audioConvertCount: Infinity,  // Unlimited Audio + Docs
        documentConvertCount: Infinity,
        codeWriterCount: Infinity,  // Unlimited Code Writer
        chatCount: Infinity
    }
};

/**
 * Map feature string → MonthlyUsage document key
 */
export const getUsageKey = (feature) => {
    const map = {
        'image': 'imageCount',
        'video': 'videoCount',
        'deepSearch': 'deepSearchCount',
        'audio': 'audioConvertCount',
        'document': 'documentConvertCount',
        'codeWriter': 'codeWriterCount',
        'chat': 'chatCount'
    };
    return map[feature] || feature;
};

/**
 * Normalise any stored plan string → lowercase key used in PLAN_LIMITS
 */
export const normalisePlan = (raw = 'basic') => {
    const lower = raw.trim().toLowerCase();
    if (lower === 'free' || lower === 'starter') return 'basic';
    if (lower === 'premium') return 'pro';
    if (['basic', 'pro', 'king'].includes(lower)) return lower;
    return 'basic'; // safe default
};
