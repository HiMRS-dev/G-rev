/**
 * Ссылки на Swiper-объекты для управления слайдерами через клавиатуру
 */
let gallerySwiper;
let reviewsSwiper;
let imageModalSwiper;

/**
 * Инициализация всех компонентов при загрузке DOM
 */
document.addEventListener("DOMContentLoaded", () => {
  initIOSDebug();
  initMenu();
  initNotice();
  initFormModal();
  initContactForm();
  initGallery();
  initSwipers();
  initMap();
  initScrollAnimations();
  initKeyboardNavigation();
});

let noticeState;

function detectIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function initIOSDebug() {
  const isIOS = detectIOSDevice();
  document.documentElement.classList.toggle("is-ios", isIOS);

  const params = new URLSearchParams(window.location.search);
  const queryFlag = params.get("iosdebug");

  if (queryFlag === "1") {
    try {
      localStorage.setItem("iosDebug", "1");
    } catch (_) {
      // ignore storage errors
    }
  } else if (queryFlag === "0") {
    try {
      localStorage.removeItem("iosDebug");
    } catch (_) {
      // ignore storage errors
    }
  }

  let debugEnabled = queryFlag === "1";
  if (!debugEnabled) {
    try {
      debugEnabled = localStorage.getItem("iosDebug") === "1";
    } catch (_) {
      debugEnabled = false;
    }
  }

  if (!debugEnabled) return;

  const overlay = document.createElement("aside");
  overlay.id = "ios-debug-overlay";
  overlay.innerHTML = `
    <div class="ios-debug-head">
      <strong>iOS debug</strong>
      <button type="button" id="ios-debug-close" aria-label="Close iOS debug">x</button>
    </div>
    <pre class="ios-debug-metrics"></pre>
    <pre class="ios-debug-errors">Errors: none</pre>
  `;
  document.body.appendChild(overlay);

  const metricsEl = overlay.querySelector(".ios-debug-metrics");
  const errorsEl = overlay.querySelector(".ios-debug-errors");
  const closeBtn = overlay.querySelector("#ios-debug-close");

  const safeAreaProbe = document.createElement("div");
  safeAreaProbe.style.position = "fixed";
  safeAreaProbe.style.top = "0";
  safeAreaProbe.style.left = "0";
  safeAreaProbe.style.visibility = "hidden";
  safeAreaProbe.style.pointerEvents = "none";
  safeAreaProbe.style.paddingTop = "env(safe-area-inset-top)";
  safeAreaProbe.style.paddingRight = "env(safe-area-inset-right)";
  safeAreaProbe.style.paddingBottom = "env(safe-area-inset-bottom)";
  safeAreaProbe.style.paddingLeft = "env(safe-area-inset-left)";
  document.body.appendChild(safeAreaProbe);

  const cleanups = [];
  const bind = (target, eventName, handler, options) => {
    target.addEventListener(eventName, handler, options);
    cleanups.push(() => target.removeEventListener(eventName, handler, options));
  };

  const parsePx = (rawValue) => {
    const parsed = Number.parseFloat(String(rawValue || "").replace("px", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getSafeAreaInsets = () => {
    const styles = getComputedStyle(safeAreaProbe);
    return {
      top: parsePx(styles.paddingTop),
      right: parsePx(styles.paddingRight),
      bottom: parsePx(styles.paddingBottom),
      left: parsePx(styles.paddingLeft),
    };
  };

  const errorLines = [];
  const renderErrors = () => {
    if (!errorsEl) return;
    errorsEl.textContent = errorLines.length
      ? `Errors:\n${errorLines.join("\n")}`
      : "Errors: none";
  };

  const pushError = (message) => {
    const stamp = new Date().toISOString().slice(11, 19);
    errorLines.unshift(`[${stamp}] ${message}`);
    if (errorLines.length > 6) {
      errorLines.length = 6;
    }
    renderErrors();
  };

  bind(window, "error", (event) => {
    const source = event.filename ? event.filename.split("/").pop() : "inline";
    pushError(`${event.message} @ ${source}:${event.lineno || 0}`);
  });

  bind(window, "unhandledrejection", (event) => {
    const reason = event.reason instanceof Error
      ? event.reason.message
      : String(event.reason);
    pushError(`Promise rejection: ${reason}`);
  });

  let rafId = 0;
  const renderMetrics = () => {
    if (!metricsEl) return;

    const visualViewport = window.visualViewport;
    const safeArea = getSafeAreaInsets();
    const orientation = screen.orientation?.type ||
      (window.innerWidth > window.innerHeight ? "landscape" : "portrait");

    const lines = [
      `isIOS: ${isIOS}`,
      `viewport(inner): ${window.innerWidth} x ${window.innerHeight}`,
      `viewport(visual): ${visualViewport ? `${Math.round(visualViewport.width)} x ${Math.round(visualViewport.height)}` : "n/a"}`,
      `visual offset: ${visualViewport ? `${Math.round(visualViewport.offsetLeft)},${Math.round(visualViewport.offsetTop)}` : "n/a"}`,
      `screen: ${window.screen.width} x ${window.screen.height}`,
      `dpr: ${window.devicePixelRatio}`,
      `orientation: ${orientation}`,
      `scroll: ${Math.round(window.scrollX)},${Math.round(window.scrollY)}`,
      `safe-area: t${safeArea.top} r${safeArea.right} b${safeArea.bottom} l${safeArea.left}`,
      `menu hint: ?iosdebug=0 disables overlay`,
    ];

    metricsEl.textContent = lines.join("\n");
  };

  const scheduleRender = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      renderMetrics();
    });
  };

  bind(window, "resize", scheduleRender, { passive: true });
  bind(window, "scroll", scheduleRender, { passive: true });
  bind(window, "orientationchange", scheduleRender);
  if (window.visualViewport) {
    bind(window.visualViewport, "resize", scheduleRender);
    bind(window.visualViewport, "scroll", scheduleRender);
  }

  const intervalId = window.setInterval(scheduleRender, 1500);
  cleanups.push(() => window.clearInterval(intervalId));

  closeBtn?.addEventListener("click", () => {
    cleanups.forEach((dispose) => dispose());
    safeAreaProbe.remove();
    overlay.remove();
    try {
      localStorage.removeItem("iosDebug");
    } catch (_) {
      // ignore storage errors
    }
  });

  renderErrors();
  renderMetrics();
}

