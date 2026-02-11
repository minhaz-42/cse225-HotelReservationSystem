/**
 * Chat assistant — free chat + VLM image analysis.
 */
(async () => {
  if (!Auth.requireAuth()) return;
  document.getElementById('chat-form').addEventListener('submit', sendMessage);
})();

let chatContext = '';

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  appendMessage('user', message);
  input.value = '';

  const typingId = appendMessage('assistant', '⏳ Thinking…');

  try {
    const res = await API.post('/api/llm/chat', { message, context: chatContext });
    updateMessage(typingId, res.reply);
    chatContext += `\nUser: ${message}\nAssistant: ${res.reply}`;
    if (chatContext.length > 3000) chatContext = chatContext.slice(-2000);
  } catch (err) {
    updateMessage(typingId, `❌ ${err.message}`);
  }
}

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  // Remove placeholder
  const placeholder = container.querySelector('.text-center');
  if (placeholder) placeholder.remove();

  const id = 'msg-' + Date.now() + Math.random().toString(36).slice(2, 6);
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';

  const bubble = document.createElement('div');
  bubble.id = id;
  bubble.className = role === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-assistant';
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  return id;
}

function updateMessage(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

/* ─── VLM Image Analysis ─────────────────────────── */
async function analyseImage() {
  const fileInput = document.getElementById('image-input');
  if (!fileInput.files.length) { alert('Select an image first'); return; }

  const file = fileInput.files[0];
  const base64 = await fileToBase64(file);

  appendMessage('user', `[Uploaded image: ${file.name}]`);
  const typingId = appendMessage('assistant', '⏳ Analysing image with VLM…');

  try {
    const res = await API.post('/api/llm/analyse-image', { image: base64 });
    updateMessage(typingId, res.description);
  } catch (err) {
    updateMessage(typingId, `❌ ${err.message}`);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
