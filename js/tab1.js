// ══════════════════════════════════════════════════════════════
// 탭1: 협력사 미팅 협의록
// ══════════════════════════════════════════════════════════════

var CLS1  = ['c-proj','c-item','c-vend','c-cd','c-pod','c-rd','c-avd','c-stat','c-rmk'];
var CTR1  = [true, true, true, true, true, true, true, false, false];
var DATE1 = [false, false, false, true, true, true, true, false, false];

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
  if (!rows.length) { showToast(t('toast_nothing_to_sort'), true); return; }
  rows.sort(function(a, b) {
    var da = parseDate(String(a[3] || '').trim()), db = parseDate(String(b[3] || '').trim());
    if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
  });
  var tbody = document.getElementById('tb1'); tbody.innerHTML = '';
  rows.forEach(function(r) { addRow1(r); });
  setTimeout(function() { arAllTA(); checkOverdue1(); refreshAllRedOverlays('tb1'); }, 50);
  setDirty(1); showToast(t('toast_sort_done'));
}

function doExcel1() {
  if (typeof XLSX === 'undefined') { showToast(t('toast_lib_loading'), true); return; }
  var vis = APP.p1.colVis;
  var headers = ['#', t('th_proj'), t('th_item'), t('th_vend')];
  var dataIdx = [0, 1, 2];
  if (vis.cd)  { headers.push(t('th_cd'));  dataIdx.push(3); }
  if (vis.pod) { headers.push(t('th_pod')); dataIdx.push(4); }
  if (vis.rd)  { headers.push(t('th_rd'));  dataIdx.push(5); }
  headers.push(t('th_avd'), t('th_stat'), t('th_rmk')); dataIdx.push(6, 7, 8);
  var rows = getData1();
  var wb = XLSX.utils.book_new(); var wsData = [];
  var sumVal = document.getElementById('p1sum').value || '';
  wsData.push([t('sum1_lbl_caps')]);
  sumVal.split('\n').forEach(function(line) { wsData.push([line]); });
  wsData.push([]); wsData.push(headers);
  rows.forEach(function(r, ri) {
    var row = [ri + 1]; dataIdx.forEach(function(di) { row.push(r[di] || ''); }); wsData.push(row);
  });
  var ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, t('sheet_name1'));
  XLSX.writeFile(wb, todayStr() + t('fname_suffix1') + '.xlsx');
  showToast(t('toast_excel_done'));
}