function initNotice() {
  const noticeModal = document.getElementById("noticeModal");
  if (!noticeModal) return;

  const noticeTitle = document.getElementById("noticeTitle");
  const noticeText = document.getElementById("noticeText");
  const noticeOk = document.getElementById("noticeOk");
  const noticeClose = document.getElementById("closeNotice");
  const noticeContent = noticeModal.querySelector(".notice-content");

  const closeNotice = () => {
    noticeModal.classList.remove("show");
  };

  noticeOk?.addEventListener("click", closeNotice);
  noticeClose?.addEventListener("click", closeNotice);
  noticeModal.addEventListener("click", (e) => {
    if (e.target === noticeModal) closeNotice();
  });

  noticeState = {
    noticeModal,
    noticeTitle,
    noticeText,
    noticeContent,
    closeNotice
  };
}

function showNotice(message, type = "info", title = "Уведомление") {
  if (!noticeState) return;
  const { noticeModal, noticeTitle, noticeText, noticeContent } = noticeState;
  if (!noticeModal || !noticeTitle || !noticeText || !noticeContent) return;
  noticeTitle.textContent = title;
  noticeText.textContent = message;
  noticeContent.classList.remove("success", "error");
  if (type === "success") noticeContent.classList.add("success");
  if (type === "error") noticeContent.classList.add("error");
  noticeModal.classList.add("show");
}

/**
 * Инициализация клавиатурной навигации для слайдеров
 */
function initKeyboardNavigation() {
  document.addEventListener("keydown", (e) => {
    // Стрелка вправо
    if (e.key === "ArrowRight") {
      if (imageModalSwiper && document.getElementById("imageModal").classList.contains("show")) {
        imageModalSwiper.slideNext();
      } else if (reviewsSwiper) {
        reviewsSwiper.slideNext();
      } else if (gallerySwiper) {
        gallerySwiper.slideNext();
      }
    }

    // Стрелка влево
    if (e.key === "ArrowLeft") {
      if (imageModalSwiper && document.getElementById("imageModal").classList.contains("show")) {
        imageModalSwiper.slidePrev();
      } else if (reviewsSwiper) {
        reviewsSwiper.slidePrev();
      } else if (gallerySwiper) {
        gallerySwiper.slidePrev();
      }
    }
  });
}

/**
 * Инициализация scroll-анимаций (fade-up)
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/**
 * Инициализация бургер-меню и навигации
 */
