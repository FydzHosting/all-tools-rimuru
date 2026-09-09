// ALL TOOLS RIMURU v2.8.0 — Cyber Nexus Overhaul
// Ganti URL video banner di bawah. Tidak perlu npm install untuk mengganti URL ini.
const BANNER_VIDEO_URL = "https://files.catbox.moe/6pgx9z.mp4";

// Banner video: one controlled autoplay attempt after the first playable frame.
// Avoid repeated play() calls and expensive CSS compositing so mobile browsers
// can keep the decoder/render pipeline stable.
const bannerVideo = document.getElementById('bannerVideo');
if (bannerVideo && BANNER_VIDEO_URL) {
  bannerVideo.src = BANNER_VIDEO_URL;
  bannerVideo.muted = true;
  bannerVideo.defaultMuted = true;
  bannerVideo.playsInline = true;
  bannerVideo.preload = 'auto';
  bannerVideo.setAttribute('muted', '');
  bannerVideo.setAttribute('playsinline', '');
  bannerVideo.setAttribute('autoplay', '');

  let bannerStarted = false;
  const playBanner = () => {
    if (document.hidden || bannerStarted) return;
    const p = bannerVideo.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { bannerStarted = true; }).catch(() => {});
    }
  };
  bannerVideo.addEventListener('canplay', playBanner, {once:true, passive:true});
  bannerVideo.addEventListener('loadeddata', playBanner, {once:true, passive:true});
  window.addEventListener('pageshow', () => { bannerStarted = false; playBanner(); }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { bannerStarted = false; playBanner(); }
  }, {passive:true});
}

// Lightweight first-load screen. It disappears after the UI is ready,
// without waiting for every remote API/tool resource to finish loading.
(() => {
  const loader = document.getElementById('pageLoader');
  const bar = document.getElementById('loaderProgress');
  const percent = document.getElementById('loaderPercent');
  const status = document.getElementById('loaderStatus');
  if (!loader) return;
  let value = 0;
  const messages = ['Preparing interface...', 'Loading tool registry...', 'Warming up Rimuru Core...', 'Interface ready.'];
  const tick = setInterval(() => {
    value = Math.min(value + Math.floor(Math.random() * 10) + 5, 92);
    if (bar) bar.style.width = value + '%';
    if (percent) percent.textContent = value + '%';
    if (status) status.textContent = messages[Math.min(3, Math.floor(value / 28))];
  }, 110);
  const finish = () => {
    clearInterval(tick);
    if (bar) bar.style.width = '100%';
    if (percent) percent.textContent = '100%';
    if (status) status.textContent = 'Interface ready.';
    setTimeout(() => {
      loader.classList.add('loaded');
      setTimeout(() => loader.remove(), 650);
    }, 220);
  };
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
  setTimeout(finish, 2600);
})();


// Background music — local file: audio/rimuru-bgm.mp3
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const musicIcon = document.getElementById('musicIcon');
const musicLabel = document.getElementById('musicLabel');

function setMusicUI(on) {
  if (!musicToggle) return;
  musicToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  musicToggle.setAttribute('aria-label', on ? 'Matikan musik' : 'Nyalakan musik');
  if (musicIcon) musicIcon.textContent = on ? '♫' : '♪';
  if (musicLabel) musicLabel.textContent = on ? 'Music On' : 'Music';
}

async function startMusic() {
  if (!bgMusic) return;
  try {
    await bgMusic.play();
    localStorage.setItem('rimuru_music', 'on');
    setMusicUI(true);
  } catch (_) {
    // Browser autoplay policy may require a tap first.
    setMusicUI(false);
  }
}

function stopMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  localStorage.setItem('rimuru_music', 'off');
  setMusicUI(false);
}

if (musicToggle && bgMusic) {
  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) startMusic();
    else stopMusic();
  });

  // Browsers commonly block autoplay with sound. Start on the first user gesture
  // if the user has not explicitly turned music off.
  const saved = localStorage.getItem('rimuru_music');
  setMusicUI(false);
  if (saved !== 'off') {
    const firstGesture = () => {
      startMusic();
      window.removeEventListener('pointerdown', firstGesture);
      window.removeEventListener('keydown', firstGesture);
    };
    window.addEventListener('pointerdown', firstGesture, { once: true, passive: true });
    window.addEventListener('keydown', firstGesture, { once: true });
  }
}


// Developer information drawer
// Isi URL saluran WhatsApp kamu di sini saat sudah punya link invite/channel.
const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDQe4V1HspzujMRGT0f';
const infoDrawer = document.getElementById('infoDrawer');
const menuBtn = document.getElementById('menuBtn');
const drawerClose = document.getElementById('drawerClose');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const waChannelLink = document.getElementById('waChannelLink');
const drawerMusic = document.getElementById('drawerMusic');
function setDrawer(open){
  if(!infoDrawer) return;
  infoDrawer.classList.toggle('open',open);
  infoDrawer.setAttribute('aria-hidden',open?'false':'true');
  if(menuBtn) menuBtn.setAttribute('aria-expanded',open?'true':'false');
  document.body.style.overflow=open?'hidden':'';
}
if(menuBtn) menuBtn.addEventListener('click',()=>setDrawer(true));
if(drawerClose) drawerClose.addEventListener('click',()=>setDrawer(false));
if(drawerBackdrop) drawerBackdrop.addEventListener('click',()=>setDrawer(false));
if(waChannelLink){
  if(WHATSAPP_CHANNEL_URL) waChannelLink.href=WHATSAPP_CHANNEL_URL;
  else {
    waChannelLink.addEventListener('click',e=>{e.preventDefault();alert('Link Saluran WhatsApp belum diatur. Isi WHATSAPP_CHANNEL_URL di app.js.');});
  }
}
if(drawerMusic) drawerMusic.addEventListener('click',()=>{ if(bgMusic?.paused) startMusic(); else stopMusic(); });

