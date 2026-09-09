// Vercel server-side proxy -> Fydz VPS backend.
// Frontend keeps using same-origin /api/* requests, while Vercel forwards
// them to the working VPS on port 25565.

const VPS_ORIGIN = (process.env.VPS_API_URL || 'http://172.236.137.78:25565').replace(/\/$/, '');

function cleanHeaders(req) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    const lower = key.toLowerCase();
    if (['host', 'content-length', 'connection', 'transfer-encoding'].includes(lower)) continue;
    if (value == null) continue;
    headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return headers;
}

module.exports = async function handler(req, res) {
  try {
    const rawPath = req.url || '/api';
    const target = new URL(rawPath, VPS_ORIGIN);
    const headers = cleanHeaders(req);
    headers.host = new URL(VPS_ORIGIN).host;
    headers['x-forwarded-host'] = req.headers.host || '';
    headers['x-forwarded-proto'] = 'https';

    const method = (req.method || 'GET').toUpperCase();
    const init = { method, headers, redirect: 'manual' };

    if (!['GET', 'HEAD'].includes(method)) {
      init.body = req;
      init.duplex = 'half';
    }

    const response = await fetch(target, init);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (['content-length', 'transfer-encoding', 'connection'].includes(lower)) return;
      res.setHeader(key, value);
    });

    if (method === 'HEAD' || response.body == null) {
      res.end();
      return;
    }

    const reader = response.body.getReader();
    res.on('close', () => reader.cancel().catch(() => {}));
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise(resolve => res.once('drain', resolve));
      }
    }
    res.end();
  } catch (error) {
    console.error('VPS proxy error:', error);
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      status: false,
      error: 'VPS backend tidak dapat dihubungi.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  }
};
