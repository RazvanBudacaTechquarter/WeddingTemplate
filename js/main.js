/* ===========================================================
   main.js — "motorul" site-ului.
   Conținutul (culori, fonturi, texte, fotografii) nu mai stă
   într-un fișier din acest proiect — vine dintr-un Google Sheet
   privat, citit printr-un mic script (apps-script-config/Code.gs)
   care rulează sub contul vostru și expune doar conținutul, nu
   Sheet-ul în sine.

   Editarea conținutului site-ului se face acum în Sheet, nu aici.
   Fișierul ăsta nu ar trebui să mai aibă nevoie de modificări
   după configurarea inițială.
   =========================================================== */

// TODO (o singură dată, la configurare): URL-ul scriptului care
// citește Sheet-ul de conținut. Vezi README.md, secțiunea
// "Editarea conținutului site-ului".
const CONFIG_URL = 'https://script.google.com/macros/s/AKfycbwAGUtkv56vr_lLQ_6sarUCofovYmzMW5UAh20rBHY0uMCMvoQy1EAHZjVl07hCqBjwHA/exec';

/* -----------------------------------------------------------
   Aplică CONFIG ca variabile CSS (culori, fonturi, mărimi)
----------------------------------------------------------- */
function aplicaVariabileCss(CONFIG) {
  const r = document.documentElement.style;
  const c = CONFIG.culori;
  const f = CONFIG.fonturi;

  r.setProperty('--color-vin', c.vin);
  r.setProperty('--color-cerneala', c.cerneala);
  r.setProperty('--color-in', c.in);
  r.setProperty('--color-aur', c.aur);
  r.setProperty('--color-brad', c.brad);

  r.setProperty('--font-display', f.display);
  r.setProperty('--font-body', f.body);
  r.setProperty('--marime-text-baza', f.marimeText);
  r.setProperty('--marime-titlu-mare', f.marimeTitluMare);
  r.setProperty('--marime-titlu-sectiune', f.marimeTitluSectiune);
}

/* -----------------------------------------------------------
   Randează tot conținutul din CONFIG
----------------------------------------------------------- */
function randeazaContinut(CONFIG) {
  const $ = (id) => document.getElementById(id);

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Titlul filei și mirii (hero) ----
  document.title = `${CONFIG.miri.nume1} & ${CONFIG.miri.nume2} — Nunta noastră`;
  $('hero-nume1').textContent = CONFIG.miri.nume1;
  $('hero-nume2').textContent = CONFIG.miri.nume2;
  $('hero-data-oras').textContent = `${CONFIG.miri.dataAfisata} · ${CONFIG.miri.oras}`;
  $('logo-initiale').textContent = `${CONFIG.miri.nume1[0]} & ${CONFIG.miri.nume2[0]}`;

  // ---- Povestea noastră ----
  const containerPoveste = $('poveste-text');
  containerPoveste.innerHTML = '';
  CONFIG.poveste.paragrafe.forEach((paragraf) => {
    const p = document.createElement('p');
    p.textContent = paragraf;
    containerPoveste.appendChild(p);
  });
  const fotoPoveste = $('poveste-foto');
  fotoPoveste.src = `img/${CONFIG.poveste.fotoNumeFisier}`;
  fotoPoveste.alt = CONFIG.poveste.fotoDescriere;

  // ---- Detalii eveniment ----
  const containerDetalii = $('detalii-continut');
  containerDetalii.innerHTML = '';
  CONFIG.detalii.forEach((d) => {
    const articol = document.createElement('article');
    articol.className = 'border-t-2 border-vin pt-5';
    const urlHarta = `https://maps.google.com/?q=${encodeURIComponent(d.adresa)}`;
    articol.innerHTML = `
      <h3 class="font-display text-xl mb-2">${escapeHtml(d.titlu)}</h3>
      <p class="text-sm">${escapeHtml(d.ora)}</p>
      <p class="text-sm">${escapeHtml(d.loc)}</p>
      <p class="text-sm mb-3">${escapeHtml(d.adresa)}</p>
      <a href="${urlHarta}" class="text-sm text-vin underline underline-offset-2">Vezi pe hartă</a>
    `;
    containerDetalii.appendChild(articol);
  });
  $('detalii-nota').textContent = CONFIG.notaDetalii;

  // ---- Programul zilei ----
  const containerProgram = $('program-continut');
  containerProgram.innerHTML = '';
  CONFIG.program.forEach((pas) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="absolute -left-[9px] w-4 h-4 bg-vin rounded-full"></span>
      <p class="font-display text-lg text-vin">${escapeHtml(pas.ora)}</p>
      <p>${escapeHtml(pas.eveniment)}</p>
    `;
    containerProgram.appendChild(li);
  });

  // ---- Informații utile ----
  const containerInfo = $('info-continut');
  containerInfo.innerHTML = '';
  CONFIG.info.forEach((bloc) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3 class="font-display text-xl mb-2 text-vin">${escapeHtml(bloc.titlu)}</h3>
      <p class="text-sm">${escapeHtml(bloc.text)}</p>
    `;
    containerInfo.appendChild(div);
  });

  // ---- Galerie ----
  const containerGalerie = $('galerie-continut');
  containerGalerie.innerHTML = '';
  CONFIG.galerie.forEach((poza) => {
    const img = document.createElement('img');
    img.src = `img/${poza.fisier}`;
    img.alt = poza.descriere;
    img.className = 'w-full aspect-square object-cover rounded-sm';
    img.loading = 'lazy';
    containerGalerie.appendChild(img);
  });

  // ---- Întrebări frecvente ----
  const containerIntrebari = $('intrebari-continut');
  containerIntrebari.innerHTML = '';
  CONFIG.intrebari.forEach((q) => {
    const details = document.createElement('details');
    details.className = 'acordeon';
    details.innerHTML = `
      <summary>${escapeHtml(q.intrebare)}</summary>
      <p>${escapeHtml(q.raspuns)}</p>
    `;
    containerIntrebari.appendChild(details);
  });

  // ---- RSVP: termen limită ----
  $('rsvp-termen').textContent = `Te rugăm să confirmi până pe ${CONFIG.termenLimitaRsvp}, ca să putem organiza totul cât mai bine.`;

  // ---- Subsol ----
  $('footer-nume').textContent = `${CONFIG.miri.nume1} & ${CONFIG.miri.nume2}`;
  $('footer-data').textContent = CONFIG.miri.dataAfisata;
  $('footer-telefon').textContent = `Întrebări? Sună-ne la ${CONFIG.contact.telefon}`;
}

