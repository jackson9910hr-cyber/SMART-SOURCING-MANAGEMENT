// ══════════════════════════════════════════════════════════════
// 탭2: 업체/품목별 부하관리 + Gantt 차트
// ══════════════════════════════════════════════════════════════

var CLS2  = ['c2-vend','c2-proj','c2-item','c2-req','c2-s','c2-e','c2-rmk','c2-p','c2-p','c2-p','c2-p','c2-p','c2-p','c2-p','c2-p'];
var CTR2  = [true, true, true, true, true, true, false, true, true, true, true, true, true, true, true];
var DATE2 = [false, false, false, true, true, true, false, true, true, true, true, true, true, true, true];

function calcLT(startStr, endStr) {
  var s = parseDate(startStr), e = parseDate(endStr);
  if (!s || !e || e <= s) return '';
  var diffMonths = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  return String(Math.round(diffMonths));
}

function calcProgress(rowIdx) {
  var p = APP.p2.progress[rowIdx];
  if (!p || p.pct === undefined) return '';
  return p.pct + '%';
}

function addRow2(vals) {
  var tbody = document.getElementById('tb2'), tr = document.createElement('tr');
  var rowIdx = tbody.rows.length;
  var nd = document.createElement('td'); nd.className = 'rn'; nd.textContent = rowIdx + 1; tr.appendChild(nd);

  // 업체~공정4완료 (15개 textarea)
  for (var i = 0; i < 15; i++) {
    var isDate = DATE2[i];
    var rv = vals ? (isDate ? normDate(vals[i]) : vals[i]) : '';
    tr.appendChild(makeTD(rv, CLS2[i], 2, CTR2[i], isDate));
  }

  // L/T 셀 (착수~완료 자동계산)
  var ltTd = document.createElement('td'); ltTd.className = 'c2-lt';
  var ltDiv = document.createElement('div'); ltDiv.className = 'ci-lt';
  if (vals) ltDiv.textContent = calcLT(vals[4], vals[5]);
  ltTd.appendChild(ltDiv);
  var allTds = tr.querySelectorAll('td');
  tr.insertBefore(ltTd, allTds[7]); // 완료일(6번) 다음, 비고(7번) 앞

  // 진도율 셀 (읽기전용)
  var progTd = document.createElement('td'); progTd.className = 'c2-prog';
  var progDiv = document.createElement('div'); progDiv.className = 'ci-ro';
  progDiv.style.color = APP.p2.progress[rowIdx] ? '#0055bb' : 'var(--txt3)';
  progDiv.textContent = calcProgress(rowIdx) || '-';
  progTd.appendChild(progDiv);
  tr.appendChild(progTd);

  // L/T 자동 업데이트 이벤트
  var allTA = tr.querySelectorAll('textarea');
  function updateLT() {
    var sVal = allTA[4] ? allTA[4].value : '';
    var eVal = allTA[5] ? allTA[5].value : '';
    ltDiv.textContent = calcLT(sVal, eVal);
  }
  if (allTA[4]) allTA[4].addEventListener('input', updateLT);
  if (allTA[5]) allTA[5].addEventListener('input', updateLT);

  document.getElementById('tb2').appendChild(tr);
  setDirty(2);
}

function getData2() {
  var out = [], rows = document.getElementById('tb2').rows;
  for (var i = 0; i < rows.length; i++) {
    var tas = rows[i].querySelectorAll('textarea'), row = [];
    for (var j = 0; j < tas.length; j++) row.push(tas[j].value);
    out.push(row);
  }
  return out;
}

function checkOverdue2() {
  var rows = document.getElementById('tb2').rows;
  for (var i = 0; i < rows.length; i++) {
    var tas = rows[i].querySelectorAll('textarea'); if (tas.length < 6) continue;
    var req = parseDate(tas[3].value.trim()), end = parseDate(tas[5].value.trim());
    if (req && end && end > req) { tas[5].style.color = 'var(--warn)'; tas[5].style.fontWeight = '700'; }
    else { tas[5].style.color = ''; tas[5].style.fontWeight = ''; }
    var ltDiv = rows[i].querySelector('.ci-lt');
    if (ltDiv) ltDiv.textContent = calcLT(tas[4].value, tas[5].value);
  }
}

