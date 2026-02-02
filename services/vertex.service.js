import { generativeModel, genAIInstance, modelName } from '../config/vertex.js';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import logger from '../utils/logger.js';

export const askVertex = async (prompt, context = null, options = {}) => {
    try {
        const { systemInstruction, images, documents } = options;

        let finalPrompt = prompt;
        // Combine context with prompt if available (if not using system instruction to carry context)
        if (context) {
            finalPrompt = `CONTEXT:\n${context}\n\nUSER QUESTION:\n${prompt}`;
        }

        let model = generativeModel; // Default model

        // 1. Dynamic Model Creation (if systemInstruction is provided)
        // This is crucial for "File Conversion" mode where specific JSON output instructions are needed.
        if (systemInstruction && genAIInstance) {
            logger.info(`[VERTEX] Creating dynamic model instance with Custom System Instruction.`);
            model = genAIInstance.getGenerativeModel({
                model: modelName,
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Allow some flexibility
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 4096,
                    responseMimeType: systemInstruction.includes("JSON") ? "application/json" : "text/plain"
                },
                systemInstruction: systemInstruction,
            });
        }

        logger.info(`[VERTEX] Sending request to Gemini (Context: ${!!context}, Images: ${images?.length || 0})...`);

        // 2. Prepare Parts (Text + Images)
        let parts = [{ text: finalPrompt }];

        if (images && images.length > 0) {
            const imageParts = images.map(img => ({
                inlineData: {
                    data: img.base64Data,
                    mimeType: img.mimeType
                }
            }));
            // Prepend images to the prompt
            parts = [...imageParts, ...parts];
        }

        // 3. Generate Content
        const result = await model.generateContent(parts);
        const response = await result.response;

        let text = '';
        if (typeof response.text === 'function') {
            text = response.text();
        } else if (response.candidates && response.candidates.length > 0) {
            text = response.candidates[0].content.parts[0].text;
        } else {
            logger.warn(`[VERTEX] Unexpected response format: ${JSON.stringify(response)}`);
            text = "No response generated.";
        }

        // 4. JSON Parsing Attempt (If mode expects JSON)
        // If the instruction asked for JSON, ensure we return it as a string. 
        // The frontend parses it if possible. 
        // We clean up markdown code blocks just in case: ```json ... ```
        if (options.mode === 'FILE_CONVERSION' || (systemInstruction && systemInstruction.includes('JSON'))) {
            text = text.replace(/```json\s*|\s*```/g, '').trim();
        }

        logger.info(`[VERTEX] Response received successfully (${text.length} chars).`);
        return text;

    } catch (error) {
        logger.error(`[VERTEX] Error: ${error.message}`);
        // Fallback for safety blocks
        if (error.message.includes("SAFETY")) {
            return "I cannot fulfill this request due to safety guidelines.";
        }
        throw error;
    }
};
