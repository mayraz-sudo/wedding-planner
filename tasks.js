// ---- Tasks ----
function taskPriorityLabel(p){
  return p === 'high' ? 'גבוהה' : p === 'low' ? 'נמוכה' : 'בינונית';
}
function taskPriorityClass(p){
  return p === 'high' ? 'status-declined' : p === 'low' ? 'status-confirmed' : 'status-pending';
}
function isTaskOverdue(t){
  if(!t.dueDate || t.done) return false;
  return new Date(t.dueDate + 'T23:59:59') < new Date();
}

function renderTasks(){
  const list = document.getElementById('tasksList');
  list.innerHTML = '';
  document.getElementById('tasksEmpty').style.display = state.tasks.length ? 'none' : 'block';
  const doneCount = state.tasks.filter(t=>t.done).length;
  const total = state.tasks.length;
  document.getElementById('tasksProgress').textContent = total
    ? `${doneCount} מתוך ${total} הושלמו`
    : '';
  document.getElementById('tasksProgressBar').style.width = (total ? Math.round((doneCount/total)*100) : 0) + '%';

  state.tasks.forEach(t=>{
    const row = document.createElement('div');
    row.className = 'task-item' + (t.done ? ' done' : '');
    const overdue = isTaskOverdue(t);

    const meta = [];
    meta.push(`<span class="status-pill ${taskPriorityClass(t.priority)}">${taskPriorityLabel(t.priority)}</span>`);
    if(t.category){
      meta.push(`<span class="status-pill" style="background:var(--ivory-deep);color:var(--ink);">${escapeHtml(t.category)}</span>`);
    }
    if(t.dueDate){
      meta.push(`<span${overdue ? ' style="color:var(--danger);font-weight:500;"' : ''}>${overdue ? '⚠ ' : ''}יעד: ${escapeHtml(t.dueDate)}</span>`);
    }
    if(t.reminderAt){
      meta.push(`<span>🔔 תזכורת: ${escapeHtml(t.reminderAt)}</span>`);
    }

    row.innerHTML = `
      <input type="checkbox" ${t.done ? 'checked' : ''} data-task-toggle="${t.id}">
      <div class="task-body">
        <span class="task-text">${escapeHtml(t.text)}</span>
        <div class="task-meta">${meta.join('')}</div>
      </div>
      <button class="btn secondary" data-task-del="${t.id}">מחיקה</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-task-toggle]').forEach(cb=>{
    cb.addEventListener('change', async ()=>{
      await Repository.tasks.update(cb.dataset.taskToggle, { done: cb.checked });
      state.tasks = await Repository.tasks.list();
      renderTasks();
      renderOverview();
    });
  });
  list.querySelectorAll('[data-task-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      await Repository.tasks.remove(btn.dataset.taskDel);
      state.tasks = await Repository.tasks.list();
      renderTasks();
    });
  });
}

document.getElementById('add-task-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const input = document.getElementById('task-text');
  const text = input.value.trim();
  if(!text){ showToast('נא להזין טקסט למשימה', 'warning'); return; }
  await Repository.tasks.add({
    text,
    done: false,
    priority: document.getElementById('task-priority').value,
    category: document.getElementById('task-category').value,
    dueDate: document.getElementById('task-due').value,
    reminderAt: document.getElementById('task-reminder').value
  });
  state.tasks = await Repository.tasks.list();
  input.value = '';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-category').value = '';
  document.getElementById('task-due').value = '';
  document.getElementById('task-reminder').value = '';
  renderTasks();
  showToast('המשימה נוספה', 'success');
});
