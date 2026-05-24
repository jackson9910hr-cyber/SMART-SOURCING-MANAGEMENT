// ══ GAS API 호출 공통 함수 ══

function callAPI(action, payload) {
  if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'YOUR_GAS_DEPLOYMENT_URL_HERE') {
    showToast('GAS URL이 설정되지 않았습니다. js/config.js에서 GAS_URL을 설정하세요.', true);
    return Promise.resolve({ success: false, error: 'GAS URL not configured' });
  }
  return fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: action, payload: payload || {} })
  })
  .then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .catch(function(err) {
    return { success: false, error: String(err) };
  });
}
