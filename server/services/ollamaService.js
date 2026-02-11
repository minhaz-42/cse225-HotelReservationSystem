/**
 * @module services/ollamaService
 *
 * Ollama LLM / VLM integration.
 *
 * Capabilities
 * ────────────
 *   1. AI Booking Assistant   – parse natural-language booking requests
 *   2. Smart Recommendation   – suggest rooms based on preferences
 *   3. Admin Analytics Report – generate natural-language reports
 *   4. VLM Room Image Analysis (optional, requires LLaVA)
 *   5. General Chat
 */
const env              = require('../config/env');
const analyticsService = require('./analyticsService');
const roomService      = require('./roomService');

/* ─── low-level Ollama HTTP call ─────────────────────────── */

/**
 * POST to Ollama /api/generate.
 * @param {string}   prompt
 * @param {object}   [opts]
 * @param {string}   [opts.model]    Override model name.
 * @param {string[]} [opts.images]   Base-64 images (VLM).
 * @returns {Promise<string>}
 */
async function callOllama(prompt, { model, images } = {}) {
  const url  = `${env.ollama.baseUrl}/api/generate`;
  const body = { model: model || env.ollama.model, prompt, stream: false };
  if (images?.length) body.images = images;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`Ollama ${res.status}: ${text}`), { status: 502 });
  }

  const data = await res.json();
  return data.response || '';
}

/* ─── 1. AI Booking Assistant ────────────────────────────── */

async function parseBookingIntent(userMessage) {
  const rooms     = roomService.listRooms();
  const roomNames = rooms.map(r => r.name).join(', ');

  const prompt = `You are a hotel booking assistant. Extract structured booking info from the user message.
Available room types: ${roomNames}.

Return ONLY a valid JSON object:
{
  "room_type": "<room type or null>",
  "guests": <number or null>,
  "check_in": "<YYYY-MM-DD or null>",
  "check_out": "<YYYY-MM-DD or null>",
  "budget": <number or null>,
  "notes": "<special requests or null>"
}
Set unknown fields to null. No text outside the JSON.

User message: ${userMessage}`;

  const raw = await callOllama(prompt);
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch { /* ignore */ }
  return { raw, parsed: false };
}

/* ─── 2. Smart Recommendation ────────────────────────────── */

async function recommendRoom({ guests, budget, checkIn, checkOut, preferences }) {
  const available = roomService.checkAllAvailability(
    checkIn  || new Date().toISOString().slice(0, 10),
    checkOut || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );

  const info = available.map(r =>
    `${r.name}: cap ${r.capacity}, ${r.price_per_night}/night, avail ${r.availableRooms}, ` +
    `rating ${r.rating}, amenities: ${r.amenities.join(', ')}`
  ).join('\n');

  const prompt = `You are a hotel concierge AI. Recommend the best room in 2-3 sentences.

Guest:
- Guests: ${guests || '?'}
- Budget: ${budget ? `$${budget}/night` : '?'}
- Check-in: ${checkIn || 'flexible'}
- Check-out: ${checkOut || 'flexible'}
- Preferences: ${preferences || 'none'}

Rooms:
${info}

Recommendation:`;

  return callOllama(prompt);
}

/* ─── 3. Admin Analytics Report ──────────────────────────── */

async function generateAnalyticsReport(customPrompt) {
  const summary = analyticsService.buildSummaryText();
  const prompt = `You are a hotel business analyst AI. Write a concise, insightful report from the data below. Highlight trends, concerns, and recommendations.

Data:
${summary}

${customPrompt ? `Additional request: ${customPrompt}` : ''}

Report:`;

  return callOllama(prompt);
}

/* ─── 4. VLM Room Image Analysis ─────────────────────────── */

async function analyseRoomImage(base64Image, roomMeta = {}) {
  const prompt = `Describe this hotel room image. List visible amenities, furniture, estimated room size, and a quality rating (1-5).
${roomMeta.name ? `\nListing: ${roomMeta.name}\nListed amenities: ${(roomMeta.amenities || []).join(', ')}` : ''}

Provide: 1) Description 2) Amenities 3) Rating 4) Consistency check`;

  const description = await callOllama(prompt, {
    model:  env.ollama.vlmModel,
    images: [base64Image],
  });
  return { description };
}

/* ─── 5. General Chat ────────────────────────────────────── */

async function chat(message, context = '') {
  const rooms    = roomService.listRooms();
  const roomInfo = rooms.map(r =>
    `${r.name}: cap ${r.capacity}, ${r.price_per_night}/night, amenities: ${r.amenities.join(', ')}`
  ).join('\n');

  const prompt = `You are a helpful hotel reservation assistant. Answer concisely.

Hotel rooms:
${roomInfo}

${context ? `Context: ${context}\n` : ''}User: ${message}
Assistant:`;

  return callOllama(prompt);
}

module.exports = {
  callOllama,
  parseBookingIntent,
  recommendRoom,
  generateAnalyticsReport,
  analyseRoomImage,
  chat,
};
