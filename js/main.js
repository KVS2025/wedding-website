(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const translations = window.WeddingTranslations;
  const languageStorageKey = "abhishek-triya-language";
  const numberFormatters = {
    en: new Intl.NumberFormat("en-IN", { useGrouping: false }),
    gu: new Intl.NumberFormat("gu-IN", { numberingSystem: "gujr", useGrouping: false })
  };
  let currentLanguage = "en";
  let scratchDateRevealed = false;

  function getTranslation(key, language = currentLanguage) {
    return translations[language][key] ?? translations.en[key] ?? key;
  }

  function applyLanguage(language, preserveScroll = true) {
    if (!translations[language]) return;
    const scrollPosition = window.scrollY;
    currentLanguage = language;
    document.documentElement.lang = language;
    document.title = getTranslation("meta.pageTitle");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = getTranslation(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", getTranslation(element.dataset.i18nAriaLabel));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.setAttribute("title", getTranslation(element.dataset.i18nTitle));
    });
    document.querySelectorAll("[data-i18n-content]").forEach((element) => {
      element.setAttribute("content", getTranslation(element.dataset.i18nContent));
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
      button.classList.toggle("is-active", button.dataset.language === language);
    });

    const accessibleDate = document.querySelector("#scratch-accessible-date");
    if (accessibleDate) {
      accessibleDate.textContent = getTranslation(
        scratchDateRevealed ? "scratch.accessibleRevealed" : "scratch.accessible"
      );
    }

    if (preserveScroll) {
      document.documentElement.classList.add("preserving-language-scroll");
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      window.scrollTo(0, scrollPosition);
      window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
        document.documentElement.classList.remove("preserving-language-scroll");
      });
    }
  }

  try {
    const savedLanguage = window.localStorage.getItem(languageStorageKey);
    if (savedLanguage && translations[savedLanguage]) currentLanguage = savedLanguage;
  } catch (error) {
    console.warn("The saved language preference could not be restored.", error);
  }
  applyLanguage(currentLanguage, false);

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      const { language } = button.dataset;
      if (language === currentLanguage) return;
      applyLanguage(language);
      updateCountdown(true);
      try {
        window.localStorage.setItem(languageStorageKey, language);
      } catch (error) {
        console.warn("The language preference could not be saved.", error);
      }
    });
  });

  const intro = document.querySelector("#curtain-intro");
  const openButton = document.querySelector("#open-invitation");
  const curtainPanels = intro.querySelectorAll(".curtain");
  const curtainHighlight = intro.querySelector(".curtain-highlight");
  let opened = false;
  let openingFinished = false;
  let openingFallbackTimer;

  function playWelcomeChime() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const context = new AudioContext();
      const start = context.currentTime;
      [659.25, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const at = start + index * 0.16;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.065, at + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.62);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.65);
      });
      window.setTimeout(() => context.close(), 1100);
    } catch (error) {
      console.warn("The welcome chime could not be played.", error);
    }
  }

  function finishOpening() {
    if (openingFinished) return;
    openingFinished = true;
    window.clearTimeout(openingFallbackTimer);
    document.body.classList.remove("intro-active");
    document.querySelector("#invitation").removeAttribute("inert");
    intro.classList.add("is-gone");
    intro.setAttribute("aria-hidden", "true");
    intro.removeAttribute("role");
    intro.removeAttribute("aria-modal");
    document.querySelector("#couple-names").setAttribute("tabindex", "-1");
    if (window.gsap && !reducedMotion) {
      const coupleTimeline = window.gsap.timeline();
      coupleTimeline.fromTo(".couple-person--left .couple-name", { autoAlpha: 0, y: 16 }, {
        autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out"
      })
        .fromTo(".couple-divider", { autoAlpha: 0, scale: 0.94 }, {
          autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out"
        }, "-=0.1")
        .fromTo(".couple-person--right .couple-name", { autoAlpha: 0, y: 16 }, {
          autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out"
        }, "-=0.08")
        .fromTo(".parent-relation, .parent-name", { autoAlpha: 0, y: 10 }, {
          autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power1.out"
        }, "-=0.12")
        .fromTo(".invitation-message, .hero-support, .text-link", { autoAlpha: 0, y: 8 }, {
          autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power1.out"
        }, "-=0.05");
    }
    document.querySelector("#couple-names").focus({ preventScroll: true });
    window.setTimeout(() => intro.remove(), 500);
  }

  function animateIntro() {
    if (reducedMotion) {
      curtainHighlight.hidden = true;
      openButton.style.opacity = "1";
      return;
    }
    if (!window.gsap) {
      curtainHighlight.classList.add("is-sweeping");
      openButton.classList.add("is-entered");
      return;
    }
    window.gsap.set(curtainHighlight, { xPercent: -145, autoAlpha: 0 });
    window.gsap.set(openButton, { autoAlpha: 0, y: 12 });
    window.gsap.timeline()
      .to(curtainHighlight, { xPercent: 145, autoAlpha: 0.85, duration: 1.25, ease: "sine.inOut" }, 0.25)
      .to(openButton, { autoAlpha: 1, y: 0, duration: 0.65, ease: "power2.out" }, 0.55)
      .to(curtainHighlight, { autoAlpha: 0, duration: 0.4 }, 1.15);
  }

  function openInvitation() {
    if (opened) return;
    opened = true;
    openButton.disabled = true;
    openButton.setAttribute("aria-busy", "true");
    playWelcomeChime();
    if (!window.gsap && !reducedMotion) intro.classList.add("css-opening");
    intro.classList.add("is-opening");

    if (reducedMotion) {
      finishOpening();
    } else if (window.gsap) {
      const timeline = window.gsap.timeline({ onComplete: finishOpening });
      timeline.to(openButton, { scale: 0.97, autoAlpha: 0, duration: 0.24, ease: "power2.in" }, 0)
        .to(intro.querySelectorAll(".intro-ornament"), { autoAlpha: 0, duration: 0.35 }, 0)
        .to(curtainPanels[0], {
          xPercent: -108, scaleX: 0.94, rotationY: 5, transformPerspective: 1100,
          duration: 1.82, ease: "power3.inOut"
        }, 0.14)
        .to(curtainPanels[1], {
          xPercent: 108, scaleX: 0.94, rotationY: -5, transformPerspective: 1100,
          duration: 1.82, ease: "power3.inOut"
        }, 0.2)
        .to(intro, { autoAlpha: 0, duration: 0.38, ease: "power1.out" }, 1.76);
      openingFallbackTimer = window.setTimeout(finishOpening, 2700);
    } else {
      window.setTimeout(finishOpening, 1900);
    }
  }

  animateIntro();
  openButton.addEventListener("click", openInvitation);
  document.body.classList.add("intro-active");
  document.querySelector("#invitation").setAttribute("inert", "");
  intro.focus({ preventScroll: true });

  const weddingInstant = Date.parse("2026-12-13T00:00:00+05:30");
  const countdown = document.querySelector("#countdown");
  const countdownShell = document.querySelector(".countdown-shell");
  const countdownHeading = document.querySelector("#countdown-heading");
  const completeMessage = document.querySelector("#countdown-complete");
  const numberNodes = Object.fromEntries(
    [...countdown.querySelectorAll("[data-unit]")].map((node) => [node.dataset.unit, node])
  );
  let previousValues = {};
  let countdownTimer;

  function updateCountdown(force = false) {
    const remaining = weddingInstant - Date.now();
    if (remaining <= 0) {
      countdown.hidden = true;
      completeMessage.hidden = false;
      window.clearInterval(countdownTimer);
      return;
    }
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      minutes: Math.floor((remaining / 60000) % 60),
      seconds: Math.floor((remaining / 1000) % 60)
    };
    for (const [unit, value] of Object.entries(values)) {
      const node = numberNodes[unit];
      if (force || previousValues[unit] !== value) {
        node.textContent = numberFormatters[currentLanguage].format(value).padStart(2, currentLanguage === "gu" ? "૦" : "0");
        node.classList.add("is-changing");
        window.setTimeout(() => node.classList.remove("is-changing"), 180);
      }
    }
    previousValues = values;
  }

  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);

  function setupScratchCard() {
    const card = document.querySelector("#scratch-card");
    const canvas = document.querySelector("#scratch-canvas");
    const reveal = document.querySelector("#scratch-reveal");
    const button = document.querySelector("#scratch-button");
    const accessibleDate = document.querySelector("#scratch-accessible-date");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const storageKey = "abhishek-triya-date-revealed";
    let width = 0;
    let height = 0;
    let revealed = false;
    let pointerDown = false;
    let activePointerId = null;
    let moveCount = 0;
    let previousPoint = null;
    let strokes = [];
    let currentStroke = null;

    function drawSurface() {
      context.save();
      context.globalCompositeOperation = "source-over";
      const surface = context.createLinearGradient(0, 0, width, height);
      surface.addColorStop(0, "#102B4A");
      surface.addColorStop(0.48, "#0b2039");
      surface.addColorStop(1, "#07182D");
      context.fillStyle = surface;
      context.fillRect(0, 0, width, height);

      const edge = context.createLinearGradient(0, 0, width, 0);
      edge.addColorStop(0, "rgba(4,16,31,.38)");
      edge.addColorStop(0.16, "rgba(232,203,145,.035)");
      edge.addColorStop(0.5, "rgba(4,16,31,.18)");
      edge.addColorStop(0.84, "rgba(232,203,145,.03)");
      edge.addColorStop(1, "rgba(4,16,31,.38)");
      context.fillStyle = edge;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(232,203,145,.44)";
      context.lineWidth = 0.7;
      context.strokeRect(12, 12, width - 24, height - 24);
      context.strokeStyle = "rgba(232,203,145,.16)";
      context.strokeRect(17, 17, width - 34, height - 34);
      context.fillStyle = "rgba(232,203,145,.72)";
      const centerX = width / 2;
      context.save();
      context.translate(centerX, 26);
      context.rotate(Math.PI / 4);
      context.fillRect(-3, -3, 6, 6);
      context.restore();

      for (const x of [25, width - 25]) {
        for (const y of [26, height - 26]) {
          context.beginPath();
          context.arc(x, y, 4, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.arc(x, y, 9, 0, Math.PI * 2);
          context.stroke();
        }
      }
      context.restore();
    }

    function erasePath(path) {
      if (!path.length) return;
      context.save();
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 34;
      context.beginPath();
      context.moveTo(path[0].x * width, path[0].y * height);
      if (path.length === 1) {
        context.lineTo(path[0].x * width + 0.1, path[0].y * height);
      } else {
        for (let index = 1; index < path.length; index += 1) {
          context.lineTo(path[index].x * width, path[index].y * height);
        }
      }
      context.stroke();
      context.restore();
    }

    function resizeCanvas() {
      if (!context) {
        canvas.hidden = true;
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const previousWidth = width;
      const previousHeight = height;
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (revealed) return;
      drawSurface();
      if (previousWidth && previousHeight) {
        strokes.forEach(erasePath);
      }
    }

    function revealDate() {
      if (revealed) return;
      revealed = true;
      scratchDateRevealed = true;
      pointerDown = false;
      activePointerId = null;
      const moveFocus = document.activeElement === button;
      const revealNodes = [
        reveal.querySelector(".scratch-date"),
        reveal.querySelector(".scratch-day"),
        reveal.querySelector(".scratch-message")
      ];
      const countdownUnits = [...countdown.querySelectorAll(".time-number")];
      const countdownSeparators = [...document.querySelectorAll(".countdown-separator")];
      countdown.hidden = false;
      if (countdownShell) countdownShell.classList.add("is-unlocked");
      canvas.classList.add("is-fading");
      card.classList.add("is-revealed");
      reveal.setAttribute("aria-hidden", "false");
      reveal.setAttribute("tabindex", "-1");
      accessibleDate.textContent = getTranslation("scratch.accessibleRevealed");
      button.disabled = true;
      button.setAttribute("aria-hidden", "true");
      if (moveFocus) reveal.focus({ preventScroll: true });
      window.setTimeout(() => { button.hidden = true; }, reducedMotion ? 0 : 650);
      try {
        window.sessionStorage.setItem(storageKey, "true");
      } catch (error) {
        console.warn("The wedding date could not be saved for this session.", error);
      }
      if (window.gsap && !reducedMotion) {
        const revealTimeline = window.gsap.timeline({ defaults: { ease: "power2.out" } });
        revealTimeline
          .to(card.querySelector(".scratch-prompt"), { autoAlpha: 0, duration: 0.2 }, 0)
          .to(canvas, { autoAlpha: 0, duration: 0.3 }, 0)
          .to(reveal, { autoAlpha: 1, scale: 1, duration: 0.7 }, 0.08)
          .fromTo(revealNodes[0], { autoAlpha: 0, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, 0.18)
          .fromTo(revealNodes[1], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.28)
          .fromTo(revealNodes[2], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.38)
          .fromTo(countdownHeading, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.65)
          .fromTo(countdownUnits, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.12 }, 0.82)
          .fromTo(countdownSeparators, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35, stagger: 0.12 }, 0.9);
      } else {
        reveal.style.opacity = "1";
        reveal.style.visibility = "visible";
        reveal.style.transform = "scale(1)";
        if (countdownHeading) countdownHeading.style.opacity = "1";
        countdownUnits.forEach((unit) => { unit.style.opacity = "1"; });
      }
      for (let index = 0; index < 12; index += 1) {
        const sparkle = document.createElement("span");
        sparkle.className = "scratch-sparkle";
        sparkle.setAttribute("aria-hidden", "true");
        sparkle.textContent = index % 2 ? "✦" : "✧";
        sparkle.style.setProperty("--sparkle-x", `${12 + Math.random() * 76}%`);
        sparkle.style.setProperty("--sparkle-y", `${16 + Math.random() * 64}%`);
        card.append(sparkle);
        window.setTimeout(() => sparkle.remove(), reducedMotion ? 50 : 1100);
      }
      window.dispatchEvent(new CustomEvent("wedding:unlock"));
    }

    function getScratchCoverage() {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const sampleStep = 256;
      let total = 0;
      let cleared = 0;
      for (let index = 3; index < pixels.length; index += sampleStep) {
        total += 1;
        if (pixels[index] < 35) cleared += 1;
      }
      return cleared / total;
    }

    function scratchAt(event) {
      const bounds = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height
      };
      if (currentStroke) currentStroke.push(point);
      context.save();
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 34;
      context.beginPath();
      if (previousPoint) {
        context.moveTo(previousPoint.x * width, previousPoint.y * height);
      } else {
        context.moveTo(point.x * width, point.y * height);
      }
      context.lineTo(point.x * width, point.y * height);
      context.stroke();
      context.restore();
      previousPoint = point;

      moveCount += 1;
      if (moveCount % 8 === 0 && getScratchCoverage() >= 0.5) revealDate();
    }

    canvas.addEventListener("pointerdown", (event) => {
      if (revealed || (activePointerId !== null && activePointerId !== event.pointerId)) return;
      event.preventDefault();
      pointerDown = true;
      activePointerId = event.pointerId;
      previousPoint = null;
      currentStroke = [];
      strokes.push(currentStroke);
      canvas.setPointerCapture(event.pointerId);
      scratchAt(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!pointerDown || activePointerId !== event.pointerId || revealed) return;
      event.preventDefault();
      scratchAt(event);
    });
    const endScratch = (event) => {
      if (activePointerId !== event.pointerId) return;
      pointerDown = false;
      activePointerId = null;
      previousPoint = null;
      currentStroke = null;
    };
    canvas.addEventListener("pointerup", endScratch);
    canvas.addEventListener("pointercancel", endScratch);
    button.addEventListener("click", revealDate);

    let alreadyRevealed = false;
    try {
      alreadyRevealed = window.sessionStorage.getItem(storageKey) === "true";
    } catch (error) {
      console.warn("The saved wedding date could not be restored.", error);
    }
    resizeCanvas();
    if (!context) {
      console.warn("Canvas scratching is unavailable; the tap-to-reveal option remains enabled.");
      canvas.hidden = true;
    }
    if (alreadyRevealed) revealDate();
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }
  setupScratchCard();

  function setupReveals() {
    const revealItems = document.querySelectorAll(".reveal");
    if (reducedMotion) {
      revealItems.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    if (window.gsap && window.ScrollTrigger) {
      document.documentElement.classList.add("has-motion", "has-gsap");
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.gsap.utils.toArray(".reveal").forEach((element, index) => {
        const eventDelay = element.classList.contains("event") ? (index % 4) * 0.1 : 0;
        window.gsap.fromTo(element, { y: 24, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          delay: eventDelay,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true }
        });
      });
      window.gsap.to(".hero-arch", {
        y: 24,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
      });
      window.gsap.to(".family-decoration", {
        yPercent: 7,
        ease: "none",
        scrollTrigger: { trigger: ".family-section", start: "top bottom", end: "bottom top", scrub: 0.8 }
      });
      return;
    }
    document.documentElement.classList.add("has-motion");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((element) => observer.observe(element));
  }
  setupReveals();

  function setupPetals() {
    const canvas = document.querySelector(".petal-canvas");
    const context = canvas.getContext("2d", { alpha: true });
    if (!context || reducedMotion) return;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let petalBoost = 0;
    let petalBoostTimer;
    let petals = [];
    const colors = ["#b99555", "#e8cb91", "#d8bd8c", "#c5a58d"];

    function triggerPetalBoost() {
      petalBoost = 1;
      window.clearTimeout(petalBoostTimer);
      petalBoostTimer = window.setTimeout(() => { petalBoost = 0; }, 1600);
    }

    window.addEventListener("wedding:unlock", triggerPetalBoost, { passive: true });

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(width < 600 ? 15 : 30, Math.max(8, Math.round(width / 42)));
      petals = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 3 + Math.random() * 5,
        speed: 0.35 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.45,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.018,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2
      }));
    }

    function draw(time) {
      frame = window.requestAnimationFrame(draw);
      if (document.hidden || time - lastTime < 28) return;
      const delta = Math.min((time - (lastTime || time)) / 16.67, 2);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      for (const petal of petals) {
        const boostFactor = petalBoost > 0 ? 2.2 : 1;
        petal.y += petal.speed * delta * boostFactor;
        petal.x += (petal.drift + Math.sin(time * 0.0007 + petal.phase) * 0.22) * delta * (petalBoost > 0 ? 1.8 : 1);
        petal.rotation += petal.spin * delta * (petalBoost > 0 ? 1.7 : 1);
        if (petal.y > height + 12) { petal.y = -12; petal.x = Math.random() * width; }
        if (petal.x < -12) petal.x = width + 12;
        if (petal.x > width + 12) petal.x = -12;
        context.save();
        context.translate(petal.x, petal.y);
        context.rotate(petal.rotation);
        context.globalAlpha = petalBoost > 0 ? 0.75 : 0.38;
        context.fillStyle = petal.color;
        context.beginPath();
        context.ellipse(0, 0, petal.size * 0.58, petal.size * 1.15, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    resize();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        context.clearRect(0, 0, width, height);
      } else {
        lastTime = 0;
        frame = window.requestAnimationFrame(draw);
      }
    });
  }
  setupPetals();
})();
