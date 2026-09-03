// ══════════════════════════════════════════════════════════════
// 스마트 공정관리 앱 - Google Apps Script (GAS) 백엔드
// ══════════════════════════════════════════════════════════════

// SS_ID: GAS 스크립트 속성(Script Properties)에 SPREADSHEET_ID 키로 설정하거나,
// 아래 기본값을 직접 수정하세요.
var SS_ID  = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
             || '16oPn8hzHJKYz2bK-cGs4awuIf_cU2HnCo3xh0CDUZ2U';
var SHEET1 = '기록';
var SHEET2 = '기록2';
var SHEET3 = '기록3';

/* ══ 초기 설정 (최초 1회만 실행) ══
   GAS 에디터에서 이 함수를 선택하고 ▶ 실행하면
   스크립트 속성이 자동으로 설정됩니다. */
function initScriptProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', '16oPn8hzHJKYz2bK-cGs4awuIf_cU2HnCo3xh0CDUZ2U');
  Logger.log('✅ SPREADSHEET_ID 설정 완료: ' + props.getProperty('SPREADSHEET_ID'));
}

/* ══ HTTP POST 핸들러 (외부 웹앱에서 API 호출용) ══ */
function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    var action = req.action;
    var payload = req.payload || {};
    var result;

    switch (action) {
      case 'saveMeeting':      result = saveMeeting(payload); break;
      case 'loadMeetingList':  result = loadMeetingList(); break;
      case 'loadMeeting':      result = loadMeeting(payload.fileName); break;
      case 'deleteMeeting':    result = deleteMeeting(payload.fileName); break;
      case 'saveLoad':         result = saveLoad(payload); break;
      case 'loadLoadList':     result = loadLoadList(); break;
      case 'loadLoad':         result = loadLoad(payload.fileName); break;
      case 'deleteLoad':       result = deleteLoad(payload.fileName); break;
      case 'saveMemo':         result = saveMemo(payload); break;
      case 'loadMemoList':     result = loadMemoList(); break;
      case 'loadMemo':         result = loadMemo(payload.fileName); break;
      case 'deleteMemo':       result = deleteMemo(payload.fileName); break;
      case 'sendReportEmail':  result = sendReportEmail(payload.base64Img, payload.subject, payload.recipientEmail); break;
      case 'callOpenAI':       result = callOpenAI_auth(payload); break;
      case 'verifyAiPassword': result = verifyAiPassword(payload.password); break;
      default: result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* GAS 기본 웹앱 진입점 (기존 개인 앱용 - 필요시 유지) */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'API Ready', version: '2.0' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ══ AI 비밀번호 인증 ══ */
function verifyAiPassword(password) {
  var pw = PropertiesService.getScriptProperties().getProperty('AI_PASSWORD');
  if (!pw) return { success: true, verified: true };
  return { success: true, verified: (password === pw) };
}

function callOpenAI_auth(payload) {
  var pw = PropertiesService.getScriptProperties().getProperty('AI_PASSWORD');
  if (pw && payload.aiPassword !== pw) {
    return { success: false, error: 'AI 비밀번호가 올바르지 않습니다.' };
  }
  var p = {};
  for (var k in payload) { if (k !== 'aiPassword') p[k] = payload[k]; }
  return callOpenAI(p);
}

/* ══ 내부 유틸 ══ */
function getSheet(name) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/* 파일명이 일치하는 행 범위(연속 구간) 목록을 반환.
   컬럼 B(파일명) 한 열만 읽어 전체 스캔 비용을 최소화한다. */
function findFileRows(sheet, fileName) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  var col = sheet.getRange(1, 2, lastRow, 1).getValues();
  var ranges = [], curStart = -1, curCount = 0;
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]) === String(fileName)) {
      if (curStart === -1) { curStart = i + 1; curCount = 1; }
      else curCount++;
    } else if (curStart !== -1) {
      ranges.push({ start: curStart, count: curCount }); curStart = -1; curCount = 0;
    }
  }
  if (curStart !== -1) ranges.push({ start: curStart, count: curCount });
  return ranges;
}

