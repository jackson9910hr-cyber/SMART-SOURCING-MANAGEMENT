// ══════════════════════════════════════════════════════════════
// AI 기능 (비밀번호 보호)
// ══════════════════════════════════════════════════════════════

var AI_STATE = {
  page: 1, messages: [], isOpen: false,
  isMaximized: false, isMinimized: false, isSending: false
};

/* ══ AI 비밀번호 확인 ══ */
function isAiUnlocked() { return sessionStorage.getItem('aiUnlocked') === 'true'; }

function requireAiAuth(callback) {
  if (isAiUnlocked()) { callback(); return; }
  var modal = document.getElementById('m-ai-pw');
  if (!modal) { callback(); return; }
  document.getElementById('ai-pw-input').value = '';
  document.getElementById('ai-pw-error').style.display = 'none';
  openModal('m-ai-pw');
  var confirmBtn = document.getElementById('ai-pw-confirm');
  var newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.addEventListener('click', function() {
    var pw = document.getElementById('ai-pw-input').value.trim();
    if (!pw) { document.getElementById('ai-pw-error').style.display = 'block'; document.getElementById('ai-pw-error').textContent = '비밀번호를 입력하세요.'; return; }
    showToast('확인 중...');
    callAPI('verifyAiPassword', { password: pw }).then(function(r) {
      if (r && r.success && r.verified) {
        sessionStorage.setItem('aiUnlocked', 'true');
        closeModal('m-ai-pw');
        showToast('AI 기능이 활성화되었습니다.');
        callback();
      } else {
        document.getElementById('ai-pw-error').style.display = 'block';
        document.getElementById('ai-pw-error').textContent = '비밀번호가 올바르지 않습니다.';
      }
    }).catch(function() {
      document.getElementById('ai-pw-error').style.display = 'block';
      document.getElementById('ai-pw-error').textContent = '서버 연결 오류가 발생했습니다.';
    });
  });
  document.getElementById('ai-pw-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') newBtn.click();
  }, { once: true });
}

/* ══ AI 채팅 팝업 ══ */
function openAiChat(pg) {
  requireAiAuth(function() { _doOpenAiChat(pg); });
}

function _doOpenAiChat(pg) {
  AI_STATE.page = pg; AI_STATE.messages = [];
  var popup = document.getElementById('ai-chat-popup');
  var body  = document.getElementById('ai-chat-body'); body.innerHTML = '';
  document.getElementById('ai-chat-title-text').textContent =
    pg === 1 ? "Jackson's AI활용 - 협력사 미팅 협의록" :
    pg === 2 ? "Jackson's AI활용 - 업체/품목별 부하관리" :
               "Jackson's AI활용 - 메모/노트";
  if (!AI_STATE.isOpen) {
    popup.style.right = '20px'; popup.style.bottom = '20px'; popup.style.left = ''; popup.style.top = '';
    AI_STATE.isMaximized = false; AI_STATE.isMinimized = false;
    popup.classList.remove('maximized', 'minimized');
  }
  popup.classList.add('active'); AI_STATE.isOpen = true; AI_STATE.isMinimized = false;
  popup.style.display = 'flex';
  popup.classList.remove('minimized');
  document.getElementById('ai-chat-body').style.display = 'flex';
  document.getElementById('ai-chat-input-wrap').style.display = 'flex';
  document.getElementById('ai-suggest-wrap').style.display = 'flex';
  document.getElementById('ai-suggest-load-btn').style.display = pg === 2 ? 'inline-flex' : 'none';
  document.querySelectorAll('.ai-suggest-btn:not(#ai-suggest-load-btn)').forEach(function(b) {
    b.style.display = pg === 1 ? '' : 'none';
  });
  document.getElementById('ai-suggest-wrap').style.display = (pg === 3) ? 'none' : 'flex';
  addAiMsg('system', '준비 중...');
  AI_STATE.messages = [{ role: 'system', content: buildFallbackPrompt(pg) }];
  body.innerHTML = '';
  addAiMsg('system', '📊 AI 어시스턴트가 준비되었습니다. 현재 탭의 데이터에 대해 질문하세요!');
  setTimeout(function() { document.getElementById('ai-chat-input').focus(); }, 200);
}

