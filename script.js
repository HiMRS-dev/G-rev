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
  initMenu();
  initFormModal();
  initGallery();
  initSwipers();
  initLazyLoading();
  initMap();
  initScrollAnimations();
  initKeyboardNavigation();
});

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
  const formStartedInput = form?.querySelector("input[name=\"form_started_at\"]");

  if (!modal) return;

  // Создаем элемент для aria-live сообщений
  const statusMessage = document.createElement('div');
  statusMessage.setAttribute('aria-live', 'polite');
  statusMessage.setAttribute('aria-atomic', 'true');
  statusMessage.style.position = 'absolute';
  statusMessage.style.left = '-10000px';
  statusMessage.style.width = '1px';
  statusMessage.style.height = '1px';
  statusMessage.style.overflow = 'hidden';
  document.body.appendChild(statusMessage);

  const openModal = () => {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    if (formStartedInput) {
      formStartedInput.value = String(Date.now());
    }
  };

  const closeModal = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  };

  openButtons.forEach(btn => btn.addEventListener("click", openModal));
  closeButton?.addEventListener("click", closeModal);

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/**
 * Инициализация lazy loading для изображений
 */
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
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

  let imageSwiper;

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
    modal.setAttribute("aria-hidden", "false");

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
    modal.setAttribute("aria-hidden", "true");
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

  // ===== FORM SUBMIT =====
  document.getElementById("contactForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector("button[type=\"submit\"]");
    const honeypot = form.querySelector("input[name=\"company\"]");
    const formStarted = form.querySelector("input[name=\"form_started_at\"]");
    const rawName = String(form.name.value || "");
    const cleanName = rawName.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "").trim();

    // Anti-spam: honeypot must stay empty
    if (honeypot && honeypot.value.trim() !== "") {
      return;
    }

    // Anti-spam: minimum time on form (5s)
    if (formStarted && formStarted.value) {
      const startedAt = Number(formStarted.value);
      if (Number.isFinite(startedAt) && Date.now() - startedAt < 5000) {
        alert("Пожалуйста, заполните форму чуть внимательнее.");
        return;
      }
    }

    // Anti-spam: rate limit (1 request per 60s)
    try {
      const lastSubmit = Number(localStorage.getItem("contactFormLastSubmit"));
      if (Number.isFinite(lastSubmit) && Date.now() - lastSubmit < 60000) {
        alert("Слишком часто. Попробуйте позже.");
        return;
      }
    } catch (_) {
      // ignore storage errors
    }

    if (rawName !== cleanName) {
      form.name.value = cleanName;
    }

    if (!cleanName) {
      alert("Пожалуйста, введите имя без цифр.");
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const ageValue = form.age.value;
    const data = {
      name: cleanName,
      phone: form.phone.value,
      age: ageValue
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

      // ✅ УСПЕХ
      alert("Заявка отправлена");
      try {
        localStorage.setItem("contactFormLastSubmit", String(Date.now()));
      } catch (_) {
        // ignore storage errors
      }
      form.reset();

      // ✅ Закрываем модалку через существующую кнопку
      const closeBtn = document.querySelector("#formModal .close");
      if (closeBtn) {
        closeBtn.click();
      }

    } catch (error) {
      alert("Ошибка отправки заявки");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
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
      "https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A5c6d9dc8d250efcbe659485476780c5afa5f5fc6e3da96abfa0e0268fb0555c0&lang=ru_RU&scroll=true",
    khabarovsk:
      "https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A373534893120773fa2c4839d3ad97d4540f7d12c7d7a4949f3a931f60b7dfe0b&lang=ru_RU&scroll=true",
  };

  function loadMap(key) {
    // 🔥 Полностью удаляем предыдущую карту
    mapContainer.innerHTML = "";

    const script = document.createElement("script");
    script.src = maps[key];
    script.async = true;
    script.charset = "utf-8";

    mapContainer.appendChild(script);
  }

  // Карта по умолчанию
  loadMap("hospital");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.map;
      if (!maps[key]) return;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      loadMap(key);
    });
  });
}
