// ══════════════════════════════════════════════════════════════
// 공통 상태 & 유틸리티
// ══════════════════════════════════════════════════════════════

var APP = {
  currentPage: 1,
  p1: { saved: false, name: '', colVis: { cd: true, pod: true, rd: true }, photos: [] },
  p2: { saved: false, name: '', pnames: ['','','',''], summary2: '', progress: {}, basedate: '' },
  p3: { saved: false, name: '' },
  saveFor: 1, loadFor: 1, loadSel: '', delFor: 1, delIdx: -1,
  lastRows: []
};

var PROC_COLORS = ['#f0b800','#e07800','#00a870','#1a88ff'];
var BAR_MAIN_COLOR = '#6bd3ff';

/* ══ 탭 전환 ══ */
function goTab(n) {
  APP.currentPage = n;
  [1,2,3].forEach(function(i) {
    var btn = document.getElementById('tabBtn' + i);
    var pg  = document.getElementById('page' + i);
    if (btn) btn.className = 'tab-btn' + (n === i ? ' active' : '');
    if (pg)  pg.className  = 'page'    + (n === i ? ' active' : '');
  });
}

/* ══ 유틸리티 ══ */
function todayStr() {
  var d = new Date(new Date().getTime() + 9 * 3600000);
  return d.toISOString().slice(0, 10);
}

