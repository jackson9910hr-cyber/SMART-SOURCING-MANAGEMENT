// ══════════════════════════════════════════════════════════════
// 스마트 공정관리 앱 - Google Apps Script (GAS) 백엔드
// ══════════════════════════════════════════════════════════════

// 스크립트 속성(Script Properties) 목록
//   SPREADSHEET_ID       : 데이터 저장용 스프레드시트 ID (필수)
//   LOGIN_ID / LOGIN_PASSWORD : 로그인 계정 → setupLogin() 실행 시 해시로 변환 후 평문 삭제
//   OPENAI_API_KEY       : OpenAI API 키 (AI 기능 사용 시)
//   AI_PASSWORD          : AI 기능 추가 비밀번호 (선택)
//   MAIL_ALLOWED_DOMAINS : 메일 수신 허용 도메인, 쉼표 구분 (선택, 예: company.com,partner.co.kr)
var SS_ID  = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
var SHEET1 = '기록';
var SHEET2 = '기록2';
var SHEET3 = '기록3';

var SESSION_TTL_SEC   = 21600;  // 세션 유효시간 6시간 (CacheService 최대값)
var LOGIN_MAX_FAIL    = 5;      // 연속 실패 허용 횟수
var LOGIN_LOCK_SEC    = 900;    // 잠금 시간 15분
var HASH_ITERATIONS   = 1000;
var MAIL_DAILY_LIMIT  = 30;
var MAX_IMG_B64_LEN   = 15 * 1024 * 1024;
var AI_ALLOWED_MODELS = ['gpt-4o', 'gpt-4o-mini'];
var AI_MAX_TOKENS     = 4000;

/* ══ 로그인 계정 설정 (GAS 편집기에서 실행) ══
   1) 프로젝트 설정 > 스크립트 속성에 LOGIN_ID, LOGIN_PASSWORD 추가
   2) 이 함수를 선택하고 ▶ 실행 → 비밀번호가 해시로 저장되고 평문은 자동 삭제됨
      (실행하지 않아도 첫 로그인 시도 때 자동으로 처리됨)
   비밀번호를 바꿀 때도 LOGIN_PASSWORD를 다시 입력 (기존 세션은 모두 로그아웃됨) */
function setupLogin() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('LOGIN_ID');
  var pw = props.getProperty('LOGIN_PASSWORD');
  if (!id || !pw) throw new Error('스크립트 속성에 LOGIN_ID와 LOGIN_PASSWORD를 먼저 입력하세요.');
  if (pw.length < 8) throw new Error('비밀번호는 8자 이상으로 설정하세요.');
  var salt = Utilities.getUuid();
  props.setProperty('LOGIN_PW_SALT', salt);
  props.setProperty('LOGIN_PW_HASH', hashPassword(pw, salt));
  props.setProperty('SESSION_EPOCH', String(Date.now()));
  props.deleteProperty('LOGIN_PASSWORD');
  Logger.log('✅ 로그인 계정 설정 완료: ' + id + ' (평문 비밀번호는 삭제됨)');
  if (!props.getProperty('SPREADSHEET_ID')) Logger.log('⚠️ SPREADSHEET_ID 스크립트 속성이 비어 있습니다. 설정하세요.');
}

