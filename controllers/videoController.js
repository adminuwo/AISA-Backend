import axios from 'axios';
import logger from '../utils/logger.js';
import { GoogleAuth, Impersonated } from 'google-auth-library';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { Storage } from '@google-cloud/storage';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Initialize Google Cloud Storage
// Ensure this doesn't crash if credentials are missing during startup
let storage;
try {
  const storageOptions = { projectId: process.env.GCP_PROJECT_ID };
  // Use service account key file if available (takes priority over ADC user account)
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    storageOptions.keyFilename = credPath;
  }
  storage = new Storage(storageOptions);
  logger.info('[GCS] Storage initialized' + (credPath ? ' with service account key' : ' with ADC'));
} catch (err) {
  logger.warn(`[GCS] Failed to initialize Google Cloud Storage: ${err.message}`);
}

// Video generation using external APIs (e.g., Replicate, Runway, or similar)
export const generateVideo = async (req, res) => {
  try {
    const { prompt, duration = 5, quality = 'medium', aspectRatio } = req.body;
    const userId = req.user?.id;

    let finalAspectRatio = '16:9';
    if (aspectRatio) {
      finalAspectRatio = aspectRatio;
    }

    if (prompt && typeof prompt === 'string') {
      if (prompt.includes('9:16')) {
        finalAspectRatio = '9:16';
      } else if (prompt.includes('1:1')) {
        finalAspectRatio = '1:1';
      } else if (prompt.includes('16:9')) {
        finalAspectRatio = '16:9';
      }
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required and must be a string'
      });
    }

    logger.info(`[VIDEO] Generating video with prompt: ${prompt.substring(0, 100)}`);

    // Example using Replicate API for video generation
    // You can replace this with your preferred video generation service
    const videoUrl = await generateVideoFromPrompt(prompt, duration, quality, finalAspectRatio);

    // If generateVideoFromPrompt returns null, it failed internally.
    // We can proceed to fallback logic below if videoUrl is null.
    if (!videoUrl) {
      logger.warn("[VIDEO] Primary generation failed, switching to fallback...");
      throw new Error('Primary video generation failed');
    }

    logger.info(`[VIDEO] Video generated successfully: ${videoUrl}`);

    // Increment usage if successful
    if (req.monthlyUsage && req.usageKey) {
      const { default: subscriptionService } = await import('../services/subscriptionService.js');
      await subscriptionService.incrementUsage(req.monthlyUsage, req.usageKey);
    }

    return res.status(200).json({
      success: true,
      videoUrl: videoUrl,
      prompt: prompt,
      duration: duration,
      quality: quality
    });

  } catch (error) {
    logger.error(`[VIDEO ERROR] ${error.message}`);


    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate video'
    });
  }
};

// Function to generate video using Vertex AI (Veo Model) via @google/genai
// Removed `createImpersonatedStorageClient` and `getVideoSignedUrl` as we now upload to Cloudinary


