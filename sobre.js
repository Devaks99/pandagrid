document.addEventListener("DOMContentLoaded", function () {
    const infoCard = document.querySelector(".info-card");
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".main-nav");

    if (infoCard) {
        setTimeout(() => {
            infoCard.classList.add("show");

            document.querySelectorAll(".description-list li").forEach((li, index) => {
                setTimeout(() => {
                    li.style.opacity = "1";
                    li.style.transform = "translateY(0)";
                }, index * 200);
            });
        }, 500);
    }

    // Menu Hamburguer
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });
});
