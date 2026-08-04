// ---- Attractions ----
let editingAttractionId = null;
let attractionsFilter = { search: '', category: 'all' };

function applyAttractionFilters(list){
  const term = attractionsFilter.search.trim().toLowerCase();
  return list.filter(a => {
    if(attractionsFilter.category !== 'all' && a.category !== attractionsFilter.category) return false;
    if(term){
      const haystack = `${a.name} ${a.category} ${a.notes||''}`.toLowerCase();
      if(!haystack.includes(term)) return false;
    }
    return true;
  });
}

function renderAttractions(){
  const tbody = document.querySelector('#attractionsTable tbody');
  tbody.innerHTML = '';
  const filtered = applyAttractionFilters(state.attractions);
  document.getElementById('attractionsEmpty').style.display = state.attractions.length ? 'none' : 'block';
  document.getElementById('attractionsNoMatch').style.display = (state.attractions.length && !filtered.length) ? 'block' : 'none';
  filtered.forEach(a => {
    const tr = document.createElement('tr');
    const phoneCell = a.phone ? `<a href="tel:${escapeHtml(a.phone)}" style="color:inherit;">${escapeHtml(a.phone)}</a>` : '—';
    const linkCell = a.link ? `<a href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-deep);">קישור</a>` : '—';
    tr.innerHTML = `
      <td data-label="שם">${escapeHtml(a.name)}</td>
      <td data-label="סוג">${escapeHtml(a.category)}</td>
      <td data-label="מחיר">${money(a.price)}</td>
      <td data-label="טלפון">${phoneCell}</td>
      <td data-label="קישור">${linkCell}</td>
      <td data-label="הערות">${escapeHtml(a.notes||'—')}</td>
      <td data-label="" style="white-space:nowrap;">
        <button class="btn secondary" data-edit-attraction="${a.id}" style="color:var(--gold-deep);border-color:var(--gold-deep);margin-left:6px;">עריכה</button>
        <button class="btn secondary" data-del-attraction="${a.id}">מחיקה</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-del-attraction]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const attraction = state.attractions.find(x=>x.id === btn.dataset.delAttraction);
      const ok = await confirmAction(`למחוק את ${attraction ? attraction.name : 'האטרקציה'}?`);
      if(!ok) return;
      await Repository.attractions.remove(btn.dataset.delAttraction);
      if(editingAttractionId === btn.dataset.delAttraction) cancelAttractionEdit();
      state.attractions = await Repository.attractions.list();
      renderAll();
      showToast('האטרקציה נמחקה', 'success');
    });
  });
  tbody.querySelectorAll('[data-edit-attraction]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const a = state.attractions.find(x=>x.id === btn.dataset.editAttraction);
      if(!a) return;
      editingAttractionId = a.id;
      document.getElementById('a-name').value = a.name;
      document.getElementById('a-category').value = a.category;
      document.getElementById('a-price').value = a.price;
      document.getElementById('a-phone').value = a.phone || '';
      document.getElementById('a-link').value = a.link || '';
      document.getElementById('a-notes').value = a.notes || '';
      setFieldValidity('a-phone', 'a-phone-error', true, '');
      setFieldValidity('a-link', 'a-link-error', true, '');
      document.getElementById('attractionFormTitle').textContent = 'עריכת אטרקציה';
      document.getElementById('addAttractionBtn').textContent = 'עדכון אטרקציה';
      document.getElementById('cancelAttractionEditBtn').style.display = 'inline-block';
      document.getElementById('a-name').scrollIntoView({ behavior:'smooth', block:'center' });
      document.getElementById('a-name').focus();
    });
  });
}

document.getElementById('a-search').addEventListener('input', ()=>{
  attractionsFilter.search = document.getElementById('a-search').value;
  renderAttractions();
});
document.getElementById('a-filter-category').addEventListener('change', ()=>{
  attractionsFilter.category = document.getElementById('a-filter-category').value;
  renderAttractions();
});

document.getElementById('a-phone').addEventListener('blur', ()=>{
  const v = document.getElementById('a-phone').value.trim();
  setFieldValidity('a-phone', 'a-phone-error', isValidPhone(v), 'מספר טלפון לא תקין');
});
document.getElementById('a-link').addEventListener('blur', ()=>{
  const v = document.getElementById('a-link').value.trim();
  setFieldValidity('a-link', 'a-link-error', isValidUrl(v), 'קישור לא תקין (חייב להתחיל ב-http:// או https://)');
});

function cancelAttractionEdit(){
  editingAttractionId = null;
  ['a-name','a-price','a-phone','a-link','a-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('a-category').selectedIndex = 0;
  setFieldValidity('a-phone', 'a-phone-error', true, '');
  setFieldValidity('a-link', 'a-link-error', true, '');
  document.getElementById('attractionFormTitle').textContent = 'הוספת אטרקציה';
  document.getElementById('addAttractionBtn').textContent = 'הוספת אטרקציה';
  document.getElementById('cancelAttractionEditBtn').style.display = 'none';
}

document.getElementById('cancelAttractionEditBtn').addEventListener('click', cancelAttractionEdit);

document.getElementById('add-attraction-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('a-name').value.trim();
  if(!name){ showToast('נא להזין שם אטרקציה', 'warning'); return; }

  const phone = document.getElementById('a-phone').value.trim();
  const link = document.getElementById('a-link').value.trim();
  const phoneOk = isValidPhone(phone);
  const linkOk = isValidUrl(link);
  setFieldValidity('a-phone', 'a-phone-error', phoneOk, 'מספר טלפון לא תקין');
  setFieldValidity('a-link', 'a-link-error', linkOk, 'קישור לא תקין (חייב להתחיל ב-http:// או https://)');
  if(!phoneOk || !linkOk){ showToast('נא לתקן את השדות המסומנים', 'warning'); return; }

  const data = {
    name,
    category: document.getElementById('a-category').value,
    price: Number(document.getElementById('a-price').value) || 0,
    phone,
    link,
    notes: document.getElementById('a-notes').value.trim()
  };

  const wasEditing = !!editingAttractionId;
  if(editingAttractionId){
    await Repository.attractions.update(editingAttractionId, data);
  }else{
    await Repository.attractions.add(data);
  }
  state.attractions = await Repository.attractions.list();
  cancelAttractionEdit();
  renderAll();
  showToast(wasEditing ? 'האטרקציה עודכנה בהצלחה' : 'האטרקציה נוספה בהצלחה', 'success');
});
