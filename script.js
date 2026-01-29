/**
 * Инициализация всех компонентов при загрузке DOM
 */
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initFormModal();
  initGallery();
  initSwipers();
  initLazyLoading();
});

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
  };

  const closeModal = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  };

  openButtons.forEach(btn => btn.addEventListener("click", openModal));
  closeButton?.addEventListener("click", closeModal);

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
      slide.style.backgroundImage = `url(${img.src})`;

      const image = document.createElement("img");
      image.src = img.src;
      image.alt = img.alt || "Изображение";

      slide.appendChild(image);
      wrapper.appendChild(slide);
    });

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    imageSwiper = new Swiper(".imageSwiper", {
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
    imageSwiper?.destroy();
  };

  galleryImages.forEach((img, index) => {
    img.addEventListener("click", () => openModal(galleryImages, index));
  });

  // Reviews images
  const reviewImages = document.querySelectorAll(".reviewsSwiper img");
  console.log('Review images found:', reviewImages);
  reviewImages.forEach((img, index) => {
    img.addEventListener("click", () => openModal(reviewImages, index));
  });

  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ===== FORM SUBMIT =====
  const form = document.getElementById("contactForm");

  form?.addEventListener("submit", function (e) {
    e.preventDefault();

    // Валидация
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    if (!name || !phone) {
      statusMessage.textContent = "Пожалуйста, заполните все поля.";
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Отправка...";

    emailjs.sendForm(
      "service_tfd3dht",
      "template_gy7d0d4",
      this
    ).then(() => {
      statusMessage.textContent = "Заявка отправлена успешно.";
      alert("Заявка отправлена!");
      this.reset();
      closeModal();
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }, err => {
      console.error(err);
      statusMessage.textContent = "Ошибка отправки. Проверьте подключение к интернету.";
      alert("Ошибка отправки. Проверьте подключение к интернету.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
  });
}

/**
 * Инициализация слайдеров Swiper для галереи и отзывов
 */
function initSwipers() {
  new Swiper(".mySwiper", {
    slidesPerView: 3,
    spaceBetween: 30,
    centeredSlides: true,
    slideToClickedSlide: true,
    loop: false,
    initialSlide: 1,
    resistance: true,
    resistanceRatio: 0.65,
    watchSlidesProgress: true,
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

  new Swiper(".reviewsSwiper", {
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
