// Accessible confirm modal, replacing window.confirm().
// Usage: const ok = await confirmAction('למחוק את X?'); if(ok){ ... }
let _confirmResolve = null;
let _confirmTriggerEl = null;

function confirmAction(message){
  const overlay = document.getElementById('confirmModal');
  document.getElementById('confirmModalMsg').textContent = message;
  _confirmTriggerEl = document.activeElement;
  overlay.hidden = false;
  document.addEventListener('keydown', _onConfirmKeydown);
  document.getElementById('confirmModalOk').focus();
  return new Promise(resolve => { _confirmResolve = resolve; });
}

function _closeConfirmModal(result){
  const overlay = document.getElementById('confirmModal');
  overlay.hidden = true;
  document.removeEventListener('keydown', _onConfirmKeydown);
  if(_confirmTriggerEl && typeof _confirmTriggerEl.focus === 'function') _confirmTriggerEl.focus();
  if(_confirmResolve){ _confirmResolve(result); _confirmResolve = null; }
}

function _onConfirmKeydown(e){
  if(e.key === 'Escape'){ _closeConfirmModal(false); return; }
  if(e.key === 'Tab'){
    const focusables = [document.getElementById('confirmModalCancel'), document.getElementById('confirmModalOk')];
    const first = focusables[0], last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
}

document.getElementById('confirmModalOk').addEventListener('click', () => _closeConfirmModal(true));
document.getElementById('confirmModalCancel').addEventListener('click', () => _closeConfirmModal(false));
document.getElementById('confirmModal').addEventListener('click', (e) => {
  if(e.target.id === 'confirmModal') _closeConfirmModal(false);
});
