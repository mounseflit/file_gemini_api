// Import required modules
import express from 'express';
import multer from 'multer';
import { GoogleAIFileManager, GoogleGenerativeAI } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables (API_KEY)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Google AI File Manager and Generative AI models
const fileManager = new GoogleAIFileManager(process.env.API_KEY);
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Route for uploading and processing the document
app.post('/upload', upload.single('document'), async (req, res) => {
  try {
    // File upload handling
    const { path, originalname, mimetype } = req.file;

    // Upload the PDF to Gemini File API
    const uploadResponse = await fileManager.uploadFile(path, {
      mimeType: mimetype,
      displayName: originalname,
    });

    // Store file URI from the upload response
    const fileUri = uploadResponse.file.uri;

    // Use the fileUri to prompt the Gemini API for content generation
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: mimetype,
          fileUri: fileUri,
        },
      },
      { text: 'Can you summarize this document?' },
    ]);

    // Delete local file after upload
    fs.unlinkSync(path);

    // Return the generated summary
    res.json({ summary: result.response.text() });
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process the document' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
