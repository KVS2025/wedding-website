(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const translations = window.WeddingTranslations;
  const languageStorageKey = "abhishek-triya-language";
  const galleryImage = document.querySelector("#gallery-image");
  const galleryStage = document.querySelector("#gallery-stage");
  const galleryPrevious = document.querySelector("#gallery-previous");
  const galleryNext = document.querySelector("#gallery-next");
  const galleryDots = [...document.querySelectorAll("[data-gallery-index]")];
  const galleryPhotos = [
    { src: "assets/images/DSC02064.jpg", width: 1152, height: 768, objectPosition: "50% 50%", alt: "gallery.photo1" },
    { src: "assets/images/DSC02373.jpg", width: 1152, height: 768, objectPosition: "52% 55%", alt: "gallery.photo2" },
    { src: "assets/images/DSC02645-closeup.png", width: 853, height: 768, objectPosition: "50% 50%", alt: "gallery.photo3" },
    { src: "assets/images/DSC01453.jpg", width: 1152, height: 768, objectPosition: "54% 54%", alt: "gallery.photo4" }
  ];
  const numberFormatters = {
    en: new Intl.NumberFormat("en-IN", { useGrouping: false }),
    gu: new Intl.NumberFormat("gu-IN", { numberingSystem: "gujr", useGrouping: false })
  };
  let currentLanguage = "en";
  let currentGallerySlide = 0;
  let scratchDateRevealed = false;

  function getTranslation(key, language = currentLanguage) {
    return translations[language][key] ?? translations.en[key] ?? key;
  }

  function updateGalleryLanguage() {
    galleryImage.alt = getTranslation(galleryPhotos[currentGallerySlide].alt);
    galleryDots.forEach((dot, index) => {
      dot.setAttribute("aria-current", String(index === currentGallerySlide));
      dot.setAttribute(
        "aria-label",
        getTranslation("gallery.showSlide").replace(
          "{number}",
          numberFormatters[currentLanguage].format(index + 1)
        )
      );
    });
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
  updateGalleryLanguage();

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      const { language } = button.dataset;
      if (language === currentLanguage) return;
      applyLanguage(language);
      updateGalleryLanguage();
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
  const completeMessage = document.querySelector("#countdown-complete");
  const numberNodes = Object.fromEntries(
    [...countdown.querySelectorAll("[data-unit]")].map((node) => [node.dataset.unit, node])
  );
  let previousValues = {};
  let countdownTimer;

  function updateCountdown(force = false) {
    const remaining = weddingInstant - Date.now();
    const expired = remaining <= 0;
    const timeRemaining = Math.max(remaining, 0);
    const values = {
      days: Math.floor(timeRemaining / 86400000),
      hours: Math.floor((timeRemaining / 3600000) % 24),
      minutes: Math.floor((timeRemaining / 60000) % 60),
      seconds: Math.floor((timeRemaining / 1000) % 60)
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
    completeMessage.hidden = !expired;
    if (expired) window.clearInterval(countdownTimer);
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
    const celebration = document.querySelector("#heart-celebration");
    const storageKey = "abhishek-triya-date-revealed";
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let heartPath;
    let revealed = false;
    let pointerDown = false;
    let activePointerId = null;
    let moveCount = 0;
    let previousPoint = null;
    let pointerStart = null;
    let strokes = [];
    let currentStroke = null;

    function buildHeartPath() {
      const path = new Path2D();
      path.moveTo(width * 0.5, height * 0.94);
      path.bezierCurveTo(width * 0.43, height * 0.87, width * 0.09, height * 0.62, width * 0.045, height * 0.41);
      path.bezierCurveTo(0, height * 0.2, width * 0.12, height * 0.07, width * 0.29, height * 0.07);
      path.bezierCurveTo(width * 0.39, height * 0.07, width * 0.47, height * 0.13, width * 0.5, height * 0.24);
      path.bezierCurveTo(width * 0.53, height * 0.13, width * 0.61, height * 0.07, width * 0.71, height * 0.07);
      path.bezierCurveTo(width * 0.88, height * 0.07, width, height * 0.2, width * 0.955, height * 0.41);
      path.bezierCurveTo(width * 0.91, height * 0.62, width * 0.57, height * 0.87, width * 0.5, height * 0.94);
      path.closePath();
      return path;
    }

    function drawSurface() {
      context.save();
      context.beginPath();
      context.clip(heartPath);
      context.globalCompositeOperation = "source-over";
      const surface = context.createLinearGradient(0, 0, width, height);
      surface.addColorStop(0, "#fffdf7");
      surface.addColorStop(0.52, "#fff8eb");
      surface.addColorStop(1, "#eee1ce");
      context.fillStyle = surface;
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(width * 0.5, height * 0.34, 4, width * 0.5, height * 0.5, width * 0.62);
      glow.addColorStop(0, "rgba(255,255,255,.55)");
      glow.addColorStop(1, "rgba(185,149,85,.08)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.fillStyle = "rgba(102,77,43,.07)";
      for (let index = 0; index < 850; index += 1) {
        const x = ((index * 73) % 997) / 997 * width;
        const y = ((index * 193) % 991) / 991 * height;
        context.fillRect(x, y, 0.55, 0.55);
      }
      context.restore();
    }

    function erasePath(path) {
      if (!path.length) return;
      context.save();
      context.beginPath();
      context.clip(heartPath);
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = Math.max(30, width * 0.085);
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
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      heartPath = buildHeartPath();
      if (revealed) return;
      drawSurface();
      if (previousWidth && previousHeight) {
        strokes.forEach(erasePath);
      }
    }

    function launchCelebration() {
      card.classList.add("is-celebrating");
      const colors = ["#e8cb91", "#f3ddae", "#d9b66f", "#c98573", "#fff3cf"];
      const particles = [];
      for (let index = 0; index < 30; index += 1) {
        const particle = document.createElement("span");
        const angle = Math.random() * Math.PI * 2;
        const distance = width * (0.28 + Math.random() * 0.34);
        particle.className = "heart-particle";
        particle.style.setProperty("--particle-color", colors[index % colors.length]);
        particle.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--burst-y", `${Math.sin(angle) * distance * 0.86}px`);
        celebration.append(particle);
        particles.push(particle);
      }

      for (let index = 0; index < 14; index += 1) {
        const sparkle = document.createElement("span");
        sparkle.className = "scratch-sparkle";
        sparkle.setAttribute("aria-hidden", "true");
        sparkle.textContent = index % 2 ? "✦" : "✧";
        sparkle.style.setProperty("--sparkle-x", `${18 + Math.random() * 64}%`);
        sparkle.style.setProperty("--sparkle-y", `${18 + Math.random() * 62}%`);
        card.append(sparkle);
        window.setTimeout(() => sparkle.remove(), reducedMotion ? 50 : 1800);
      }

      if (window.gsap && !reducedMotion) {
        celebration.classList.add("is-animated");
        const timeline = window.gsap.timeline({
          onComplete: () => {
            card.classList.remove("is-celebrating");
            celebration.classList.remove("is-animated");
            celebration.replaceChildren();
          }
        });
        timeline
          .fromTo(card, { scale: 1 }, { scale: 1.045, duration: 0.32, ease: "power2.out" })
          .to(card, { scale: 1, duration: 0.85, ease: "elastic.out(1, 0.55)" }, 0.32)
          .fromTo(particles, { x: 0, y: 0, scale: 0.2, autoAlpha: 1 }, {
            x: (index) => parseFloat(particles[index].style.getPropertyValue("--burst-x")),
            y: (index) => parseFloat(particles[index].style.getPropertyValue("--burst-y")),
            scale: 0.75,
            autoAlpha: 0,
            duration: 1.65,
            ease: "power2.out",
            stagger: { each: 0.015, from: "random" }
          }, 0.05);
      } else {
        window.setTimeout(() => {
          card.classList.remove("is-celebrating");
          celebration.replaceChildren();
        }, reducedMotion ? 0 : 1900);
      }
    }

    function revealDate(celebrate = true) {
      if (revealed) return;
      revealed = true;
      scratchDateRevealed = true;
      pointerDown = false;
      activePointerId = null;
      pointerStart = null;
      const moveFocus = document.activeElement === button;
      const revealNodes = [
        reveal.querySelector(".scratch-date"),
        reveal.querySelector(".scratch-day"),
        reveal.querySelector(".scratch-message")
      ];
      canvas.classList.add("is-fading");
      card.classList.add("is-revealed");
      reveal.setAttribute("aria-hidden", "false");
      reveal.setAttribute("tabindex", "-1");
      accessibleDate.textContent = getTranslation("scratch.accessibleRevealed");
      button.disabled = true;
      button.setAttribute("aria-hidden", "true");
      if (moveFocus) reveal.focus({ preventScroll: true });
      window.setTimeout(() => { button.hidden = true; }, reducedMotion ? 0 : 650);
      if (celebrate) {
        try {
          window.sessionStorage.setItem(storageKey, "true");
        } catch (error) {
          console.warn("The wedding date could not be saved for this session.", error);
        }
      }
      if (celebrate && window.gsap && !reducedMotion) {
        const revealTimeline = window.gsap.timeline({ defaults: { ease: "power2.out" } });
        revealTimeline
          .to(card.querySelector(".scratch-prompt"), { autoAlpha: 0, duration: 0.2 }, 0)
          .to(canvas, { autoAlpha: 0, duration: 0.82 }, 0)
          .fromTo(reveal, { scale: 0.96 }, { scale: 1, duration: 0.8 }, 0.08)
          .fromTo(revealNodes[0], { autoAlpha: 0, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, 0.18)
          .fromTo(revealNodes[1], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.72)
          .fromTo(revealNodes[2], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42 }, 1.06);
      } else {
        reveal.style.transform = "scale(1)";
      }
      if (celebrate) {
        launchCelebration();
        window.dispatchEvent(new CustomEvent("wedding:unlock"));
      }
    }

    function getScratchCoverage() {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      let cleared = 0;
      const samplesPerSide = 64;
      for (let row = 0; row < samplesPerSide; row += 1) {
        const y = (row + 0.5) * height / samplesPerSide;
        for (let column = 0; column < samplesPerSide; column += 1) {
          const x = (column + 0.5) * width / samplesPerSide;
          if (!context.isPointInPath(heartPath, x, y)) continue;
          const pixelX = Math.min(canvas.width - 1, Math.floor(x * pixelRatio));
          const pixelY = Math.min(canvas.height - 1, Math.floor(y * pixelRatio));
          const alpha = pixels[(pixelY * canvas.width + pixelX) * 4 + 3];
          total += 1;
          if (alpha < 35) cleared += 1;
        }
      }
      return cleared / total;
    }

    function scratchAt(event) {
      const bounds = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height
      };
      if (!context.isPointInPath(heartPath, point.x * width, point.y * height)) {
        previousPoint = null;
        return;
      }
      if (currentStroke) currentStroke.push(point);
      context.save();
      context.beginPath();
      context.clip(heartPath);
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = Math.max(30, width * 0.085);
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
      if (!context || !heartPath || revealed || (activePointerId !== null && activePointerId !== event.pointerId)) return;
      event.preventDefault();
      pointerDown = true;
      activePointerId = event.pointerId;
      previousPoint = null;
      pointerStart = { x: event.clientX, y: event.clientY };
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
    const endScratch = (event, allowTap = true) => {
      if (activePointerId !== event.pointerId) return;
      const wasTap = pointerStart
        && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 12;
      pointerDown = false;
      activePointerId = null;
      previousPoint = null;
      pointerStart = null;
      currentStroke = null;
      if (allowTap && wasTap && !revealed) {
        revealDate();
      } else if (allowTap && !revealed && getScratchCoverage() >= 0.5) {
        revealDate();
      }
    };
    canvas.addEventListener("pointerup", endScratch);
    canvas.addEventListener("pointercancel", (event) => endScratch(event, false));
    button.addEventListener("click", revealDate);

    let alreadyRevealed = false;
    try {
      alreadyRevealed = window.sessionStorage.getItem(storageKey) === "true";
    } catch (error) {
      console.warn("The saved wedding date could not be restored.", error);
    }
    if (!context || typeof Path2D === "undefined") {
      console.warn("Canvas scratching is unavailable; the tap-to-reveal option remains enabled.");
      canvas.hidden = true;
      if (alreadyRevealed) revealDate(false);
      return;
    }
    resizeCanvas();
    if (alreadyRevealed) revealDate(false);
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }
  setupScratchCard();

  function setupMemoryGallery() {
    const imageCache = new Map();
    let galleryTimer;
    let galleryTimeline;
    let requestId = 0;
    let galleryVisible = !("IntersectionObserver" in window);
    let swipeStart = null;

    function preloadSlide(index) {
      if (imageCache.has(index)) return imageCache.get(index);
      const photo = galleryPhotos[index];
      const image = new Image();
      image.decoding = "async";
      image.src = photo.src;
      imageCache.set(index, image);
      return image;
    }

    function resumeAutoplay() {
      window.clearInterval(galleryTimer);
      if (!galleryVisible || document.hidden) return;
      preloadSlide((currentGallerySlide + 1) % galleryPhotos.length);
      galleryTimer = window.setInterval(() => {
        showSlide((currentGallerySlide + 1) % galleryPhotos.length);
      }, 3000);
    }

    function showSlide(index) {
      if (index === currentGallerySlide) return;
      const id = ++requestId;
      const photo = galleryPhotos[index];
      const preloadedImage = preloadSlide(index);
      const beginTransition = () => {
        if (id !== requestId) return;
        if (galleryTimeline) {
          galleryTimeline.kill();
          window.gsap.set(galleryImage, { autoAlpha: 1, scale: 1 });
          galleryTimeline = null;
        }

        const updateImage = () => {
          galleryImage.src = photo.src;
          galleryImage.width = photo.width;
          galleryImage.height = photo.height;
          galleryImage.style.objectPosition = photo.objectPosition;
          galleryImage.classList.toggle("is-portrait", Boolean(photo.portrait));
          currentGallerySlide = index;
          updateGalleryLanguage();
        };

        if (window.gsap && !reducedMotion) {
          const timeline = window.gsap.timeline({
            onComplete: () => { galleryTimeline = null; }
          });
          galleryTimeline = timeline;
          timeline
            .to(galleryImage, { autoAlpha: 0, scale: 1.035, duration: 0.38, ease: "power1.inOut", onComplete: updateImage })
            .to(galleryImage, { autoAlpha: 1, scale: 1, duration: 0.72, ease: "power2.out" });
        } else {
          updateImage();
        }
        preloadSlide((index + 1) % galleryPhotos.length);
      };

      if (preloadedImage.complete) {
        if (preloadedImage.naturalWidth) beginTransition();
        else console.warn(`The wedding gallery image could not be loaded: ${photo.src}`);
      } else {
        preloadedImage.addEventListener("load", beginTransition, { once: true });
        preloadedImage.addEventListener("error", () => {
          console.warn(`The wedding gallery image could not be loaded: ${photo.src}`);
        }, { once: true });
      }
      resumeAutoplay();
    }

    galleryPrevious.addEventListener("click", () => {
      showSlide((currentGallerySlide - 1 + galleryPhotos.length) % galleryPhotos.length);
    });
    galleryNext.addEventListener("click", () => {
      showSlide((currentGallerySlide + 1) % galleryPhotos.length);
    });
    galleryDots.forEach((dot, index) => {
      dot.addEventListener("click", () => showSlide(index));
    });
    galleryStage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.target.closest("button")) return;
      swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      galleryStage.setPointerCapture(event.pointerId);
    });
    galleryStage.addEventListener("pointerup", (event) => {
      if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;
      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
      showSlide((currentGallerySlide + (deltaX < 0 ? 1 : -1) + galleryPhotos.length) % galleryPhotos.length);
    });
    galleryStage.addEventListener("pointercancel", () => { swipeStart = null; });
    galleryStage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide((currentGallerySlide - 1 + galleryPhotos.length) % galleryPhotos.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide((currentGallerySlide + 1) % galleryPhotos.length);
      }
    });
    document.addEventListener("visibilitychange", resumeAutoplay);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        galleryVisible = entries.some((entry) => entry.isIntersecting);
        resumeAutoplay();
      }, { threshold: 0.25 });
      observer.observe(galleryStage);
    } else {
      resumeAutoplay();
    }
  }
  setupMemoryGallery();

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
    const colors = ["#b66f75", "#d99b58", "#e8cb91", "#d7a8a4"];

    function triggerPetalBoost() {
      petalBoost = 1;
      window.clearTimeout(petalBoostTimer);
      petalBoostTimer = window.setTimeout(() => { petalBoost = 0; }, 2200);
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
