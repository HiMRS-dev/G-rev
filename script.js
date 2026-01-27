document.addEventListener("DOMContentLoaded", () => {

    // ===== MODAL =====
    const modal = document.getElementById("formModal");
    const modalContent = modal?.querySelector(".modal-content");

    const openForm = document.getElementById("openForm");
    const openForm2 = document.getElementById("openForm2");
    const closeForm = document.getElementById("closeForm");

    openForm?.addEventListener("click", () => {
        modal.classList.add("show");
    });

    openForm2?.addEventListener("click", () => {
        modal.classList.add("show");
    });

    closeForm?.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    // 🔥 Закрытие по клику вне формы
    modal?.addEventListener("click", () => {
        modal.classList.remove("show");
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


    // ===== BURGER + OVERLAY =====
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav");
    
    burger.addEventListener("click", () => {
        burger.classList.toggle("active");
        nav.classList.toggle("active");
    });
    
    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            burger.classList.remove("active");
            nav.classList.remove("active");
        });
    });
    
    // Debug: log hover on nav links
    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("mouseenter", () => {
            console.log("Hover on nav link:", link.textContent);
        });
        link.addEventListener("mouseleave", () => {
            console.log("Leave nav link:", link.textContent);
        });
    });


});
