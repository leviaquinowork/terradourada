# Terra Dourada Brasília — Landing page

Site de página única para reservas diretas da **Casa Rosa** e do **Chalé Terra Dourada**, com consulta de disponibilidade enviada pelo WhatsApp.
HTML, CSS e JavaScript puros: não precisa de build nem de `npm install`.

## Estrutura

```
index.html                 página completa (estilos e scripts embutidos)
admin.html                 painel da equipe (/admin): links de avaliação e moderação
avaliar.html               formulário que o hóspede recebe (/avaliar?convite=…)
privacidade.html           política de privacidade (/privacidade)
api/                       funções da Vercel: disponibilidade, avaliações, convite, admin
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

O script cria `img/casa-rosa/` e `img/chale/` com 35 arquivos (17 fotos em dois tamanhos + a foto da abertura em alta resolução) e mostra `35 arquivos prontos, 0 falhas` no final.
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

## Calendário sincronizado com o Airbnb

A consulta de disponibilidade mostra um calendário. Os dias já reservados no Airbnb aparecem riscados e não podem ser escolhidos.
Quem faz isso é a função `api/disponibilidade.js`, que roda na própria Vercel e lê o calendário de cada anúncio.

Para ativar:

1. No Airbnb (conta da anfitriã): **Anúncios → escolha o anúncio → Calendário → Disponibilidade → Sincronizar calendários → Exportar calendário**. Copie o link (termina em `.ics`).
2. Faça isso para os dois anúncios.
3. Na Vercel: **Project → Settings → Environment Variables** e crie:
   - `ICAL_CASA_ROSA` = link da Casa Rosa
   - `ICAL_CHALE` = link do Chalé
4. Vá em **Deployments → ⋯ → Redeploy** para aplicar.

O calendário atualiza a cada 10 minutos. Enquanto as variáveis não forem criadas, o calendário funciona normalmente, sem dias riscados, com o aviso de que a equipe confirma a disponibilidade no WhatsApp.

Importante: reservas fechadas direto pelo WhatsApp precisam ser **bloqueadas no calendário do Airbnb**, para não aparecerem livres no site nem serem vendidas duas vezes.

## Avaliações

São as avaliações reais dos anúncios no Airbnb, copiadas em 24/11/2026. Para atualizar notas ou trocar depoimentos, edite `REVIEWS` no script do `index.html`.

## Avaliações pelo site (painel da equipe)

Funciona igual ao da Casa Mahalo:

1. Depois do check-out, a equipe abre **/admin**, escolhe a casa (Casa Rosa ou Chalé), coloca o nome do hóspede e gera o link.
2. Envia pelo botão **Enviar pelo WhatsApp**, que já abre a mensagem pronta (com o número do hóspede, se for informado).
3. O hóspede abre **/avaliar?convite=…**, dá a nota e escreve. Cada link vale uma vez.
4. A avaliação chega em **Pendentes** no painel. Ela só aparece no site depois de **Publicar no site**, e só se o hóspede autorizou.
5. As publicadas aparecem na seção Avaliações da casa certa, antes das avaliações do Airbnb.

### Configurar na Vercel (uma vez)

1. **Storage → Create Database → Upstash (Redis)** → crie (plano gratuito) e conecte ao projeto. As variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` são criadas sozinhas.
2. **Settings → Environment Variables** → crie `ADMIN_PASSWORD` com uma senha forte (mínimo 10 caracteres).
3. **Deployments → ⋯ → Redeploy.**

Segurança: o painel bloqueia por 15 minutos depois de 8 senhas erradas, o envio de avaliações tem limite de tentativas e filtro anti-robô, e os textos dos hóspedes nunca são interpretados como código.

Política de privacidade em **/privacidade** (o formulário pede aceite).

## Vídeos do Instagram

1. Salve os vídeos (Reels) em `video/` com nomes simples: `reel-1.mp4`, `reel-2.mp4`…
2. No `CFG` do `index.html`, preencha `reels`:
   ```js
   reels: [
     { src: 'video/reel-1.mp4', poster: 'video/reel-1.jpg', casa: 'casa-rosa', titulo: 'Pôr do sol na Casa Rosa' },
     { src: 'video/reel-2.mp4', poster: 'video/reel-2.jpg', casa: 'chale-terra-dourada', titulo: 'Manhã no Chalé' }
   ]
   ```
Sem vídeos configurados, a seção mostra fotos com link para o Instagram.

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
