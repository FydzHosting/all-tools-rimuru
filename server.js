const express = require('express');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const dns = require('dns').promises;
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(express.static(__dirname));

const UA = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36';
function errMsg(e) {
  return e?.response?.data?.error?.message || e?.response?.data?.message ||
    (typeof e?.response?.data === 'string' ? e.response.data : null) || e?.message || 'Request failed';
}
function okUrl(raw, protocols=['http:','https:']) {
  let u; try { u = new URL(String(raw || '').trim()); } catch { throw new Error('URL tidak valid'); }
  if (!protocols.includes(u.protocol)) throw new Error('Hanya URL HTTP/HTTPS yang didukung');
  return u;
}
async function publicUrl(raw) {
  const u = okUrl(raw);
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host === '::1') throw new Error('URL lokal tidak diizinkan');
  const addrs = await dns.lookup(host, { all: true });
  for (const a of addrs) {
    const ip = a.address;
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) || ip.startsWith('127.') || ip.startsWith('169.254.') || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) throw new Error('Alamat privat/lokal tidak diizinkan');
  }
  return u;
}
async function surfSense(prompt) {
  const r = await axios.post('https://api.surfsense.com/api/v1/public/anon-chat/stream', { model_slug:'gpt-5.4-mini-no-login', messages:[{role:'user',content:prompt}] }, {responseType:'text',timeout:60000,headers:{'Content-Type':'application/json'}});
  let out=''; for (const line of r.data.split(/\r?\n/)) { if(!line.trim().startsWith('data:')) continue; const raw=line.trim().slice(5).trim(); if(raw==='[DONE]') continue; try { const j=JSON.parse(raw); if(j.type==='text-delta') out += j.delta || ''; } catch {} }
  return out || r.data.trim();
}
async function feelBetter(prompt) {
  const r=await axios.post('https://feelbetterbot.com/',{messages:[{role:'assistant',content:"Hi, I'm FeelBetterBot — I'm here to listen and help you through whatever's on your mind."},{role:'user',content:prompt}]},{responseType:'text',timeout:60000,headers:{'Content-Type':'application/json','Accept':'text/event-stream'}}); return r.data.trim();
}
async function yenus(prompt) {
  const baseUrl = 'https://yenus.created.app';
  const headers = {
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9',
    'content-type': 'application/json',
    'origin': baseUrl,
    'pragma': 'no-cache',
    'cache-control': 'no-cache',
    'referer': `${baseUrl}/`,
    'user-agent': UA,
    'x-createxyz-project-id': '31b1368e-b142-4030-bef4-1a10d86e4873'
  };
  const r = await axios.post(`${baseUrl}/integrations/google-gemini-1-5-flash`, {
    messages: [{ role: 'user', content: prompt }],
    stream: false
  }, { headers, responseType: 'text', timeout: 60000 });

  let data;
  try { data = JSON.parse(r.data); } catch { data = r.data; }

  if (r.status < 200 || r.status >= 300) {
    const msg = data && typeof data === 'object'
      ? (data.error?.message || data.error || data.message)
      : null;
    throw new Error(String(msg || `Yenus HTTP ${r.status}`));
  }

  // Normalize common response shapes so the UI receives plain text.
  const result = data?.result ?? data?.text ?? data?.response ?? data?.message ?? data?.content ?? data?.output ?? data;
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) {
    const text = result.map(x => typeof x === 'string' ? x : (x?.text || x?.content || '')).join('');
    if (text.trim()) return text;
  }
  if (result && typeof result === 'object') {
    const candidates = result.candidates || data?.candidates;
    const parts = candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts.map(x => x?.text || '').join('');
      if (text.trim()) return text;
    }
  }
  throw new Error('Yenus tidak mengembalikan teks yang bisa ditampilkan.');
}

async function gemini(prompt) {
  const key=process.env.GEMINI_API_KEY; if(!key) throw new Error('GEMINI_API_KEY belum diatur di .env');
  const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
  const r=await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{contents:[{parts:[{text:prompt}]}]},{headers:{'Content-Type':'application/json'},timeout:60000});
  return (r.data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('') || 'Gemini tidak mengembalikan teks.';
}
async function deepai(prompt) {
  const key=process.env.DEEPAI_API_KEY; if(!key) throw new Error('DEEPAI_API_KEY belum diatur di .env');
  const form=new URLSearchParams({text:prompt});
  const r=await axios.post('https://api.deepai.org/api/text-generator',form.toString(),{headers:{'api-key':key,'Content-Type':'application/x-www-form-urlencoded'},timeout:60000});
  return r.data?.output || r.data;
}

