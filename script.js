const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const menuLinks = Array.from(document.querySelectorAll(".mobile-menu a"));
const sliders = Array.from(document.querySelectorAll("[data-slider]"));
const quizGames = Array.from(document.querySelectorAll("[data-quiz]"));
const wordSearchGames = Array.from(document.querySelectorAll("[data-word-search]"));
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
const UPCOMING_EVENT_HIDE_AT = new Date(2026, 4, 19);

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

if (Date.now() >= UPCOMING_EVENT_HIDE_AT.getTime()) {
  document.querySelectorAll("[data-upcoming-event]").forEach((eventCard) => {
    const title = eventCard.querySelector("[data-upcoming-event-title]");
    const link = eventCard.querySelector("[data-upcoming-event-link]");

    if (title) {
      title.textContent = "No events yet";
    }

    if (link) {
      link.textContent = "Subscribe to stay updated";
      link.setAttribute("href", "join.html");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });
}

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
  const isZineReader = slider.classList.contains("zine-reader");
  const mobileZineQuery = window.matchMedia("(max-width: 900px)");

  if (slides.length <= 1) {
    return;
  }

  const getRenderableSlides = () => {
    if (!isZineReader) {
      return slides;
    }

    const activeVariant = mobileZineQuery.matches ? "mobile" : "desktop";
    return slides.filter((slide) => {
      const slideVariant = slide.dataset.variant;
      return !slideVariant || slideVariant === activeVariant;
    });
  };

  let renderableSlides = getRenderableSlides();
  let activeIndex = renderableSlides.findIndex((slide) => slide.classList.contains("slide-active"));
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
      renderableSlides = getRenderableSlides();

      if (!renderableSlides.length) {
        return;
      }

      activeIndex = ((index % renderableSlides.length) + renderableSlides.length) % renderableSlides.length;

      slides.forEach((slide) => {
        const visibleIndex = renderableSlides.indexOf(slide);
        const isActive = visibleIndex === activeIndex;
        slide.classList.toggle("slide-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });

      track.style.transform = `translateX(-${activeIndex * 100}%)`;
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
        activeIndex = (activeIndex + 1) % renderableSlides.length;
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
        activeIndex = (activeIndex + direction + renderableSlides.length) % renderableSlides.length;
        render(activeIndex);
      });
    });

    render(activeIndex);
    startAutoAdvance();
    return;
  }

  const render = (index) => {
    renderableSlides = getRenderableSlides();

    if (!renderableSlides.length) {
      return;
    }

    activeIndex = ((index % renderableSlides.length) + renderableSlides.length) % renderableSlides.length;

    slides.forEach((slide) => {
      slide.classList.toggle("slide-active", renderableSlides[activeIndex] === slide);
    });
  };

  arrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const direction = Number(arrow.dataset.direction || 1);
      goToRelativeSlide(direction);
    });
  });

  const goToRelativeSlide = (direction) => {
    activeIndex = (activeIndex + direction + renderableSlides.length) % renderableSlides.length;
    render(activeIndex);
  };

  if (isZineReader) {
    let touchStartX = 0;
    let touchStartY = 0;
    let swipeBlocked = false;

    slider.addEventListener(
      "touchstart",
      (event) => {
        swipeBlocked = Boolean(
          event.target.closest(
            ".word-search-grid, .word-search-button, .quiz-option, .quiz-restart",
          ),
        );

        if (swipeBlocked) {
          return;
        }

        const [touch] = event.touches;
        if (!touch) {
          return;
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true },
    );

    slider.addEventListener(
      "touchend",
      (event) => {
        if (swipeBlocked) {
          swipeBlocked = false;
          return;
        }

        const [touch] = event.changedTouches;
        if (!touch || renderableSlides.length <= 1) {
          return;
        }

        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
          return;
        }

        goToRelativeSlide(deltaX < 0 ? 1 : -1);
      },
      { passive: true },
    );

    document.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLElement &&
        (activeElement.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName));

      if (isTyping || renderableSlides.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToRelativeSlide(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToRelativeSlide(1);
      }
    });

    const handleVariantChange = () => {
      activeIndex = 0;
      render(activeIndex);
    };

    if (typeof mobileZineQuery.addEventListener === "function") {
      mobileZineQuery.addEventListener("change", handleVariantChange);
    } else if (typeof mobileZineQuery.addListener === "function") {
      mobileZineQuery.addListener(handleVariantChange);
    }
  }

  render(activeIndex);
});

if (document.body.classList.contains("zine-view-page")) {
  try {
    window.history.pushState({ zineReaderGuard: true }, "", window.location.href);
  } catch {
    // Ignore history API failures and fall back to default browser behavior.
  }

  window.addEventListener("popstate", () => {
    window.location.href = "zine.html";
  });
}

