// ══════════════════════════════════════════════════════════════
// 탭1: 협력사 미팅 협의록
// ══════════════════════════════════════════════════════════════

var CLS1  = ['c-proj','c-item','c-vend','c-cd','c-pod','c-rd','c-avd','c-stat','c-rmk'];
var CTR1  = [true, true, true, true, true, true, true, false, false];
var DATE1 = [false, false, false, true, true, true, true, false, false];
var COLBASE1 = [28, 90, 82, 82, 95, 95, 95, 95, 260, 110]; // #,프로젝트,품목명,업체명,고객납기,PO납기,요구납기,가능납기,제작현황,비고

/* ══ 열 너비 개별 조정 (드래그) ══
   table-layout:fixed에서도 table 자체 width를 auto로 두면 브라우저가 래퍼 폭에
   맞춰 다른 열을 조용히 줄여버리는 것을 확인했으므로, 드래그할 때마다 table의
   width를 "열 폭 합계"로 직접 갱신해 다른 열은 절대 건드리지 않게 한다. */
function bindColResizeHandle(handle, getStartWidth, applyWidth) {
  var startX = 0, startW = 0;
  function move(clientX) { applyWidth(Math.max(28, startW + (clientX - startX))); }
  function onMouseMove(e) { move(e.clientX); }
  function onTouchMove(e) { if (e.touches[0]) { move(e.touches[0].clientX); e.preventDefault(); } }
  function onUp() {
    handle.classList.remove('active');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onUp);
  }
  handle.addEventListener('mousedown', function(e) {
    e.preventDefault(); e.stopPropagation();
    startX = e.clientX; startW = getStartWidth();
    handle.classList.add('active');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onUp);
  });
  handle.addEventListener('touchstart', function(e) {
    if (!e.touches[0]) return;
    e.stopPropagation();
    startX = e.touches[0].clientX; startW = getStartWidth();
    handle.classList.add('active');
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, { passive: true });
}

function syncTblWidth1(table) {
  // getBoundingClientRect()는 이 시점에 table 자체 width가 아직 갱신 전이라
  // "표 폭 > 열 폭 합" 상태일 때 fixed layout이 남는 폭을 전 열에 잠깐
  // 나눠주는(렌더링 왜곡) 값을 읽게 된다. 우리가 직접 지정한 style.width(진짜
  // 의도한 값)만 더해야 다른 열이 절대 오염되지 않는다.
  var sum = 0, ths = table.querySelectorAll('thead th');
  for (var i = 0; i < ths.length; i++) sum += parseFloat(ths[i].style.width) || ths[i].getBoundingClientRect().width;
  table.style.width = Math.round(sum) + 'px';
}

function initColResize1() {
  var table = document.getElementById('t1'); if (!table) return;
  var ths = table.querySelectorAll('thead th'); if (!ths.length) return;
  var wrap = document.querySelector('.twrap');
  var baseSum = COLBASE1.reduce(function(a, b) { return a + b; }, 0);
  var avail = wrap ? wrap.clientWidth : 0;
  var widths = COLBASE1.slice();
  if (avail > baseSum) widths[8] += (avail - baseSum); // 여유 폭은 제작현황 열이 흡수 (기본값)
  ths.forEach(function(th, i) {
    th.style.width = (widths[i] || COLBASE1[i] || 80) + 'px';
    var handle = document.createElement('div');
    handle.className = 'col-resizer';
    th.appendChild(handle);
    bindColResizeHandle(handle,
      function() { return parseFloat(th.style.width) || th.getBoundingClientRect().width; },
      function(w) { th.style.width = w + 'px'; syncTblWidth1(table); });
  });
  syncTblWidth1(table);
}

/* 전체화면/공유용으로 새로 만든 표(colgroup 기반)에 동일한 개별 열 리사이즈를 적용 */
function initFsColResize(tbl, cols) {
  var ths = tbl.querySelectorAll('thead th');
  ths.forEach(function(th, i) {
    var col = cols[i]; if (!col) return;
    var handle = document.createElement('div');
    handle.className = 'col-resizer';
    th.style.position = 'relative';
    th.appendChild(handle);
    bindColResizeHandle(handle,
      function() { return parseFloat(col.style.width) || 0; },
      function(w) {
        col.style.width = w + 'px';
        var sum = 0; cols.forEach(function(c) { sum += parseFloat(c.style.width) || 0; });
        tbl.style.width = sum + 'px';
      });
  });
}

