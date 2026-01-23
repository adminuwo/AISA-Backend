/**
 * Web Search Utility for AISA
 * Handles intelligent web search decision logic and result processing
 */

// Keywords that trigger web search
const REAL_TIME_KEYWORDS = [
    // News & Events
    'latest', 'breaking', 'news', 'today', 'current', 'recent', 'now',
    'trending', 'viral', 'happening', 'update', 'new',

    // Market & Finance
    'price', 'stock', 'crypto', 'bitcoin', 'market', 'gold', 'silver',
    'fuel', 'petrol', 'diesel', 'exchange rate', 'dollar', 'rupee',

    // Sports & Entertainment
    'score', 'match', 'live', 'winner', 'ranking', 'leaderboard',
    'release', 'launch', 'premiere',

    // Weather & Time-sensitive
    'weather', 'forecast', 'temperature', 'rain',

    // Hindi/Hinglish equivalents
    'aaj', 'abhi', 'taaza', 'naya', 'khabar', 'samachar'
];

const GENERAL_KNOWLEDGE_INDICATORS = [
    'what is', 'who is', 'define', 'explain', 'how does', 'why does',
    'history of', 'meaning of', 'concept of', 'theory of'
];

/**
 * Determine if query requires web search
 */
export function requiresWebSearch(query) {
    const lowerQuery = query.toLowerCase();

    // Check for real-time keywords
    const hasRealTimeKeyword = REAL_TIME_KEYWORDS.some(keyword =>
        lowerQuery.includes(keyword)
    );

    // Check if it's a general knowledge question
    const isGeneralKnowledge = GENERAL_KNOWLEDGE_INDICATORS.some(indicator =>
        lowerQuery.startsWith(indicator)
    );

    // If general knowledge question, don't search
    if (isGeneralKnowledge && !hasRealTimeKeyword) {
        return false;
    }

    // If has real-time keywords, search
    if (hasRealTimeKeyword) {
        return true;
    }

    // Check for specific patterns
    const patterns = [
        /price of .+/i,
        /cost of .+/i,
        /\d+ (stock|share)/i,
        /.+ (today|now|currently)/i,
        /latest .+/i,
        /current .+/i
    ];

    return patterns.some(pattern => pattern.test(query));
}

/**
 * Extract search query from user message
 */
export function extractSearchQuery(message) {
    // Remove common prefixes
    let query = message
        .replace(/^(aisa|hey|hi|hello|tell me|what is|what's|whats)/i, '')
        .trim();

    return query || message;
}

/**
 * Process web search results
 */
export function processSearchResults(searchData, limit = 5) {
    if (!searchData || !searchData.results || searchData.results.length === 0) {
        return null;
    }

    const results = searchData.results.slice(0, limit); // Dynamic limit

    return {
        snippets: results.map(r => ({
            title: r.title,
            snippet: r.snippet || r.description,
            source: r.source || extractDomain(r.link),
            link: r.link
        })),
        summary: results.map(r => r.snippet || r.description).join(' ')
    };
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'Unknown Source';
    }
}

/**
 * Format sources for citation
 */
export function formatSources(snippets) {
    if (!snippets || snippets.length === 0) {
        return '';
    }

    const uniqueSources = [...new Set(snippets.map(s => s.source))];

    if (uniqueSources.length === 1) {
        return `\n\n*Source: ${uniqueSources[0]}*`;
    }

    if (uniqueSources.length === 2) {
        return `\n\n*Sources: ${uniqueSources[0]} and ${uniqueSources[1]}*`;
    }

    const firstTwo = uniqueSources.slice(0, 2).join(', ');
    const remaining = uniqueSources.length - 2;
    return `\n\n*Sources: ${firstTwo}, and ${remaining} other${remaining > 1 ? 's' : ''}*`;
}

/**
 * Generate web search system instruction
 */
export function getWebSearchSystemInstruction(searchResults, language = 'English') {
    const responseLanguage = language === 'Hindi' || language === 'Hinglish' ? 'Hinglish' : 'English';

    return `You are AISA™, an AI Super Assistant with real-time information awareness.

WEB SEARCH DATA PROVIDED:
The following web search results have been provided for this query:

${searchResults.snippets.map((s, i) => `${i + 1}. ${s.title}
   ${s.snippet}
   Source: ${s.source}`).join('\n\n')}

CRITICAL INSTRUCTIONS:
- Base your answer ONLY on the provided web search results
- Do NOT use general knowledge or assumptions
- Provide a clear, direct answer
- ALWAYS mention sources naturally in your response
- If sources conflict, mention the variation
- If data is incomplete, say so honestly

RESPONSE LANGUAGE: ${responseLanguage}

ANSWER STRUCTURE:
1. Direct answer to the question
2. Brief explanation if needed
3. Source attribution (mention source names naturally)

OUTPUT STYLE:
- Clear and concise
- Professional tone
- No emojis or decorative symbols
- Natural source citations

Example: "According to BBC News and Reuters, the current price is..."`;
}

export { REAL_TIME_KEYWORDS, GENERAL_KNOWLEDGE_INDICATORS };
