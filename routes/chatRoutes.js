import mongoose from "mongoose";
import express from "express"
import ChatSession from "../models/ChatSession.js"
import { generativeModel } from "../config/gemini.js";
import userModel from "../models/User.js";
import { verifyToken } from "../middleware/authorization.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import mammoth from "mammoth";
import { detectMode, getModeSystemInstruction } from "../utils/modeDetection.js";
import { detectIntent, extractReminderDetails, detectLanguage, getVoiceSystemInstruction } from "../utils/voiceAssistant.js";
import Reminder from "../models/Reminder.js";
import { requiresWebSearch, extractSearchQuery, processSearchResults, getWebSearchSystemInstruction } from "../utils/webSearch.js";
import { performWebSearch } from "../services/searchService.js";
import { convertFile } from "../utils/fileConversion.js";


const router = express.Router();
// Get all chat sessions (summary)
router.post("/", verifyToken, async (req, res) => {
  const { content, history, systemInstruction, image, document, language } = req.body;

  try {
    // Detect mode based on content and attachments
    const allAttachments = [];
    if (Array.isArray(image)) allAttachments.push(...image);
    else if (image) allAttachments.push(image);
    if (Array.isArray(document)) allAttachments.push(...document);
    else if (document) allAttachments.push(document);

    const detectedMode = detectMode(content, allAttachments);
    const modeSystemInstruction = getModeSystemInstruction(detectedMode, language || 'English', {
      fileCount: allAttachments.length
    });

    console.log(`[MODE DETECTION] Detected mode: ${detectedMode} for message: "${content?.substring(0, 50)}..."`);

    // Construct parts from history + current message
    let parts = [];

    // Use mode-specific system instruction, or fallback to provided systemInstruction
    // CRITICAL: FILE_CONVERSION instructions must take priority over frontend generic prompts
    let finalSystemInstruction = systemInstruction || modeSystemInstruction;
    if (detectedMode === 'FILE_CONVERSION') {
      finalSystemInstruction = modeSystemInstruction;
    }

    if (finalSystemInstruction) {
      parts.push({ text: `System Instruction: ${finalSystemInstruction}` });
    }

    // Add conversation history if available
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        parts.push({ text: `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}` });
      });
    }

    // Add current message
    parts.push({ text: `User: ${content}` });

    // Handle Multiple Images
    if (Array.isArray(image)) {
      image.forEach(img => {
        if (img.mimeType && img.base64Data) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64Data
            }
          });
        }
      });
    } else if (image && image.mimeType && image.base64Data) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64Data
        }
      });
    }

    // Handle Multiple Documents
    if (Array.isArray(document)) {
      for (const doc of document) {
        await processDocumentPart(doc, parts);
      }
    } else if (document && document.base64Data) {
      await processDocumentPart(document, parts);
    }

    async function processDocumentPart(doc, partsArray) {
      if (doc.mimeType === 'application/pdf') {
        partsArray.push({
          inlineData: {
            data: doc.base64Data,
            mimeType: 'application/pdf'
          }
        });
      } else if (doc.mimeType && (doc.mimeType.includes('word') || doc.mimeType.includes('document') || doc.mimeType.includes('text') || doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('presentation'))) {
        try {
          const buffer = Buffer.from(doc.base64Data, 'base64');
          let text = '';
          if (doc.mimeType.includes('word') || doc.mimeType.includes('document')) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
          } else {
            text = `[Attached File: ${doc.name || 'document'}]`;
          }
          partsArray.push({ text: `[Attached Document Content (${doc.name || 'document'})]:\n${text}` });
        } catch (e) {
          console.error("Extraction failed", e);
          partsArray.push({ text: `[Error reading attached document: ${e.message}]` });
        }
      }
    }

    // Voice Assistant: Detect intent for reminder/alarm
    const userIntent = detectIntent(content);
    const detectedLanguage = detectLanguage(content);
    let reminderData = null;
    let voiceConfirmation = '';

    console.log(`[VOICE ASSISTANT] Intent: ${userIntent}, Language: ${detectedLanguage}`);

    // If intent is reminder/alarm related, extract details and create reminder
    if (userIntent !== 'casual_chat' && userIntent !== 'clarification_needed') {
      try {
        reminderData = extractReminderDetails(content);
        console.log('[VOICE ASSISTANT] Reminder details:', reminderData);

        // Save reminder to database
        const newReminder = new Reminder({
          userId: req.user.id,
          title: reminderData.title,
          datetime: reminderData.datetime,
          notification: reminderData.notification,
          alarm: reminderData.alarm,
          voice: reminderData.voice,
          voiceMessage: reminderData.voice_message,
          intent: reminderData.intent
        });
        await newReminder.save();
        console.log('[VOICE ASSISTANT] Reminder saved to DB:', newReminder._id);

        // Generate voice-friendly confirmation
        const time = new Date(reminderData.datetime).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        const date = new Date(reminderData.datetime).toLocaleDateString('en-IN');

        if (detectedLanguage === 'Hinglish' || detectedLanguage === 'Hindi') {
          voiceConfirmation = `Okay, main ${time} par ${reminderData.alarm ? 'alarm aur ' : ''}${reminderData.voice ? 'voice ke saath ' : ''}reminder set kar dungi`;
        } else {
          voiceConfirmation = `Okay, I'll set a ${reminderData.alarm ? 'alarm and ' : ''}${reminderData.voice ? 'voice ' : ''}reminder for ${time}`;
        }
      } catch (error) {
        console.error('[VOICE ASSISTANT] Error extracting/saving reminder:', error);
      }
    }

    // Web Search: Check if query requires real-time information or Deep Search is enabled
    let searchResults = null;
    let webSearchInstruction = '';
    const isDeepSearch = systemInstruction && systemInstruction.includes('DEEP SEARCH MODE ENABLED');

    if (requiresWebSearch(content) || isDeepSearch) {
      console.log(`[WEB SEARCH] Query requires real-time information${isDeepSearch ? ' (Forced by Deep Search)' : ''}`);

      try {
        const searchQuery = extractSearchQuery(content);
        console.log(`[WEB SEARCH] Searching for: "${searchQuery}"`);

        const rawSearchData = await performWebSearch(searchQuery, isDeepSearch ? 10 : 5);

        if (rawSearchData) {
          const limit = isDeepSearch ? 10 : 5;
          searchResults = processSearchResults(rawSearchData, limit);
          console.log(`[WEB SEARCH] Found ${searchResults.snippets.length} results`);

          // Generate system instruction with search results
          webSearchInstruction = getWebSearchSystemInstruction(searchResults, language || 'English');

          // Inject search results into context
          parts.push({ text: `[WEB SEARCH RESULTS]:\n${JSON.stringify(searchResults.snippets)}` });
          parts.push({ text: `[SEARCH INSTRUCTION]: ${webSearchInstruction}` });
        } else {
          console.warn('[WEB SEARCH] No search results found');
        }
      } catch (error) {
        console.error('[WEB SEARCH] Error performing search:', error);
      }
    }

    // File Conversion: Check if this is a conversion request
    let conversionResult = null;

    if (detectedMode === 'FILE_CONVERSION') {
      console.log('[FILE CONVERSION] Conversion request detected');

      // First, get AI response to extract conversion parameters
      const tempContentPayload = { role: "user", parts: parts };
      const tempStreamingResult = await generativeModel.generateContentStream({ contents: [tempContentPayload] });
      const tempResponse = await tempStreamingResult.response;
      const aiResponse = tempResponse.text();

      console.log('[FILE CONVERSION] AI Response:', aiResponse);

      // Try to extract JSON from AI response (handle markdown backticks too)
      const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?"action":\s*"file_conversion"[\s\S]*?\})\s*```|(\{[\s\S]*?"action":\s*"file_conversion"[\s\S]*?\})/;
      const jsonMatch = aiResponse.match(jsonRegex);

      if (jsonMatch && allAttachments.length > 0) {
        try {
          const rawJson = jsonMatch[1] || jsonMatch[2];
          const conversionParams = JSON.parse(rawJson);
          console.log('[FILE CONVERSION] Parsed params:', conversionParams);

          // Get the first attachment (assuming single file conversion)
          const attachment = allAttachments[0];

          // Convert base64 to buffer
          const base64Data = attachment.base64Data || attachment.data;

          if (!base64Data) {
            throw new Error('No file data received for conversion');
          }

          const fileBuffer = Buffer.from(base64Data, 'base64');

          // Perform conversion
          const convertedBuffer = await convertFile(
            fileBuffer,
            conversionParams.source_format,
            conversionParams.target_format
          );

          // Convert result to base64
          const convertedBase64 = convertedBuffer.toString('base64');

          // Determine output filename
          const originalName = conversionParams.file_name || 'document';
          const baseName = originalName.replace(/\.(pdf|docx?|doc)$/i, '');
          const outputExtension = conversionParams.target_format === 'pdf' ? 'pdf' : 'docx';
          const outputFileName = `${baseName}_converted.${outputExtension}`;

          conversionResult = {
            success: true,
            file: convertedBase64,
            fileName: outputFileName,
            mimeType: conversionParams.target_format === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            message: aiResponse.replace(jsonMatch[0], '').trim()
          };

          console.log('[FILE CONVERSION] Conversion successful:', outputFileName);

        } catch (conversionError) {
          console.error('[FILE CONVERSION] Conversion failed:', conversionError);
          conversionResult = {
            success: false,
            error: conversionError.message
          };
        }
      }
    }

    // Correct usage for single-turn content generation with this SDK
    const contentPayload = { role: "user", parts: parts };

    let reply = "";
    let retryCount = 0;
    const maxRetries = 3;

    const attemptGeneration = async () => {
      const streamingResult = await generativeModel.generateContentStream({ contents: [contentPayload] });
      const response = await streamingResult.response;
      return response.text();
    };

    while (retryCount < maxRetries) {
      try {
        reply = await attemptGeneration();
        break; // Success!
      } catch (err) {
        if (err.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const waitTime = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw err;
      }
    }

    if (!reply) {
      reply = "I understood your request but couldn't generate a text response.";
    }

    // Construct final response object
    const finalResponse = {
      reply,
      detectedMode,
      language: detectedLanguage || language || 'English'
    };

    if (voiceConfirmation) {
      finalResponse.voiceConfirmation = voiceConfirmation;
    }

    if (conversionResult) {
      if (conversionResult.success) {
        finalResponse.conversion = {
          file: conversionResult.file,
          fileName: conversionResult.fileName,
          mimeType: conversionResult.mimeType
        };
        finalResponse.reply = conversionResult.message || reply;
      } else {
        finalResponse.reply = `Conversion failed: ${conversionResult.error}`;
      }
    }

    return res.status(200).json(finalResponse);
  } catch (err) {
    const fs = await import('fs');
    try {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const logData = `
