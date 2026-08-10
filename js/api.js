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
    var isNetworkErr = err instanceof TypeError;
    var msg = isNetworkErr
      ? 'GAS 웹앱 서버에 연결할 수 없습니다. Apps Script 배포 상태(활성 여부) 및 액세스 권한("모든 사용자")을 확인해주세요. (' + String(err) + ')'
      : String(err);
    return { success: false, error: msg };
  });
}
