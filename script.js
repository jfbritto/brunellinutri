/**
 * Brunelli Nutricionista - Scripts
 * Animações de entrada, efeito ripple e interatividade.
 */

(function () {
  "use strict";

  /**
   * Animação de entrada sequencial dos elementos.
   * Cada elemento com a classe .animate-item aparece com um delay progressivo.
   */
  function initEntryAnimations() {
    var items = document.querySelectorAll(".animate-item");
    var baseDelay = 150;

    items.forEach(function (item, index) {
      setTimeout(function () {
        item.classList.add("visible");
      }, baseDelay * (index + 1));
    });
  }

  /**
   * Efeito ripple nos cards de link ao clicar.
   * Cria um círculo animado no ponto do clique.
   */
  function initRippleEffect() {
    var linkCards = document.querySelectorAll(".link-card");

    linkCards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        var existingRipple = card.querySelector(".ripple");
        if (existingRipple) {
          existingRipple.remove();
        }

        var ripple = document.createElement("span");
        ripple.classList.add("ripple");

        var rect = card.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;

        ripple.style.width = size + "px";
        ripple.style.height = size + "px";
        ripple.style.left = x + "px";
        ripple.style.top = y + "px";

        card.appendChild(ripple);

        ripple.addEventListener("animationend", function () {
          ripple.remove();
        });
      });
    });
  }

  /**
   * Efeito parallax sutil nos círculos de fundo ao mover o mouse.
   */
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

  /**
   * Adiciona classe ao body quando o touch é detectado
   * para ajustar comportamentos hover em dispositivos móveis.
   */
  function detectTouch() {
    window.addEventListener(
      "touchstart",
      function () {
        document.body.classList.add("touch-device");
      },
      { once: true }
    );
  }

  /**
   * Inicializa todos os scripts quando o DOM estiver pronto.
   */
  function init() {
    initEntryAnimations();
    initRippleEffect();
    initParallax();
    detectTouch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
