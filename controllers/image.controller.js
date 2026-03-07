import { uploadToCloudinary } from '../services/cloudinary.service.js';
import axios from 'axios';
import logger from '../utils/logger.js';
import { GoogleAuth } from 'google-auth-library';

// Helper function to generate or modify image using Vertex AI
export const generateImageFromPrompt = async (prompt, originalImage = null, aspectRatio = '1:1') => {
    try {
        console.log(`[VERTEX IMAGE] Triggered for: "${prompt}" (Edit: ${!!originalImage}, Ratio: ${aspectRatio})`);

        // Check if we have credentials to even attempt Vertex
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCP_PROJECT_ID) {
            console.warn("[VERTEX IMAGE] Missing GCP Credentials/Project ID - Falling back to Pollinations");
            throw new Error("Missing GCP Credentials");
        }

        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
            projectId: process.env.GCP_PROJECT_ID
        });

        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const accessTokenResponse = await client.getAccessToken();
        const token = accessTokenResponse.token || accessTokenResponse;

        // Edits generally work best in us-central1
        const location = 'us-central1';

        // Try newest capability model first, fallback to @006 if it fails
        const attemptVertexEdit = async (targetModel) => {
            console.log(`[VERTEX] Attempting ${originalImage ? 'edit' : 'generate'} with ${targetModel} in ${location}...`);
            const targetEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${targetModel}:predict`;

            let instanceStruct = { prompt: prompt };
            let paramStruct = { sampleCount: 1 };

            if (originalImage) {
                // Determine base64 data - allow both string and object formats
                let base64Data = typeof originalImage === 'string' ? originalImage : (originalImage.base64Data || originalImage.image || originalImage.data);

                // Strip out data URL prefix if present
                if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
                    base64Data = base64Data.split('base64,')[1];
                }

                if (targetModel.includes('capability')) {
                    // Imagen 3.0 Capability configuration for mask-free editing
                    instanceStruct.image = { bytesBase64Encoded: base64Data };
                    // We omit editConfig entirely, Vertex AI will default to mask-free editing
                    // because an image is provided without a mask or explicit editMode.
                } else {
                    // Old imagegeneration configuration
                    instanceStruct.image = { bytesBase64Encoded: base64Data };
                    paramStruct.editConfig = {
                        editMode: prompt.toLowerCase().includes('background') ? "product-image" : "inpainting-insert"
                    };
                }
            } else {
                // Determine Vertex AI compatible aspect ratio for new generation
                let vertexRatio = '1:1';
                if (aspectRatio === '16:9') vertexRatio = '16:9';
                else if (aspectRatio === '4:5') vertexRatio = '3:4'; // Closest vertical supported by vertex
                else if (aspectRatio === '4:7') vertexRatio = '9:16'; // Closest vertical supported by vertex

                paramStruct.aspectRatio = vertexRatio;
            }

            return await axios.post(targetEndpoint,
                { instances: [instanceStruct], parameters: paramStruct },
                {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    timeout: 60000
                }
            );
        };

        let response;
        let modelId = originalImage ? 'imagen-3.0-capability-001' : 'imagen-3.0-generate-001';

        try {
            response = await attemptVertexEdit(modelId);
        } catch (err) {
            console.warn(`[VERTEX WARNING] ${modelId} failed: ${err.message}. Data: ${JSON.stringify(err.response?.data)}. Trying alternative...`);
            if (!originalImage) {
                modelId = 'imagegeneration@006';
                try {
                    response = await attemptVertexEdit(modelId);
                } catch (err2) {
                    console.warn(`[VERTEX WARNING] ${modelId} failed: ${err2.message}`);
                    throw err2;
                }
            } else {
                throw err;
            }
        }

        console.log(`[VERTEX RESPONSE] Status: ${response.status}, Model: ${modelId}`);

        if (response.data && response.data.predictions && response.data.predictions[0]) {
            const prediction = response.data.predictions[0];
            const base64Data = prediction.bytesBase64Encoded || (typeof prediction === 'string' ? prediction : null);

            if (base64Data) {
                console.log(`[CLOUD UPLOAD] Saving ${modelId} result...`);
                const buffer = Buffer.from(base64Data, 'base64');
                const cloudResult = await uploadToCloudinary(buffer, {
                    folder: 'generated_images',
                    public_id: `aisa_${originalImage ? 'edit' : 'gen'}_${Date.now()}`
                });

                if (cloudResult && cloudResult.secure_url) {
                    console.log(`[IMAGE SUCCESS] URL: ${cloudResult.secure_url}`);
                    return cloudResult.secure_url;
                }
            }
        }

        throw new Error(`Vertex AI (${modelId}) did not return valid image data.`);

    } catch (error) {
        const errorMsg = error.message || "Unknown error";

        if (originalImage) {
            console.error(`[VERTEX IMAGE EDIT FAILED] Reason: ${errorMsg}. Cannot fallback to Pollinations for edits.`);
            throw new Error(`Image modification failed: ${errorMsg}`);
        }

        console.warn(`[VERTEX IMAGE FALLBACK] Reason: ${errorMsg}. Switching to Pollinations.`);

        // Determine dimensions for Pollinations based on ratio
        let pWidth = 1024;
        let pHeight = 1024;
        if (aspectRatio === '16:9') { pWidth = 1280; pHeight = 720; }
        else if (aspectRatio === '4:5') { pWidth = 800; pHeight = 1000; }
        else if (aspectRatio === '4:7') { pWidth = 800; pHeight = 1400; }

        // Robust Fallback to Pollinations with Flux model
        const safePrompt = encodeURIComponent(prompt.substring(0, 500));
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=${pWidth}&height=${pHeight}&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

        try {
            console.log(`[PROXY DOWNLOAD] Fetching from: ${pollinationsUrl}`);
            const resp = await axios.get(pollinationsUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            console.log(`[PROXY UPLOAD] Uploading Pollinations result to Cloudinary...`);
            const cloudResult = await uploadToCloudinary(Buffer.from(resp.data), {
                folder: 'generated_images',
                public_id: `poll_${Date.now()}`
            });

            if (cloudResult && cloudResult.secure_url) {
                console.log(`[PROXY SUCCESS] URL: ${cloudResult.secure_url}`);
                return cloudResult.secure_url;
            }
            return pollinationsUrl;

        } catch (e) {
            console.error(`[PROXY FAILED] ${e.message}. Returning direct Pollinations link.`);
            return pollinationsUrl;
        }
    }
};

import { refineBrandPrompt } from '../utils/brandIdentity.js';

// @desc    Generate Image
export const generateImage = async (req, res, next) => {
    try {
        let { prompt, aspectRatio = '1:1' } = req.body || {};

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        // Apply Brand Identity Refinement
        prompt = refineBrandPrompt(prompt, 'image');

        if (logger && logger.info) logger.info(`[Image Generation] Processing: "${prompt}" (Ratio: ${aspectRatio})`);
        else console.log(`[Image Generation] Processing: "${prompt}" (Ratio: ${aspectRatio})`);

        const imageUrl = await generateImageFromPrompt(prompt, null, aspectRatio);

        if (!imageUrl) {
            throw new Error("Failed to retrieve image URL from any source.");
        }

        // Increment usage if successful
        if (req.subscriptionMeta) {
            const { usage, usageKey } = req.subscriptionMeta;
            if (usage && usageKey) {
                const subscriptionService = { incrementUsage: async () => {} };
                await subscriptionService.incrementUsage(usage, usageKey);
            }
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

        // If we only have a URL, check if it's a data URL or an external one
        if (imageUrl && !imageToProcess) {
            if (imageUrl.startsWith('data:')) {
                console.log("[Image Editing] Processing data URL");
                imageToProcess = imageUrl.split(',')[1];
            } else {
                try {
                    console.log(`[Image Editing] Fetching external image: ${imageUrl}`);
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    imageToProcess = Buffer.from(response.data).toString('base64');
                } catch (err) {
                    console.error("[Image Editing] Failed to fetch image from URL:", err.message);
                    throw new Error(`Failed to process the source image URL: ${err.message}`);
                }
            }
        }

        if (!imageToProcess) {
            return res.status(400).json({ success: false, message: 'Valid image data (URL or Base64) is required' });
        }

        const modifiedImageUrl = await generateImageFromPrompt(prompt, imageToProcess);

        if (!modifiedImageUrl) {
            throw new Error("Failed to retrieve modified image URL.");
        }

        // Increment usage if successful (Using 'image' limit for now)
        if (req.subscriptionMeta) {
            const { usage, usageKey } = req.subscriptionMeta;
            if (usage && usageKey) {
                const subscriptionService = { incrementUsage: async () => {} };
                await subscriptionService.incrementUsage(usage, usageKey);
            }
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
