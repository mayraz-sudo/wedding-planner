// ---- Vendors ----
let editingVendorId = null;
let vendorsFilter = { search: '', category: 'all', status: 'all' };

function vendorStatusLabel(s){
  return s === 'booked' ? 'סגור' : s === 'cancelled' ? 'בוטל' : 'בתהליך';
}
function vendorStatusClass(s){
  return s === 'booked' ? 'status-confirmed' : s === 'cancelled' ? 'status-declined' : 'status-pending';
}
// deposit is a derived rollup, always kept equal to the sum of paid entries in the schedule
function recomputePaid(schedule){
  return (schedule||[]).filter(p=>p.paid).reduce((s,p)=>s+(p.amount||0), 0);
}

function applyVendorFilters(list){
  const term = vendorsFilter.search.trim().toLowerCase();
  return list.filter(v => {
    if(vendorsFilter.category !== 'all' && v.category !== vendorsFilter.category) return false;
    if(vendorsFilter.status !== 'all' && (v.status || 'pending') !== vendorsFilter.status) return false;
    if(term){
      const haystack = `${v.name} ${v.category} ${v.contact||''} ${v.phone||''} ${v.email||''} ${v.notes||''}`.toLowerCase();
      if(!haystack.includes(term)) return false;
    }
    return true;
  });
}

