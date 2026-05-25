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
  if (!pw) return { success: true, verified: true }; // 비밀번호 미설정 시 허용
  return { success: true, verified: (password === pw) };
}

function callOpenAI_auth(payload) {
  var pw = PropertiesService.getScriptProperties().getProperty('AI_PASSWORD');
  if (pw && payload.aiPassword !== pw) {
    return { success: false, error: 'AI 비밀번호가 올바르지 않습니다.' };
  }
  // aiPassword 필드 제거 후 OpenAI 호출
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

function deleteByFileName(sheet, fileName, prefix) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (data[i][1] === fileName && String(data[i][0]).indexOf(prefix) === 0) {
      sheet.deleteRow(i + 1);
    }
  }
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
    deleteByFileName(sheet, fileName, 'MTG_');
    sheet.appendRow(['MTG_META', fileName, ts, summary, 0, payload.author||'','','','','','','','','', JSON.stringify(colSet), '', '']);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || [];
      var pd  = (photos[i] && photos[i].data) ? JSON.stringify(photos[i].data) : '';
      var pdc = (photos[i] && photos[i].desc) ? JSON.stringify(photos[i].desc) : '';
      sheet.appendRow(['MTG_ROW', fileName, ts, summary, i+1,
        row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
        row[6]||'', row[7]||'', row[8]||'', JSON.stringify(colSet), pd, pdc]);
    }
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMeetingList() {
  try {
    var sheet = getSheet(SHEET1);
    var data  = sheet.getDataRange().getValues();
    var map   = {};
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === 'MTG_META') {
        map[String(data[i][1])] = { date: String(data[i][2]), author: String(data[i][5] || '') };
      }
    }
    var list = [];
    for (var k in map) if (map.hasOwnProperty(k)) list.push({ name: k, date: map[k].date, author: map[k].author });
    list.sort(function(a,b){ return b.date.localeCompare(a.date); });
    return { success: true, list: list };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMeeting(fileName) {
  try {
    var sheet = getSheet(SHEET1);
    var data  = sheet.getDataRange().getValues();
    var summary = '', colSettings = {}, rows = [];
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (String(r[1]) !== String(fileName)) continue;
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
    return { success: true, summary: summary, colSettings: colSettings, rows: rows };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function deleteMeeting(fileName) {
  try {
    var sheet = getSheet(SHEET1);
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (String(data[i][1]) === String(fileName)) sheet.deleteRow(i + 1);
    }
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
    deleteByFileName(sheet, fileName, 'LOAD_');
    sheet.appendRow(['LOAD_META', fileName, ts, JSON.stringify(processNames), 0,
      summary2,'','','','','','','','','','','','','','',basedate, payload.author||'','','','','','']);
    for (var i = 0; i < rows.length; i++) {
      var row  = rows[i] || [];
      var prog = progress[i] ? JSON.stringify(progress[i]) : '';
      sheet.appendRow(['LOAD_ROW', fileName, ts, JSON.stringify(processNames), i+1,
        row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
        row[6]||'', row[7]||'', row[8]||'', row[9]||'', row[10]||'',
        row[11]||'', row[12]||'', row[13]||'', row[14]||'', prog,'','']);
    }
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadLoadList() {
  try {
    var sheet = getSheet(SHEET2);
    var data  = sheet.getDataRange().getValues();
    var map   = {};
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === 'LOAD_META') {
        map[String(data[i][1])] = { date: String(data[i][2]), author: String(data[i][21] || '') };
      }
    }
    var list = [];
    for (var k in map) if (map.hasOwnProperty(k)) list.push({ name: k, date: map[k].date, author: map[k].author });
    list.sort(function(a,b){ return b.date.localeCompare(a.date); });
    return { success: true, list: list };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadLoad(fileName) {
  try {
    var sheet = getSheet(SHEET2);
    var data  = sheet.getDataRange().getValues();
    var processNames = [], summary2 = '', rows = [], progress = [], basedate = '';
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (String(r[1]) !== String(fileName)) continue;
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
    return { success: true, processNames: processNames, summary2: summary2,
             rows: rows, progress: progress, basedate: basedate };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function deleteLoad(fileName) {
  try {
    var sheet = getSheet(SHEET2);
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (String(data[i][1]) === String(fileName)) sheet.deleteRow(i + 1);
    }
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
    var data = sheet.getDataRange().getValues();
    for(var i=data.length-1;i>=0;i--){
      if(String(data[i][1])===String(fileName)&&String(data[i][0]).indexOf('MEMO_')===0){
        sheet.deleteRow(i+1);
      }
    }
    sheet.appendRow(['MEMO_META', fileName, ts,
      fields.date||'', fields.place||'', fields.attendees||'',
      fields.title||'', fields.content||'', fields.content2||'',
      fields.issues||'', fields.actions||'', fields.remarks||'',
      JSON.stringify(options), payload.author||''
    ]);
    return { success: true };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMemoList() {
  try {
    var sheet = getSheet(SHEET3);
    var data  = sheet.getDataRange().getValues();
    var map   = {};
    for(var i=0;i<data.length;i++){
      if(String(data[i][0])==='MEMO_META') {
        map[String(data[i][1])]={date:String(data[i][2]),author:String(data[i][13]||'')};
      }
    }
    var list=[];
    for(var k in map) if(map.hasOwnProperty(k)) list.push({name:k,date:map[k].date,author:map[k].author});
    list.sort(function(a,b){return b.date.localeCompare(a.date);});
    return { success:true, list:list };
  } catch(e){ return {success:false,error:e.toString()}; }
}

function loadMemo(fileName) {
  try {
    var sheet = getSheet(SHEET3);
    var data  = sheet.getDataRange().getValues();
    for(var i=0;i<data.length;i++){
      var r=data[i];
      if(String(r[0])==='MEMO_META'&&String(r[1])===String(fileName)){
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
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (String(data[i][1]) === String(fileName)) sheet.deleteRow(i + 1);
    }
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
