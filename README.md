# Wedding website — setup guide

A static site: `index.html`, `css/style.css`, `js/main.js`. No build step required to
run it locally — just open `index.html` in a browser, or serve the folder with any
static file server.

There is no `config.js` in this project — the site's content (colors, fonts,
text, photos) lives in a private Google Sheet instead, read through a small
Apps Script. Editing the site means editing that Sheet, not any file here.

## 1. Set up the content Sheet (colors, fonts, all the copy and photos)

Two Google Sheets are involved in this project, and it's worth being clear
about the difference up front:

- The **content Sheet** (this section) holds everything you'd write or
  choose — colors, fonts, the couple's names, every paragraph, every address,
  photo filenames, FAQ questions. You'll edit this one often.
- The **RSVP Sheet** (section 2) is where guest responses land. You'll mostly
  just read this one.

They're separate spreadsheets with separate scripts. Don't merge them.

**Why this is private, not "shared with a link":** the content Sheet stays
set to its normal, fully private Google Drive sharing — nobody else has
access to it, ever. The Apps Script that reads it runs *as your account*
("Execute as: Me"), so it can open a Sheet only you can see, but the only
thing it ever hands back to a visitor's browser is the specific text and
filenames below — never a link to the Sheet, never edit access, never
anything else in your Drive.

Steps:

1. Create a new, blank Google Sheet. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the default content and paste in this project's
   `apps-script-config/Code.gs`.
4. At the top of the file, fill in `CONFIG_SHEET_ID` with the ID from step 1.
5. In the function dropdown, select `setup`, then click **Run**. Authorize it
   when asked. This builds every tab (`General`, `Poveste`, `Detalii`,
   `Program`, `Info`, `Galerie`, `Intrebari`) with the right column headers
   and today's placeholder content, ready to edit.
6. Click **Deploy → New deployment**. Type **Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **Deploy**, authorize again if asked, and copy the URL (ends in
   `/exec`).
8. Paste that URL into `js/main.js`, replacing the `CONFIG_URL` placeholder
   near the top of the file. This is the one line of code in the whole
   project you set once and never touch again.

Now open the Sheet and edit it directly — no code editor needed:

- **`General` tab** — one row per setting, two columns (`Cheie` / `Valoare`).
  Covers colors, fonts, font size, the wedding date, the RSVP deadline, the
  couple's names, and contact info. Just edit the second column; don't rename
  anything in the first column, and don't touch `appsScriptUrl` — that's the
  RSVP script's address from section 2, not something to guess at.
- **`Poveste` tab** — one paragraph per row. Add or delete rows to add or
  remove paragraphs.
- **`Detalii` tab** — one row per venue (civil ceremony, religious ceremony,
  reception). Addresses are typed normally — the Google Maps link is built
  automatically, no URL-encoding needed.
- **`Program`, `Info`, `Galerie`, `Intrebari` tabs** — same idea: one row per
  item, add or delete rows freely. For `Galerie`, put the actual photo files
  in this project's `img/` folder and reference them by filename (see
  "Adding photos" just below for how to do that without any coding tools).

### Adding photos

Photos themselves aren't stored in the Sheet — only their filenames are.
The actual image files live in this project's `img/` folder on GitHub. You
don't need git or any coding tools to add one:

1. Go to the repository on github.com and open the `img` folder.
2. Click **Add file → Upload files**.
3. Drag your photo in. Use a simple, lowercase filename with no spaces
   (e.g. `galerie-7.jpg`, not `Photo (1).jpg`) — filenames are
   case-sensitive and have to match exactly what you type in the Sheet.
4. Scroll down and click **Commit changes** — this publishes straight to
   the live site, no further steps needed on GitHub's side.
5. Wait about a minute for the site to rebuild, then reference that exact
   filename in the Sheet's `Galerie` tab (or `poveste.fotoNumeFisier` in
   `General`, for the story photo).

(Google Drive links were considered for this instead, so it could all live
in the Sheet — but hotlinking `drive.google.com` images is unofficial,
gets rate-limited, and needs per-file sharing changes, so a guest opening
the site risks seeing a broken image. Uploading through GitHub's own page
avoids that while still needing zero coding knowledge.)

Changes show up **on the next page reload**, not instantly — a guest who
already has the page open won't see an edit until they refresh. The script
also caches its response for five minutes (see `CACHE_SECONDS` in
`apps-script-config/Code.gs`) to keep repeat visits fast, so a same-minute
edit might take up to five minutes to appear for a brand-new visitor. Lower
that number if you want edits to show up faster, at the cost of the Sheet
being read slightly more often.

**One exception — this part still needs manual HTML editing.** The two `og:`
tags near the top of `index.html` (`og:title`, `og:image`) control the
preview that shows up when the link is shared on WhatsApp. They can't come
from the Sheet, because WhatsApp's preview bot reads the raw page and never
runs JavaScript — so the Sheet-reading script never even gets called for it.
Edit those two lines directly, and put a horizontal photo (about 1200×630px)
at `img/og-cover.jpg`.