/* -----------------------------------------------------------
   Meniul mobil
----------------------------------------------------------- */
function initMeniuMobil() {
  const buton = document.getElementById('meniu-buton');
  const meniu = document.getElementById('meniu-mobil');
  if (!buton || !meniu) return;

  buton.addEventListener('click', () => {
    const deschis = meniu.classList.toggle('hidden') === false;
    buton.setAttribute('aria-expanded', String(deschis));
  });

  meniu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      meniu.classList.add('hidden');
      buton.setAttribute('aria-expanded', 'false');
    });
  });
}

/* -----------------------------------------------------------
   Numărătoarea inversă
----------------------------------------------------------- */
function initNumaratoare(CONFIG) {
  const DATA_NUNTII = new Date(CONFIG.dataNuntii);

  const elZile = document.getElementById('nr-zile');
  const elOre = document.getElementById('nr-ore');
  const elMinute = document.getElementById('nr-minute');
  const elSecunde = document.getElementById('nr-secunde');
  const etZile = document.getElementById('et-zile');
  const containerNumaratoare = document.getElementById('numaratoare');
  const mesajFinal = document.getElementById('numaratoare-mesaj');

  if (!elZile || !elOre || !elMinute || !elSecunde) return;

  function doiaZecimale(n) {
    return String(n).padStart(2, '0');
  }

  let interval;

  function actualizeaza() {
    const acum = new Date();
    const diferenta = DATA_NUNTII - acum;

    if (diferenta <= 0) {
      clearInterval(interval);
      containerNumaratoare.classList.add('hidden');
      mesajFinal.textContent = CONFIG.mesajDupaNunta;
      mesajFinal.classList.remove('hidden');
      return;
    }

    const zile = Math.floor(diferenta / (1000 * 60 * 60 * 24));
    const ore = Math.floor((diferenta / (1000 * 60 * 60)) % 24);
    const minute = Math.floor((diferenta / (1000 * 60)) % 60);
    const secunde = Math.floor((diferenta / 1000) % 60);

    elZile.textContent = String(zile);

    // Pluralul românesc nu e doar singular/plural: 1 zi, 2-19 zile,
    // 20 de zile, 21 de zile, ..., 100 de zile. Dacă ultimele două
    // cifre sunt 00 sau între 20 și 99, se folosește "de zile".
    const ultimeleDouaZile = zile % 100;
    etZile.textContent =
      zile === 1 ? 'zi' : (ultimeleDouaZile === 0 || (ultimeleDouaZile >= 20 && ultimeleDouaZile <= 99)) ? 'de zile' : 'zile';

    elOre.textContent = doiaZecimale(ore);
    elMinute.textContent = doiaZecimale(minute);
    elSecunde.textContent = doiaZecimale(secunde);
  }

  actualizeaza();
  interval = setInterval(actualizeaza, 1000);
}

