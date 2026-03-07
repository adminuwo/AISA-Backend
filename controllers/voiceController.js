import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import officeParser from 'officeparser';
const incrementUsage = { execute: async () => {} }; // Mock logic 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service account key file
const keyFilename = path.join(__dirname, '../google_cloud_credentials.json');

// Initialize the client if key exists
// Initialize the client
let client = null;

try {
    if (fs.existsSync(keyFilename)) {
        client = new textToSpeech.TextToSpeechClient({ keyFilename });
        console.log("✅ [VoiceController] Google Cloud TTS Client Initialized with Key File");
    } else {
        console.warn("⚠️ [VoiceController] Key file not found, attempting ADC...");
        // Fallback to ADC
        client = new textToSpeech.TextToSpeechClient();
        console.log("✅ [VoiceController] Google Cloud TTS Client Initialized with ADC");
    }
} catch (err) {
    console.warn("⚠️ [VoiceController] Failed to initialize TTS Client:", err.message);
    try {
        // Last ditch effort: Try ADC if key file init failed
        client = new textToSpeech.TextToSpeechClient();
        console.log("✅ [VoiceController] Google Cloud TTS Client Initialized with ADC (Fallback)");
    } catch (finalErr) {
        console.error("❌ [VoiceController] Critical: TTS Client Init Failed:", finalErr.message);
    }
}

// Helper to chunk text safely for Google TTS (5000 byte limit)
const chunkText = (text, maxLength = 2500) => {
    if (!text) return [];
    const chunks = [];
    let currentPos = 0;
    while (currentPos < text.length) {
        let end = currentPos + maxLength;
        if (end < text.length) {
            // Try to break at a space to avoid cutting words
            const lastSpace = text.lastIndexOf(' ', end);
            if (lastSpace > currentPos) {
                end = lastSpace;
            }
        }
        chunks.push(text.substring(currentPos, end).trim());
        currentPos = end;
    }
    return chunks.filter(c => c.length > 0);
};

// Generic synthesizer that handles chunks
const synthesizeChunks = async (chunks, languageCode, voiceName, gender, isNarrative = false) => {
    const audioBuffers = [];
    const BATCH_SIZE = 12;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(chunk => {
            const request = {
                input: { text: chunk },
                voice: { languageCode, name: voiceName, ssmlGender: gender },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: isNarrative ? 0.92 : 1.0,
                    pitch: 0.0,
                    volumeGainDb: 1.5
                },
            };
            return client.synthesizeSpeech(request).then(([response]) => {
                let data = response.audioContent;
                return Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
            });
        });

        const results = await Promise.all(batchPromises);
        audioBuffers.push(...results);
    }
    return Buffer.concat(audioBuffers);
};

export const synthesizeSpeech = async (req, res) => {
    if (!client) {
        return res.status(403).json({ error: 'Google Cloud TTS not configured' });
    }
    try {
        const { text, languageCode = 'en-US', gender = 'FEMALE', tone } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        // Pre-processing for natural pronunciation
        let processedText = text
            .replace(/[,.-]/g, " ")
            .replace(/\btm\b/gi, "tum")
            .replace(/\bkkrh\b/gi, "kya kar rahe ho")
            .replace(/\bclg\b/gi, "college")
            .replace(/\bplz\b/gi, "please")
            .replace(/\s+/g, " ")
            .trim();

        const voiceMap = {
            'hi-IN': { 'FEMALE': 'hi-IN-Neural2-A', 'MALE': 'hi-IN-Neural2-B' },
            'en-US': { 'FEMALE': 'en-US-Journey-F', 'MALE': 'en-US-Journey-D' },
            'en-IN': { 'FEMALE': 'en-IN-Neural2-A', 'MALE': 'en-IN-Neural2-B' }
        };

        let voiceName = voiceMap[languageCode]?.[gender] || `${languageCode}-Neural2-${gender === 'MALE' ? 'D' : 'A'}`;
        const isNarrative = tone === 'narrative' || (tone !== 'conversational' && processedText.length > 600);

        const chunks = chunkText(processedText, 2500);
        console.log(`📤 [VoiceController] Synthesizing ${chunks.length} chunks... narrative=${isNarrative}`);

        const audioData = await synthesizeChunks(chunks, languageCode, voiceName, gender, isNarrative);

        // Deduct Credits
        await incrementUsage(req);

        res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioData.length });
        res.send(audioData);
    } catch (error) {
        console.error('❌ [VoiceController] ERROR:', error.message);
        res.status(500).json({ error: 'Failed to synthesize speech', details: error.message });
    }
};

export const synthesizeFile = async (req, res) => {
    if (!client) return res.status(403).json({ error: 'Google Cloud TTS not configured' });

    try {
        const { fileData, mimeType, languageCode: reqLangCode = 'en-US', gender = 'FEMALE', introText } = req.body;
        if (!fileData && !introText) return res.status(400).json({ error: 'Input required' });

        let textToRead = "";
        if (fileData) {
            const buffer = Buffer.from(fileData, 'base64');
            console.log(`📦 [SynthesizeFile] Processing ${buffer.length} bytes...`);
            try {
                if (mimeType === 'application/pdf') {
                    const data = await pdfParse(buffer);
                    textToRead = data.text;
                    if (!textToRead || textToRead.trim().length < 5) {
                        const { data: { text: ocrText } } = await Tesseract.recognize(buffer, 'eng+hin');
                        textToRead = ocrText;
                    }
                } else if (mimeType.includes('word') || mimeType.endsWith('.docx')) {
                    try { textToRead = await officeParser.parseOfficeAsync(buffer); }
                    catch { const res = await mammoth.extractRawText({ buffer }); textToRead = res.value; }
                } else if (mimeType.startsWith('image/')) {
                    const { data: { text } } = await Tesseract.recognize(buffer, 'eng+hin');
                    textToRead = text;
                } else if (mimeType.startsWith('text/')) {
                    textToRead = buffer.toString('utf-8');
                }
            } catch (e) {
                console.error("Extraction error:", e);
                return res.status(500).json({ error: 'Text extraction failed', details: e.message });
            }
        }

        if (introText) textToRead = `${introText}\n\n${textToRead}`;

        textToRead = textToRead
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
            .replace(/™/g, " tm ")
            .replace(/\btm\b/gi, "tum")
            .replace(/\s+/g, " ")
            .trim();

        if (textToRead.length < 2) return res.status(400).json({ error: 'No readable text found' });

        const isHindi = (textToRead.match(/[\u0900-\u097F]/g) || []).length > 20;
        const chunks = chunkText(textToRead, isHindi ? 1200 : 2500);
        const langCode = isHindi ? 'hi-IN' : 'en-US';
        const voiceName = isHindi ? 'hi-IN-Neural2-D' : (gender === 'MALE' ? 'en-US-Neural2-D' : 'en-US-Neural2-F');

        console.log(`📖 [VoiceController] File Synthesis: ${chunks.length} chunks, ${textToRead.length} chars`);
        const audioData = await synthesizeChunks(chunks, langCode, voiceName, gender, true);

        // Deduct Credits
        await incrementUsage(req);

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioData.length,
            'X-Text-Length': textToRead.length.toString(),
            'X-Chunk-Count': chunks.length.toString(),
            'Access-Control-Expose-Headers': 'X-Text-Length, X-Chunk-Count'
        });
        res.send(audioData);
    } catch (error) {
        console.error('❌ [VoiceController] Critical Failure:', error.message);
        res.status(500).json({ error: 'Voice conversion failed', details: error.message });
    }
};
