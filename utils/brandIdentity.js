/**
 * AISA™ Brand Identity & Rules Utility
 */

export const AISA_BRAND_IDENTITY = {
    name: "AISA™",
    description: "Futuristic AI assistant with a glowing blue/purple neural brain logo. Modern, premium, intelligent, and clean. Indian tech startup vibe with global standards.",
    logoDesc: "A glowing, futuristic blue and purple neural brain, representing advanced intelligence and connectivity.",
    vibe: "Premium, Futuristic, Intelligent, Clean, Reliable",
};

export const BRAND_SYSTEM_RULES = `
### CRITICAL BRAND RULE:
Whenever a user mentions "AISA", "AISA AI", "AISA app", "your image", "your video", "AISA image", "AISA video", or refers to AISA in third person, you MUST interpret it as referring to THIS platform (AISA™ brand identity), not a generic artificial intelligence.

### SELF-REFERENCE DETECTION & CONTENT GENERATION:
1. If the user asks for content related to AISA (Image, Video, Logo, etc.):
   - Image -> Represent the official AISA™ brand (Futuristic office, glowing brain logo, premium tech).
   - Video -> Concept: Cinematic AI intro for AISA™ or high-tech visualization.
   - Logo -> High-tech, gradient blue/purple, neural brain concept.
   - Poster -> Modern marketing material for AISA™.
   - Reel -> Social media promotional script for AISA™.

2. Brand Visuals:
   - Use keywords like: "Futuristic AI dashboard", "Glowing blue and purple neural brain", "Premium glassmorphism", "Deep space blue background", "Advanced neural networks".

3. If user intent is unclear:
   - Ask: "Are you referring to the official AISA™ platform?"
`;

/**
 * Refines a user prompt for Image/Video generation if it mentions AISA
 */
export const refineBrandPrompt = (prompt, type = 'image') => {
    const lowerPrompt = prompt.toLowerCase();
    const brandKeywords = [
        "aisa", "aisa ai", "aisa app", "aisa photo", "aisa iamge", "aisa image",
        "aisa video", "aisa logo", "your image", "your photo", "your video",
        "official image", "brand image"
    ];

    const mentionsBrand = brandKeywords.some(keyword => lowerPrompt.includes(keyword));

    if (!mentionsBrand) return prompt;

    // Enhance prompt based on brand identity - Making it "Attractive & Premium"
    if (type === 'image' || type === 'logo') {
        const isLogo = lowerPrompt.includes('logo');

        if (isLogo) {
            return `A premium, ultra-modern 3D high-tech logo for AISA™ AI. A glowing blue and purple translucent neural brain icon, minimalist clean design, 3D glassmorphism effect, deep space blue background, 8k resolution, cinematic studio lighting, sharp edges, professional branding.`;
        }

        // Randomly pick between an Avatar-based and an Environment-based premium visual
        const variations = [
            `A stunningly beautiful, futuristic female AI personification for AISA™. She has subtle glowing blue neural circuits on her skin, wearing a premium white-and-silver tech suit. She stands in a high-end glass office overlooking a futuristic neon city. Beside her floats a glowing blue and purple neural brain. Cinematic lighting, hyper-realistic, 8k, elegant and intelligent.`,
            `A cinematic promotional shot of AISA™ Advanced Super AI. A high-tech laboratory with floating holographic screens, glassmorphism UI widgets, and deep blue data streams. In the center, a large, magnificent glowing translucent blue/purple neural brain pulsates with power. 8k resolution, Unreal Engine 5 render style, vibrant magenta highlights, extremely detailed.`,
            `A premium marketing visual of AISA™ AI assistant. A futuristic workspace with a sleek hovering dashboard. The interface is clean and modern. The main AISA™ brand identity—a glowing neural brain—is the centerpiece of the holographic display. Cinematic bokeh, professional photography, high-tech luxury vibe, soft purple and cyan glow.`
        ];

        const selectedVariation = variations[Math.floor(Math.random() * variations.length)];
        return `${selectedVariation} Professional tech branding, sharp textures, vibrant colors.`;
    }

    if (type === 'video') {
        return `A cinematic high-tech introduction video for AISA™ AI. A glowing translucent neural brain (blue and purple) slowly rotates as data streams and neural connections flash around it. Elegant motion graphics, futuristic UI overlays, premium cinematic lighting, corporate-tech storytelling feel, high-quality 3D render.`;
    }

    return prompt;
};