export const generateVideoFromPrompt = async (prompt, duration, quality, aspectRatio = '16:9') => {
  const logDebug = (msg) => {
    try { fs.appendFileSync('debug_video.log', `${new Date().toISOString()} - ${msg}\n`); } catch (e) { }
  };

  try {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = 'us-central1';
    const bucketName = 'aisageneratedvideo';

    logDebug(`Starting generation for prompt: ${prompt}`);
    logger.info(`[VIDEO] Starting generation flow via Vertex AI (Standard ADC)...`);

    // 1. INITIALIZE VERTEX AI CLIENT (Standard ADC)
    // We rely on the environment's ADC (User or Runtime SA) for generation permission
    const client = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: location,
    });

    // 2. PREPARE OUTPUT URI
    const fileName = `${uuidv4()}.mp4`;
    const outputGcsUri = `gs://${bucketName}/${fileName}`;
    logDebug(`Output URI: ${outputGcsUri}`);
    logger.info(`[VIDEO] Output URI: ${outputGcsUri}`);

    // 3. START GENERATION
    let operation = await client.models.generateVideos({
      model: 'veo-3.1-fast-generate-001',
      prompt: prompt,
      config: {
        aspectRatio: aspectRatio,
        outputGcsUri: outputGcsUri,
      },
    });

    logDebug(`Operation started: ${operation.name}`);
    logger.info(`[VIDEO] Operation started (Name: ${operation.name}). Polling...`);

    // 4. POLL FOR COMPLETION
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15s interval
      operation = await client.operations.get({ operation: operation });
      logDebug(`Polling status: ${operation.done ? 'Done' : 'In Progress'}`);
      logger.info(`[VIDEO] Polling status: ${operation.done ? 'Done' : 'In Progress'}`);
    }

    // 5. CHECK FOR ERRORS
    if (operation.error) {
      logDebug(`Operation Error: ${JSON.stringify(operation.error)}`);
      logger.error(`[VIDEO] Operation Error: ${JSON.stringify(operation.error, null, 2)}`);
      throw new Error(`Video generation failed: ${operation.error.message || 'Unknown error from Vertex AI'}`);
    }

    // 6. PROCESS SUCCESS RESPONSE
    if (operation.response && operation.response.generatedVideos && operation.response.generatedVideos.length > 0) {
      const videoUri = operation.response.generatedVideos[0].video.uri;
      logDebug(`Generation complete. URI: ${videoUri}`);
      logger.info(`[VIDEO] Generation complete. GCS URI: ${videoUri}`);

      // Extract path for signing
      const bucketPrefix = `gs://${bucketName}/`;
      let finalFileName = fileName;
      if (videoUri.startsWith(bucketPrefix)) {
        finalFileName = videoUri.slice(bucketPrefix.length);
      }

      logDebug(`Uploading video to Cloudinary: ${finalFileName}`);
      logger.info(`[VIDEO] Uploading video to Cloudinary: ${finalFileName}`);

      // 7. DOWNLOAD FROM GCS using Storage SDK & UPLOAD TO CLOUDINARY
      try {
        logDebug(`Downloading video from GCS using Storage SDK...`);
        logger.info(`[VIDEO] Downloading video from GCS using Storage SDK...`);

        // Initialize a fresh Storage client with explicit service account if available
        const storageOptions = { projectId: projectId };
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credPath) {
          storageOptions.keyFilename = credPath;
        }
        const gcsClient = new Storage(storageOptions);

        const [videoBuffer] = await gcsClient.bucket(bucketName).file(finalFileName).download();
        logDebug(`GCS download complete. Size: ${videoBuffer.length} bytes`);
        logger.info(`[VIDEO] GCS download complete. Size: ${videoBuffer.length} bytes`);

        logger.info(`[VIDEO] Uploading to Cloudinary...`);
        const cloudResult = await uploadToCloudinary(videoBuffer, {
          folder: 'generated_videos',
          resource_type: 'video',
          public_id: `aisa_vid_${Date.now()}`
        });

        const url = cloudResult.secure_url;
        logDebug(`Success! Cloudinary URL: ${url}`);
        logger.info(`[VIDEO] Success! Cloudinary URL: ${url}`);
        return url;
      } catch (uploadError) {
        logDebug(`Upload/Download failed: ${uploadError.message}`);
        logger.error(`[VIDEO] Upload/Download failed: ${uploadError.message}`);
        throw new Error(`Failed to process and upload video: ${uploadError.message}`);
      }

    } else {
      logDebug(`No videos returned. Full op: ${JSON.stringify(operation)}`);
      logger.error(`[VIDEO] Operation returned no videos. full op: ${JSON.stringify(operation, null, 2)}`);
      throw new Error('Video generation completed but returned no results.');
    }

  } catch (error) {
    logger.error(`[VERTEX VIDEO ERROR] ${error.message}`);
    try { fs.appendFileSync('debug_video.log', `${new Date().toISOString()} - ERROR: ${error.message}\n`); } catch (e) { }
    // DO NOT throw error here, return null so the main function can use fallback
    return null;
  }
};

// Poll Replicate for video generation result
const pollReplicateResult = async (predictionId, apiKey, maxAttempts = 60) => {
  try {
    for (let i = 0; i < maxAttempts; i++) {
      // ... (implementation preserved if needed, or can be removed if unused)
      // Since I removed the call to this, I can also remove this function or leave it as utility
      const response = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${apiKey}`
          }
        }
      );

      if (response.data.status === 'succeeded') {
        return response.data.output?.[0] || null;
      } else if (response.data.status === 'failed') {
        throw new Error('Video generation failed on server');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Video generation timeout');
  } catch (error) {
    logger.error(`[POLL ERROR] ${error.message}`);
    throw error;
  }
};

// Get video generation status
export const getVideoStatus = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    // You would implement status tracking based on your video service
    // This is a placeholder implementation

    return res.status(200).json({
      success: true,
      status: 'completed',
      videoId: videoId
    });

  } catch (error) {
    logger.error(`[VIDEO STATUS ERROR] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get video status'
    });
  }
};

// Download video through backend proxy to bypass CORS
export const downloadVideo = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }

    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
    });

    res.setHeader('Content-Disposition', 'attachment; filename="aisa-generated-video.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    response.data.pipe(res);
  } catch (error) {
    logger.error(`[DOWNLOAD ERROR] Failed to download video: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to download video' });
  }
};
