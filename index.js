(
    function () {
        const panel = document.getElementById("bio");
        const link = document.getElementById("bio-link");

        function openBio(updateHash = true) {
            panel.hidden = false;
            link.setAttribute("aria-expanded", "true");
            if (updateHash) history.replaceState(null, "", "#bio");
        }

        function closeBio(updateHash = true) {
            panel.hidden = true;
            link.setAttribute("aria-expanded", "false");
            if (updateHash) history.replaceState(null, "", window.location.pathname);
        }

        function toggleBio() {
            if (panel.hidden) openBio(true);
            else closeBio(true);
        }

        // Click handler (prevents jump)
        link.addEventListener("click", (e) => {
            e.preventDefault();
            toggleBio();
        });

        // Open automatically if URL is /#bio
        if (window.location.hash === "#bio") {
            openBio(false);
        }

        // If user manually changes the hash (back/forward)
        window.addEventListener("hashchange", () => {
            if (window.location.hash === "#bio") openBio(false);
            else closeBio(false);
        });

        // Accessibility default
        link.setAttribute("aria-controls", "bio");
        link.setAttribute("aria-expanded", "false");
    }
)();