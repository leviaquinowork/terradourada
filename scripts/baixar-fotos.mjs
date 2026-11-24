// Baixa as fotos dos anúncios do Airbnb para a pasta img/ do site.
// Uso (na pasta do projeto):  node scripts/baixar-fotos.mjs
// Requer Node 18 ou mais novo. Gera, para cada foto, NN.jpg (1440px) e NN-720.jpg (720px).

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const miso = (id, f) => `https://a0.muscache.com/im/pictures/miso/Hosting-${id}/original/${f}.jpeg`;
const CR = '803740962310126110';
const CH = '803738197701849036';

// A ordem aqui define os nomes 01, 02, 03... e precisa bater com a ordem no index.html
const FOTOS = {
  'casa-rosa': [
    '2650b4d8-b0b6-4fd6-834a-275f95101402', 'a48e54d1-2bd6-40db-ad29-df41d9158bd5',
    'b328c6b0-9590-4582-960f-3128bd2500ab', 'c3c51d9b-2dca-4f84-aa4c-319ef45f4041',
    '664b6cc8-0606-402b-b60f-dbe243c9d1ec', '7bbac7a9-037a-4b37-8faa-b926dac430c2',
    'd8599b77-4e84-4ae9-984b-051d7ac8267c', '8cd25cf8-0ac0-45dc-9b6a-758c916fd3da',
    '04951e5b-bbef-4278-abac-ff614bf3f028', '26d3d210-7c01-470f-821e-e90346ea2a14'
  ].map(f => miso(CR, f)),
  chale: [
    '9a8e2ead-bfc6-46c8-b87b-3aceb165449f', '5c3e8d9c-78ed-4351-964c-43a52f243ea6',
    '11d167f1-b5c7-4a58-96ab-006047b43279', '491d44f8-3125-4249-81cd-57f3227e32b7',
    '24e56a71-6fba-43df-b09f-382b62de2739', '61c908f6-0e79-4f03-bc7c-180bb39b64d0'
  ].map(f => miso(CH, f)).concat([
    'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6ODAzNzM4MTk3NzAxODQ5MDM2/original/1d424b49-464f-4325-b546-ca6f2c76a2a7.jpeg'
  ])
};

const existe = async p => { try { return (await stat(p)).size > 0; } catch { return false; } };

async function baixar(url, destino) {
  if (await existe(destino)) return 'já existe';
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      await writeFile(destino, Buffer.from(await r.arrayBuffer()));
      return 'ok';
    } catch (e) {
      if (tentativa === 3) throw e;
      await new Promise(res => setTimeout(res, 800 * tentativa));
    }
  }
}

let ok = 0, falhas = 0;
for (const [pasta, urls] of Object.entries(FOTOS)) {
  const dir = join(raiz, 'img', pasta);
  await mkdir(dir, { recursive: true });
  for (const [i, url] of urls.entries()) {
    const nn = String(i + 1).padStart(2, '0');
    for (const [w, sufixo] of [[1440, ''], [720, '-720']]) {
      const arquivo = join(dir, `${nn}${sufixo}.jpg`);
      try {
        const st = await baixar(`${url}?im_w=${w}`, arquivo);
        console.log(`✓ img/${pasta}/${nn}${sufixo}.jpg (${st})`);
        ok++;
      } catch (e) {
        console.error(`✗ img/${pasta}/${nn}${sufixo}.jpg — ${e.message}`);
        falhas++;
      }
    }
  }
}
console.log(`\n${ok} arquivos prontos, ${falhas} falhas.`);
if (falhas) process.exitCode = 1;