const tools=[
{id:'youtube',name:'YouTube Downloader',cat:'downloader',icon:'▶',desc:'Metadata/download adapter.',tags:'youtube yt mp3 mp4',live:true},
{id:'youtube-community',name:'YouTube Community',cat:'downloader',icon:'▣',desc:'Ambil media dari community post.',tags:'youtube community post image',live:true},
{id:'instagram',name:'Instagram Downloader',cat:'downloader',icon:'◎',desc:'Video, image dan carousel adapter.',tags:'instagram download reel carousel',live:true},
{id:'tiktok',name:'TikTok Downloader',cat:'downloader',icon:'♪',desc:'Video dan photo-slide adapter.',tags:'tiktok download slide',live:true},
{id:'vidssave',name:'All Platform Downloader',cat:'downloader',icon:'⇩',desc:'Multi-platform media parser.',tags:'facebook instagram tiktok youtube downloader',live:true},
{id:'threads',name:'Threads Downloader',cat:'downloader',icon:'@',desc:'Threads images dan videos.',tags:'threads download carousel',live:true},
{id:'terabox',name:'Terabox Downloader',cat:'downloader',icon:'☁',desc:'Terabox file/quality parser.',tags:'terabox download',live:true},
{id:'pinterest',name:'Pinterest Downloader',cat:'downloader',icon:'P',desc:'Pinterest media/carousel parser.',tags:'pinterest download',live:true},
{id:'spotify',name:'Spotify Downloader',cat:'music',icon:'♫',desc:'Track metadata dan download adapter.',tags:'spotify music download',live:true},
{id:'lyrics',name:'Lyrics Search',cat:'music',icon:'♬',desc:'Search lyrics dengan LRCLIB.',tags:'lyrics song music',live:true},
{id:'temp-mail',name:'Temp Mail',cat:'tools',icon:'✉',desc:'Create temporary mailbox dan cek inbox.',tags:'temp mail email inbox',live:true},
{id:'upscale',name:'Image Upscaler',cat:'image',icon:'⬆',desc:'Upscale foto ke HD dengan beberapa engine.',tags:'image upscale hd 2x visual paradigm',live:true},
{id:'image-upload',name:'Image → URL',cat:'image',icon:'↥',desc:'Upload image dan dapatkan URL.',tags:'upload image url',live:true},
{id:'windows-player',name:'Windows Media Player Maker',cat:'maker',icon:'▤',desc:'Buat poster bergaya media player.',tags:'maker image windows media',live:true},
{id:'write-maker',name:'Write Maker',cat:'maker',icon:'✎',desc:'Buat poster teks bergaya tulisan.',tags:'maker write text image',live:true},
{id:'instagram-post',name:'Instagram Post Maker',cat:'maker',icon:'▧',desc:'Buat mockup post Instagram.',tags:'maker instagram post',live:true},
{id:'sub2unlock',name:'Sub2Unlock',cat:'tools',icon:'🔗',desc:'Create Sub2Unlock task link.',tags:'sub2unlock shortlink',live:true},
{id:'animes',name:'Anime Search',cat:'anime',icon:'✦',desc:'Cari anime melalui NeoXR.',tags:'anime search neoxr',live:true},
{id:'anime-detail',name:'Anime Detail',cat:'anime',icon:'◇',desc:'Metadata anime dan episode melalui Jikan.',tags:'anime detail episodes mal',live:true},
{id:'website-copy',name:'Website Snapshot',cat:'developer',icon:'⌘',desc:'Ambil snapshot HTML publik untuk inspeksi; script/form dihapus.',tags:'website snapshot html developer',live:true},
{id:'api-tester',name:'API Tester',cat:'developer',icon:'{ }',desc:'Tes endpoint HTTP publik dari server.',tags:'developer api json http',live:true},
{id:'json-tools',name:'JSON Tools',cat:'developer',icon:'{}',desc:'Format, inspect dan validasi JSON.',tags:'developer json formatter',live:true},
{id:'qr-maker',name:'QR Maker',cat:'tools',icon:'▦',desc:'Generator QR lokal melalui server.',tags:'maker qr generator',live:true}
];

const grid=document.getElementById('toolGrid'),input=document.getElementById('searchInput'),resultCount=document.getElementById('resultCount'),allCount=document.getElementById('allCount'),empty=document.getElementById('emptyState');
let currentCategory='all'; allCount.textContent=tools.length;
function render(){const q=input.value.trim().toLowerCase();const f=tools.filter(t=>(currentCategory==='all'||t.cat===currentCategory)&&(!q||`${t.name} ${t.cat} ${t.desc} ${t.tags}`.toLowerCase().includes(q)));grid.innerHTML=f.map(t=>`<article class="tool-card" data-category="${t.cat}"><div class="tool-icon">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><div class="card-foot"><span class="card-tag">${t.live?'LIVE · ':''}${t.cat.toUpperCase()}</span><button class="card-open" data-tool="${t.id}" aria-label="Open">→</button></div></article>`).join('');resultCount.textContent=`${f.length} tool${f.length!==1?'s':''}`;empty.style.display=f.length?'none':'block';}
render(); input.addEventListener('input',render);
document.querySelectorAll('.category').forEach(b=>{const cat=b.dataset.category;if(cat!=='all'){b.insertAdjacentHTML('beforeend',`<b>${tools.filter(t=>t.cat===cat).length}</b>`);}b.addEventListener('click',()=>{document.querySelectorAll('.category').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentCategory=cat;render();});});
document.querySelectorAll('.view').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');grid.classList.toggle('compact',b.dataset.view==='compact');}));