quizGames.forEach((game) => {
  const questions = Array.from(game.querySelectorAll(".quiz-question"));
  const resultBlank = game.querySelector(".quiz-result-blank");
  const restartButton = game.querySelector(".quiz-restart");

  if (!questions.length || !resultBlank || !restartButton) {
    return;
  }

  const selections = new Map();

  const render = () => {
    questions.forEach((question) => {
      const selectedValue = selections.get(question.dataset.question || "");
      const options = Array.from(question.querySelectorAll(".quiz-option"));

      options.forEach((option) => {
        const isSelected = option.dataset.value === selectedValue;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
      });
    });

    if (selections.size !== questions.length) {
      resultBlank.textContent = "_____";
      game.classList.remove("is-complete");
      restartButton.hidden = true;
      return;
    }

    let bishopScore = 0;
    let simonScore = 0;

    selections.forEach((value) => {
      if (value === "bishop") {
        bishopScore += 1;
      } else if (value === "simon") {
        simonScore += 1;
      }
    });

    if (bishopScore > simonScore) {
      resultBlank.textContent = "Bishop";
    } else if (simonScore > bishopScore) {
      resultBlank.textContent = "Simon";
    } else {
      resultBlank.textContent = "Both";
    }

    game.classList.add("is-complete");
    restartButton.hidden = false;
  };

  questions.forEach((question) => {
    const key = question.dataset.question || "";
    const options = Array.from(question.querySelectorAll(".quiz-option"));

    options.forEach((option) => {
      option.addEventListener("click", () => {
        selections.set(key, option.dataset.value || "");
        render();
      });
    });
  });

  restartButton.addEventListener("click", () => {
    selections.clear();
    render();
  });

  render();
});