/* ══ 전체화면 ══ */
function buildFsContent(targetEl) {
  var fc = targetEl || document.getElementById('fscnt'); fc.innerHTML = '';
  var hd = document.createElement('div');
  hd.style.cssText = 'font-family:var(--fh);font-size:20px;font-weight:700;color:var(--accentD);letter-spacing:2px;margin-bottom:12px;text-transform:uppercase;padding-bottom:9px;border-bottom:2px solid var(--panel)';
  hd.textContent = t('fs1_title'); fc.appendChild(hd);
  var sLbl = document.createElement('div');
  sLbl.style.cssText = 'font-family:var(--fh);font-size:13px;font-weight:700;color:var(--txt2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px';
  sLbl.textContent = t('sum1_lbl_caps'); fc.appendChild(sLbl);
  var sv = document.createElement('div');
  sv.style.cssText = 'font-size:14px;color:var(--txt);background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:9px 13px;margin-bottom:14px;white-space:pre-wrap;line-height:1.7;box-sizing:border-box;width:100%';
  sv.innerHTML = renderRedMarkers(document.getElementById('p1sum').value || t('no_summary')); fc.appendChild(sv);
  makeWidthResizable(sv, 'w_p1sum_fs', 200);
  var srcRows = document.getElementById('tb1').rows;
  var srcTable = document.getElementById('t1');
  var srcThead = srcTable.querySelector('thead');
  var srcCols = srcTable.querySelector('colgroup') ? srcTable.querySelector('colgroup').children : null;
  var tbl = document.createElement('table');
  tbl.style.cssText = 'width:auto;border-collapse:collapse;table-layout:fixed;font-size:14px';
  var newHrow = null, colgroup = null;
  if (srcThead) {
    colgroup = document.createElement('colgroup');
    var newThead = document.createElement('thead');
    var hrow = srcThead.rows[0]; newHrow = document.createElement('tr');
    var totalW = 0;
    for (var ci4 = 0; ci4 < hrow.cells.length; ci4++) {
      var hc = hrow.cells[ci4], newHc = document.createElement('th');
      newHc.textContent = hc.textContent;
      var mw = getComputedStyle(hc).minWidth;
      newHc.style.cssText = 'background:linear-gradient(180deg,#c4d8f0 0%,#b0ccec 100%);color:#003d8a;font-family:Rajdhani,sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px;padding:8px 10px;border:1px solid #8ab8d8;white-space:nowrap;text-align:center';
      if (mw && mw !== '0px') newHc.style.minWidth = mw;
      newHrow.appendChild(newHc);

      var col = document.createElement('col');
      var srcCol = srcCols ? srcCols[ci4] : null;
      var seedW = srcCol && srcCol.style.width ? parseInt(srcCol.style.width, 10) : Math.round(hc.getBoundingClientRect().width);
      if (seedW) { col.style.width = seedW + 'px'; totalW += seedW; }
      colgroup.appendChild(col);
    }
    tbl.style.width = totalW + 'px';
    tbl.appendChild(colgroup);
    newThead.appendChild(newHrow); tbl.appendChild(newThead);
  }
  var tbody = document.createElement('tbody');
  for (var ri = 0; ri < srcRows.length; ri++) {
    var srcTr = srcRows[ri], newTr = document.createElement('tr'), cells = srcTr.cells;
    var rowBg = ri % 2 === 0 ? '#ffffff' : '#f2f7fd';
    for (var ci = 0; ci < cells.length; ci++) {
      var srcTd = cells[ci], newTd = document.createElement('td');
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
  tbl.appendChild(tbody); applyColVis(tbl, APP.p1.colVis);
  var outer = document.createElement('div'); outer.style.cssText = 'overflow-x:auto;width:100%';
  var inner = document.createElement('div'); inner.style.cssText = 'display:inline-block;min-width:100%;vertical-align:top;box-sizing:border-box';
  if (sLbl.parentNode === fc) fc.removeChild(sLbl);
  inner.appendChild(sLbl);
  if (sv.parentNode === fc) fc.removeChild(sv);
  inner.appendChild(sv); inner.appendChild(tbl); outer.appendChild(inner); fc.appendChild(outer);
  if (newHrow && colgroup) {
    restoreColWidths(tbl, 'colw_t1_fs');
    var newThs = newHrow.children, fsCols = colgroup.children;
    for (var hi = 1; hi < newThs.length; hi++) {
      if (!fsCols[hi]) continue;
      attachColResizeHandle(tbl, newThs[hi], fsCols[hi], 'colw_t1_fs');
    }
  }
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
  showToast(t('toast_capturing'));
  var tmp = document.createElement('div');
  tmp.style.cssText = 'position:fixed;left:-99999px;top:0;width:1200px;background:#fff;padding:24px;border:0';
  document.body.appendChild(tmp); buildFsContent(tmp);
  setTimeout(function() {
    captureEl(tmp, function(url) { document.body.removeChild(tmp); dlOrShare(url, t('fname_capture')); showToast(t('toast_dl_share_run')); });
  }, 80);
}

function doShareFromFs() {
  showToast(t('toast_capturing_alt'));
  captureEl(document.getElementById('fscnt'), function(url) { dlOrShare(url, t('fname_capture')); showToast(t('toast_dl_share_run')); });
}

function doMail(fromFS) {
  APP._mailFromFS = !!fromFS;
  document.getElementById('mail-to').value = '';
  openModal('m-mail');
}
