// GET /api/convite?token=... → confere se o link de avaliação é válido
import { storeConfigurado } from './_lib/store.js';
import { json, query, dentroDoLimite } from './_lib/http.js';
import { lerConvite, CASAS } from './_lib/avaliacoes.js';

export default async function handler(req, res) {
  if (!storeConfigurado()) return json(res, 503, { status: 'nao_configurado' });
  if (!(await dentroDoLimite('convite', req, 60, 600))) return json(res, 429, { status: 'muitas_tentativas' });
  try {
    const cv = await lerConvite(query(req).token);
    if (!cv) return json(res, 404, { status: 'invalido' });
    if (cv.usadoEm) return json(res, 200, { status: 'usado', casa: cv.casa, casaNome: CASAS[cv.casa] });
    return json(res, 200, { status: 'ok', casa: cv.casa, casaNome: CASAS[cv.casa], nome: cv.nome, mes: cv.mes });
  } catch (e) { console.error('[convite]', e); return json(res, 500, { status: 'erro' }); }
}
