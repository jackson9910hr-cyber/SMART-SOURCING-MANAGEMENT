// ══════════════════════════════════════════════════════════════
// 탭3: 메모/노트
// ══════════════════════════════════════════════════════════════

var MEMO_STATE = {
  saved: false,
  name: '',
  options: { showContent2: true, showIssues: true, showActions: true }
};

function memoDirty() {
  MEMO_STATE.saved = false;
  var el = document.getElementById('ss3'), tx = document.getElementById('ss3t');
  if (!el || !tx) return;
  el.className = 'sstat unsaved';
  tx.textContent = MEMO_STATE.name ? 'not saved_ 수정사항 발생' : 'not saved_ 저장하세요';
}

function memoClean(name) {
  MEMO_STATE.saved = true; MEMO_STATE.name = name;
  var el = document.getElementById('ss3'), tx = document.getElementById('ss3t');
  if (!el || !tx) return;
  el.className = 'sstat saved';
  tx.textContent = 'saved_ ' + name;
}

function memoGetFields() {
  return {
    date:      (document.getElementById('m3-date')      || {}).value || '',
    place:     (document.getElementById('m3-place')     || {}).value || '',
    attendees: (document.getElementById('m3-attendees') || {}).value || '',
    title:     (document.getElementById('m3-title')     || {}).value || '',
    content:   (document.getElementById('m3-content')   || {}).value || '',
    content2:  (document.getElementById('m3-content2')  || {}).value || '',
    issues:    (document.getElementById('m3-issues')    || {}).value || '',
    actions:   (document.getElementById('m3-actions')   || {}).value || '',
    remarks:   (document.getElementById('m3-remarks')   || {}).value || ''
  };
}

function memoSetFields(fields) {
  var map = {
    'm3-date': fields.date, 'm3-place': fields.place, 'm3-attendees': fields.attendees,
    'm3-title': fields.title, 'm3-content': fields.content, 'm3-content2': fields.content2,
    'm3-issues': fields.issues, 'm3-actions': fields.actions, 'm3-remarks': fields.remarks
  };
  Object.keys(map).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = map[id] || ''; if (el.tagName === 'TEXTAREA') arMemoTA(el); }
  });
}

function arMemoTA(ta) { if (!ta) return; ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }

function memoToggleSection(key) {
  MEMO_STATE.options[key] = !MEMO_STATE.options[key];
  memoApplyOptions();
  memoDirty();
}

function memoApplyOptions() {
  var secs = { showContent2: 'm3-sec-content2', showIssues: 'm3-sec-issues', showActions: 'm3-sec-actions' };
  var btns = { showContent2: 'btn-toggle-content2', showIssues: 'btn-toggle-issues', showActions: 'btn-toggle-actions' };
  Object.keys(secs).forEach(function(k) {
    var sec = document.getElementById(secs[k]), btn = document.getElementById(btns[k]);
    if (sec) sec.style.display = MEMO_STATE.options[k] ? '' : 'none';
    if (btn) {
      btn.textContent = MEMO_STATE.options[k] ? '숨기기' : '표시';
      btn.className = 'btn' + (MEMO_STATE.options[k] ? '' : ' org');
    }
  });
}

function memoClear() {
  if (!confirm('현재 내용을 모두 지우시겠습니까?')) return;
  memoSetFields({ date:'', place:'', attendees:'', title:'', content:'', content2:'', issues:'', actions:'', remarks:'' });
  MEMO_STATE.saved = false; MEMO_STATE.name = '';
  var el = document.getElementById('ss3'), tx = document.getElementById('ss3t');
  if (el) el.className = 'sstat unsaved';
  if (tx) tx.textContent = 'not saved_ 저장하세요';
}

