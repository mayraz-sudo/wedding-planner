// ---- Guests ----
let guestsFilter = { search: '', side: 'all', status: 'all' };
let editingGuestId = null;

function statusLabel(s){
  return s === 'confirmed' ? 'אישר הגעה' : s === 'declined' ? 'לא מגיע' : s === 'unknown' ? 'לא ידוע' : 'ממתין לתשובה';
}
function statusClass(s){
  return s === 'confirmed' ? 'status-confirmed' : s === 'declined' ? 'status-declined' : s === 'unknown' ? 'status-unknown' : 'status-pending';
}

// isValidPhone / isValidEmail / setFieldValidity now live in utils.js (shared with attractions, etc.)

function applyGuestFilters(list){
  const term = guestsFilter.search.trim().toLowerCase();
  return list.filter(g => {
    if(guestsFilter.side !== 'all' && g.side !== guestsFilter.side) return false;
    if(guestsFilter.status !== 'all' && g.status !== guestsFilter.status) return false;
    if(term){
      const haystack = `${g.name} ${g.phone||''} ${g.email||''}`.toLowerCase();
      if(!haystack.includes(term)) return false;
    }
    return true;
  });
}

function renderGuests(){
  const tbody = document.querySelector('#guestsTable tbody');
  tbody.innerHTML = '';
  const filtered = applyGuestFilters(state.guests);
  document.getElementById('guestsEmpty').style.display = state.guests.length ? 'none' : 'block';
  document.getElementById('guestsNoMatch').style.display = (state.guests.length && !filtered.length) ? 'block' : 'none';
  filtered.forEach(g => {
    const tr = document.createElement('tr');
    const phoneCell = g.phone ? `<a href="tel:${escapeHtml(g.phone)}" style="color:inherit;">${escapeHtml(g.phone)}</a>` : '—';
    const emailCell = g.email ? `<a href="mailto:${escapeHtml(g.email)}" style="color:inherit;">${escapeHtml(g.email)}</a>` : '—';
    tr.innerHTML = `
      <td data-label="שם">${escapeHtml(g.name)}</td>
      <td data-label="צד">${escapeHtml(g.side)}</td>
      <td data-label="אורחים">${g.count}</td>
      <td data-label="סטטוס"><span class="status-pill ${statusClass(g.status)}">${statusLabel(g.status)}</span></td>
      <td data-label="שולחן">${escapeHtml(g.table||'—')}</td>
      <td data-label="טלפון">${phoneCell}</td>
      <td data-label="מייל">${emailCell}</td>
      <td data-label="צפי מתנה">${money(g.giftAmount||0)}</td>
      <td data-label="" style="white-space:nowrap;">
        <button class="btn secondary" data-edit-guest="${g.id}" style="color:var(--gold-deep);border-color:var(--gold-deep);margin-left:6px;">עריכה</button>
        <button class="btn secondary" data-del-guest="${g.id}">מחיקה</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-del-guest]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const guest = state.guests.find(x=>x.id === btn.dataset.delGuest);
      const ok = await confirmAction(`למחוק את ${guest ? guest.name : 'המוזמן'} מרשימת המוזמנים?`);
      if(!ok) return;
      await Repository.guests.remove(btn.dataset.delGuest);
      if(editingGuestId === btn.dataset.delGuest) cancelGuestEdit();
      state.guests = await Repository.guests.list();
      renderAll();
      showToast('המוזמן נמחק', 'success');
    });
  });
  tbody.querySelectorAll('[data-edit-guest]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const g = state.guests.find(x=>x.id === btn.dataset.editGuest);
      if(!g) return;
      editingGuestId = g.id;
      document.getElementById('g-name').value = g.name;
      document.getElementById('g-side').value = g.side;
      document.getElementById('g-count').value = g.count;
      document.getElementById('g-status').value = g.status || 'pending';
      document.getElementById('g-table').value = g.table || '';
      document.getElementById('g-phone').value = g.phone || '';
      document.getElementById('g-email').value = g.email || '';
      document.getElementById('g-gift').value = g.giftAmount || '';
      setFieldValidity('g-phone', 'g-phone-error', true, '');
      setFieldValidity('g-email', 'g-email-error', true, '');
      document.getElementById('guestFormTitle').textContent = 'עריכת מוזמן';
      document.getElementById('addGuestBtn').textContent = 'עדכון מוזמן';
      document.getElementById('cancelGuestEditBtn').style.display = 'inline-block';
      document.getElementById('g-name').scrollIntoView({ behavior:'smooth', block:'center' });
      document.getElementById('g-name').focus();
    });
  });
}

document.getElementById('g-search').addEventListener('input', ()=>{
  guestsFilter.search = document.getElementById('g-search').value;
  renderGuests();
});
document.getElementById('g-filter-side').addEventListener('change', ()=>{
  guestsFilter.side = document.getElementById('g-filter-side').value;
  renderGuests();
});
document.getElementById('g-filter-status').addEventListener('change', ()=>{
  guestsFilter.status = document.getElementById('g-filter-status').value;
  renderGuests();
});

document.getElementById('g-phone').addEventListener('blur', ()=>{
  const v = document.getElementById('g-phone').value.trim();
  setFieldValidity('g-phone', 'g-phone-error', isValidPhone(v), 'מספר טלפון לא תקין');
});
document.getElementById('g-email').addEventListener('blur', ()=>{
  const v = document.getElementById('g-email').value.trim();
  setFieldValidity('g-email', 'g-email-error', isValidEmail(v), 'כתובת מייל לא תקינה');
});

function cancelGuestEdit(){
  editingGuestId = null;
  document.getElementById('g-name').value='';
  document.getElementById('g-table').value='';
  document.getElementById('g-count').value=1;
  document.getElementById('g-phone').value='';
  document.getElementById('g-email').value='';
  document.getElementById('g-gift').value='';
  document.getElementById('g-side').selectedIndex = 0;
  document.getElementById('g-status').selectedIndex = 0;
  setFieldValidity('g-phone', 'g-phone-error', true, '');
  setFieldValidity('g-email', 'g-email-error', true, '');
  document.getElementById('guestFormTitle').textContent = 'הוספת מוזמן';
  document.getElementById('addGuestBtn').textContent = 'הוספה לרשימה';
  document.getElementById('cancelGuestEditBtn').style.display = 'none';
}

document.getElementById('cancelGuestEditBtn').addEventListener('click', cancelGuestEdit);

document.getElementById('add-guest-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('g-name').value.trim();
  if(!name){ showToast('נא להזין שם', 'warning'); return; }

  const phone = document.getElementById('g-phone').value.trim();
  const email = document.getElementById('g-email').value.trim();
  const phoneOk = isValidPhone(phone);
  const emailOk = isValidEmail(email);
  setFieldValidity('g-phone', 'g-phone-error', phoneOk, 'מספר טלפון לא תקין');
  setFieldValidity('g-email', 'g-email-error', emailOk, 'כתובת מייל לא תקינה');
  if(!phoneOk || !emailOk){ showToast('נא לתקן את השדות המסומנים', 'warning'); return; }

  const data = {
    name,
    side: document.getElementById('g-side').value,
    count: Number(document.getElementById('g-count').value) || 1,
    status: document.getElementById('g-status').value,
    table: document.getElementById('g-table').value.trim(),
    phone,
    email,
    giftAmount: Number(document.getElementById('g-gift').value) || 0
  };

  const wasEditing = !!editingGuestId;
  if(wasEditing){
    await Repository.guests.update(editingGuestId, data);
  }else{
    await Repository.guests.add(data);
  }
  state.guests = await Repository.guests.list();
  cancelGuestEdit();
  renderAll();
  showToast(wasEditing ? 'המוזמן עודכן בהצלחה' : 'המוזמן נוסף בהצלחה', 'success');
});

// ---- Import from Excel ----
function normalizeHeader(h){
  return String(h||'').trim().toLowerCase().replace(/["'׳״]/g,'');
}
function findKey(row, candidates){
  const keys = Object.keys(row);
  for(const k of keys){
    const nk = normalizeHeader(k);
    if(candidates.some(c=>nk.includes(c))) return k;
  }
  return null;
}
function mapStatus(raw){
  const s = String(raw||'').trim().toLowerCase();
  if(!s) return 'pending';
  if(s.includes('אישר') || s.includes('confirm') || s.includes('yes') || s.includes('כן') || s === 'v' || s==='✓') return 'confirmed';
  if(s.includes('לא מגיע') || s.includes('decline') || s.includes('no') || s.includes('לא')) return 'declined';
  return 'pending';
}

document.getElementById('importBtn').addEventListener('click', async ()=>{
  const fileInput = document.getElementById('importFile');
  const msg = document.getElementById('importMsg');
  const file = fileInput.files[0];
  if(!file){ msg.textContent = 'בחרי קובץ קודם.'; msg.style.color = '#B4655A'; return; }
  msg.textContent = 'קוראת את הקובץ...'; msg.style.color = '#8A8378';
  try{
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if(!rows.length){ msg.textContent = 'לא נמצאו שורות בקובץ.'; msg.style.color = '#B4655A'; return; }

    const sample = rows[0];
    const nameKey = findKey(sample, ['שם','name','fullname']);
    const sideKey = findKey(sample, ['צד','side']);
    const countKey = findKey(sample, ['כמות','count','אורחים','guests']);
    const statusKey = findKey(sample, ['סטטוס','status','אישור','rsvp']);
    const tableKey = findKey(sample, ['שולחן','table']);
    const phoneKey = findKey(sample, ['טלפון','נייד','phone','tel','mobile']);
    const emailKey = findKey(sample, ['מייל','אימייל','email','mail']);

    if(!nameKey){
      msg.textContent = 'לא הצלחתי למצוא עמודת שם. ודאי שיש עמודה בשם "שם" או "Name".';
      msg.style.color = '#B4655A';
      showToast('לא נמצאה עמודת שם בקובץ', 'error');
      return;
    }

    let added = 0;
    for(const row of rows){
      const name = String(row[nameKey]||'').trim();
      if(!name) continue;
      let side = sideKey ? String(row[sideKey]||'').trim() : '';
      if(!['כלה','חתן','משותף'].includes(side)) side = side || 'משותף';
      const count = countKey ? (Number(row[countKey]) || 1) : 1;
      const status = statusKey ? mapStatus(row[statusKey]) : 'pending';
      const table = tableKey ? String(row[tableKey]||'').trim() : '';
      const phone = phoneKey ? String(row[phoneKey]||'').trim() : '';
      const email = emailKey ? String(row[emailKey]||'').trim() : '';
      await Repository.guests.add({ name, side, count, status, table, phone, email });
      added++;
    }

    state.guests = await Repository.guests.list();
    renderAll();
    msg.textContent = `יובאו ${added} מוזמנים בהצלחה 🤍`;
    msg.style.color = '#697A64';
    fileInput.value = '';
    showToast(`יובאו ${added} מוזמנים בהצלחה`, 'success');
  }catch(err){
    console.error(err);
    msg.textContent = 'משהו השתבש בקריאת הקובץ. ודאי שזה קובץ אקסל/CSV תקין.';
    msg.style.color = '#B4655A';
    showToast('קריאת הקובץ נכשלה', 'error');
  }
});

// ---- Export to Excel ----
document.getElementById('exportGuestsBtn').addEventListener('click', ()=>{
  if(!state.guests.length){ showToast('אין מוזמנים לייצוא', 'warning'); return; }
  try{
    const rows = state.guests.map(g => ({
      'שם': g.name,
      'צד': g.side,
      'כמות': g.count,
      'סטטוס': statusLabel(g.status),
      'שולחן': g.table || '',
      'טלפון': g.phone || '',
      'מייל': g.email || '',
      'צפי מתנה': g.giftAmount || 0
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'מוזמנים');
    const dateStr = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `guest-list-${dateStr}.xlsx`);
    showToast('הקובץ יוצא בהצלחה', 'success');
  }catch(err){
    console.error(err);
    showToast('הייצוא נכשל', 'error');
  }
});