Timestamp: ${new Date().toISOString()}
Error: ${err.message}
Code: ${err.code}
Env Project: ${process.env.GCP_PROJECT_ID}
Env Creds Path: '${credPath}'
Creds File Exists: ${credPath ? fs.existsSync(credPath) : 'N/A'}
Stack: ${err.stack}
-------------------------------------------
`;
      fs.appendFileSync('error.log', logData);
    } catch (e) { console.error("Log error:", e); }

    console.error("AISA backend error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      details: err.details || err.response?.data
    });
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: "AI failed to respond", details: err.message });
  }
});
// Get all chat sessions (summary) for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('[DB] MongoDB unreachable. Returning empty sessions.');
      return res.json([]);
    }

    const user = await userModel.findById(userId).populate({
      path: 'chatSessions',
      select: 'sessionId title lastModified',
      options: { sort: { lastModified: -1 } }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.chatSessions || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get chat history for a specific session
router.get('/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('[DB] MongoDB unreachable. Returning empty history.');
      return res.json({ sessionId, messages: [] });
    }

    // Optional: Verify that the session belongs to this user
    // For now, finding by sessionId is okay as sessionIds are unique/random
    let session = await ChatSession.findOne({ sessionId });

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Create or Update message in session
router.post('/:sessionId/message', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, title } = req.body;
    const userId = req.user.id


    if (!message?.role || !message?.content) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Cloudinary Upload Logic for Multiple Attachments
    if (message.attachments && Array.isArray(message.attachments)) {
      for (const attachment of message.attachments) {
        if (attachment.url && attachment.url.startsWith('data:')) {
          try {
            const matches = attachment.url.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');

              // Upload to Cloudinary
              const uploadResult = await uploadToCloudinary(buffer, {
                resource_type: 'auto',
                folder: 'chat_attachments',
                public_id: `chat_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              });

              // Update attachment with Cloudinary URL
              attachment.url = uploadResult.secure_url;
            }
          } catch (uploadError) {
            console.error("Cloudinary upload failed for attachment:", uploadError);
          }
        }
      }
    }

    // Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.warn('[DB] MongoDB unreachable. Skipping message save.');
      return res.json({ sessionId, messages: [message], dummy: true });
    }

    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $push: { messages: message },
        $set: { lastModified: Date.now(), ...(title && { title }) }
      },
      { new: true, upsert: true }
    );

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    await userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { chatSessions: session._id } },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});


