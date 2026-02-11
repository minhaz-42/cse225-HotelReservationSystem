/**
 * Admin panel — stats, reservation management, AI report.
 */
(async () => {
  if (!Auth.requireAdmin()) return;
  await Promise.all([loadStats(), loadReservations()]);
})();

/* ─── Stats ──────────────────────────────────────── */
async function loadStats() {
  try {
    const s = await API.get('/api/admin/stats');
    document.getElementById('stat-total').textContent     = s.total;
    document.getElementById('stat-pending').textContent    = s.pending;
    document.getElementById('stat-confirmed').textContent  = s.confirmed;
    document.getElementById('stat-revenue').textContent    = `₱${Number(s.revenue).toLocaleString()}`;

    // Revenue bars
    const barsEl = document.getElementById('revenue-bars');
    const maxRev = Math.max(...s.byRoom.map(r => r.revenue), 1);
    barsEl.innerHTML = s.byRoom.length
      ? s.byRoom.map(r => `
        <div class="revenue-bar-group">
          <div class="revenue-bar-label">
            <span style="color: var(--text-primary);">${r.name}</span>
            <span style="color: var(--text-secondary);">${r.bookings} bookings · ₱${Number(r.revenue).toLocaleString()}</span>
          </div>
          <div class="revenue-bar-track">
            <div class="revenue-bar-fill" style="width:${(r.revenue / maxRev * 100).toFixed(1)}%"></div>
          </div>
        </div>`).join('')
      : '<p style="color: var(--text-secondary); font-size: 0.85rem;">No confirmed revenue data yet.</p>';
  } catch (err) {
    console.error(err);
  }
}

/* ─── Reservations ───────────────────────────────── */
async function loadReservations() {
  try {
    const status = document.getElementById('status-filter').value;
    const url = status ? `/api/admin/reservations?status=${status}` : '/api/admin/reservations';
    const data = await API.get(url);
    const tbody = document.getElementById('admin-res-body');

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 40px; color: var(--text-secondary);">No reservations found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(r => `
      <tr>
        <td class="mono">${r.reference_number}</td>
        <td>${r.username}</td>
        <td>${r.room_name}</td>
        <td>${r.check_in}</td>
        <td>${r.check_out}</td>
        <td>₱${Number(r.total_amount).toLocaleString()}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
        <td>
          ${r.status === 'pending' ? `<button onclick="confirmRes(${r.id})" class="btn-success" style="margin-right: 6px;">Confirm</button>` : ''}
          ${r.status !== 'cancelled' ? `<button onclick="deleteRes(${r.id})" class="btn-danger">Cancel</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function confirmRes(id) {
  if (!confirm('Confirm this reservation?')) return;
  try { await API.patch(`/api/admin/reservations/${id}/confirm`); loadReservations(); loadStats(); }
  catch (err) { alert(err.message); }
}

async function deleteRes(id) {
  if (!confirm('Cancel / delete this reservation?')) return;
  try { await API.del(`/api/admin/reservations/${id}`); loadReservations(); loadStats(); }
  catch (err) { alert(err.message); }
}

/* ─── AI Report ──────────────────────────────────── */
async function generateReport() {
  const btn = document.getElementById('report-btn');
  const out = document.getElementById('report-output');
  const prompt = document.getElementById('report-prompt').value.trim();

  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span>';
  out.classList.add('hidden');

  try {
    const res = await API.post('/api/llm/analytics-report', { prompt });
    out.textContent = res.report;
    out.classList.remove('hidden');
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
    out.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate';
  }
}
