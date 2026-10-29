// ══ GAS API 호출 공통 함수 ══

var AUTH_TOKEN_KEY = 'authToken';

function getAuthToken() {
  try { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch (e) { return ''; }
}

function setAuthToken(tok) {
  try {
    if (tok) localStorage.setItem(AUTH_TOKEN_KEY, tok);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {}
}

function _postAPI(action, payload) {
  if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'YOUR_GAS_DEPLOYMENT_URL_HERE') {
    showToast('GAS URL이 설정되지 않았습니다. js/config.js에서 GAS_URL을 설정하세요.', true);
    return Promise.resolve({ success: false, error: 'GAS URL not configured' });
  }
  var noCacheUrl = CONFIG.GAS_URL + (CONFIG.GAS_URL.indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now();
  return fetch(noCacheUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: action, payload: payload || {}, token: getAuthToken() }),
    cache: 'no-store'
  })
  .then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .catch(function(err) {
    var isNetworkErr = err instanceof TypeError;
    var msg = isNetworkErr
      ? 'GAS 웹앱 서버에 연결할 수 없습니다. Apps Script 배포 상태(활성 여부) 및 액세스 권한("모든 사용자")을 확인해주세요. (' + String(err) + ')'
      : String(err);
    return { success: false, error: msg };
  });
}

// 세션이 만료되면 로그인 화면을 띄우고, 다시 로그인한 뒤 같은 요청을 재시도한다.
// (작성 중인 화면 데이터는 그대로 유지됨)
function callAPI(action, payload) {
  return _postAPI(action, payload).then(function(r) {
    if (!r || !r.authError) return r;
    setAuthToken('');
    return showLogin().then(function() { return _postAPI(action, payload); });
  });
}