app.post('/api/ai/:provider',async(req,res)=>{
  const prompt=String(req.body?.prompt||'').trim();
  if(!prompt)return res.status(400).json({status:false,error:'Prompt kosong'});
  const provider=req.params.provider;
  try{
    let answer;
    if(provider==='gpt') answer=await surfSense(prompt);
    else if(provider==='gemini') answer=await gemini(prompt);
    else if(provider==='feelbetter') answer=await feelBetter(prompt);
    else if(provider==='yenus') answer=await yenus(prompt);
    else if(provider==='deepai') answer=await deepai(prompt);
    else if(provider==='notrack') answer=await surfSense(`Jawab singkat dan jangan meminta data pribadi. ${prompt}`);
    else return res.status(404).json({status:false,error:'Provider belum tersedia'});
    return res.json({status:true,provider,answer:String(answer||'').trim()});
  }catch(e){
    return res.status(502).json({status:false,provider,error:errMsg(e)});
  }
});

app.get('/api/anime/search',async(req,res)=>{const q=String(req.query.q||'').trim(); const key=process.env.NEOXR_APIKEY; if(!q)return res.status(400).json({status:false,error:'Query kosong'}); if(!key)return res.status(503).json({status:false,error:'NEOXR_APIKEY belum diatur'}); try{const r=await axios.get(`https://api.neoxr.eu/api/anime?q=${encodeURIComponent(q)}&apikey=${encodeURIComponent(key)}`,{timeout:30000});res.json(r.data);}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
app.get('/api/anime/detail',async(req,res)=>{const q=String(req.query.q||'').trim();if(!q)return res.status(400).json({status:false,error:'Isi judul atau MAL ID'});try{let id=Number(q);if(!Number.isInteger(id)){const s=await axios.get('https://api.jikan.moe/v4/anime',{params:{q,limit:1},timeout:30000});id=s.data?.data?.[0]?.mal_id;}if(!id)return res.status(404).json({status:false,error:'Anime tidak ditemukan'});const r=await axios.get(`https://api.jikan.moe/v4/anime/${id}/full`,{timeout:30000});res.json({status:true,data:r.data.data});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});


// Generic social-media fallback using the public Cobalt API.
// The API URL can be changed with COBALT_API_URL in .env if needed.
async function cobaltDownload(url, opts={}) {
  const endpoints = (process.env.COBALT_API_URL || 'https://api.cobalt.tools/').split(',').map(x=>x.trim()).filter(Boolean);
  const body = {
    url,
    videoQuality: 'max',
    audioFormat: 'mp3',
    downloadMode: opts.downloadMode || 'auto'
  };
  let last;
  for(const endpoint of endpoints){
    try{
      const {data} = await axios.post(endpoint, body, {headers:{'Accept':'application/json','Content-Type':'application/json'},timeout:22000});
      if(data && data.status !== 'error') return {provider:'cobalt',status:data.status,title:data.title||'',url:data.url||null,urls:Array.isArray(data.urls)?data.urls:[],filename:data.filename||'',picker:Array.isArray(data.picker)?data.picker:[]};
      last=new Error(data?.error?.code || data?.error?.message || 'Cobalt gagal');
    }catch(e){ last=e; }
  }
  throw new Error(last?.message || 'Cobalt gagal memproses URL');
}
async function withCobaltFallback(url, primary) {
  try { return await cobaltDownload(url); }
  catch (cobaltErr) {
    try { return await primary(url); }
    catch (primaryErr) {
      throw new Error(`Downloader gagal. Cobalt: ${cobaltErr.message}; provider cadangan: ${primaryErr.message}`);
    }
  }
}

async function vidsSave(url){const params=new URLSearchParams({auth:'20250901majwlqo',domain:'api-ak.vidssave.com',origin:'source',link:url});const {data}=await axios.post('https://api.vidssave.com/api/contentsite_api/media/parse',params.toString(),{headers:{'Content-Type':'application/x-www-form-urlencoded'},timeout:45000});return data;}
app.post('/api/download/vidssave',async(req,res)=>{try{const u=okUrl(req.body?.url);res.json({status:true,data:await withCobaltFallback(u.toString(), vidsSave)});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
async function tikwm(url){
  const {data}=await axios.post('https://www.tikwm.com/api/',
    new URLSearchParams({url,hd:'1'}).toString(),
    {headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'application/json','User-Agent':UA},timeout:45000});
  if(!data || data.code !== 0 || !data.data) throw new Error(data?.msg || 'TikWM gagal memproses URL');
  const d=data.data;
  const links=[];
  if(d.hdplay) links.push({type:'video',quality:'HD',url:d.hdplay});
  if(d.play && d.play!==d.hdplay) links.push({type:'video',quality:'SD',url:d.play});
  if(d.wmplay && d.wmplay!==d.play && d.wmplay!==d.hdplay) links.push({type:'video',quality:'Watermark',url:d.wmplay});
  if(d.music) links.push({type:'audio',quality:'Audio',url:d.music});
  if(!links.length) throw new Error('TikWM tidak mengembalikan media URL');
  return {provider:'tikwm',title:d.title||'',author:d.author?.unique_id||d.author?.nickname||'',cover:d.cover||d.origin_cover||null,links};
}

async function lovetik(url){const {data}=await axios.post('https://lovetik.com/api/ajax/search',new URLSearchParams({query:url}).toString(),{headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'*/*','X-Requested-With':'XMLHttpRequest','User-Agent':UA,'Origin':'https://lovetik.com','Referer':'https://lovetik.com/'},timeout:45000});return data;}
app.post('/api/download/tiktok',async(req,res)=>{
  try{
    const u=okUrl(req.body?.url).toString();
    let data;
    try { data=await tikwm(u); }
    catch(tikwmErr) {
      try { data=await cobaltDownload(u); }
      catch(cobaltErr) {
        try { data=await lovetik(u); }
        catch(lovetikErr) {
          throw new Error(`TikTok downloader gagal. TikWM: ${tikwmErr.message}; Cobalt: ${cobaltErr.message}; Lovetik: ${lovetikErr.message}`);
        }
        // Reject the old provider's empty media response instead of returning raw JSON.
        const links=Array.isArray(data?.links)?data.links:[];
        const hasMedia=links.some(x=>x && typeof x==='object' && x.url);
        if(!hasMedia) throw new Error('Provider TikTok tidak mengembalikan link media.');
      }
    }
    res.json({status:true,data});
  }catch(e){
    res.status(500).json({status:false,error:errMsg(e)});
  }
});
async function threadsDl(url){const {data}=await axios.post('https://www.threadsdl.app/api/threads',{url},{headers:{'Content-Type':'application/json'},timeout:45000});const media=[];for(const item of data.medias||[]){if(item.images?.length)media.push(...item.images.map(img=>({type:'image',url:img.url})));if(item.videos?.length)media.push({type:'video',url:(item.videos.find(v=>v.type===101)||item.videos[0]).url});}return {username:data.username,avatar:data.avatar,caption:data.text,media};}
app.post('/api/download/threads',async(req,res)=>{try{const u=okUrl(req.body?.url);res.json({status:true,data:await withCobaltFallback(u.toString(), threadsDl)});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
async function instagramScrape(url){const {data}=await axios.post('https://clipssaver.com/api/instagram/instagramDownloader/download-post',{url},{headers:{Accept:'application/json','Content-Type':'application/json'},timeout:45000});if(data.status!=='success')throw new Error('Instagram download gagal');const r=data.data.post;return {id:r.id,shortcode:r.short_code,username:r.owner?.username||'',caption:r.edge_media_to_caption?.edges?.[0]?.node?.text||'',thumbnail:r.thumbnail_src,image:r.display_url,video:r.video_url,download:r.download_url,likes:r.edge_liked_by?.count,comments:r.edge_media_to_comment?.count,duration:r.video_duration,type:r.type};}
app.post('/api/download/instagram',async(req,res)=>{try{res.json({status:true,data:await withCobaltFallback(okUrl(req.body?.url).toString(), instagramScrape)});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
async function teraDownloader(url){const {data}=await axios.post('https://teradownloadertool.com/api/download',{url},{headers:{'Content-Type':'application/json'},timeout:45000});if(!data.success)throw new Error('Gagal mengambil data Terabox');return {title:data.data.title,thumbnail:data.data.thumbnail,size:data.data.size,duration:data.data.duration,download:data.data.qualities};}
app.post('/api/download/terabox',async(req,res)=>{try{res.json({status:true,data:await teraDownloader(okUrl(req.body?.url).toString())});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
async function pinterestDl(url){const body=new URLSearchParams();body.append('url',url);const {data}=await axios.post('https://pintsave.net/api/fetch-media',body.toString(),{headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'*/*','X-Requested-With':'XMLHttpRequest'},timeout:30000});return data;}
app.post('/api/download/pinterest',async(req,res)=>{try{const u=okUrl(req.body?.url).toString();res.json({status:true,data:await withCobaltFallback(u,pinterestDl)});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
app.post('/api/download/youtube-community',async(req,res)=>{try{const {data}=await axios.post('https://studioseo.tools/api/youtube-community',{url:okUrl(req.body?.url).toString()},{headers:{'Content-Type':'application/json',Accept:'application/json'},timeout:45000});const images=(data.images||[]).map(img=>({original:String(img.original||'').startsWith('//')?'https:'+img.original:img.original,max:img.resolutions?.at(-1)?.url?.startsWith('//')?'https:'+img.resolutions.at(-1).url:img.resolutions?.at(-1)?.url,resolutions:(img.resolutions||[]).map(r=>({width:r.width,height:r.height,url:String(r.url||'').startsWith('//')?'https:'+r.url:r.url}))}));res.json({status:true,data:{total:data.total,images}});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
async function youtubeInfo(url){const {data}=await axios.get('https://www.sosmedsaver.me/api/info',{params:{url},headers:{Accept:'application/json'},timeout:30000});return data;}
app.get('/api/download/youtube/info',async(req,res)=>{try{const u=okUrl(req.query.url).toString();res.json({status:true,data:await withCobaltFallback(u,youtubeInfo)});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
app.get('/api/download/spotify',async(req,res)=>{try{const {data}=await axios.get('https://myspoty.app/api.php',{params:{action:'lookup',u:okUrl(req.query.url).toString()},headers:{Accept:'application/json'},timeout:45000});if(data.error)throw new Error('Spotify lookup gagal');res.json({status:true,data:{title:data.title,artist:data.artist,cover:data.cover,download:data.download}});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
app.get('/api/music/lyrics',async(req,res)=>{try{const {data}=await axios.get('https://lrclib.net/api/search',{params:{q:String(req.query.q||'')},timeout:30000});res.json({status:true,data});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});

const tempHeaders={'Content-Type':'application/json','Application-Name':'web','Application-Version':'4.0.0','X-CORS-Header':'iaWg3pchvFx48fY'};
app.post('/api/temp-mail/new',async(req,res)=>{try{const {data:create}=await axios.post('https://api.internal.temp-mail.io/api/v3/email/new',{min_name_length:10,max_name_length:10},{headers:tempHeaders,timeout:30000});const {data:inbox}=await axios.get(`https://api.internal.temp-mail.io/api/v3/email/${encodeURIComponent(create.email)}/messages`,{headers:tempHeaders,timeout:30000});res.json({status:true,data:{create,inbox}});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
app.get('/api/temp-mail/messages',async(req,res)=>{try{const email=String(req.query.email||'');const {data}=await axios.get(`https://api.internal.temp-mail.io/api/v3/email/${encodeURIComponent(email)}/messages`,{headers:tempHeaders,timeout:30000});res.json({status:true,data});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});

app.post('/api/image/upload',upload.single('file'),async(req,res)=>{if(!req.file)return res.status(400).json({status:false,error:'File gambar belum dipilih'});try{const form=new FormData();form.append('file',req.file.buffer,{filename:req.file.originalname||'image.jpg',contentType:req.file.mimetype});const {data}=await axios.post('https://phototourl.com/api/upload',form,{headers:{...form.getHeaders(),Accept:'application/json',Origin:'https://phototourl.com',Referer:'https://phototourl.com/'},timeout:45000});res.json({status:true,data});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
async function downloadImageBuffer(url) {
  const u = await publicUrl(url);
  const r = await axios.get(u.toString(), {responseType:'arraybuffer', timeout:45000, maxContentLength:20*1024*1024});
  return {buffer:Buffer.from(r.data), contentType:r.headers['content-type'] || 'image/jpeg'};
}
async function imgLargerUpscale(buffer, contentType='image/jpeg') {
  const mime = String(contentType || 'image/jpeg').split(';')[0];
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const form = new FormData();
  // ImgLarger expects scaleRadio during the upload request too.
  form.append('myfile', buffer, {
    filename: `${Date.now()}.${ext}`,
    contentType: mime
  });
  form.append('scaleRadio', '2');

  const headers = {
    ...form.getHeaders(),
    origin: 'https://imgupscaler.com',
    referer: 'https://imgupscaler.com/',
    'user-agent': UA,
    accept: 'application/json, text/plain, */*'
  };

  const up = await axios.post(
    'https://get1.imglarger.com/api/UpscalerNew/UploadNew',
    form,
    { headers, timeout: 60000, maxBodyLength: Infinity }
  );

  const code = up.data?.data?.code || up.data?.code;
  if (!code) {
    throw new Error(`ImgLarger upload gagal: ${JSON.stringify(up.data).slice(0, 500)}`);
  }

  const statusHeaders = {
    origin: 'https://imgupscaler.com',
    referer: 'https://imgupscaler.com/',
    'user-agent': UA,
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json'
  };

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const st = await axios.post(
      'https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew',
      { code, scaleRadio: 2 },
      { headers: statusHeaders, timeout: 20000 }
    );

    const d = st.data?.data || st.data;
    const resultUrl =
      d?.downloadUrls?.[0] ||
      d?.downloadUrl ||
      d?.url ||
      d?.result?.downloadUrls?.[0] ||
      d?.result?.downloadUrl ||
      d?.result?.url;

    if ((d?.status === 'success' || d?.status === 'Success') && resultUrl) {
      return resultUrl;
    }
    if (d?.status === 'failed' || d?.status === 'error') {
      throw new Error(`ImgLarger processing gagal: ${JSON.stringify(d).slice(0, 500)}`);
    }
  }

  throw new Error('ImgLarger timeout: hasil 2x belum tersedia setelah 2 menit');
}
async function visualParadigmUpscale(buffer, contentType='image/jpeg') {
  const form=new FormData();
  const ext=(contentType.split('/')[1]||'jpg').split(';')[0];
  form.append('file',buffer,{filename:`image.${ext}`,contentType});
  const r=await axios.post('https://ai-services.visual-paradigm.com/api/super-resolution/file',form,{headers:{...form.getHeaders(),accept:'*/*'},responseType:'arraybuffer',timeout:60000});
  const out=Buffer.from(r.data);
  const uf=new FormData();
  uf.append('files[]',out,{filename:`upscaled_${Date.now()}.${ext}`});
  const u=await axios.post('https://uguu.se/upload',uf,{headers:uf.getHeaders(),timeout:45000});
  if(!u.data?.success || !u.data.files?.[0]?.url) throw new Error('Upload hasil Visual Paradigm gagal');
  return u.data.files[0].url;
}
app.post('/api/image/upscale',upload.single('file'),async(req,res)=>{
  if(!req.file)return res.status(400).json({status:false,error:'File gambar belum dipilih'});
  const engine=String(req.body?.engine||'imglarger');
  try{
    const url=engine==='visual' ? await visualParadigmUpscale(req.file.buffer,req.file.mimetype) : await imgLargerUpscale(req.file.buffer,req.file.mimetype);
    res.json({status:true,data:{engine,url,filename:req.file.originalname||'upscaled.jpg'}});
  }catch(e){res.status(500).json({status:false,error:errMsg(e)});}
});
app.post('/api/image/upscale-url',async(req,res)=>{
  const url=String(req.body?.url||'').trim();
  const engine=String(req.body?.engine||'imglarger');
  if(!url)return res.status(400).json({status:false,error:'URL gambar belum diisi'});
  try{
    const {buffer,contentType}=await downloadImageBuffer(url);
    const result=engine==='visual' ? await visualParadigmUpscale(buffer,contentType) : await imgLargerUpscale(buffer,contentType);
    res.json({status:true,data:{engine,url:result}});
  }catch(e){res.status(500).json({status:false,error:errMsg(e)});}
});
app.post('/api/sub2unlock',async(req,res)=>{try{const {data}=await axios.post('https://sub2unlocksl.com/api/overseas/v1/short-link/save',{platformId:1,productId:1,statisticsNo:1,terminal:'web',language:'en',linkContent:JSON.stringify({'link-1':String(req.body?.keyLink||''),'link-2':'','link-3':'','link-4':'','link-5':'','file-link':String(req.body?.resultLink||'')})},{headers:{'Content-Type':'application/json','Accept':'*/*','X-Requested-With':'XMLHttpRequest'},timeout:30000});const id=data?.content?.identification;res.json({status:true,data:{...data,taskUrl:id?`https://sub2unlocksl.com/views/task/index.html?id=${id}`:null}});}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});
app.post('/api/ai-image',async(req,res)=>{if(!process.env.CREEN_AUTH_TOKEN||!process.env.CREEN_FINGER)return res.status(503).json({status:false,error:'CREEn AI belum dikonfigurasi. Isi CREEN_AUTH_TOKEN dan CREEN_FINGER di .env.'});try{const api=axios.create({baseURL:'https://www.creen.ai/api',timeout:60000,headers:{Accept:'application/json, text/plain, */*','Content-Type':'application/json','x-platform':'web','x-version':'999.0.0','x-language':'id','x-auth-token':process.env.CREEN_AUTH_TOKEN,'x-finger':process.env.CREEN_FINGER}});const prompt=String(req.body?.prompt||'').trim();const create=await api.post('/aiImage/create/v2',{modelId:14,baseImage:'',imageUrls:[],prompt,resolution:'1K',quality:'low',aspectRatio:req.body?.aspectRatio||'16:9',number:1,permission:1});const result=create.data?.result?.dataList?.[0];if(!result?.id)throw new Error('Task AI image tidak dibuat');for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,3000));const {data}=await api.post('/aiImage/getListTaskStatus',{resultIds:[result.id]});const task=data?.data?.[0];if(task?.status===2&&task.resultUrl)return res.json({status:true,data:{resultId:result.id,url:task.resultUrl}});if(task?.errorMessage)throw new Error(task.errorMessage);}throw new Error('AI image timeout');}catch(e){res.status(500).json({status:false,error:errMsg(e)});}});

function makerSvg(kind,text,sub='By FydzXzL') {
  const fs = require('fs');
  const path = require('path');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const assetData = (name) => {
    const p=path.join(__dirname,'assets',name);
    const b=fs.readFileSync(p).toString('base64');
    return `data:image/jpeg;base64,${b}`;
  };
  const wrap=(value,max)=>{
    const words=String(value||'').split(/\s+/);
    const lines=[]; let line='';
    for(const w of words){
      const next=line?`${line} ${w}`:w;
      if(next.length>max && line){ lines.push(line); line=w; } else line=next;
    }
    if(line) lines.push(line);
    return lines;
  };

  if(kind==='ff-lobby'){
    const bg=assetData('ff-template-clean.jpg');
    const name=esc(text||'Nama').slice(0,18);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="863" height="1536" viewBox="0 0 863 1536">
      <image href="${bg}" x="0" y="0" width="863" height="1536" preserveAspectRatio="none"/>
      <text x="432" y="1242" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="34" font-weight="700"
        fill="#f5c45a" stroke="#5b3510" stroke-width="2.2" paint-order="stroke"
        letter-spacing="0.5">${name}</text>
    </svg>`;
  }

  if(kind==='write-maker'){
    const bg=assetData('write-template-clean.jpg');
    const lines=wrap(text,58);
    let y=255;
    let tsp='';
    // One generated line per notebook rule. Text wraps automatically.
    for(const line of lines.slice(0,32)){
      tsp += `<text x="118" y="${y}" font-family="Arial,sans-serif" font-size="27" fill="#222">${esc(line)}</text>`;
      y += 37;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="864" height="1536" viewBox="0 0 864 1536">
      <image href="${bg}" x="0" y="0" width="864" height="1536" preserveAspectRatio="none"/>
      ${tsp}
    </svg>`;
  }

  const palettes={windows:['#111827','#60a5fa'],instagram:['#111827','#ec4899']};
  const [bg,accent]=palettes[kind]||palettes.windows;
  const t=esc(text||'All Tools Rimuru'); const ss=esc(sub);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/><circle cx="1010" cy="100" r="180" fill="white" opacity=".08"/><circle cx="180" cy="570" r="220" fill="white" opacity=".06"/><text x="70" y="230" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="white">${t}</text><text x="74" y="300" font-family="Arial,sans-serif" font-size="28" fill="white" opacity=".82">${kind.toUpperCase()} MAKER</text><text x="74" y="610" font-family="Arial,sans-serif" font-size="24" fill="white" opacity=".75">${ss}</text></svg>`;
}
app.post('/api/maker/:kind',async(req,res)=>{const kinds=['windows-player','write-maker','instagram-post','ff-lobby'];if(!kinds.includes(req.params.kind))return res.status(404).json({status:false,error:'Maker tidak tersedia'});const text=String(req.body?.text||'').trim();if(!text)return res.status(400).json({status:false,error:'Teks kosong'});res.json({status:true,data:{format:'svg',svg:makerSvg(req.params.kind,text)}});});
async function avatarDataUri(url) {
  try {
    const u = await publicUrl(url);
    const r = await axios.get(u.toString(), { responseType:'arraybuffer', timeout:20000, maxContentLength:5*1024*1024 });
    const mime = String(r.headers['content-type'] || 'image/jpeg').split(';')[0];
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(mime)) throw new Error('Avatar bukan file gambar');
    return `data:${mime};base64,${Buffer.from(r.data).toString('base64')}`;
  } catch (_) {
    return '';
  }
}
function fakeMlSvg({avatar='',username='Player',rank='Mythic',border=11}) {
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const safeRank=esc(rank).slice(0,18), safeName=esc(username).slice(0,20);
  const b=Math.max(1,Math.min(99,Number(border)||11));
  const fallback=`<circle cx="190" cy="300" r="104" fill="#182437"/><text x="190" y="315" text-anchor="middle" font-family="Arial" font-size="72" fill="#dbeafe">ML</text>`;
  const image=avatar?`<defs><clipPath id="avatarClip"><circle cx="190" cy="300" r="104"/></clipPath></defs><image href="${avatar}" x="86" y="196" width="208" height="208" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`:fallback;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#09111f"/><stop offset=".55" stop-color="#18243a"/><stop offset="1" stop-color="#0b3b58"/></linearGradient><linearGradient id="glow" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#5ee7ff"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
  <rect width="1000" height="600" rx="34" fill="url(#bg)"/><circle cx="850" cy="90" r="210" fill="#4cc9ff" opacity=".08"/><circle cx="70" cy="560" r="250" fill="#8b5cf6" opacity=".07"/>
  <rect x="34" y="34" width="932" height="532" rx="28" fill="none" stroke="url(#glow)" stroke-opacity=".55" stroke-width="2"/>
  <text x="70" y="105" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#a5d8ff" letter-spacing="3">MOBILE LEGENDS</text>
  <text x="70" y="145" font-family="Arial,sans-serif" font-size="16" fill="#94a3b8">FAKE LOBBY CARD · BORDER ${b}</text>
  <circle cx="190" cy="300" r="119" fill="none" stroke="url(#glow)" stroke-width="12" opacity=".9"/>${image}
  <circle cx="190" cy="300" r="104" fill="none" stroke="#e6f7ff" stroke-opacity=".35" stroke-width="3"/>
  <text x="390" y="245" font-family="Arial,sans-serif" font-size="22" fill="#93c5fd">PLAYER</text>
  <text x="390" y="295" font-family="Arial,sans-serif" font-size="54" font-weight="800" fill="#fff">${safeName}</text>
  <text x="390" y="350" font-family="Arial,sans-serif" font-size="22" fill="#93c5fd">RANK</text>
  <text x="390" y="397" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="#f8d477">${safeRank}</text>
  <rect x="390" y="445" width="360" height="8" rx="4" fill="url(#glow)" opacity=".8"/>
  <text x="70" y="525" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8">Generated by All Tools Rimuru</text>
  </svg>`;
}
app.post('/api/fake-lobby',async(req,res)=>{
  try {
    const game=String(req.body?.game||'').toLowerCase();
    const username=String(req.body?.username||'Player').trim().slice(0,30);
    if(!['ml','ff'].includes(game)) return res.status(400).json({status:false,error:'Pilih game Mobile Legends atau Free Fire'});
    if(!username) return res.status(400).json({status:false,error:'Username kosong'});
    if(game==='ff') return res.json({status:true,data:{game,format:'svg',width:863,height:1536,svg:makerSvg('ff-lobby',username)}});
    const avatar=await avatarDataUri(String(req.body?.avatar||''));
    const svg=fakeMlSvg({avatar,username,rank:String(req.body?.rank||'Mythic'),border:req.body?.border});
    return res.json({status:true,data:{game,format:'svg',width:1000,height:600,svg}});
  } catch(e) { return res.status(500).json({status:false,error:errMsg(e)}); }
});


app.post('/api/qr',async(req,res)=>{const text=String(req.body?.text||'').trim();if(!text)return res.status(400).json({status:false,error:'Teks/URL kosong'});const url='https://api.qrserver.com/v1/create-qr-code/?size=640x640&data='+encodeURIComponent(text);res.json({status:true,data:{url}});});
app.post('/api/json/inspect',(req,res)=>{try{const raw=String(req.body?.json||'');const parsed=JSON.parse(raw);const walk=(v,p='')=>{const out=[];if(Array.isArray(v)){v.forEach((x,i)=>out.push(...walk(x,`${p}[${i}]`)));}else if(v&&typeof v==='object'){for(const [k,x] of Object.entries(v))out.push(...walk(x,p?`${p}.${k}`:k));}else out.push({path:p,type:v===null?'null':typeof v,value:v});return out;};res.json({status:true,data:{formatted:JSON.stringify(parsed,null,2),type:Array.isArray(parsed)?'array':typeof parsed,keys:parsed&&typeof parsed==='object'?Object.keys(parsed):[],leaves:walk(parsed)}});}catch(e){res.status(400).json({status:false,error:'JSON invalid: '+e.message});}});

app.post('/api/api-tester',async(req,res)=>{try{const u=await publicUrl(req.body?.url);const method=String(req.body?.method||'GET').toUpperCase();if(!['GET','POST','PUT','PATCH','DELETE','HEAD'].includes(method))throw new Error('Method tidak didukung');let headers=req.body?.headers||{};if(typeof headers==='string')headers=JSON.parse(headers||'{}');const config={method,url:u.toString(),headers:{...headers,'User-Agent':UA},timeout:30000,maxRedirects:3,validateStatus:()=>true};if(!['GET','HEAD'].includes(method))config.data=req.body?.body||undefined;const started=Date.now();const r=await axios(config);const data=typeof r.data==='string'?r.data:r.data;res.json({status:true,data:{statusCode:r.status,statusText:r.statusText,timeMs:Date.now()-started,headers:r.headers,body:data}});}catch(e){res.status(400).json({status:false,error:errMsg(e)});}});

app.post('/api/site-copy',async(req,res)=>{try{const u=await publicUrl(req.body?.url);const r=await axios.get(u.toString(),{headers:{'User-Agent':UA,'Accept':'text/html'},timeout:30000,maxContentLength:5*1024*1024,responseType:'text'});let html=String(r.data);html=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<form[\s\S]*?<\/form>/gi,'').replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi,'');res.json({status:true,data:{url:u.toString(),title:(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.trim()||'',html,notice:'Snapshot aman: script dan form dihapus.'}});}catch(e){res.status(400).json({status:false,error:errMsg(e)});}});
app.get('/api/site-copy/status',(req,res)=>res.json({status:true,message:'Website Snapshot tersedia untuk inspeksi HTML publik. Script dan form dihapus.'}));

app.get('/api/config/status',(req,res)=>res.json({gpt:true,feelbetter:true,gemini:!!process.env.GEMINI_API_KEY,deepai:!!process.env.DEEPAI_API_KEY,neoxr:!!process.env.NEOXR_APIKEY,creEn:!!process.env.CREEN_AUTH_TOKEN&&!!process.env.CREEN_FINGER}));
app.get('/{*splat}',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
if (require.main === module) {
  const port=process.env.PORT||25565;
  app.listen(port,()=>console.log(`All Tools Rimuru running on http://localhost:${port}`));
}

module.exports = app;

