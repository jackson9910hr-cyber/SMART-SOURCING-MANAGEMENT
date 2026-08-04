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
  tx.textContent = MEMO_STATE.name ? t('status_unsaved_modified') : t('status_unsaved_prompt');
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
  if (!confirm(t('confirm_memo_clear'))) return;
  memoSetFields({ date:'', place:'', attendees:'', title:'', content:'', content2:'', issues:'', actions:'', remarks:'' });
  MEMO_STATE.saved = false; MEMO_STATE.name = '';
  var el = document.getElementById('ss3'), tx = document.getElementById('ss3t');
  if (el) el.className = 'sstat unsaved';
  if (tx) tx.textContent = t('status_unsaved_prompt');
}

function memoOpenLoad() {
  APP.loadFor = 3; APP.loadSel = '';
  var ll = document.getElementById('llist');
  ll.innerHTML = '<div style="color:var(--txt3);font-size:13px;padding:14px;text-align:center">' + escH(t('loading')) + '</div>';
  openModal('m-load');
  callAPI('loadMemoList').then(function(r) {
    ll.innerHTML = '';
    if (!r || !r.success) { ll.innerHTML = '<div style="color:var(--warn);padding:12px">' + escH(t('toast_error_prefix')) + escH(r ? r.error : '') + '</div>'; return; }
    if (!r.list || !r.list.length) { ll.innerHTML = '<div style="color:var(--txt3);padding:12px;text-align:center">' + escH(t('toast_no_saved_files')) + '</div>'; return; }
    var sorted = r.list.slice().sort(function(a, b) { return b.name > a.name ? 1 : b.name < a.name ? -1 : 0; });
    sorted.forEach(function(item) {
      var d = document.createElement('div'); d.className = 'litem';
      var ab = item.author ? '<span class="litem-author">' + escH(item.author) + '</span>' : '';
      d.innerHTML = '<span class="litem-name">' + escH(item.name) + '</span>' + ab + '<span class="litem-date">' + escH((item.date||'').slice(0,10)) + '</span>';
      d.onclick = function() { ll.querySelectorAll('.litem').forEach(function(x) { x.classList.remove('sel'); }); d.classList.add('sel'); APP.loadSel = item.name; };
      ll.appendChild(d);
    });
  });
}

function memoExecLoad() {
  if (!APP.loadSel) { showToast(t('toast_select_file_to_load'), true); return; }
  var nm = APP.loadSel; closeModal('m-load'); showToast(t('loading'));
  callAPI('loadMemo', { fileName: nm }).then(function(r) {
    if (!r.success) { showToast(t('toast_error_prefix') + r.error, true); return; }
    memoSetFields(r.fields || {});
    if (r.options) { MEMO_STATE.options = Object.assign({ showContent2: true, showIssues: true, showActions: true }, r.options); memoApplyOptions(); }
    memoClean(nm); showToast(t('toast_load_done_prefix') + nm);
  });
}

function memoExecSave(fn, author) {
  callAPI('saveMemo', {
    fileName: fn,
    fields: memoGetFields(),
    options: MEMO_STATE.options,
    author: author || ''
  }).then(function(r) {
    if (r.success) { memoClean(fn); var au = r.savedAuthor !== undefined ? r.savedAuthor : ''; showToast(t('toast_save_done_prefix') + fn + (au ? t('toast_author_bracket_prefix') + au + ']' : '')); }
    else showToast(t('toast_error_prefix') + r.error, true);
  });
}

function openMemoOptions() {
  var ks = { showContent2: 'ck-memo-content2', showIssues: 'ck-memo-issues', showActions: 'ck-memo-actions' };
  Object.keys(ks).forEach(function(k) {
    var el = document.getElementById(ks[k]); if (el) el.checked = !!MEMO_STATE.options[k];
  });
  openModal('m-memo-opts');
}

function applyMemoOption(k) {
  MEMO_STATE.options[k] = document.getElementById({ showContent2:'ck-memo-content2', showIssues:'ck-memo-issues', showActions:'ck-memo-actions' }[k]).checked;
  memoApplyOptions(); memoDirty();
}

function applyRedTextMemo() {
  if (_lastTA && document.getElementById('page3').contains(_lastTA)) { insertRedMarker(_lastTA, _lastTASel); }
  else showToast(t('toast_select_memo_text'), true);
}