### Changing fonts

Changing `fonturi.display` or `fonturi.body` in the `General` tab renames the
font, but the browser also needs to know where to download it from — that
one wire still runs through `index.html`. Look for the line containing
`fonts.googleapis.com` near the top of the file: go to
[fonts.google.com](https://fonts.google.com), pick a font, copy the `<link>`
tags it gives you, and swap them in. Then use the same font name in the
Sheet.

## 2. Set up the RSVP backend (Google Apps Script)

The form posts to a small script that appends each RSVP as a row in a Google Sheet
and emails you a notification. No server, no database, no submission cap.

1. Create a new Google Sheet. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the default `Code.gs` content and paste in this project's
   `apps-script/Code.gs`.
4. At the top of the file, fill in:
   - `SHEET_ID` — the ID you copied
   - `NOTIFY_EMAIL` — the address that should get an email per RSVP
5. In the function dropdown (top toolbar), select `setup`, then click **Run**.
   The first run asks you to authorize the script — accept it. This creates the
   `RSVP` tab with the Romanian header row already in place.
6. Click **Deploy → New deployment**. Choose type **Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **Deploy**, authorize again if asked, and copy the resulting URL
   (ends in `/exec`).
8. Paste that URL into the content Sheet's `General` tab, in the row for
   `appsScriptUrl` (not into any file — this is the one setting that lives
   in the Sheet rather than in code, since it's just another piece of
   content the page needs).

**Why `text/plain` in the fetch call:** the form submission in `main.js` sends
`Content-Type: text/plain` instead of `application/json`. This is deliberate —
`application/json` triggers a CORS preflight `OPTIONS` request, and Apps Script web
apps don't respond to those, so the real submission would silently fail. Don't
"fix" this.

**Testing it:** submit the form once yourself before sending the link to anyone.
Check that a row appeared in the Sheet and that the notification email arrived.

## 3. Deploy to GitHub Pages

1. Push this folder to a GitHub repository (public — GitHub Pages needs a paid
   plan to serve from a private repo).
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, branch `main`, folder `/root`.
4. Save. The site publishes at `https://<username>.github.io/<repo-name>/`,
   usually within a minute or two.

## 4. Custom domain (optional)

1. Create a file named `CNAME` (no extension) at the repo root containing just
   your domain, e.g. `nuntamariaandrei.ro`.
2. At your domain registrar, add either:
   - An `A` record pointing to GitHub Pages' IPs (`185.199.108.153`,
     `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), or
   - A `CNAME` record pointing to `<username>.github.io` if using a subdomain.
3. Back in **Settings → Pages**, enter the custom domain and wait for the
   certificate to provision (can take up to a day). Check **Enforce HTTPS**
   once it's available.

## 5. Before sending the link to guests: swap the Tailwind CDN for a build

`index.html` currently loads Tailwind from a CDN
(`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`) so you can preview changes
instantly with no build step. This is fine for development but not for the live
site: it ships roughly 100KB of JavaScript to every guest and the page briefly
flashes unstyled before it runs.

To switch to a static build:

1. Download the standalone Tailwind CLI binary for your OS from the Tailwind CSS
   GitHub releases (no Node.js project needed).
2. Run it against `index.html`, outputting a compiled stylesheet, e.g.:
   ```
   ./tailwindcss -i css/style.css -o css/build.css --minify
   ```
3. In `index.html`, delete the `<script src=".../@tailwindcss/browser@4">` tag and
   the `<style type="text/tailwindcss">` block, and instead link the compiled file:
   ```html
   <link rel="stylesheet" href="css/build.css">
   ```
4. Commit `css/build.css`. Re-run the build command any time you change classes
   in `index.html`.

## Notes

- The RSVP form has no submission cap — it's your own Sheet, not a third-party
  quota. If you ever exceed Apps Script's daily email quota (very unlikely for a
  wedding), submissions still save; only the notification email would be delayed.
- The honeypot field (`website`) must stay in the form and stay hidden via CSS,
  not removed — it's the spam filter.
- If you redesign later and add or rename form fields, update the `COLOANE` array
  and the `payload[...]` lookups in `apps-script/Code.gs` to match, or the columns
  will drift out of order.
- Both Apps Script endpoints (`apps-script/Code.gs` for RSVPs, `apps-script-config/Code.gs`
  for content) work from a plain browser `fetch()` for the same underlying reason:
  Apps Script redirects its response through `script.googleusercontent.com`,
  which does send the CORS header a browser needs. If a future Google change
  ever breaks that redirect behavior, both fetch calls in `js/main.js` would
  start failing at once — that's the first thing to check if the site stops
  loading content or stops accepting RSVPs.
