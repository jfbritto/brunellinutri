// Testes de ponta a ponta da página (triagem, gatilhos, barra fixa, abas, sem JS).
// Uso, na raiz do repositório:
//   PLAYWRIGHT_DIR=/caminho/para/node_modules node .testes/triagem.cjs
// PLAYWRIGHT_DIR é a pasta node_modules onde o pacote "playwright" está instalado.
const path = require('node:path');
const net = require('node:net');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

if (!process.env.PLAYWRIGHT_DIR) {
  console.error('Defina PLAYWRIGHT_DIR (pasta node_modules com o playwright).');
  process.exit(2);
}
const { chromium } = require(path.join(process.env.PLAYWRIGHT_DIR, 'playwright'));
const L = require('../logica.js');

const RAIZ = path.resolve(__dirname, '..');
const TELA = { width: 390, height: 664 };

function portaLivre() {
  return new Promise((ok, erro) => {
    const s = net.createServer();
    s.once('error', erro);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); });
  });
}

async function subirServidor() {
  const porta = await portaLivre();
  const proc = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
  const base = `http://127.0.0.1:${porta}`;
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(base + '/'); if (r.ok) return { proc, base }; } catch (e) { /* ainda subindo */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error('servidor local não subiu');
}

const casos = [];
const caso = (nome, fn, opcoes = {}) => casos.push({ nome, fn, opcoes });

// --- utilitários de página ---
const passoVisivel = (page) => page.$eval('#triagem section[data-passo]:not([hidden])', (el) => el.dataset.passo);
const triagemAberta = (page) => page.$eval('#triagem', (d) => d.open);
async function abrirPor(page, seletor) {
  await page.locator(seletor).first().scrollIntoViewIfNeeded();
  await page.locator(seletor).first().click();
  await page.waitForFunction(() => document.getElementById('triagem').open);
}
async function escolher(page, tipo, valor) {
  await page.click(`#triagem [data-escolha="${tipo}"][data-valor="${valor}"]`);
}
async function fechar(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('triagem').open);
}
async function abrirPorta(page, motivo) {
  const porta = page.locator(`details.porta:has([data-motivo="${motivo}"])`);
  await porta.locator('summary').scrollIntoViewIfNeeded();
  await porta.locator('summary').click();
}

// --- casos ---
caso('passo inicial depende do gatilho', async (page) => {
  await abrirPor(page, '.topo-botoes [data-local="online"]');
  assert.equal(await passoVisivel(page), 'motivo', 'topo online');
  await fechar(page);

  await abrirPor(page, '.topo-botoes [data-local="vila-velha"]');
  assert.equal(await passoVisivel(page), 'motivo', 'topo Vila Velha');
  await fechar(page);

  await abrirPorta(page, 'compulsao');
  await abrirPor(page, '[data-motivo="compulsao"]');
  assert.equal(await passoVisivel(page), 'local', 'cartão compulsão');
  await fechar(page);

  await abrirPorta(page, 'bariatrica-pos');
  await abrirPor(page, '[data-motivo="bariatrica-pos"]');
  assert.equal(await passoVisivel(page), 'local', 'botão Já operei');
  await fechar(page);

  await page.locator('#aba-vitoria').scrollIntoViewIfNeeded();
  await page.click('#aba-vitoria');
  await abrirPor(page, '#painel-vitoria [data-triagem]');
  assert.equal(await passoVisivel(page), 'motivo', 'aba Vitória');
  await fechar(page);

  await abrirPor(page, '#agendar [data-triagem]');
  assert.equal(await passoVisivel(page), 'local', 'chamada final');
  await fechar(page);
});

caso('barra fixa: escondida no topo, aparece depois e abre a triagem no passo local', async (page) => {
  assert.equal(await page.locator('.barra-fixa').isVisible(), false, 'visível no topo');
  await page.locator('#sobre').scrollIntoViewIfNeeded();
  await page.locator('.barra-fixa.visivel').waitFor({ state: 'visible', timeout: 3000 });
  await page.click('.barra-fixa .barra-agendar');
  await page.waitForFunction(() => document.getElementById('triagem').open);
  assert.equal(await passoVisivel(page), 'local');
  await fechar(page);
  await page.locator('#agendar').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.barra-fixa').classList.contains('visivel'), null, { timeout: 3000 });
});