const modal=document.getElementById('toolModal'),modalTitle=document.getElementById('modalTitle'),modalDescription=document.getElementById('modalDescription'),modalIcon=document.getElementById('modalIcon'),modalBody=document.getElementById('modalBody');
function openDownloadAll(){
  modalTitle.textContent='Download All';
  modalIcon.textContent='↓';
  modalDescription.textContent='Rimuru multi-platform download workspace.';
  modalBody.innerHTML=`<div class="dlall-shell">
    <header class="dlall-top">
      <button class="dlall-back" data-close>← All Tools</button>
      <div class="dlall-brand"><span>↓</span><div><b>DOWNLOAD ALL</b><small>RIMURU ARSENAL</small></div></div>
      <div class="dlall-top-meta"><span class="dlall-platform-count">7 PLATFORMS</span><span class="dlall-status"><i></i> READY</span></div>
    </header>

    <main class="dlall-main">
      <section class="dlall-view dlall-welcome" id="dlWelcome">
        <div class="dlall-welcome-grid">
          <div class="dlall-hero-copy">
            <span class="dlall-overline">RIMURU ARSENAL · MULTI PLATFORM</span>
            <div class="dlall-hero-title"><div class="dlall-logo">↓</div><div><h1>DOWNLOAD <em>ALL</em></h1><p>One workspace untuk mencari metadata dan link media dari platform yang didukung.</p></div></div>
            <div class="dlall-actions"><button class="btn btn-primary dlall-start" id="dlStart">Mulai Download <span>→</span></button><span class="dlall-hint">Paste URL · Analyze · Get result</span></div>
          </div>
          <div class="dlall-platform-panel">
            <div class="dlall-panel-head"><span>SUPPORTED SOURCES</span><b>RIMURU DOWNLOAD ENGINE</b></div>
            <div class="dlall-platforms"><button data-dlp="youtube"><b>YT</b><span>YouTube</span></button><button data-dlp="tiktok"><b>TK</b><span>TikTok</span></button><button data-dlp="instagram"><b>IG</b><span>Instagram</span></button><button data-dlp="facebook"><b>FB</b><span>Facebook</span></button><button data-dlp="threads"><b>TH</b><span>Threads</span></button><button data-dlp="pinterest"><b>PI</b><span>Pinterest</span></button><button data-dlp="terabox"><b>TB</b><span>Terabox</span></button></div>
            <div class="dlall-panel-foot"><span><i></i> Endpoint ready</span><span>Media parser · metadata · links</span></div>
          </div>
        </div>
      </section>

      <section class="dlall-view dlall-workspace" id="dlWorkspace" hidden>
        <aside class="dlall-sidebar">
          <div class="dlall-side-head"><span>PLATFORMS</span><small>Quick select</small></div>
          <div class="dlall-side-list"><button data-dlp="youtube"><b>YT</b>YouTube</button><button data-dlp="tiktok"><b>TK</b>TikTok</button><button data-dlp="instagram"><b>IG</b>Instagram</button><button data-dlp="facebook"><b>FB</b>Facebook</button><button data-dlp="threads"><b>TH</b>Threads</button><button data-dlp="pinterest"><b>PI</b>Pinterest</button><button data-dlp="terabox"><b>TB</b>Terabox</button></div>
          <div class="dlall-side-note"><span>RIMURU ENGINE</span><p>Gunakan link publik. Hasil bergantung pada ketersediaan provider.</p></div>
          <button class="dlall-reset" id="dlReset">← Back to welcome</button>
        </aside>
        <div class="dlall-work-main">
          <div class="dlall-work-head"><div><span class="dlall-overline">DOWNLOAD WORKSPACE</span><h2>Masukkan link media</h2><p>Paste URL lalu Rimuru akan mencoba mengambil metadata dan link hasil.</p></div><div class="dlall-work-badge"><i></i> ENGINE READY</div></div>
          <div class="dlall-form"><div class="dlall-input-wrap"><span>↗</span><input id="dlAllUrl" class="tool-input" placeholder="https://youtube.com/..." autocomplete="off" spellcheck="false"></div><button class="btn btn-primary" id="dlAllRun">Analyze <span>→</span></button></div>
          <div class="dlall-result" id="dlAllResult"><div class="dlall-empty"><span>↓</span><b>Belum ada hasil</b><small>Pilih platform atau masukkan URL untuk memulai.</small></div></div>
        </div>
      </section>
    </main>
  </div>`;
  modal.classList.add('open','download-all-mode'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  const welcome=document.getElementById('dlWelcome'), workspace=document.getElementById('dlWorkspace'), url=document.getElementById('dlAllUrl'), result=document.getElementById('dlAllResult');
  const showWorkspace=()=>{welcome.hidden=true;workspace.hidden=false;setTimeout(()=>url?.focus(),80)};
  document.getElementById('dlStart')?.addEventListener('click',showWorkspace);
  document.getElementById('dlReset')?.addEventListener('click',()=>{workspace.hidden=true;welcome.hidden=false});
  document.querySelectorAll('.dlall-shell [data-dlp]').forEach(b=>b.addEventListener('click',()=>{if(welcome.hidden===false)showWorkspace();url.value='';url.placeholder=`Paste link ${b.dataset.dlp}...`;url.focus()}));
  const run=async()=>{const u=url.value.trim();if(!u){result.innerHTML='<div class="dlall-empty"><span>!</span><b>URL belum diisi</b><small>Masukkan link media terlebih dahulu.</small></div>';return;}result.innerHTML='<div class="dlall-loading"><span></span><b>Menganalisis link...</b><small>Rimuru sedang mengambil data.</small></div>';try{const d=await postJSON('/api/download/vidssave',{url:u});if(!d.status){result.innerHTML=`<div class="dlall-empty"><span>!</span><b>Gagal memproses</b><small>${safeText(d.error||'Terjadi kesalahan.')}</small></div>`;return;}result.innerHTML=`<div class="dlall-result-head"><div><span class="dlall-overline">RESULT · READY</span><h3>${safeText(d.data?.title||d.data?.name||'Media siap diunduh')}</h3></div><span class="dlall-ready">READY</span></div>${renderDownloadResult(d.data)}`;}catch(e){result.innerHTML=`<div class="dlall-empty"><span>!</span><b>Request error</b><small>${safeText(e.message)}</small></div>`}};
  document.getElementById('dlAllRun')?.addEventListener('click',run);url?.addEventListener('keydown',e=>{if(e.key==='Enter')run()});
}
function openTool(id){
  // Download All uses a special full-workspace modal. Always reset that class
  // before opening a normal tool so the next tool never inherits its layout.
  modal.classList.remove('download-all-mode');
  if(id==='vidssave'){openDownloadAll();return;}
  if(id==='ai-playground'){window.openRimuruAI?.();return;}
const t=tools.find(x=>x.id===id);if(!t)return;modalTitle.textContent=t.name;modalIcon.textContent=t.icon;modalDescription.textContent=t.desc;modalBody.innerHTML=toolUI(id);modal.classList.add('open');modal.setAttribute('aria-hidden','false');bindTool(id);}
function urlUI(label='URL'){return `<div class="tool-run"><input id="toolUrl" class="tool-input" placeholder="${label}"><button class="btn btn-primary full" id="runTool">Proses</button><pre id="toolOutput" class="output">Hasil akan muncul di sini.</pre></div>`;}
function toolUI(id){
 if(['gpt','gemini','feelbetter','deepai','yenus','notrack'].includes(id))return `<div class="tool-run"><textarea id="toolPrompt" placeholder="Tulis prompt kamu..."></textarea><button class="btn btn-primary full" id="runAI">Kirim</button><pre id="toolOutput" class="output">Output akan muncul di sini.</pre></div>`;
 if(id==='ai-image')return `<div class="tool-run"><textarea id="toolPrompt" placeholder="Contoh: blue-haired slime anime hero..."></textarea><select id="aspect" class="tool-input"><option>16:9</option><option>1:1</option><option>4:3</option><option>9:16</option></select><button class="btn btn-primary full" id="runAIImage">Generate Image</button><pre id="toolOutput" class="output">URL hasil akan muncul di sini.</pre></div>`;
 if(id==='animes')return `<div class="tool-run"><input id="animeQuery" class="tool-input" placeholder="Contoh: Solo Leveling"><button class="btn btn-primary full" id="runAnime">Cari Anime</button><pre id="toolOutput" class="output">Hasil pencarian akan muncul di sini.</pre></div>`;
 if(id==='anime-detail')return `<div class="tool-run"><input id="animeQuery" class="tool-input" placeholder="Judul anime atau MAL ID"><button class="btn btn-primary full" id="runAnimeDetail">Ambil Detail</button><pre id="toolOutput" class="output">Detail akan muncul di sini.</pre></div>`;
 if(['youtube','instagram','tiktok','vidssave','threads','terabox','pinterest','youtube-community'].includes(id))return urlUI('URL konten');
 if(id==='spotify')return urlUI('URL Spotify');
 if(id==='lyrics')return `<div class="tool-run"><input id="toolQuery" class="tool-input" placeholder="Judul / artis lagu"><button class="btn btn-primary full" id="runLyrics">Cari Lyrics</button><pre id="toolOutput" class="output">Hasil akan muncul di sini.</pre></div>`;
 if(id==='temp-mail')return `<div class="tool-run"><button class="btn btn-primary full" id="newMail">Buat Temp Mail</button><input id="mailAddress" class="tool-input" placeholder="Email hasil create"><button class="btn full" id="checkMail">Cek Inbox</button><pre id="toolOutput" class="output">Inbox akan muncul di sini.</pre></div>`;
 if(id==='upscale')return `<div class="tool-run"><input id="fileInput" class="tool-input" type="file" accept="image/*"><select id="upscaleEngine" class="tool-input"><option value="imglarger">ImgLarger · 2x HD</option><option value="visual">Visual Paradigm · HD</option></select><button class="btn btn-primary full" id="runUpload">Upscale Foto</button><div id="toolOutput" class="output">Hasil foto HD akan muncul di sini.</div></div>`;
 if(id==='image-upload')return `<div class="tool-run"><input id="fileInput" class="tool-input" type="file" accept="image/*"><button class="btn btn-primary full" id="runUpload">Upload Image</button><pre id="toolOutput" class="output">URL akan muncul di sini.</pre></div>`;
 if(id==='sub2unlock')return `<div class="tool-run"><input id="keyLink" class="tool-input" placeholder="Link yang harus diikuti"><input id="resultLink" class="tool-input" placeholder="Link hasil"><button class="btn btn-primary full" id="runSub">Create Link</button><pre id="toolOutput" class="output">Hasil akan muncul di sini.</pre></div>`;
 if(id==='json-tools')return `<div class="tool-run"><textarea id="jsonInput" placeholder='{"hello":"world"}'></textarea><button class="btn btn-primary full" id="formatJson">Format JSON</button><button class="btn full" id="inspectJson">Inspect JSON</button><pre id="toolOutput" class="output">JSON akan muncul di sini.</pre></div>`;
 if(id==='qr-maker')return `<div class="tool-run"><input id="qrText" class="tool-input" placeholder="Teks / URL"><button class="btn btn-primary full" id="makeQr">Generate QR</button><div id="qrResult" class="output">QR akan muncul di sini.</div></div>`;
 if(id==='fake-lobby')return `<div class="tool-run"><select id="fakeGame" class="tool-input"><option value="ml">🎮 Mobile Legends</option><option value="ff">🔥 Free Fire</option></select><div id="fakeFields"></div><button class="btn btn-primary full" id="runFakeLobby">Generate Fake Lobby</button><div id="makerResult" class="output">Hasil gambar akan muncul di sini.</div></div>`;
 if(['windows-player','write-maker','instagram-post'].includes(id))return `<div class="tool-run"><input id="makerText" class="tool-input" placeholder="Masukkan teks/nama"><button class="btn btn-primary full" id="runMaker">Generate</button><div id="makerResult" class="output">Hasil SVG akan muncul di sini.</div></div>`;
 if(id==='api-tester')return `<div class="tool-run"><input id="apiUrl" class="tool-input" placeholder="https://example.com/api"><select id="apiMethod" class="tool-input"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option></select><textarea id="apiHeaders" placeholder='Headers JSON, contoh {"Accept":"application/json"}'></textarea><textarea id="apiBody" placeholder='Body JSON/text (untuk POST/PUT/PATCH)'></textarea><button class="btn btn-primary full" id="runApi">Test API</button><pre id="toolOutput" class="output">Response akan muncul di sini.</pre></div>`;
 if(id==='website-copy')return `<div class="tool-run"><input id="siteUrl" class="tool-input" placeholder="https://example.com"><button class="btn btn-primary full" id="runSiteCopy">Ambil Snapshot</button><pre id="toolOutput" class="output">HTML snapshot akan muncul di sini.</pre></div>`;
 return `<div class="plugin-note"><span>ERROR</span><p>Tool UI belum terdaftar.</p></div>`;
}
const API_BASE='';
async function postJSON(url,body){
  const target = API_BASE + url;
  let r;
  try {
    r=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),cache:'no-store',credentials:'same-origin'});
  } catch(e) {
    throw new Error(window.location.protocol==='file:' ? 'Web dibuka langsung dari file. Jalankan npm start atau deploy ke Vercel agar API aktif.' : 'Backend API tidak terhubung. Pastikan deployment menyertakan folder /api dan serverless function aktif.');
  }
  const text=await r.text();
  let data;
  try { data=JSON.parse(text); } catch {
    const clean=String(text).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
    throw new Error(`API HTTP ${r.status} mengembalikan respons bukan JSON${clean?`: ${clean}`:''}`);
  }
  if(!r.ok && data?.error===undefined) data.error=`HTTP ${r.status}`;
  return data;
}