function updateProgressCell(rowIdx, pct) {
  var rows = document.getElementById('tb2').rows;
  if (rowIdx >= rows.length) return;
  var progDivs = rows[rowIdx].querySelectorAll('.ci-ro');
  var progDiv = progDivs[progDivs.length - 1];
  if (progDiv) {
    progDiv.textContent = pct >= 0 ? pct + '%' : '-';
    progDiv.style.color = pct >= 0 ? '#0055bb' : 'var(--txt3)';
  }
}

function updateProcHeaders() {
  for (var i = 1; i <= 4; i++) {
    var n = APP.p2.pnames[i - 1] || ('공정' + i);
    document.getElementById('th-p' + i + 's').textContent = n + ' 착수';
    document.getElementById('th-p' + i + 'e').textContent = n + ' 완료';
  }
}

function openProcName() {
  for (var i = 1; i <= 4; i++) document.getElementById('pn' + i).value = APP.p2.pnames[i - 1] || '';
  openModal('m-pn');
}

function applyProcName() {
  for (var i = 1; i <= 4; i++) APP.p2.pnames[i - 1] = document.getElementById('pn' + i).value;
  updateProcHeaders(); closeModal('m-pn'); showToast('공정명 저장 완료');
  if (document.getElementById('gantt-sec').style.display !== 'none') buildGantt(APP.lastRows);
}

function updateGanttLegend() {
  var leg = document.getElementById('gleg'); if (!leg) return;
  var lc = [BAR_MAIN_COLOR].concat(PROC_COLORS), pn = APP.p2.pnames;
  var ln = ['전체(제작)', pn[0] || '공정1', pn[1] || '공정2', pn[2] || '공정3', pn[3] || '공정4'];
  leg.innerHTML = ln.map(function(n, i) {
    return '<div class="leg-item"><div class="leg-dot" style="background:' + lc[i] + '"></div><span>' + escH(n) + '</span></div>';
  }).join('');
}

function p2Complete() {
  var rows = getData2(); if (!rows.length) { showToast('데이터를 먼저 입력하세요', true); return; }
  var oldProgress = APP.p2.progress;
  rows.sort(function(a, b) {
    var da = parseDate(a[3]), db = parseDate(b[3]);
    if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
  });
  var tb2Rows = document.getElementById('tb2').rows;
  var origData = [];
  for (var ri = 0; ri < tb2Rows.length; ri++) {
    var tas = tb2Rows[ri].querySelectorAll('textarea');
    var row = []; for (var ci = 0; ci < tas.length; ci++) row.push(tas[ci].value);
    origData.push({ data: row, pct: oldProgress[ri] ? oldProgress[ri].pct : undefined });
  }
  var newProgress = {}, usedIdx = [];
  rows.forEach(function(r, newIdx) {
    for (var oi = 0; oi < origData.length; oi++) {
      if (usedIdx.indexOf(oi) >= 0) continue;
      if (origData[oi].data[0] === r[0] && origData[oi].data[4] === r[4] && origData[oi].data[5] === r[5]) {
        if (origData[oi].pct !== undefined) newProgress[newIdx] = { pct: origData[oi].pct };
        usedIdx.push(oi); break;
      }
    }
  });
  APP.p2.progress = newProgress;
  document.getElementById('tb2').innerHTML = '';
  rows.forEach(function(r) { addRow2(r); });
  setTimeout(function() {
    arAllTA(); checkOverdue2(); refreshAllRedOverlays('tb2');
    Object.keys(APP.p2.progress).forEach(function(idx) {
      var p = APP.p2.progress[idx]; if (p && p.pct !== undefined) updateProgressCell(parseInt(idx), p.pct);
    });
  }, 150);
  APP.lastRows = rows; buildGantt(rows);
  document.getElementById('gantt-sec').style.display = 'block';
  setTimeout(function() { document.getElementById('gantt-sec').scrollIntoView({ behavior: 'smooth' }); }, 100);
}

