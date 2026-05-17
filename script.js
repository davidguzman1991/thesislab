const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const revealItems = document.querySelectorAll(".reveal");

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    navMenu.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => observer.observe(item));

const premiumModal = document.querySelector("[data-premium-modal]");
const premiumModalCloseItems = document.querySelectorAll("[data-premium-modal-close]");
const premiumModalCta = document.querySelector("[data-premium-modal-cta]");

const premiumModalConfig = {
  minScroll: 280,
  maxScroll: 900,
  storageKey: "thesislab_mobile_premium_modal_closed_until",
  sessionShownKey: "thesislab_mobile_premium_modal_shown",
  dismissedMs: 24 * 60 * 60 * 1000,
  mobileQuery: "(max-width: 767px)",
};

const getPremiumModalDismissedUntil = () => {
  try {
    return Number(localStorage.getItem(premiumModalConfig.storageKey) || 0);
  } catch {
    return 0;
  }
};

const isPremiumModalDismissed = () => {
  return getPremiumModalDismissedUntil() > Date.now();
};

const wasPremiumModalShownThisSession = () => {
  try {
    return sessionStorage.getItem(premiumModalConfig.sessionShownKey) === "true";
  } catch {
    return false;
  }
};

const rememberPremiumModalShownThisSession = () => {
  try {
    sessionStorage.setItem(premiumModalConfig.sessionShownKey, "true");
  } catch {
    // Session storage is optional; the in-memory flag still prevents repeat display.
  }
};

const rememberPremiumModalDismissal = () => {
  try {
    localStorage.setItem(
      premiumModalConfig.storageKey,
      String(Date.now() + premiumModalConfig.dismissedMs)
    );
  } catch {
    // If storage is blocked, keep the modal functional for the current session.
  }
};

// Shows the premium modal during mobile exploration, before the user reaches pricing.
const initPremiumMobileModal = () => {
  if (!premiumModal || !window.matchMedia(premiumModalConfig.mobileQuery).matches) {
    console.log("Popup bloqueado");
    return;
  }

  if (isPremiumModalDismissed() || wasPremiumModalShownThisSession()) {
    console.log("Popup bloqueado");
    return;
  }

  const plansSection = document.querySelector("#planes");
  let wasShownThisSession = false;
  let hasOpenedPricing = false;
  let isOpen = false;
  let scrollTicking = false;
  let lastEligibilityLog = "";

  const logPopupState = (message) => {
    if (lastEligibilityLog !== message) {
      console.log(message);
      lastEligibilityLog = message;
    }
  };

  const isInScrollRange = () => {
    return window.scrollY >= premiumModalConfig.minScroll && window.scrollY <= premiumModalConfig.maxScroll;
  };

  const markPricingAsOpened = () => {
    if (!plansSection) {
      return;
    }

    const pricingTop = plansSection.getBoundingClientRect().top + window.scrollY;
    hasOpenedPricing = window.scrollY + window.innerHeight * 0.35 >= pricingTop;
  };

  const removeScrollListener = () => {
    window.removeEventListener("scroll", handleScroll);
  };

  const isEligible = () => {
    markPricingAsOpened();

    const eligible =
      isInScrollRange() &&
      !wasShownThisSession &&
      !isPremiumModalDismissed() &&
      !hasOpenedPricing;

    logPopupState(eligible ? "Popup elegible" : "Popup bloqueado");

    return eligible;
  };

  const openModal = () => {
    if (isOpen || !isEligible()) {
      if (hasOpenedPricing || wasShownThisSession || isPremiumModalDismissed() || window.scrollY > premiumModalConfig.maxScroll) {
        removeScrollListener();
      }

      return;
    }

    wasShownThisSession = true;
    rememberPremiumModalShownThisSession();
    isOpen = true;
    removeScrollListener();
    premiumModal.hidden = false;
    requestAnimationFrame(() => premiumModal.classList.add("is-visible", "is-open"));
    console.log("Popup mostrado");
  };

  const closeModal = (shouldRemember = true) => {
    if (!isOpen) {
      return;
    }

    isOpen = false;

    if (shouldRemember) {
      rememberPremiumModalDismissal();
    }

    premiumModal.classList.remove("is-open");

    window.setTimeout(() => {
      if (!isOpen) {
        premiumModal.classList.remove("is-visible");
        premiumModal.hidden = true;
      }
    }, 330);
  };

  const handleScroll = () => {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;

    requestAnimationFrame(() => {
      scrollTicking = false;
      openModal();
    });
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };

  premiumModalCloseItems.forEach((item) => {
    item.addEventListener("click", () => closeModal());
  });

  premiumModalCta?.addEventListener("click", (event) => {
    event.preventDefault();
    closeModal();
    hasOpenedPricing = true;
    plansSection?.scrollIntoView({
      behavior: "smooth",
    });
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("keydown", handleKeydown);
  openModal();
};

initPremiumMobileModal();
