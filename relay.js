// يلا رياضة — وسيط API-Sports. يشتغل على VPS بعنوان IP ثابت ويكلّم المزوّد بدل Supabase.
// بدون أي حزم: Node 18+ فقط.  المتغيرات: API_FOOTBALL_KEY, RELAY_SECRET, PORT (اختياري)
const http = require('http');
const crypto = require('crypto');

const KEY = process.env.API_FOOTBALL_KEY || '';
const SECRET = process.env.RELAY_SECRET || '';
const PORT = Number(process.env.PORT || 3000);
const UPSTREAM = {
  football: process.env.UPSTREAM_FOOTBALL || 'https://v3.football.api-sports.io/fixtures',
  basketball: process.env.UPSTREAM_BASKETBALL || 'https://v1.basketball.api-sports.io/games',
};
if (!KEY || SECRET.length < 16) { console.error('اضبط API_FOOTBALL_KEY و RELAY_SECRET (16 حرفًا على الأقل).'); process.exit(1); }

const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const send = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };

http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
  if (req.method !== 'POST' || req.url !== '/fetch') return send(res, 404, { error: 'not found' });
  if (!safeEq(String(req.headers['x-relay-secret'] || ''), SECRET)) return send(res, 401, { error: 'unauthorized' });
  let raw = ''; for await (const c of req) { raw += c; if (raw.length > 2000) return send(res, 413, { error: 'too large' }); }
  let b; try { b = JSON.parse(raw); } catch { return send(res, 400, { error: 'bad json' }); }
  if (!UPSTREAM[b.sport]) return send(res, 400, { error: 'bad sport' });
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(b.params || {})) {
    if (!['timezone', 'date', 'id'].includes(k) || !/^[\w:+\/-]{1,40}$/.test(String(v))) return send(res, 400, { error: 'bad param' });
    q.set(k, String(v));
  }
  try {
    const r = await fetch(`${UPSTREAM[b.sport]}?${q}`, { headers: { 'x-apisports-key': KEY }, signal: AbortSignal.timeout(10000) });
    res.writeHead(r.status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(await r.text());
  } catch (e) { console.error('upstream:', e.message); send(res, 502, { error: 'upstream failed' }); }
}).listen(PORT, '127.0.0.1', () => console.log('relay on 127.0.0.1:' + PORT));
