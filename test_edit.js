import dotenv from 'dotenv';
dotenv.config();
import { generateImageFromPrompt } from './controllers/image.controller.js';

const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
async function run() {
    try {
        const url = await generateImageFromPrompt("remove text", { base64Data: dummyBase64 });
        console.log("SUCCESS:", url);
    } catch (err) {
        console.error("FAILED:", err);
    }
}
run();
