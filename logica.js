/* Lógica pura da triagem e da origem do visitante.
   Sem DOM: roda no navegador (window.Logica) e no Node (testes em .testes/). */
(function (raiz) {
  'use strict';

  var LOCAIS = {
    'online': { rotulo: 'Consulta online', numero: '5527999986102' },
    'vila-velha': { rotulo: 'Presencial em Vila Velha', cidade: 'Vila Velha', numero: '5527997799099' },
    'vitoria': { rotulo: 'Presencial em Vitória', cidade: 'Vitória', numero: '5527995270307' }
  };

  var MOTIVOS = {
    'bariatrica-pre': { rotulo: 'Pré-operatório de bariátrica', mensagem: 'pré-operatório de bariátrica' },
    'bariatrica-pos': { rotulo: 'Pós-operatório de bariátrica', mensagem: 'pós-operatório de bariátrica' },
    'obesidade': { rotulo: 'Obesidade e emagrecimento', mensagem: 'obesidade e emagrecimento' },
    'compulsao': { rotulo: 'Relação com a comida e compulsão', mensagem: 'relação com a comida e compulsão' },
    'cronicas': { rotulo: 'Diabetes, pressão, colesterol ou outra doença crônica', mensagem: 'doença crônica (diabetes, pressão, colesterol ou outra)' },
    'outro': { rotulo: 'Outro motivo', mensagem: '' }
  };

  var PERIODOS = {
    'manha': { rotulo: 'Manhã', mensagem: 'de manhã' },
    'tarde': { rotulo: 'Tarde', mensagem: 'à tarde' },
    'noite': { rotulo: 'Noite', mensagem: 'à noite' },
    'tanto-faz': { rotulo: 'Tanto faz', mensagem: '' }
  };

  var MEIOS_PAGOS = ['cpc', 'paid', 'ads', 'anuncio'];

  var FONTES = {
    'instagram': 'Instagram', 'ig': 'Instagram',
    'facebook': 'Facebook', 'fb': 'Facebook',
    'google': 'Google',
    'chatgpt.com': 'ChatGPT', 'chatgpt': 'ChatGPT', 'openai': 'ChatGPT',
    'perplexity': 'Perplexity', 'perplexity.ai': 'Perplexity',
    'gemini': 'Gemini',
    'copilot': 'Bing', 'bing': 'Bing',
    'claude': 'Claude', 'claude.ai': 'Claude'
  };

  // Ordem importa: gemini.google.com antes de google.
  var REFERENCIAS = [
    [/(^|\.)gemini\.google\./, 'Gemini'],
    [/(^|\.)instagram\.com$/, 'Instagram'],
    [/(^|\.)facebook\.com$/, 'Facebook'],
    [/(^|\.)google\./, 'Google'],
    [/(^|\.)(copilot\.microsoft\.com|bing\.com)$/, 'Bing'],
    [/(^|\.)chatgpt\.com$/, 'ChatGPT'],
    [/(^|\.)perplexity\.ai$/, 'Perplexity'],
    [/(^|\.)claude\.ai$/, 'Claude']
  ];

  function parametro(busca, nome) {
    var m = new RegExp('[?&]' + nome + '=([^&#]*)', 'i').exec(busca || '');
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().toLowerCase(); }
    catch (e) { return m[1].toLowerCase(); }
  }

  function dominio(url) {
    var m = /^https?:\/\/([^/:?#]+)/i.exec(url || '');
    return m ? m[1].toLowerCase() : '';
  }

  function detectarOrigem(busca, referrer) {
    if (MEIOS_PAGOS.indexOf(parametro(busca, 'utm_medium')) !== -1) return 'anúncio';
    var fonte = FONTES[parametro(busca, 'utm_source')];
    if (fonte) return fonte;
    var host = dominio(referrer);
    for (var i = 0; host && i < REFERENCIAS.length; i++) {
      if (REFERENCIAS[i][0].test(host)) return REFERENCIAS[i][1];
    }
    return '';
  }

  function montarMensagem(estado, origem) {
    estado = estado || {};
    var sufixo = origem ? ' (' + origem + ')' : '';
    var local = LOCAIS[estado.local] ? estado.local : 'online';
    var texto = local === 'online'
      ? 'Olá, Brunelli! Vim pelo site' + sufixo + '. Quero agendar uma consulta online.'
      : 'Olá! Vim pelo site da nutricionista Brunelli' + sufixo + ' e quero agendar uma consulta presencial em ' + LOCAIS[local].cidade + '.';
    var motivo = MOTIVOS[estado.motivo];
    if (motivo && motivo.mensagem) texto += ' Motivo: ' + motivo.mensagem + '.';
    var periodo = PERIODOS[estado.periodo];
    if (periodo && periodo.mensagem) texto += ' Prefiro horários ' + periodo.mensagem + '.';
    return texto;
  }

  function linkWhatsApp(estado, origem) {
    estado = estado || {};
    var local = LOCAIS[estado.local] ? estado.local : 'online';
    return 'https://api.whatsapp.com/send?phone=' + LOCAIS[local].numero +
      '&text=' + encodeURIComponent(montarMensagem(estado, origem));
  }

  function passoInicial(local, motivo) {
    if (!LOCAIS[local]) return 'local';
    if (!MOTIVOS[motivo]) return 'motivo';
    return 'periodo';
  }

  var api = {
    LOCAIS: LOCAIS, MOTIVOS: MOTIVOS, PERIODOS: PERIODOS,
    detectarOrigem: detectarOrigem, montarMensagem: montarMensagem,
    linkWhatsApp: linkWhatsApp, passoInicial: passoInicial
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Logica = api;
})(this);
