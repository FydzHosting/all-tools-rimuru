# All Tools Rimuru v1.2

Website tools all-in-one dengan konsep **Rimuru Tempest**.

**Branding**
- Nama: All Tools Rimuru
- Developer: By FydzXzL
- Frontend + UI: Vercel-compatible
- Backend/API adapters: Node.js, cocok dijalankan di Pterodactyl/VPS

## Video banner

Video banner sengaja tidak diisi. Edit `app.js`:

```js
const BANNER_VIDEO_URL = "";
```

Isi dengan URL video `.mp4` atau `.webm` milikmu, misalnya:

```js
const BANNER_VIDEO_URL = "https://domain-kamu.com/rimuru-banner.mp4";
```

Video akan otomatis menjadi background banner dengan overlay tema Rimuru.

## Fitur yang sudah ada

### AI
GPT, Claude, DeepAI slot, Gemini slot, FeelBetterBot, NoTrack AI, AI Image Generator.

### Downloader
YouTube, YouTube Community, Instagram, TikTok, multi-platform/Vidssave, Threads, Terabox, Pinterest.

### Music
Spotify Downloader dan Lyrics Search.

### Image
Temp Mail, Image Upscaler, Image → URL.

### Maker
Windows Media Player Maker, Write Maker, Instagram Post Maker, FF Lobby Maker.

### Tools
Sub2Unlock, QR Maker.

### Anime / Developer
Anime Search, Anime Detail, Website Copier, API Tester, JSON Tools.

## Jalankan di Pterodactyl/VPS

```bash
npm install
cp .env.example .env
npm start
```

Jangan taruh API key/token rahasia di frontend. Simpan di `.env`.

> Endpoint pihak ketiga dapat berubah. Gunakan downloader dan konten sesuai hak cipta serta ketentuan layanan masing-masing platform.


## v1.4 Maker templates
- FF Lobby Maker uses the supplied lobby template image and overlays the player name.
- Write Maker uses the supplied notebook template and wraps text over the page.
- PNG export preserves the portrait dimensions of each maker.


## BGM
Taruh musik MP3 yang kamu punya hak untuk digunakan di `audio/rimuru-bgm.mp3`. Website menyediakan tombol Music ON/OFF. Browser akan menunggu interaksi pertama pengguna sebelum memutar audio karena kebijakan autoplay.


## AI provider update
Gemini UI has been replaced by YenusAI for testing. The Yenus integration uses the creator-provided endpoint and normalizes responses/errors so raw provider JSON is not shown in the UI.


## Downloader v1.4.7
Social downloaders now use Cobalt as the first adapter with the existing provider as a fallback. The frontend also turns returned media URLs into clickable download/open buttons instead of showing raw JSON. Terabox and Spotify keep their provider-specific adapters.


### v1.7.1 Download Fix
Fixed the frontend downloader bug where `postJSON()` already returned parsed JSON but the code called `.json()` a second time, causing `r.json is not a function`.


## v1.7.2 TikTok fix
TikTok now uses a dedicated TikWM adapter first, then Cobalt, then Lovetik. Empty media-link responses are rejected instead of being displayed as a successful raw JSON result.


## v2.8.1 repair notes
- Normal tool modals now reset the Download All workspace class, so tools no longer inherit the Download All layout.
- API requests now show a clear backend-unavailable message instead of a generic `Failed to fetch`.
- Added a Vercel serverless catch-all at `api/[...path].js` so `/api/*` endpoints can run when deployed on Vercel.
- `server.js` exports the Express app when imported by Vercel and only calls `listen()` when run directly.

### Vercel
Deploy the whole project folder/repository, not only `index.html`. Add the required environment variables in Vercel Project Settings. The frontend and `/api/*` endpoints must be deployed together.


## v2.9.0 audit/fix
- Fixed AI Playground entry point and added Gemini to the unified AI model list.
- Hardened API error handling and added `/api/health`.
- Download All remains a dedicated two-screen workspace; normal download tools keep the normal modal.
- Cobalt downloader gateway now supports configurable endpoint lists via `COBALT_API_URL` and clearer fallback errors.
- Reduced perpetual visual effects and banner preload for smoother mobile performance.
