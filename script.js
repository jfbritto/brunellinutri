/**
 * Brunelli Nutricionista - Scripts
 * Chat interativo com funil qualificador de 5 etapas.
 *
 * Compatibilidade: ES5 + polyfills mínimos para WebViews antigos
 * (Instagram, Facebook, etc.)
 */

(function () {
  "use strict";

  /* ============================================
     POLYFILLS PARA WEBVIEWS ANTIGOS
     ============================================ */

  /* NodeList.forEach - não existe em WebViews Android < 7 */
  if (typeof NodeList !== "undefined" && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (fn, scope) {
      for (var i = 0; i < this.length; i++) {
        fn.call(scope, this[i], i, this);
      }
    };
  }

  /* Element.remove - não existe em WebViews muito antigos */
  if (typeof Element !== "undefined" && !Element.prototype.remove) {
    Element.prototype.remove = function () {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
  }

  /* ============================================
     HANDLER DE ERRO GLOBAL - força visibilidade
     ============================================ */

  window.onerror = function () {
    /* Se qualquer erro ocorrer, garante que a página fique visível */
    try {
      var items = document.querySelectorAll(".animate-item");
      for (var i = 0; i < items.length; i++) {
        items[i].style.opacity = "1";
        items[i].style.transform = "none";
      }
    } catch (e) {
      /* nada a fazer */
    }
  };

  /* ============================================
     CONFIGURAÇÃO DO CHAT
     ============================================ */

  var AVATAR_SRC = "assets/perfil-web.jpg";

  var WHATSAPP = {
    online: "5527999986102",
    presencial: "5527997799099"
  };

  /* ---------- Dados do funil ---------- */

  var EXPERIENCIA = {
    sim: {
      label: "Sim, já fiz",
      resposta:
        "Que ótimo que você já tem essa experiência! Isso ajuda bastante no processo. 😊"
    },
    primeira_vez: {
      label: "É minha primeira vez",
      resposta:
        "Que bom dar esse primeiro passo! Vai ver como o acompanhamento nutricional faz diferença na sua vida. 💚"
    },
    faz_tempo: {
      label: "Faz tempo que não vou",
      resposta:
        "Sem problemas! O importante é retomar o cuidado com a sua saúde. Vamos juntos nessa! 🤝"
    }
  };

  var AREAS = {
    obesidade: {
      label: "Emagrecimento / Reeducação Alimentar",
      mensagens: [
        "Trabalho com um acompanhamento nutricional individualizado, focado em mudanças reais e sustentáveis — sem dietas restritivas.",
        "Vou te fazer mais uma perguntinha para entender melhor a sua situação..."
      ],
      subPergunta: "Você já tentou fazer dietas por conta própria?",
      subOpcoes: [
        { id: "varias_vezes", label: "Sim, várias vezes" },
        { id: "sem_sucesso", label: "Sim, mas sem sucesso" },
        { id: "nunca", label: "Nunca tentei" }
      ],
      subRespostas: {
        varias_vezes:
          "Entendo perfeitamente. Muitas dietas prontas não funcionam porque não respeitam a sua individualidade. Comigo vai ser diferente!",
        sem_sucesso:
          "Isso é mais comum do que você imagina. O acompanhamento profissional faz toda a diferença para ter resultados de verdade.",
        nunca:
          "Ótimo! Começar com orientação profissional desde o início é o melhor caminho."
      }
    },
    bariatrica: {
      label: "Cirurgia Bariátrica",
      mensagens: [
        "Esse é um passo muito importante! Fico feliz que esteja buscando orientação profissional.",
        "Acompanho pacientes em todas as fases da cirurgia bariátrica. Me conta..."
      ],
      subPergunta: "Em qual fase você está?",
      subOpcoes: [
        { id: "pensando", label: "Pensando em operar" },
        { id: "pre_op", label: "Pré-operatório" },
        { id: "pos_op", label: "Pós-operatório" }
      ],
      subRespostas: {
        pensando:
          "Que bom que está pesquisando! A nutrição é fundamental na preparação. Posso te orientar em todo o processo.",
        pre_op:
          "O preparo nutricional pré-operatório é essencial para o sucesso da cirurgia. Vamos cuidar disso juntos!",
        pos_op:
          "O pós-operatório exige atenção especial com a alimentação. Estou aqui para garantir sua nutrição adequada em cada fase. 💪"
      }
    },
    transtorno: {
      label: "Transtornos Alimentares",
      mensagens: [
        "Agradeço muito sua confiança em compartilhar isso. Esse é um tema sensível e importante. 💚",
        "Ofereço um atendimento acolhedor e sem julgamentos. Para te ajudar melhor..."
      ],
      subPergunta: "Você já tem acompanhamento com psicólogo(a)?",
      subOpcoes: [
        { id: "sim_psi", label: "Sim, já tenho" },
        { id: "quero_psi", label: "Não, mas quero começar" },
        { id: "nao_psi", label: "Ainda não" }
      ],
      subRespostas: {
        sim_psi:
          "Excelente! O trabalho em equipe multidisciplinar potencializa muito o tratamento. Posso me comunicar com seu(sua) psicólogo(a) se necessário.",
        quero_psi:
          "Que bom que está aberta(o) a isso! Posso indicar profissionais de confiança para trabalharmos juntos no seu cuidado.",
        nao_psi:
          "Sem problemas. Vamos conversar com calma sobre isso e avaliar o melhor caminho para você. Cada caso é único."
      }
    },
    cronica: {
      label: "Doenças Crônicas",
      mensagens: [
        "A alimentação é uma aliada poderosa no controle de doenças crônicas! 🍃",
        "Trabalho com planos nutricionais personalizados. Para direcionar melhor..."
      ],
      subPergunta: "Qual condição você gostaria de tratar?",
      subOpcoes: [
        { id: "diabetes", label: "Diabetes" },
        { id: "hipertensao", label: "Hipertensão" },
        { id: "renal", label: "Doença renal" },
        { id: "outra_cond", label: "Outra condição" }
      ],
      subRespostas: {
        diabetes:
          "A alimentação adequada é fundamental no controle glicêmico. Vou montar um plano que se encaixa na sua rotina!",
        hipertensao:
          "Com as escolhas alimentares certas, é possível melhorar muito o controle da pressão. Vamos trabalhar nisso!",
        renal:
          "A nutrição renal exige cuidado especializado e estou preparada para te ajudar com isso.",
        outra_cond:
          "Cada condição tem suas particularidades nutricionais. Vamos conversar para eu entender melhor o seu caso!"
      }
    },
    outro: {
      label: "Outro assunto",
      mensagens: [
        "Claro! Cada pessoa tem necessidades únicas e estou aqui para te ajudar no que precisar.",
        "Vamos conversar melhor pelo WhatsApp para eu entender certinho como posso te ajudar."
      ],
      subPergunta: null,
      subOpcoes: null,
      subRespostas: null
    }
  };

  /* ============================================
     ESTADO DO CHAT
     ============================================ */

  var state = {
    experiencia: null,
    area: null,
    subResposta: null,
    modalidade: null
  };

  var messagesEl, optionsEl;

  /* ============================================
     FUNÇÕES AUXILIARES
     ============================================ */

  function scrollToBottom() {
    if (!messagesEl) return;
    try {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (e) {
      /* silêncio */
    }
  }

  function createBotMessage(text) {
    var wrapper = document.createElement("div");
    wrapper.className = "message message--bot";

    var avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = AVATAR_SRC;
    avatar.alt = "Brunelli";

    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function createUserMessage(text) {
    var wrapper = document.createElement("div");
    wrapper.className = "message message--user";

    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    return wrapper;
  }

  function showTyping() {
    var typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.id = "typing";

    var avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = AVATAR_SRC;
    avatar.alt = "Brunelli digitando";

    var dots = document.createElement("div");
    dots.className = "typing-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";

    typing.appendChild(avatar);
    typing.appendChild(dots);
    messagesEl.appendChild(typing);
    scrollToBottom();
  }

  function removeTyping() {
    var typing = document.getElementById("typing");
    if (typing && typing.parentNode) {
      typing.parentNode.removeChild(typing);
    }
  }

  function addBotMessage(text, delay, callback) {
    delay = delay || 800;

    /* Usa callbacks em vez de Promises para máxima compatibilidade */
    showTyping();
    setTimeout(function () {
      removeTyping();
      var msg = createBotMessage(text);
      messagesEl.appendChild(msg);
      scrollToBottom();
      if (callback) callback();
    }, delay);
  }

  function addUserMessage(text) {
    var msg = createUserMessage(text);
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  /**
   * Adiciona múltiplas mensagens bot em sequência usando callbacks.
   */
  function addBotMessages(messages, baseDelay, callback) {
    baseDelay = baseDelay || 800;
    var index = 0;

    function next() {
      if (index >= messages.length) {
        if (callback) callback();
        return;
      }
      var delay = index === 0 ? baseDelay : baseDelay + 200;
      var text = messages[index];
      index++;
      addBotMessage(text, delay, next);
    }

    next();
  }

  function clearOptions(callback) {
    if (!optionsEl) {
      if (callback) callback();
      return;
    }

    var buttons = optionsEl.querySelectorAll(".chat-option-btn, .chat-cta");
    if (buttons.length === 0) {
      optionsEl.innerHTML = "";
      if (callback) callback();
      return;
    }

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].className += " fade-out";
    }

    setTimeout(function () {
      optionsEl.innerHTML = "";
      if (callback) callback();
    }, 250);
  }

  function showOptions(options, callback) {
    clearOptions(function () {
      for (var i = 0; i < options.length; i++) {
        (function (opt, idx) {
          var btn = document.createElement("button");
          btn.className = "chat-option-btn";
          btn.textContent = opt.label;
          btn.style.animationDelay = idx * 0.12 + "s";

          btn.onclick = function () {
            /* Desabilita todos os botões */
            var allBtns = optionsEl.querySelectorAll(".chat-option-btn");
            for (var j = 0; j < allBtns.length; j++) {
              allBtns[j].disabled = true;
            }
            callback(opt);
          };

          optionsEl.appendChild(btn);
        })(options[i], i);
      }
      scrollToBottom();
    });
  }

  function showWhatsAppCTA(phone, message) {
    clearOptions(function () {
      var url =
        "https://api.whatsapp.com/send?phone=" +
        phone +
        "&text=" +
        encodeURIComponent(message);

      var cta = document.createElement("a");
      cta.className = "chat-cta";
      cta.href = url;
      cta.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>' +
        "</svg>" +
        "Conversar no WhatsApp";

      /* Click handler - navegação direta para WebViews */
      cta.onclick = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        window.location.href = url;
        return false;
      };

      optionsEl.appendChild(cta);
      scrollToBottom();
    });
  }

  /* ============================================
     FLUXO DO CHAT - 5 ETAPAS
     ============================================ */

  /** Etapa 0: Saudação inicial. */
  function startChat() {
    addBotMessages(
      [
        "Olá! Eu sou a Brunelli, tudo bem? 😊",
        "Sou nutricionista e estou aqui para te ajudar a cuidar da sua saúde através da alimentação."
      ],
      900,
      function () {
        addBotMessage(
          "Você já fez acompanhamento com nutricionista antes?",
          700,
          function () {
            showOptions(
              [
                { id: "sim", label: "Sim, já fiz" },
                { id: "primeira_vez", label: "É minha primeira vez" },
                { id: "faz_tempo", label: "Faz tempo que não vou" }
              ],
              onExperienciaSelected
            );
          }
        );
      }
    );
  }

  /** Etapa 1: Experiência prévia. */
  function onExperienciaSelected(option) {
    state.experiencia = option.id;
    addUserMessage(option.label);

    var exp = EXPERIENCIA[option.id];

    addBotMessage(exp.resposta, 800, function () {
      addBotMessage("E o que te trouxe aqui hoje?", 700, function () {
        showOptions(
          [
            { id: "obesidade", label: "Emagrecimento / Reeducação Alimentar" },
            { id: "bariatrica", label: "Cirurgia Bariátrica" },
            { id: "transtorno", label: "Transtornos Alimentares" },
            { id: "cronica", label: "Doenças Crônicas" },
            { id: "outro", label: "Outro assunto" }
          ],
          onAreaSelected
        );
      });
    });
  }

  /** Etapa 2: Área de interesse. */
  function onAreaSelected(option) {
    state.area = option.id;
    var area = AREAS[option.id];

    addUserMessage(option.label);

    addBotMessages(area.mensagens, 800, function () {
      if (area.subPergunta) {
        addBotMessage(area.subPergunta, 700, function () {
          showOptions(area.subOpcoes, onSubRespostaSelected);
        });
      } else {
        /* "Outro assunto" pula direto para modalidade */
        addBotMessage("Como você prefere ser atendida(o)?", 700, function () {
          showOptions(
            [
              { id: "online", label: "Atendimento Online" },
              { id: "presencial", label: "Presencial – Vila Velha" }
            ],
            onModalidadeSelected
          );
        });
      }
    });
  }

  /** Etapa 3: Sub-pergunta qualificadora. */
  function onSubRespostaSelected(option) {
    state.subResposta = option;
    var area = AREAS[state.area];

    addUserMessage(option.label);

    var resposta = area.subRespostas[option.id];

    addBotMessage(resposta, 800, function () {
      addBotMessage("Como você prefere ser atendida(o)?", 700, function () {
        showOptions(
          [
            { id: "online", label: "Atendimento Online" },
            { id: "presencial", label: "Presencial – Vila Velha" }
          ],
          onModalidadeSelected
        );
      });
    });
  }

  /** Etapa 4: Modalidade de atendimento. */
  function onModalidadeSelected(option) {
    state.modalidade = option.id;
    addUserMessage(option.label);

    var phone =
      option.id === "online" ? WHATSAPP.online : WHATSAPP.presencial;

    var area = AREAS[state.area];
    var exp = EXPERIENCIA[state.experiencia];
    var isOnline = option.id === "online";

    var msgParts;
    if (isOnline) {
      msgParts = [
        "Olá Brunelli! Vim pelo seu site.",
        "- Experiência: " + exp.label,
        "- Interesse: " + area.label
      ];
      if (state.subResposta && area.subPergunta) {
        msgParts.push(
          "- " + area.subPergunta + " " + state.subResposta.label
        );
      }
      msgParts.push(
        "- Preferência: atendimento online",
        "Gostaria de agendar uma consulta!"
      );
    } else {
      msgParts = [
        "Olá! Vim pelo site da nutricionista Brunelli e gostaria de agendar uma consulta presencial.",
        "- Experiência: " + exp.label,
        "- Interesse: " + area.label
      ];
      if (state.subResposta && area.subPergunta) {
        msgParts.push(
          "- " + area.subPergunta + " " + state.subResposta.label
        );
      }
      msgParts.push("Gostaria de agendar um horário, por favor!");
    }

    var prefilledMsg = msgParts.join("\n");

    var botMessages = isOnline
      ? [
          "Perfeito! Vai ser um prazer te atender online! 😊",
          "Clica no botão abaixo para falar comigo diretamente pelo WhatsApp. Já deixei uma mensagem prontinha com tudo que você me contou!"
        ]
      : [
          "Perfeito! Vai ser um prazer te atender presencialmente em Vila Velha! 😊",
          "Clica no botão abaixo para falar com a clínica e agendar sua consulta. Já deixei uma mensagem prontinha para facilitar!"
        ];

    addBotMessages(botMessages, 800, function () {
      showWhatsAppCTA(phone, prefilledMsg);
    });
  }

  /* ============================================
     ANIMAÇÕES E UTILIDADES GERAIS
     ============================================ */

  /** Corrige a altura do viewport para WebViews */
  function fixViewportHeight() {
    try {
      var setHeight = function () {
        var vh = window.innerHeight;
        document.documentElement.style.setProperty(
          "--app-height",
          vh + "px"
        );
      };
      setHeight();
      window.addEventListener("resize", setHeight, false);
      window.addEventListener(
        "orientationchange",
        function () {
          setTimeout(setHeight, 150);
        },
        false
      );
    } catch (e) {
      /* silêncio */
    }
  }

  function initEntryAnimations() {
    var items = document.querySelectorAll(".animate-item");
    for (var i = 0; i < items.length; i++) {
      (function (item, idx) {
        setTimeout(function () {
          item.className += " visible";
        }, 150 * (idx + 1));
      })(items[i], i);
    }
  }

  function initParallax() {
    try {
      var circles = document.querySelectorAll(".circle");
      if (
        !circles.length ||
        (window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      ) {
        return;
      }

      document.addEventListener(
        "mousemove",
        function (e) {
          var x = (e.clientX / window.innerWidth - 0.5) * 2;
          var y = (e.clientY / window.innerHeight - 0.5) * 2;

          for (var i = 0; i < circles.length; i++) {
            var speed = (i + 1) * 8;
            circles[i].style.transform =
              "translate(" + x * speed + "px, " + y * speed + "px)";
          }
        },
        false
      );
    } catch (e) {
      /* silêncio */
    }
  }

  function detectTouch() {
    var touched = false;
    try {
      window.addEventListener(
        "touchstart",
        function () {
          if (!touched) {
            touched = true;
            document.body.className += " touch-device";
          }
        },
        false
      );
    } catch (e) {
      /* silêncio */
    }
  }

  /* ============================================
     INICIALIZAÇÃO
     ============================================ */

  function init() {
    try {
      messagesEl = document.getElementById("chat-messages");
      optionsEl = document.getElementById("chat-options");

      fixViewportHeight();
      initEntryAnimations();
      initParallax();
      detectTouch();

      setTimeout(function () {
        startChat();
      }, 600);

      /* Fallback: se após 2s os itens ainda não estiverem visíveis, forçar */
      setTimeout(function () {
        var items = document.querySelectorAll(".animate-item");
        for (var i = 0; i < items.length; i++) {
          if (items[i].className.indexOf("visible") === -1) {
            items[i].className += " visible";
          }
        }
      }, 2000);
    } catch (e) {
      /* Erro na inicialização - força tudo visível */
      try {
        var items = document.querySelectorAll(".animate-item");
        for (var j = 0; j < items.length; j++) {
          items[j].style.opacity = "1";
          items[j].style.transform = "none";
        }
      } catch (e2) {
        /* nada a fazer */
      }
    }
  }

  /* Garante que init rode quando o DOM estiver pronto */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, false);
  } else {
    init();
  }
})();
