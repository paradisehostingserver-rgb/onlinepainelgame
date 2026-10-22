// API do painel dos devs: senha no servidor, dados e arquivos no Netlify Blobs.
import { getStore } from '@netlify/blobs';
const PW = process.env.PANEL_PASSWORD || 'vinigay';
// Contas extras (nome em minúsculas -> senha). A senha geral (PW) continua valendo para qualquer nome.
const ACCOUNTS = { pedro: { name: 'Pedro', pw: 'vinigay' } };
const J = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function tok(secret = PW) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret + ':painel-devs'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('v1')));
}
const authed = async req => {
  const c = (req.headers.get('cookie') || '').split(/;\s*/);
  for (const secret of new Set([PW, ...Object.values(ACCOUNTS).map(a => a.pw)])) if (c.includes('pt=' + await tok(secret))) return true;
  return false;
};
const cookie = (v, age) => `pt=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const okPath = p => typeof p === 'string' && /^[\w\-\/]{1,80}$/.test(p);

export default async (req) => {
  const op = new URL(req.url).searchParams.get('op');
  const st = getStore('painel');
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  if (op === 'login') {
    const acc = ACCOUNTS[String(body.name || '').trim().toLowerCase()];
    const secret = acc && body.pw === acc.pw ? acc.pw : body.pw === PW ? PW : null;
    if (!secret) return J({ e: 1 }, 401);
    const id = String(body.id || '').replace(/[^\w-]/g, '').slice(0, 40), name = acc && secret === acc.pw ? acc.name : String(body.name || '').slice(0, 24);
    if (id && name) { const all = (await st.get('all', { type: 'json' })) || {}; all['profiles/' + id] = { name }; await st.setJSON('all', all); }
    return J({ ok: 1 }, 200, { 'set-cookie': cookie(await tok(secret), 2592000) });
  }
  if (op === 'logout') return J({ ok: 1 }, 200, { 'set-cookie': cookie('', 0) });
  if (!(await authed(req))) return J({ e: 1 }, 401);
  if (op === 'me') return J({ ok: 1 });
  if (op === 'snap') return J((await st.get('all', { type: 'json' })) || {});
  if (op === 'set' || op === 'del') {
    if (!okPath(body.p)) return J({ e: 'path' }, 400);
    const all = (await st.get('all', { type: 'json' })) || {};
    if (op === 'set') { if (JSON.stringify(body.d).length > 200000) return J({ e: 'big' }, 413); all[body.p] = body.d; } else delete all[body.p];
    await st.setJSON('all', all);
    return J({ ok: 1 });
  }
  if (op === 'upload') {
    if (typeof body.b !== 'string' || body.b.length > 5.6e6) return J({ e: 'big' }, 413);
    const id = crypto.randomUUID();
    const buf = Buffer.from(body.b, 'base64');
    await st.set('f/' + id, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    return J({ id });
  }
  if (op === 'file') {
    const id = (new URL(req.url).searchParams.get('id') || '').replace(/[^\w-]/g, '');
    const data = await st.get('f/' + id, { type: 'arrayBuffer' });
    if (!data) return J({ e: 'nf' }, 404);
    // sempre como texto puro + nosniff: arquivo enviado nunca roda como página no site
    return new Response(data, { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' } });
  }
  if (op === 'rmfile') { await st.delete('f/' + String(body.id || '').replace(/[^\w-]/g, '')); return J({ ok: 1 }); }
  return J({ e: 'op' }, 400);
};
export const config = { path: '/api' };
