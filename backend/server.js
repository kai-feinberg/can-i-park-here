require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const OpenAI = require("openai");

const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI(); //automatically gets api key from .env as OPENAI_API_KEY

app.use(cors());
app.use(express.json());

app.post('/analyze-sign', upload.single('image'), async (req, res) => {
  // Your image processing and OpenAI API call logic here
  try{
    // const imageBuffer = req.file.buffer;
    // const resizedImageBuffer = await sharp(imageBuffer).resize(800, 600).toFormat('jpeg').toBuffer();
    // const base64Image = resizedImageBuffer.toString('base64');
    const imageBuffer = req.file ? req.file.buffer : fs.readFileSync(path.join(__dirname, 'parking_sign.jpeg'));
    const resizedImageBuffer = await sharp(imageBuffer).resize(800, 600).toFormat('jpeg').toBuffer();
    const base64Image = resizedImageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Is parking allowed according to this sign? Please provide a brief explanation." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
    });

    console.log("response", response);
    console.log("response.data.choices[0].message.content", response.choices[0].message.content);
    res.json({ analysis: response.choices[0].message.content });
  }

  catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