function addRow1(vals) {
  var tbody = document.getElementById('tb1'), tr = document.createElement('tr');
  var nd = document.createElement('td'); nd.className = 'rn'; nd.textContent = tbody.rows.length + 1; tr.appendChild(nd);
  for (var i = 0; i < 9; i++) {
    if (i === 6) {
      // 가능납기: overlay 특수 처리
      var td = document.createElement('td'); td.className = 'c-avd avd-td';
      var ta = makeTA(vals ? normDate(vals[i]) : '', 1, true, true); td.appendChild(ta);
      var ov = document.createElement('div'); ov.className = 'avd-overlay'; ov.style.display = 'none'; td.appendChild(ov);
      ov.addEventListener('click', (function(o, t) { return function() { o.style.display = 'none'; t.style.display = 'block'; arTA(t); t.focus(); }; })(ov, ta));
      ta.addEventListener('blur', (function(t) { return function() { updateAvdOverlayWithRed(t); checkOverdue1(); }; })(ta));
      if (vals && String(vals[i] || '').indexOf('[R]') >= 0) { setTimeout(function() { updateAvdOverlayWithRed(ta); }, 20); }
      tr.appendChild(td);
    } else {
      var rv = vals ? vals[i] : '';
      if (vals && (i === 3 || i === 4 || i === 5)) rv = normDate(vals[i]);
      tr.appendChild(makeTD(rv, CLS1[i], 1, CTR1[i], DATE1[i]));
    }
  }
  document.getElementById('tb1').appendChild(tr);
  setDirty(1);
}

function getData1() {
  var out = [], rows = document.getElementById('tb1').rows;
  for (var i = 0; i < rows.length; i++) {
    var tas = rows[i].querySelectorAll('textarea'), row = [];
    for (var j = 0; j < tas.length; j++) row.push(tas[j].value);
    out.push(row);
  }
  return out;
}

function checkOverdue1() {
  var rows = document.getElementById('tb1').rows;
  for (var i = 0; i < rows.length; i++) {
    var tas = rows[i].querySelectorAll('textarea'); if (tas.length < 7) continue;
    var cdDate = parseDate(tas[3].value.trim());
    var avdTA = tas[6], avdTD = avdTA.parentNode, ov = avdTD.querySelector('.avd-overlay');
    if (!ov) continue;
    var avdVal = avdTA.value;
    if (!cdDate && avdVal.indexOf('[R]') < 0) { ov.style.display = 'none'; avdTA.style.display = 'block'; continue; }
    var valStripped = avdVal.replace(/\[R\]|\[\/R\]/g, '');
    D_RE.lastIndex = 0; var hasOD = false, m;
    while ((m = D_RE.exec(valStripped)) !== null) {
      var avd = parseDate(m[1]); if (avd && cdDate && avd > cdDate) { hasOD = true; break; }
    }
    var hasMarker = avdVal.indexOf('[R]') >= 0;
    if (!hasOD && !hasMarker) { ov.style.display = 'none'; avdTA.style.display = 'block'; continue; }
    ov.innerHTML = renderAvdHTML(avdVal, cdDate); ov.style.display = 'block'; avdTA.style.display = 'none';
  }
}

function completeSort1() {
  var rows = getData1();
  if (!rows.length) { showToast('정렬할 데이터가 없습니다', true); return; }
  rows.sort(function(a, b) {
    var da = parseDate(String(a[3] || '').trim()), db = parseDate(String(b[3] || '').trim());
    if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
  });
  var tbody = document.getElementById('tb1'); tbody.innerHTML = '';
  rows.forEach(function(r) { addRow1(r); });
  setTimeout(function() { arAllTA(); checkOverdue1(); refreshAllRedOverlays('tb1'); }, 50);
  setDirty(1); showToast('고객납기 기준 오름차순 정렬 완료');
}

