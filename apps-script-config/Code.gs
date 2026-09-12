/**
 * Code.gs — CONFIG backend for the wedding website.
 *
 * Reads content (colors, fonts, copy, photos — everything) from a Google
 * Sheet that only you can see, and serves it as JSON to anyone who asks.
 * The Sheet itself is never exposed — this script runs "as you" and only
 * ever hands back the specific fields below, never a link to the Sheet
 * or edit access to it.
 *
 * Paste this into its own Google Sheet (Extensions > Apps Script), fill
 * in CONFIG_SHEET_ID, run setup() once, then deploy as a web app. See
 * README.md, section "Editing the site content", for the full walkthrough.
 *
 * This is a SEPARATE Apps Script project from apps-script/Code.gs (the
 * RSVP one) — they read different Sheets and do different jobs. Keep
 * them separate; don't merge the two Sheets into one.
 */

// TODO: paste the Sheet ID from its URL:
// https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit
const CONFIG_SHEET_ID = 'AICI_ID_SHEET_CONFIG';

// How long a served response is cached before the next visitor's request
// re-reads the Sheet, in seconds. Lower = edits show up faster for new
// visitors; higher = fewer Sheet reads and a faster page load. 300 (five
// minutes) is a reasonable default for a site guests only visit once or
// twice.
const CACHE_SECONDS = 300;

// Tab names — must match exactly what setup() creates. If you rename a
// tab in the Sheet, update the matching name here too.
const TAB_GENERAL = 'General';
const TAB_POVESTE = 'Poveste';
const TAB_DETALII = 'Detalii';
const TAB_PROGRAM = 'Program';
const TAB_INFO = 'Info';
const TAB_GALERIE = 'Galerie';
const TAB_INTREBARI = 'Intrebari';

/**
 * Run this once, manually, from the Apps Script editor (select `setup`
 * in the function dropdown, then Run). It builds every tab with the
 * right headers and today's placeholder content, so you have something
 * real to edit instead of a blank sheet.
 */
