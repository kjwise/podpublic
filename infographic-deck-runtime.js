(() => {
  const SITE_NAV_ENTRIES = [
    { href: "", label: "Home", ariaLabel: "Go to homepage" },
    { href: "quick-reference", label: "Quick Ref", ariaLabel: "Quick Reference Guide" },
    { href: "toc", label: "TOC", ariaLabel: "Table of Contents" },
    {
      href: "glossary-of-key-terms",
      label: "Glossary",
      ariaLabel: "Glossary of key terms",
    },
    { href: "blogs/", label: "Blogs", ariaLabel: "Read the blogs" },
    { href: "contact", label: "Contact", ariaLabel: "Contact the author" },
    { href: "search", label: "Search", ariaLabel: "Search", isSearch: true },
  ];

  function normalize(index, count) {
    if (count <= 0) return 0;
    if (index < 0) return count - 1;
    if (index >= count) return 0;
    return index;
  }

  function isStandaloneInfographicPath(pathname) {
    return /\/infographics\/[^/]+\.html$/i.test(pathname);
  }

  function isInfographicLibraryReviewPath(pathname) {
    return /\/infographic-library\/review(?:\.html)?$/i.test(pathname);
  }

  function shouldMountGlobalSiteNavigation() {
    const path = window.location.pathname || "";
    return isStandaloneInfographicPath(path) || isInfographicLibraryReviewPath(path);
  }

  function rootPrefixForInfographic() {
    const path = window.location.pathname || "";
    if (
      isStandaloneInfographicPath(path) ||
      /\/infographic-library\/[^/]+\.html$/i.test(path) ||
      isInfographicLibraryReviewPath(path)
    ) {
      return "../";
    }
    return "./";
  }

  function absoluteSiteHref(prefix, href) {
    if (!href) {
      return prefix;
    }
    return `${prefix}${href}`;
  }

  function buildSearchIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
  }

  function buildMenuIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" x2="20" y1="12" y2="12"></line>
        <line x1="4" x2="20" y1="6" y2="6"></line>
        <line x1="4" x2="20" y1="18" y2="18"></line>
      </svg>
    `;
  }

  function buildCloseIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    `;
  }

  function createNavLink(entry, prefix, mobile = false) {
    const link = document.createElement("a");
    link.href = absoluteSiteHref(prefix, entry.href);
    link.setAttribute("aria-label", entry.ariaLabel);
    if (mobile) {
      link.className = "pod-mobile-link";
    }
    if (entry.isSearch) {
      link.classList.add("search-icon");
      link.innerHTML = `${buildSearchIcon()}${mobile ? "<span>Search</span>" : ""}`;
      return link;
    }
    if (mobile) {
      const span = document.createElement("span");
      span.textContent = entry.label;
      link.appendChild(span);
      return link;
    }
    link.textContent = entry.label;
    return link;
  }

  function setLocalNavOffset(header) {
    const firstNativeNav = document.querySelector(".pod-infographic-content-shell > nav");
    if (!firstNativeNav) return;

    // If we ever re-enable a sticky top header on mobile, we can offset the
    // infographic's own sticky nav so it doesn't overlap.
    firstNativeNav.classList.add("infographic-local-nav");
    document.documentElement.style.setProperty("--ifg-global-nav-offset", "0px");
  }

  function mountGlobalSiteNavigation() {
    if (document.querySelector("[data-infographic-site-nav]")) {
      return;
    }

    if (!shouldMountGlobalSiteNavigation()) {
      return;
    }

    const prefix = rootPrefixForInfographic();
    const drawerId = "pod-mobile-drawer";
    const body = document.body;
    if (!body) {
      return;
    }

    body.classList.add("pod-infographic-nav");

    const header = document.createElement("header");
    header.className = "main-header";
    header.setAttribute("data-infographic-site-nav", "true");

    const row = document.createElement("div");
    row.className = "pod-header-row";

    const brand = document.createElement("a");
    brand.href = absoluteSiteHref(prefix, "");
    brand.className = "pod-brand";
    brand.setAttribute("aria-label", "Go to homepage");
    brand.textContent = "PATH OF THE DRAGON";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pod-mobile-menu-toggle";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", drawerId);
    toggle.innerHTML = `
      <span class="pod-icon pod-icon-menu" aria-hidden="true">${buildMenuIcon()}</span>
      <span class="pod-icon pod-icon-close" aria-hidden="true">${buildCloseIcon()}</span>
    `;

    row.appendChild(brand);
    row.appendChild(toggle);

    const nav = document.createElement("nav");
    nav.className = "main-nav pod-desktop-nav";
    nav.setAttribute("aria-label", "Main navigation");
    SITE_NAV_ENTRIES.forEach((entry) => {
      nav.appendChild(createNavLink(entry, prefix, false));
    });

    header.appendChild(row);
    header.appendChild(nav);

    const drawer = document.createElement("div");
    drawer.id = drawerId;
    drawer.className = "pod-mobile-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Main menu");
    drawer.setAttribute("hidden", "");
    SITE_NAV_ENTRIES.forEach((entry) => {
      drawer.appendChild(createNavLink(entry, prefix, true));
    });

    const podRoot = document.createElement("div");
    podRoot.className = "pod-root";

    const podPage = document.createElement("div");
    podPage.className = "pod-page";

    const contentShell = document.createElement("div");
    contentShell.className = "pod-infographic-content-shell";
    const existingNodes = Array.from(body.childNodes);
    existingNodes.forEach((node) => {
      contentShell.appendChild(node);
    });
    podPage.appendChild(contentShell);

    podRoot.appendChild(header);
    podRoot.appendChild(drawer);
    podRoot.appendChild(podPage);

    body.appendChild(podRoot);

    const setOpen = (open) => {
      body.classList.toggle("pod-mobile-nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        drawer.removeAttribute("hidden");
      } else {
        drawer.setAttribute("hidden", "");
      }
    };

    toggle.addEventListener("click", () => {
      const open = body.classList.contains("pod-mobile-nav-open");
      setOpen(!open);
    });

    drawer.addEventListener("click", (event) => {
      const link = event.target && event.target.closest ? event.target.closest("a") : null;
      if (link) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body.classList.contains("pod-mobile-nav-open")) {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && body.classList.contains("pod-mobile-nav-open")) {
        setOpen(false);
      }
      setLocalNavOffset(header);
    });

    setOpen(false);
    setLocalNavOffset(header);
  }

  function bindDeck(deck) {
    if (deck.dataset.infographicDeckBound === "true") {
      return;
    }
    deck.dataset.infographicDeckBound = "true";

    const slides = Array.from(deck.querySelectorAll("[data-infographic-slide]"));
    const dots = Array.from(deck.querySelectorAll("[data-infographic-deck-dot]"));
    const prevButton = deck.querySelector("[data-infographic-deck-prev]");
    const nextButton = deck.querySelector("[data-infographic-deck-next]");
    const currentNode = deck.querySelector("[data-infographic-deck-current]");
    const totalNode = deck.querySelector("[data-infographic-deck-total]");

    if (!slides.length) {
      return;
    }

    const count = slides.length;
    let current = 0;

    if (totalNode) {
      totalNode.textContent = String(count);
    }

    function render(index) {
      current = normalize(index, count);
      slides.forEach((slide, i) => {
        const isActive = i === current;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      dots.forEach((dot, i) => {
        const isActive = i === current;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });

      if (currentNode) {
        currentNode.textContent = String(current + 1);
      }
    }

    prevButton?.addEventListener("click", () => render(current - 1));
    nextButton?.addEventListener("click", () => render(current + 1));

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => render(i));
    });

    deck.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          render(current - 1);
          break;
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          render(current + 1);
          break;
        default:
          break;
      }
    });

    render(0);
  }

  function bindAllDecks() {
    const decks = document.querySelectorAll("[data-infographic-deck]");
    decks.forEach(bindDeck);
  }

  function initializeRuntime() {
    bindAllDecks();
    mountGlobalSiteNavigation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeRuntime);
  } else {
    initializeRuntime();
  }
})();
