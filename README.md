# Terra Dourada Brasília — Landing page

Site de página única para reservas diretas da **Casa Rosa** e do **Chalé Terra Dourada**, com consulta de disponibilidade enviada pelo WhatsApp.
HTML, CSS e JavaScript puros: não precisa de build nem de `npm install`.

## Estrutura

```
index.html                 página completa (estilos e scripts embutidos)
img/casa-rosa/             fotos da Casa Rosa (01.jpg … 10.jpg + versões -720)
img/chale/                 fotos do Chalé (01.jpg … 07.jpg + versões -720)
scripts/baixar-fotos.mjs   baixa as fotos dos anúncios do Airbnb para img/
favicon.svg, robots.txt, sitemap.xml, vercel.json
```

## 1. Baixar as fotos (uma vez)

Na pasta do projeto, com Node 18 ou mais novo:

```bash
node scripts/baixar-fotos.mjs
```

O script cria `img/casa-rosa/` e `img/chale/` com 34 arquivos (17 fotos em dois tamanhos) e mostra `34 arquivos prontos, 0 falhas` no final.
Se alguma foto faltar, o site usa automaticamente a mesma foto direto do Airbnb, então nada quebra.

Para trocar por fotos originais em melhor qualidade, basta substituir os arquivos mantendo os mesmos nomes.

## 2. Ver no computador

Abra o `index.html` no navegador, ou rode `npm run dev` e acesse o endereço mostrado.

## 3. Subir para o GitHub

```bash
git init
git add .
git commit -m "Landing page Terra Dourada Brasília"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/terra-dourada-brasilia.git
git push -u origin main
```

Confira se a pasta `img/` foi junto no commit (`git status` não deve listar nada pendente).

## 4. Publicar na Vercel

1. vercel.com → **Add New → Project** → importe o repositório.
2. Framework Preset: **Other**. Build Command e Output Directory: deixe vazios.
3. **Deploy**. Cada novo `git push` publica sozinho.
4. Domínio próprio: Project → Settings → Domains.

## O que configurar (topo do `<script>` no fim do index.html)

```js
const CFG = {
  whatsapp: '',     // ex.: '5561999999999' (DDI + DDD + número, só dígitos)
  ga4: '',          // ex.: 'G-XXXXXXXXXX'
  metaPixel: '',    // ex.: '123456789012345'
  video: ''         // opcional: caminho de um vídeo real, ex.: 'video/passeio.mp4'
};
```

Quando o domínio for definido, troque `www.terradouradabrasilia.com.br` em `index.html` (canonical e og:image), `robots.txt` e `sitemap.xml`.

## Pendências com a proprietária

Os itens marcados com `[CONFIRMAR]` no FAQ do `index.html`:

- Formas de pagamento da reserva direta
- Política de cancelamento da reserva direta
- Se a Casa Rosa aceita pets

Também faltam o número de WhatsApp, o domínio e, se houver, vídeos das casas.

## Links individuais

- Casa Rosa: `/#casa-rosa`
- Chalé: `/#chale-terra-dourada`

Abrem a página já com os detalhes da hospedagem. Bons para a bio e os stories do Instagram.

## Eventos de rastreamento

Enviados ao `dataLayer`, ao GA4 e ao Pixel (quando configurados): `whatsapp_click` (com origem, hospedagem, hóspedes e noites), `abrir_consulta` e `ver_hospedagem`.
