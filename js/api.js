// ══ GAS API 호출 공통 함수 ══

var API_TIMEOUT_MS = 25000;

function fetchWithTimeout(url, opts, timeoutMs) {
  var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = controller ? setTimeout(function() { controller.abort(); }, timeoutMs) : null;
  if (controller) opts.signal = controller.signal;
  return fetch(url, opts).finally(function() { if (timer) clearTimeout(timer); });
}

function callAPIOnce(action, payload) {
  return fetchWithTimeout(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: action, payload: payload || {} })
  }, API_TIMEOUT_MS)
  .then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

// 응답이 느리거나(타임아웃) 일시적 네트워크 오류일 때 1회 자동 재시도한다.
// 조회(list/load) 계열은 부작용이 없어 재시도가 안전하고,
// 저장/삭제(meeting/load/memo)는 GAS 쪽에서 먼저 기존 데이터를 지우고 다시 쓰므로 재시도해도 중복되지 않는다.
// 메일 발송/AI 호출처럼 재시도 시 중복 부작용(메일 2통 발송, AI 비용 2배)이 생기는 액션은 재시도하지 않는다.
var RETRYABLE_ACTIONS = {
  loadMeetingList: 1, loadMeeting: 1, deleteMeeting: 1, saveMeeting: 1,
  loadLoadList: 1, loadLoad: 1, deleteLoad: 1, saveLoad: 1,
  loadMemoList: 1, loadMemo: 1, deleteMemo: 1, saveMemo: 1,
  verifyAiPassword: 1
};

function callAPI(action, payload) {
  if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'YOUR_GAS_DEPLOYMENT_URL_HERE') {
    showToast('GAS URL이 설정되지 않았습니다. js/config.js에서 GAS_URL을 설정하세요.', true);
    return Promise.resolve({ success: false, error: 'GAS URL not configured' });
  }
  var canRetry = !!RETRYABLE_ACTIONS[action];
  return callAPIOnce(action, payload).catch(function(err) {
    if (!canRetry) throw err;
    return callAPIOnce(action, payload);
  }).catch(function(err) {
    var msg = (err && err.name === 'AbortError')
      ? '응답 시간이 초과되었습니다. 네트워크 상태를 확인 후 다시 시도해주세요.'
      : String(err);
    return { success: false, error: msg };
  });
}
