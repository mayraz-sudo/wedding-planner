// Shared helpers used across every feature module.

function uid(){
  if(window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function nowIso(){ return new Date().toISOString(); }

function money(n){ return '₪' + Number(n||0).toLocaleString('he-IL'); }

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

// Lenient on purpose: contacts can be international, formats vary (spaces/dashes/parens/+).
// Optional field — empty is valid; only reject strings that don't look like a phone number at all.
function isValidPhone(v){
  if(!v) return true;
  const digits = v.replace(/[^\d]/g,'');
  return digits.length >= 9 && digits.length <= 13;
}
function isValidEmail(v){
  if(!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidUrl(v){
  if(!v) return true;
  return /^https?:\/\/.+/i.test(v.trim());
}

function setFieldValidity(inputId, errorId, valid, message){
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  input.classList.toggle('invalid', !valid);
  input.setAttribute('aria-invalid', String(!valid));
  error.textContent = valid ? '' : message;
}