/* -----------------------------------------------------------
   Câmpuri condiționale în formularul RSVP
----------------------------------------------------------- */
function initCampuriConditionale() {
  const radioParticipare = document.querySelectorAll('input[name="participare"]');
  const campuriConditionale = document.getElementById('campuri-conditionale');
  const mesajNeparticipare = document.getElementById('mesaj-neparticipare');
  const campPersoane = document.getElementById('persoane');
  const campMeniu = document.getElementById('meniu');

  if (!radioParticipare.length || !campuriConditionale) return;

  function actualizeazaVizibilitate() {
    const selectat = document.querySelector('input[name="participare"]:checked');
    const participa = selectat && selectat.value === 'da';

    campuriConditionale.classList.toggle('hidden', !participa);
    mesajNeparticipare.classList.toggle('hidden', participa);

    campPersoane.required = participa;
    campMeniu.required = participa;
  }

  radioParticipare.forEach((r) => r.addEventListener('change', actualizeazaVizibilitate));
  actualizeazaVizibilitate();
}

/* -----------------------------------------------------------
   Trimiterea formularului către Google Apps Script (RSVP)
----------------------------------------------------------- */
function initFormular(CONFIG) {
  const formular = document.getElementById('formular-rsvp');
  const butonTrimite = document.getElementById('buton-trimite');
  const casetaEroare = document.getElementById('formular-eroare');
  const casetaSucces = document.getElementById('formular-succes');

  if (!formular) return;

  formular.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    formular.classList.add('a-fost-trimis');

    if (!formular.checkValidity()) {
      formular.reportValidity();
      return;
    }

    const dateFormular = new FormData(formular);
    const payload = Object.fromEntries(dateFormular.entries());

    butonTrimite.disabled = true;
    butonTrimite.textContent = 'Se trimite…';
    casetaEroare.classList.add('hidden');

    try {
      // Content-Type: text/plain este intenționat — application/json
      // ar declanșa o cerere CORS preflight (OPTIONS), la care
      // aplicațiile web Apps Script nu răspund.
      const raspuns = await fetch(CONFIG.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!raspuns.ok) throw new Error('Răspuns nereușit de la server');

      formular.classList.add('hidden');
      casetaSucces.classList.remove('hidden');
    } catch (eroare) {
      casetaEroare.textContent = `Nu am putut trimite confirmarea. Încearcă din nou sau scrie-ne direct la ${CONFIG.contact.email}.`;
      casetaEroare.classList.remove('hidden');
      butonTrimite.disabled = false;
      butonTrimite.textContent = 'Trimite confirmarea';
    }
  });
}

/* -----------------------------------------------------------
   Punctul de intrare: ia CONFIG din Google Sheet, apoi pornește
   restul paginii. Dacă citirea eșuează (Sheet neconfigurat, URL
   greșit, probleme de rețea), pagina arată un mesaj clar în loc
   să rămână goală și fără nicio explicație.
----------------------------------------------------------- */
async function init() {
  let CONFIG;
  try {
    const raspuns = await fetch(CONFIG_URL);
    if (!raspuns.ok) throw new Error(`Răspuns ${raspuns.status}`);
    CONFIG = await raspuns.json();
  } catch (eroare) {
    console.error('Nu am putut încărca conținutul din Google Sheet:', eroare);
    document.body.innerHTML = `
      <div style="max-width:32rem;margin:4rem auto;padding:0 1.25rem;text-align:center;font-family:sans-serif;">
        <p style="font-size:1.1rem;">Nu am putut încărca conținutul site-ului.</p>
        <p style="font-size:0.9rem;opacity:0.75;">Încearcă să reîncarci pagina peste câteva minute.</p>
      </div>
    `;
    return;
  }

  aplicaVariabileCss(CONFIG);
  randeazaContinut(CONFIG);
  initMeniuMobil();
  initNumaratoare(CONFIG);
  initCampuriConditionale();
  initFormular(CONFIG);
}

// main.js e ultimul <script> din pagină, deci DOM-ul e deja gata
// când ajunge aici — nu mai e nevoie de DOMContentLoaded.
init();