caso('percurso online, pós-operatório, tarde, vindo do Instagram', async (page) => {
  await abrirPor(page, '.topo-botoes [data-local="online"]');
  await escolher(page, 'motivo', 'bariatrica-pos');
  assert.equal(await passoVisivel(page), 'periodo');
  await escolher(page, 'periodo', 'tarde');
  assert.equal(await passoVisivel(page), 'resumo');
  const estado = { local: 'online', motivo: 'bariatrica-pos', periodo: 'tarde' };
  assert.equal(await page.getAttribute('#triagem-abrir', 'href'), L.linkWhatsApp(estado, 'Instagram'));
  assert.equal((await page.textContent('#triagem-previa')).trim(), L.montarMensagem(estado, 'Instagram'));
  assert.equal(await page.locator('#triagem-pular').isVisible(), false, 'pular visível no resumo');
}, { busca: '?utm_source=instagram' });

caso('percurso Vitória, doença crônica, noite, vindo de anúncio', async (page) => {
  await abrirPor(page, '#agendar [data-triagem]');
  await escolher(page, 'local', 'vitoria');
  await escolher(page, 'motivo', 'cronicas');
  await escolher(page, 'periodo', 'noite');
  const href = await page.getAttribute('#triagem-abrir', 'href');
  assert.equal(href, L.linkWhatsApp({ local: 'vitoria', motivo: 'cronicas', periodo: 'noite' }, 'anúncio'));
  assert.match(href, /phone=5527995270307/);
}, { busca: '?utm_source=meta&utm_medium=cpc' });

caso('motivo vindo do cartão entra na mensagem', async (page) => {
  await abrirPorta(page, 'obesidade');
  await abrirPor(page, '[data-motivo="obesidade"]');
  await escolher(page, 'local', 'online');
  assert.equal(await passoVisivel(page), 'periodo', 'pula o motivo já marcado');
  await escolher(page, 'periodo', 'tanto-faz');
  assert.equal(await page.getAttribute('#triagem-abrir', 'href'), L.linkWhatsApp({ local: 'online', motivo: 'obesidade', periodo: 'tanto-faz' }, ''));
});

caso('pular e falar direto usa o que já foi escolhido', async (page) => {
  await abrirPor(page, '#agendar [data-triagem]');
  assert.equal(await page.getAttribute('#triagem-pular', 'href'), L.linkWhatsApp({}, ''), 'no passo local');
  await escolher(page, 'local', 'vila-velha');
  const href = await page.getAttribute('#triagem-pular', 'href');
  assert.equal(href, L.linkWhatsApp({ local: 'vila-velha' }, ''), 'no passo motivo');
  assert.doesNotMatch(decodeURIComponent(href), /Motivo/);
  await escolher(page, 'motivo', 'compulsao');
  assert.equal(await page.getAttribute('#triagem-pular', 'href'), L.linkWhatsApp({ local: 'vila-velha', motivo: 'compulsao' }, ''), 'no passo período');
});

caso('voltar retorna ao passo anterior e reabrir recomeça do zero', async (page) => {
  await abrirPor(page, '#agendar [data-triagem]');
  await escolher(page, 'local', 'online');
  assert.equal(await passoVisivel(page), 'motivo');
  await page.click('#triagem-voltar');
  assert.equal(await passoVisivel(page), 'local');
  await escolher(page, 'local', 'vitoria');
  await fechar(page);
  await abrirPor(page, '#agendar [data-triagem]');
  assert.equal(await passoVisivel(page), 'local');
  assert.equal(await page.getAttribute('#triagem-pular', 'href'), L.linkWhatsApp({}, ''));
});

caso('Esc fecha e devolve o foco ao botão que abriu', async (page) => {
  await abrirPor(page, '#agendar [data-triagem]');
  await fechar(page);
  assert.equal(await triagemAberta(page), false);
  assert.ok(await page.evaluate(() => document.activeElement === document.querySelector('#agendar [data-triagem]')));
});

caso('origem fica guardada durante a visita', async (page, base) => {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await abrirPor(page, '.topo-botoes [data-local="online"]');
  await page.click('#triagem-voltar').catch(() => {});
  assert.match(decodeURIComponent(await page.getAttribute('#triagem-pular', 'href')), /Vim pelo site \(Instagram\)/);
}, { busca: '?utm_source=instagram' });

caso('abas mudam com clique e com as setas do teclado', async (page) => {
  await page.locator('#aba-online').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#painel-online').isVisible(), true);
  assert.equal(await page.locator('#painel-vila-velha').isVisible(), false);
  await page.focus('#aba-online');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getAttribute('#aba-vila-velha', 'aria-selected'), 'true');
  assert.equal(await page.locator('#painel-vila-velha').isVisible(), true);
  assert.equal(await page.locator('#painel-online').isVisible(), false);
});

