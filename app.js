/* Comportamento da página: triagem do WhatsApp, abas, barra fixa, cabeçalho,
   revelação ao rolar e player do podcast. A lógica pura fica em logica.js.
   Sem JavaScript, todo botão de agendar continua sendo um link de WhatsApp. */
(function () {
  'use strict';

  const doc = document;
  const L = window.Logica;
  doc.documentElement.classList.add('js');

  // Cada recurso roda isolado: um erro num não derruba os outros.
  function seguro(nome, fn) {
    try { fn(); } catch (e) { console.error('[' + nome + ']', e); }
  }

  // ---------- Revelação ao rolar (primeiro, para nada ficar invisível) ----------
  seguro('revelar', () => {
    const itens = doc.querySelectorAll('.revelar');
    const reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzir || !('IntersectionObserver' in window)) {
      itens.forEach((el) => el.classList.add('revelado'));
      return;
    }
    const io = new IntersectionObserver((entradas, obs) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('revelado'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    itens.forEach((el) => io.observe(el));
  });

  // ---------- Origem do visitante (guardada na visita) ----------
  const CHAVE_ORIGEM = 'brunelli-origem';
  let origem = '';
  seguro('origem', () => {
    if (!L) return;
    try { origem = sessionStorage.getItem(CHAVE_ORIGEM) || ''; } catch (e) { /* armazenamento bloqueado */ }
    const detectada = L.detectarOrigem(location.search, doc.referrer);
    if (detectada) {
      origem = detectada;
      try { sessionStorage.setItem(CHAVE_ORIGEM, origem); } catch (e) { /* segue só na memória */ }
    }
  });

  // ---------- Triagem ----------
  seguro('triagem', () => {
    const dialogo = doc.getElementById('triagem');
    if (!L || !dialogo || typeof dialogo.showModal !== 'function') return; // links seguem nativos

    const ORDEM = ['local', 'motivo', 'periodo', 'resumo'];
    const passos = {};
    dialogo.querySelectorAll('section[data-passo]').forEach((s) => { passos[s.dataset.passo] = s; });
    const voltar = doc.getElementById('triagem-voltar');
    const fechar = doc.getElementById('triagem-fechar');
    const pular = doc.getElementById('triagem-pular');
    const abrirWhats = doc.getElementById('triagem-abrir');
    const previa = doc.getElementById('triagem-previa');
    const escolhas = doc.getElementById('triagem-escolhas');
    const rodape = pular.closest('.triagem-rodape');
    const barras = dialogo.querySelectorAll('.triagem-progresso span');

    let estado = {};
    let historico = [];
    let atual = 'local';
    let gatilho = null;

    function proximoPasso() {
      if (!estado.local) return 'local';
      if (!estado.motivo) return 'motivo';
      if (!estado.periodo) return 'periodo';
      return 'resumo';
    }

    function mostrar(passo) {
      atual = passo;
      Object.keys(passos).forEach((k) => { passos[k].hidden = k !== passo; });

      if (historico.length) voltar.removeAttribute('data-oculto');
      else voltar.setAttribute('data-oculto', '');

      const indice = ORDEM.indexOf(passo);
      barras.forEach((b, i) => b.classList.toggle('feito', i <= indice));

      pular.href = L.linkWhatsApp(estado, origem);
      if (passo === 'resumo') {
        rodape.setAttribute('data-oculto', '');
        previa.textContent = L.montarMensagem(estado, origem);
        abrirWhats.href = L.linkWhatsApp(estado, origem);
      } else {
        rodape.removeAttribute('data-oculto');
      }

      // O que já foi escolhido (inclusive o motivo vindo do cartão) fica à vista.
      const marcados = [
        L.LOCAIS[estado.local] && L.LOCAIS[estado.local].rotulo,
        L.MOTIVOS[estado.motivo] && L.MOTIVOS[estado.motivo].rotulo,
        L.PERIODOS[estado.periodo] && L.PERIODOS[estado.periodo].rotulo
      ].filter(Boolean);
      escolhas.textContent = marcados.join(' · ');
      escolhas.hidden = passo === 'resumo' || !marcados.length;
    }

    function focarTitulo() {
      const titulo = passos[atual].querySelector('.triagem-titulo-passo');
      if (titulo) titulo.focus({ preventScroll: true });
    }

    function abrir(el) {
      gatilho = el;
      estado = {};
      historico = [];
      if (L.LOCAIS[el.dataset.local]) estado.local = el.dataset.local;
      if (L.MOTIVOS[el.dataset.motivo]) estado.motivo = el.dataset.motivo;
      mostrar(L.passoInicial(estado.local, estado.motivo));
      dialogo.showModal();
      focarTitulo();
    }

    // Gatilhos: qualquer [data-triagem] da página (clique com modificador abre o link normal).
    // Se abrir a triagem falhar, o clique segue como link comum para o WhatsApp.
    doc.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-triagem]');
      if (!el || ev.defaultPrevented) return;
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      try {
        abrir(el);
        ev.preventDefault();
      } catch (e) {
        console.error('[triagem]', e);
        if (dialogo.open) dialogo.close();
      }
    });

    // Só fecha pelo fundo escurecido quando o toque começa e termina nele
    // (arrastar uma seleção de texto até o fundo não fecha).
    let toqueComecouNoFundo = false;
    dialogo.addEventListener('pointerdown', (ev) => { toqueComecouNoFundo = ev.target === dialogo; });

    dialogo.addEventListener('click', (ev) => {
      const opcao = ev.target.closest('[data-escolha]');
      if (opcao) {
        historico.push(atual);
        estado[opcao.dataset.escolha] = opcao.dataset.valor;
        mostrar(proximoPasso());
        focarTitulo();
        return;
      }
      if (ev.target === dialogo && toqueComecouNoFundo) dialogo.close();
      toqueComecouNoFundo = false;
    });

    voltar.addEventListener('click', () => {
      if (!historico.length) return;
      const anterior = historico.pop();
      delete estado[anterior];
      mostrar(anterior);
      focarTitulo();
    });

    fechar.addEventListener('click', () => dialogo.close());

    // Depois de abrir o WhatsApp, a triagem não deve continuar aberta quando a pessoa voltar.
    [abrirWhats, pular].forEach((link) => link.addEventListener('click', () => {
      setTimeout(() => { if (dialogo.open) dialogo.close(); }, 400);
    }));

    dialogo.addEventListener('close', () => {
      if (gatilho && doc.contains(gatilho)) gatilho.focus({ preventScroll: true });
    });
  });

  // ---------- Abas de local ----------
  seguro('abas', () => {
    doc.querySelectorAll('[data-abas]').forEach((caixa) => {
      const abas = Array.from(caixa.querySelectorAll('[role="tab"]'));
      const paineis = abas.map((a) => doc.getElementById(a.getAttribute('aria-controls')));
      if (!abas.length || paineis.some((p) => !p)) return;

      function ativar(i, focar) {
        abas.forEach((a, j) => {
          const sel = i === j;
          a.setAttribute('aria-selected', String(sel));
          a.tabIndex = sel ? 0 : -1;
          paineis[j].hidden = !sel;
        });
        if (focar) abas[i].focus();
      }

      abas.forEach((a, i) => {
        a.addEventListener('click', () => ativar(i, false));
        a.addEventListener('keydown', (e) => {
          const n = abas.length;
          const destino = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
          if (destino === undefined) return;
          e.preventDefault();
          ativar(destino, true);
        });
      });

      caixa.classList.add('abas-ativas');
      ativar(0, false);
    });
  });

  // ---------- Cabeçalho: fundo creme depois de rolar ----------
  seguro('cabecalho', () => {
    const cabecalho = doc.getElementById('cabecalho');
    if (!cabecalho) return;
    let pendente = false;
    const atualizar = () => { pendente = false; cabecalho.classList.toggle('rolado', window.scrollY > 8); };
    window.addEventListener('scroll', () => {
      if (!pendente) { pendente = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    atualizar();
  });

  // ---------- Barra fixa: aparece depois dos botões do topo, some na chamada final ----------
  seguro('barra', () => {
    const barra = doc.querySelector('.barra-fixa');
    const botoesTopo = doc.querySelector('.topo-botoes');
    const chamada = doc.getElementById('agendar');
    if (!barra || !botoesTopo || !('IntersectionObserver' in window)) return;
    let passouTopo = false;
    let vendoChamada = false;
    const atualizar = () => barra.classList.toggle('visivel', passouTopo && !vendoChamada);
    new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { passouTopo = !e.isIntersecting && e.boundingClientRect.top < 0; });
      atualizar();
    }).observe(botoesTopo);
    if (chamada) {
      new IntersectionObserver((entradas) => {
        entradas.forEach((e) => { vendoChamada = e.isIntersecting; });
        atualizar();
      }).observe(chamada);
    }
  });

  // ---------- Podcast: o player do Spotify só carrega quando a pessoa toca ----------
  seguro('podcast', () => {
    doc.querySelectorAll('.podcast-play[data-embed]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const player = doc.createElement('iframe');
        player.src = botao.dataset.embed;
        player.title = 'Podcast da Dra. Queulla Garret no Spotify';
        player.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        player.loading = 'lazy';
        botao.replaceWith(player);
        player.focus();
      });
    });
  });
})();
