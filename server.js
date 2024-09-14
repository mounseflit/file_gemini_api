const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleAIFileManager, GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize CORS middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Adjust this to match your frontend's origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Initialize multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Google AI File Manager and GenerativeAI with your API key
const fileManager = new GoogleAIFileManager(process.env.API_KEY);
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Upload file to File API from memory buffer
    const uploadResponse = await fileManager.uploadFile(req.file.originalname, {
      mimeType: 'application/pdf',
      displayName: req.file.originalname,
      data: req.file.buffer.toString('base64') // Convert buffer to base64
    });

    // Retrieve the file URI from the upload response
    const fileUri = uploadResponse.file.uri;

    // Use Gemini API to process the document
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: 'application/pdf',
          fileUri: fileUri
        }
      },
      { text: 'Can you summarize this document as a bulleted list?' }
    ]);

    // Respond with the summary
    res.json({ summary: result.response.text() });

  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
