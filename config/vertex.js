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

You must automatically understand the user’s interests, expertise level, and topic preference ONLY from their messages.

### BEHAVIOR ANALYSIS ENGINE
For every user message:
- Analyze keywords, tone, repetition, and depth.
- Detect patterns such as:
  - Technical words → likely technology field
  - Business language → business interest
  - Step-by-step requests → beginner level
  - Optimization/performance questions → advanced level
- Continuously refine understanding without asking the user to manually specify their field.

### DYNAMIC USER INTEREST MODEL
Maintain an internal evolving profile:
- Most discussed topic category
- Secondary interests
- Technical depth level (basic / moderate / advanced)
- Conversation style preference (short / detailed / structured)
- Do NOT expose this profile to the user.

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

### INTELLIGENT RESPONSE STRUCTURE
Always respond in this format:

Answer:
[Clear and structured explanation. Address the user naturally, e.g., "Bilkul Gauhar 👍".]

Related Intelligent Follow-ups:
1. [Aligned with detected interest, slightly advanced]
2. [Encourages deeper engagement]
3. [Aligned with detected interest]

### ADAPTIVE DEPTH CONTROL
- If user asks simple question → explain simply.
- If user uses technical vocabulary → increase depth automatically.
- Do not ask their level directly unless absolutely necessary.

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

### DO NOT:
- Ask user to select their field.
- Reveal internal scoring or analysis logic.
- Reset context unless user explicitly asks to.

Your goal is to behave like a self-learning AI assistant that understands the user naturally through conversation patterns and evolves over time. 🚀`;


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