// ---- Budget ----
function computeBudgetTotals(){
  const vendorsTotal = state.vendors.reduce((s,v)=>s+(v.cost||0),0);
  const vendorsPaid = state.vendors.reduce((s,v)=>s+(v.deposit||0),0);
  const attractionsTotal = state.attractions.reduce((s,a)=>s+(a.price||0),0);
  const gettingReadyTotal = state.gettingReady.reduce((s,v)=>s+(v.price||0),0);
  return {
    vendorsTotal, vendorsPaid, attractionsTotal, gettingReadyTotal,
    total: vendorsTotal + attractionsTotal + gettingReadyTotal,
    // only vendors track payments today; attractions/getting-ready have no payment schedule yet
    paid: vendorsPaid
  };
}

function renderBudget(){
  const { vendorsTotal, vendorsPaid, attractionsTotal, gettingReadyTotal, total, paid } = computeBudgetTotals();

  document.getElementById('b-total').textContent = money(total);
  document.getElementById('b-paid').textContent = money(paid);
  document.getElementById('b-left').textContent = money(total-paid);

  document.getElementById('b-vendorsTotal').textContent = money(vendorsTotal);
  document.getElementById('b-attractionsTotal').textContent = money(attractionsTotal);
  document.getElementById('b-gettingReadyTotal').textContent = money(gettingReadyTotal);

  // ---- Expected gift income vs expenses ----
  const expectedIncome = state.guests.reduce((s,g)=>s+(g.giftAmount||0),0);
  const expectedBalance = expectedIncome - total;
  document.getElementById('b-expenses').textContent = money(total);
  document.getElementById('b-expectedIncome').textContent = money(expectedIncome);
  const balanceEl = document.getElementById('b-expectedBalance');
  balanceEl.textContent = (expectedBalance < 0 ? '-' : '') + money(Math.abs(expectedBalance));
  balanceEl.style.color = expectedBalance < 0 ? 'var(--danger)' : 'var(--sage-deep)';
  document.getElementById('b-expectedBalance-label').textContent = expectedBalance < 0 ? 'מאזן צפוי (גירעון)' : 'מאזן צפוי (עודף)';

  // "לפי ההתחייבות לאולם" deliberately uses the venue commitment number, not the guest list —
  // that's the whole point of this field: it must not move when guests are added/removed.
  const venueCommitmentInput = document.getElementById('b-venue-commitment');
  if(document.activeElement !== venueCommitmentInput){
    venueCommitmentInput.value = state.venueCommitment || '';
  }
  const venueCommitment = state.venueCommitment || 0;
  document.getElementById('b-perInvited').textContent = venueCommitment > 0 ? money(Math.round(total/venueCommitment)) : '₪0';

  const confirmedCount = state.guests.filter(g=>g.status==='confirmed').reduce((s,g)=>s+(g.count||0),0);
  document.getElementById('b-perConfirmed').textContent = confirmedCount ? money(Math.round(total/confirmedCount)) : '₪0';

  // ---- Budget target + over-budget alert ----
  const targetInput = document.getElementById('b-target');
  if(document.activeElement !== targetInput){
    targetInput.value = state.budgetTarget || '';
  }
  const target = state.budgetTarget || 0;
  const bar = document.getElementById('b-target-bar');
  const status = document.getElementById('b-target-status');
  if(target <= 0){
    bar.style.width = '0%';
    bar.style.background = 'var(--rose)';
    status.textContent = 'לא הוגדר עדיין יעד תקציב. הגדירי יעד כדי לעקוב אחרי חריגות.';
    status.style.color = '#8A8378';
  }else{
    const pct = Math.round((total/target)*100);
    bar.style.width = Math.min(100, pct) + '%';
    if(total > target){
      bar.style.background = 'var(--danger)';
      status.textContent = `חריגה מהתקציב שהוגדר ב-${money(total-target)} (${pct}% מהיעד)`;
      status.style.color = 'var(--danger)';
    }else{
      bar.style.background = 'var(--sage)';
      status.textContent = `בתוך התקציב — נותרו ${money(target-total)} מהיעד (${pct}% מנוצל)`;
      status.style.color = 'var(--sage-deep)';
    }
  }

  // ---- Breakdown by category (vendor categories + attractions + getting-ready) ----
  const byCategory = {};
  state.vendors.forEach(v=>{
    byCategory[v.category] = (byCategory[v.category]||0) + (v.cost||0);
  });
  if(attractionsTotal > 0) byCategory['אטרקציות'] = attractionsTotal;
  if(gettingReadyTotal > 0) byCategory['וילות התארגנות'] = gettingReadyTotal;

  const container = document.getElementById('budgetBars');
  container.innerHTML = '';
  const cats = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
  document.getElementById('budgetEmpty').style.display = cats.length ? 'none' : 'block';
  cats.forEach(([cat, amt])=>{
    const pct = total ? Math.round((amt/total)*100) : 0;
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <div class="bar-top"><span>${escapeHtml(cat)}</span><span>${money(amt)} (${pct}%)</span></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
    `;
    container.appendChild(row);
  });
}

document.getElementById('budget-target-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const value = Math.max(0, Number(document.getElementById('b-target').value) || 0);
  state.budgetTarget = value;
  await storageAdapter.setSetting('budgetTarget', value);
  renderBudget();
  showToast('יעד התקציב נשמר', 'success');
});

document.getElementById('venue-commitment-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const value = Math.max(0, Number(document.getElementById('b-venue-commitment').value) || 0);
  state.venueCommitment = value;
  await storageAdapter.setSetting('venueCommitment', value);
  renderBudget();
  showToast('ההתחייבות לאולם נשמרה', 'success');
});
