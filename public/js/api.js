/**
 * API helper — handles all HTTP calls with auth headers.
 */
const API = {
  _base: '',

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async _request(method, url, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this._base + url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  get(url)         { return this._request('GET', url); },
  post(url, body)  { return this._request('POST', url, body); },
  patch(url, body) { return this._request('PATCH', url, body); },
  put(url, body)   { return this._request('PUT', url, body); },
  del(url)         { return this._request('DELETE', url); },
};
