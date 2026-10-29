// ══════════════════════════════════════════════════════════════
// 로그인 / 세션 관리
// ══════════════════════════════════════════════════════════════

var _loginPromise = null, _loginResolve = null;

function _setAuthed(on) {
  document.body.classList.toggle('authed', !!on);
}

/* 로그인 화면 표시 → 로그인 성공 시 resolve */
function showLogin() {
  if (_loginPromise) return _loginPromise;
  _setAuthed(false);
  var pwEl = document.getElementById('login-pw');
  var errEl = document.getElementById('login-error');
  if (pwEl) pwEl.value = '';
  if (errEl) errEl.textContent = '';
  var idEl = document.getElementById('login-id');
  if (idEl) setTimeout(function() { (idEl.value ? pwEl : idEl).focus(); }, 50);
  _loginPromise = new Promise(function(resolve) { _loginResolve = resolve; });
  return _loginPromise;
}

function doLogin(e) {
  if (e) e.preventDefault();
  var id = document.getElementById('login-id').value.trim();
  var pw = document.getElementById('login-pw').value;
  var errEl = document.getElementById('login-error');
  var btn = document.getElementById('login-btn');
  if (!id || !pw) { errEl.textContent = t('login_err_empty'); return false; }
  btn.disabled = true; errEl.textContent = '';
  _postAPI('login', { id: id, password: pw }).then(function(r) {
    btn.disabled = false;
    if (r && r.success && r.token) {
      setAuthToken(r.token);
      try { localStorage.setItem('loginId', id); } catch (ex) {}
      document.getElementById('login-pw').value = '';
      _setAuthed(true);
      var res = _loginResolve;
      _loginPromise = null; _loginResolve = null;
      if (res) res();
    } else {
      errEl.textContent = (r && r.error) || t('login_err_failed');
    }
  });
  return false;
}

function doLogout() {
  if (!confirm(t('logout_confirm'))) return;
  _postAPI('logout', {}).then(function() {
    setAuthToken('');
    showLogin();
  });
}

/* 앱 시작 시: 저장된 세션이 유효하면 바로 진입, 아니면 로그인 화면 */
document.addEventListener('DOMContentLoaded', function() {
  try {
    var savedId = localStorage.getItem('loginId');
    if (savedId) document.getElementById('login-id').value = savedId;
  } catch (e) {}
  if (!getAuthToken()) { showLogin(); return; }
  _postAPI('ping', {}).then(function(r) {
    if (r && r.success) { _setAuthed(true); return; }
    if (r && r.authError) setAuthToken('');
    showLogin();
    if (r && !r.authError && r.error) document.getElementById('login-error').textContent = r.error;
  });
});
