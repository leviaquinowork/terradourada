// Armazenamento das avaliações: Upstash Redis pela API REST (sem dependências).
// Na Vercel: Storage → Upstash (Redis) → conectar ao projeto. As variáveis
// KV_REST_API_URL e KV_REST_API_TOKEN são criadas automaticamente
// (também aceita UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).

let override = null;
export function usarStore(s) { override = s; }

function env() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export const storeConfigurado = () => Boolean(override || env());

function upstash({ url, token }) {
  async function cmd(args) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) throw new Error('Upstash: ' + (d.error || r.status));
    return d.result;
  }
  return {
    hget: (k, f) => cmd(['HGET', k, f]),
    hset: async (k, f, v) => { await cmd(['HSET', k, f, v]); },
    hdel: async (k, f) => { await cmd(['HDEL', k, f]); },
    hgetall: async (k) => {
      const a = await cmd(['HGETALL', k]);
      const o = {};
      for (let i = 0; a && i < a.length; i += 2) o[a[i]] = a[i + 1];
      return o;
    },
    incr: async (k, ttl) => {
      const n = await cmd(['INCR', k]);
      if (n === 1) await cmd(['EXPIRE', k, ttl]);
      return n;
    },
    contador: async (k) => Number((await cmd(['GET', k])) || 0)
  };
}

export function storeMemoria() {
  const db = new Map();
  const h = (k) => db.get(k) ?? db.set(k, new Map()).get(k);
  return {
    hget: async (k, f) => h(k).get(f) ?? null,
    hset: async (k, f, v) => { h(k).set(f, v); },
    hdel: async (k, f) => { h(k).delete(f); },
    hgetall: async (k) => Object.fromEntries(h(k)),
    incr: async (k) => { const n = Number(h('__c').get(k) || 0) + 1; h('__c').set(k, String(n)); return n; },
    contador: async (k) => Number(h('__c').get(k) || 0)
  };
}

export function store() {
  if (override) return override;
  const e = env();
  if (!e) throw new Error('store_nao_configurado');
  return upstash(e);
}
