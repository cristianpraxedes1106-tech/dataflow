document.addEventListener("DOMContentLoaded", () => {

    initParticles();

    initSidebar();

    initTheme();

});


/* =========================
   PARTÍCULAS
========================= */

function initParticles() {

    if (
        typeof particlesJS === "undefined" ||
        !document.getElementById("particles-js")
    ) {
        return;
    }


    particlesJS("particles-js", {

        particles: {

            number: {
                value: 35,
                density: {
                    enable: true,
                    value_area: 900
                }
            },

            color: {
                value: "#635BFF"
            },

            opacity: {
                value: .18,
                random: true
            },

            size: {
                value: 2,
                random: true
            },

            line_linked: {

                enable: true,

                distance: 150,

                color: "#635BFF",

                opacity: .08,

                width: 1

            },

            move: {

                enable: true,

                speed: .5,

                direction: "none",

                random: true,

                straight: false,

                out_mode: "out"

            }

        },

        interactivity: {

            detect_on: "canvas",

            events: {

                onhover: {
                    enable: true,
                    mode: "grab"
                },

                resize: true

            },

            modes: {

                grab: {

                    distance: 140,

                    line_linked: {
                        opacity: .15
                    }

                }

            }

        },

        retina_detect: true

    });

}


/* =========================
   SIDEBAR
========================= */

function initSidebar() {

    const button =
        document.getElementById("sidebarToggle");

    const sidebar =
        document.getElementById("sidebar");


    if (!button || !sidebar) {
        return;
    }


    button.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}


/* =========================
   TEMA
========================= */

function initTheme() {

    const button =
        document.getElementById("themeToggle");


    if (!button) {
        return;
    }


    button.addEventListener("click", () => {

        document.body.classList.toggle("dark-mode");

        const icon =
            button.querySelector("i");


        if (
            document.body.classList.contains("dark-mode")
        ) {

            icon.className =
                "bi bi-sun-fill";

        } else {

            icon.className =
                "bi bi-moon-fill";

        }

    });

}