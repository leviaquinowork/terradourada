// Painel da equipe (/admin). Protegido pela senha ADMIN_PASSWORD (mínimo 10 caracteres).
// GET  → lista avaliações e convites
// POST → { acao: 'convite' | 'aprovar' | 'recusar' | 'pendente' | 'apagar' | 'apagar_convite', ... }
import { storeConfigurado } from './_lib/store.js';
import { json, lerCorpo, dentroDoLimite, tentativas, adminConfigurado, senhaCorreta } from './_lib/http.js';
import { criarConvite, apagarConvite, listarConvites, listar, moderar } from './_lib/avaliacoes.js';

const MAX_ERROS = 8, BLOQUEIO = 15 * 60;

async function barrar(req, res) {
  if (!adminConfigurado()) return json(res, 503, { ok: false, code: 'admin_nao_configurado' }), true;
  if (!storeConfigurado()) return json(res, 503, { ok: false, code: 'store_nao_configurado' }), true;
  if ((await tentativas('admin-erro', req)) >= MAX_ERROS) return json(res, 429, { ok: false, code: 'muitas_tentativas' }), true;
  if (!senhaCorreta(req)) {
    await dentroDoLimite('admin-erro', req, MAX_ERROS, BLOQUEIO);
    await new Promise((r) => setTimeout(r, 600));
    return json(res, 401, { ok: false, code: 'senha_incorreta' }), true;
  }
  return false;
}

export default async function handler(req, res) {
  if (await barrar(req, res)) return;
  try {
    if (req.method === 'GET') {
      const [avaliacoes, convites] = await Promise.all([listar(), listarConvites()]);
      return json(res, 200, { ok: true, avaliacoes, convites });
    }
    if (req.method !== 'POST') return json(res, 405, { ok: false, code: 'metodo' });
    const b = await lerCorpo(req, 8000);
    switch (b.acao) {
      case 'convite': return json(res, 200, { ok: true, convite: await criarConvite(b) });
      case 'aprovar': case 'recusar': case 'pendente': case 'apagar': {
        const r = await moderar(b.id, b.acao);
        return r ? json(res, 200, { ok: true, avaliacao: r }) : json(res, 404, { ok: false, code: 'nao_encontrada' });
      }
      case 'apagar_convite': await apagarConvite(b.token); return json(res, 200, { ok: true });
      default: return json(res, 400, { ok: false, code: 'acao_desconhecida' });
    }
  } catch (e) {
    return json(res, 400, { ok: false, code: 'erro', mensagem: e instanceof Error ? e.message : 'Erro' });
  }
}
