/**
 * Booking page — room listing, availability, AI parse, booking.
 */
let allRooms = [];

function getRoomClass(name) {
  const n = name.toLowerCase();
  if (n.includes('standard'))  return 'room-standard';
  if (n.includes('deluxe'))    return 'room-deluxe';
  if (n.includes('suite'))     return 'room-suite';
  if (n.includes('executive')) return 'room-executive';
  if (n.includes('penthouse')) return 'room-penthouse';
  return 'room-default';
}

function getRoomEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('standard'))  return '🛏️';
  if (n.includes('deluxe'))    return '🌟';
  if (n.includes('suite'))     return '🏠';
  if (n.includes('executive')) return '💼';
  if (n.includes('penthouse')) return '👑';
  return '🏨';
}

(async () => {
  if (!Auth.requireAuth()) return;
  await loadRooms();

  // Set default dates
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
  document.getElementById('check-in').value = tomorrow;
  document.getElementById('check-out').value = dayAfter;

  document.getElementById('check-in').addEventListener('change', checkAvail);
  document.getElementById('check-out').addEventListener('change', checkAvail);
  document.getElementById('room-select').addEventListener('change', checkAvail);
  document.getElementById('book-form').addEventListener('submit', bookRoom);
})();

async function loadRooms(sortBy = 'price_per_night', order = 'ASC') {
  try {
    allRooms = await API.get(`/api/rooms?sortBy=${sortBy}&order=${order}`);
    renderRoomCards(allRooms);
    renderRoomSelect(allRooms);
  } catch (err) {
    console.error(err);
  }
}

function sortRooms(sortBy, order) { loadRooms(sortBy, order); }

function renderRoomSelect(rooms) {
  const sel = document.getElementById('room-select');
  sel.innerHTML = rooms.map(r =>
    `<option value="${r.id}">${r.name} — ₱${r.price_per_night.toLocaleString()}/night</option>`
  ).join('');
}

function renderRoomCards(rooms) {
  const container = document.getElementById('room-list');
  container.innerHTML = rooms.map(r => `
    <div class="room-card" onclick="document.getElementById('room-select').value='${r.id}'; checkAvail();">
      <div class="room-card-image ${getRoomClass(r.name)}">
        <span>${getRoomEmoji(r.name)}</span>
      </div>
      <div class="room-card-body">
        <h3>${r.name}</h3>
        <p class="room-desc">${r.description}</p>
        <div class="room-meta">
          <span class="room-price">₱${r.price_per_night.toLocaleString()}/night</span>
          <span class="room-rating">⭐ ${r.rating}</span>
        </div>
        <p class="room-info">Capacity: ${r.capacity} guests · ${r.total_rooms} rooms</p>
        <div class="room-amenities">
          ${(r.amenities || []).slice(0, 4).map(a => `<span>${a}</span>`).join('')}
          ${(r.amenities || []).length > 4 ? `<span style="opacity:0.6;">+${r.amenities.length - 4}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function checkAvail() {
  const roomId  = document.getElementById('room-select').value;
  const checkIn = document.getElementById('check-in').value;
  const checkOut = document.getElementById('check-out').value;
  const badge   = document.getElementById('avail-badge');
  if (!roomId || !checkIn || !checkOut) return;

  try {
    const res = await API.get(`/api/rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
    badge.classList.remove('hidden');
    if (res.available) {
      badge.textContent = `✅ ${res.count} room(s) available`;
      badge.style.background = 'rgba(34, 197, 94, 0.15)';
      badge.style.color = '#4ade80';
      badge.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    } else {
      badge.textContent = '❌ No rooms available for these dates';
      badge.style.background = 'rgba(239, 68, 68, 0.15)';
      badge.style.color = '#f87171';
      badge.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    }
  } catch { badge.classList.add('hidden'); }
}

async function bookRoom(e) {
  e.preventDefault();
  const errEl  = document.getElementById('book-error');
  const okEl   = document.getElementById('book-success');
  errEl.classList.remove('show');
  okEl.classList.remove('show');

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span>';

  try {
    const result = await API.post('/api/reservations', {
      roomTypeId: Number(document.getElementById('room-select').value),
      checkIn:    document.getElementById('check-in').value,
      checkOut:   document.getElementById('check-out').value,
      guests:     Number(document.getElementById('guests').value) || 1,
      notes:      document.getElementById('notes').value.trim(),
    });
    okEl.innerHTML = `✅ Booked! Ref: <strong>${result.reference_number}</strong> — Total: ₱${Number(result.total_amount).toLocaleString()}`;
    okEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = originalText;
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/* ─── AI Quick Book ───────────────────────────────── */
async function aiParse() {
  const input  = document.getElementById('ai-input').value.trim();
  const status = document.getElementById('ai-status');
  const btn    = document.getElementById('ai-btn');
  if (!input) return;

  status.textContent = '⏳ Parsing with AI…';
  status.classList.remove('hidden');
  btn.disabled = true;

  try {
    const intent = await API.post('/api/llm/parse-booking', { message: input });
    status.textContent = '✅ Parsed! Form auto-filled.';

    if (intent.room_type) {
      const match = allRooms.find(r => r.name.toLowerCase().includes(intent.room_type.toLowerCase()));
      if (match) document.getElementById('room-select').value = match.id;
    }
    if (intent.check_in)  document.getElementById('check-in').value  = intent.check_in;
    if (intent.check_out) document.getElementById('check-out').value = intent.check_out;
    if (intent.guests)    document.getElementById('guests').value    = intent.guests;
    if (intent.notes)     document.getElementById('notes').value     = intent.notes;
    checkAvail();
  } catch (err) {
    status.textContent = `❌ AI error: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
}