function closeAiChat() {
  var popup = document.getElementById('ai-chat-popup');
  popup.classList.remove('active', 'maximized', 'minimized'); popup.style.display = 'none';
  AI_STATE.isOpen = false; AI_STATE.isMaximized = false; AI_STATE.isMinimized = false;
}

function minimizeAiChat() {
  var popup = document.getElementById('ai-chat-popup');
  var body  = document.getElementById('ai-chat-body');
  var inputWrap    = document.getElementById('ai-chat-input-wrap');
  var suggestWrap  = document.getElementById('ai-suggest-wrap');
  if (AI_STATE.isMinimized) {
    popup.classList.remove('minimized'); body.style.display = 'flex';
    inputWrap.style.display = 'flex';
    if (suggestWrap && AI_STATE.page === 1) suggestWrap.style.display = 'flex';
    AI_STATE.isMinimized = false; document.getElementById('ai-min-btn').textContent = '─';
  } else {
    if (AI_STATE.isMaximized) toggleMaximizeAiChat();
    popup.classList.add('minimized'); body.style.display = 'none';
    inputWrap.style.display = 'none'; if (suggestWrap) suggestWrap.style.display = 'none';
    AI_STATE.isMinimized = true; document.getElementById('ai-min-btn').textContent = '□';
  }
}

function toggleMaximizeAiChat() {
  var popup = document.getElementById('ai-chat-popup');
  if (AI_STATE.isMaximized) {
    popup.classList.remove('maximized'); AI_STATE.isMaximized = false; document.getElementById('ai-max-btn').textContent = '□';
  } else {
    popup.classList.add('maximized'); AI_STATE.isMaximized = true; AI_STATE.isMinimized = false;
    document.getElementById('ai-chat-body').style.display = 'flex';
    document.getElementById('ai-chat-input-wrap').style.display = 'flex';
    document.getElementById('ai-max-btn').textContent = '❐'; popup.classList.remove('minimized');
  }
}

function addAiMsg(role, text) {
  var body = document.getElementById('ai-chat-body');
  var div = document.createElement('div'); div.className = 'ai-msg ' + role; div.textContent = text;
  body.appendChild(div); body.scrollTop = body.scrollHeight; return div;
}

function buildFallbackPrompt(pg) {
  var today = todayStr();
  var pageName = pg === 1 ? '협력사 미팅 협의록' : pg === 2 ? '업체/품목별 부하관리' : '메모/노트';
  return [
    '당신은 두산에너빌리티 Sourcing팀 협력사 공정관리 전문 AI 어시스턴트입니다.',
    '현재 날짜: ' + today,
    '현재 페이지: ' + pageName,
    '',
    '제조업 공정관리, 납기 관리, 공정 진도율 분석 전문가로서 전문적이고 실용적인 조언을 한국어로 제공하세요.',
    '사용자가 현재 앱에 입력한 데이터를 분석 요청하면, 데이터를 직접 붙여넣어 달라고 안내하거나,',
    '일반적인 공정관리 관련 조언을 제공하세요.'
  ].join('\n');
}

function sendAiMessage() {
  if (AI_STATE.isSending) return;
  var input = document.getElementById('ai-chat-input');
  var msg = input.value.trim(); if (!msg) return;
  input.value = ''; input.style.height = '38px';
  addAiMsg('user', msg); AI_STATE.messages.push({ role: 'user', content: msg });
  AI_STATE.isSending = true; document.getElementById('ai-chat-send').disabled = true;
  var loadingDiv = addAiMsg('loading', 'AI가 분석 중...');
  var aiPw = sessionStorage.getItem('aiPassword') || '';
  callAPI('callOpenAI', {
    messages: AI_STATE.messages, model: 'gpt-4o', max_tokens: 4000, temperature: 0.1,
    aiPassword: aiPw
  }).then(function(r) {
    loadingDiv.remove();
    if (r && r.success) {
      var reply = r.reply || '(응답 없음)';
      AI_STATE.messages.push({ role: 'assistant', content: reply });
      addAiMsg('assistant', reply);
    } else {
      addAiMsg('system', '⚠ 오류: ' + (r && r.error ? r.error : '알 수 없는 오류'));
    }
    AI_STATE.isSending = false; document.getElementById('ai-chat-send').disabled = false;
  });
}