// Delete individual message from session
router.delete('/:sessionId/message/:messageId', verifyToken, async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const userId = req.user.id;

    // Optional: Also delete the subsequent model response if it exists
    // (Logic moved from frontend to backend for consistency)
    const session = await ChatSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const msgIndex = session.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return res.status(404).json({ error: 'Message not found' });

    const msgsToDelete = [messageId];
    if (msgIndex + 1 < session.messages.length) {
      const nextMsg = session.messages[msgIndex + 1];
      if (nextMsg && nextMsg.role === 'model' && nextMsg.id) {
        msgsToDelete.push(nextMsg.id);
      }
    }

    // Filter out any undefined/null IDs just in case
    const validMsgsToDelete = msgsToDelete.filter(id => id);

    console.log(`[DELETE] Session: ${sessionId}, Removing IDs:`, validMsgsToDelete);

    if (validMsgsToDelete.length > 0) {
      await ChatSession.findOneAndUpdate(
        { sessionId },
        { $pull: { messages: { id: { $in: validMsgsToDelete } } } }
      );
    }

    res.json({ success: true, removedCount: validMsgsToDelete.length });
  } catch (err) {
    console.error(`[DELETE ERROR] Session: ${req.params.sessionId}, Msg: ${req.params.messageId}`, err);
    res.status(500).json({
      error: 'Failed to delete message',
      details: err.message
    });
  }
});


router.delete('/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await ChatSession.findOneAndDelete({ sessionId });
    if (session) {
      await userModel.findByIdAndUpdate(userId, { $pull: { chatSessions: session._id } });
    }
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
