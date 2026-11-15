// Testes da lógica pura da triagem e da origem.
// Rodar na raiz do repositório: node --test .testes/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../logica.js');

const NUM = { online: '5527999986102', vilaVelha: '5527997799099', vitoria: '5527995270307' };
const textoDoLink = (link) => decodeURIComponent(new URL(link).searchParams.get('text'));
const numeroDoLink = (link) => new URL(link).searchParams.get('phone');

test('origem pelo utm_source, sem diferenciar maiúsculas', () => {
  assert.equal(L.detectarOrigem('?utm_source=instagram', ''), 'Instagram');
  assert.equal(L.detectarOrigem('?utm_source=IG', ''), 'Instagram');
  assert.equal(L.detectarOrigem('?utm_source=fb', ''), 'Facebook');
  assert.equal(L.detectarOrigem('?utm_source=google', ''), 'Google');
  assert.equal(L.detectarOrigem('?utm_source=chatgpt.com', ''), 'ChatGPT');
  assert.equal(L.detectarOrigem('?utm_source=perplexity.ai', ''), 'Perplexity');
  assert.equal(L.detectarOrigem('?utm_source=claude.ai', ''), 'Claude');
});

test('utm_medium de anúncio vence o utm_source', () => {
  assert.equal(L.detectarOrigem('?utm_source=ig&utm_medium=cpc', ''), 'anúncio');
  assert.equal(L.detectarOrigem('?utm_source=meta&utm_medium=Paid', ''), 'anúncio');
});

test('outros meios pagos e clique de anúncio do Google contam como anúncio', () => {
  assert.equal(L.detectarOrigem('?utm_source=fb&utm_medium=paid_social', ''), 'anúncio');
  assert.equal(L.detectarOrigem('?utm_source=ig&utm_medium=cpm', ''), 'anúncio');
  assert.equal(L.detectarOrigem('?gclid=abc123', ''), 'anúncio');
  assert.equal(L.detectarOrigem('?gbraid=x', 'https://www.google.com/'), 'anúncio');
  assert.equal(L.detectarOrigem('?utm_source=instagram&utm_medium=social', ''), 'Instagram');
  assert.equal(L.detectarOrigem('?fbclid=abc', ''), '', 'fbclid aparece também em links orgânicos');
});

test('referrer de apps no Android', () => {
  assert.equal(L.detectarOrigem('', 'android-app://com.google.android.googlequicksearchbox/'), 'Google');
  assert.equal(L.detectarOrigem('', 'android-app://com.instagram.android'), 'Instagram');
  assert.equal(L.detectarOrigem('', 'android-app://com.facebook.katana/'), 'Facebook');
});

test('utm_source desconhecido ou ausente cai no referrer', () => {
  assert.equal(L.detectarOrigem('?utm_source=xyz', 'https://www.google.com/'), 'Google');
  assert.equal(L.detectarOrigem('', 'https://gemini.google.com/app'), 'Gemini');
  assert.equal(L.detectarOrigem('', 'https://l.instagram.com/'), 'Instagram');
  assert.equal(L.detectarOrigem('', 'https://m.facebook.com/'), 'Facebook');
  assert.equal(L.detectarOrigem('', 'https://copilot.microsoft.com/'), 'Bing');
  assert.equal(L.detectarOrigem('', 'https://chatgpt.com/'), 'ChatGPT');
  assert.equal(L.detectarOrigem('', 'https://claude.ai/chat/x'), 'Claude');
});

test('sem nada reconhecível a origem é vazia', () => {
  assert.equal(L.detectarOrigem('', ''), '');
  assert.equal(L.detectarOrigem('?utm_source=xyz', 'https://exemplo.com/'), '');
  assert.equal(L.detectarOrigem('', 'não é url'), '');
});

test('mensagem online completa', () => {
  const msg = L.montarMensagem({ local: 'online', motivo: 'bariatrica-pos', periodo: 'tarde' }, 'Instagram');
  assert.equal(msg, 'Olá, Brunelli! Vim pelo site (Instagram). Quero agendar uma consulta online. Motivo: pós-operatório de bariátrica. Prefiro horários à tarde.');
});

test('mensagem presencial completa sem origem', () => {
  const msg = L.montarMensagem({ local: 'vila-velha', motivo: 'compulsao', periodo: 'manha' }, '');
  assert.equal(msg, 'Olá! Vim pelo site da nutricionista Brunelli e quero agendar uma consulta presencial em Vila Velha. Motivo: relação com a comida e compulsão. Prefiro horários de manhã.');
});

test('outro motivo e tanto faz não entram na mensagem', () => {
  const msg = L.montarMensagem({ local: 'vitoria', motivo: 'outro', periodo: 'tanto-faz' }, 'anúncio');
  assert.equal(msg, 'Olá! Vim pelo site da nutricionista Brunelli (anúncio) e quero agendar uma consulta presencial em Vitória.');
});

test('estado vazio usa o modelo do online', () => {
  assert.equal(L.montarMensagem({}, ''), 'Olá, Brunelli! Vim pelo site. Quero agendar uma consulta online.');
});

test('texto do motivo de doença crônica e período noite', () => {
  const msg = L.montarMensagem({ local: 'online', motivo: 'cronicas', periodo: 'noite' }, '');
  assert.match(msg, / Motivo: doença crônica \(diabetes, pressão, colesterol ou outra\)\. Prefiro horários à noite\.$/);
});

test('link do WhatsApp usa o número de cada local', () => {
  assert.equal(numeroDoLink(L.linkWhatsApp({ local: 'online' }, '')), NUM.online);
  assert.equal(numeroDoLink(L.linkWhatsApp({}, '')), NUM.online);
  assert.equal(numeroDoLink(L.linkWhatsApp({ local: 'vila-velha' }, '')), NUM.vilaVelha);
  assert.equal(numeroDoLink(L.linkWhatsApp({ local: 'vitoria' }, '')), NUM.vitoria);
});

test('link do WhatsApp leva a mensagem codificada', () => {
  const estado = { local: 'vitoria', motivo: 'obesidade', periodo: 'manha' };
  const link = L.linkWhatsApp(estado, 'Google');
  assert.ok(link.startsWith('https://api.whatsapp.com/send?phone=' + NUM.vitoria + '&text='));
  assert.equal(textoDoLink(link), L.montarMensagem(estado, 'Google'));
});

test('passo inicial depende do que o gatilho já traz', () => {
  assert.equal(L.passoInicial(null, null), 'local');
  assert.equal(L.passoInicial('online', null), 'motivo');
  assert.equal(L.passoInicial('vitoria', 'obesidade'), 'periodo');
  assert.equal(L.passoInicial(null, 'compulsao'), 'local');
});

test('listas de motivos e locais cobrem as chaves do spec', () => {
  assert.deepEqual(Object.keys(L.MOTIVOS), ['bariatrica-pre', 'bariatrica-pos', 'obesidade', 'compulsao', 'cronicas', 'outro']);
  assert.deepEqual(Object.keys(L.LOCAIS), ['online', 'vila-velha', 'vitoria']);
  assert.deepEqual(Object.keys(L.PERIODOS), ['manha', 'tarde', 'noite', 'tanto-faz']);
});
