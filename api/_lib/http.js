// Utilidades das funções: resposta JSON, leitura do corpo, limite de tentativas e senha do painel.
import { createHash, timingSafeEqual } from 'node:crypto';
import { store, storeConfigurado } from './store.js';

export function json(res, status, obj, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(obj));
}

export async function lerCorpo(req, max = 16000) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : null;
  if (raw === null) {
    raw = '';
    for await (const c of req) { raw += c; if (raw.length > max) throw new Error('grande_demais'); }
  }
  if (raw.length > max) throw new Error('grande_demais');
  return raw ? JSON.parse(raw) : {};
}

export function query(req) {
  if (req.query) return req.query;
  return Object.fromEntries(new URL(req.url, 'http://x').searchParams);
}

const cabecalho = (req, n) => {
  const v = req.headers[n.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
};

// O IP é guardado só como resumo criptográfico, nunca em texto.
function chaveVisitante(req) {
  const ip = cabecalho(req, 'x-real-ip') || String(cabecalho(req, 'x-forwarded-for') || '').split(',')[0].trim() || 'desconhecido';
  return createHash('sha256').update('terradourada:' + ip).digest('hex').slice(0, 24);
}

export async function dentroDoLimite(bucket, req, limite, janelaSeg) {
  if (!storeConfigurado()) return true;
  try { return (await store().incr(`terradourada:rl:${bucket}:${chaveVisitante(req)}`, janelaSeg)) <= limite; }
  catch { return true; }
}

export async function tentativas(bucket, req) {
  if (!storeConfigurado()) return 0;
  try { return await store().contador(`terradourada:rl:${bucket}:${chaveVisitante(req)}`); }
  catch { return 0; }
}

export const adminConfigurado = () => (process.env.ADMIN_PASSWORD || '').length >= 10;

export function senhaCorreta(req) {
  const esperado = process.env.ADMIN_PASSWORD || '';
  const dada = cabecalho(req, 'x-admin-password');
  if (esperado.length < 10 || !dada) return false;
  const a = createHash('sha256').update(String(dada)).digest();
  const b = createHash('sha256').update(esperado).digest();
  return timingSafeEqual(a, b);
}
