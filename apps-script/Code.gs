/**
 * 문장 암기 앱 백엔드 (Google Apps Script)
 *
 * 1) 구글시트에서 [확장 프로그램] > [Apps Script]를 열고 이 파일 내용을 붙여넣습니다.
 * 2) 위쪽 함수 선택에서 setup 을 고르고 [실행]. 권한 승인 후 로그에 토큰이 출력됩니다.
 * 3) [배포] > [새 배포] > 유형: 웹 앱, 실행: 나, 액세스: 모든 사용자 > 배포.
 * 4) 나온 웹 앱 URL과 토큰을 앱의 [설정] 탭에 입력합니다.
 */

const SHEET_NAME = 'Sentences';
const HEADERS = ['id', 'lang', 'text', 'reading', 'meaning', 'note', 'tags',
  'ease', 'interval', 'reps', 'due', 'lastReviewed', 'createdAt'];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // 날짜 칸이 자동 변환되지 않도록 텍스트 서식으로 고정
  sh.getRange('A:M').setNumberFormat('@');

  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    props.setProperty('TOKEN', token);
  }
  Logger.log('TOKEN: ' + token);
}

function doGet(e) {
  return handle_(e.parameter || {});
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }
  return handle_(body);
}

function handle_(req) {
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || req.token !== token) return json_({ ok: false, error: 'unauthorized' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (req.action) {
      case 'list': return json_({ ok: true, items: readAll_() });
      case 'upsert': return json_({ ok: true, count: upsert_(req.items || []) });
      case 'delete': return json_({ ok: true, count: remove_(req.ids || []) });
      default: return json_({ ok: false, error: 'unknown action' });
    }
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('setup()을 먼저 실행하세요');
  return sh;
}

function readAll_() {
  const values = sheet_().getDataRange().getValues();
  const head = values.shift();
  return values
    .filter(r => r[0] !== '')
    .map(r => {
      const o = {};
      head.forEach((h, i) => { o[h] = r[i] instanceof Date ? fmt_(r[i]) : r[i]; });
      ['ease', 'interval', 'reps'].forEach(k => { o[k] = Number(o[k]) || 0; });
      return o;
    });
}

function upsert_(items) {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  const rowById = {};
  for (let i = 1; i < values.length; i++) rowById[values[i][0]] = i + 1;

  const appends = [];
  items.forEach(it => {
    if (!it.id) return;
    const row = HEADERS.map(h => (it[h] === undefined || it[h] === null) ? '' : String(it[h]));
    if (rowById[it.id]) {
      sh.getRange(rowById[it.id], 1, 1, HEADERS.length).setValues([row]);
    } else {
      appends.push(row);
    }
  });
  if (appends.length) {
    sh.getRange(sh.getLastRow() + 1, 1, appends.length, HEADERS.length).setValues(appends);
  }
  return items.length;
}

function remove_(ids) {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  const set = new Set(ids);
  let n = 0;
  // 아래에서부터 지워야 행 번호가 밀리지 않음
  for (let i = values.length - 1; i >= 1; i--) {
    if (set.has(values[i][0])) { sh.deleteRow(i + 1); n++; }
  }
  return n;
}

function fmt_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