function aiSuggest(type) {
  if (!AI_STATE.messages || !AI_STATE.messages.length) { showToast('AI가 아직 준비 중입니다.', true); return; }
  var NL = '\n';
  var msg = '';
  if (type === 'action') {
    msg = ['협력사별 Action 사항을 정리해줘.', '', '현재 앱의 탭1(협력사 미팅 협의록) 데이터에서:',
      '- ~할 것, ~예정, ~필요, ~확인, ~조치, ~제출 포함 문장',
      '- [R]...[/R] 빨간글씨 태그 포함 내용',
      '- 날짜 패턴 포함 문장을 우선 추출',
      '', '데이터가 없으면, 협력사 공정관리에서 일반적으로 중요한 Action 사항 유형을 설명해줘.'].join(NL);
  } else if (type === 'issue') {
    msg = ['업체별 이슈사항을 보고해줘.', '', '이슈 유형:', '- 납기 초과 (가능납기 > 고객납기 또는 요구납기)', '- 빨간글씨([R]...[/R]) 태그 내용', '- 지연, 불가, 중단, 문제, 미완성, 지체 키워드', '', '데이터가 없으면 공정관리 이슈 분석 방법을 안내해줘.'].join(NL);
  } else if (type === 'load') {
    msg = ['현재 업체/품목별 부하관리 데이터를 분석해줘.', '', '각 업체별:', '- 총 품목 수', '- 제작 기간이 겹치는 시점(부하 집중 시기)', '- 요구납기 대비 완료일 초과 여부', '', '데이터가 없으면 부하관리 분석 방법을 안내해줘.'].join(NL);
  }
  if (!msg) return;
  var inputEl = document.getElementById('ai-chat-input');
  inputEl.value = msg; sendAiMessage();
}

/* ══ P1 AI 수정 ══ */
var _p1AiReviewResult = '';

function openP1AiReview() {
  requireAiAuth(function() { _doOpenP1AiReview(); });
}

function _doOpenP1AiReview() {
  var rows = getData1();
  if (!rows.length) { showToast('협의록 데이터를 먼저 입력하세요', true); return; }
  var popup = document.getElementById('p1-ai-review-popup');
  var el = document.getElementById('p1-ai-review-content');
  el.textContent = 'AI가 검토 중입니다...';
  var box = document.getElementById('p1-ai-review-box');
  box.style.left = ''; box.style.top = ''; box.style.position = 'relative';
  popup.style.display = 'flex';
  document.getElementById('p1-ai-review-body').style.display = 'block';
  var NL = '\n';
  var colNames = ['프로젝트','품목명','업체명','고객납기','PO납기','요구납기','가능납기','제작현황','비고'];
  var dataLines = [];
  rows.forEach(function(r, i) {
    var parts = [];
    colNames.forEach(function(col, ci) {
      var v = r[ci] || ''; if (v) { var vMarked = v.split('\n').join('|br|'); parts.push(col + ': ' + vMarked); }
    });
    if (parts.length) dataLines.push((i + 1) + '. ' + parts.join(' / '));
  });
  var summary = document.getElementById('p1sum').value || '';
  var sys = [
    '당신은 두산에너빌리티 Sourcing팀 협력사 미팅 협의록 작성 전문 비서입니다.',
    '아래 협의록 데이터를 임원 및 협력업체에 공식 배포 가능한 회의록 최종본 수준으로 다듬어 주세요.',
    '', '## 다듬기 기준',
    '- 문체: 격식체 완결형으로 통일 (~함, ~됨, ~예정, ~확인됨, ~요청함)',
    '- 맞춤법/띄어쓰기: 표준어 기준으로 교정',
    '- 비문 제거 및 간결화', '- 전문 용어 활용 (착수, 완료, 납기, 검사, 출하, 조달)',
    '', '## 절대 변경 금지',
    '- 납기 날짜(YYYY-MM-DD): 원본 그대로 유지', '- 업체명, 프로젝트명, 품목명: 원본 그대로 유지',
    '- 없는 내용 추가 금지',
    '', '## 출력 형식',
    '반드시 JSON 배열 형식으로만 응답. 각 객체: {proj, item, vend, cd, pod, rd, avd, stat, rmk}',
    '줄바꿈은 \\n으로, |br| 마커는 \\n으로 변환. [R]...[/R] 태그는 제거(내용 유지).',
    '', '## 출력 예시',
    '[{"proj":"QFE#1","item":"Seal Oil Unit","vend":"엔알텍","cd":"2026-05-30","pod":"","rd":"2026-04-30","avd":"2026-06-01","stat":"성형 작업 완료됨\\n용접 착수 예정","rmk":""}]'
  ].join(NL);
  var userMsg = '## 회의결과 Summary\n' + summary + '\n\n## 협의록 데이터\n' + dataLines.join('\n');
  var aiPw = sessionStorage.getItem('aiPassword') || '';
  callAPI('callOpenAI', {
    messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
    model: 'gpt-4o', max_tokens: 4000, temperature: 0.1, aiPassword: aiPw
  }).then(function(r) {
    if (r && r.success) {
      _p1AiReviewResult = r.reply || '';
      _p1AiRenderTable(_p1AiReviewResult, el);
    } else {
      el.textContent = '오류: ' + (r && r.error ? r.error : '알 수 없는 오류');
    }
  });
}