function outputValue(o){if(typeof o==='string')return o;return JSON.stringify(o,null,2);}

function isHttpUrl(v){return typeof v==='string' && /^https?:\/\//i.test(v);}
function collectUrls(value, out=[], seen=new Set(), depth=0){
  if(depth>5 || value==null) return out;
  if(typeof value==='string'){if(isHttpUrl(value) && !seen.has(value)){seen.add(value);out.push(value);}return out;}
  if(Array.isArray(value)){for(const x of value)collectUrls(x,out,seen,depth+1);return out;}
  if(typeof value==='object'){for(const [k,v] of Object.entries(value)){if(['url','download','download_url','downloadUrl','video','image','original','max','href'].includes(k))collectUrls(v,out,seen,depth+1);else if(depth<3)collectUrls(v,out,seen,depth+1);} }
  return out;
}
function renderDownloadResult(data){
  const urls=collectUrls(data);
  const title=data?.title || data?.filename || data?.name || 'Hasil download';
  const meta=[];
  if(data?.provider) meta.push(`Provider: ${safeText(data.provider)}`);
  if(data?.status) meta.push(`Status: ${safeText(data.status)}`);
  let html=`<strong>${safeText(title)}</strong>`;
  if(meta.length) html+=`<br><small>${meta.join(' · ')}</small>`;
  if(urls.length){
    html+='<div style="display:grid;gap:8px;margin-top:12px">';
    urls.slice(0,20).forEach((u,i)=>{html+=`<a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="${u}">Download / Buka ${i+1}</a>`;});
    html+='</div>';
  } else {
    html+=`<pre style="white-space:pre-wrap;margin-top:12px">${safeText(outputValue(data))}</pre>`;
  }
  return html;
}

function show(o){const el=document.getElementById('toolOutput');if(el)el.textContent=outputValue(o);}
function safeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function bindTool(id){
 if(['gpt','gemini','feelbetter','deepai','yenus','notrack'].includes(id))document.getElementById('runAI').onclick=async()=>{const p=document.getElementById('toolPrompt').value.trim();if(!p)return show('Isi prompt dulu.');show('Memproses...');try{const d=await postJSON('/api/ai/'+id,{prompt:p});show(d.status?d.answer:'Error: '+d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='ai-image')document.getElementById('runAIImage').onclick=async()=>{const p=document.getElementById('toolPrompt').value.trim();if(!p)return show('Isi prompt dulu.');show('Generating...');try{const d=await postJSON('/api/ai-image',{prompt:p,aspectRatio:document.getElementById('aspect').value});if(d.status)document.getElementById('toolOutput').innerHTML=`<a href="${d.data.url}" target="_blank" rel="noopener">Buka hasil gambar</a>`;else show('Error: '+d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='animes')document.getElementById('runAnime').onclick=async()=>{const q=document.getElementById('animeQuery').value.trim();if(!q)return show('Isi query.');show('Mencari...');try{const r=await fetch('/api/anime/search?q='+encodeURIComponent(q));show(await r.json());}catch(e){show('Error: '+e.message);}};
 if(id==='anime-detail')document.getElementById('runAnimeDetail').onclick=async()=>{const q=document.getElementById('animeQuery').value.trim();if(!q)return show('Isi judul/MAL ID.');show('Mengambil detail...');try{const r=await fetch('/api/anime/detail?q='+encodeURIComponent(q));const d=await r.json();if(d.status&&d.data?.url)document.getElementById('toolOutput').innerHTML=`<strong>${safeText(d.data.title||d.data.title_english||'Anime')}</strong><br><br>${safeText(d.data.synopsis||'Tidak ada sinopsis')}<br><br>Score: ${d.data.score??'-'}<br>Episodes: ${d.data.episodes??'-'}<br><a href="${d.data.url}" target="_blank" rel="noopener">MyAnimeList</a>`;else show(d);}catch(e){show('Error: '+e.message);}};
 const downloadMap={youtube:'/api/download/youtube/info',instagram:'/api/download/instagram',tiktok:'/api/download/tiktok',vidssave:'/api/download/vidssave',threads:'/api/download/threads',terabox:'/api/download/terabox',pinterest:'/api/download/pinterest','youtube-community':'/api/download/youtube-community'};
 if(downloadMap[id])document.getElementById('runTool').onclick=async()=>{const url=document.getElementById('toolUrl').value.trim();if(!url)return show('Isi URL.');show('Memproses...');try{const endpoint=downloadMap[id];const d=id==='youtube'?await (async()=>{const r=await fetch(endpoint+'?url='+encodeURIComponent(url));return r.json();})():await postJSON(endpoint,{url});if(d.status)document.getElementById('toolOutput').innerHTML=renderDownloadResult(d.data);else show('Error: '+d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='spotify')document.getElementById('runTool').onclick=async()=>{const url=document.getElementById('toolUrl').value.trim();if(!url)return show('Isi URL Spotify.');show('Lookup...');try{const r=await fetch('/api/download/spotify?url='+encodeURIComponent(url));const d=await r.json();if(d.status)document.getElementById('toolOutput').innerHTML=renderDownloadResult(d.data);else show('Error: '+d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='lyrics')document.getElementById('runLyrics').onclick=async()=>{const q=document.getElementById('toolQuery').value.trim();if(!q)return show('Isi judul/artis.');show('Searching...');try{const r=await fetch('/api/music/lyrics?q='+encodeURIComponent(q));const d=await r.json();show(d.status?d.data:d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='temp-mail'){document.getElementById('newMail').onclick=async()=>{show('Creating...');try{const d=await postJSON('/api/temp-mail/new',{});if(d.status)document.getElementById('mailAddress').value=d.data.create.email;show(d);}catch(e){show('Error: '+e.message);}};document.getElementById('checkMail').onclick=async()=>{const e=document.getElementById('mailAddress').value.trim();if(!e)return show('Masukkan email.');show('Checking...');try{const r=await fetch('/api/temp-mail/messages?email='+encodeURIComponent(e));const d=await r.json();show(d.status?d.data:d.error);}catch(x){show('Error: '+x.message);}};}
 if(['upscale','image-upload'].includes(id))document.getElementById('runUpload').onclick=async()=>{const f=document.getElementById('fileInput').files[0];if(!f)return show('Pilih gambar dulu.');const fd=new FormData();fd.append('file',f);let endpoint='/api/image/upload';if(id==='upscale'){fd.append('engine',document.getElementById('upscaleEngine').value);endpoint='/api/image/upscale';}show('Memproses foto HD...');try{const r=await fetch(endpoint,{method:'POST',body:fd});const d=await r.json();if(!d.status)return show('Error: '+d.error);if(id==='upscale'&&d.data?.url){const out=document.getElementById('toolOutput');out.innerHTML=`<div style="text-align:center"><img src="${d.data.url}" alt="Hasil upscaled" style="display:block;width:100%;max-height:520px;object-fit:contain;border-radius:14px;margin-bottom:12px"><a class="btn btn-primary full" target="_blank" rel="noopener noreferrer" href="${d.data.url}">Buka / Simpan Foto HD</a></div>`;}else show(d.data);}catch(e){show('Error: '+e.message);}};
 if(id==='sub2unlock')document.getElementById('runSub').onclick=async()=>{show('Creating...');try{const d=await postJSON('/api/sub2unlock',{keyLink:document.getElementById('keyLink').value,resultLink:document.getElementById('resultLink').value});show(d.status?d.data:d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='json-tools'){document.getElementById('formatJson').onclick=()=>{try{show(JSON.stringify(JSON.parse(document.getElementById('jsonInput').value),null,2));}catch(e){show('JSON invalid: '+e.message);}};document.getElementById('inspectJson').onclick=async()=>{const json=document.getElementById('jsonInput').value;try{const d=await postJSON('/api/json/inspect',{json});show(d.status?d.data:d.error);}catch(e){show('Error: '+e.message);}};}
 if(id==='qr-maker')document.getElementById('makeQr').onclick=async()=>{const text=document.getElementById('qrText').value.trim();if(!text)return;show('Generating...');try{const d=await postJSON('/api/qr',{text});if(d.status)document.getElementById('qrResult').innerHTML=`<img style="max-width:240px;display:block;margin:auto" alt="QR" src="${d.data.url}"><br><a target="_blank" rel="noopener" href="${d.data.url}">Buka / simpan QR</a>`;else document.getElementById('qrResult').textContent=d.error;}catch(e){document.getElementById('qrResult').textContent='Error: '+e.message;}};
 if(id==='fake-lobby'){
  const game=document.getElementById('fakeGame'), fields=document.getElementById('fakeFields');
  const renderFields=()=>{fields.innerHTML=game.value==='ml'?`<input id="mlAvatar" class="tool-input" placeholder="URL avatar" value="https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg"><input id="mlUsername" class="tool-input" placeholder="Username" value="Player"><input id="mlRank" class="tool-input" placeholder="Rank" value="Mythic"><input id="mlBorder" class="tool-input" type="number" min="1" max="99" placeholder="Border" value="11">`:`<input id="ffUsername" class="tool-input" placeholder="Nama pemain" value="Player">`;};
  renderFields(); game.addEventListener('change',renderFields);
  document.getElementById('runFakeLobby').onclick=async()=>{const g=game.value;const body=g==='ml'?{game:g,avatar:document.getElementById('mlAvatar').value.trim(),username:document.getElementById('mlUsername').value.trim(),rank:document.getElementById('mlRank').value.trim(),border:Number(document.getElementById('mlBorder').value)||11}:{game:g,username:document.getElementById('ffUsername').value.trim()};if(!body.username)return;document.getElementById('makerResult').textContent='Generating...';try{const d=await postJSON('/api/fake-lobby',body);if(!d.status){document.getElementById('makerResult').textContent=d.error;return;}const svg=d.data.svg;const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=d.data.width||1200;canvas.height=d.data.height||675;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);const png=canvas.toDataURL('image/png');document.getElementById('makerResult').innerHTML=`<img style="width:100%;max-height:520px;object-fit:contain;border-radius:14px;background:#111" src="${png}" alt="Fake Lobby ${g}"><br><a class="btn btn-primary full" download="fake-lobby-${g}.png" href="${png}">Simpan PNG</a>`;};img.onerror=()=>{URL.revokeObjectURL(url);document.getElementById('makerResult').textContent='Gagal merender gambar.';};img.src=url;}catch(e){document.getElementById('makerResult').textContent='Error: '+e.message;}};
 }
 if(['windows-player','write-maker','instagram-post'].includes(id))document.getElementById('runMaker').onclick=async()=>{const text=document.getElementById('makerText').value.trim();if(!text)return;document.getElementById('makerResult').textContent='Generating...';try{const d=await postJSON('/api/maker/'+id,{text});if(!d.status){document.getElementById('makerResult').textContent=d.error;return;}const svg=d.data.svg;
const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
const url=URL.createObjectURL(blob);
const img=new Image();
img.onload=()=>{
  const canvas=document.createElement('canvas');
  canvas.width=1200; canvas.height=675;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(img,0,0,1200,675);
  URL.revokeObjectURL(url);
  const pngUrl=canvas.toDataURL('image/png');
  document.getElementById('makerResult').innerHTML=
    `<img style="width:100%;max-height:320px;object-fit:contain;background:#111" src="${pngUrl}" alt="Generated maker">
    <br><a download="${id}.png" href="${pngUrl}">Simpan PNG</a>
    &nbsp;·&nbsp;<a download="${id}.svg" href="${URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}))}">Simpan SVG</a>`;
};
img.onerror=()=>{
  URL.revokeObjectURL(url);
  document.getElementById('makerResult').textContent='Gagal merender gambar. Coba ulangi.';
};
img.src=url;}catch(e){document.getElementById('makerResult').textContent='Error: '+e.message;}};
 if(id==='api-tester')document.getElementById('runApi').onclick=async()=>{const url=document.getElementById('apiUrl').value.trim();if(!url)return show('Masukkan URL.');show('Testing...');let headers={};try{headers=JSON.parse(document.getElementById('apiHeaders').value||'{}');}catch(e){return show('Headers JSON invalid.');}try{const d=await postJSON('/api/api-tester',{url,method:document.getElementById('apiMethod').value,headers,body:document.getElementById('apiBody').value});show(d.status?d.data:d.error);}catch(e){show('Error: '+e.message);}};
 if(id==='website-copy')document.getElementById('runSiteCopy').onclick=async()=>{const url=document.getElementById('siteUrl').value.trim();if(!url)return show('Masukkan URL.');show('Mengambil snapshot...');try{const d=await postJSON('/api/site-copy',{url});if(d.status){const blob=new Blob([d.data.html],{type:'text/html'});const href=URL.createObjectURL(blob);document.getElementById('toolOutput').innerHTML=`<strong>${safeText(d.data.title||'Untitled')}</strong><br><small>${safeText(d.data.notice)}</small><br><a download="website-snapshot.html" href="${href}">Simpan HTML Snapshot</a><br><br><pre style="white-space:pre-wrap">${safeText(d.data.html.slice(0,10000))}</pre>`;}else show(d.error);}catch(e){show('Error: '+e.message);}};
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b)openTool(b.dataset.tool);if(e.target.matches('[data-close]')||e.target.closest('[data-close]')){modal.classList.remove('open','download-all-mode');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}});
document.querySelectorAll('.open-tool').forEach(b=>b.addEventListener('click',()=>openTool(b.dataset.tool)));
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==input){e.preventDefault();input.focus();}if(e.key==='Escape'){modal.classList.remove('open','download-all-mode');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';document.body.style.overflow='';}});

// Recently used tools — local only, no database required.
const RECENT_KEY='rimuru_recent_tools';
function getRecent(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch{return[]}}
function saveRecent(id){
  const next=[id,...getRecent().filter(x=>x!==id)].slice(0,6);
  localStorage.setItem(RECENT_KEY,JSON.stringify(next)); renderRecent();
}
function renderRecent(){
  const el=document.getElementById('recentList'); if(!el)return;
  const ids=getRecent(), items=ids.map(id=>tools.find(t=>t.id===id)).filter(Boolean);
  el.innerHTML=items.length?items.map(t=>`<div class="recent-item" data-tool="${t.id}"><b>${t.icon} ${t.name}</b><small>${t.cat}</small></div>`).join(''):'<span class="recent-empty">Belum ada tool yang digunakan.</span>';
}
const _openTool=openTool;
openTool=function(id){saveRecent(id);_openTool(id)};
renderRecent();

// Make the hamburger exclusively control the About Dev drawer.
if(menuBtn){menuBtn.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();setDrawer(true)}}

fetch('/api/config/status').then(r=>r.json()).catch(()=>{});

/* v2.2 — Nexus interaction layer */
(() => {
  const toastStack = document.getElementById('toastStack');
  const toast = (message, type='ok') => {
    if (!toastStack) return;
    const el=document.createElement('div'); el.className='toast';
    el.innerHTML=`<span class="toast-mark">${type==='ok'?'✓':'!'}</span><span>${safeText(message)}</span>`;
    toastStack.appendChild(el); setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),220)},2600);
  };
  window.rimuruToast=toast;

  const palette=document.getElementById('commandPalette'), ci=document.getElementById('commandInput'), cr=document.getElementById('commandResults');
  let selected=0;
  function paletteItems(q=''){
    const query=q.toLowerCase().trim();
    return tools.filter(t=>!query || `${t.name} ${t.cat} ${t.desc} ${t.tags}`.toLowerCase().includes(query)).slice(0,10);
  }
  function renderPalette(){
    const items=paletteItems(ci?.value||''); selected=Math.max(0,Math.min(selected,items.length-1));
    cr.innerHTML=items.length?items.map((t,i)=>`<div class="command-result ${i===selected?'active':''}" data-command-tool="${t.id}"><span class="cr-icon">${t.icon}</span><span><b>${safeText(t.name)}</b><small>${safeText(t.cat.toUpperCase())} · ${safeText(t.desc)}</small></span></div>`).join(''):'<div class="command-result"><span><b>No tools found</b><small>Try another keyword.</small></span></div>';
  }
  function openPalette(){if(!palette)return;palette.classList.add('open');palette.setAttribute('aria-hidden','false');if(ci){ci.value='';renderPalette();setTimeout(()=>ci.focus(),20)}}
  function closePalette(){palette?.classList.remove('open');palette?.setAttribute('aria-hidden','true')}
  document.querySelectorAll('.search-box').forEach(el=>el.addEventListener('click',openPalette));
  ci?.addEventListener('input',renderPalette);
  cr?.addEventListener('click',e=>{const b=e.target.closest('[data-command-tool]');if(b){closePalette();openTool(b.dataset.commandTool)}});
  palette?.addEventListener('click',e=>{if(e.target===palette)closePalette()});
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}
    if(e.key==='Escape')closePalette();
    if(!palette?.classList.contains('open'))return;
    const items=paletteItems(ci?.value||'');
    if(e.key==='ArrowDown'){e.preventDefault();selected=Math.min(selected+1,items.length-1);renderPalette()}
    if(e.key==='ArrowUp'){e.preventDefault();selected=Math.max(selected-1,0);renderPalette()}
    if(e.key==='Enter'&&items[selected]){e.preventDefault();closePalette();openTool(items[selected].id)}
  });

  const FAV_KEY='rimuru_favorites_v2';
  const getFav=()=>{try{return JSON.parse(localStorage.getItem(FAV_KEY)||'[]')}catch{return[]}};
  const setFav=x=>localStorage.setItem(FAV_KEY,JSON.stringify(x));
  const favSection=document.getElementById('favoritesSection'), favList=document.getElementById('favoriteList');
  function renderFav(){
    if(!favSection||!favList)return; const ids=getFav(), items=ids.map(id=>tools.find(t=>t.id===id)).filter(Boolean);
    favSection.hidden=!items.length;
    favList.innerHTML=items.map(t=>`<div class="favorite-item" data-tool="${t.id}"><b>${t.icon} ${safeText(t.name)}</b><small>${safeText(t.cat)}</small></div>`).join('');
  }
  function toggleFav(id){const ids=getFav();const has=ids.includes(id);setFav(has?ids.filter(x=>x!==id):[id,...ids].slice(0,12));renderFav();toast(has?'Removed from favorites':'Added to favorites');}
  document.getElementById('clearFavorites')?.addEventListener('click',()=>{setFav([]);renderFav();toast('Favorites cleared')});
  favList?.addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b)openTool(b.dataset.tool)});
  renderFav();

  // Add a favorite star to every tool card without changing the existing tool behavior.
  const oldRender=render;
  window.renderRimuruTools=()=>{
    oldRender();
    document.querySelectorAll('.tool-card').forEach(card=>{
      const id=card.querySelector('[data-tool]')?.dataset.tool;if(!id)return;
      const foot=card.querySelector('.card-foot'); if(!foot||foot.querySelector('.favorite-btn'))return;
      const btn=document.createElement('button');btn.className='favorite-btn card-open';btn.type='button';btn.title='Favorite';btn.textContent=getFav().includes(id)?'★':'☆';
      btn.addEventListener('click',e=>{e.stopPropagation();toggleFav(id);btn.textContent=getFav().includes(id)?'★':'☆'});foot.insertBefore(btn,foot.firstChild);
    });
  };
  // Preserve existing filtering listeners by decorating render calls through a MutationObserver.
  const observer=new MutationObserver(()=>{document.querySelectorAll('.tool-card').forEach(card=>{const id=card.querySelector('[data-tool]')?.dataset.tool;if(!id)return;const foot=card.querySelector('.card-foot');if(!foot||foot.querySelector('.favorite-btn'))return;const btn=document.createElement('button');btn.className='favorite-btn card-open';btn.type='button';btn.title='Favorite';btn.textContent=getFav().includes(id)?'★':'☆';btn.addEventListener('click',e=>{e.stopPropagation();toggleFav(id);btn.textContent=getFav().includes(id)?'★':'☆'});foot.insertBefore(btn,foot.firstChild)})});
  observer.observe(document.getElementById('toolGrid'),{childList:true});

  document.querySelectorAll('[data-hub]').forEach(b=>b.addEventListener('click',()=>{
    const cat=b.dataset.hub; const target=document.querySelector(`.category[data-category="${cat}"]`); target?.click(); document.getElementById('tools')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`${cat[0].toUpperCase()+cat.slice(1)} Hub opened`);
  }));

  document.querySelectorAll('[data-mobile]').forEach(b=>b.addEventListener('click',()=>{
    const action=b.dataset.mobile;
    if(action==='home')window.scrollTo({top:0,behavior:'smooth'});
    if(action==='search')openPalette();
    if(action==='tools')document.getElementById('tools')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(action==='menu')setDrawer(true);
    document.querySelectorAll('.mobile-nav button').forEach(x=>x.classList.toggle('active',x===b));
  }));

  // Make card clicks open tools; favorite buttons remain isolated.
  document.getElementById('toolGrid')?.addEventListener('click',e=>{const card=e.target.closest('.tool-card');if(card&&!e.target.closest('button')){const b=card.querySelector('[data-tool]');if(b)openTool(b.dataset.tool)}});

  // Lightweight status refresh: keeps the dashboard honest without making the UI depend on it.
  const statusURL='/api/config/status';
  fetch(statusURL,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(()=>{
    document.querySelectorAll('.status-items b').forEach(x=>{x.classList.add('online');});
  }).catch(()=>{
    const gateway=document.querySelector('.status-items>div:nth-child(2) b');if(gateway){gateway.textContent='Checking';gateway.classList.remove('online');}
  });
})();


