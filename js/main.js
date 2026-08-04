let state = { guests: [], vendors: [], tasks: [], attractions: [], gettingReady: [], budgetTarget: 0 };

const DEFAULT_TASKS = [
  'לקבוע תאריך ולסגור אולם',
  'לסגור קייטרינג ולתאם טעימות',
  'לסגור צלם/ת ומצלם/ת וידאו',
  'לסגור DJ / להקה',
  'לבחור שמלת כלה ולתאם מדידות',
  'לבחור חליפה לחתן',
  'לתאם איפור ושיער + ניסיון',
  'לעצב ולשלוח הזמנות',
  'לסגור רשימת מוזמנים סופית',
  'לתאם הסעות לאורחים',
  'לבחור טבעות',
  'לתכנן סידורי הושבה',
  'לתאם פרחים ועיצוב',
  'לסגור תשלומים סופיים לכל הספקים',
  'לתאם עם רב/ת לטקס'
];

async function ensureDefaultTasks(){
  const hasTasks = await storageAdapter.has('tasks');
  if(!hasTasks){
    const seeded = DEFAULT_TASKS.map(text => ({ id: uid(), text, done: false, createdAt: nowIso(), updatedAt: nowIso() }));
    await Repository.tasks.replaceAll(seeded);
  }
}

async function loadState(){
  await ensureDefaultTasks();
  state.guests = await Repository.guests.list();
  state.vendors = await Repository.vendors.list();
  state.tasks = await Repository.tasks.list();
  state.attractions = await Repository.attractions.list();
  state.gettingReady = await Repository.gettingReady.list();
  state.budgetTarget = await storageAdapter.getSetting('budgetTarget', 0);
  renderAll();
}

function renderAll(){
  renderCountdown();
  renderGuests();
  renderVendors();
  renderBudget();
  renderOverview();
  renderTasks();
  renderAttractions();
  renderGettingReady();
}

// ---- Tabs ----
document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('section.tab').forEach(s=>s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

renderCountdown();

// ---- Backup / Restore ----
document.getElementById('exportBackupBtn').addEventListener('click', ()=>{
  const backup = {
    exportedAt: nowIso(),
    schemaVersion: 1,
    guests: state.guests,
    vendors: state.vendors,
    tasks: state.tasks,
    attractions: state.attractions,
    gettingReady: state.gettingReady,
    budgetTarget: state.budgetTarget
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `wedding-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  const msg = document.getElementById('backupMsg');
  msg.textContent = 'הגיבוי ירד בהצלחה 🤍';
  msg.style.color = '#697A64';
});

document.getElementById('restoreFile').addEventListener('change', async (e)=>{
  const msg = document.getElementById('backupMsg');
  const file = e.target.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    if(!Array.isArray(data.guests) || !Array.isArray(data.vendors) || !Array.isArray(data.tasks)){
      throw new Error('invalid backup format');
    }
    // attractions/gettingReady/budgetTarget didn't exist in backups taken before those features — default rather than reject
    const attractions = Array.isArray(data.attractions) ? data.attractions : [];
    const gettingReady = Array.isArray(data.gettingReady) ? data.gettingReady : [];
    const budgetTarget = typeof data.budgetTarget === 'number' ? data.budgetTarget : 0;
    const confirmed = await confirmAction('שחזור מגיבוי יחליף את כל המידע הקיים כרגע באתר. להמשיך?');
    if(!confirmed){ e.target.value = ''; return; }
    await Repository.guests.replaceAll(data.guests);
    await Repository.vendors.replaceAll(data.vendors);
    await Repository.tasks.replaceAll(data.tasks);
    await Repository.attractions.replaceAll(attractions);
    await Repository.gettingReady.replaceAll(gettingReady);
    await storageAdapter.setSetting('budgetTarget', budgetTarget);
    state.guests = data.guests;
    state.vendors = data.vendors;
    state.tasks = data.tasks;
    state.attractions = attractions;
    state.gettingReady = gettingReady;
    state.budgetTarget = budgetTarget;
    renderAll();
    msg.textContent = 'השחזור הושלם בהצלחה 🤍';
    msg.style.color = '#697A64';
  }catch(err){
    console.error(err);
    msg.textContent = 'לא הצלחתי לקרוא את קובץ הגיבוי. ודאי שזה קובץ JSON שהורד מהאתר הזה.';
    msg.style.color = '#B4655A';
  }
  e.target.value = '';
});

loadState();
