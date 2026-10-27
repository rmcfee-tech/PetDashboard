# Pet Dashboard — Running the app

## Windows
Double-click **`start-server.bat`**. It opens the app in your default
browser automatically. Leave the black console window open while you use
the app — closing it stops the server. Requires Python (which you already
have) or Node.js.

## macOS / Linux
```
./start-server.sh
```

## Why not just double-click index.html?

Modern browsers block two things when a page is opened directly as a
`file://` URL, for security reasons that apply to every website, not just
this one:

1. **ES modules** (`<script type="module">`) — this app's JavaScript is
   organized into ~20 small modules (`storage.js`, `state.js`, one per
   page, etc.) per the "modular, maintainable" requirement. Browsers
   refuse to load module scripts from `file://` in both Firefox and
   Chromium (Edge/Chrome), which is why the page was blank.
2. **Service workers** — the offline-caching layer that lets the app work
   with no internet connection also refuses to register on `file://`.

The launcher scripts start a small local static file server (nothing is
installed, no internet access is used, no data leaves your computer) so
the browser sees `http://localhost` instead of `file://`. This is the
standard way any modern PWA is run and tested — once you install the app
to your home screen/desktop from the browser's install prompt, you won't
need the launcher again; the installed app opens on its own.

## Sharing one file across two devices (synced folder)

Since this app has no server, "syncing" between your two devices means
putting `pet-dashboard.json` in a folder that OneDrive, Google Drive, or
Dropbox already keeps in sync for you — the app itself doesn't talk to
any of those services, it just opens whatever file is at that path.

**Setup (once):**
1. Pick whichever sync service you already use. Make sure the sync
   client is installed and running on both devices.
2. On Device #1, go to **Settings → Save As…** and save
   `pet-dashboard.json` into your synced folder (e.g. your OneDrive
   folder).
3. Wait for it to finish syncing to Device #2 (check the sync client).
4. On Device #2, go to **Settings → Open…** and pick that same file from
   the synced folder.

From then on, both devices remember the file (even after closing the
browser — the connection is restored automatically, or you'll see a
"Reconnect" banner if the browser needs a fresh permission grant) and
autosave writes back to it as you edit.

**What happens if you edit on both devices around the same time:**
The app checks whether the file changed on disk before every save. If it
has — meaning the sync client dropped in a newer version from your other
device — it won't silently overwrite it. Instead you'll get a prompt:
**reload the newer version** (discarding your own unsaved edits) or
**overwrite it anyway** (keep your edits, lose theirs). There's no
automatic merge of two simultaneous edits — for two devices used by one
person, just avoid editing both at once and this rarely comes up. You can
also pull the latest version manually any time from
**Settings → Reload latest**, useful right when you switch devices.

One caveat: none of this protects against genuinely simultaneous writes
happening within the same sync cycle (a handful of seconds). If both
devices save within that window, whichever the sync client processes
last wins, with no warning. Rare for one person on two devices, but worth
knowing.

## Installing on Android

The launcher (`start-server.bat`/`.sh`) is meant for your Windows/Mac/Linux
computer. To get Pet Dashboard onto your Android phone as an installed
app (icon on your home screen, opens full-screen, works offline), Android
needs to reach it over a real network address — `localhost` on your laptop
isn't visible to your phone. Two ways to do that:

**Option A — same Wi-Fi, quick and temporary**
1. On your Windows machine, run `start-server.bat` as usual.
2. Find your computer's local IP: open Command Prompt and run `ipconfig`,
   look for "IPv4 Address" (something like `192.168.1.42`).
3. On your Android phone (same Wi-Fi network), open Chrome and go to
   `http://192.168.1.42:8934/index.html` (use your own IP).
4. Chrome will show an "Install app" prompt, or open the ⋮ menu →
   **Add to Home screen**.
5. This only works while your computer's server is running — fine for
   testing, not for daily use away from home.

**Option B — free static hosting, permanent (recommended)**
Since this app has no backend and no server-side code, any free static
host works — GitHub Pages, Netlify, Vercel, or Cloudflare Pages all have
a no-cost tier that's more than enough for this. Upload the contents of
this folder, get a URL like `https://your-name.github.io/pet-dashboard/`,
open it on your phone, then **Add to Home screen**. From then on it opens
like any other installed app — icon, splash screen, full offline support
(now confirmed working — see Testing notes below) — with no dependency on
your computer being on.

Either way, once installed, use **Settings → Save As…** on your phone to
create your `pet-dashboard.json` there, or **Import backup** to bring in
the file you've been using on Windows.

## Testing notes (Stage 5)

- Fixed a bug where the service worker never actually registered (a timing
  issue with the page's `load` event) — offline support is now confirmed
  working end-to-end, including navigating between pages with no network.
- Audited every page for accessibility: all interactive controls have
  labels, keyboard tab order is sane, dark mode meets contrast comfortably.
- Load-tested with 500+ simulated entries per log (over a year of daily
  use) — list views now show the most recent 100 by default with a
  "Show all" button, keeping the app fast as your data grows for years.

## Once running
Go to **Settings → Save As…** to save your data as a `pet-dashboard.json`
file on your own device. From then on, use **Settings → Open…** to load
it and **Save** to write changes back to that same file.