function renderVendors(){
  const tbody = document.querySelector('#vendorsTable tbody');
  tbody.innerHTML = '';
  const filtered = applyVendorFilters(state.vendors);
  document.getElementById('vendorsEmpty').style.display = state.vendors.length ? 'none' : 'block';
  document.getElementById('vendorsNoMatch').style.display = (state.vendors.length && !filtered.length) ? 'block' : 'none';
  filtered.forEach(v => {
    const balance = (v.cost||0) - (v.deposit||0);
    const tr = document.createElement('tr');
    const phoneCell = v.phone ? `<a href="tel:${escapeHtml(v.phone)}" style="color:inherit;">${escapeHtml(v.phone)}</a>` : '—';
    const emailCell = v.email ? `<a href="mailto:${escapeHtml(v.email)}" style="color:inherit;">${escapeHtml(v.email)}</a>` : '—';
    tr.innerHTML = `
      <td data-label="ספק">${escapeHtml(v.name)}</td>
      <td data-label="קטגוריה">${escapeHtml(v.category)}</td>
      <td data-label="איש קשר">${escapeHtml(v.contact||'—')}</td>
      <td data-label="טלפון">${phoneCell}</td>
      <td data-label="מייל">${emailCell}</td>
      <td data-label="סטטוס"><span class="status-pill ${vendorStatusClass(v.status)}">${vendorStatusLabel(v.status)}</span></td>
      <td data-label="עלות">${money(v.cost)}</td>
      <td data-label="שולם">${money(v.deposit)}</td>
      <td data-label="יתרה">${money(balance)}</td>
      <td data-label="הערות">${escapeHtml(v.notes||'—')}</td>
      <td data-label="" style="white-space:nowrap;">
        <button class="btn secondary" data-edit-vendor="${v.id}" style="color:var(--gold-deep);border-color:var(--gold-deep);margin-left:6px;">עריכה</button>
        <button class="btn secondary" data-del-vendor="${v.id}">מחיקה</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-del-vendor]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const vendor = state.vendors.find(x=>x.id === btn.dataset.delVendor);
      const ok = await confirmAction(`למחוק את הספק ${vendor ? vendor.name : ''}?`);
      if(!ok) return;
      await Repository.vendors.remove(btn.dataset.delVendor);
      if(editingVendorId === btn.dataset.delVendor) cancelVendorEdit();
      state.vendors = await Repository.vendors.list();
      renderAll();
      showToast('הספק נמחק', 'success');
    });
  });
  tbody.querySelectorAll('[data-edit-vendor]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ enterVendorEditMode(btn.dataset.editVendor); });
  });
}

document.getElementById('v-search').addEventListener('input', ()=>{
  vendorsFilter.search = document.getElementById('v-search').value;
  renderVendors();
});
document.getElementById('v-filter-category').addEventListener('change', ()=>{
  vendorsFilter.category = document.getElementById('v-filter-category').value;
  renderVendors();
});
document.getElementById('v-filter-status').addEventListener('change', ()=>{
  vendorsFilter.status = document.getElementById('v-filter-status').value;
  renderVendors();
});

document.getElementById('v-phone').addEventListener('blur', ()=>{
  const v = document.getElementById('v-phone').value.trim();
  setFieldValidity('v-phone', 'v-phone-error', isValidPhone(v), 'מספר טלפון לא תקין');
});
document.getElementById('v-email').addEventListener('blur', ()=>{
  const v = document.getElementById('v-email').value.trim();
  setFieldValidity('v-email', 'v-email-error', isValidEmail(v), 'כתובת מייל לא תקינה');
});

// ---- Edit mode + lazy legacy-deposit migration ----
async function enterVendorEditMode(vendorId){
  const v = state.vendors.find(x=>x.id === vendorId);
  if(!v) return;
  editingVendorId = v.id;
  document.getElementById('v-name').value = v.name;
  document.getElementById('v-category').value = v.category;
  document.getElementById('v-status').value = v.status || 'pending';
  document.getElementById('v-cost').value = v.cost;
  document.getElementById('v-contact').value = v.contact || '';
  document.getElementById('v-phone').value = v.phone || '';
  document.getElementById('v-email').value = v.email || '';
  document.getElementById('v-notes').value = v.notes || '';
  setFieldValidity('v-phone', 'v-phone-error', true, '');
  setFieldValidity('v-email', 'v-email-error', true, '');
  document.getElementById('vendorFormTitle').textContent = 'עריכת ספק';
  document.getElementById('addVendorBtn').textContent = 'עדכון ספק';
  document.getElementById('cancelVendorEditBtn').style.display = 'inline-block';
  document.getElementById('v-name').scrollIntoView({ behavior:'smooth', block:'center' });
  document.getElementById('v-name').focus();

  // Vendors saved before the payment-schedule feature only have a flat `deposit` number.
  // On first edit, convert it into a single paid schedule entry so nothing is lost and
  // the derived deposit total stays byte-for-byte identical.
  if(!Array.isArray(v.paymentSchedule)){
    const schedule = (v.deposit||0) > 0
      ? [{ id: uid(), amount: v.deposit, date: '', note: 'מקדמה קיימת (יובאה אוטומטית)', paid: true }]
      : [];
    await Repository.vendors.update(v.id, { paymentSchedule: schedule, deposit: recomputePaid(schedule) });
    state.vendors = await Repository.vendors.list();
  }
  showVendorPaymentsPanel(v.id);
}

function showVendorPaymentsPanel(vendorId){
  const v = state.vendors.find(x=>x.id === vendorId);
  if(!v) return;
  document.getElementById('vendorPaymentsSection').style.display = 'block';
  document.getElementById('vendorPaymentsForName').textContent = v.name;
  renderVendorPayments(vendorId);
}

function renderVendorPayments(vendorId){
  const v = state.vendors.find(x=>x.id === vendorId);
  if(!v) return;
  const schedule = v.paymentSchedule || [];
  const container = document.getElementById('vendorPaymentsList');
  container.innerHTML = '';
  document.getElementById('vendorPaymentsEmpty').style.display = schedule.length ? 'none' : 'block';
  const paid = recomputePaid(schedule);
  document.getElementById('vendorPaymentsSummary').textContent =
    `שולם עד כה: ${money(paid)} מתוך ${money(v.cost)} · יתרה: ${money((v.cost||0)-paid)}`;
  schedule.forEach(p => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--ivory-deep);flex-wrap:wrap;';
    const details = [money(p.amount), p.date, p.note].filter(Boolean).map(escapeHtml).join(' · ');
    row.innerHTML = `
      <input type="checkbox" data-payment-toggle="${p.id}" ${p.paid ? 'checked' : ''} aria-label="שולם" style="width:18px;height:18px;flex:none;accent-color:var(--blush-deep);cursor:pointer;">
      <span style="flex:1;font-size:13.5px;">${details}</span>
      <span class="status-pill ${p.paid ? 'status-confirmed' : 'status-pending'}">${p.paid ? 'שולם' : 'מתוכנן'}</span>
      <button class="btn secondary" data-payment-del="${p.id}">מחיקה</button>
    `;
    container.appendChild(row);
  });
  container.querySelectorAll('[data-payment-toggle]').forEach(cb=>{
    cb.addEventListener('change', async ()=>{
      const current = state.vendors.find(x=>x.id === vendorId);
      const newSchedule = (current.paymentSchedule||[]).map(p => p.id === cb.dataset.paymentToggle ? { ...p, paid: cb.checked } : p);
      await Repository.vendors.update(vendorId, { paymentSchedule: newSchedule, deposit: recomputePaid(newSchedule) });
      state.vendors = await Repository.vendors.list();
      renderAll();
      renderVendorPayments(vendorId);
    });
  });
  container.querySelectorAll('[data-payment-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const ok = await confirmAction('למחוק את התשלום הזה?');
      if(!ok) return;
      const current = state.vendors.find(x=>x.id === vendorId);
      const newSchedule = (current.paymentSchedule||[]).filter(p => p.id !== btn.dataset.paymentDel);
      await Repository.vendors.update(vendorId, { paymentSchedule: newSchedule, deposit: recomputePaid(newSchedule) });
      state.vendors = await Repository.vendors.list();
      renderAll();
      renderVendorPayments(vendorId);
      showToast('התשלום נמחק', 'success');
    });
  });
}

document.getElementById('add-payment-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!editingVendorId) return;
  const amount = Number(document.getElementById('vp-amount').value) || 0;
  if(amount <= 0){ showToast('נא להזין סכום תקין', 'warning'); return; }
  const payment = {
    id: uid(),
    amount,
    date: document.getElementById('vp-date').value,
    note: document.getElementById('vp-note').value.trim(),
    paid: document.getElementById('vp-paid').checked
  };
  const current = state.vendors.find(x=>x.id === editingVendorId);
  const newSchedule = [...(current.paymentSchedule||[]), payment];
  await Repository.vendors.update(editingVendorId, { paymentSchedule: newSchedule, deposit: recomputePaid(newSchedule) });
  state.vendors = await Repository.vendors.list();
  renderAll();
  renderVendorPayments(editingVendorId);
  document.getElementById('vp-amount').value = '';
  document.getElementById('vp-date').value = '';
  document.getElementById('vp-note').value = '';
  document.getElementById('vp-paid').checked = true;
  showToast('התשלום נוסף', 'success');
});

function cancelVendorEdit(){
  editingVendorId = null;
  ['v-name','v-cost','v-contact','v-phone','v-email','v-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('v-category').selectedIndex = 0;
  document.getElementById('v-status').selectedIndex = 0;
  setFieldValidity('v-phone', 'v-phone-error', true, '');
  setFieldValidity('v-email', 'v-email-error', true, '');
  document.getElementById('vendorFormTitle').textContent = 'הוספת ספק';
  document.getElementById('addVendorBtn').textContent = 'הוספת ספק';
  document.getElementById('cancelVendorEditBtn').style.display = 'none';
  document.getElementById('vendorPaymentsSection').style.display = 'none';
}

document.getElementById('cancelVendorEditBtn').addEventListener('click', cancelVendorEdit);

document.getElementById('add-vendor-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('v-name').value.trim();
  if(!name){ showToast('נא להזין שם ספק', 'warning'); return; }

  const phone = document.getElementById('v-phone').value.trim();
  const email = document.getElementById('v-email').value.trim();
  const phoneOk = isValidPhone(phone);
  const emailOk = isValidEmail(email);
  setFieldValidity('v-phone', 'v-phone-error', phoneOk, 'מספר טלפון לא תקין');
  setFieldValidity('v-email', 'v-email-error', emailOk, 'כתובת מייל לא תקינה');
  if(!phoneOk || !emailOk){ showToast('נא לתקן את השדות המסומנים', 'warning'); return; }

  const data = {
    name,
    category: document.getElementById('v-category').value,
    status: document.getElementById('v-status').value,
    cost: Number(document.getElementById('v-cost').value) || 0,
    contact: document.getElementById('v-contact').value.trim(),
    phone,
    email,
    notes: document.getElementById('v-notes').value.trim()
  };

  const wasEditing = !!editingVendorId;
  if(wasEditing){
    await Repository.vendors.update(editingVendorId, data);
    state.vendors = await Repository.vendors.list();
    renderAll();
    showVendorPaymentsPanel(editingVendorId); // keep the payments panel open, refresh the name shown
    showToast('הספק עודכן בהצלחה', 'success');
  }else{
    const created = await Repository.vendors.add(data);
    state.vendors = await Repository.vendors.list();
    renderAll();
    showToast('הספק נוסף בהצלחה', 'success');
    await enterVendorEditMode(created.id); // jump straight into edit mode so payments can be added right away
  }
});