/* ══ 인증 ══ */
function hashPassword(pw, salt) {
  var h = salt + ':' + pw;
  for (var i = 0; i < HASH_ITERATIONS; i++) {
    h = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt, Utilities.Charset.UTF_8)
      .map(function(b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
  }
  return h;
}

function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sessionKey(token) {
  var epoch = PropertiesService.getScriptProperties().getProperty('SESSION_EPOCH') || '';
  return 'sess_' + epoch + '_' + token;
}

function login(id, pw) {
  var cache = CacheService.getScriptCache();
  if (cache.get('login_lock')) {
    return { success: false, error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.', locked: true };
  }
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('LOGIN_PASSWORD')) {
    try { setupLogin(); } catch (e) { return { success: false, error: e.message }; }
  }
  var savedId = props.getProperty('LOGIN_ID'), hash = props.getProperty('LOGIN_PW_HASH'), salt = props.getProperty('LOGIN_PW_SALT');
  if (!savedId || !hash || !salt) {
    return { success: false, error: '서버에 로그인 계정이 설정되지 않았습니다. GAS에서 setupLogin()을 실행하세요.' };
  }
  var ok = typeof id === 'string' && typeof pw === 'string' && pw.length <= 200 &&
           safeEqual(id, savedId) && safeEqual(hashPassword(pw, salt), hash);
  if (!ok) {
    var fails = Number(cache.get('login_fail') || 0) + 1;
    if (fails >= LOGIN_MAX_FAIL) {
      cache.put('login_lock', '1', LOGIN_LOCK_SEC);
      cache.remove('login_fail');
      return { success: false, error: '로그인 ' + LOGIN_MAX_FAIL + '회 실패로 15분간 잠금되었습니다.', locked: true };
    }
    cache.put('login_fail', String(fails), LOGIN_LOCK_SEC);
    return { success: false, error: 'ID 또는 비밀번호가 올바르지 않습니다. (' + fails + '/' + LOGIN_MAX_FAIL + ')' };
  }
  cache.remove('login_fail');
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put(sessionKey(token), '1', SESSION_TTL_SEC);
  return { success: true, token: token };
}

function isValidSession(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return false;
  var cache = CacheService.getScriptCache();
  var key = sessionKey(token);
  if (!cache.get(key)) return false;
  cache.put(key, '1', SESSION_TTL_SEC); // 사용 중이면 만료 연장
  return true;
}

function logout(token) {
  if (typeof token === 'string') CacheService.getScriptCache().remove(sessionKey(token));
  return { success: true };
}

/* ══ HTTP POST 핸들러 (외부 웹앱에서 API 호출용) ══ */
function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    var action = req.action;
    var payload = req.payload || {};
    var result;

    if (action === 'login') {
      result = login(payload.id, payload.password);
    } else if (!isValidSession(req.token)) {
      result = { success: false, authError: true, error: '로그인이 필요합니다.' };
    } else {
      switch (action) {
        case 'ping':             result = { success: true }; break;
        case 'logout':           result = logout(req.token); break;
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
        default: result = { success: false, error: 'Unknown action' };
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error(err);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Bad request' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ══ AI 비밀번호 인증 (로그인 후 추가 잠금, AI_PASSWORD 설정 시에만) ══ */
function verifyAiPassword(password) {
  var pw = PropertiesService.getScriptProperties().getProperty('AI_PASSWORD');
  if (!pw) return { success: true, verified: true };
  return { success: true, verified: safeEqual(password, pw) };
}

function callOpenAI_auth(payload) {
  var pw = PropertiesService.getScriptProperties().getProperty('AI_PASSWORD');
  if (pw && !safeEqual(payload.aiPassword, pw)) {
    return { success: false, error: 'AI 비밀번호가 올바르지 않습니다.' };
  }
  var p = {};
  for (var k in payload) { if (k !== 'aiPassword') p[k] = payload[k]; }
  return callOpenAI(p);
}

/* ══ 내부 유틸 ══ */
function getSheet(name) {
  if (!SS_ID) throw new Error('SPREADSHEET_ID 스크립트 속성이 설정되지 않았습니다.');
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
    var author = payload.author || '';
    deleteByFileName(sheet, fileName, 'MTG_');
    // 열 구성: A~Q = 기존 데이터, R(index17) = 작성자 전용열
    sheet.appendRow(['MTG_META', fileName, ts, summary, 0, '','','','','','','','','', JSON.stringify(colSet), '', '', author]);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || [];
      var pd  = (photos[i] && photos[i].data) ? JSON.stringify(photos[i].data) : '';
      var pdc = (photos[i] && photos[i].desc) ? JSON.stringify(photos[i].desc) : '';
      sheet.appendRow(['MTG_ROW', fileName, ts, summary, i+1,
        row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
        row[6]||'', row[7]||'', row[8]||'', JSON.stringify(colSet), pd, pdc, '']);
    }
    return { success: true, savedAuthor: author };
  } catch(e) { return { success: false, error: e.toString() }; }
}

function loadMeetingList() {
  try {
    var sheet = getSheet(SHEET1);
    var data  = sheet.getDataRange().getValues();
    var map   = {};
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === 'MTG_META') {
        // index17(열R)=작성자 전용열. 구버전 데이터는 index5(열F) fallback
        var au = String(data[i][17] || data[i][5] || '');
        map[String(data[i][1])] = { date: String(data[i][2]), author: au };
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
    var processDurations = payload.processDurations || [];
    var summary2     = payload.summary2 || '';
    var rows         = payload.rows || [];
    var progress     = payload.progress || [];
    var basedate     = payload.basedate || '';
    var ts = nowStr();
    var author = payload.author || '';
    deleteByFileName(sheet, fileName, 'LOAD_');
    sheet.appendRow(['LOAD_META', fileName, ts, JSON.stringify(processNames), 0,
      summary2,'','','','','','','','','','','','','','',basedate, author,'','','','','', JSON.stringify(processDurations)]);
    for (var i = 0; i < rows.length; i++) {
      var row  = rows[i] || [];
      var prog = progress[i] ? JSON.stringify(progress[i]) : '';
      sheet.appendRow(['LOAD_ROW', fileName, ts, JSON.stringify(processNames), i+1,
        row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
        row[6]||'', row[7]||'', row[8]||'', row[9]||'', row[10]||'',
        row[11]||'', row[12]||'', row[13]||'', row[14]||'', prog,'','']);
    }
    return { success: true, savedAuthor: author };
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
    var processNames = [], processDurations = [], summary2 = '', rows = [], progress = [], basedate = '';
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (String(r[1]) !== String(fileName)) continue;
      if (String(r[0]) === 'LOAD_META') {
        try { processNames = JSON.parse(String(r[3])); } catch(_) {}
        try { processDurations = JSON.parse(String(r[27])); } catch(_) {}
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
    return { success: true, processNames: processNames, processDurations: processDurations,
             summary2: summary2, rows: rows, progress: progress, basedate: basedate };
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
    var author = payload.author || '';
    sheet.appendRow(['MEMO_META', fileName, ts,
      fields.date||'', fields.place||'', fields.attendees||'',
      fields.title||'', fields.content||'', fields.content2||'',
      fields.issues||'', fields.actions||'', fields.remarks||'',
      JSON.stringify(options), author
    ]);
    return { success: true, savedAuthor: author };
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
function isAllowedRecipient(email, ownEmail) {
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) return false;
  if (ownEmail && email.toLowerCase() === ownEmail.toLowerCase()) return true;
  var domains = PropertiesService.getScriptProperties().getProperty('MAIL_ALLOWED_DOMAINS');
  if (!domains) return true;
  var host = email.split('@')[1].toLowerCase();
  return domains.split(',').some(function(d) {
    d = d.trim().toLowerCase().replace(/^@/, '');
    return d && (host === d || host.slice(-(d.length + 1)) === '.' + d);
  });
}

function sendReportEmail(base64Img, subject, recipientEmail) {
  try {
    var props = PropertiesService.getScriptProperties();
    var ownEmail = Session.getEffectiveUser().getEmail();
    var recipient = String(recipientEmail || props.getProperty('REPORT_EMAIL') || ownEmail).trim();
    if (!isAllowedRecipient(recipient, ownEmail)) {
      return { success: false, error: '허용되지 않은 수신자입니다. (MAIL_ALLOWED_DOMAINS 확인)' };
    }
    if (typeof base64Img !== 'string' || !base64Img || base64Img.length > MAX_IMG_B64_LEN) {
      return { success: false, error: '첨부 이미지가 없거나 너무 큽니다.' };
    }
    var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
    var cnt = {};
    try { cnt = JSON.parse(props.getProperty('MAIL_COUNT') || '{}'); } catch(_) {}
    var sent = cnt.date === today ? Number(cnt.count) || 0 : 0;
    if (sent >= MAIL_DAILY_LIMIT) {
      return { success: false, error: '오늘 메일 발송 한도(' + MAIL_DAILY_LIMIT + '건)를 초과했습니다.' };
    }
    subject = String(subject || '').replace(/[\r\n]+/g, ' ').slice(0, 200);
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
    props.setProperty('MAIL_COUNT', JSON.stringify({ date: today, count: sent + 1 }));
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
    var model     = AI_ALLOWED_MODELS.indexOf(payload.model) >= 0 ? payload.model : AI_ALLOWED_MODELS[0];
    var maxTokens = Math.min(Math.max(Number(payload.max_tokens) || AI_MAX_TOKENS, 1), AI_MAX_TOKENS);
    var temp      = Math.min(Math.max(Number(payload.temperature != null ? payload.temperature : 0.1) || 0, 0), 1);
    if (!Array.isArray(messages) || messages.length > 50) return { success: false, error: '잘못된 요청입니다.' };
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
