import { uploadToCloudinary } from '../services/cloudinary.service.js';
import axios from 'axios';
import logger from '../utils/logger.js';
import { GoogleAuth } from 'google-auth-library';

// Helper function to generate image using Vertex AI (Imagen 3)
export const generateImageFromPrompt = async (prompt) => {
    try {
        logger.info(`[VERTEX IMAGE] Attempting generation for: "${prompt}"`);

        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
            projectId: process.env.GCP_PROJECT_ID || process.env.PROJECT_ID
        });
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const accessTokenResponse = await client.getAccessToken();
        const token = accessTokenResponse.token || accessTokenResponse;

        const location = 'us-central1'; // Imagen models are typically in us-central1
        const modelId = 'imagen-3.0-generate-001';
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

        const response = await axios.post(
            endpoint,
            {
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.predictions && response.data.predictions[0]) {
            const prediction = response.data.predictions[0];
            const base64Data = prediction.bytesBase64Encoded || prediction;

            if (base64Data) {
                const buffer = Buffer.from(base64Data, 'base64');
                const cloudResult = await uploadToCloudinary(buffer, {
                    folder: 'generated_images',
                    public_id: `gen_${Date.now()}`
                });
                logger.info(`[VERTEX IMAGE] Uploaded to Cloudinary: ${cloudResult.secure_url}`);
                return cloudResult.secure_url;
            }
        }

        throw new Error('Vertex AI did not return a valid image payload.');

    } catch (error) {
        logger.error(`[VERTEX IMAGE ERROR] ${error.message}`);
        // Fallback or re-throw? For now re-throw to let handler decide or fallback manually if desired.
        // But since user requested "replace", we might not want fallback to Pollinations unless critical.
        throw error;
    }
};

// @desc    Generate Image
// @route   POST /api/image/generate
// @access  Public
export const generateImage = async (req, res, next) => {
    try {
        const { prompt } = req.body || {};

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        logger.info(`[Image Generation] Generating image for prompt: "${prompt}"`);

        const imageUrl = await generateImageFromPrompt(prompt);

        res.status(200).json({
            success: true,
            data: imageUrl
        });
    } catch (error) {
        logger.error(`[Image Generation] Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Image generation failed: ${error.message}`
        });
    }
};