function memoOpenLoad() {
  APP.loadFor = 3; APP.loadSel = '';
  var ll = document.getElementById('llist');
  ll.innerHTML = '<div style="color:var(--txt3);font-size:13px;padding:14px;text-align:center">불러오는 중...</div>';
  openModal('m-load');
  callAPI('loadMemoList').then(function(r) {
    ll.innerHTML = '';
    if (!r || !r.success) { ll.innerHTML = '<div style="color:var(--warn);padding:12px">오류: ' + escH(r ? r.error : '') + '</div>'; return; }
    if (!r.list || !r.list.length) { ll.innerHTML = '<div style="color:var(--txt3);padding:12px;text-align:center">저장된 파일이 없습니다.</div>'; return; }
    var sorted = r.list.slice().sort(function(a, b) { return b.name > a.name ? 1 : b.name < a.name ? -1 : 0; });
    sorted.forEach(function(item) {
      var d = document.createElement('div'); d.className = 'litem';
      d.innerHTML = '<span class="litem-name">' + escH(item.name) + '</span><span class="litem-date">' + escH(item.date) + '</span>';
      d.onclick = function() { ll.querySelectorAll('.litem').forEach(function(x) { x.classList.remove('sel'); }); d.classList.add('sel'); APP.loadSel = item.name; };
      ll.appendChild(d);
    });
  });
}

function memoExecLoad() {
  if (!APP.loadSel) { showToast('불러올 파일을 선택하세요', true); return; }
  var nm = APP.loadSel; closeModal('m-load'); showToast('불러오는 중...');
  callAPI('loadMemo', { fileName: nm }).then(function(r) {
    if (!r.success) { showToast('오류: ' + r.error, true); return; }
    memoSetFields(r.fields || {});
    if (r.options) { MEMO_STATE.options = Object.assign({ showContent2: true, showIssues: true, showActions: true }, r.options); memoApplyOptions(); }
    memoClean(nm); showToast('불러오기 완료: ' + nm);
  });
}

function memoExecSave(fn) {
  callAPI('saveMemo', {
    fileName: fn,
    fields: memoGetFields(),
    options: MEMO_STATE.options
  }).then(function(r) {
    if (r.success) { memoClean(fn); showToast('저장 완료: ' + fn); }
    else showToast('오류: ' + r.error, true);
  });
}

function memoExportText() {
  var f = memoGetFields();
  var lines = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('  ' + (f.title || '회의 메모'));
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (f.date) lines.push('일시: ' + f.date);
  if (f.place) lines.push('장소: ' + f.place);
  if (f.attendees) lines.push('참석자: ' + f.attendees);
  lines.push('');
  if (f.content) { lines.push('▶ 회의 내용'); lines.push(f.content); lines.push(''); }
  if (MEMO_STATE.options.showContent2 && f.content2) { lines.push('▶ 추가 내용'); lines.push(f.content2); lines.push(''); }
  if (MEMO_STATE.options.showIssues && f.issues) { lines.push('▶ 이슈사항'); lines.push(f.issues); lines.push(''); }
  if (MEMO_STATE.options.showActions && f.actions) { lines.push('▶ 조치사항'); lines.push(f.actions); lines.push(''); }
  if (f.remarks) { lines.push('▶ 비고'); lines.push(f.remarks); }
  var text = lines.join('\n');
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = todayStr() + '_메모.txt'; a.click();
  URL.revokeObjectURL(url);
  showToast('텍스트 파일 다운로드 완료');
}

// execLoad override for memo tab
var _origExecLoad = null;
document.addEventListener('DOMContentLoaded', function() {
  // 메모 textarea 자동 높이
  ['m3-attendees','m3-content','m3-content2','m3-issues','m3-actions','m3-remarks'].forEach(function(id) {
    var ta = document.getElementById(id); if (!ta) return;
    ta.addEventListener('input', function() { arMemoTA(ta); memoDirty(); });
    arMemoTA(ta);
  });
  ['m3-date','m3-place','m3-title'].forEach(function(id) {
    var inp = document.getElementById(id); if (!inp) return;
    inp.addEventListener('input', function() { memoDirty(); });
  });
  memoApplyOptions();

  // execLoad 모달의 불러오기 버튼이 탭3에서는 memoExecLoad를 호출하도록 오버라이드
  var loadBtn = document.getElementById('btn-exec-load');
  if (loadBtn) {
    loadBtn.addEventListener('click', function() {
      if (APP.loadFor === 3) { memoExecLoad(); } else { execLoad(); }
    });
  }
});
