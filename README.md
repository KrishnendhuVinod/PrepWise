# PrepWise 🎯

**PrepWise** is an AI-powered mock interview coach. It conducts a guided,
structured mock interview — collecting your target role, experience level,
interview round, and (optionally) your resume — then asks questions one at
a time, gives structured feedback with an improved example answer after
every response, and lets you decide when to stop and see your final score.

## Features

- 🎤 Guided intake: field/role, experience level, interview round (including
  a dedicated Coding round), and job description or target role
- 📎 Optional resume upload (`.pdf` or `.docx`) — used to tailor questions
- ⚡ Streamed, real-time AI responses (no waiting for a full block of text)
- ✅ Structured feedback after every answer: strengths, a "watch out for"
  caution, and an improved example answer
- 🔁 Open-ended flow — continue or stop after every question, your choice
- 🏆 Final performance score (and a resume score, if a resume was provided),
  with a small celebration animation
- 🎨 Interview-round-themed chat backgrounds and a responsive UI for both
  desktop and mobile

## Tech Stack

| Layer            | Technology                                             |
|------------------|---------------------------------------------------------|
| Frontend         | HTML, CSS, JavaScript (single-page app, no framework)   |
| Backend          | Node.js + Express                                       |
| LLM provider     | Google Gemini API (`gemini-flash-lite-latest`)          |
| Resume parsing   | `pdf-parse` (PDF), `mammoth` (DOCX), `multer` (uploads) |
| Containerization | Docker                                                  |
| Deployment       | AWS Elastic Beanstalk + Amazon CloudFront (HTTPS)       |

## Project Structure

```
PreWise/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env              # not committed — holds GEMINI_API_KEY
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── Dockerfile
├── .dockerignore
└── README.md
```

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org) (v22 or later recommended)
- A free [Gemini API key](https://aistudio.google.com/apikey)

### Setup

1. Clone the repository and move into it:
   ```bash
   git clone <your-repo-url>
   cd PreWise/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file inside `backend/` with your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_key_here
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Open your browser to:
   ```
   http://localhost:3000
   ```

## Running with Docker

From the project root (where the `Dockerfile` lives):

```bash
docker build -t prepwise .
docker run -p 3000:3000 --env-file backend/.env prepwise
```

Then open `http://localhost:3000`.

## Deployment

The app is deployed on **AWS Elastic Beanstalk** (Docker platform,
single-instance `t3.micro`), with **Amazon CloudFront** in front to provide
a public HTTPS endpoint. The Gemini API key is injected as an environment
variable directly in the Elastic Beanstalk environment — it is never
present in the Docker image or committed to version control.



## Security Notes

- API keys are never hardcoded or committed — they live only in `.env`
  locally (excluded via `.gitignore`) and as environment variables in the
  cloud environment.
- No database is used; the app is stateless across sessions by design.

## License

This project was built for educational/personal portfolio purposes.
