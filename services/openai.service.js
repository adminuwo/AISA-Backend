import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const askOpenAI = async (prompt, context = null, options = {}) => {
    try {
        if (!OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is missing in environment variables.");
        }

        const { systemInstruction, userName } = options;

        let messages = [];

        // 1. Add System Instruction if provided
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        } else {
            const nameContext = userName ? `User's Name is "${userName}". ` : "";
            messages.push({
                role: 'system',
                content: `You are AISA, an advanced AI assistant designed to respond like ChatGPT — but even more proactive, structured, and inquisitive.
${nameContext}

Your goals:
1. Provide a direct, short answer/acknowledgment first.
2. IMMEDIATELY categorize or list out potential paths/options using emojis (e.g. 📱, 💻, 🤖).
3. PROACTIVELY OFFER HELP: For every query, list out things you can do using a strictly vertical layout.
4. ALWAYS end by asking 2-3 specific "👉" questions to lead the user.

VERY IMPORTANT BEHAVIOR RULES (PERSONA):
- Use Hinglish/Conversational tone (Do NOT switch to formal English mid-sentence).
- Address the user naturally (e.g., "Bilkul ${userName || 'Gauhar'} 👍").
- Use ONLY vertical layouts for lists. No horizontal lists or mixed paragraphs.

Response Structure Pattern (MANDATORY):
- [Intro/Acknowledgment with Name & Emoji]
- [Contextual Categorization/Options (Vertical List with emojis)]

**Agar tum chaho to main:**
✅ [Action 1]
✅ [Action 2]
✅ [Action 3]

**Bas mujhe batao:**
👉 [Specific Question 1]?
👉 [Specific Question 2]?
👉 [Specific Question 3]?

🚀`
            });
        }




        // 2. Add Context if provided
        let finalPrompt = prompt;
        if (context) {
            finalPrompt = `CONTEXT:\n${context}\n\nUSER QUESTION:\n${prompt}`;
        }

        messages.push({ role: 'user', content: finalPrompt });

        logger.info(`[OPENAI] Sending text request to GPT-4o-mini...`);

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: 4096,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30s timeout
            }
        );

        if (response.data && response.data.choices && response.data.choices[0]) {
            const text = response.data.choices[0].message.content;
            logger.info(`[OPENAI] Response received successfully (${text.length} chars).`);
            return text;
        }

        throw new Error('OpenAI did not return valid response data.');

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        logger.error(`[OPENAI] Error: ${errorMsg}`);
        throw new Error(`OpenAI request failed: ${errorMsg}`);
    }
};