/* v3.2 — Global single-color theme system */
(() => {
  const root=document.documentElement;
  const btn=document.getElementById('themeBtn');
  const pop=document.getElementById('themePopover');
  const close=document.getElementById('themeClose');
  const custom=document.getElementById('customTheme');
  const preview=document.getElementById('themeColorPreview');
  const saved=localStorage.getItem('rimuru_global_color')||localStorage.getItem('rimuru_custom_theme')||'#3d8cff';

  const setColor=(hex,save=true)=>{
    if(!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    root.style.setProperty('--theme',hex);
    root.style.setProperty('--accent',hex);
    root.style.setProperty('--rimuru-cyan',hex);
    // All derived values intentionally stay in the same hue.
    root.style.setProperty('--theme2',`color-mix(in srgb, ${hex} 78%, #000)`);
    root.style.setProperty('--theme3',`color-mix(in srgb, ${hex} 48%, #000)`);
    root.style.setProperty('--theme4',`color-mix(in srgb, ${hex} 25%, #fff)`);
    root.style.setProperty('--accent-2',`color-mix(in srgb, ${hex} 78%, #000)`);
    root.style.setProperty('--accent-3',`color-mix(in srgb, ${hex} 48%, #000)`);
    root.style.setProperty('--global-theme',hex);
    if(custom) custom.value=hex;
    if(preview){preview.style.setProperty('--preview',hex); const b=preview.querySelector('b'); if(b)b.textContent='Global Color';}
    if(save){localStorage.setItem('rimuru_global_color',hex);localStorage.setItem('rimuru_theme','custom');localStorage.setItem('rimuru_custom_theme',hex);}
  };
  setColor(saved,false);
  btn?.addEventListener('click',e=>{e.stopPropagation();const open=!pop?.classList.contains('open');pop?.classList.toggle('open',open);pop?.setAttribute('aria-hidden',open?'false':'true');});
  close?.addEventListener('click',()=>pop?.classList.remove('open'));
  custom?.addEventListener('input',e=>setColor(e.target.value));
  document.addEventListener('click',e=>{if(pop?.classList.contains('open')&&!pop.contains(e.target)&&e.target!==btn)pop.classList.remove('open');});
})();

/* v2.5 — Rimuru AI unified workspace */
(() => {
  const ws=document.getElementById('aiWorkspace'); if(!ws)return;
  const welcome=document.getElementById('aiWelcome'), chat=document.getElementById('aiChatView'), nameInput=document.getElementById('aiNameInput'), enter=document.getElementById('aiEnter'), messages=document.getElementById('aiMessages'), input=document.getElementById('aiInput'), send=document.getElementById('aiSend'), modelBtn=document.getElementById('aiModelBtn'), modelMenu=document.getElementById('aiModelMenu'), modelName=document.getElementById('aiModelName'), chatModel=document.getElementById('chatModelLabel'), greeting=document.getElementById('aiGreeting'), userName=document.getElementById('aiUserName'), history=document.getElementById('aiHistory');
  const models=[['gpt','GPT','General chat & reasoning'],['gemini','Gemini','Google Gemini'],['deepai','DeepAI','Fast text generation'],['yenus','YenusAI','Gemini-based adapter'],['feelbetter','FeelBetterBot','Companion style'],['notrack','NoTrack AI','Utility & privacy']]; let current='gpt';
  function renderModels(){modelMenu.innerHTML=models.map(m=>`<div class="ai-model-option ${m[0]===current?'active':''}" data-model="${m[0]}"><i>${m[0]==='gpt'?'✦':m[0]==='gemini'?'✧':m[0]==='deepai'?'◈':m[0]==='yenus'?'✧':m[0]==='feelbetter'?'♡':'⌁'}</i><span><b>${m[1]}</b><small>${m[2]}</small></span></div>`).join('')}
  renderModels(); modelBtn?.addEventListener('click',e=>{e.stopPropagation();modelMenu.classList.toggle('open')}); modelMenu?.addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(!b)return;current=b.dataset.model;const m=models.find(x=>x[0]===current);modelName.textContent=m[1];chatModel.textContent=m[1];modelMenu.classList.remove('open');renderModels()});
  document.addEventListener('click',e=>{if(modelMenu?.classList.contains('open')&&!modelMenu.contains(e.target)&&e.target!==modelBtn)modelMenu.classList.remove('open')});
  function getName(){return localStorage.getItem('rimuru_ai_name')||''}
  function addMessage(role,text){const el=document.createElement('div');el.className='ai-msg '+role;el.innerHTML=role==='user'?`<div class="bubble">${safeText(text)}</div><div class="avatar">${safeText((getName()||'U').slice(0,2).toUpperCase())}</div>`:`<div class="avatar">R</div><div class="bubble">${safeText(text)}</div>`;messages.appendChild(el);messages.parentElement.scrollTop=messages.parentElement.scrollHeight}
  function addHistory(text){const e=document.createElement('div');e.className='ai-history-item';e.textContent=text;history.querySelector('span')?.remove();history.prepend(e)}
  function enterAI(){const n=(nameInput?.value||'').trim();if(!n)return;localStorage.setItem('rimuru_ai_name',n);showChat()}
  function showChat(){const n=getName();if(!n){welcome.hidden=false;chat.hidden=true;return}welcome.hidden=true;chat.hidden=false;userName.textContent=n;greeting.textContent='Halo, '+n+'!';if(!messages.children.length)addMessage('assistant',`Siap, ${n}. Gue Rimuru AI. Mau ngobrol, coding, cari ide, atau bahas apa aja?`)}
  function openAI(){ws.classList.add('open');ws.setAttribute('aria-hidden','false');showChat();document.body.style.overflow='hidden'}
  function closeAI(){ws.classList.remove('open');ws.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  document.querySelectorAll('[data-tool="ai-playground"], [data-open-ai]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openAI()}));
  enter?.addEventListener('click',enterAI);nameInput?.addEventListener('keydown',e=>{if(e.key==='Enter')enterAI()}); document.getElementById('aiClose')?.addEventListener('click',closeAI);document.getElementById('aiBackdrop')?.addEventListener('click',closeAI);document.getElementById('aiBackTools')?.addEventListener('click',closeAI);document.getElementById('aiNewChat')?.addEventListener('click',()=>{messages.innerHTML='';showChat()});document.getElementById('aiClear')?.addEventListener('click',()=>messages.innerHTML='');
  const aiSide=document.querySelector('.ai-sidebar');
  const aiSideBtn=document.getElementById('aiMobileMenu');
  const aiSideClose=document.getElementById('aiSidebarClose');
  function setAISidebar(open){
    aiSide?.classList.toggle('mobile-open',open);
    aiSideBtn?.setAttribute('aria-expanded',open?'true':'false');
  }
  aiSideBtn?.addEventListener('click',e=>{e.stopPropagation();setAISidebar(!aiSide?.classList.contains('mobile-open'))});
  aiSideClose?.addEventListener('click',()=>setAISidebar(false));
  document.querySelector('.ai-main')?.addEventListener('click',()=>setAISidebar(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setAISidebar(false)});
  document.querySelectorAll('.ai-suggestions button').forEach(b=>b.addEventListener('click',()=>{if(!getName()){nameInput.value=getName();nameInput.focus();return}input.value=b.textContent.replace(/^\S+\s/,'');input.focus()}));
  async function sendAI(){const p=input.value.trim();if(!p)return;if(!getName()){welcome.hidden=false;chat.hidden=true;nameInput.focus();return}showChat();addMessage('user',p);addHistory(p.slice(0,38));input.value='';send.disabled=true;try{const d=await postJSON('/api/ai/'+current,{prompt:p,history:[]});addMessage('assistant',d.status?(d.answer||'Tidak ada jawaban dari model.'):('Error: '+(d.error||'Provider tidak merespons.')))}catch(e){addMessage('assistant','⚠️ '+e.message)}finally{send.disabled=false}}
  send?.addEventListener('click',sendAI);input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI()}});
  document.getElementById('aiSettings')?.addEventListener('click',()=>document.getElementById('themeBtn')?.click());
  if(getName())showChat();
  window.openRimuruAI=openAI;
})();

