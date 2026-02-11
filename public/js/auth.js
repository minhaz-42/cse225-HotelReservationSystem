/**
 * Auth helpers — token / user management.
 */
const Auth = {
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    const user = this.getUser();
    if (!user || user.role !== 'admin') {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
};