caso('linha de escolhas mostra o que já foi marcado, inclusive pelo cartão', async (page) => {
  await abrirPorta(page, 'bariatrica-pos');
  await abrirPor(page, '[data-motivo="bariatrica-pos"]');
  assert.match(await page.textContent('#triagem-escolhas'), /Pós-operatório de bariátrica/);
  await escolher(page, 'local', 'vitoria');
  assert.match(await page.textContent('#triagem-escolhas'), /Presencial em Vitória/);
  await escolher(page, 'periodo', 'manha');
  assert.equal(await page.locator('#triagem-escolhas').isVisible(), false, 'no resumo a prévia já mostra tudo');
  assert.equal(await page.locator('#triagem [aria-pressed]').count(), 0, 'opções não são botões de alternância');
});

caso('arrastar a seleção até o fundo não fecha; tocar no fundo fecha', async (page) => {
  await abrirPor(page, '.topo-botoes [data-local="online"]');
  await escolher(page, 'motivo', 'obesidade');
  await escolher(page, 'periodo', 'tarde');
  const caixa = await page.locator('#triagem-previa').boundingBox();
  await page.mouse.move(caixa.x + 20, caixa.y + 10);
  await page.mouse.down();
  await page.mouse.move(195, 15, { steps: 5 });
  await page.mouse.up();
  assert.equal(await triagemAberta(page), true, 'fechou ao arrastar seleção');
  await page.mouse.click(195, 15);
  await page.waitForFunction(() => !document.getElementById('triagem').open, null, { timeout: 2000 });
});

caso('h1 traz o nome e a função', async (page) => {
  const h1 = await page.textContent('h1');
  assert.match(h1, /Brunelli Sperandio Busteke/);
  assert.match(h1, /Nutricionista clínica/);
});

caso('podcast só carrega o player ao tocar', async (page) => {
  assert.equal(await page.locator('.podcast-player iframe').count(), 0);
  await page.locator('.podcast-play').scrollIntoViewIfNeeded();
  await page.click('.podcast-play');
  const src = await page.getAttribute('.podcast-player iframe', 'src');
  assert.match(src, /^https:\/\/open\.spotify\.com\/embed\/show\/033SN7ucA2Patif4AUXLyZ/);
});

caso('primeira tela: título e os três botões inteiros a 390x664', async (page) => {
  for (const sel of ['h1', '.topo-botoes [data-local="online"]', '.topo-botoes [data-local="vila-velha"]', '.topo-botoes [data-local="vitoria"]']) {
    const box = await page.locator(sel).boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= TELA.height, `${sel} fora da primeira tela: ${JSON.stringify(box)}`);
  }
});

caso('sem JavaScript os links levam ao WhatsApp certo', async (page) => {
  const hrefs = await page.$$eval('[data-triagem]', (els) => els.map((a) => ({ local: a.dataset.local || '', href: a.getAttribute('href') })));
  assert.ok(hrefs.length >= 10, 'poucos gatilhos: ' + hrefs.length);
  for (const { local, href } of hrefs) {
    const esperado = local === 'vila-velha' ? '5527997799099' : local === 'vitoria' ? '5527995270307' : '5527999986102';
    assert.ok(href.includes('phone=' + esperado), `${local || 'sem local'} → ${href}`);
  }
  assert.equal(await page.locator('.barra-fixa').isVisible(), false, 'barra fixa sem JS');
  assert.equal(await page.locator('#painel-vila-velha').isVisible(), true, 'painéis empilhados sem JS');
}, { semJs: true });

// --- execução ---
(async () => {
  const { proc, base } = await subirServidor();
  const browser = await chromium.launch();
  let falhas = 0;
  try {
    for (const { nome, fn, opcoes } of casos) {
      const ctx = await browser.newContext({ viewport: TELA, javaScriptEnabled: !opcoes.semJs, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const erros = [];
      page.on('pageerror', (e) => erros.push(e.message));
      await page.route('**/api.whatsapp.com/**', (r) => r.abort());
      await page.route('**/open.spotify.com/**', (r) => r.abort());
      try {
        await page.goto(base + '/' + (opcoes.busca || ''), { waitUntil: 'networkidle' });
        await fn(page, base);
        assert.deepEqual(erros, [], 'erros de JavaScript na página');
        console.log('✔', nome);
      } catch (e) {
        falhas++;
        console.log('✖', nome, '\n   ', (e.message || String(e)).split('\n')[0]);
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    proc.kill();
  }
  console.log(`\n${casos.length - falhas}/${casos.length} passaram`);
  process.exit(falhas ? 1 : 0);
})();