/* fileName에 해당하는 행들을 range 단위로 일괄 삭제 (행별 개별 삭제보다 훨씬 빠름) */
function deleteFileRows(sheet, fileName) {
  var ranges = findFileRows(sheet, fileName);
  for (var i = ranges.length - 1; i >= 0; i--) {
    sheet.deleteRows(ranges[i].start, ranges[i].count);
  }
}

/* setValues()는 모든 행의 열 수가 동일해야 하므로(appendRow와 달리),
   META/ROW 행의 길이가 서로 다를 수 있는 block을 최대 길이에 맞춰 패딩한다. */
function padBlock(block) {
  var maxLen = 0;
  for (var i = 0; i < block.length; i++) if (block[i].length > maxLen) maxLen = block[i].length;
  for (var j = 0; j < block.length; j++) {
    while (block[j].length < maxLen) block[j].push('');
  }
  return block;
}

/* ══ 목록 캐시 (CacheService) ══
   loadXxxList()는 불러오기 클릭마다 호출되므로 짧은 TTL로 캐시하고,
   저장/삭제 시 즉시 무효화한다. */
function listCacheKey(sheetName) { return 'list_' + sheetName; }
function invalidateListCache(sheetName) {
  try { CacheService.getScriptCache().remove(listCacheKey(sheetName)); } catch(e) {}
}

function nowStr() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function toDateStr(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  var s = String(val).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    var d = new Date(s);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
  } catch(e) {}
  return s;
}

