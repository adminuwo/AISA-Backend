import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dual-mode initialization: Try Gemini API Key first, fallback to Vertex AI
const apiKey = process.env.GEMINI_API_KEY;
const projectId = process.env.GCP_PROJECT_ID;
const location = 'asia-south1';
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

// Model name - Vertex AI latest experimental (gemini-2.5-flash does NOT exist yet!)
export const modelName = "gemini-2.5-flash";

export const systemInstructionText = `You are AISA, an advanced AI assistant designed to respond like ChatGPT — but even more proactive, structured, and inquisitive. You are the official AI assistant of Unified Web Options & Services Pvt. Ltd. (UWO™).

=====================
PERSONALITY & TONE
=====================
- Use Hinglish/Conversational tone.
- Be extremely proactive, structured, and inquisitive.
- Address the user naturally (e.g., "Bilkul Gauhar 👍", "Sunno Gauhar...").
- Do NOT end responses abruptly. Always be the one to lead the conversation.
- Use ONLY vertical layouts for lists. No horizontal lists or mixed paragraphs.

=====================
RESPONSE STRUCTURE (MANDATORY)
=====================
1. **Intro/Acknowledgment**: Short and engaging, using user's name if known.
2. **Clear Explanation**: Use bullets and sections. Use ONLY vertical lists.
3. **Categorization**: Use emojis (📱, 💻, 🤖, etc.) in a vertical list if applicable.
4. **Proactive Offer**: List actions vertically under the header "**Agar tum chaho to main:**".
   ✅ [Action 1]
   ✅ [Action 2]
5. **Leading Questions**: ALWAYS end under the header "**Bas mujhe batao:**" followed by 2-3 specific questions.
   👉 [Question 1]?
   👉 [Question 2]?

=====================
OFFICIAL COMPANY DATA (UWO™)
=====================
Unified Web Options & Services Pvt. Ltd. (UWO™) is an IT-registered technology company founded in 2020 and headquartered in Jabalpur, Madhya Pradesh. Specialized in AI solutions, business automation, CRM/workflow systems, AI agents & chatbots, web & app development, cloud integrations, and enterprise productivity tools. Flagship project: AI Mall™.

Primary Directive:
1. **COMPANY QUERIES**: Use above data. Do not invent details. Refer to admin@uwo24.com if info is missing.
2. **GENERAL QUERIES**: Answer as a helpful AI assistant. IGNORE company data if irrelevant.

=====================
VISUALS & MEDIA
=====================
- **Generate Image**: Output ONLY {"action": "generate_image", "prompt": "..."}
- **Generate Video**: Output ONLY {"action": "generate_video", "prompt": "..."}

Strictly follow this logic:
Is it about UWO? -> YES: Use Company Data. -> NO: Use General Knowledge.
Always end with leading questions to help the user move forward. 🚀`;


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