require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const OpenAI = require("openai");

const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI(); //automatically gets api key from .env as OPENAI_API_KEY
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false);
    }
  }
});

app.use(cors());
app.use(express.json());


app.post('/analyze-sign', upload.single('image'), async (req, res) => {
  console.log("trying to process image");
  try {
    if (!req.file) {
      throw new Error('No image file provided');
    }

    const imageBuffer = req.file.buffer;
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .toFormat('png')
      .toBuffer();

    const base64Image = resizedImageBuffer.toString('base64');

    const {dayOfWeek, date, time} = req.body;
    
    const prompt = `
    Today is ${dayOfWeek} ${date}. ${time ? `The current time is ${time}.` : ''}
    Is parking allowed according to this sign given the current date and time? 
    REMEMBER TO CONSIDER THE CURRENT TIME, DATE, AND DAY OF THE WEEK.

    Please provide a brief explanation no longer than 2 sentences. 

    Your response should follow these guidelines:
      If parking is allowed for any amount of time then you answer should be 'Parking IS allowed for ***INSERT TIME LIMIT*** on ${dayOfWeek} ${date} at ${time}.'
      Otherwise if you cannot park there you should respond Parking IS NOT allowed on ${dayOfWeek} ${date} at ${time}.
      State how long parking is allowed for (if there is a restriction)
      Do not say 'according to the sign' as it is implied. 
      Assume the driver does not have any of the permits mentioned. 
      If you do not see a parking sign, simply respond 'No parking sign identified. Please try again'.

    Assume that outside the enforced hours of restrictions such as 2 hour parking, users may park as long as they want.
    So for example if from 9am-6pm there is 2 hour parking, users can park as long as they want if it is 7pm.

    Some examples of acceptable responses are:

      Parking IS allowed for 2 hours on ****time and date****. 2 hour parking is enforced from ****time range****
      Parking is NOT allowed on ****time and date**** as there is street cleaning today.
      Parking is NOT allowed in this area.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ],
        },
      ],
    });

    console.log("response", response);
    res.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing image' });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



