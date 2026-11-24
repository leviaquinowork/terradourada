// Função da Vercel: lê o calendário (iCal) de cada anúncio no Airbnb e devolve só as datas ocupadas.
// GET /api/disponibilidade?casa=casa-rosa  |  ?casa=chale-terra-dourada
// Configure na Vercel (Settings → Environment Variables):
//   ICAL_CASA_ROSA = link "Exportar calendário" do anúncio da Casa Rosa
//   ICAL_CHALE     = link "Exportar calendário" do anúncio do Chalé
// Nenhum dado de hóspede sai daqui: só pares [entrada, saída) no formato AAAA-MM-DD.

const FONTES = {
  'casa-rosa': 'ICAL_CASA_ROSA',
  'chale-terra-dourada': 'ICAL_CHALE'
};

const ymd = s => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

function somarDia(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return t.toISOString().slice(0, 10);
}

export function lerIcal(texto, hoje = new Date().toISOString().slice(0, 10)) {
  const linhas = texto.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const ocupado = [];
  let ini = null, fim = null, dentro = false;
  for (const l of linhas) {
    if (l === 'BEGIN:VEVENT') { dentro = true; ini = fim = null; continue; }
    if (l === 'END:VEVENT') {
      if (ini) {
        const a = ymd(ini), b = fim ? ymd(fim) : somarDia(ymd(ini));
        if (b > hoje && b > a) ocupado.push([a, b]);
      }
      dentro = false; continue;
    }
    if (!dentro) continue;
    const mi = l.match(/^DTSTART[^:]*:(\d{8})/); if (mi) ini = mi[1];
    const mf = l.match(/^DTEND[^:]*:(\d{8})/); if (mf) fim = mf[1];
  }
  return ocupado.sort((x, y) => x[0].localeCompare(y[0]));
}

export default async function handler(req, res) {
  const casa = String((req.query && req.query.casa) || '');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!FONTES[casa]) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, motivo: 'casa_invalida' }));
  }

  const url = process.env[FONTES[casa]];
  if (!url || !/^https:\/\/([a-z0-9-]+\.)*airbnb\.[a-z.]+\//i.test(url)) {
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.end(JSON.stringify({ ok: false, motivo: 'nao_configurado' }));
  }

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'TerraDourada-site/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const ocupado = lerIcal(await r.text());
    // Atualiza a cada 10 minutos no cache da Vercel
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.end(JSON.stringify({ ok: true, casa, ocupado, atualizado: new Date().toISOString() }));
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.end(JSON.stringify({ ok: false, motivo: 'falha_airbnb' }));
  }
}
