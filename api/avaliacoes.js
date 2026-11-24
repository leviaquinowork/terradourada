// GET  /api/avaliacoes → avaliações aprovadas (públicas), das duas casas
// POST /api/avaliacoes → envio de avaliação a partir de um convite
import { storeConfigurado } from './_lib/store.js';
import { json, lerCorpo, dentroDoLimite } from './_lib/http.js';
import { publicas, enviar } from './_lib/avaliacoes.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!storeConfigurado()) return json(res, 200, { status: 'nao_configurado', avaliacoes: [] }, 's-maxage=60');
    try { return json(res, 200, { status: 'ok', avaliacoes: await publicas() }, 's-maxage=30, stale-while-revalidate=60'); }
    catch (e) { console.error('[avaliacoes]', e); return json(res, 200, { status: 'erro', avaliacoes: [] }); }
  }
  if (req.method !== 'POST') return json(res, 405, { ok: false, code: 'metodo' });
  if (!storeConfigurado()) return json(res, 503, { ok: false, code: 'nao_configurado' });
  if (!(await dentroDoLimite('avaliacao', req, 8, 3600))) return json(res, 429, { ok: false, code: 'muitas_tentativas' });
  let corpo;
  try { corpo = await lerCorpo(req); } catch { return json(res, 400, { ok: false, code: 'dados_invalidos' }); }
  try {
    const r = await enviar(corpo.token, corpo);
    if (r.ok || r.code === 'spam') return json(res, 200, { ok: true }); // não revela o filtro anti-spam
    return json(res, r.code === 'dados_invalidos' ? 400 : r.code === 'convite_usado' ? 409 : 404, r);
  } catch (e) { console.error('[avaliacoes]', e); return json(res, 500, { ok: false, code: 'erro' }); }
}