function parseDate(s) {
  if (!s || !String(s).trim()) return null;
  var str = String(s).trim().replace(/\//g, '-');
  if (!/^\d{4}-\d{2}-\d{2}/.test(str)) return null;
  var d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function normDate(s) {
  if (!s) return '';
  s = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  return s;
}

function escH(s) {
  return String(s || '').replace(/[&<>"']/g, function(m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

/* ══ 저장 상태 표시 ══ */
function setDirty(pg) {
  if (pg === 3) { memoDirty(); return; }
  var p = pg === 1 ? APP.p1 : APP.p2;
  var el = document.getElementById('ss' + pg);
  var tx = document.getElementById('ss' + pg + 't');
  if (!el || !tx) return;
  p.saved = false;
  el.className = 'sstat unsaved';
  tx.textContent = p.name ? 'not saved_ 수정사항 발생' : 'not saved_ 저장하세요';
}

function setClean(pg, name) {
  if (pg === 3) { memoClean(name); return; }
  var p = pg === 1 ? APP.p1 : APP.p2;
  var el = document.getElementById('ss' + pg);
  var tx = document.getElementById('ss' + pg + 't');
  if (!el || !tx) return;
  p.saved = true; p.name = name;
  el.className = 'sstat saved';
  tx.textContent = 'saved_ ' + name;
}

/* ══ Summary 자동 높이 ══ */
function arSumTA(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
function initSumTA() {
  ['p1sum','p2sum'].forEach(function(id) {
    var ta = document.getElementById(id);
    if (!ta) return;
    ta.addEventListener('input', function() { arSumTA(ta); });
    arSumTA(ta);
  });
}

/* ══ 빨간글씨 ══ */
var _lastTA = null, _lastTASel = { s: 0, e: 0 };
document.addEventListener('mouseup', function() {
  var a = document.activeElement;
  if (a && a.tagName === 'TEXTAREA') { _lastTA = a; _lastTASel = { s: a.selectionStart, e: a.selectionEnd }; }
});
document.addEventListener('keyup', function() {
  var a = document.activeElement;
  if (a && a.tagName === 'TEXTAREA') { _lastTA = a; _lastTASel = { s: a.selectionStart, e: a.selectionEnd }; }
});

function insertRedMarker(ta, sel) {
  if (!ta) return;
  var v = ta.value, s = sel.s, e = sel.e;
  if (s === e) { showToast('빨간글씨로 바꿀 텍스트를 먼저 선택하세요', true); return; }
  var selected = v.substring(s, e);
  ta.value = v.substring(0, s) + '[R]' + selected + '[/R]' + v.substring(e);
  arTA(ta);
  if (ta.parentNode && ta.parentNode.classList.contains('avd-td')) { updateAvdOverlayWithRed(ta); }
  else { updateRedOverlay(ta); }
  setDirty(ta.dataset.pg ? parseInt(ta.dataset.pg) : 1);
  showToast('빨간글씨 적용 완료');
}

function applyRedText() {
  if (_lastTA && document.getElementById('tb1').contains(_lastTA)) { insertRedMarker(_lastTA, _lastTASel); }
  else showToast('테이블 셀을 클릭하고 텍스트를 선택한 후 버튼을 누르세요', true);
}

function applyRedText2() {
  if (_lastTA && document.getElementById('tb2').contains(_lastTA)) { insertRedMarker(_lastTA, _lastTASel); }
  else showToast('테이블 셀을 클릭하고 텍스트를 선택한 후 버튼을 누르세요', true);
}

function renderRedMarkers(txt) {
  return escH(txt).replace(/\[R\]([\s\S]*?)\[\/R\]/g, function(m, inner) {
    return '<span style="color:#cc1122;font-weight:700">' + inner + '</span>';
  });
}

var D_RE = /(\d{4}-\d{2}-\d{2})/g;

function renderAvdHTML(val, cdDate) {
  var RED_RE = /\[R\]([\s\S]*?)\[\/R\]/g;
  var html = '', last = 0, rm;
  RED_RE.lastIndex = 0;
  while ((rm = RED_RE.exec(val)) !== null) {
    if (rm.index > last) html += renderAvdSegment(val.substring(last, rm.index), cdDate);
    html += '<span style="color:#cc1122;font-weight:700">' + renderAvdSegment(rm[1], cdDate) + '</span>';
    last = rm.index + rm[0].length;
  }
  html += renderAvdSegment(val.substring(last), cdDate);
  return html;
}

function renderAvdSegment(seg, cdDate) {
  var D2 = /(\d{4}-\d{2}-\d{2})/g;
  var html = '', last = 0, m2;
  D2.lastIndex = 0;
  while ((m2 = D2.exec(seg)) !== null) {
    if (m2.index > last) html += escH(seg.substring(last, m2.index));
    var dt = parseDate(m2[1]);
    html += (dt && cdDate && dt > cdDate)
      ? '<span style="color:var(--warn);font-weight:700">' + escH(m2[1]) + '</span>'
      : escH(m2[1]);
    last = m2.index + m2[1].length;
  }
  html += escH(seg.substring(last));
  return html;
}

function updateAvdOverlayWithRed(ta) {
  var td = ta.parentNode; if (!td) return;
  var ov = td.querySelector('.avd-overlay'); if (!ov) return;
  var val = ta.value;
  var cdDate = null;
  var tr = td.closest('tr');
  if (tr) { var tas = tr.querySelectorAll('textarea'); if (tas.length >= 4) cdDate = parseDate(tas[3].value.trim()); }
  D_RE.lastIndex = 0; var hasOD = false, m;
  var valStripped = val.replace(/\[R\]|\[\/R\]/g, '');
  while ((m = D_RE.exec(valStripped)) !== null) {
    var avd = parseDate(m[1]); if (avd && cdDate && avd > cdDate) { hasOD = true; break; }
  }
  var hasMarker = val.indexOf('[R]') >= 0;
  if (!hasOD && !hasMarker) { ov.style.display = 'none'; ta.style.display = 'block'; arTA(ta); return; }
  ov.innerHTML = renderAvdHTML(val, cdDate);
  ov.style.display = 'block'; ta.style.display = 'none';
}

function updateRedOverlay(ta) {
  var td = ta.parentNode; if (!td) return;
  if (td.classList.contains('avd-td')) return;
  var ov = td.querySelector('.red-overlay'), val = ta.value;
  if (val.indexOf('[R]') < 0) { if (ov) ov.style.display = 'none'; ta.style.display = 'block'; arTA(ta); return; }
  if (!ov) {
    ov = document.createElement('div'); ov.className = 'red-overlay'; ov.style.display = 'none'; td.appendChild(ov);
    ov.addEventListener('click', (function(o, t) { return function() { o.style.display = 'none'; t.style.display = 'block'; arTA(t); t.focus(); }; })(ov, ta));
    ta.addEventListener('blur', (function(o, t) { return function() {
      if (t.value.indexOf('[R]') >= 0) { o.style.textAlign = t.classList.contains('ci-c') ? 'center' : 'left'; o.innerHTML = renderRedMarkers(t.value); o.style.display = 'block'; t.style.display = 'none'; }
    }; })(ov, ta));
  }
  ov.style.textAlign = ta.classList.contains('ci-c') ? 'center' : 'left';
  ov.innerHTML = renderRedMarkers(val); ov.style.display = 'block'; ta.style.display = 'none';
}

function refreshAllRedOverlays(tbodyId) {
  var rows = document.getElementById(tbodyId).rows;
  for (var i = 0; i < rows.length; i++) {
    var tas = rows[i].querySelectorAll('textarea');
    for (var j = 0; j < tas.length; j++) updateRedOverlay(tas[j]);
  }
}

/* ══ textarea 자동 높이 ══ */
function arTA(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
function arAllTA() { document.querySelectorAll('#tb1 textarea,#tb2 textarea').forEach(function(ta) { arTA(ta); }); }

/* ══ 행 번호 갱신 ══ */
function renumber(id) {
  var rows = document.getElementById(id).rows;
  for (var i = 0; i < rows.length; i++) rows[i].cells[0].textContent = i + 1;
}

/* ══ 방향키 셀 이동 ══ */
function getAllTAs(tbodyId) {
  var tbody = document.getElementById(tbodyId);
  var result = [];
  var rows = tbody.rows;
  for (var r = 0; r < rows.length; r++) {
    result.push(Array.from(rows[r].querySelectorAll('textarea')));
  }
  return result;
}

function handleArrowNav(e, pg) {
  var tbodyId = pg === 1 ? 'tb1' : 'tb2';
  if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) return;
  var ta = e.target; if (!ta || ta.tagName !== 'TEXTAREA') return;
  var grid = getAllTAs(tbodyId);
  var curR = -1, curC = -1;
  for (var r = 0; r < grid.length; r++) {
    for (var c = 0; c < grid[r].length; c++) { if (grid[r][c] === ta) { curR = r; curC = c; break; } }
    if (curR >= 0) break;
  }
  if (curR < 0) return;
  var nr = curR, nc = curC;
  if (e.key === 'ArrowUp') { if (ta.value.substring(0, ta.selectionStart).split('\n').length > 1) return; nr = curR - 1; }
  else if (e.key === 'ArrowDown') { if (ta.value.substring(ta.selectionStart).split('\n').length > 1) return; nr = curR + 1; }
  else if (e.key === 'ArrowLeft') { if (ta.selectionStart > 0) return; nc = curC - 1; if (nc < 0) { nc = grid[curR].length - 1; nr = curR - 1; } }
  else if (e.key === 'ArrowRight') { if (ta.selectionStart < ta.value.length) return; nc = curC + 1; if (nc >= grid[curR].length) { nc = 0; nr = curR + 1; } }
  else if (e.key === 'Tab') { e.preventDefault(); if (e.shiftKey) { nc = curC - 1; if (nc < 0) { nc = grid[curR].length - 1; nr = curR - 1; } } else { nc = curC + 1; if (nc >= grid[curR].length) { nc = 0; nr = curR + 1; } } }
  else if (e.key === 'Enter') { if (!e.shiftKey) return; e.preventDefault(); nr = curR + 1; }
  if (nr < 0 || nr >= grid.length) return;
  var cols = grid[nr]; if (!cols || nc >= cols.length) nc = cols.length - 1; if (nc < 0) nc = 0;
  var target = cols[nc]; if (!target) return;
  e.preventDefault(); target.focus(); try { target.setSelectionRange(0, target.value.length); } catch(ex) {}
}

/* ══ textarea 셀 생성 ══ */
function makeTA(val, pg, center, isDate) {
  var ta = document.createElement('textarea');
  var cls = 'ci'; if (center) cls += ' ci-c'; if (isDate) cls += ' ci-date';
  ta.className = cls; ta.value = val || ''; ta.rows = 1; ta.dataset.pg = pg;
  ta.addEventListener('focus', function() { _lastTA = ta; _lastTASel = { s: ta.selectionStart, e: ta.selectionEnd }; });
  ta.addEventListener('mouseup', function() { _lastTA = ta; _lastTASel = { s: ta.selectionStart, e: ta.selectionEnd }; });
  ta.addEventListener('keyup', function() { _lastTA = ta; _lastTASel = { s: ta.selectionStart, e: ta.selectionEnd }; });
  ta.addEventListener('input', function() { arTA(ta); setDirty(pg); if (pg === 1) checkOverdue1(); if (pg === 2) checkOverdue2(); });
  ta.addEventListener('keydown', function(e) { handleArrowNav(e, pg); });
  return ta;
}

function makeTD(val, cls, pg, center, isDate) {
  var td = document.createElement('td'); if (cls) td.className = cls;
  var ta = makeTA(val, pg, center, isDate); td.appendChild(ta);
  if (val && String(val).indexOf('[R]') >= 0) { setTimeout(function() { updateRedOverlay(ta); }, 10); }
  return td;
}

/* ══ 모달 ══ */
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

/* ══ 토스트 ══ */
var _toastT = null;
function showToast(msg, isErr) {
  var t = document.getElementById('toast');
  t.textContent = msg || '';
  t.className = 'toast' + (isErr ? ' err' : '') + ' show';
  clearTimeout(_toastT);
  _toastT = setTimeout(function() { t.className = 'toast' + (isErr ? ' err' : ''); }, 2200);
}

/* ══ Personalization ══ */
function openPersonal() {
  document.getElementById('ck-cd').checked  = APP.p1.colVis.cd;
  document.getElementById('ck-pod').checked = APP.p1.colVis.pod;
  document.getElementById('ck-rd').checked  = APP.p1.colVis.rd;
  openModal('m-pers');
}

function applyPersonal() {
  APP.p1.colVis.cd  = document.getElementById('ck-cd').checked;
  APP.p1.colVis.pod = document.getElementById('ck-pod').checked;
  APP.p1.colVis.rd  = document.getElementById('ck-rd').checked;
  closeModal('m-pers'); showToast('표시 설정 적용 완료');
}

function applyColVis(tbl, vis) {
  var rows = tbl.rows;
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].cells;
    for (var j = 0; j < cells.length; j++) {
      if (j === 4) cells[j].style.display = vis.cd  ? '' : 'none';
      if (j === 5) cells[j].style.display = vis.pod ? '' : 'none';
      if (j === 6) cells[j].style.display = vis.rd  ? '' : 'none';
    }
  }
}

/* ══ 행 삭제 모달 ══ */
function delRowPrompt(pg) {
  APP.delFor = pg; APP.delIdx = -1;
  var dl = document.getElementById('dlist'); dl.innerHTML = '';
  var rows = document.getElementById(pg === 1 ? 'tb1' : 'tb2').rows;
  for (var i = 0; i < rows.length; i++) {
    (function(idx) {
      var tas = rows[idx].querySelectorAll('textarea');
      var d = document.createElement('div'); d.className = 'litem';
      d.innerHTML = '<span class="litem-name">행 ' + (idx + 1) + '</span><span class="litem-date">' + escH((tas[0] && tas[0].value ? tas[0].value : '').slice(0, 20)) + '</span>';
      d.onclick = function() { dl.querySelectorAll('.litem').forEach(function(x) { x.classList.remove('sel'); }); d.classList.add('sel'); APP.delIdx = idx; };
      dl.appendChild(d);
    })(i);
  }
  openModal('m-del');
}

function execDel() {
  if (APP.delIdx < 0) { showToast('삭제할 행을 선택하세요', true); return; }
  document.getElementById(APP.delFor === 1 ? 'tb1' : 'tb2').deleteRow(APP.delIdx);
  renumber(APP.delFor === 1 ? 'tb1' : 'tb2'); closeModal('m-del'); setDirty(APP.delFor);
}

/* ══ 저장/불러오기 공통 ══ */
function openSave(pg) {
  APP.saveFor = pg;
  document.getElementById('sv-fn').value = todayStr() + '_';
  var authorEl = document.getElementById('sv-author');
  if (authorEl) authorEl.value = '';
  openModal('m-save');
}

function execSave() {
  var fn = document.getElementById('sv-fn').value.trim();
  if (!fn) { showToast('파일명을 입력하세요', true); return; }
  var author = ((document.getElementById('sv-author') || {}).value || '').trim();
  closeModal('m-save'); showToast('저장 중...');
  var pg = APP.saveFor;
  var saveOk = function(nm, au) { setClean(pg, nm); showToast('저장 완료: ' + nm + (au ? ' [' + au + ']' : '')); };
  if (pg === 1) {
    callAPI('saveMeeting', {
      fileName: fn,
      summary: document.getElementById('p1sum').value,
      rows: getData1(),
      colSettings: APP.p1.colVis,
      photos: APP.p1.photos,
      author: author
    }).then(function(r) {
      if (r.success) { saveOk(fn, author); }
      else showToast('오류: ' + r.error, true);
    });
  } else if (pg === 2) {
    var rows2 = getData2();
    var progressArr = rows2.map(function(r2, i) { return APP.p2.progress[i] || {}; });
    callAPI('saveLoad', {
      fileName: fn,
      processNames: APP.p2.pnames,
      summary2: document.getElementById('p2sum').value,
      rows: rows2,
      progress: progressArr,
      basedate: APP.p2.basedate,
      author: author
    }).then(function(r) {
      if (r.success) { saveOk(fn, author); }
      else showToast('오류: ' + r.error, true);
    });
  } else if (pg === 3) {
    memoExecSave(fn, author);
  }
}

function openLoad(pg) {
  if (pg === 3) { memoOpenLoad(); return; }
  APP.loadFor = pg; APP.loadSel = '';
  var ll = document.getElementById('llist');
  ll.innerHTML = '<div style="color:var(--txt3);font-size:13px;padding:14px;text-align:center">불러오는 중...</div>';
  openModal('m-load');
  callAPI(pg === 1 ? 'loadMeetingList' : 'loadLoadList').then(function(r) {
    ll.innerHTML = '';
    if (!r || !r.success) { ll.innerHTML = '<div style="color:var(--warn);padding:12px">오류: ' + escH(r ? r.error : '') + '</div>'; return; }
    if (!r.list || !r.list.length) { ll.innerHTML = '<div style="color:var(--txt3);padding:12px;text-align:center">저장된 파일이 없습니다.</div>'; return; }
    var sorted = r.list.slice().sort(function(a,b) { return b.name > a.name ? 1 : b.name < a.name ? -1 : 0; });
    sorted.forEach(function(item) {
      var d = document.createElement('div'); d.className = 'litem';
      var authorBadge = item.author ? '<span class="litem-author">' + escH(item.author) + '</span>' : '';
      d.innerHTML = '<span class="litem-name">' + escH(item.name) + '</span>' + authorBadge + '<span class="litem-date">' + escH((item.date||'').slice(0,10)) + '</span>';
      d.onclick = function() { ll.querySelectorAll('.litem').forEach(function(x) { x.classList.remove('sel'); }); d.classList.add('sel'); APP.loadSel = item.name; };
      ll.appendChild(d);
    });
    filterLoadList();
  });
}

function execLoad() {
  if (!APP.loadSel) { showToast('불러올 파일을 선택하세요', true); return; }
  var nm = APP.loadSel; closeModal('m-load'); showToast('불러오는 중...');
  var pg = APP.loadFor;
  if (pg === 1) {
    callAPI('loadMeeting', { fileName: nm }).then(function(r) {
      if (!r.success) { showToast('오류: ' + r.error, true); return; }
      if (!document.getElementById('p1sum').value) { document.getElementById('p1sum').value = r.summary || ''; arSumTA(document.getElementById('p1sum')); }
      if (r.colSettings) APP.p1.colVis = r.colSettings;
      (r.rows || []).forEach(function(row) { addRow1(row.rowData); });
      setTimeout(function() { arAllTA(); checkOverdue1(); refreshAllRedOverlays('tb1'); }, 50);
      setClean(1, nm); showToast('불러오기 완료: ' + nm);
    });
  } else {
    callAPI('loadLoad', { fileName: nm }).then(function(r) {
      if (!r.success) { showToast('오류: ' + r.error, true); return; }
      APP.p2.pnames = r.processNames || APP.p2.pnames;
      updateProcHeaders();
      if (!document.getElementById('p2sum').value) { document.getElementById('p2sum').value = r.summary2 || ''; arSumTA(document.getElementById('p2sum')); }
      if (r.basedate) { APP.p2.basedate = r.basedate; document.getElementById('basedate-inp').value = r.basedate; }
      var startIdx = document.getElementById('tb2').rows.length;
      (r.rows || []).forEach(function(row, i) {
        var rowIdx = startIdx + i;
        if (r.progress && r.progress[i]) APP.p2.progress[rowIdx] = r.progress[i];
        addRow2(row);
      });
      setTimeout(function() {
        arAllTA(); checkOverdue2(); refreshAllRedOverlays('tb2');
        Object.keys(APP.p2.progress).forEach(function(idx) {
          var p = APP.p2.progress[idx]; if (p && p.pct !== undefined) updateProgressCell(parseInt(idx), p.pct);
        });
      }, 150);
      setClean(2, nm); showToast('불러오기 완료: ' + nm);
    });
  }
}

function execDeleteLoadedFile() {
  if (!APP.loadSel) { showToast('삭제할 파일을 선택하세요', true); return; }
  var nm = APP.loadSel, pg = APP.loadFor;
  if (!confirm('"' + nm + '" 파일을 삭제하시겠습니까?')) return;
  showToast('삭제 중...');
  var actionMap = { 1: 'deleteMeeting', 2: 'deleteLoad', 3: 'deleteMemo' };
  callAPI(actionMap[pg], { fileName: nm }).then(function(r) {
    if (r && r.success) {
      showToast('삭제 완료: ' + nm); APP.loadSel = '';
      openLoad(pg);
    } else showToast('삭제 실패: ' + (r && r.error ? r.error : ''), true);
  });
}

/* ══ 쳪쳐/공유/메일 ══ */
function captureEl(el, cb, forMail) {
  var ow = el.style.overflow; el.style.overflow = 'visible';
  var sc = forMail ? 0.7 : 1.5; var q = forMail ? 0.55 : 0.9;
  html2canvas(el, {
    backgroundColor: '#ffffff', scale: sc, useCORS: true, logging: false,
    scrollX: 0, scrollY: 0,
    width: el.scrollWidth, height: el.scrollHeight,
    windowWidth: el.scrollWidth, windowHeight: el.scrollHeight
  }).then(function(c) { el.style.overflow = ow; cb(c.toDataURL('image/jpeg', q)); });
}

function dlOrShare(url, fname) {
  var mob = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (mob && navigator.canShare) {
    fetch(url).then(function(r) { return r.blob(); }).then(function(b) {
      var f = new File([b], fname, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: fname }).catch(function() { triggerDL(url, fname); }); }
      else triggerDL(url, fname);
    });
  } else triggerDL(url, fname);
}

function triggerDL(url, fname) { var a = document.createElement('a'); a.href = url; a.download = fname; a.click(); }

function openMailModal() {
  APP._mailFromFS = false;
  document.getElementById('mail-to').value = '';
  openModal('m-mail');
}

function execSendMail() {
  var to = (document.getElementById('mail-to').value || '').trim();
  if (!to) { showToast('이메일 주소를 입력하세요', true); return; }
  closeModal('m-mail');
  showToast('메일 준비 중...');
  var fromFS = APP._mailFromFS;
  if (fromFS) {
    captureEl(document.getElementById('fscnt'), function(url) { sendMail(url, '협력사 공정관리 협의록', to); }, true);
  } else {
    var tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-99999px;top:0;width:1200px;background:#fff;padding:24px;border:0';
    document.body.appendChild(tmp); buildFsContent(tmp);
    setTimeout(function() {
      captureEl(tmp, function(url) { document.body.removeChild(tmp); sendMail(url, '협력사 공정관리 협의록', to); }, true);
    }, 80);
  }
}

function sendMail(dataUrl, subject, recipient) {
  var b64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
  callAPI('sendReportEmail', { base64Img: b64, subject: subject || '협력사 공정관리 협의록', recipientEmail: recipient }).then(function(r) {
    if (r && r.success) showToast('메일 송부 완료!');
    else showToast('메일 실패: ' + (r && r.error ? r.error : 'Unknown'), true);
  });
}

function filterLoadList() {
  var filterEl = document.getElementById('ld-author');
  var filter = filterEl ? filterEl.value.trim().toLowerCase() : '';
  var items = document.getElementById('llist').querySelectorAll('.litem');
  items.forEach(function(item) {
    if (!filter) { item.style.display = ''; return; }
    var authorEl = item.querySelector('.litem-author');
    var author = authorEl ? authorEl.textContent.toLowerCase() : '';
    var name = (item.querySelector('.litem-name') || {}).textContent || '';
    item.style.display = (author.indexOf(filter) >= 0 || name.toLowerCase().indexOf(filter) >= 0) ? '' : 'none';
  });
}

/* ══ 사진 기능 ══ */
function addPhoto() { var phInp = document.getElementById('phInp'); if (phInp) phInp.click(); }

function renderPhotos() {
  var pa = document.getElementById('pharea'); pa.innerHTML = '';
  APP.p1.photos.forEach(function(g, gi) {
    g.data.forEach(function(d, di) {
      var item = document.createElement('div'); item.className = 'ph-item';
      var dinp = document.createElement('input'); dinp.type = 'text'; dinp.className = 'ph-dinp'; dinp.placeholder = '날짜 입력'; dinp.value = g.desc[di] || '';
      dinp.addEventListener('input', function() { g.desc[di] = dinp.value; setDirty(1); });
      var imgW = document.createElement('div'); imgW.className = 'ph-img'; var img = document.createElement('img'); img.src = d; imgW.appendChild(img);
      var del = document.createElement('button'); del.className = 'ph-del-btn'; del.textContent = '✕';
      del.onclick = (function(gIdx, dIdx) { return function() {
        APP.p1.photos[gIdx].data.splice(dIdx, 1); APP.p1.photos[gIdx].desc.splice(dIdx, 1);
        if (!APP.p1.photos[gIdx].data.length) APP.p1.photos.splice(gIdx, 1);
        renderPhotos(); setDirty(1);
      }; })(gi, di);
      item.appendChild(dinp); item.appendChild(imgW); item.appendChild(del); pa.appendChild(item);
    });
  });
}

/* ══ 기준일 드롭다운 ══ */
function toggleBasedateDropdown(e) {
  e.stopPropagation();
  document.getElementById('basedate-dropdown').classList.toggle('open');
}

function setBasedateToday() {
  var today = todayStr();
  document.getElementById('basedate-inp').value = today;
  APP.p2.basedate = today;
  document.getElementById('basedate-dropdown').classList.remove('open');
  setDirty(2);
  if (document.getElementById('gantt-sec').style.display !== 'none') buildGantt(APP.lastRows);
}

function focusBasedateManual() {
  document.getElementById('basedate-dropdown').classList.remove('open');
  var inp = document.getElementById('basedate-inp');
  inp.removeAttribute('readonly'); inp.focus();
  inp.addEventListener('blur', function onBlur() {
    inp.setAttribute('readonly', '');
    APP.p2.basedate = inp.value.trim();
    inp.removeEventListener('blur', onBlur);
    setDirty(2);
    if (document.getElementById('gantt-sec').style.display !== 'none') buildGantt(APP.lastRows);
  }, { once: true });
}

/* ══ 이벤트 초기화 ══ */
document.addEventListener('DOMContentLoaded', function() {
  initSumTA();

  // 사진 파일 선택 (phInp 요소가 있을 때만)
  var phInp = document.getElementById('phInp');
  if (phInp) {
    phInp.addEventListener('change', function(e) {
      var files = Array.from(e.target.files); if (!files.length) return;
      var group = { desc: [], data: [] }, loaded = 0;
      files.forEach(function(f, fi) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          group.data[fi] = ev.target.result; group.desc[fi] = ''; loaded++;
          if (loaded === files.length) { APP.p1.photos.push(group); renderPhotos(); setDirty(1); }
        };
        reader.readAsDataURL(f);
      });
      e.target.value = '';
    });
  }

  // 기준일 드롭다운 외부 클릭 닫기
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('basedate-wrap');
    if (wrap && !wrap.contains(e.target)) {
      document.getElementById('basedate-dropdown').classList.remove('open');
    }
  });

  // 기준일 수동 입력
  document.getElementById('basedate-inp').addEventListener('input', function() {
    APP.p2.basedate = this.value.trim(); setDirty(2);
  });
});
