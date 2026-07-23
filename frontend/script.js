const homeScreen = document.getElementById('home-screen');
const startBtn = document.getElementById('start-btn');
const intakeScreen = document.getElementById('intake-screen');
const intakeForm = document.getElementById('intake-form');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const decisionButtons = document.getElementById('decision-buttons');
const continueBtn = document.getElementById('continue-btn');
const stopBtn = document.getElementById('stop-btn');

const CHAT_URL = '/chat';
const RESUME_URL = '/extract-resume';
const themeMap = {
  'Coding round': 'coding',
  'Screening / HR round': 'hr',
  'Technical round': 'technical',
  'Managerial round': 'managerial',
  'Final round': 'final',
};

function launchConfetti() {
  const container = document.createElement('div');
  container.classList.add('confetti-container');
  const emojis = ['🎉', '✨', '🏆', '🎊', '⭐'];
  for (let i = 0; i < 16; i++) {
    const piece = document.createElement('span');
    piece.classList.add('confetti-piece');
    piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    container.appendChild(piece);
  }
  chatMessages.appendChild(container);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  setTimeout(() => container.remove(), 2200);
}

let profile = null;
let history = [];

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);

    if (text.includes('FINAL SCORE:')) {
        msg.classList.add('score');
    }

    if (sender === "bot") {
        msg.innerHTML = formatBotResponse(text);
    } else {
        msg.textContent = text;
    }

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msg;
}

function formatBotResponse(text) {

    return text

    .replace(/\n/g,"<br>")

    .replace("WELCOME","<h2>👋 Welcome</h2>")

    .replace("QUESTION","<h2>🎯 Interview Question</h2>")

    .replace("FEEDBACK","<h2>✅ Feedback</h2>")

    .replace("WATCH_OUT","<h2>⚠ Watch Out</h2>")

    .replace("IMPROVED_ANSWER","<h2>💡 Improved Answer</h2>")

    .replace("FINAL_SCORE","<h2>🏆 Final Score</h2>")

    .replace("PERFORMANCE_SUMMARY","<h2>📈 Performance Summary</h2>")

    .replace("AREAS_TO_IMPROVE","<h2>📚 Areas to Improve</h2>")
    .replace("RESUME_SCORE","<h2>📄 Resume Score</h2>")
    .replace("RESUME_FEEDBACK","<h2>📝 Resume Feedback</h2>");
}

async function sendToBackend() {
  const typingEl = document.createElement('div');
  typingEl.classList.add('typing-indicator');
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  let botMsgElement = null;
  let botText = '';

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, history }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!botMsgElement) {
        typingEl.remove();
        botMsgElement = addMessage('', 'bot');
      }
      botText += decoder.decode(value, { stream: true });
      botMsgElement.innerHTML = formatBotResponse(botText);
      if (botText.includes('FINAL SCORE:')) botMsgElement.classList.add('score');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    history.push({ sender: 'bot', text: botText });
    console.log(botText);

    if (
    botText.includes("🏆 Final Score") ||
    botText.includes("FINAL_SCORE") ||
    botText.includes("Final Score")
    ) {
    chatForm.classList.add('hidden');
    decisionButtons.classList.add('hidden');
    launchConfetti();
    }
    else if (
    botText.includes("continue with another question") ||
    botText.includes("Continue Interview")
    ) {
    chatForm.classList.add('hidden');
    decisionButtons.classList.remove('hidden');
    }
    else {
    chatForm.classList.remove('hidden');
    decisionButtons.classList.add('hidden');
    }
} catch (error) {
    typingEl.remove();
    addMessage('Error: could not reach PrepWise backend.', 'bot');
    console.error(error);
  }
}

startBtn.addEventListener('click', () => {
  homeScreen.classList.add('hidden');
  intakeScreen.classList.remove('hidden');
});

intakeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const field = document.getElementById('field-input').value.trim();
  const experience = document.getElementById('experience-input').value;
  const round = document.getElementById('round-input').value;
  chatMessages.dataset.theme = themeMap[round] || 'default';
  const jdOrRole = document.getElementById('jd-input').value.trim();
  const resumeFile = document.getElementById('resume-input').files[0];

  let resumeText = '';
  if (resumeFile) {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    try {
      const res = await fetch(RESUME_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) resumeText = data.text;
    } catch (err) {
      console.error('Resume parsing failed', err);
    }
  }

  profile = { field, experience, round, jdOrRole, resumeText };

  intakeScreen.classList.add('hidden');
  chatHeader.classList.remove('hidden');
  chatMessages.classList.remove('hidden');

  history.push({ sender: 'user', text: "Let's begin. Please ask your first interview question." });
  await sendToBackend();
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, 'user');
  history.push({ sender: 'user', text: userText });
  input.value = '';

  await sendToBackend();
});

continueBtn.addEventListener('click', async () => {
  history.push({ sender: 'user', text: "I'd like to continue with another question." });
  decisionButtons.classList.add('hidden');
  await sendToBackend();
});

stopBtn.addEventListener('click', async () => {
  history.push({ sender: 'user', text: "I'd like to stop here and see my score." });
  decisionButtons.classList.add('hidden');
  await sendToBackend();
});
 function renderScoreCard(container, data) {

    container.innerHTML = `
        <div class="score-card">

            <div class="card">
                <h3>⭐ Overall Score</h3>
                <div class="score">${data.overallScore}/10</div>
            </div>

            <div class="card">
                <h3>✅ Strengths</h3>
                <ul>
                    ${data.strengths.map(s => `<li>${s}</li>`).join("")}
                </ul>
            </div>

            <div class="card">
                <h3>📈 Areas to Improve</h3>
                <ul>
                    ${data.improvements.map(s => `<li>${s}</li>`).join("")}
                </ul>
            </div>

            <div class="card">
                <h3>💡 Suggested Answer</h3>
                <p>${data.suggestedAnswer}</p>
            </div>
            <div class="card">
                <h3>📄 Resume Score</h3>
            <div class="score">${data.resumeScore}/10</div>

              <ul>
              ${data.resumeFeedback
              .map(item => `<li>${item}</li>`)
              .join("")}
              </ul>
            </div>

        </div>
    `;
}