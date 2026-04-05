const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const menuLinks = Array.from(document.querySelectorAll(".mobile-menu a"));
const sliders = Array.from(document.querySelectorAll("[data-slider]"));
const submissionForm = document.querySelector(".submission-form");
const localLinks = Array.from(document.querySelectorAll('a[href]'));
const knownHtmlFiles = new Set(["", "index.html", "events.html", "about.html", "404.html"]);

const normalizeLocalTarget = (href) => {
  if (!href || href.startsWith("#")) {
    return null;
  }

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return null;
  }

  const [pathPart] = href.split(/[?#]/);
  return pathPart;
};

const getFileName = (path) => {
  if (!path || path.endsWith("/")) {
    return "";
  }

  const segments = path.split("/");
  return segments[segments.length - 1] || "";
};

const currentFileName = getFileName(window.location.pathname);

if (
  currentFileName &&
  currentFileName.endsWith(".html") &&
  !knownHtmlFiles.has(currentFileName) &&
  currentFileName !== "404.html"
) {
  window.location.replace("404.html");
}

localLinks.forEach((link) => {
  const href = link.getAttribute("href");
  const targetPath = normalizeLocalTarget(href);

  if (!targetPath) {
    return;
  }

  const fileName = getFileName(targetPath);

  if (fileName.endsWith(".html") && !knownHtmlFiles.has(fileName)) {
    link.setAttribute("href", "404.html");
  }
});

if (menuButton && mobileMenu) {
  const toggleMenu = (forceOpen) => {
    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : menuButton.getAttribute("aria-expanded") !== "true";

    menuButton.setAttribute("aria-expanded", String(shouldOpen));
    menuButton.classList.toggle("is-open", shouldOpen);
    mobileMenu.classList.toggle("is-open", shouldOpen);
  };

  menuButton.addEventListener("click", () => toggleMenu());

  mobileMenu.addEventListener("click", (event) => {
    if (event.target === mobileMenu) {
      toggleMenu(false);
    }
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMenu.classList.contains("is-open") &&
      !mobileMenu.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      toggleMenu(false);
    }
  });
}

sliders.forEach((slider) => {
  const slides = Array.from(slider.querySelectorAll(".slide"));
  const arrows = Array.from(slider.querySelectorAll(".slider-arrow"));

  if (slides.length <= 1 || arrows.length === 0) {
    return;
  }

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("slide-active"));
  activeIndex = activeIndex >= 0 ? activeIndex : 0;

  const render = (index) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("slide-active", slideIndex === index);
    });
  };

  arrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const direction = Number(arrow.dataset.direction || 1);
      activeIndex = (activeIndex + direction + slides.length) % slides.length;
      render(activeIndex);
    });
  });
});

if (submissionForm) {
  submissionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(submissionForm);
    const artistName = String(formData.get("artistName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const links = String(formData.get("links") || "").trim();

    const subject = `Submission from ${artistName || "Starving Artist Society"}`;
    const body = [
      `Artist Name: ${artistName}`,
      `Email: ${email}`,
      "",
      "Bio:",
      bio,
      "",
      "Links:",
      links,
    ].join("\n");

    window.location.href = `mailto:no-reply@google.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