/* ══ Gantt 차트 ══ */
var _ganttClickBound = false;
function _ensureGanttClickDelegate() {
  if (_ganttClickBound) return;
  _ganttClickBound = true;
  document.addEventListener('click', function(e) {
    var td = e.target.closest('td[data-gantt-row]'); if (!td) return;
    var ganttOuter = document.getElementById('gantt-outer');
    if (!ganttOuter || !ganttOuter.contains(td)) return;
    _handleGanttProgressClick(e, td);
  });
  document.addEventListener('touchend', function(e) {
    var td = e.target.closest('td[data-gantt-row]'); if (!td) return;
    var ganttOuter = document.getElementById('gantt-outer');
    if (!ganttOuter || !ganttOuter.contains(td)) return;
    e.preventDefault(); _handleGanttProgressClick(e, td);
  }, { passive: false });
}

function _handleGanttProgressClick(e, td) {
  try {
    var rowIdx = parseInt(td.getAttribute('data-gantt-row'), 10);
    if (isNaN(rowIdx) || rowIdx < 0) return;
    var rows = APP.lastRows; if (!rows || rowIdx >= rows.length) return;
    var startDiso = td.getAttribute('data-startd'), endDiso = td.getAttribute('data-endd');
    if (!startDiso || !endDiso) return;
    var startDobj = new Date(startDiso), endDobj = new Date(endDiso);
    if (isNaN(startDobj.getTime()) || isNaN(endDobj.getTime())) return;
    var svg = td.querySelector('svg'); if (!svg) return;
    var vb = svg.getAttribute('viewBox'); if (!vb) return;
    var svgWparsed = parseFloat(vb.split(' ')[2]); if (!svgWparsed || isNaN(svgWparsed)) return;
    var rect = td.getBoundingClientRect();
    var clientX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    var relX = clientX - rect.left, tdW = rect.width;
    if (!tdW || tdW <= 0) return;
    var svgX = (relX / tdW) * svgWparsed; svgX = Math.max(0, Math.min(svgWparsed, svgX));
    var startXsvg = parseFloat(td.getAttribute('data-startxsvg') || 'NaN');
    var endXsvg   = parseFloat(td.getAttribute('data-endxsvg')   || 'NaN');
    if (isNaN(startXsvg) || isNaN(endXsvg)) return;
    var clickedX = Math.max(startXsvg, Math.min(endXsvg, svgX));
    var totalW = endXsvg - startXsvg;
    var pct = totalW > 0 ? Math.round(((clickedX - startXsvg) / totalW) * 100) : 0;
    pct = Math.max(0, Math.min(100, pct));
    APP.p2.progress[rowIdx] = { pct: pct };
    updateProgressCell(rowIdx, pct);
    setDirty(2);
    buildGantt(APP.lastRows);
    showToast('행 ' + (rowIdx + 1) + ' 진도율: ' + pct + '%');
  } catch(err) { showToast('진도율 입력 오류: ' + String(err), true); }
}

