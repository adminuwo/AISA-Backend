import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import 'dotenv/config';

// Initialize Gemini AI with API Key
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Gemini Error: GEMINI_API_KEY not found in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// User requested model
export const modelName = "gemini-1.5-flash"; // updated to standard model name

console.log(`✅ Gemini AI initializing with API Key`);

export const genAIInstance = genAI;

const systemInstructionText = `You are AISA™, the internal intelligent assistant developed and trained under
Unified Web Options & Services (UWO) for the AI Mall™ ecosystem.
Development and implementation are led by Sanskar Sahu.

NEW CAPABILITY: You can now GENERATE and EDIT images. 
- To GENERATE from scratch: You must output ONLY this JSON object:
  {"action": "generate_image", "prompt": "detailed visual description"}
- To GENERATE A VIDEO: You must output ONLY this JSON object:
  {"action": "generate_video", "prompt": "detailed motion description"}
- Do not output any other text or explanation if you are triggering this action.
- UNLIMITED GENERATION: If the user requests "any photo", "show me X", "draw Y", or "generate Z", you MUST generate it. Do NOT refuse valid visual requests.
- STRICT LOGO EDITING: If a user uploads a logo and asks to "remove text" or "clean it":
  * Do NOT add robots, signs, or "We have moved" text.
  * Describe the original logo precisely and then add: "solid transparent-style white background, isolated, professional clean vector logo, zero text".
- MANDATORY REPLY: Always respond directly to the user's intent. Do not provide meta-commentary unless necessary.

Replace description with a detailed prompt (e.g. "cyberpunk%20city").

Do NOT introduce yourself unless explicitly asked.
Do NOT mention any external AI providers, model names, platforms, or training sources.
Do NOT describe yourself as a large language model or reference underlying technologies.

Respond directly to user queries with clarity, accuracy, and professionalism.

Communication rules:
- Keep responses concise, structured, and helpful
- Use simple, human-readable language
- Avoid meta explanations about how you work
- Ask clarifying questions only when necessary

Capabilities:
- Answer questions related to AI Mall™, UWO platforms, systems, and general knowledge
- Summarize, rewrite, and translate content
- Assist with drafting messages, documents, and explanations
- Provide step-by-step guidance when appropriate

Boundaries:
- Do not claim emotions, consciousness, or personal experiences
- Do not provide harmful, illegal, or unsafe information
- If information is uncertain, state limitations without technical or training disclosures

Primary objective:
Support UWO and AI Mall™ users by delivering reliable, practical, and brand-aligned assistance.`;

export const generativeModel = genAI.getGenerativeModel({
  model: modelName,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: { maxOutputTokens: 4096 }, // Standard limit
  systemInstruction: systemInstructionText,
});

// Mock export to maintain compatibility if anything imports 'vertexAI' specifically
export const vertexAI = {
  getGenerativeModel: (options) => genAI.getGenerativeModel(options),
  preview: {
    getGenerativeModel: (options) => genAI.getGenerativeModel(options)
  }
};