function initMenu() {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  const closeBtn = document.querySelector(".close-menu");

  if (!burger || !nav) return;

  const toggleMenu = (open) => {
    nav.classList.toggle("active", open);
    burger.classList.toggle("active", open);
    burger.setAttribute("aria-expanded", open);
  };

  burger.addEventListener("click", () => {
    const isOpen = !nav.classList.contains("active");
    toggleMenu(isOpen);
  });

  closeBtn?.addEventListener("click", () => toggleMenu(false));

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => toggleMenu(false));
  });
}

/**
 * Инициализация модального окна формы
 */
function initFormModal() {
  const modal = document.getElementById("formModal");
  const openButtons = document.querySelectorAll("#openForm, #openForm2");
  const closeButton = document.getElementById("closeForm");
  const form = document.getElementById("contactForm");
  const nameInput = form?.querySelector("input[name=\"name\"]");
  const phoneInput = form?.querySelector("input[name=\"phone\"]");
  const formStartedInput = form?.querySelector("input[name=\"form_started_at\"]");

  if (!modal) return;

  const openModal = () => {
    modal.classList.add("show");
    if (formStartedInput) {
      formStartedInput.value = String(Date.now());
    }
  };

  const closeModal = () => {
    modal.classList.remove("show");
  };

  openButtons.forEach(btn => btn.addEventListener("click", openModal));
  closeButton?.addEventListener("click", closeModal);

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "");
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/[^0-9+\-()\s]/g, "");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      noticeState?.closeNotice?.();
    }
  });
}

/**
 * Инициализация отправки формы (заявка)
 */