/* ══ 협력사 미팅 협의록 ══ */
function saveMeeting(payload) {
  try {
    var sheet    = getSheet(SHEET1);
    var fileName = payload.fileName;
    var summary  = payload.summary  || '';
    var rows     = payload.rows     || [];
    var colSet   = payload.colSettings || {};
    var photos   = payload.photos   || [];
    var ts = nowStr();
    var author = payload.author || '';
    deleteFileRows(sheet, fileName);
    var colSetStr = JSON.stringify(colSet);
    // 열 구성: A~Q = 기존 데이터, R(index17) = 작성자 전용열
    var block = [];
    block.push(['MTG_META', fileName, ts, summary, 0, '','','','','','','','','', colSetStr, '', '', author]);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || [];
      var pd  = (photos[i] && photos[i].data) ? JSON.stringify(photos[i].data) : '';
      var pdc = (photos[i] && photos[i].desc) ? JSON.stringify(photos[i].desc) : '';
      block.push(['MTG_ROW', fileName, ts, summary, i+1,
        row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
        row[6]||'', row[7]||'', row[8]||'', colSetStr, pd, pdc, '']);
    }
    // 개별 appendRow N회 대신 한 번의 setValues로 일괄 기록 (훨씬 빠름)
    padBlock(block);
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, block.length, block[0].length).setValues(block);
    invalidateListCache(SHEET1);
    return { success: true, savedAuthor: author };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMeetingList() {
  try {
    var cache = CacheService.getScriptCache();
    var key = listCacheKey(SHEET1);
    var cached = cache.get(key);
    if (cached) return JSON.parse(cached);

    var sheet = getSheet(SHEET1);
    var lastRow = sheet.getLastRow();
    var list = [];
    if (lastRow >= 1) {
      // 목록 작성에는 A~F열(타입/파일명/일시/구버전작성자)과 R열(작성자)만 필요.
      // 사진 데이터(P,Q열) 등 무거운 열은 읽지 않아 스캔 비용을 크게 줄인다.
      var main = sheet.getRange(1, 1, lastRow, 6).getValues();
      var authorCol = sheet.getRange(1, 18, lastRow, 1).getValues();
      var map = {};
      for (var i = 0; i < main.length; i++) {
        if (String(main[i][0]) === 'MTG_META') {
          var au = String(authorCol[i][0] || main[i][5] || '');
          map[String(main[i][1])] = { date: String(main[i][2]), author: au };
        }
      }
      for (var k in map) if (map.hasOwnProperty(k)) list.push({ name: k, date: map[k].date, author: map[k].author });
      list.sort(function(a,b){ return b.date.localeCompare(a.date); });
    }
    var result = { success: true, list: list };
    try { cache.put(key, JSON.stringify(result), 300); } catch(e) {}
    return result;
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMeeting(fileName) {
  try {
    var sheet = getSheet(SHEET1);
    var ranges = findFileRows(sheet, fileName);
    var summary = '', colSettings = {}, rows = [];
    // loadMeeting은 사진 데이터(P,Q열)를 사용하지 않으므로 O열까지만 읽는다.
    var numCols = 15;
    for (var ri = 0; ri < ranges.length; ri++) {
      var rg = ranges[ri];
      var block = sheet.getRange(rg.start, 1, rg.count, numCols).getValues();
      for (var i = 0; i < block.length; i++) {
        var r = block[i];
        if (String(r[0]) === 'MTG_META') {
          summary = String(r[3] || '');
          try { colSettings = JSON.parse(String(r[14])); } catch(_) {}
        }
        if (String(r[0]) === 'MTG_ROW') {
          rows.push({ rowData: [
            String(r[5]||''), String(r[6]||''), String(r[7]||''),
            toDateStr(r[8]),  toDateStr(r[9]),  toDateStr(r[10]),
            String(r[11]||''), String(r[12]||''), String(r[13]||'')
          ]});
        }
      }
    }
    return { success: true, summary: summary, colSettings: colSettings, rows: rows };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function deleteMeeting(fileName) {
  try {
    var sheet = getSheet(SHEET1);
    deleteFileRows(sheet, fileName);
    invalidateListCache(SHEET1);
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

/* ══ 업체/품목별 부하관리 ══ */
function saveLoad(payload) {
  try {
    var sheet        = getSheet(SHEET2);
    var fileName     = payload.fileName;
    var processNames = payload.processNames || [];
    var summary2     = payload.summary2 || '';
    var rows         = payload.rows || [];
    var progress     = payload.progress || [];
    var basedate     = payload.basedate || '';
    var ts = nowStr();
    var author = payload.author || '';
    deleteFileRows(sheet, fileName);
    var pnStr = JSON.stringify(processNames);
    var block = [];
    block.push(['LOAD_META', fileName, ts, pnStr, 0,
      summary2,'','','','','','','','','','','','','','',basedate, author,'','','','','']);
    for (var i = 0; i < rows.length; i++) {
      var row  = rows[i] || [];
      var prog = progress[i] ? JSON.stringify(progress[i]) : '';
      block.push(['LOAD_ROW', fileName, ts, pnStr, i+1,
        row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
        row[6]||'', row[7]||'', row[8]||'', row[9]||'', row[10]||'',
        row[11]||'', row[12]||'', row[13]||'', row[14]||'', prog,'','']);
    }
    padBlock(block);
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, block.length, block[0].length).setValues(block);
    invalidateListCache(SHEET2);
    return { success: true, savedAuthor: author };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadLoadList() {
  try {
    var cache = CacheService.getScriptCache();
    var key = listCacheKey(SHEET2);
    var cached = cache.get(key);
    if (cached) return JSON.parse(cached);

    var sheet = getSheet(SHEET2);
    var lastRow = sheet.getLastRow();
    var list = [];
    if (lastRow >= 1) {
      var main = sheet.getRange(1, 1, lastRow, 3).getValues();
      var authorCol = sheet.getRange(1, 22, lastRow, 1).getValues();
      var map = {};
      for (var i = 0; i < main.length; i++) {
        if (String(main[i][0]) === 'LOAD_META') {
          map[String(main[i][1])] = { date: String(main[i][2]), author: String(authorCol[i][0] || '') };
        }
      }
      for (var k in map) if (map.hasOwnProperty(k)) list.push({ name: k, date: map[k].date, author: map[k].author });
      list.sort(function(a,b){ return b.date.localeCompare(a.date); });
    }
    var result = { success: true, list: list };
    try { cache.put(key, JSON.stringify(result), 300); } catch(e) {}
    return result;
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadLoad(fileName) {
  try {
    var sheet = getSheet(SHEET2);
    var ranges = findFileRows(sheet, fileName);
    var processNames = [], summary2 = '', rows = [], progress = [], basedate = '';
    var numCols = 21;
    for (var ri = 0; ri < ranges.length; ri++) {
      var rg = ranges[ri];
      var block = sheet.getRange(rg.start, 1, rg.count, numCols).getValues();
      for (var i = 0; i < block.length; i++) {
        var r = block[i];
        if (String(r[0]) === 'LOAD_META') {
          try { processNames = JSON.parse(String(r[3])); } catch(_) {}
          summary2 = String(r[5] || '');
          basedate = String(r[20] || '');
        }
        if (String(r[0]) === 'LOAD_ROW') {
          rows.push([
            String(r[5]||''),  String(r[6]||''),  String(r[7]||''),
            toDateStr(r[8]),   toDateStr(r[9]),   toDateStr(r[10]),
            String(r[11]||''),
            toDateStr(r[12]), toDateStr(r[13]),
            toDateStr(r[14]), toDateStr(r[15]),
            toDateStr(r[16]), toDateStr(r[17]),
            toDateStr(r[18]), toDateStr(r[19])
          ]);
          var progVal = String(r[20] || '');
          var progObj = {};
          try { if(progVal) progObj = JSON.parse(progVal); } catch(_) {}
          progress.push(progObj);
        }
      }
    }
    return { success: true, processNames: processNames, summary2: summary2,
             rows: rows, progress: progress, basedate: basedate };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function deleteLoad(fileName) {
  try {
    var sheet = getSheet(SHEET2);
    deleteFileRows(sheet, fileName);
    invalidateListCache(SHEET2);
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

/* ══ 메모/노트 ══ */
function saveMemo(payload) {
  try {
    var sheet    = getSheet(SHEET3);
    var fileName = payload.fileName;
    var fields   = payload.fields   || {};
    var options  = payload.options  || {};
    var ts = nowStr();
    deleteFileRows(sheet, fileName);
    var author = payload.author || '';
    sheet.appendRow(['MEMO_META', fileName, ts,
      fields.date||'', fields.place||'', fields.attendees||'',
      fields.title||'', fields.content||'', fields.content2||'',
      fields.issues||'', fields.actions||'', fields.remarks||'',
      JSON.stringify(options), author
    ]);
    invalidateListCache(SHEET3);
    return { success: true, savedAuthor: author };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMemoList() {
  try {
    var cache = CacheService.getScriptCache();
    var key = listCacheKey(SHEET3);
    var cached = cache.get(key);
    if (cached) return JSON.parse(cached);

    var sheet = getSheet(SHEET3);
    var lastRow = sheet.getLastRow();
    var list = [];
    if (lastRow >= 1) {
      var main = sheet.getRange(1, 1, lastRow, 3).getValues();
      var authorCol = sheet.getRange(1, 14, lastRow, 1).getValues();
      var map = {};
      for(var i=0;i<main.length;i++){
        if(String(main[i][0])==='MEMO_META') {
          map[String(main[i][1])]={date:String(main[i][2]),author:String(authorCol[i][0]||'')};
        }
      }
      for(var k in map) if(map.hasOwnProperty(k)) list.push({name:k,date:map[k].date,author:map[k].author});
      list.sort(function(a,b){return b.date.localeCompare(a.date);});
    }
    var result = { success:true, list:list };
    try { cache.put(key, JSON.stringify(result), 300); } catch(e) {}
    return result;
  } catch(e){ return {success:false,error:e.toString()}; }
}

function loadMemo(fileName) {
  try {
    var sheet = getSheet(SHEET3);
    var ranges = findFileRows(sheet, fileName);
    if (!ranges.length) return {success:false,error:'파일을 찾을 수 없습니다.'};
    var rg = ranges[0];
    var block = sheet.getRange(rg.start, 1, rg.count, 14).getValues();
    for (var i = 0; i < block.length; i++) {
      var r = block[i];
      if(String(r[0])==='MEMO_META'){
        var opts={};
        try{opts=JSON.parse(String(r[12]));}catch(_){}
        return {success:true,
          fields:{
            date:String(r[3]||''), place:String(r[4]||''), attendees:String(r[5]||''),
            title:String(r[6]||''), content:String(r[7]||''), content2:String(r[8]||''),
            issues:String(r[9]||''), actions:String(r[10]||''), remarks:String(r[11]||'')
          },
          options:opts
        };
      }
    }
    return {success:false,error:'파일을 찾을 수 없습니다.'};
  } catch(e){ return {success:false,error:e.toString()}; }
}

function deleteMemo(fileName) {
  try {
    var sheet = getSheet(SHEET3);
    deleteFileRows(sheet, fileName);
    invalidateListCache(SHEET3);
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

/* ══ 메일 전송 ══ */
function sendReportEmail(base64Img, subject, recipientEmail) {
  try {
    var recipient = recipientEmail ||
      PropertiesService.getScriptProperties().getProperty('REPORT_EMAIL') ||
      Session.getEffectiveUser().getEmail();
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Img.replace(/^data:image\/[a-z]+;base64,/, '')),
      'image/jpeg', 'report.jpg'
    );
    blob.setName('report.jpg');
    var htmlBody =
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">' +
      '<p>안녕하세요,</p>' +
      '<p>공정관리 협의록을 아래와 같이 공유드립니다.</p>' +
      '<br><img src="cid:reportImg" style="max-width:100%;border:1px solid #ccc;border-radius:4px"><br><br>' +
      '<p style="color:#888;font-size:12px">본 메일은 스마트 공정관리 앱에서 자동 발송되었습니다.</p>' +
      '</div>';
    GmailApp.sendEmail(recipient, subject || '협력사 공정관리 협의록', '', {
      htmlBody: htmlBody,
      inlineImages: { reportImg: blob }
    });
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

/* ══ 작성자 저장 진단용 테스트 함수 (GAS 편집기에서 직접 실행) ══
   실행 후 기록 시트의 마지막 행 R열에 "홍길동"이 보이면 정상 */
function testSaveAuthor() {
  var testFile = 'AUTHOR_TEST_' + nowStr().replace(/[:\s]/g, '-');
  var r = saveMeeting({
    fileName: testFile, summary: '테스트', rows: [],
    colSettings: {}, photos: [], author: '홍길동'
  });
  Logger.log('저장 결과: ' + JSON.stringify(r));
  Logger.log('기록 시트 열R에서 "' + testFile + '" 행의 작성자 확인하세요');
}

/* ══ OpenAI API 프록시 ══ */
function callOpenAI(payload) {
  try {
    var API_KEY = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
    if(!API_KEY){
      return { success: false, error: 'API 키가 설정되지 않았습니다. GAS 스크립트 속성 > OPENAI_API_KEY를 확인하세요.' };
    }
    var messages  = payload.messages  || [];
    var model     = payload.model     || 'gpt-4o';
    var maxTokens = payload.max_tokens || 4000;
    var temp      = payload.temperature != null ? payload.temperature : 0.1;
    var body = JSON.stringify({ model: model, messages: messages, max_tokens: maxTokens, temperature: temp });
    var resp = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post', contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + API_KEY },
      payload: body, muteHttpExceptions: true
    });
    var status = resp.getResponseCode();
    var text   = resp.getContentText();
    if (status !== 200) return { success: false, error: 'HTTP ' + status + ': ' + text };
    var json = JSON.parse(text);
    if (json.error) return { success: false, error: json.error.message || JSON.stringify(json.error) };
    var reply = '';
    if (json.choices && json.choices[0] && json.choices[0].message) {
      reply = json.choices[0].message.content || '';
    }
    return { success: true, reply: reply };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}