function doExcel1() {
  if (typeof XLSX === 'undefined') { showToast('라이브러리 로딩 중', true); return; }
  var vis = APP.p1.colVis;
  var headers = ['#','프로젝트','품목명','업체명'];
  var dataIdx = [0, 1, 2];
  if (vis.cd)  { headers.push('고객납기'); dataIdx.push(3); }
  if (vis.pod) { headers.push('PO납기');   dataIdx.push(4); }
  if (vis.rd)  { headers.push('요구납기'); dataIdx.push(5); }
  headers.push('가능납기','제작현황','비고'); dataIdx.push(6, 7, 8);
  var rows = getData1();
  var wb = XLSX.utils.book_new(); var wsData = [];
  var sumVal = document.getElementById('p1sum').value || '';
  wsData.push(['■ 회의결과 SUMMARY']);
  sumVal.split('\n').forEach(function(line) { wsData.push([line]); });
  wsData.push([]); wsData.push(headers);
  rows.forEach(function(r, ri) {
    var row = [ri + 1]; dataIdx.forEach(function(di) { row.push(r[di] || ''); }); wsData.push(row);
  });
  var ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, '협력사 미팅 협의록');
  XLSX.writeFile(wb, todayStr() + '_협력사미팅협의록.xlsx');
  showToast('엑셀 다운로드 완료');
}

