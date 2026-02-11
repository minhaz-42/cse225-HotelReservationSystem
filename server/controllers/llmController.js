/**
 * @module controllers/llmController
 * Ollama-powered AI endpoints.
 */
const ollamaService = require('../services/ollamaService');
const { logActivity } = require('../middleware/logger');

const llmController = {
  /** POST /api/llm/parse-booking */
  async parseBooking(req, res) {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'message is required' });

      const intent = await ollamaService.parseBookingIntent(message);
      logActivity(req.user.id, 'LLM_PARSE_BOOKING', message.slice(0, 200), req.ip);
      res.json(intent);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** POST /api/llm/recommend */
  async recommend(req, res) {
    try {
      const recommendation = await ollamaService.recommendRoom(req.body);
      res.json({ recommendation });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** POST /api/llm/analytics-report  (admin) */
  async analyticsReport(req, res) {
    try {
      const report = await ollamaService.generateAnalyticsReport(req.body.prompt);
      logActivity(req.user.id, 'LLM_ANALYTICS_REPORT', '', req.ip);
      res.json({ report });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** POST /api/llm/analyse-image  (VLM) */
  async analyseImage(req, res) {
    try {
      const { image, roomMeta } = req.body;
      if (!image) return res.status(400).json({ error: 'base64 image is required' });

      const result = await ollamaService.analyseRoomImage(image, roomMeta || {});
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** POST /api/llm/chat */
  async chat(req, res) {
    try {
      const { message, context } = req.body;
      if (!message) return res.status(400).json({ error: 'message is required' });

      const reply = await ollamaService.chat(message, context);
      res.json({ reply });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },
};

module.exports = llmController;
