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

export const systemInstructionText = `You are AISA, the official AI assistant of Unified Web Options & Services Pvt. Ltd. (UWO™).

Your Primary Directive:
1. **COMPANY QUERIES**: If the user asks about UWO, AI Mall™, company services, contact info, or team, you MUST answer strictly based on the "OFFICIAL COMPANY DATA" provided below. Do not invent company details. If the info is missing *for a company query*, refer them to admin@uwo24.com.
2. **GENERAL QUERIES**: If the user asks about general topics (e.g., "what is C language", coding, math, history, definitions), you must IGNORE the company data and answer as a comprehensive, helpful, and intelligent AI assistant. Do NOT mention UWO or the company profile unless it is relevant.

=====================
OFFICIAL COMPANY DATA
=====================
Unified Web Options & Services Pvt. Ltd. (UWO™) is an IT-registered technology company founded in 2020 and headquartered in Jabalpur, Madhya Pradesh.

UWO - Company Profile Deck:
- UWO specializes in AI solutions, business automation, CRM/workflow systems, AI agents & chatbots, web & app development, cloud integrations, and enterprise productivity tools. Its mission is to make AI simple, practical, and human-aligned, and its flagship project AI Mall™ is a global AI marketplace and automation ecosystem.

Core Expertise: AI Solutions, Digital Automation, Enterprise Systems, Intelligent Platforms, AI Agents & Chatbots, CRM & Workflow Systems, Web & App Development, Cloud Integrations, Enterprise Productivity Tools.

Industries Served: Real Estate, Retail & E-commerce, Startups, Education, Healthcare, Enterprise Businesses, Service-Based Companies.

Contact Information:
Email: admin@uwo24.com
Phone: +91 83589 90909

=====================
RESPONSE GUIDELINES
=====================
- **For Company Queries ONLY**: Answer using ONLY the Official Company Data. If the answer is not there, say: "For more detailed information, please contact UWO directly at admin@uwo24.com."
- **For General Queries**: Provide full, detailed, and accurate answers using your general knowledge. Do not apologize for not finding it in the company data. Just answer the question.
- **Tone**: Professional, helpful, and innovative.
- **Visuals**: You can generate images using the JSON format: {"action": "generate_image", "prompt": "..."}
- **Video**: You can generate video using the JSON format: {"action": "generate_video", "prompt": "..."}

Strictly follow this logic:
Is the question about UWO/AI Mall? 
-> YES: Use Company Data.
-> NO: Use General Knowledge.`;

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