function buildGantt(rows) {
  if (!rows || !rows.length) return;
  var mn = null, mx = null;
  rows.forEach(function(r) {
    var s = parseDate(r[4]), e = parseDate(r[5]);
    if (s && (!mn || s < mn)) mn = new Date(s);
    if (e && (!mx || e > mx)) mx = new Date(e);
  });
  if (!mn || !mx) { showToast('제작착수일/제작완료일(YYYY-MM-DD)을 입력하세요', true); return; }
  var mos = [], cur = new Date(mn.getFullYear(), mn.getMonth(), 1);
  var endD = new Date(mx.getFullYear(), mx.getMonth() + 1, 0, 23, 59, 59);
  while (cur <= endD) { mos.push({ y: cur.getFullYear(), m: cur.getMonth() }); cur.setMonth(cur.getMonth() + 1); }
  var yrMap = {}; mos.forEach(function(mo) { yrMap[mo.y] = (yrMap[mo.y] || 0) + 1; });
  var yrKeys = Object.keys(yrMap).map(Number).sort(function(a, b) { return a - b; });
  function maxLen(ci) { var m = 0; rows.forEach(function(r) { m = Math.max(m, String(r[ci] || '').length); }); return m; }
  var clamp = function(n, a, b) { return Math.max(a, Math.min(b, n)); };
  var FW = {
    n: 38, v: clamp(64 + maxLen(0) * 8, 82, 240), p: clamp(64 + maxLen(1) * 8, 82, 240),
    i: clamp(64 + maxLen(2) * 8, 82, 240), req: 100, st: 100, en: 100, lt: 58, rm: clamp(40 + maxLen(6) * 7, 60, 200)
  };
  var fwArr = [FW.n, FW.v, FW.p, FW.i, FW.req, FW.st, FW.en, FW.lt, FW.rm];
  var MON_W = 42;
  if (mos.length > 12) {
    var fixedColsTotal = fwArr.reduce(function(a, b) { return a + b; }, 0);
    var ganttEl = document.getElementById('gantt-outer');
    var containerW = ganttEl ? ganttEl.clientWidth : window.innerWidth;
    if (containerW < 200) containerW = window.innerWidth;
    var availW = containerW - fixedColsTotal - 4;
    var autoW = Math.floor(availW / mos.length);
    MON_W = Math.max(18, Math.min(42, autoW));
  }
  var SVG_W = MON_W * mos.length;
  function dx(d) {
    if (!d) return null;
    var mi = -1;
    for (var i = 0; i < mos.length; i++) { if (mos[i].y === d.getFullYear() && mos[i].m === d.getMonth()) { mi = i; break; } }
    if (mi < 0) return null;
    var dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.max(0, Math.min(SVG_W, mi * MON_W + ((d.getDate() - 1) / dim) * MON_W));
  }
  var baseDateX = null;
  var bd = parseDate(APP.p2.basedate); if (bd) baseDateX = dx(bd);
  var FIXED_ROW_H = 36;
  var rowH = rows.map(function() { return FIXED_ROW_H; });
  var H1 = 28, H2 = 24;
  var HDR_BG  = 'background:linear-gradient(180deg,#c4d8f0 0%,#b0ccec 100%)';
  var HDR_BG2 = 'background:#b0ccec';
  var BORDER  = 'border:1px solid #a0c8e0';
  function tdFixed(i, w, rh, bg, extra) {
    return 'width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px;height:'+rh+'px;overflow:hidden;vertical-align:middle;text-align:center;background:'+bg+';'+BORDER+';'+(extra||'');
  }
  var outerDivStyle = mos.length > 12 ? 'overflow-x:visible;width:100%;position:relative' : 'overflow-x:auto;width:100%;position:relative';
  var outerDivClass = mos.length > 12 ? 'no-scroll' : '';
  var tableStyle    = mos.length > 12 ? 'border-collapse:separate;border-spacing:0;table-layout:fixed;width:100%' : 'border-collapse:separate;border-spacing:0;table-layout:fixed';
  var H = '<div class="' + outerDivClass + '" style="' + outerDivStyle + '">';
  H += '<table style="' + tableStyle + '" data-mon-w="' + MON_W + '">';
  H += '<colgroup>';
  fwArr.forEach(function(w) { H += '<col style="width:' + w + 'px;min-width:' + w + 'px">'; });
  if (mos.length > 12) mos.forEach(function() { H += '<col>'; });
  else mos.forEach(function() { H += '<col style="width:' + MON_W + 'px;min-width:' + MON_W + 'px">'; });
  H += '</colgroup><thead>';
  H += '<tr style="height:' + H1 + 'px">';
  var fixedLabels = ['#','업체명','프로젝트','품목명','요구납기','착수일','완료일','L/T','비고'];
  fwArr.forEach(function(w, i) {
    H += '<th rowspan="2" style="width:' + w + 'px;min-width:' + w + 'px;max-width:' + w + 'px;height:' + (H1 + H2) + 'px;box-sizing:border-box;vertical-align:middle;text-align:center;font-family:Rajdhani,sans-serif;font-size:13px;font-weight:700;color:#1e4060;padding:4px 6px;white-space:nowrap;overflow:hidden;' + BORDER + ';' + HDR_BG + '">' + fixedLabels[i] + '</th>';
  });
  yrKeys.forEach(function(y, yi) {
    var span = yrMap[y];
    var yrBdr = yi === yrKeys.length - 1 ? '' : ';border-right:3px solid #4a9cc8';
    H += '<th colspan="' + span + '" style="height:' + H1 + 'px;box-sizing:border-box;text-align:center;font-size:14px;font-weight:700;color:#003d8a;' + BORDER + yrBdr + ';' + HDR_BG + '">' + y + '</th>';
  });
  H += '</tr><tr style="height:' + H2 + 'px">';
  var monFontSize = MON_W >= 30 ? 12 : MON_W >= 22 ? 10 : 8;
  mos.forEach(function(mo) {
    var bdr = mo.m === 11 ? 'border-right:3px solid #4a9cc8;' : '';
    H += '<th style="height:' + H2 + 'px;box-sizing:border-box;font-size:' + monFontSize + 'px;padding:1px 0;text-align:center;' + BORDER + ';' + HDR_BG2 + ';' + bdr + '">' + (mo.m + 1) + '</th>';
  });
  H += '</tr></thead><tbody>';
  rows.forEach(function(r, ri) {
    var rh = rowH[ri];
    var reqD = parseDate(r[3]), endD2 = parseDate(r[5]), endOD = (reqD && endD2 && endD2 > reqD);
    var bg = ri % 2 === 1 ? '#eef4fc' : '#ffffff';
    H += '<tr style="height:' + rh + 'px" data-row="' + ri + '">';
    H += '<td style="' + tdFixed(0, FW.n, rh, bg, 'font-family:Share Tech Mono,monospace;font-size:13px;color:#4a6a88') + '">' + (ri + 1) + '</td>';
    H += '<td style="' + tdFixed(1, FW.v, rh, bg, 'font-size:13px') + '">' + renderRedMarkers(r[0]) + '</td>';
    H += '<td style="' + tdFixed(2, FW.p, rh, bg, 'font-size:13px') + '">' + renderRedMarkers(r[1]) + '</td>';
    H += '<td style="' + tdFixed(3, FW.i, rh, bg, 'font-size:13px') + '">' + renderRedMarkers(r[2]) + '</td>';
    H += '<td style="' + tdFixed(4, FW.req, rh, bg, 'font-size:12px') + '">' + renderRedMarkers(r[3]) + '</td>';
    H += '<td style="' + tdFixed(5, FW.st, rh, bg, 'font-size:12px') + '">' + renderRedMarkers(r[4]) + '</td>';
    H += '<td style="' + tdFixed(6, FW.en, rh, bg, 'font-size:12px;' + (endOD ? 'color:#cc1122;font-weight:700' : '')) + '">' + renderRedMarkers(r[5]) + '</td>';
    H += '<td style="' + tdFixed(7, FW.lt, rh, bg, 'font-size:12px') + '">' + escH(calcLT(r[4], r[5])) + '</td>';
    H += '<td style="' + tdFixed(8, FW.rm, rh, bg, 'font-size:13px;text-align:left;padding:4px 6px') + '">' + renderRedMarkers(r[6]) + '</td>';
    var startD = parseDate(r[4]), endD3 = parseDate(r[5]);
    var procs = [
      { s: parseDate(r[7]),  e: parseDate(r[8]),  ci: 0 },
      { s: parseDate(r[9]),  e: parseDate(r[10]), ci: 1 },
      { s: parseDate(r[11]), e: parseDate(r[12]), ci: 2 },
      { s: parseDate(r[13]), e: parseDate(r[14]), ci: 3 }
    ];
    var margin = 4, mainY = margin, mainH = Math.max(8, rh - margin * 2);
    var sp = [];
    mos.forEach(function(mo, idx) { var lx = idx * MON_W; sp.push('<line x1="' + lx + '" y1="0" x2="' + lx + '" y2="' + rh + '" stroke="#c0d8ee" stroke-width="0.7"/>'); });
    sp.push('<line x1="' + SVG_W + '" y1="0" x2="' + SVG_W + '" y2="' + rh + '" stroke="#c0d8ee" stroke-width="0.7"/>');
    if (startD && endD3) {
      var bx1 = dx(startD), bx2 = dx(endD3);
      if (bx1 !== null && bx2 !== null && bx2 > bx1) {
        sp.push('<defs><linearGradient id="mgr' + ri + '" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#7fe0ff;stop-opacity:0.95"/><stop offset="100%" style="stop-color:#2aaeff;stop-opacity:0.95"/></linearGradient></defs>');
        sp.push('<rect x="' + bx1.toFixed(2) + '" y="' + mainY + '" width="' + (bx2 - bx1).toFixed(2) + '" height="' + mainH + '" rx="3" ry="3" fill="url(#mgr' + ri + ')"/>');
      }
    }
    function clampX(x) { return Math.max(0, Math.min(SVG_W, x)); }
    function drawRect(xA, xB, y, h, color, rx2, op, clipId) {
      if (xA === null || xB === null || xB <= xA) return; var EPS = 0.45;
      var xx = clampX(xA - EPS / 2), ww = clampX(xB + EPS / 2) - xx; if (ww <= 0) return;
      var cp = clipId ? ' clip-path="url(#' + clipId + ')"' : '';
      sp.push('<rect x="' + xx.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + ww.toFixed(2) + '" height="' + h.toFixed(2) + '" rx="' + rx2 + '" ry="' + rx2 + '" fill="' + color + '" opacity="' + op + '"' + cp + '/>');
    }
    function segActive(p, a, b) { return p.s < b && p.e > a; }
    var validProcs = procs.filter(function(p) { return p.s && p.e && p.e > p.s; });
    if (validProcs.length === 1) {
      drawRect(dx(validProcs[0].s), dx(validProcs[0].e), mainY, mainH, PROC_COLORS[validProcs[0].ci], 0, 0.92, null);
    } else if (validProcs.length >= 2) {
      var times = []; validProcs.forEach(function(p) { times.push(p.s.getTime(), p.e.getTime()); });
      times = Array.from(new Set(times)).sort(function(a, b) { return a - b; }).map(function(t) { return new Date(t); });
      for (var ti = 0; ti < times.length - 1; ti++) {
        var ta2 = times[ti], tb2 = times[ti + 1]; if (!(tb2 > ta2)) continue;
        var act = validProcs.filter(function(p) { return segActive(p, ta2, tb2); }).sort(function(a, b) { return a.ci - b.ci; });
        if (!act.length) continue;
        var xA = dx(ta2), xB = dx(tb2); if (xA === null || xB === null || xB <= xA) continue;
        if (act.length === 1) { drawRect(xA, xB, mainY, mainH, PROC_COLORS[act[0].ci], 0, 0.92, null); }
        else {
          var clipId = 'cp' + ri + '_' + ti;
          var cx1 = clampX(xA), cx2 = clampX(xB);
          sp.push('<defs><clipPath id="' + clipId + '"><rect x="' + cx1.toFixed(2) + '" y="' + mainY + '" width="' + (cx2 - cx1).toFixed(2) + '" height="' + mainH + '" /></clipPath></defs>');
          var gap = 1, laneH = (mainH - gap * (act.length - 1)) / act.length; if (laneH < 6) { gap = 0; laneH = mainH / act.length; }
          for (var k = 0; k < act.length; k++) { drawRect(xA, xB, mainY + k * (laneH + gap), laneH, PROC_COLORS[act[k].ci], 0, 0.92, clipId); }
        }
      }
    }
    var progState = APP.p2.progress[ri];
    if (progState && progState.pct !== undefined && startD && endD3) {
      var startXprog = dx(startD), endXprog = dx(endD3);
      if (startXprog !== null && endXprog !== null && endXprog > startXprog) {
        var grayW = Math.max(0, (progState.pct / 100) * (endXprog - startXprog));
        sp.push('<rect x="' + startXprog.toFixed(2) + '" y="0" width="' + grayW.toFixed(2) + '" height="' + rh + '" fill="rgba(80,80,80,0.45)" rx="0"/>');
      }
    }
    if (baseDateX !== null) {
      sp.push('<line x1="' + baseDateX.toFixed(2) + '" y1="0" x2="' + baseDateX.toFixed(2) + '" y2="' + rh + '" stroke="#cc1122" stroke-width="2.2" stroke-dasharray="5,3" opacity="0.88"/>');
    }
    var _startXsvg = startD ? dx(startD) : null;
    var _endXsvg   = endD3  ? dx(endD3)  : null;
    var _sxAttr = _startXsvg !== null ? _startXsvg.toFixed(2) : '';
    var _exAttr = _endXsvg   !== null ? _endXsvg.toFixed(2)   : '';
    var yrBorderXs = []; mos.forEach(function(mo, idx) { if (mo.m === 11) yrBorderXs.push((idx + 1) * MON_W); });
    H += '<td colspan="' + mos.length + '" style="padding:0;overflow:hidden;height:' + rh + 'px;vertical-align:top;position:relative;' + BORDER + ';cursor:crosshair" data-gantt-row="' + ri + '" data-startd="' + (startD ? startD.toISOString() : '') + '" data-endd="' + (endD3 ? endD3.toISOString() : '') + '" data-startxsvg="' + _sxAttr + '" data-endxsvg="' + _exAttr + '">';
    H += '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" shape-rendering="geometricPrecision" style="display:block;width:100%;height:' + rh + 'px;position:relative;z-index:1" viewBox="0 0 ' + SVG_W + ' ' + rh + '" data-svg-row="' + ri + '">';
    H += sp.join(''); H += '</svg>';
    yrBorderXs.forEach(function(bx) {
      var pct = (bx / SVG_W * 100).toFixed(4);
      H += '<div style="position:absolute;top:0;bottom:0;left:' + pct + '%;width:3px;background:#4a9cc8;z-index:2;margin-left:-3px;pointer-events:none"></div>';
    });
    H += '</td></tr>';
  });
  H += '</tbody></table></div>';
  document.getElementById('gantt-outer').innerHTML = H;
  updateGanttLegend();
  _ensureGanttClickDelegate();
}

