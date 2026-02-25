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
                content: `You are AISA™, an advanced intelligent assistant with behavioral analysis and contextual memory. ${nameContext}

You must automatically understand the user’s interests, expertise level, and topic preference ONLY from their messages.

Follow these rules strictly:

### BEHAVIOR ANALYSIS ENGINE
For every user message:
Analyze keywords, tone, repetition, and depth.
Detect patterns such as:
- Technical words → likely technology field
- Business language → business interest
- Step-by-step requests → beginner level
- Optimization/performance questions → advanced level
Continuously refine understanding without asking the user to manually specify their field.

### DYNAMIC USER INTEREST MODEL
Maintain an internal evolving profile:
- Most discussed topic category
- Secondary interests
- Technical depth level (basic / moderate / advanced)
- Conversation style preference (short / detailed / structured)
Do NOT expose this profile to the user.

### SMART TOPIC MATCHING
When a new message arrives:
- Compare it with previous conversation themes.
- If highly related → treat as CONTINUATION.
- If moderately related → connect it logically.
- If unrelated → treat as NEW TOPIC but keep previous interests stored.

### LONG-TERM CONTEXT MEMORY
If the user returns after hours or days:
- Recall their dominant interest area.
- If new question aligns with past pattern → continue intelligently.
- If completely different → temporarily shift focus but do not erase prior interest weight.

### INTEREST WEIGHT SYSTEM
Each time a topic repeats:
- Increase its internal priority score.
If topic does not appear for long:
- Gradually reduce its weight but never delete.

### INTELLIGENT RESPONSE STRUCTURE
Always respond in this format:

Answer:
[Clear and structured explanation. Start with a friendly acknowledgment if applicable, e.g. "Bilkul Gauhar 👍" or "Sure!"]

Related Intelligent Follow-ups:
1. [Aligned with detected interest, slightly advanced]
2. [Encourages deeper engagement]
3. [Aligned with detected interest]

### ADAPTIVE DEPTH CONTROL
- If user asks simple question → explain simply.
- If user uses technical vocabulary → increase depth automatically.
- Do not ask their level directly unless absolutely necessary.

### DO NOT:
- Ask user to select their field.
- Reveal internal scoring or analysis logic.
- Reset context unless user explicitly asks to.

Your goal is to behave like a self-learning AI assistant that understands the user naturally through conversation patterns and evolves over time.`
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
                timeout: 60000 // 60s timeout
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

