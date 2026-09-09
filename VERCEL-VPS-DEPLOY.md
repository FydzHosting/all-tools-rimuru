# All Tools Rimuru — Vercel Frontend + VPS Backend

Backend VPS yang dipakai project ini:

`http://172.236.137.78:25565`

## Deploy ke Vercel

1. Upload/import ZIP ini ke GitHub, lalu import repository tersebut di Vercel.
2. Framework Preset: **Other** (atau biarkan Vercel mendeteksi sebagai static project).
3. Build Command: kosongkan.
4. Output Directory: kosongkan.
5. Deploy.

Frontend tetap memanggil `/api/...` seperti biasa. File `api/[...path].js` menjadi proxy server-side Vercel dan meneruskan request ke VPS port **25565**.

## Opsional: pakai Environment Variable

Di Vercel → Project Settings → Environment Variables, buat:

`VPS_API_URL=http://172.236.137.78:25565`

Kalau variable tidak dibuat, project otomatis memakai URL VPS tersebut sebagai default.

## Penting

- Jangan mengubah port VPS dari 25565 untuk project ini.
- VPS harus tetap online dan endpoint API harus bisa diakses dari internet.
- Karena browser hanya meminta `/api/...` ke domain Vercel, frontend HTTPS tidak melakukan direct fetch ke HTTP VPS.