wordSearchGames.forEach((game) => {
  const gridElement = game.querySelector(".word-search-grid");
  const timerElement = game.querySelector(".word-search-timer");
  const actionButton = game.querySelector("[data-word-search-action]");
  const clueItems = Array.from(game.querySelectorAll(".word-search-clues [data-word]"));

  if (!gridElement || !timerElement || !actionButton) {
    return;
  }

  const gridRows = [
    "THREEUAHCMIT",
    "__ASKYDIVING",
    "LIFULKXZDCRB",
    "TM______ZH__",
    "DAKQLHALFEYD",
    "WSISTERAOLPO",
    "OUTVXJLSTLGE",
    "QRXCYAZATEJS",
    "XVRENOMGKOFT",
    "RIJABDCNFBWE",
    "EVYPIZZAOAK_",
    "_OTJKQ_EHML_",
    "BROHOV_DEAX_",
  ];

  const targets = [
    { word: "THREE", start: { row: 0, col: 0 }, end: { row: 0, col: 4 } },
    { word: "SKYDIVING", start: { row: 1, col: 3 }, end: { row: 1, col: 11 } },
    { word: "IMASURVIVOR", start: { row: 2, col: 1 }, end: { row: 12, col: 1 } },
    { word: "SISTER", start: { row: 5, col: 1 }, end: { row: 5, col: 6 } },
    { word: "MICHELLEOBAMA", start: { row: 0, col: 9 }, end: { row: 12, col: 9 } },
    { word: "PIZZA", start: { row: 10, col: 3 }, end: { row: 10, col: 7 } },
    { word: "LASAGNA", start: { row: 4, col: 7 }, end: { row: 10, col: 7 } },
  ];

  const totalWords = targets.length;
  const targetByWord = new Map(targets.map((target) => [target.word, target]));
  const clueByWord = new Map(clueItems.map((item) => [item.dataset.word || "", item]));
  const cells = [];
  let status = "idle";
  let isSelecting = false;
  let startCell = null;
  let activePath = [];
  let foundWords = new Set();
  let elapsedSeconds = 0;
  let timerId = null;

  const cellKey = (row, col) => `${row}:${col}`;

  const foundCellKeys = () => {
    const keys = new Set();

    foundWords.forEach((word) => {
      const target = targetByWord.get(word);
      if (!target) {
        return;
      }

      const path = getLineCells(target.start, target.end) || [];
      path.forEach(({ row, col }) => keys.add(cellKey(row, col)));
    });

    return keys;
  };

  const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);

    while (y !== 0) {
      const remainder = x % y;
      x = y;
      y = remainder;
    }

    return x || 1;
  };

  const getLineCells = (start, end) => {
    const deltaRow = end.row - start.row;
    const deltaCol = end.col - start.col;

    if (!(deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol))) {
      return null;
    }

    const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
    const divisor = gcd(deltaRow, deltaCol);
    const rowStep = steps === 0 ? 0 : deltaRow / divisor;
    const colStep = steps === 0 ? 0 : deltaCol / divisor;
    const normalizedRowStep = Math.max(-1, Math.min(1, rowStep));
    const normalizedColStep = Math.max(-1, Math.min(1, colStep));
    const path = [];

    for (let index = 0; index <= steps; index += 1) {
      const row = start.row + normalizedRowStep * index;
      const col = start.col + normalizedColStep * index;
      path.push({ row, col });
    }

    return path;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  };

  const stopTimer = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const renderGrid = ({ invalid = false } = {}) => {
    const foundKeys = foundCellKeys();
    const activeKeys = new Set(activePath.map(({ row, col }) => cellKey(row, col)));

    cells.forEach((cell) => {
      const key = cellKey(Number(cell.dataset.row), Number(cell.dataset.col));
      const isFound = foundKeys.has(key);
      const isActive = activeKeys.has(key) && !isFound;

      cell.classList.toggle("is-found", isFound);
      cell.classList.toggle("is-active", isActive);
      cell.classList.toggle("is-invalid", invalid && isActive);
    });
  };

  const renderClues = () => {
    clueItems.forEach((item) => {
      const word = item.dataset.word || "";
      item.classList.toggle("is-found", foundWords.has(word));
    });
  };

  const renderTimer = () => {
    timerElement.textContent = formatTime(elapsedSeconds);
  };

  const renderButton = () => {
    actionButton.disabled = false;
    actionButton.classList.remove("word-search-button-start", "word-search-button-complete", "word-search-button-restart");

    if (status === "idle") {
      actionButton.textContent = "Start";
      actionButton.classList.add("word-search-button-start");
      return;
    }

    if (status === "playing") {
      actionButton.textContent = "Complete";
      actionButton.classList.add("word-search-button-complete");
      actionButton.disabled = foundWords.size !== totalWords;
      return;
    }

    actionButton.textContent = "Restart";
    actionButton.classList.add("word-search-button-restart");
  };

  const resetSelection = () => {
    isSelecting = false;
    startCell = null;
    activePath = [];
    renderGrid();
  };

  const flashInvalidSelection = () => {
    renderGrid({ invalid: true });
    window.setTimeout(() => {
      resetSelection();
    }, 220);
  };

  const setStatus = (nextStatus) => {
    status = nextStatus;
    renderButton();
  };

  const startGame = () => {
    elapsedSeconds = 0;
    foundWords = new Set();
    stopTimer();
    renderTimer();
    renderClues();
    resetSelection();
    setStatus("playing");

    timerId = window.setInterval(() => {
      elapsedSeconds += 1;
      renderTimer();
    }, 1000);
  };

  const completeGame = () => {
    stopTimer();
    setStatus("completed");
  };

  const resetGame = () => {
    stopTimer();
    elapsedSeconds = 0;
    foundWords = new Set();
    renderTimer();
    renderClues();
    resetSelection();
    setStatus("idle");
  };

  const updateSelection = (nextCell) => {
    if (!startCell) {
      return;
    }

    const nextPath = getLineCells(startCell, {
      row: Number(nextCell.dataset.row),
      col: Number(nextCell.dataset.col),
    });

    if (!nextPath) {
      return;
    }

    activePath = nextPath;
    renderGrid();
  };

  const finalizeSelection = () => {
    if (!activePath.length) {
      resetSelection();
      return;
    }

    const selectedWord = activePath
      .map(({ row, col }) => gridRows[row][col])
      .join("")
      .toUpperCase();
    const selectedWordReversed = selectedWord.split("").reverse().join("");
    const matchedWord = targets.find(
      (target) =>
        !foundWords.has(target.word) &&
        (target.word === selectedWord || target.word === selectedWordReversed),
    );

    if (!matchedWord) {
      flashInvalidSelection();
      return;
    }

    foundWords.add(matchedWord.word);
    renderClues();
    resetSelection();

    if (foundWords.size === totalWords) {
      renderButton();
    }
  };

  gridRows.forEach((rowValue, rowIndex) => {
    rowValue.split("").forEach((letter, colIndex) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "word-search-cell";
      cell.dataset.row = String(rowIndex);
      cell.dataset.col = String(colIndex);
      cell.setAttribute("role", "gridcell");

      if (letter === "_") {
        cell.classList.add("is-inactive");
        cell.disabled = true;
        cell.tabIndex = -1;
        cell.setAttribute("aria-hidden", "true");
      } else {
        cell.textContent = letter.toLowerCase();
      }

      gridElement.appendChild(cell);
      cells.push(cell);
    });
  });

  gridElement.addEventListener("pointerdown", (event) => {
    if (status !== "playing") {
      return;
    }

    const cell = event.target.closest(".word-search-cell");
    if (!cell) {
      return;
    }

    event.preventDefault();
    isSelecting = true;
    startCell = {
      row: Number(cell.dataset.row),
      col: Number(cell.dataset.col),
    };
    activePath = [startCell];
    renderGrid();
  });

  gridElement.addEventListener("pointerover", (event) => {
    const cell = event.target.closest(".word-search-cell");
    if (!isSelecting || !cell) {
      return;
    }

    updateSelection(cell);
  });

  gridElement.addEventListener("pointermove", (event) => {
    if (!isSelecting) {
      return;
    }

    const hoveredCell = document.elementFromPoint(event.clientX, event.clientY)?.closest(".word-search-cell");
    if (hoveredCell) {
      updateSelection(hoveredCell);
    }
  });

  document.addEventListener("pointerup", () => {
    if (!isSelecting) {
      return;
    }

    finalizeSelection();
  });

  actionButton.addEventListener("click", () => {
    if (status === "idle") {
      startGame();
      return;
    }

    if (status === "playing" && foundWords.size === totalWords) {
      completeGame();
      return;
    }

    if (status === "completed") {
      resetGame();
    }
  });

  renderTimer();
  renderClues();
  renderButton();
  renderGrid();
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
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeSubscribePopup();
    });
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
