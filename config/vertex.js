import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dual-mode initialization: Try Gemini API Key first, fallback to Vertex AI
const apiKey = process.env.GEMINI_API_KEY;
const projectId = process.env.GCP_PROJECT_ID;
const location = 'us-central1';
const keyFilePath = path.join(__dirname, '../google_cloud_credentials.json');

let genAI;
let vertexAI;
let useVertexAI = false;

// Try Gemini API Key first (simpler, more portable)
if (apiKey) {
  console.log(`✅ Gemini AI initializing with API Key`);
  genAI = new GoogleGenerativeAI(apiKey);
  useVertexAI = false;
}
// Fallback to Vertex AI with service account
else if (projectId) {
  console.log(`✅ Vertex AI initializing with project: ${projectId}`);
  try {
    vertexAI = new VertexAI({ project: projectId, location: location, keyFilename: keyFilePath });
    useVertexAI = true;
  } catch (e) {
    console.warn('⚠️ Vertex AI with keyfile failed, trying system auth...');
    try {
      vertexAI = new VertexAI({ project: projectId, location: location });
      useVertexAI = true;
    } catch (e2) {
      console.error('❌ Vertex AI initialization failed:', e2.message);
    }
  }
} else {
  console.error("❌ Error: Neither GEMINI_API_KEY nor GCP_PROJECT_ID found in environment variables.");
}

// Model name - use standard Gemini 1.5 Flash
export const modelName = "gemini-2.5-flash";

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

// Create generative model based on available initialization
export const generativeModel = useVertexAI
  ? vertexAI.preview.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
    generationConfig: { maxOutputTokens: 4096 },
    systemInstruction: systemInstructionText,
  })
  : genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
    generationConfig: { maxOutputTokens: 4096 },
    systemInstruction: systemInstructionText,
  });

// Export genAI instance for multi-model support in chatRoutes
export const genAIInstance = useVertexAI
  ? {
    getGenerativeModel: (options) => vertexAI.preview.getGenerativeModel(options)
  }
  : genAI;

// Export vertexAI for compatibility (mock if using Gemini API)
export { vertexAI };