/* ══ 전체화면 ══ */
function buildFsContent(targetEl) {
  var fc = targetEl || document.getElementById('fscnt'); fc.innerHTML = '';
  var hd = document.createElement('div');
  hd.style.cssText = 'font-family:var(--fh);font-size:20px;font-weight:700;color:var(--accentD);letter-spacing:2px;margin-bottom:12px;text-transform:uppercase;padding-bottom:9px;border-bottom:2px solid var(--panel)';
  hd.textContent = '◈ 협력사 미팅 협의록'; fc.appendChild(hd);
  var sLbl = document.createElement('div');
  sLbl.style.cssText = 'font-family:var(--fh);font-size:13px;font-weight:700;color:var(--txt2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px';
  sLbl.textContent = '■ 회의결과 SUMMARY'; fc.appendChild(sLbl);
  var sv = document.createElement('div');
  sv.style.cssText = 'font-size:14px;color:var(--txt);background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:9px 13px;margin-bottom:14px;white-space:pre-wrap;line-height:1.7;box-sizing:border-box;width:100%';
  sv.innerHTML = renderRedMarkers(document.getElementById('p1sum').value || '(요약 없음)'); fc.appendChild(sv);
  var srcRows = document.getElementById('tb1').rows;
  var srcThead = document.getElementById('t1').querySelector('thead');
  var tbl = document.createElement('table');
  var srcHeadCells = srcThead ? srcThead.rows[0].cells : null;
  var visFlags1 = [true, true, true, true, APP.p1.colVis.cd, APP.p1.colVis.pod, APP.p1.colVis.rd, true, true, true];
  var COLDEFS1 = COLBASE1.map(function(w, idx) {
    var live = srcHeadCells && srcHeadCells[idx] ? Math.round(srcHeadCells[idx].getBoundingClientRect().width) : null;
    return { w: live || w, vis: visFlags1[idx] };
  });
  var visIdx1 = []; COLDEFS1.forEach(function(c, idx) { if (c.vis) visIdx1.push(idx); });
  var COLW1 = visIdx1.map(function(idx) { return COLDEFS1[idx].w; });
  var COLW1SUM = COLW1.reduce(function(a, b) { return a + b; }, 0);
  tbl.style.cssText = 'border-collapse:collapse;table-layout:fixed;font-size:14px;width:' + COLW1SUM + 'px';
  var cg = document.createElement('colgroup');
  var colEls = COLW1.map(function(w) { var col = document.createElement('col'); col.style.width = w + 'px'; cg.appendChild(col); return col; });
  tbl.appendChild(cg);
  if (srcThead) {
    var newThead = document.createElement('thead');
    var hrow = srcThead.rows[0], newHrow = document.createElement('tr');
    for (var ci4 = 0; ci4 < visIdx1.length; ci4++) {
      var hc = hrow.cells[visIdx1[ci4]], newHc = document.createElement('th');
      newHc.textContent = hc.textContent;
      newHc.style.cssText = 'background:linear-gradient(180deg,#c4d8f0 0%,#b0ccec 100%);color:#003d8a;font-family:Rajdhani,sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px;padding:8px 10px;border:1px solid #8ab8d8;box-sizing:border-box;white-space:normal;overflow-wrap:anywhere;word-break:break-word;text-align:center';
      newHrow.appendChild(newHc);
    }
    newThead.appendChild(newHrow); tbl.appendChild(newThead);
    initFsColResize(tbl, colEls);
  }
  var tbody = document.createElement('tbody');
  for (var ri = 0; ri < srcRows.length; ri++) {
    var srcTr = srcRows[ri], newTr = document.createElement('tr'), cells = srcTr.cells;
    var rowBg = ri % 2 === 0 ? '#ffffff' : '#f2f7fd';
    for (var ci2 = 0; ci2 < visIdx1.length; ci2++) {
      var srcTd = cells[visIdx1[ci2]], newTd = document.createElement('td');
      newTd.className = srcTd.className;
      var ta = srcTd.querySelector('textarea'), avdOv = srcTd.querySelector('.avd-overlay'), redOv = srcTd.querySelector('.red-overlay');
      var isCenter = (ta && ta.classList.contains('ci-c')) || (avdOv != null);
      newTd.style.cssText = 'border:1px solid #aac8e0;padding:1px;vertical-align:top;background:' + rowBg + ';box-sizing:border-box;overflow:hidden';
      if (ta || avdOv || redOv) {
        var div = document.createElement('div');
        div.style.cssText = 'padding:5px 10px;font-size:14px;min-height:28px;line-height:1.5;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;text-align:' + (isCenter ? 'center' : 'left');
        if (avdOv && avdOv.style.display !== 'none' && avdOv.innerHTML) div.innerHTML = avdOv.innerHTML;
        else if (redOv && redOv.style.display !== 'none' && redOv.innerHTML) div.innerHTML = redOv.innerHTML;
        else if (ta) div.innerHTML = renderRedMarkers(ta.value);
        newTd.appendChild(div);
      } else {
        var div2 = document.createElement('div');
        div2.style.cssText = 'padding:5px 10px;font-size:14px;min-height:28px;line-height:1.5;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;text-align:center';
        div2.textContent = srcTd.textContent; newTd.appendChild(div2);
      }
      newTr.appendChild(newTd);
    }
    tbody.appendChild(newTr);
  }
  tbl.appendChild(tbody);
  var outer = document.createElement('div'); outer.style.cssText = 'overflow-x:auto;width:100%';
  var inner = document.createElement('div'); inner.style.cssText = 'display:inline-block;min-width:100%;vertical-align:top;box-sizing:border-box';
  inner.appendChild(tbl); outer.appendChild(inner); fc.appendChild(outer);
  if (APP.p1.photos.length) {
    var pa = document.createElement('div'); pa.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px';
    APP.p1.photos.forEach(function(g) {
      g.data.forEach(function(d, di) {
        var w = document.createElement('div'); w.style.cssText = 'display:flex;flex-direction:column;gap:4px';
        var dc = document.createElement('div'); dc.style.cssText = 'font-size:12px;color:var(--txt2);text-align:center'; dc.textContent = g.desc[di] || '';
        var img = document.createElement('img'); img.src = d; img.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;border:1px solid var(--border)';
        w.appendChild(dc); w.appendChild(img); pa.appendChild(w);
      });
    });
    fc.appendChild(pa);
  }
}

function doFullscreen() { buildFsContent(); document.getElementById('fsov').classList.add('active'); }
function closeFS() { document.getElementById('fsov').classList.remove('active'); }

function doShare() {
  showToast('캡쳐 중...');
  var tmp = document.createElement('div');
  tmp.style.cssText = 'position:fixed;left:-99999px;top:0;width:1200px;background:#fff;padding:24px;border:0';
  document.body.appendChild(tmp); buildFsContent(tmp);
  setTimeout(function() {
    captureEl(tmp, function(url) { document.body.removeChild(tmp); dlOrShare(url, '협의록_쳪쳐.jpg'); showToast('다운로드/공유 실행'); });
  }, 80);
}

function doShareFromFs() {
  showToast('쳪쳐 중...');
  captureEl(document.getElementById('fscnt'), function(url) { dlOrShare(url, '협의록_쳪쳐.jpg'); showToast('다운로드/공유 실행'); });
}

function doMail(fromFS) {
  APP._mailFromFS = !!fromFS;
  document.getElementById('mail-to').value = '';
  openModal('m-mail');
}
