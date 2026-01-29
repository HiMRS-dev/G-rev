document.addEventListener("DOMContentLoaded", () => {

    // ===== MODAL =====
    const modal = document.getElementById("formModal");
    const modalContent = modal?.querySelector(".modal-content");

    const openForm = document.getElementById("openForm");
    const openForm2 = document.getElementById("openForm2");
    const closeForm = document.getElementById("closeForm");

    openForm?.addEventListener("click", () => {
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    });

    openForm2?.addEventListener("click", () => {
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    });

    closeForm?.addEventListener("click", () => {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    });

    // 🔥 Закрытие по клику вне формы
    modal?.addEventListener("click", () => {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    });

    modalContent?.addEventListener("click", (e) => {
        e.stopPropagation();
    });


    // ===== EMAILJS =====
    emailjs.init("X4SoF3cHZemSOytl_");

    const form = document.getElementById("contactForm");

    form?.addEventListener("submit", function (e) {
        e.preventDefault();

        emailjs.sendForm(
            "service_tfd3dht",
            "template_gy7d0d4",
            this
        ).then(() => {
            alert("Заявка отправлена!");
            this.reset();
            modal.classList.remove("show");
            modal.setAttribute("aria-hidden", "true");
        }, err => {
            console.error(err);
            alert("Ошибка отправки");
        });
    });


    // ===== SWIPER =====

    // --- Галерея ---
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

    // --- Отзывы ---
    new Swiper(".reviewsSwiper", {
        slidesPerView: 1,
        loop: true,

        navigation: {
            nextEl: "#reviews .swiper-button-next",
            prevEl: "#reviews .swiper-button-prev"
        },

        pagination: {
            el: "#reviews .swiper-pagination",
            clickable: true
        }
    });


    // ===== MAP =====
    const mapFrame = document.getElementById("map-frame");
    const locationButtons = document.querySelectorAll(".location-btn");

    const maps = {
        map1: "https://yandex.ru/map-widget/v1/?um=constructor%3AMAP_ID_1",
        map2: "https://yandex.ru/map-widget/v1/?um=constructor%3AMAP_ID_2"
    };

    locationButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            locationButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            mapFrame.src = maps[btn.dataset.map];
        });
    });


    // ===== IMAGE MODAL =====
    const imageModal = document.getElementById("imageModal");
    const closeImageModal = document.getElementById("closeImageModal");
    let imageSwiper;

    closeImageModal.addEventListener("click", () => {
        imageModal.classList.remove("show");
        imageModal.setAttribute("aria-hidden", "true");
        if (imageSwiper) {
            imageSwiper.destroy();
        }
    });

    imageModal.addEventListener("click", (e) => {
        if (e.target === imageModal) {
            imageModal.classList.remove("show");
            imageModal.setAttribute("aria-hidden", "true");
            if (imageSwiper) {
                imageSwiper.destroy();
            }
        }
    });

    function openImageModal(imagesSelector, startIndex) {
        const images = document.querySelectorAll(imagesSelector);
        const wrapper = document.querySelector("#imageModal .swiper-wrapper");
        wrapper.innerHTML = "";

        images.forEach(img => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            const newImg = document.createElement("img");
            newImg.src = img.src;
            newImg.alt = img.alt;
            slide.appendChild(newImg);
            wrapper.appendChild(slide);
        });

        imageModal.classList.add("show");
        imageModal.setAttribute("aria-hidden", "false");

        imageSwiper = new Swiper(".imageSwiper", {
            initialSlide: startIndex,
            navigation: {
                nextEl: "#imageModal .swiper-button-next",
                prevEl: "#imageModal .swiper-button-prev"
            }
        });
    }

    // Gallery images
    document.querySelectorAll(".mySwiper img").forEach((img, index) => {
        img.addEventListener("click", () => {
            openImageModal(".mySwiper .swiper-slide img", index);
        });
    });

    // Reviews images
    document.querySelectorAll(".reviewsSwiper img").forEach((img, index) => {
        img.addEventListener("click", () => {
            openImageModal(".reviewsSwiper .swiper-slide img", index);
        });
    });


    // ===== BURGER + OVERLAY =====
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav");
    const closeMenu = document.querySelector(".close-menu");
    
    burger.addEventListener("click", () => {
        burger.classList.toggle("active");
        nav.classList.toggle("active");
        burger.setAttribute("aria-expanded", burger.classList.contains("active"));
    });
    
    closeMenu?.addEventListener("click", () => {
        burger.classList.remove("active");
        nav.classList.remove("active");
    });
    
    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector(".header").offsetHeight;
                const elementTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementTop - headerHeight - 20; // extra space
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
            burger.classList.remove("active");
            nav.classList.remove("active");
            e.preventDefault(); // prevent default anchor jump
        });
    });


});
