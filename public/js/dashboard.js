/**
 * Dashboard — reservations list & profile.
 */
(async () => {
  if (!Auth.requireAuth()) return;

  const user = Auth.getUser();
  const greeting = document.getElementById('user-greeting');
  if (greeting && user) greeting.textContent = `Hi, ${user.name || user.username}`;

  // ── Load reservations ────────────────────────────
  try {
    const reservations = await API.get('/api/reservations');
    const tbody = document.getElementById('reservations-body');
    const countEl = document.getElementById('res-count');
    countEl.textContent = reservations.length;

    if (!reservations.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 40px; color: var(--text-secondary);">
        No reservations yet. <a href="/booking.html" style="color: var(--primary-light);">Book your first room →</a>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = reservations.map(r => `
      <tr>
        <td class="mono">${r.reference_number}</td>
        <td>${r.room_name}</td>
        <td>${r.check_in}</td>
        <td>${r.check_out}</td>
        <td>₱${Number(r.total_amount).toLocaleString()}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
        <td>
          ${r.status === 'pending'
            ? `<button onclick="cancelRes(${r.id})" class="btn-danger">Cancel</button>`
            : '<span style="color: var(--text-secondary);">—</span>'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }

  // ── Load profile ─────────────────────────────────
  try {
    const profile = await API.get('/api/auth/profile');
    document.getElementById('profile-info').innerHTML = `
      <p><strong>Name:</strong> ${profile.name}</p>
      <p><strong>Email:</strong> ${profile.email}</p>
      <p><strong>Contact:</strong> ${profile.contact_number || '—'}</p>
      <p><strong>Username:</strong> ${profile.username}</p>
      <p><strong>Role:</strong> ${profile.role}</p>
    `;
  } catch(e) { /* ignore */ }
})();

async function cancelRes(id) {
  if (!confirm('Cancel this reservation?')) return;
  try {
    await API.patch(`/api/reservations/${id}/cancel`);
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}
