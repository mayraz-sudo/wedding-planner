// ---- Countdown ----
function renderCountdown(){
  const wedding = new Date('2027-03-31T00:00:00');
  const now = new Date();
  const diff = Math.ceil((wedding - now) / (1000*60*60*24));
  document.getElementById('daysLeft').textContent = diff > 0 ? diff : (diff === 0 ? '🎉' : '0');
}

// ---- Overview ----
function renderOverview(){
  const invited = state.guests.reduce((s,g)=>s+(g.count||0),0);
  const confirmed = state.guests.filter(g=>g.status==='confirmed').reduce((s,g)=>s+(g.count||0),0);
  const paid = state.vendors.reduce((s,v)=>s+(v.deposit||0),0);
  document.getElementById('ov-guestsInvited').textContent = invited;
  document.getElementById('ov-guestsConfirmed').textContent = confirmed;
  document.getElementById('ov-vendorsCount').textContent = state.vendors.length;
  document.getElementById('ov-budgetPaid').textContent = money(paid);

  const todos = [];
  if(!state.guests.length) todos.push('להתחיל להוסיף מוזמנים לרשימה');
  if(!state.vendors.length) todos.push('להוסיף את הספקים שכבר סגרת (אולם, קייטרינג וכו׳)');
  const pending = state.guests.filter(g=>g.status==='pending').length;
  if(pending) todos.push(`${pending} מוזמנים עדיין ממתינים לתשובה — כדאי לעקוב אחריהם`);
  const openBalance = state.vendors.reduce((s,v)=>s+((v.cost||0)-(v.deposit||0)),0);
  if(openBalance>0) todos.push(`נותר לשלם לספקים ${money(openBalance)} בסה״כ`);
  if(!todos.length) todos.push('הכל מסודר כרגע — כל הכבוד! 🤍');
  document.getElementById('ov-todo').innerHTML = todos.map(t=>'• '+t).join('<br>');
}