/* ══ Gantt 전체화면 ══ */
function ganttFullscreen() {
  var fc = document.getElementById('fscnt2'); fc.innerHTML = '';
  var title = document.createElement('div');
  title.style.cssText = 'font-family:var(--fh);font-size:20px;font-weight:700;color:var(--accentD);letter-spacing:2px;margin-bottom:12px;text-transform:uppercase;padding-bottom:9px;border-bottom:2px solid var(--panel)';
  title.textContent = '◈ 업체/품목별 부하관리 · PROCESS GANTT CHART'; fc.appendChild(title);
  var rows = APP.lastRows;
  if (!rows || !rows.length) {
    fc.innerHTML += '<div style="color:var(--txt3);padding:20px;text-align:center">간트 데이터가 없습니다. 작성완료 버튼을 먼저 눌러주세요.</div>';
    document.getElementById('fsov2').classList.add('active'); return;
  }
  var sLbl = document.createElement('div'); sLbl.style.cssText = 'font-family:var(--fh);font-size:13px;font-weight:700;color:var(--txt2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px'; sLbl.textContent = '■ 부하분석 SUMMARY';
  var sv = document.createElement('div'); sv.style.cssText = 'font-size:14px;color:var(--txt);background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:9px 13px;margin-bottom:14px;white-space:pre-wrap;line-height:1.7;box-sizing:border-box;width:100%'; sv.textContent = document.getElementById('p2sum').value || '(요약 없음)';
  var ganttOuter = document.getElementById('gantt-outer');
  var fsGanttOuter = document.createElement('div'); fsGanttOuter.className = 'gantt-outer'; fsGanttOuter.style.cssText = 'border:1.5px solid var(--border);border-radius:var(--r);background:var(--bg3);box-shadow:var(--sh);overflow:auto';
  ganttOuter.id = 'gantt-outer-tmp'; fsGanttOuter.id = 'gantt-outer'; document.body.appendChild(fsGanttOuter);
  buildGantt(rows);
  fsGanttOuter.id = 'gantt-outer-fs'; ganttOuter.id = 'gantt-outer'; document.body.removeChild(fsGanttOuter);
  var fsWrapper = document.createElement('div'); fsWrapper.style.cssText = 'display:block;min-width:100%;box-sizing:border-box';
  [sLbl, sv].forEach(function(el) { if (el.parentNode === fc) fc.removeChild(el); fsWrapper.appendChild(el); });
  var fsLeg = document.createElement('div'); fsLeg.className = 'gantt-legend'; fsLeg.style.cssText = 'margin:0 0 10px 0;';
  var lc = [BAR_MAIN_COLOR].concat(PROC_COLORS), pn = APP.p2.pnames;
  var ln = ['전체(제작)', pn[0] || '공정1', pn[1] || '공정2', pn[2] || '공정3', pn[3] || '공정4'];
  ln.forEach(function(n, i) {
    var item = document.createElement('div'); item.className = 'leg-item';
    item.innerHTML = '<div class="leg-dot" style="background:' + lc[i] + '"></div><span>' + escH(n) + '</span>';
    fsLeg.appendChild(item);
  });
  fsWrapper.appendChild(fsLeg); fsWrapper.appendChild(fsGanttOuter); fc.appendChild(fsWrapper);
  document.getElementById('fsov2').classList.add('active');
}

