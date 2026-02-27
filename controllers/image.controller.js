import { uploadToCloudinary } from '../services/cloudinary.service.js';
import axios from 'axios';
import logger from '../utils/logger.js';
import { GoogleAuth } from 'google-auth-library';

// Helper function to generate or modify image using Vertex AI
export const generateImageFromPrompt = async (prompt, originalImage = null) => {
    try {
        console.log(`[VERTEX IMAGE] Triggered for: "${prompt}" (Edit: ${!!originalImage})`);

        // Check if we have credentials to even attempt Vertex
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCP_PROJECT_ID) {
            throw new Error("Missing GCP Credentials/Project ID - Skipping Vertex");
        }

        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
            projectId: process.env.GCP_PROJECT_ID || process.env.PROJECT_ID
        });

        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const accessTokenResponse = await client.getAccessToken();
        const token = accessTokenResponse.token || accessTokenResponse;

        // Edits generally work best in us-central1 with specific capability models
        const location = originalImage ? 'us-central1' : 'asia-south1';

        // We'll use the robust 'imagegeneration@006' capable of mask-free editMode
        const modelId = originalImage ? 'imagegeneration@006' : 'imagen-3.0-generate-002';
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

        const instance = { prompt: prompt };
        let parameters = {
            sampleCount: 1,
            aspectRatio: "1:1",
            safetyFilterLevel: "block_low_and_above",
            personGeneration: "allow_adult"
        };
        
        if (originalImage) {
            // For editing on imagegeneration@006 we just use 'image'
            instance.image = {
                bytesBase64Encoded: originalImage.base64Data || originalImage
            };
            
            // Format parameters specifically for editing capabilities
            let editModeConfig = "inpainting-insert";
            
            // If they want to remove background, 'product-image' is best
            if (prompt.toLowerCase().includes('remove') && prompt.toLowerCase().includes('background')) {
                editModeConfig = "product-image";
            }
            
            parameters = {
                sampleCount: 1,
                editConfig: {
                     editMode: editModeConfig
                }
            };
        }

        const response = await axios.post(
            endpoint,
            {
                instances: [instance],
                parameters: parameters
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30s timeout
            }
        );

        if (response.data && response.data.predictions && response.data.predictions[0]) {
            const prediction = response.data.predictions[0];
            const base64Data = prediction.bytesBase64Encoded || prediction;

            if (base64Data && typeof base64Data === 'string') {
                const buffer = Buffer.from(base64Data, 'base64');
                const cloudResult = await uploadToCloudinary(buffer, {
                    folder: 'generated_images',
                    public_id: `img_${originalImage ? 'mod' : 'gen'}_${Date.now()}`
                });
                logger.info(`[VERTEX IMAGE] Success: ${cloudResult.secure_url}`);
                return cloudResult.secure_url;
            }
        }

        throw new Error(`Vertex AI (${modelId}) did not return valid image data.`);

    } catch (error) {
        const errorMsg = error.message || "Unknown error";
        console.warn(`[VERTEX IMAGE FALLBACK] Reason: ${errorMsg}. Switching to Pollinations.`);

        // Robust Fallback to Pollinations with Flux model
        // Flux is the best free model available on Pollinations currently
        const safePrompt = encodeURIComponent(prompt.substring(0, 500)); // Safety limit
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

        // Optionally upload pollinations image to Cloudinary to make it permanent
        // This is important because Pollinations links can be slow or expire
        try {
            console.log(`[PROXY DOWNLOAD] Fetching from Pollinations: ${pollinationsUrl}`);
            const resp = await axios.get(pollinationsUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            console.log(`[PROXY UPLOAD] Uploading to Cloudinary...`);
            const cloudResult = await uploadToCloudinary(Buffer.from(resp.data), {
                folder: 'generated_images',
                public_id: `poll_${Date.now()}`
            });
            console.log(`[PROXY SUCCESS] URL: ${cloudResult.secure_url}`);
            return cloudResult.secure_url;

        } catch (e) {
            console.error(`[PROXY FAILED] ${e.message}. Returning direct link.`);
            // Fallback to direct link if upload fails
            return pollinationsUrl;
        }
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

        if (logger && logger.info) logger.info(`[Image Generation] Processing: "${prompt}"`);
        else console.log(`[Image Generation] Processing: "${prompt}"`);

        const imageUrl = await generateImageFromPrompt(prompt);

        if (!imageUrl) {
            throw new Error("Failed to retrieve image URL from any source.");
        }

        // Increment usage if successful
        if (req.monthlyUsage && req.usageKey) {
            const { default: subscriptionService } = await import('../services/subscriptionService.js');
            await subscriptionService.incrementUsage(req.monthlyUsage, req.usageKey);
        }

        res.status(200).json({
            success: true,
            data: imageUrl
        });
    } catch (error) {
        if (logger && logger.error) logger.error(`[Image Generation] Critical Error: ${error.message}`);
        else console.error(`[Image Generation] Critical Error`, error);

        res.status(500).json({
            success: false,
            message: `Image generation failed: ${error.message}`
        });
    }
};

// @desc    Edit/Modify Image
// @route   POST /api/image/edit
// @access  Private
export const editImage = async (req, res, next) => {
    try {
        const { prompt, imageUrl, imageBase64 } = req.body || {};

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Editing prompt is required' });
        }

        if (!imageUrl && !imageBase64) {
            return res.status(400).json({ success: false, message: 'Image (URL or Base64) is required for editing' });
        }

        console.log(`[Image Editing] Processing: "${prompt}"`);

        let imageToProcess = imageBase64;

        // If we only have a URL, we might need to fetch it and convert to base64 for Vertex 
        // Or Vertex might accept the URL directly? StandardVertex often wants bytes.
        if (imageUrl && !imageBase64) {
            try {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                imageToProcess = Buffer.from(response.data).toString('base64');
            } catch (err) {
                console.error("[Image Editing] Failed to fetch image from URL:", err.message);
                throw new Error("Failed to process the source image URL.");
            }
        }

        const modifiedImageUrl = await generateImageFromPrompt(prompt, imageToProcess);

        if (!modifiedImageUrl) {
            throw new Error("Failed to retrieve modified image URL.");
        }

        // Increment usage if successful (Using 'image' limit for now)
        if (req.monthlyUsage && req.usageKey) {
            const { default: subscriptionService } = await import('../services/subscriptionService.js');
            await subscriptionService.incrementUsage(req.monthlyUsage, req.usageKey);
        }

        res.status(200).json({
            success: true,
            data: modifiedImageUrl
        });
    } catch (error) {
        console.error(`[Image Editing] Critical Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Image editing failed: ${error.message}`
        });
    }
};
