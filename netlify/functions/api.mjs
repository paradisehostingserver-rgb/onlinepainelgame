
import { getStore } from '@netlify/blobs';

const ACCOUNTS = {
  francisco: 'vinigay',
  ythalo: 'vinigay',
  pedro: 'vinigay'
};

const J = (o, s = 200, h = {}) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      ...h
    }
  });

const hex = b =>
  [...new Uint8Array(b)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');

async function tok(name) {
  const secret = ACCOUNTS[name];
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret + ':painel-devs'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return hex(await crypto.subtle.sign(
    'HMAC',
    k,
    new TextEncoder().encode(name)
  ));
}

const cookie = (name, value, age) =>
  `pt=${name}.${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

const getSession = async req => {
  const value = (req.headers.get('cookie') || '')
    .split(/;\s*/)
    .find(c => c.startsWith('pt='))
    ?.slice(3);

  if (!value) return null;

  const dot = value.indexOf('.');
  if (dot < 1) return null;

  const name = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  if (!Object.hasOwn(ACCOUNTS, name)) return null;

  return signature === await tok(name) ? name : null;
};

const okPath = p =>
  typeof p === 'string' && /^[\w\-\/]{1,80}$/.test(p);

export default async req => {
  const url = new URL(req.url);
  const op = url.searchParams.get('op');
  const st = getStore('painel');
  const body = req.method === 'POST'
    ? await req.json().catch(() => ({}))
    : {};

  if (op === 'login') {
    const name = String(body.name || '').trim().toLowerCase();
    const pw = String(body.pw || '');

    if (!Object.hasOwn(ACCOUNTS, name) || ACCOUNTS[name] !== pw) {
      return J({ e: 1 }, 401);
    }

    return J(
      { ok: 1, name: name === 'francisco' ? 'Francisco' : 'Ythalo' },
      200,
      { 'set-cookie': cookie(name, await tok(name), 2592000) }
    );
  }

  if (op === 'logout') {
    return J({ ok: 1 }, 200, {
      'set-cookie': 'pt=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    });
  }

  const user = await getSession(req);
  if (!user) return J({ e: 1 }, 401);

  if (op === 'me') return J({ ok: 1, name: user });

  if (op === 'snap') {
    return J((await st.get('all', { type: 'json' })) || {});
  }

  if (op === 'set' || op === 'del') {
    if (!okPath(body.p)) return J({ e: 'path' }, 400);

    const all = (await st.get('all', { type: 'json' })) || {};

    if (op === 'set') {
      if (JSON.stringify(body.d).length > 200000) {
        return J({ e: 'big' }, 413);
      }
      all[body.p] = body.d;
    } else {
      delete all[body.p];
    }

    await st.setJSON('all', all);
    return J({ ok: 1 });
  }

  if (op === 'upload') {
    if (typeof body.b !== 'string' || body.b.length > 5.6e6) {
      return J({ e: 'big' }, 413);
    }

    const id = crypto.randomUUID();
    const buf = Buffer.from(body.b, 'base64');

    await st.set(
      'f/' + id,
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );

    return J({ id });
  }

  if (op === 'file') {
    const id = (url.searchParams.get('id') || '').replace(/[^\w-]/g, '');
    const data = await st.get('f/' + id, { type: 'arrayBuffer' });

    if (!data) return J({ e: 'nf' }, 404);

    return new Response(data, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-content-type-options': 'nosniff',
        'cache-control': 'no-store'
      }
    });
  }

  if (op === 'rmfile') {
    await st.delete('f/' + String(body.id || '').replace(/[^\w-]/g, ''));
    return J({ ok: 1 });
  }

  return J({ e: 'op' }, 400);
};

export const config = { path: '/api' };