function setup() {
  const ss = SpreadsheetApp.openById(CONFIG_SHEET_ID);

  // ---- General: flat key/value pairs. Dotted keys (culori.vin) become
  // nested fields in the JSON (config.culori.vin) — that's the only
  // "trick" in this whole sheet; everything else is a plain table. ----
  const general = getOrCreateSheet(ss, TAB_GENERAL);
  general.clear();
  general.appendRow(['Cheie', 'Valoare']);
  const randuriGeneral = [
    ['culori.vin', '#6E1030'],
    ['culori.cerneala', '#191426'],
    ['culori.in', '#F4EFE6'],
    ['culori.aur', '#C08A34'],
    ['culori.brad', '#2C4536'],
    ['fonturi.display', 'Fraunces, serif'],
    ['fonturi.body', 'Inter, sans-serif'],
    ['fonturi.marimeText', '16px'],
    ['fonturi.marimeTitluMare', 'clamp(2.75rem, 9vw, 5rem)'],
    ['fonturi.marimeTitluSectiune', '1.875rem'],
    // Formatul e fix: AAAA-LL-ZZTOO:MM:00+03:00 — nu șterge fusul orar.
    ['dataNuntii', '2027-06-12T16:00:00+03:00'],
    ['mesajDupaNunta', 'Ne-am căsătorit!'],
    ['termenLimitaRsvp', '1 mai 2027'],
    // URL-ul scriptului RSVP (celălalt Apps Script, din README pasul 2).
    ['appsScriptUrl', 'https://script.google.com/macros/s/AICI_URL_TAU/exec'],
    ['miri.nume1', 'Maria'],
    ['miri.nume2', 'Andrei'],
    ['miri.dataAfisata', '12 iunie 2027'],
    ['miri.oras', 'Cluj-Napoca'],
    ['poveste.fotoNumeFisier', 'poveste.jpg'],
    ['poveste.fotoDescriere', 'Maria și Andrei'],
    ['notaDetalii', 'Parcare disponibilă la fața locului. Pentru cei care vin din Cluj, organizăm un microbuz — detalii la secțiunea Info.'],
    ['contact.telefon', '07XX XXX XXX'],
    ['contact.email', 'maria.si.andrei@example.com'],
  ];
  // Forțează coloana B ca text simplu ÎNAINTE de a scrie valorile — dacă
  // formatul e aplicat după setValues(), Sheets a apucat deja să
  // reinterpreteze o valoare ca dataNuntii drept un tip de dată/număr,
  // iar formatul de-abia aplicat nu mai desface acea conversie.
  general.getRange(2, 2, randuriGeneral.length, 1).setNumberFormat('@');
  general.getRange(2, 1, randuriGeneral.length, 2).setValues(randuriGeneral);
  general.setFrozenRows(1);
  general.autoResizeColumns(1, 2);

  // ---- Poveste: one paragraph per row ----
  const poveste = getOrCreateSheet(ss, TAB_POVESTE);
  poveste.clear();
  poveste.appendRow(['Paragraf']);
  poveste.getRange(2, 1, 3, 1).setValues([
    ['Ne-am cunoscut într-o joi ploioasă, la o petrecere la care niciunul dintre noi nu voia să meargă. Am rămas de vorbă până dimineața, iar de-atunci nu ne-am mai despărțit.'],
    ['Trei ani mai târziu, într-o drumeție în munți, Andrei a îngenuncheat exact în locul unde ne-am oprit să admirăm priveliștea. Maria a spus da înainte să termine el întrebarea.'],
    ['Acum vrem să sărbătorim începutul acestei noi etape alături de voi, cei mai dragi oameni din viața noastră.'],
  ]);
  poveste.setFrozenRows(1);
  poveste.autoResizeColumns(1, 1);

  // ---- Detalii: one row per venue ----
  const detalii = getOrCreateSheet(ss, TAB_DETALII);
  detalii.clear();
  detalii.appendRow(['titlu', 'ora', 'loc', 'adresa']);
  // Coloana "ora" (B) trebuie forțată text ÎNAINTE de setValues, altfel
  // Sheets citește "12:00" ca oră și îl întoarce mai târziu ca obiect
  // Date complet (ex. "Sat Dec 30 1899 12:00:00 GMT+..."), nu ca text.
  detalii.getRange(2, 2, 3, 1).setNumberFormat('@');
  detalii.getRange(2, 1, 3, 4).setValues([
    ['Cununia civilă', '12:00', 'Primăria Cluj-Napoca', 'Str. Moților 3, Cluj-Napoca'],
    ['Cununia religioasă', '14:00', 'Biserica Sfântul Mihail', 'Piața Unirii 1, Cluj-Napoca'],
    ['Petrecerea', '18:00', 'Conacul Bonțida', 'Bonțida, jud. Cluj'],
  ]);
  detalii.setFrozenRows(1);
  detalii.autoResizeColumns(1, 4);

  // ---- Program: one row per moment din program ----
  const program = getOrCreateSheet(ss, TAB_PROGRAM);
  program.clear();
  program.appendRow(['ora', 'eveniment']);
  // Coloana "ora" (A) forțată text ÎNAINTE de setValues — vezi nota
  // de la tab-ul Detalii mai sus, e aceeași cauză.
  program.getRange(2, 1, 6, 1).setNumberFormat('@');
  program.getRange(2, 1, 6, 2).setValues([
    ['12:00', 'Cununia civilă'],
    ['14:00', 'Cununia religioasă'],
    ['17:00', 'Sosirea invitaților la locația petrecerii'],
    ['18:00', 'Intrarea mirilor și primul dans'],
    ['19:00', 'Cina'],
    ['21:00', 'Tortul și petrecerea continuă până dimineața'],
  ]);
  program.setFrozenRows(1);
  program.autoResizeColumns(1, 2);

  // ---- Info: patru blocuri ----
  const info = getOrCreateSheet(ss, TAB_INFO);
  info.clear();
  info.appendRow(['titlu', 'text']);
  info.getRange(2, 1, 4, 2).setValues([
    ['Ținuta', 'Ținută elegantă. Vă rugăm să evitați albul și nuanțele de roșu aprins.'],
    ['Cazare', 'Am rezervat un număr de camere la Hotel Central, cu tarif preferențial pentru invitați. Menționează codul NUNTA-MA la rezervare.'],
    ['Copii', 'Ne bucurăm să-i avem alături pe cei mici. Te rugăm să ne spui numărul lor în formularul de confirmare.'],
    ['Cadouri', 'Prezența voastră este cel mai important cadou. Pentru cei care doresc totuși să ne bucure cu un gând, avem un plic pregătit la eveniment.'],
  ]);
  info.setFrozenRows(1);
  info.autoResizeColumns(1, 2);

  // ---- Galerie: numele fișierelor din folderul img/ ----
  const galerie = getOrCreateSheet(ss, TAB_GALERIE);
  galerie.clear();
  galerie.appendRow(['fisier', 'descriere']);
  galerie.getRange(2, 1, 6, 2).setValues([
    ['galerie-1.jpg', 'Maria și Andrei la o plimbare'],
    ['galerie-2.jpg', 'Cererea în căsătorie în munți'],
    ['galerie-3.jpg', 'Maria și Andrei zâmbind'],
    ['galerie-4.jpg', 'O seară de vară împreună'],
    ['galerie-5.jpg', 'Andrei și Maria la o nuntă de prieteni'],
    ['galerie-6.jpg', 'Călătorie împreună'],
  ]);
  galerie.setFrozenRows(1);
  galerie.autoResizeColumns(1, 2);

  // ---- Intrebari: FAQ ----
  const intrebari = getOrCreateSheet(ss, TAB_INTREBARI);
  intrebari.clear();
  intrebari.appendRow(['intrebare', 'raspuns']);
  intrebari.getRange(2, 1, 4, 2).setValues([
    ['Pot aduce copiii?', 'Da, cu mare drag. Te rugăm doar să ne spui numărul lor în formularul de confirmare, ca să pregătim locuri și meniu.'],
    ['Există parcare la locație?', 'Da, parcarea este gratuită și disponibilă chiar la intrare.'],
    ['Pot aduce un însoțitor neanunțat?', 'Te rugăm să ne anunți din timp prin formular, ca să putem organiza locurile și mesele corect.'],
    ['Până când pot confirma prezența?', 'Termenul limită este 1 mai 2027. După această dată nu vom mai putea garanta locul la masă.'],
  ]);
  intrebari.setFrozenRows(1);
  intrebari.autoResizeColumns(1, 2);

  // Șterge tab-ul implicit "Sheet1" dacă a rămas gol și neutilizat.
  const implicit = ss.getSheetByName('Sheet1');
  if (implicit && ss.getSheets().length > 1) {
    ss.deleteSheet(implicit);
  }
}