function memoFullscreen() {
  var fc = document.getElementById('fscnt'); fc.innerHTML = '';
  var f = memoGetFields();
  var hd = document.createElement('div');
  hd.style.cssText = 'font-family:var(--fh);font-size:20px;font-weight:700;color:var(--accentD);letter-spacing:2px;margin-bottom:18px;padding-bottom:9px;border-bottom:2px solid var(--panel)';
  hd.textContent = '◈ ' + t('tab3_title') + (f.title ? ' — ' + f.title : ''); fc.appendChild(hd);
  var tbl = document.createElement('table');
  tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px;font-family:Noto Sans KR,sans-serif;border:1px solid #a8c4e0';
  var dateVal = (function(s) {
    if (!s) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var d = new Date(s); if (isNaN(d.getTime())) return s;
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })(f.date);
  var rows = [
    { label: t('memo_fs_title_lbl'), val: f.title }, { label: t('memo_fs_date_lbl'), val: dateVal },
    { label: t('memo_fs_place_lbl'), val: f.place }, { label: t('memo_fs_attendees_lbl'), val: f.attendees },
    { label: t('memo_fs_content_lbl'), val: f.content }
  ];
  if (MEMO_STATE.options.showContent2 && f.content2) rows.push({ label: t('memo_fs_content2_lbl'), val: f.content2 });
  if (MEMO_STATE.options.showIssues && f.issues) rows.push({ label: t('memo_fs_issues_lbl'), val: f.issues });
  if (MEMO_STATE.options.showActions && f.actions) rows.push({ label: t('memo_fs_actions_lbl'), val: f.actions });
  if (f.remarks) rows.push({ label: t('memo_fs_remarks_lbl'), val: f.remarks });
  rows.forEach(function(fld) {
    var tr = document.createElement('tr');
    var th = document.createElement('td');
    th.style.cssText = 'background:linear-gradient(160deg,#001f4d,#003580);color:#fff;font-family:Rajdhani,sans-serif;font-weight:700;font-size:13px;padding:10px 14px;width:110px;vertical-align:top;border-bottom:1px solid rgba(255,255,255,.4);border-right:2px solid rgba(255,255,255,.25);white-space:nowrap';
    th.textContent = fld.label;
    var td = document.createElement('td');
    td.style.cssText = 'background:#fff;color:#0d1e30;padding:10px 14px;border-bottom:1px solid #a8c4e0;font-size:14px;line-height:1.65;white-space:pre-wrap;vertical-align:top';
    td.textContent = fld.val || '';
    tr.appendChild(th); tr.appendChild(td); tbl.appendChild(tr);
  });
  fc.appendChild(tbl);
  document.getElementById('fsov').classList.add('active');
}

function openMemoAiReview() {
  requireAiAuth(function() {
    var f = memoGetFields();
    var parts = [];
    if (f.date) parts.push('일자: ' + f.date);
    if (f.place) parts.push('장소: ' + f.place);
    if (f.attendees) parts.push('참석자: ' + f.attendees);
    if (f.title) parts.push('제목: ' + f.title);
    if (f.content) parts.push('\n[회의 내용]\n' + f.content);
    if (f.content2) parts.push('\n[추가 내용]\n' + f.content2);
    if (f.issues) parts.push('\n[이슈사항]\n' + f.issues);
    if (f.actions) parts.push('\n[조치사항]\n' + f.actions);
    if (f.remarks) parts.push('\n[비고]\n' + f.remarks);
    if (!parts.length) { showToast(t('toast_enter_memo_first'), true); return; }
    _doOpenAiChat(3);
    setTimeout(function() {
      var el = document.getElementById('ai-chat-input');
      if (el) { el.value = '다음 메모/회의록을 격식체 완결형으로 다듬어 주세요. 맞춤법 교정, 비문 제거, 전문 용어 활용:\n\n' + parts.join('\n'); sendAiMessage(); }
    }, 350);
  });
}

function memoExportExcel() {
  if (typeof XLSX === 'undefined') { showToast(t('toast_lib_loading'), true); return; }
  var f = memoGetFields();
  var dateVal = (function(s) {
    if (!s) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var d = new Date(s); if (isNaN(d.getTime())) return s;
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })(f.date);
  var wsData = [
    ['■ ' + t('tab3_title') + ' — ' + (f.title || '')],
    [],
    [t('memo_xls_kind'), t('memo_xls_val')],
    [t('memo_xls_title'), f.title || ''],
    [t('memo_xls_date'), dateVal || ''],
    [t('memo_xls_place'), f.place || ''],
    [t('memo_xls_attendees'), f.attendees || ''],
    [t('memo_xls_content'), f.content || '']
  ];
  if (MEMO_STATE.options.showContent2 && f.content2) wsData.push([t('memo_xls_content2'), f.content2]);
  if (MEMO_STATE.options.showIssues   && f.issues)   wsData.push([t('memo_xls_issues'), f.issues]);
  if (MEMO_STATE.options.showActions  && f.actions)  wsData.push([t('memo_xls_actions'), f.actions]);
  if (f.remarks) wsData.push([t('memo_xls_remarks'), f.remarks]);
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 12 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws, t('sheet_name3'));
  XLSX.writeFile(wb, todayStr() + t('fname_suffix3') + '.xlsx');
  showToast(t('toast_excel_done'));
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
});
