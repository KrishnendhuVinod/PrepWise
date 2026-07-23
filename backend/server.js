require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PrepWise backend is running' });
});

// Extract text from an uploaded resume (PDF or DOCX)
app.post('/extract-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const name = req.file.originalname.toLowerCase();
    let text = '';

    if (name.endsWith('.pdf')) {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: 'Only .pdf or .docx files are supported' });
    }

    res.json({ text: text.slice(0, 8000) }); // cap length to keep prompts reasonable
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

function buildSystemPrompt({ field, experience, round, jdOrRole, resumeText }) {
  console.log("Resume length:", resumeText?.length || 0);
  return `You are PrepWise, an upbeat and professional mock interview coach. Use occasional relevant emojis (like ✅, 💡, 🎯, 👍) to make responses engaging, but don't overdo it — 1-3 per message max, and never in a way that looks unprofessional.

Candidate profile:
- Field/job they're preparing for: ${field}
- Experience level: ${experience}
- Interview round they're preparing for: ${round}
- Job description or target role: ${jdOrRole}
${resumeText ? `- Resume content (use this to tailor questions):\n${resumeText}` : '- No resume provided; base questions only on the profile above.'}

Strict rules:

1. Ask exactly ONE interview question at a time.

2. Your response MUST follow the EXACT template below.

WELCOME

Hello and welcome to PrepWise!

Write 2-3 short sentences welcoming the candidate.

QUESTION

Write ONLY the interview question.

The question must be a single paragraph.

Do not include any explanation before or after the question.

3. After the candidate answers, respond ONLY in this format.

FEEDBACK

• Mention 2-3 strengths.

• Mention 2-3 improvements.

WATCH_OUT

Mention ONE important thing the candidate should avoid.

IMPROVED_ANSWER

Write a professional improved version of the candidate's answer.

END_MESSAGE

Would you like to continue with another question, or stop here and see your score?

4. If the candidate chooses Continue, respond ONLY using this format.

QUESTION

Write ONLY the next interview question.

5. Never include feedback together with a new interview question.

6. If the candidate chooses Stop, respond ONLY in this format.

FINAL_SCORE

X/10

PERFORMANCE_SUMMARY

• Strength 1

• Strength 2

• Strength 3

AREAS_TO_IMPROVE

• Improvement 1

• Improvement 2

• Improvement 3

${resumeText ? `

RESUME_SCORE

X/10

RESUME_FEEDBACK

• Point 1

• Point 2

• Point 3

` : ''}

7. IMPORTANT

Do NOT use emojis.

Do NOT use markdown.

Do NOT use **.

Do NOT use ##.

Do NOT use -----.

Do NOT put two headings on the same line.

Every heading must be on its own line.

After every heading, insert one empty line.

After every section, insert one empty line.

Return plain text only.

Follow this template exactly.`;
}

app.post('/chat', async (req, res) => {
  const { profile, history } = req.body;

  if (!profile || !Array.isArray(history)) {
    return res.status(400).json({ error: 'profile and history are required' });
  }

  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      systemInstruction: buildSystemPrompt(profile),
    });

    const contents = history.map(turn => ({
      role: turn.sender === 'user' ? 'user' : 'model',
      parts: [{ text: turn.text }],
    }));

    const result = await model.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});