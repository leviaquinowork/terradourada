// Avaliações enviadas pelo site.
// 1. A equipe gera um CONVITE no painel (/admin) para um hóspede de uma das casas → link único /avaliar?convite=XXXX
// 2. O hóspede abre o link e envia a avaliação (cada convite vale uma vez).
// 3. A avaliação fica PENDENTE até a equipe aprovar. Só aparecem no site as aprovadas
//    e com autorização de publicação do hóspede. O texto é sempre o do hóspede.
import { randomBytes } from 'node:crypto';
import { store } from './store.js';

const K_AV = 'terradourada:avaliacoes';
const K_CV = 'terradourada:convites';

export const CASAS = { 'casa-rosa': 'Casa Rosa', 'chale-terra-dourada': 'Chalé Terra Dourada' };
export const LIMITES = { nome: 40, cidade: 40, textoMin: 20, textoMax: 1200 };

export const novoToken = (n = 9) => randomBytes(n).toString('base64url');

export function limpar(v, max, multilinha = false) {
  if (typeof v !== 'string') return '';
  let s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = multilinha ? s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;
export function mesValido(v, agora = new Date()) {
  const m = MES.exec(v || '');
  if (!m) return false;
  const idx = Number(m[1]) * 12 + Number(m[2]) - 1;
  return Number(m[1]) >= 2020 && idx <= agora.getFullYear() * 12 + agora.getMonth() + 1;
}

export function validar(e, agora = new Date()) {
  const erros = {};
  const nome = limpar(e.nome, LIMITES.nome);
  const cidade = limpar(e.cidade, LIMITES.cidade);
  const mes = typeof e.mes === 'string' ? e.mes : '';
  const nota = Number(e.nota);
  const texto = limpar(e.texto, LIMITES.textoMax, true);
  if (nome.length < 2) erros.nome = 'Informe como você quer aparecer (ex.: Ana ou Ana S.).';
  if (!mesValido(mes, agora)) erros.mes = 'Escolha o mês da sua estadia.';
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) erros.nota = 'Escolha uma nota de 1 a 5 estrelas.';
  if (texto.length < LIMITES.textoMin) erros.texto = `Conte um pouco mais (mínimo de ${LIMITES.textoMin} caracteres).`;
  if (e.privacidade !== true) erros.privacidade = 'É preciso aceitar a política de privacidade para enviar.';
  const spam = typeof e.website === 'string' && e.website.trim() !== '';
  return { ok: !Object.keys(erros).length, spam, erros, valor: { nome, cidade, mes, nota, texto, publicar: e.publicar === true } };
}

/* Convites */
export async function criarConvite({ casa, nome, mes }, agora = new Date()) {
  if (!CASAS[casa]) throw new Error('Escolha a hospedagem do hóspede.');
  const cv = { token: novoToken(), casa, nome: limpar(nome, LIMITES.nome), mes: mesValido(mes, agora) ? mes : '', criadoEm: agora.toISOString() };
  await store().hset(K_CV, cv.token, JSON.stringify(cv));
  return cv;
}
export async function lerConvite(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{8,40}$/.test(token)) return null;
  const raw = await store().hget(K_CV, token);
  return raw ? JSON.parse(raw) : null;
}
export const apagarConvite = (t) => store().hdel(K_CV, String(t || ''));
export async function listarConvites() {
  return Object.values(await store().hgetall(K_CV)).map((v) => JSON.parse(v)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/* Avaliações */
export async function enviar(token, entrada, agora = new Date()) {
  const cv = await lerConvite(token);
  if (!cv) return { ok: false, code: 'convite_invalido' };
  if (cv.usadoEm) return { ok: false, code: 'convite_usado' };
  const v = validar(entrada, agora);
  if (v.spam) return { ok: false, code: 'spam' };
  if (!v.ok) return { ok: false, code: 'dados_invalidos', erros: v.erros };
  const av = { id: novoToken(8), convite: cv.token, casa: cv.casa, ...v.valor, status: 'pendente', criadoEm: agora.toISOString() };
  const s = store();
  await s.hset(K_AV, av.id, JSON.stringify(av));
  await s.hset(K_CV, cv.token, JSON.stringify({ ...cv, usadoEm: agora.toISOString(), avaliacao: av.id }));
  return { ok: true, avaliacao: av };
}

export async function listar() {
  return Object.values(await store().hgetall(K_AV)).map((v) => JSON.parse(v)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function publicas() {
  return (await listar())
    .filter((a) => a.status === 'aprovada' && a.publicar)
    .map(({ id, casa, nome, cidade, mes, nota, texto }) => ({ id, casa, nome, cidade, mes, nota, texto }));
}

export async function moderar(id, acao, agora = new Date()) {
  const s = store();
  const raw = await s.hget(K_AV, String(id || ''));
  if (!raw) return null;
  if (acao === 'apagar') { await s.hdel(K_AV, id); return { id, apagada: true }; }
  const av = JSON.parse(raw);
  if (acao === 'aprovar' && !av.publicar) throw new Error('O hóspede não autorizou a publicação desta avaliação.');
  const status = { aprovar: 'aprovada', recusar: 'recusada', pendente: 'pendente' }[acao];
  if (!status) throw new Error('Ação desconhecida.');
  const novo = { ...av, status, moderadoEm: agora.toISOString() };
  await s.hset(K_AV, id, JSON.stringify(novo));
  return novo;
}
