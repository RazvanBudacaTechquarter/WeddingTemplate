/**
 * Code.gs — RSVP backend for the wedding website.
 * Paste this into script.google.com (Extensions > Apps Script, from a
 * Google Sheet), fill in the constants below, run setup() once, then
 * deploy as a web app. See README.md for the full walkthrough.
 */

// TODO: paste the Sheet ID from its URL:
// https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit
const SHEET_ID = 'AICI_ID_SHEET';

// TODO: leave as-is unless you rename the tab.
const SHEET_NAME = 'RSVP';

// TODO: the address that gets an email every time someone submits.
const NOTIFY_EMAIL = 'maria.si.andrei@example.com';

// Column order — must match the row this script appends AND the
// header row setup() writes. Keep these two in sync if you edit either.
const COLOANE = [
  'Data trimiterii',
  'Nume și prenume',
  'Email',
  'Telefon',
  'Participare',
  'Persoane',
  'Însoțitori',
  'Meniu',
  'Alergii',
  'Cazare',
  'Melodie',
  'Mesaj',
];

/**
 * Run this once, manually, from the Apps Script editor (select
 * `setup` in the function dropdown, then Run). It creates the sheet
 * tab and writes the Romanian header row, so you don't have to
 * format it by hand.
 */
function setup() {
  const workbook = SpreadsheetApp.openById(SHEET_ID);
  let sheet = workbook.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = workbook.insertSheet(SHEET_NAME);
  }
  sheet.clear();
  sheet.appendRow(COLOANE);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, COLOANE.length);
}

/**
 * Handles the POST from js/main.js. Runs behind a script lock so two
 * RSVPs submitted at the same moment don't overwrite the same row.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const payload = JSON.parse(e.postData.contents);

    // Honeypot: a real guest never fills this in. Bots do. Pretend
    // success so the bot doesn't learn to look for a different signal.
    if (payload.website) {
      return raspunsJson({ ok: true });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    sheet.appendRow([
      new Date(),
      payload.nume || '',
      payload.email || '',
      payload.telefon || '',
      payload.participare || '',
      payload.persoane || '',
      payload.insotitori || '',
      payload.meniu || '',
      payload.alergii || '',
      payload.cazare || '',
      payload.melodie || '',
      payload.mesaj || '',
    ]);

    trimiteNotificare(payload);

    return raspunsJson({ ok: true });
  } catch (eroare) {
    return raspunsJson({ ok: false, eroare: String(eroare) });
  } finally {
    lock.releaseLock();
  }
}

function trimiteNotificare(payload) {
  const participa = payload.participare === 'da' ? 'DA' : 'NU';
  const subiect = `RSVP nou: ${payload.nume || '(fără nume)'} — ${participa}`;

  const corp = COLOANE
    .slice(1) // sari peste "Data trimiterii", nu e în payload
    .map((eticheta, index) => {
      const chei = ['nume', 'email', 'telefon', 'participare', 'persoane', 'insotitori', 'meniu', 'alergii', 'cazare', 'melodie', 'mesaj'];
      return `${eticheta}: ${payload[chei[index]] || '—'}`;
    })
    .join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subiect, corp);
}

function raspunsJson(obiect) {
  return ContentService
    .createTextOutput(JSON.stringify(obiect))
    .setMimeType(ContentService.MimeType.JSON);
}