function initContactForm() {
  const formEl = document.getElementById("contactForm");
  if (!formEl) return;

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector("button[type=\"submit\"]");
    const honeypot = form.querySelector("input[name=\"company\"]");
    const formStarted = form.querySelector("input[name=\"form_started_at\"]");
    const rawName = String(form.name.value || "");
    const cleanName = rawName.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "").trim();
    const rawPhone = String(form.phone.value || "");
    const cleanPhone = rawPhone.replace(/[^0-9+\-()\s]/g, "").trim();

    // Anti-spam: honeypot must stay empty
    if (honeypot && honeypot.value.trim() !== "") {
      return;
    }

    // Anti-spam: minimum time on form (5s)
    if (formStarted && formStarted.value) {
      const startedAt = Number(formStarted.value);
      if (Number.isFinite(startedAt) && Date.now() - startedAt < 5000) {
        showNotice("Пожалуйста, заполните форму чуть внимательнее.", "error", "Ошибка");
        return;
      }
    }

    // Anti-spam: rate limit (1 request per 30s)
    try {
      const lastSubmit = Number(localStorage.getItem("contactFormLastSubmit"));
      if (Number.isFinite(lastSubmit) && Date.now() - lastSubmit < 30000) {
        showNotice("Слишком часто. Попробуйте позже.", "error", "Ошибка");
        return;
      }
    } catch (_) {
      // ignore storage errors
    }

    if (rawName !== cleanName) {
      form.name.value = cleanName;
    }
    if (rawPhone !== cleanPhone) {
      form.phone.value = cleanPhone;
    }

    if (!cleanName) {
      showNotice("Пожалуйста, укажите имя.", "error", "Ошибка");
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const data = {
      name: cleanName,
      phone: cleanPhone,
      age: form.age.value
    };

    try {
      if (submitBtn) submitBtn.disabled = true;
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      showNotice(
        "Спасибо! Все заявки обрабатываются с 10:00 до 19:00 по Сахалинскому времени. Мы обязательно с вами свяжемся.",
        "success",
        "Заявка принята"
      );

      try {
        localStorage.setItem("contactFormLastSubmit", String(Date.now()));
      } catch (_) {
        // ignore storage errors
      }

      form.reset();

      const closeBtn = document.querySelector("#formModal .close");
      closeBtn?.click();
    } catch (error) {
      showNotice("Не удалось отправить заявку. Попробуйте позже.", "error", "Ошибка");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/**
 * Инициализация галереи и модального окна изображений
 */
function initGallery() {
  const galleryImages = document.querySelectorAll(".mySwiper img");
  const modal = document.getElementById("imageModal");
  const closeBtn = document.getElementById("closeImageModal");
  const wrapper = modal?.querySelector(".swiper-wrapper");

  if (!galleryImages.length || !modal || !wrapper) return;

  const openModal = (images, index) => {
    wrapper.innerHTML = "";

    images.forEach(img => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide image-slide";

      const image = document.createElement("img");
      image.src = img.src;
      image.alt = img.alt || "Изображение";

      slide.appendChild(image);
      wrapper.appendChild(slide);
    });

    modal.classList.add("show");

    imageModalSwiper = new Swiper(".imageSwiper", {
      initialSlide: index,
      navigation: {
        nextEl: ".imageSwiper .swiper-button-next",
        prevEl: ".imageSwiper .swiper-button-prev",
      },
    });
  };

  const closeModal = () => {
    modal.classList.remove("show");
    imageModalSwiper?.destroy();
  };

  galleryImages.forEach((img, index) => {
    img.addEventListener("click", () => openModal(galleryImages, index));
  });

  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/**
 * Инициализация слайдеров Swiper для галереи и отзывов
 */
function initSwipers() {
  gallerySwiper = new Swiper(".mySwiper", {
    slidesPerView: 3,
    spaceBetween: 30,
    centeredSlides: true,
    slideToClickedSlide: true,
    loop: false,
    initialSlide: 1,
    resistance: true,
    resistanceRatio: 0.65,
    watchSlidesProgress: true,
    speed: 600,
    effect: "slide",
    grabCursor: true,
    navigation: {
      nextEl: "#about .swiper-button-next",
      prevEl: "#about .swiper-button-prev"
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
        centeredSlides: false
      },
      768: {
        slidesPerView: 3,
        centeredSlides: true
      }
    }
  });

  reviewsSwiper = new Swiper(".reviewsSwiper", {
    slidesPerView: 1,
    loop: true,
    navigation: {
      nextEl: ".reviewsSwiper .swiper-button-next",
      prevEl: ".reviewsSwiper .swiper-button-prev",
    },
    pagination: {
      el: ".reviewsSwiper .swiper-pagination",
      clickable: true,
    },
  });
}

function initMap() {
  const mapContainer = document.getElementById("map-container");
  const buttons = document.querySelectorAll(".location-btn");

  if (!mapContainer || !buttons.length) return;

  const maps = {
    hospital:
      "https://yandex.ru/map-widget/v1/?um=constructor%3A5c6d9dc8d250efcbe659485476780c5afa5f5fc6e3da96abfa0e0268fb0555c0&source=constructor&lang=ru_RU&scroll=true",
    khabarovsk:
      "https://yandex.ru/map-widget/v1/?um=constructor%3A373534893120773fa2c4839d3ad97d4540f7d12c7d7a4949f3a931f60b7dfe0b&source=constructor&lang=ru_RU&scroll=true",
  };

  const mapTitles = {
    hospital: "Карта студии на Больничной, 55",
    khabarovsk: "Карта студии на Хабаровской, 43",
  };

  const mapFrames = {};
  const placeholder = document.createElement("div");
  placeholder.className = "map-placeholder";
  placeholder.textContent = "Загрузка карты...";
  mapContainer.appendChild(placeholder);

  function createMapIframe(key) {
    const iframe = document.createElement("iframe");
    iframe.src = maps[key];
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.title = mapTitles[key];
    iframe.style.border = "0";
    iframe.style.display = "none";
    return iframe;
  }

  function ensureMapLoaded(key) {
    if (!maps[key]) return null;
    if (mapFrames[key]) return mapFrames[key];

    placeholder.remove();
    const iframe = createMapIframe(key);
    mapFrames[key] = iframe;
    mapContainer.appendChild(iframe);
    return iframe;
  }

  function showMap(key) {
    ensureMapLoaded(key);
    Object.entries(mapFrames).forEach(([mapKey, frame]) => {
      frame.style.display = mapKey === key ? "block" : "none";
    });
  }

  const initialActiveBtn =
    Array.from(buttons).find((btn) => btn.classList.contains("active")) || buttons[0];
  const initialKey = maps[initialActiveBtn?.dataset.map]
    ? initialActiveBtn.dataset.map
    : "hospital";

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.map === initialKey);
  });

  let desiredKey = initialKey;
  let hasLoadedMap = false;
  let mapObserver = null;

  const loadDesiredMap = () => {
    if (hasLoadedMap) return;
    hasLoadedMap = true;
    mapObserver?.disconnect();
    showMap(desiredKey);
  };

  // Lazy-load the map when user reaches the contacts section (or on old browsers: immediately).
  if ("IntersectionObserver" in window) {
    mapObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadDesiredMap();
        }
      },
      { rootMargin: "250px 0px", threshold: 0.01 }
    );
    mapObserver.observe(mapContainer);
  } else {
    loadDesiredMap();
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.map;
      if (!maps[key]) return;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      desiredKey = key;
      if (!hasLoadedMap) {
        loadDesiredMap();
        return;
      }

      showMap(desiredKey);
    });
  });
}
