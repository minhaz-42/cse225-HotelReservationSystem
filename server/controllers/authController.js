/**
 * @module controllers/authController
 * Handles register, login and profile requests.
 */
const authService = require('../services/authService');
const User        = require('../models/User');
const { logActivity } = require('../middleware/logger');
const { isValidEmail } = require('../middleware/validation');

const authController = {
  async register(req, res) {
    try {
      const { username, email, password, name, contactNumber } = req.body;

      if (!username || !email || !password || !name) {
        return res.status(400).json({ error: 'username, email, password and name are required' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const { user, token } = await authService.register({ username, email, password, name, contactNumber });
      logActivity(user.id, 'REGISTER', `User ${username} registered`, req.ip);
      res.status(201).json({ user, token });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
      }

      const { user, token } = await authService.login(username, password);
      logActivity(user.id, 'LOGIN', `User ${username} logged in`, req.ip);
      res.json({ user, token });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  async getProfile(req, res) {
    try {
      const user = User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProfile(req, res) {
    try {
      const { email, name, contactNumber } = req.body;
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      const user = User.updateProfile(req.user.id, { email, name, contactNumber });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword and newPassword are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      logActivity(req.user.id, 'PASSWORD_CHANGE', '', req.ip);
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },
};

module.exports = authController;
