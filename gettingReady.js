// ---- Getting Ready villas ----
let editingGettingReadyId = null;
let gettingReadyFilter = { search: '' };

function applyGettingReadyFilters(list){
  const term = gettingReadyFilter.search.trim().toLowerCase();
  if(!term) return list;
  return list.filter(v => {
    const haystack = `${v.name} ${v.contact||''} ${v.address||''} ${v.notes||''}`.toLowerCase();
    return haystack.includes(term);
  });
}

function renderGettingReady(){
  const tbody = document.querySelector('#gettingReadyTable tbody');
  tbody.innerHTML = '';
  const filtered = applyGettingReadyFilters(state.gettingReady);
  document.getElementById('gettingReadyEmpty').style.display = state.gettingReady.length ? 'none' : 'block';
  document.getElementById('gettingReadyNoMatch').style.display = (state.gettingReady.length && !filtered.length) ? 'block' : 'none';
  filtered.forEach(v => {
    const tr = document.createElement('tr');
    const phoneCell = v.phone ? `<a href="tel:${escapeHtml(v.phone)}" style="color:inherit;">${escapeHtml(v.phone)}</a>` : '—';
    let addressCell = escapeHtml(v.address || '—');
    if(v.address && v.maps){
      addressCell = `${escapeHtml(v.address)}<br><a href="${escapeHtml(v.maps)}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-deep);">פתיחה במפות</a>`;
    }else if(v.maps){
      addressCell = `<a href="${escapeHtml(v.maps)}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-deep);">פתיחה במפות</a>`;
    }
    const linkCell = v.link ? `<a href="${escapeHtml(v.link)}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-deep);">קישור</a>` : '—';
    tr.innerHTML = `
      <td data-label="שם העסק">${escapeHtml(v.name)}</td>
      <td data-label="איש קשר">${escapeHtml(v.contact||'—')}</td>
      <td data-label="טלפון">${phoneCell}</td>
      <td data-label="כתובת">${addressCell}</td>
      <td data-label="מחיר">${money(v.price)}</td>
      <td data-label="מסמך מצורף">${linkCell}</td>
      <td data-label="הערות">${escapeHtml(v.notes||'—')}</td>
      <td data-label="" style="white-space:nowrap;">
        <button class="btn secondary" data-edit-gettingready="${v.id}" style="color:var(--gold-deep);border-color:var(--gold-deep);margin-left:6px;">עריכה</button>
        <button class="btn secondary" data-del-gettingready="${v.id}">מחיקה</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-del-gettingready]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const item = state.gettingReady.find(x=>x.id === btn.dataset.delGettingready);
      const ok = await confirmAction(`למחוק את ${item ? item.name : 'הווילה'}?`);
      if(!ok) return;
      await Repository.gettingReady.remove(btn.dataset.delGettingready);
      if(editingGettingReadyId === btn.dataset.delGettingready) cancelGettingReadyEdit();
      state.gettingReady = await Repository.gettingReady.list();
      renderAll();
      showToast('הווילה נמחקה', 'success');
    });
  });
  tbody.querySelectorAll('[data-edit-gettingready]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = state.gettingReady.find(x=>x.id === btn.dataset.editGettingready);
      if(!v) return;
      editingGettingReadyId = v.id;
      document.getElementById('gr-name').value = v.name;
      document.getElementById('gr-contact').value = v.contact || '';
      document.getElementById('gr-phone').value = v.phone || '';
      document.getElementById('gr-price').value = v.price;
      document.getElementById('gr-address').value = v.address || '';
      document.getElementById('gr-maps').value = v.maps || '';
      document.getElementById('gr-link').value = v.link || '';
      document.getElementById('gr-notes').value = v.notes || '';
      setFieldValidity('gr-phone', 'gr-phone-error', true, '');
      setFieldValidity('gr-maps', 'gr-maps-error', true, '');
      setFieldValidity('gr-link', 'gr-link-error', true, '');
      document.getElementById('gettingReadyFormTitle').textContent = 'עריכת וילת התארגנות';
      document.getElementById('addGettingReadyBtn').textContent = 'עדכון וילה';
      document.getElementById('cancelGettingReadyEditBtn').style.display = 'inline-block';
      document.getElementById('gr-name').scrollIntoView({ behavior:'smooth', block:'center' });
      document.getElementById('gr-name').focus();
    });
  });
}

document.getElementById('gr-search').addEventListener('input', ()=>{
  gettingReadyFilter.search = document.getElementById('gr-search').value;
  renderGettingReady();
});

document.getElementById('gr-phone').addEventListener('blur', ()=>{
  const v = document.getElementById('gr-phone').value.trim();
  setFieldValidity('gr-phone', 'gr-phone-error', isValidPhone(v), 'מספר טלפון לא תקין');
});
document.getElementById('gr-maps').addEventListener('blur', ()=>{
  const v = document.getElementById('gr-maps').value.trim();
  setFieldValidity('gr-maps', 'gr-maps-error', isValidUrl(v), 'קישור לא תקין (חייב להתחיל ב-http:// או https://)');
});
document.getElementById('gr-link').addEventListener('blur', ()=>{
  const v = document.getElementById('gr-link').value.trim();
  setFieldValidity('gr-link', 'gr-link-error', isValidUrl(v), 'קישור לא תקין (חייב להתחיל ב-http:// או https://)');
});

function cancelGettingReadyEdit(){
  editingGettingReadyId = null;
  ['gr-name','gr-contact','gr-phone','gr-price','gr-address','gr-maps','gr-link','gr-notes'].forEach(id=>document.getElementById(id).value='');
  setFieldValidity('gr-phone', 'gr-phone-error', true, '');
  setFieldValidity('gr-maps', 'gr-maps-error', true, '');
  setFieldValidity('gr-link', 'gr-link-error', true, '');
  document.getElementById('gettingReadyFormTitle').textContent = 'הוספת וילת התארגנות';
  document.getElementById('addGettingReadyBtn').textContent = 'הוספת וילה';
  document.getElementById('cancelGettingReadyEditBtn').style.display = 'none';
}

document.getElementById('cancelGettingReadyEditBtn').addEventListener('click', cancelGettingReadyEdit);

document.getElementById('add-gettingready-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('gr-name').value.trim();
  if(!name){ showToast('נא להזין שם עסק', 'warning'); return; }

  const phone = document.getElementById('gr-phone').value.trim();
  const maps = document.getElementById('gr-maps').value.trim();
  const link = document.getElementById('gr-link').value.trim();
  const phoneOk = isValidPhone(phone);
  const mapsOk = isValidUrl(maps);
  const linkOk = isValidUrl(link);
  setFieldValidity('gr-phone', 'gr-phone-error', phoneOk, 'מספר טלפון לא תקין');
  setFieldValidity('gr-maps', 'gr-maps-error', mapsOk, 'קישור לא תקין (חייב להתחיל ב-http:// או https://)');
  setFieldValidity('gr-link', 'gr-link-error', linkOk, 'קישור לא תקין (חייב להתחיל ב-http:// או https://)');
  if(!phoneOk || !mapsOk || !linkOk){ showToast('נא לתקן את השדות המסומנים', 'warning'); return; }

  const data = {
    name,
    contact: document.getElementById('gr-contact').value.trim(),
    phone,
    address: document.getElementById('gr-address').value.trim(),
    maps,
    link,
    price: Number(document.getElementById('gr-price').value) || 0,
    notes: document.getElementById('gr-notes').value.trim()
  };

  const wasEditing = !!editingGettingReadyId;
  if(editingGettingReadyId){
    await Repository.gettingReady.update(editingGettingReadyId, data);
  }else{
    await Repository.gettingReady.add(data);
  }
  state.gettingReady = await Repository.gettingReady.list();
  cancelGettingReadyEdit();
  renderAll();
  showToast(wasEditing ? 'הווילה עודכנה בהצלחה' : 'הווילה נוספה בהצלחה', 'success');
});