/**
 * Handles the GET request from js/main.js. Returns the whole site's
 * content as one JSON object, shaped to match what main.js expects
 * (CONFIG.culori.vin, CONFIG.miri.nume1, CONFIG.detalii[0].titlu, etc).
 */
function doGet(e) {
  const cache = CacheService.getScriptCache();
  const cheieCache = 'config-v1';
  const dinCache = cache.get(cheieCache);
  if (dinCache) {
    return raspunsJson(JSON.parse(dinCache));
  }

  const ss = SpreadsheetApp.openById(CONFIG_SHEET_ID);

  const general = citesteChiePereche(ss.getSheetByName(TAB_GENERAL));
  const config = desfaCheiePunctate(general);

  config.poveste = config.poveste || {};
  config.poveste.paragrafe = citesteColoana(ss.getSheetByName(TAB_POVESTE), 'Paragraf');

  config.detalii = citesteTabel(ss.getSheetByName(TAB_DETALII));
  config.program = citesteTabel(ss.getSheetByName(TAB_PROGRAM));
  config.info = citesteTabel(ss.getSheetByName(TAB_INFO));
  config.galerie = citesteTabel(ss.getSheetByName(TAB_GALERIE));
  config.intrebari = citesteTabel(ss.getSheetByName(TAB_INTREBARI));

  const json = JSON.stringify(config);
  cache.put(cheieCache, json, CACHE_SECONDS);

  return raspunsJson(config);
}

/**
 * Citește un tab cu două coloane (Cheie, Valoare) și întoarce un obiect
 * plat { 'culori.vin': '#6E1030', ... }.
 */
function citesteChiePereche(sheet) {
  const valori = sheet.getDataRange().getValues();
  const rezultat = {};
  for (let i = 1; i < valori.length; i++) {
    const cheie = String(valori[i][0]).trim();
    if (!cheie) continue;
    rezultat[cheie] = String(valori[i][1]).trim();
  }
  return rezultat;
}

/**
 * Transformă { 'culori.vin': '#6E1030', 'miri.nume1': 'Maria' } în
 * { culori: { vin: '#6E1030' }, miri: { nume1: 'Maria' } }.
 */
function desfaCheiePunctate(plat) {
  const rezultat = {};
  Object.keys(plat).forEach((cheieCompleta) => {
    const parti = cheieCompleta.split('.');
    let nod = rezultat;
    parti.forEach((parte, index) => {
      if (index === parti.length - 1) {
        nod[parte] = plat[cheieCompleta];
      } else {
        nod[parte] = nod[parte] || {};
        nod = nod[parte];
      }
    });
  });
  return rezultat;
}

/**
 * Citește o singură coloană (după numele din antet) și întoarce un
 * array de valori, ignorând rândurile goale.
 */
function citesteColoana(sheet, numeAntet) {
  const valori = sheet.getDataRange().getValues();
  const antet = valori[0].map((v) => String(v).trim());
  const index = antet.indexOf(numeAntet);
  if (index === -1) return [];

  const rezultat = [];
  for (let i = 1; i < valori.length; i++) {
    const valoare = String(valori[i][index]).trim();
    if (valoare) rezultat.push(valoare);
  }
  return rezultat;
}

/**
 * Citește un tab întreg ca listă de obiecte, folosind rândul de antet
 * ca nume de câmpuri. Sare peste rândurile complet goale.
 */
function citesteTabel(sheet) {
  const valori = sheet.getDataRange().getValues();
  const antet = valori[0].map((v) => String(v).trim());

  const rezultat = [];
  for (let i = 1; i < valori.length; i++) {
    const rand = valori[i];
    const totulGol = rand.every((celula) => String(celula).trim() === '');
    if (totulGol) continue;

    const obiect = {};
    antet.forEach((numeCamp, coloana) => {
      obiect[numeCamp] = String(rand[coloana]).trim();
    });
    rezultat.push(obiect);
  }
  return rezultat;
}

function getOrCreateSheet(ss, nume) {
  return ss.getSheetByName(nume) || ss.insertSheet(nume);
}

function raspunsJson(obiect) {
  return ContentService
    .createTextOutput(JSON.stringify(obiect))
    .setMimeType(ContentService.MimeType.JSON);
}
