/**
 * Brunelli Nutricionista - Scripts
 * Chat interativo com funil qualificador de 5 etapas.
 */

(function () {
  "use strict";

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
      resposta: "Que ótimo que você já tem essa experiência! Isso ajuda bastante no processo. 😊"
    },
    primeira_vez: {
      label: "É minha primeira vez",
      resposta: "Que bom dar esse primeiro passo! Vai ver como o acompanhamento nutricional faz diferença na sua vida. 💚"
    },
    faz_tempo: {
      label: "Faz tempo que não vou",
      resposta: "Sem problemas! O importante é retomar o cuidado com a sua saúde. Vamos juntos nessa! 🤝"
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
        varias_vezes: "Entendo perfeitamente. Muitas dietas prontas não funcionam porque não respeitam a sua individualidade. Comigo vai ser diferente!",
        sem_sucesso: "Isso é mais comum do que você imagina. O acompanhamento profissional faz toda a diferença para ter resultados de verdade.",
        nunca: "Ótimo! Começar com orientação profissional desde o início é o melhor caminho."
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
        pensando: "Que bom que está pesquisando! A nutrição é fundamental na preparação. Posso te orientar em todo o processo.",
        pre_op: "O preparo nutricional pré-operatório é essencial para o sucesso da cirurgia. Vamos cuidar disso juntos!",
        pos_op: "O pós-operatório exige atenção especial com a alimentação. Estou aqui para garantir sua nutrição adequada em cada fase. 💪"
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
        sim_psi: "Excelente! O trabalho em equipe multidisciplinar potencializa muito o tratamento. Posso me comunicar com seu(sua) psicólogo(a) se necessário.",
        quero_psi: "Que bom que está aberta(o) a isso! Posso indicar profissionais de confiança para trabalharmos juntos no seu cuidado.",
        nao_psi: "Sem problemas. Vamos conversar com calma sobre isso e avaliar o melhor caminho para você. Cada caso é único."
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
        diabetes: "A alimentação adequada é fundamental no controle glicêmico. Vou montar um plano que se encaixa na sua rotina!",
        hipertensao: "Com as escolhas alimentares certas, é possível melhorar muito o controle da pressão. Vamos trabalhar nisso!",
        renal: "A nutrição renal exige cuidado especializado e estou preparada para te ajudar com isso.",
        outra_cond: "Cada condição tem suas particularidades nutricionais. Vamos conversar para eu entender melhor o seu caso!"
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

  var messagesEl = document.getElementById("chat-messages");
  var optionsEl = document.getElementById("chat-options");

  /* ============================================
     FUNÇÕES AUXILIARES
     ============================================ */

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
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
    if (typing) {
      typing.remove();
    }
  }

  function addBotMessage(text, delay) {
    delay = delay || 800;
    return new Promise(function (resolve) {
      showTyping();
      setTimeout(function () {
        removeTyping();
        var msg = createBotMessage(text);
        messagesEl.appendChild(msg);
        scrollToBottom();
        resolve();
      }, delay);
    });
  }

  function addUserMessage(text) {
    var msg = createUserMessage(text);
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function addBotMessages(messages, baseDelay) {
    baseDelay = baseDelay || 800;
    var promise = Promise.resolve();
    messages.forEach(function (text, i) {
      promise = promise.then(function () {
        var delay = i === 0 ? baseDelay : baseDelay + 200;
        return addBotMessage(text, delay);
      });
    });
    return promise;
  }

  function clearOptions() {
    var buttons = optionsEl.querySelectorAll(".chat-option-btn, .chat-cta");
    if (buttons.length === 0) {
      optionsEl.innerHTML = "";
      return Promise.resolve();
    }
    buttons.forEach(function (btn) {
      btn.classList.add("fade-out");
    });
    return new Promise(function (resolve) {
      setTimeout(function () {
        optionsEl.innerHTML = "";
        resolve();
      }, 250);
    });
  }

  function showOptions(options, callback) {
    clearOptions().then(function () {
      options.forEach(function (opt, i) {
        var btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.textContent = opt.label;
        btn.style.animationDelay = i * 0.12 + "s";

        btn.addEventListener("click", function () {
          var allBtns = optionsEl.querySelectorAll(".chat-option-btn");
          allBtns.forEach(function (b) {
            b.disabled = true;
          });
          callback(opt);
        });

        optionsEl.appendChild(btn);
      });
      scrollToBottom();
    });
  }

  function showWhatsAppCTA(phone, message) {
    clearOptions().then(function () {
      var url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);

      var cta = document.createElement("a");
      cta.className = "chat-cta";
      cta.href = url;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      cta.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>' +
        "</svg>" +
        "Conversar no WhatsApp";

      optionsEl.appendChild(cta);
      scrollToBottom();
    });
  }

  /* ============================================
     FLUXO DO CHAT - 5 ETAPAS
     ============================================ */

  /**
   * Etapa 0: Saudação inicial.
   */
  function startChat() {
    addBotMessages(
      [
        "Olá! Eu sou a Brunelli, tudo bem? 😊",
        "Sou nutricionista e estou aqui para te ajudar a cuidar da sua saúde através da alimentação."
      ],
      900
    ).then(function () {
      return addBotMessage(
        "Você já fez acompanhamento com nutricionista antes?",
        700
      );
    }).then(function () {
      showOptions(
        [
          { id: "sim", label: "Sim, já fiz" },
          { id: "primeira_vez", label: "É minha primeira vez" },
          { id: "faz_tempo", label: "Faz tempo que não vou" }
        ],
        onExperienciaSelected
      );
    });
  }

  /**
   * Etapa 1: Experiência prévia.
   */
  function onExperienciaSelected(option) {
    state.experiencia = option.id;
    addUserMessage(option.label);

    var exp = EXPERIENCIA[option.id];

    addBotMessage(exp.resposta, 800).then(function () {
      return addBotMessage("E o que te trouxe aqui hoje?", 700);
    }).then(function () {
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
  }

  /**
   * Etapa 2: Área de interesse.
   */
  function onAreaSelected(option) {
    state.area = option.id;
    var area = AREAS[option.id];

    addUserMessage(option.label);

    addBotMessages(area.mensagens, 800).then(function () {
      if (area.subPergunta) {
        return addBotMessage(area.subPergunta, 700).then(function () {
          showOptions(area.subOpcoes, onSubRespostaSelected);
        });
      } else {
        /* "Outro assunto" pula direto para modalidade */
        return addBotMessage(
          "Como você prefere ser atendida(o)?",
          700
        ).then(function () {
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

  /**
   * Etapa 3: Sub-pergunta qualificadora.
   */
  function onSubRespostaSelected(option) {
    state.subResposta = option;
    var area = AREAS[state.area];

    addUserMessage(option.label);

    var resposta = area.subRespostas[option.id];

    addBotMessage(resposta, 800).then(function () {
      return addBotMessage("Como você prefere ser atendida(o)?", 700);
    }).then(function () {
      showOptions(
        [
          { id: "online", label: "Atendimento Online" },
          { id: "presencial", label: "Presencial – Vila Velha" }
        ],
        onModalidadeSelected
      );
    });
  }

  /**
   * Etapa 4: Modalidade de atendimento.
   */
  function onModalidadeSelected(option) {
    state.modalidade = option.id;
    addUserMessage(option.label);

    var modalidadeTexto =
      option.id === "online" ? "online" : "presencial em Vila Velha";
    var phone =
      option.id === "online" ? WHATSAPP.online : WHATSAPP.presencial;

    /* Monta mensagem pré-preenchida com todas as respostas */
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
        msgParts.push("- " + area.subPergunta + " " + state.subResposta.label);
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
        msgParts.push("- " + area.subPergunta + " " + state.subResposta.label);
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

    addBotMessages(botMessages, 800).then(function () {
      showWhatsAppCTA(phone, prefilledMsg);
    });
  }

  /* ============================================
     ANIMAÇÕES E UTILIDADES GERAIS
     ============================================ */

  function initEntryAnimations() {
    var items = document.querySelectorAll(".animate-item");
    var baseDelay = 150;

    items.forEach(function (item, index) {
      setTimeout(function () {
        item.classList.add("visible");
      }, baseDelay * (index + 1));
    });
  }

  function initParallax() {
    var circles = document.querySelectorAll(".circle");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    document.addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;

      circles.forEach(function (circle, index) {
        var speed = (index + 1) * 8;
        var translateX = x * speed;
        var translateY = y * speed;
        circle.style.transform =
          "translate(" + translateX + "px, " + translateY + "px)";
      });
    });
  }

  function detectTouch() {
    window.addEventListener(
      "touchstart",
      function () {
        document.body.classList.add("touch-device");
      },
      { once: true }
    );
  }

  /* ============================================
     INICIALIZAÇÃO
     ============================================ */

  function init() {
    initEntryAnimations();
    initParallax();
    detectTouch();

    setTimeout(function () {
      startChat();
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
