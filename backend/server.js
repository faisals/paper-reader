const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);
    res.json({ text: data.text });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).send('Error parsing PDF');
  } finally {
    // Clean up: delete the uploaded file
    fs.unlinkSync(req.file.path);
  }
});

app.post('/simplify', async (req, res) => {
  const { text, context, level } = req.body;
  if (!text) {
    return res.status(400).send('No text provided');
  }

  let prompt;
  switch (level) {
    case 'easy':
      prompt = "Please simplify the following academic text for a high school student. Use straightforward and clear language, breaking down any complex terms and concepts into easily understandable explanations. Ensure that the essence of the content is retained, but presented in a way that a high school student with basic knowledge can comprehend without any prior expertise:";
      break;
    case 'medium':
      prompt = "Please simplify the following academic text for an undergraduate student. Maintain some of the technical language appropriate for this level, but ensure that complex concepts are thoroughly explained. Use analogies and real-world examples to illustrate key points, and include diagrams where applicable to visualize complex ideas. Additionally, pose reflective questions at the end to encourage deeper understanding and engagement with the material. The goal is to strike a balance between preserving necessary technical terms and making the content accessible and engaging for a student with foundational knowledge in the subject. This version incorporates various learning tools to help students grasp the material more effectively: Analogies: Simplify complex concepts by comparing them to familiar situations or ideas.Real-world examples: Provide context and practical applications to make the content more relatable.Diagrams: Use visuals to represent complex ideas, aiding in comprehension.Reflective questions: Encourage students to think critically about the material and deepen their understanding.By integrating these elements, the prompt becomes a more comprehensive guide for simplifying academic texts while enhancing the learning experience for undergraduate students:";
      break;
    case 'advanced':
      prompt = "Please simplify the following academic text for a graduate student. Retain most of the technical language appropriate for this level, but focus on clarifying the very complex ideas and concepts. The aim is to make the text more accessible to a graduate student who has a solid background in the subject, ensuring that they can grasp intricate details and nuanced arguments without losing the original depth and rigor of the content:";
      break;
    default:
      prompt = "Simplify this academic text while maintaining its key points and academic integrity:";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {"role": "system", "content": "You are a highly knowledgeable assistant specializing in simplifying academic text for various audiences. Your goal is to make complex information accessible and understandable, while retaining the essential details and context required by the audience."},
        {"role": "user", "content": `${context}\n\n${prompt}\n\n${text}`}
      ],
      max_tokens: 500  // Adjust as needed
    });

    res.json({ simplifiedText: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).send('Error simplifying text');
  }
});

function startServer(port) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

const PORT = process.env.PORT || 5000;
startServer(PORT);