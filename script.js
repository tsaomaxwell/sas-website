const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const menuLinks = Array.from(document.querySelectorAll(".mobile-menu a"));
const sliders = Array.from(document.querySelectorAll("[data-slider]"));
const submissionForm = document.querySelector(".submission-form");
const submissionCard = document.querySelector(".submission-card");
const submissionSuccessState = document.querySelector(".submission-success-state");
const submissionDoneButton = document.querySelector(".submission-done-button");
const uploadInput = document.querySelector(".upload-input");
const uploadFilename = document.querySelector(".upload-filename");
const joinForm = document.querySelector(".join-form");
const joinCard = document.querySelector(".join-card");
const joinSuccessState = document.querySelector(".join-success-state");
const joinResetButton = document.querySelector(".join-reset");
const subscribePopup = document.querySelector(".subscribe-modal");
const subscribePopupForm = document.querySelector(".subscribe-modal-form");
const subscribePopupSuccessState = document.querySelector(".subscribe-modal-success-state");
const subscribePopupCloseButtons = Array.from(document.querySelectorAll("[data-close-subscribe-popup]"));
const subscribePopupTriggers = Array.from(document.querySelectorAll("[data-open-subscribe-popup]"));
const homeFileNames = new Set(["", "index.html"]);
const localLinks = Array.from(document.querySelectorAll('a[href]'));
const knownHtmlFiles = new Set(["", "index.html", "events.html", "gallery.html", "about.html", "submission.html", "join.html", "privacy.html", "zine.html", "zine-view.html", "404.html"]);
const SUBSCRIBE_POPUP_DISMISSED_AT = "sas.subscribePopupDismissedAt";
const SUBSCRIBE_POPUP_SUBSCRIBED = "sas.subscribePopupSubscribed";
const SUBSCRIBE_POPUP_DELAY_MS = 1800;
const SUBSCRIBE_POPUP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const submitNetlifyForm = async (form) => {
  const formData = new FormData(form);
  const hasFileInput = Array.from(form.elements).some(
    (element) => element instanceof HTMLInputElement && element.type === "file",
  );

  if (hasFileInput) {
    const response = await fetch("/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Submission failed with status ${response.status}`);
    }

    return;
  }

  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString(),
  });

  if (!response.ok) {
    throw new Error(`Submission failed with status ${response.status}`);
  }
};

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
  const topbar = menuButton.closest(".topbar");

  const toggleMenu = (forceOpen) => {
    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : menuButton.getAttribute("aria-expanded") !== "true";

    menuButton.setAttribute("aria-expanded", String(shouldOpen));
    menuButton.classList.toggle("is-open", shouldOpen);
    mobileMenu.classList.toggle("is-open", shouldOpen);
    if (topbar) {
      topbar.classList.toggle("menu-open", shouldOpen);
    }
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

  if (slider.classList.contains("slider--carousel")) {
    const track = slider.querySelector(".slider-track");

    if (!track) {
      return;
    }

    const AUTO_ADVANCE_MS = 3000;
    const RESUME_AFTER_IDLE_MS = 10000;
    let autoAdvanceTimer = null;
    let resumeTimer = null;

    const render = (index) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("slide-active", slideIndex === index);
        slide.setAttribute("aria-hidden", String(slideIndex !== index));
      });

      track.style.transform = `translateX(-${index * 100}%)`;
    };

    const stopAutoAdvance = () => {
      if (autoAdvanceTimer) {
        window.clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
    };

    const startAutoAdvance = () => {
      stopAutoAdvance();
      autoAdvanceTimer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % slides.length;
        render(activeIndex);
      }, AUTO_ADVANCE_MS);
    };

    const scheduleResume = () => {
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
      }

      resumeTimer = window.setTimeout(() => {
        startAutoAdvance();
      }, RESUME_AFTER_IDLE_MS);
    };

    arrows.forEach((arrow) => {
      arrow.addEventListener("click", () => {
        const direction = Number(arrow.dataset.direction || 1);
        stopAutoAdvance();
        scheduleResume();
        activeIndex = (activeIndex + direction + slides.length) % slides.length;
        render(activeIndex);
      });
    });

    render(activeIndex);
    startAutoAdvance();
    return;
  }

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
  if (uploadInput && uploadFilename) {
    uploadInput.addEventListener("change", () => {
      const fileName = uploadInput.files && uploadInput.files[0] ? uploadInput.files[0].name : "No file selected";
      uploadFilename.textContent = fileName;
    });
  }

  submissionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!submissionForm.reportValidity()) {
      return;
    }

    const submitButton = submissionForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      await submitNetlifyForm(submissionForm);

      if (submissionCard && submissionSuccessState) {
        submissionSuccessState.hidden = false;
        submissionCard.classList.add("is-submitted");
        submissionCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (error) {
      window.alert("We couldn't send your submission right now. Please try again.");
      console.error(error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

if (submissionDoneButton && submissionCard && submissionSuccessState && submissionForm) {
  submissionDoneButton.addEventListener("click", () => {
    submissionForm.reset();
    submissionSuccessState.hidden = true;
    submissionCard.classList.remove("is-submitted");

    if (uploadFilename) {
      uploadFilename.textContent = "No file selected";
    }
  });
}

if (joinForm) {
  joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!joinForm.reportValidity()) {
      return;
    }

    const submitButton = joinForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      await submitNetlifyForm(joinForm);

      if (joinCard && joinSuccessState) {
        joinSuccessState.hidden = false;
        joinCard.classList.add("is-joined");
      }
    } catch (error) {
      window.alert("We couldn't subscribe you right now. Please try again.");
      console.error(error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

if (joinResetButton && joinCard && joinSuccessState && joinForm) {
  joinResetButton.addEventListener("click", () => {
    joinForm.reset();
    joinSuccessState.hidden = true;
    joinCard.classList.remove("is-joined");
  });
}

if (subscribePopup) {
  const isHomePage = homeFileNames.has(currentFileName);
  const subscribePopupFormState = subscribePopup.querySelector(".subscribe-modal-form-state");
  const subscribePopupInput = subscribePopup.querySelector(".subscribe-modal-input");
  const subscribePopupDialog = subscribePopup.querySelector(".subscribe-modal-dialog");
  const body = document.body;

  const readStorage = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures and keep the in-memory behavior.
    }
  };

  const setPopupOpen = (open) => {
    subscribePopup.hidden = !open;
    body.classList.toggle("has-subscribe-modal-open", open);
  };

  const setPopupSuccessState = (success) => {
    if (subscribePopupFormState && subscribePopupSuccessState) {
      subscribePopupFormState.hidden = success;
      subscribePopupSuccessState.hidden = !success;
    }

    if (subscribePopupDialog) {
      subscribePopupDialog.classList.toggle("is-success", success);
    }
  };

  const hasCompletedSubscription = () => readStorage(SUBSCRIBE_POPUP_SUBSCRIBED) === "true";

  const hasActiveDismissalCooldown = () => {
    const dismissedAt = Number(readStorage(SUBSCRIBE_POPUP_DISMISSED_AT) || 0);
    return dismissedAt > 0 && Date.now() - dismissedAt < SUBSCRIBE_POPUP_COOLDOWN_MS;
  };

  const openSubscribePopup = () => {
    setPopupSuccessState(false);
    setPopupOpen(true);
    if (subscribePopupInput) {
      window.setTimeout(() => subscribePopupInput.focus(), 30);
    }
  };

  const closeSubscribePopup = () => {
    if (!hasCompletedSubscription()) {
      writeStorage(SUBSCRIBE_POPUP_DISMISSED_AT, String(Date.now()));
    }
    setPopupOpen(false);
  };

  subscribePopupCloseButtons.forEach((button) => {
    button.addEventListener("click", () => closeSubscribePopup());
  });

  subscribePopupTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openSubscribePopup();
    });
  });

  if (subscribePopupForm) {
    subscribePopupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!subscribePopupForm.reportValidity()) {
        return;
      }

      const submitButton = subscribePopupForm.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        await submitNetlifyForm(subscribePopupForm);
        writeStorage(SUBSCRIBE_POPUP_SUBSCRIBED, "true");
        setPopupSuccessState(true);
      } catch (error) {
        window.alert("We couldn't subscribe you right now. Please try again.");
        console.error(error);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !subscribePopup.hidden) {
      closeSubscribePopup();
    }
  });

  if (isHomePage && !hasCompletedSubscription() && !hasActiveDismissalCooldown()) {
    window.setTimeout(() => {
      if (!hasCompletedSubscription() && !hasActiveDismissalCooldown()) {
        openSubscribePopup();
      }
    }, SUBSCRIBE_POPUP_DELAY_MS);
  }
}
