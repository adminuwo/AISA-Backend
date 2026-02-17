import UserMemory from '../models/UserMemory.js';
import { genAIInstance, modelName } from '../config/vertex.js';

/**
 * Extracts key user information from a conversation using AI
 */
export const extractUserMemory = async (content, history = []) => {
    try {
        const model = genAIInstance.getGenerativeModel({ model: modelName });

        const prompt = `
      Analyze the following conversation and extract user profile information.
      Return ONLY a JSON object with these keys (if not found, keep empty strings or empty arrays):
      {
        "name": "User's name if mentioned",
        "businessType": "User's business or profession",
        "interests": ["list", "of", "interests"],
        "goals": ["list", "of", "goals/objectives"],
        "preferences": {"tone": "tone preference", "language": "language preference"},
        "summary": "Short 1-sentence summary of what user was doing/asking"
      }

      CONVERSATION:
      ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
      User: ${content}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        let text = '';
        if (typeof response.text === 'function') {
            text = response.text();
        } else if (response.candidates && response.candidates.length > 0) {
            // Handle Vertex AI response structure
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts[0].text;
            }
        } else if (response.text) {
            text = response.text;
        }

        // Find JSON in response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('[MEMORY SERVICE] Extraction error:', error);
        return null;
    }
};

/**
 * Merges new info into existing memory intelligently
 */
export const updateMemory = async (userId, extractedInfo, lastFeature = 'Chat') => {
    try {
        if (!extractedInfo) return null;

        let memory = await UserMemory.findOne({ userId });

        if (!memory) {
            memory = new UserMemory({ userId });
        }

        if (extractedInfo.name && extractedInfo.name !== 'Unknown') memory.name = extractedInfo.name;
        if (extractedInfo.businessType) memory.businessType = extractedInfo.businessType;

        if (extractedInfo.interests && Array.isArray(extractedInfo.interests)) {
            extractedInfo.interests.forEach(interest => {
                if (interest && !memory.interests.includes(interest)) memory.interests.push(interest);
            });
            if (memory.interests.length > 10) memory.interests = memory.interests.slice(-10);
        }

        if (extractedInfo.goals && Array.isArray(extractedInfo.goals)) {
            extractedInfo.goals.forEach(goal => {
                if (goal && !memory.goals.includes(goal)) memory.goals.push(goal);
            });
            if (memory.goals.length > 10) memory.goals = memory.goals.slice(-10);
        }

        if (extractedInfo.preferences) {
            if (extractedInfo.preferences.tone) memory.preferences.tone = extractedInfo.preferences.tone;
            if (extractedInfo.preferences.language) memory.preferences.language = extractedInfo.preferences.language;
        }

        if (extractedInfo.summary) memory.lastSessionSummary = extractedInfo.summary;
        memory.lastActiveFeature = lastFeature;
        memory.updatedAt = Date.now();

        await memory.save();
        return memory;
    } catch (error) {
        console.error('[MEMORY SERVICE] Update error:', error);
        return null;
    }
};

/**
 * Gets memory context for system instruction
 */
export const getMemoryContext = async (userId) => {
    try {
        const memory = await UserMemory.findOne({ userId, isMemoryEnabled: true });
        if (!memory) return "";

        return `
[USER PERSONAL MEMORY]
User Name: ${memory.name || 'Unknown'}
Business/Profession: ${memory.businessType || 'Not specified'}
Interests: ${memory.interests.join(', ') || 'None recorded'}
Goals: ${memory.goals.join(', ') || 'None recorded'}
Last Active Session: ${memory.lastSessionSummary || 'No recent history'}
Last Active Feature: ${memory.lastActiveFeature || 'None'}
Tone Preference: ${memory.preferences.tone || 'Generic'}
Always tailor your responses to match the user's profession, goals, and interests provided above.
`;
    } catch (error) {
        return "";
    }
};