function closeFS2() { document.getElementById('fsov2').classList.remove('active'); }

function ganttShare() { showToast('캡쳐 중...'); captureGanttFull(function(url) { dlOrShare(url, '간트차트.jpg'); showToast('다운로드/공유 실행'); }, false); }
function ganttMail() { showToast('메일 준비 중...'); captureGanttFull(function(url) { sendMail(url, '부하관리 간트차트'); }, true); }
function ganttShareFromFs() {
  showToast('캡쳐 중...');
  var fsov2 = document.getElementById('fsov2');
  html2canvas(fsov2, { backgroundColor: '#ffffff', scale: 1.5, useCORS: true, logging: false, scrollX: 0, scrollY: -fsov2.scrollTop, x: 0, y: 0, width: fsov2.scrollWidth, height: fsov2.scrollHeight, windowWidth: fsov2.scrollWidth, windowHeight: fsov2.scrollHeight })
  .then(function(c) { dlOrShare(c.toDataURL('image/jpeg', 0.9), '간트차트.jpg'); showToast('다운로드/공유 실행'); });
}

function captureGanttFull(cb, forMail) {
  var fsov2 = document.getElementById('fsov2');
  if (fsov2.classList.contains('active')) {
    captureEl(document.getElementById('fscnt2'), cb, forMail); return;
  }
  var tmp = document.createElement('div'); tmp.style.cssText = 'position:fixed;left:-99999px;top:0;width:1400px;background:#fff;padding:24px;border:0;overflow:visible';
  document.body.appendChild(tmp);
  var clone = document.getElementById('gantt-outer').cloneNode(true); clone.style.cssText = 'border:1.5px solid #8ab8d8;border-radius:5px;overflow:visible';
  tmp.appendChild(clone);
  setTimeout(function() { captureEl(tmp, function(url) { document.body.removeChild(tmp); cb(url); }, forMail); }, 120);
}