/* v3.4 — Local account system (device-local, no Google/OAuth). */
(() => {
  const screen = document.getElementById('authScreen');
  const form = document.getElementById('authForm');
  const nameInput = document.getElementById('authName');
  const passInput = document.getElementById('authPassword');
  const loginTab = document.getElementById('authLoginTab');
  const registerTab = document.getElementById('authRegisterTab');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const submitText = document.getElementById('authSubmitText');
  const message = document.getElementById('authMessage');
  const close = document.getElementById('authClose');
  const logout = document.getElementById('logoutBtn');
  if (!screen || !form || !nameInput || !passInput) return;

  const USERS_KEY = 'rimuru_local_users_v1';
  const SESSION_KEY = 'rimuru_local_session_v1';
  let mode = 'login';

  const readUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; } };
  const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
  const normalize = (v) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const displayName = (v) => String(v || '').trim().replace(/\s+/g, ' ');
  const setMessage = (text, type='') => { message.textContent = text; message.className = 'auth-message' + (type ? ' '+type : ''); };

  async function digest(text){
    if (window.crypto?.subtle) {
      const data = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2,'0')).join('');
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function updateMode(next){
    mode = next;
    const registering = mode === 'register';
    loginTab?.classList.toggle('active', !registering);
    registerTab?.classList.toggle('active', registering);
    if (title) title.textContent = registering ? 'Create your account.' : 'Welcome back.';
    if (subtitle) subtitle.textContent = registering ? 'Buat akun Rimuru lokal, lalu kamu akan diarahkan kembali ke Login.' : 'Login dengan akun Rimuru yang kamu buat di perangkat ini.';
    if (submitText) submitText.textContent = registering ? 'DAFTAR' : 'MASUK';
    if (passInput) passInput.autocomplete = registering ? 'new-password' : 'current-password';
    setMessage('');
  }

  function currentSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
  function applySession(session){
    if (!session?.name) return;
    document.querySelectorAll('#aiUserName').forEach(el => el.textContent = session.name);
    const aiName = document.getElementById('aiNameInput');
    if (aiName && !aiName.value) aiName.value = session.name;
    screen.classList.add('auth-hidden');
    screen.setAttribute('aria-hidden','true');
  }

  loginTab?.addEventListener('click', () => updateMode('login'));
  registerTab?.addEventListener('click', () => updateMode('register'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = displayName(nameInput.value);
    const key = normalize(name);
    const password = passInput.value;
    if (name.length < 3) return setMessage('Nama minimal 3 karakter.', 'error');
    if (password.length < 4) return setMessage('Password minimal 4 karakter.', 'error');
    const users = readUsers();
    const submit = form.querySelector('.auth-submit');
    if (submit) submit.disabled = true;
    try {
      const hash = await digest(password);
      if (mode === 'register') {
        if (users[key]) return setMessage('Nama tersebut sudah terdaftar di perangkat ini.', 'error');
        users[key] = { name, password: hash, createdAt: Date.now() };
        saveUsers(users);
        updateMode('login');
        nameInput.value = name;
        passInput.value = '';
        setMessage('Akun berhasil dibuat. Sekarang login dengan akun tersebut.', 'success');
        nameInput.focus();
      } else {
        const account = users[key];
        if (!account || account.password !== hash) return setMessage('Nama atau password salah.', 'error');
        const session = { name: account.name, loginAt: Date.now() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        applySession(session);
      }
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  function logoutLocal(){
    localStorage.removeItem(SESSION_KEY);
    screen.classList.remove('auth-hidden');
    screen.setAttribute('aria-hidden','false');
    updateMode('login');
    nameInput.value = '';
    passInput.value = '';
    setMessage('Kamu sudah keluar dari akun.', 'success');
    window.scrollTo({top:0, behavior:'auto'});
  }
  logout?.addEventListener('click', logoutLocal);
  close?.addEventListener('click', () => {
    const session = currentSession();
    if (session) return applySession(session);
    setMessage('Buat akun atau login untuk masuk ke All Tools Rimuru.', 'error');
  });

  const session = currentSession();
  if (session?.name) applySession(session);
  else updateMode('login');
})();
