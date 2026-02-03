
import { VertexAI } from '@google-cloud/vertexai';
import 'dotenv/config';

const projectId = process.env.GCP_PROJECT_ID || 'ai-mall-484810';
const location = 'us-central1';

async function listModels() {
    const vertexAI = new VertexAI({ project: projectId, location: location });

    // Test older stable model
    const model = 'gemini-2.5-flash';

    try {
        console.log(`Checking ${model} in ${location}...`);
        const generativeModel = vertexAI.getGenerativeModel({ model: model });
        const resp = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        });
        console.log(`Success with ${model}:`, resp.response.candidates[0].content.parts[0].text.substring(0, 50));
    } catch (e) {
        console.error(`Failed with ${model}:`, e.message);
    }
}

listModels();
