const express = require('express');
const cors = require('cors'); // Import the cors package
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize CORS middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Allow requests from this origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Initialize file upload middleware
const upload = multer({ dest: 'uploads/' });

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Get the uploaded file's path
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Prepare file data for Gemini API
    const filePart = {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    // Use Gemini API to process the document
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([filePart, { text: 'Can you summarize this document as a bulleted list?' }]);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

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