function _p1AiRenderTable(jsonStr, el) {
  var parsed = null;
  try {
    var clean = jsonStr.trim();
    var s = clean.indexOf('['), e2 = clean.lastIndexOf(']');
    if (s >= 0 && e2 > s) clean = clean.slice(s, e2 + 1);
    parsed = JSON.parse(clean);
  } catch(ex) { el.textContent = jsonStr; return; }
  if (!Array.isArray(parsed) || !parsed.length) { el.textContent = jsonStr; return; }
  var cols = [
    {k:'proj',label:'프로젝트'},{k:'item',label:'품목명'},{k:'vend',label:'업체명'},
    {k:'cd',label:'고객납기'},{k:'pod',label:'PO납기'},{k:'rd',label:'요구납기'},
    {k:'avd',label:'가능납기'},{k:'stat',label:'제작현황'},{k:'rmk',label:'비고'}
  ];
  var tbl = document.createElement('table');
  tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;font-family:Noto Sans KR,sans-serif';
  var thead = document.createElement('thead'), trh = document.createElement('tr');
  trh.style.background = '#c4d8f0';
  var thN = document.createElement('th'); thN.style.cssText = 'padding:6px 8px;border:1px solid #8ab8d8;text-align:center;font-weight:700;white-space:nowrap'; thN.textContent = '#'; trh.appendChild(thN);
  cols.forEach(function(c) {
    var th = document.createElement('th'); th.style.cssText = 'padding:6px 8px;border:1px solid #8ab8d8;text-align:center;font-weight:700;white-space:nowrap'; th.textContent = c.label; trh.appendChild(th);
  });
  thead.appendChild(trh); tbl.appendChild(thead);
  var tbody = document.createElement('tbody');
  parsed.forEach(function(row, i) {
    var tr = document.createElement('tr'); tr.style.background = i % 2 === 0 ? '#fff' : '#f4f8fd';
    var tdN = document.createElement('td'); tdN.style.cssText = 'padding:6px 8px;border:1px solid #8ab8d8;text-align:center;color:#4a6a88;font-size:11px'; tdN.textContent = i + 1; tr.appendChild(tdN);
    cols.forEach(function(c) {
      var td = document.createElement('td'); td.style.cssText = 'padding:6px 8px;border:1px solid #8ab8d8;vertical-align:top;word-break:break-word';
      var val = row[c.k] || '';
      if (c.k === 'stat' || c.k === 'rmk') { td.innerHTML = val.split('\n').map(function(line) { return line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }).join('<br>'); }
      else { td.textContent = val; }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  el.innerHTML = ''; el.style.background = 'transparent'; el.style.border = 'none'; el.style.padding = '0';
  el.appendChild(tbl);
}

function p1AiReviewMinimize() {
  var body = document.getElementById('p1-ai-review-body'), box = document.getElementById('p1-ai-review-box');
  if (body.style.display === 'none') { body.style.display = 'block'; box.style.maxHeight = '86vh'; }
  else { body.style.display = 'none'; box.style.maxHeight = 'auto'; }
}

function p1AiReviewCopy() {
  if (!_p1AiReviewResult) { showToast('복사할 내용이 없습니다', true); return; }
  if (navigator.clipboard) { navigator.clipboard.writeText(_p1AiReviewResult).then(function() { showToast('클립보드에 복사되었습니다'); }); }
  else { var ta = document.createElement('textarea'); ta.value = _p1AiReviewResult; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); showToast('복사되었습니다'); } catch(ex) {} document.body.removeChild(ta); }
}

function p1AiReviewApply() {
  if (!_p1AiReviewResult) { showToast('적용할 내용이 없습니다', true); return; }
  var parsed = null;
  try { var clean = _p1AiReviewResult.trim(); var s = clean.indexOf('['), e2 = clean.lastIndexOf(']'); if (s >= 0 && e2 > s) clean = clean.slice(s, e2 + 1); parsed = JSON.parse(clean); } catch(ex) { parsed = null; }
  if (!parsed || !Array.isArray(parsed) || !parsed.length) { showToast('AI 결과를 적용할 수 없습니다. 복사 후 수동으로 수정해주세요.', true); return; }
  var colKeys = ['proj','item','vend','cd','pod','rd','avd','stat','rmk'];
  var tbody = document.getElementById('tb1'), existingRows = tbody.rows;
  parsed.forEach(function(rowData, i) {
    if (i >= existingRows.length) return;
    var tas = existingRows[i].querySelectorAll('textarea');
    colKeys.forEach(function(k, ci) {
      if (ci < tas.length) { tas[ci].value = rowData[k] || ''; arTA(tas[ci]); updateRedOverlay(tas[ci]); }
    });
  });
  checkOverdue1(); setDirty(1);
  document.getElementById('p1-ai-review-popup').style.display = 'none';
  showToast('협의록 테이블에 AI 수정 내용이 반영되었습니다');
}

/* ══ 팝업 드래그 이동 공통 헬퍼 ══ */
function makeDraggable(hdr, box, opts) {
  opts = opts || {};
  if (!hdr || !box) return;
  var dragging = false, ox = 0, oy = 0, bx = 0, by = 0;
  hdr.addEventListener('mousedown', function(e) {
    if (opts.canDrag && !opts.canDrag()) return;
    if (e.target.tagName === 'BUTTON') return;
    var r = box.getBoundingClientRect(); ox = e.clientX; oy = e.clientY; bx = r.left; by = r.top;
    dragging = true;
    if (opts.onStart) opts.onStart(r);
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', stopDrag); e.preventDefault();
  });
  function onMove(e) { if (!dragging) return; box.style.left = Math.max(0, bx + e.clientX - ox) + 'px'; box.style.top = Math.max(0, by + e.clientY - oy) + 'px'; }
  function stopDrag() { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', stopDrag); }
}

/* ══ AI 드래그 이동 (채팅 팝업) ══ */
(function() {
  var hdr = document.getElementById('ai-chat-hdr'), popup = document.getElementById('ai-chat-popup');
  makeDraggable(hdr, popup, {
    canDrag: function() { return !AI_STATE.isMaximized; },
    onStart: function(rect) {
      popup.style.left = rect.left + 'px'; popup.style.top = rect.top + 'px'; popup.style.right = ''; popup.style.bottom = '';
    }
  });
})();

/* ══ AI Review 드래그 이동 ══ */
(function() {
  function initDrag() {
    var hdr = document.getElementById('p1-ai-review-hdr'), box = document.getElementById('p1-ai-review-box');
    makeDraggable(hdr, box, {
      onStart: function() { box.style.position = 'fixed'; box.style.margin = '0'; }
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDrag); }
  else { setTimeout(initDrag, 300); }
})();

/* ══ AI 채팅 입력 이벤트 ══ */
document.addEventListener('DOMContentLoaded', function() {
  var aiInput = document.getElementById('ai-chat-input');
  if (aiInput) {
    aiInput.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } });
    aiInput.addEventListener('input', function() { this.style.height = '38px'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; });
  }
});
