// Product data lives in products-data.js and is loaded only on pages that need it.
const FALLBACK_PRODUCT_IMAGE = "assets/flower-card.svg";
const PRODUCTS_PER_PAGE = 20;
// Stem lengths come from each rose's "stems: [min, max]" in products-data.js (taken from the grower's
// catalogue). Roses without it fall back to this range.
const DEFAULT_ROSE_STEMS = [40, 70];
const CART_STORAGE_KEY = "bunchesDirectCart";
const ORDER_DETAILS_STORAGE_KEY = "bunchesDirectOrderDetails";
const CHECKOUT_SESSION_ENDPOINT = "/api/create-checkout-session";
const COOKIE_CONSENT_STORAGE_KEY = "bunchesDirectCookieConsent";

// The company's legal details. Fill these in and they appear on the legal pages and the contact page
// (German law requires these in the Impressum: legal name, address, commercial register entry and VAT ID).
// Empty fields are simply left out.
const COMPANY_DETAILS = {
    legalName: "Bunches Direct Blumenimport GmbH",
    address: "",    // e.g. "Prunus 12, 1424 LD De Kwakel, the Netherlands"
    register: "",   // commercial register entry, e.g. "HRB 12345, Amtsgericht München"
    vat: ""         // VAT number, e.g. "NL123456789B01"
};
const AVAILABILITY_ENDPOINT = "/api/availability";
const AVAILABILITY_UPLOAD_ENDPOINT = "/api/availability/upload";
const MAX_AVAILABILITY_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

// Alphabetical everywhere: the products grid and Previous/Next on the rose page use the same order
const products = (Array.isArray(window.BUNCHES_PRODUCTS) ? window.BUNCHES_PRODUCTS : [])
    .sort((a, b) => a.name.localeCompare(b.name));

const dom = {
    menuToggle: document.getElementById("menuToggle"),
    siteNav: document.getElementById("siteNav"),
    year: document.getElementById("year"),
    productGrid: document.getElementById("productGrid"),
    productSearch: document.getElementById("productSearch"),
    productColorFilter: document.getElementById("productColorFilter"),
    productPagination: document.getElementById("productPagination"),
    detailImage: document.getElementById("detailImage"),
    detailName: document.getElementById("detailName"),
    detailPackaging: document.getElementById("detailPackaging"),
    boxTypeSelect: document.getElementById("boxTypeSelect"),
    stemLengthSelect: document.getElementById("stemLengthSelect"),
    qtyMinus: document.getElementById("qtyMinus"),
    qtyPlus: document.getElementById("qtyPlus"),
    qtyValue: document.getElementById("qtyValue"),
    addBoxBtn: document.getElementById("addBoxBtn"),
    selectionSummary: document.getElementById("selectionSummary"),
    prevFlowerBtn: document.getElementById("prevFlowerBtn"),
    nextFlowerBtn: document.getElementById("nextFlowerBtn"),
    cartItems: document.getElementById("cartItems"),
    cartTotal: document.getElementById("cartTotal"),
    cartEmptyState: document.getElementById("cartEmptyState"),
    cartFilled: document.getElementById("cartFilled"),
    cartLead: document.getElementById("cartLead"),
    cartVarieties: document.getElementById("cartVarieties"),
    checkoutItems: document.getElementById("checkoutItems"),
    deliveryForm: document.getElementById("deliveryForm"),
    deliveryDateSelect: document.getElementById("deliveryDateSelect"),
    deliveryMessage: document.getElementById("deliveryMessage"),
    toPaymentBtn: document.getElementById("toPaymentBtn"),
    paymentItems: document.getElementById("paymentItems"),
    paymentTotal: document.getElementById("paymentTotal"),
    paymentForm: document.getElementById("paymentForm"),
    confirmPaymentBtn: document.getElementById("confirmPaymentBtn"),
    paymentMessage: document.getElementById("paymentMessage"),
    homeCartCount: document.getElementById("homeCartCount"),
    availabilityStatus: document.getElementById("availabilityStatus"),
    availabilityDocumentWrap: document.getElementById("availabilityDocumentWrap"),
    availabilityFrame: document.getElementById("availabilityFrame"),
    availabilityDownloadLink: document.getElementById("availabilityDownloadLink"),
    availabilityUploadForm: document.getElementById("availabilityUploadForm"),
    availabilityUploadBtn: document.getElementById("availabilityUploadBtn"),
    availabilityUploadMessage: document.getElementById("availabilityUploadMessage"),
    pdfViewerOverlay: document.getElementById("pdfViewerOverlay"),
    pdfViewerFrame: document.getElementById("pdfViewerFrame"),
    pdfViewerClose: document.getElementById("pdfViewerClose"),
    openAvailabilityBtn: document.getElementById("openAvailabilityBtn")
};

let filteredProducts = [...products];
let visibleProductCount = PRODUCTS_PER_PAGE;
let selectedProductColor = "all";
let activeDetailProduct = null;

function setupSmoothPageNavigation() {
    if (!document.body) {
        return;
    }

    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
        if (!isSmoothNavCandidate(link)) {
            return;
        }

        const prefetchTarget = () => prefetchPage(link.href);
        link.addEventListener("mouseenter", prefetchTarget, { once: true });
        link.addEventListener("touchstart", prefetchTarget, { once: true, passive: true });
    });

    scheduleIdlePagePrefetches();
    addMainPagePrerenderRules();
}

// In browsers that support it (Chrome/Edge), start rendering the main pages in the background when
// a link is hovered, so the page transition plays straight away instead of waiting for the load.
function addMainPagePrerenderRules() {
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports("speculationrules")) {
        return;
    }

    const rules = document.createElement("script");
    rules.type = "speculationrules";
    rules.textContent = JSON.stringify({
        prerender: [{
            source: "document",
            where: {
                or: ["/", "/about.html", "/contact.html", "/product-detail.html?*"].map((path) => ({ href_matches: path }))
            },
            eagerness: "moderate"
        }]
    });
    document.head.appendChild(rules);
}

function scheduleIdlePagePrefetches() {
    const idleCallback =
        window.requestIdleCallback ||
        ((callback) => window.setTimeout(callback, 350));

    const pagesToWarm = [];
    const page = document.body.dataset.page;

    if (page === "home") {
        pagesToWarm.push("/", "about.html", "contact.html", "cart.html");
    } else if (page === "products") {
        pagesToWarm.push("about.html", "contact.html", "cart.html");
    } else if (page === "about") {
        pagesToWarm.push("/", "contact.html");
    }

    if (pagesToWarm.length === 0) {
        return;
    }

    idleCallback(() => {
        pagesToWarm.forEach((target) => prefetchPage(new URL(target, window.location.href).href));
        if (page === "home") {
            prefetchPage(new URL("products-data.js", window.location.href).href, "script");
        }
    });
}

function isSmoothNavCandidate(link) {
    if (!(link instanceof HTMLAnchorElement)) {
        return false;
    }

    if (link.hasAttribute("download") || link.target === "_blank") {
        return false;
    }

    if (link.dataset.noTransition === "true") {
        return false;
    }

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return false;
    }

    let url;
    try {
        url = new URL(link.href, window.location.href);
    } catch {
        return false;
    }

    if (url.origin !== window.location.origin) {
        return false;
    }

    const current = window.location;
    const changesPage =
        url.pathname !== current.pathname ||
        url.search !== current.search;

    return changesPage;
}

function prefetchPage(href, asType = "document") {
    if (!href) {
        return;
    }

    const alreadyPrefetched = document.head.querySelector(`link[rel="prefetch"][href="${href}"]`);
    if (alreadyPrefetched) {
        return;
    }

    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.href = href;
    prefetch.as = asType;
    document.head.appendChild(prefetch);
}

// On phones the browser reports a "resize" every time the address bar slides in or out while
// scrolling. Layout code here only depends on the width, so it ignores height-only resizes
// (otherwise it would redo heavy work mid-scroll and make scrolling stutter).
function onWidthResize(callback) {
    let lastWidth = window.innerWidth;
    let frame = 0;
    window.addEventListener("resize", () => {
        if (window.innerWidth === lastWidth || frame) {
            return;
        }
        frame = window.requestAnimationFrame(() => {
            frame = 0;
            lastWidth = window.innerWidth;
            callback();
        });
    });
}

function init() {
    setupSmoothPageNavigation();
    initCookieConsentBanner();
    renderCompanyDetails();
    setYear();
    wireMobileMenu();
    wireHomeHamburger();
    markActiveNav();
    initHomeCartBadge();
    initProductsStickyHeader();
    initProductsRoseMorph();
    initProductsPage();
    initRoseCardMorph();
    initRosePageEntrance();
    initCertificationCarousel();
    initContactForm();
    initProductDetailPage();
    initCartPage();
    initOrderDetailsPage();
    initPaymentPage();
    initAvailabilityPage();
    initPdfViewerModal();
    initOrderReviewPage();
    initOrderResponsePage();
}

function initProductsStickyHeader() {
    if (document.body.dataset.page !== "products") {
        return;
    }

    const topbar = document.querySelector(".products-topbar");
    const productsContent = document.querySelector(".products-content");

    if (!topbar || !productsContent) {
        return;
    }

    let frame = 0;
    const updateHeaderBackground = () => {
        frame = 0;
        const contentTop = productsContent.getBoundingClientRect().top;
        topbar.classList.toggle("is-scrolled", contentTop <= topbar.offsetHeight);
    };

    // at most one check per frame while scrolling
    window.addEventListener("scroll", () => {
        if (!frame) {
            frame = window.requestAnimationFrame(updateHeaderBackground);
        }
    }, { passive: true });
    onWidthResize(updateHeaderBackground);
    updateHeaderBackground();
}

// The products-page rose slides from the right side (wide windows) to the bottom (narrow windows).
// CSS can't turn a width into a 0-1 ratio, so this sets --products-rose-p while the window is resized
// and the stylesheet blends the two positions with it. Keep the widths in sync with styles.css.
function initProductsRoseMorph() {
    if (document.body.dataset.page !== "products") {
        return;
    }

    const wideWidth = 1024;
    const narrowWidth = 820;

    let current = "";
    const updateRoseProgress = () => {
        const progress = (wideWidth - window.innerWidth) / (wideWidth - narrowWidth);
        const value = Math.min(1, Math.max(0, progress)).toFixed(4);
        // changing this value restyles the whole page, so only touch it when it really changes
        if (value !== current) {
            current = value;
            document.body.style.setProperty("--products-rose-p", value);
        }
    };

    onWidthResize(updateRoseProgress);
    updateRoseProgress();
}

function initPdfViewerModal() {
    const trigger = dom.openAvailabilityBtn;
    const overlay = dom.pdfViewerOverlay;
    const frame = dom.pdfViewerFrame;
    const closeBtn = dom.pdfViewerClose;

    if (!trigger || !overlay || !frame) {
        return;
    }

    const pdfUrl = trigger.getAttribute("href");

    function openViewer() {
        if (!frame.getAttribute("src")) {
            frame.setAttribute("src", pdfUrl);
        }
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("pdf-viewer-locked");
    }

    function closeViewer() {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("pdf-viewer-locked");
    }

    trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openViewer();
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", closeViewer);
    }

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeViewer();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay.classList.contains("is-open")) {
            closeViewer();
        }
    });
}

function initHomeCartBadge() {
    if (!dom.homeCartCount) {
        return;
    }

    renderHomeCartBadge();
    window.addEventListener("storage", renderHomeCartBadge);
}

function renderHomeCartBadge() {
    if (!dom.homeCartCount) {
        return;
    }

    const totalBoxes = getCartItems().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    dom.homeCartCount.textContent = String(totalBoxes);
    renderDetailCartLink(totalBoxes);
}

// "View cart" shortcut on the rose page, shown once the cart has something in it
function renderDetailCartLink(totalBoxes) {
    const link = document.getElementById("detailCartLink");
    if (!link) {
        return;
    }

    link.hidden = totalBoxes === 0;
    document.getElementById("detailCartCount").textContent = `${totalBoxes} ${totalBoxes === 1 ? "box" : "boxes"}`;
}

function setYear() {
    if (dom.year) {
        dom.year.textContent = new Date().getFullYear();
    }
}

function wireMobileMenu() {
    if (!dom.menuToggle || !dom.siteNav) {
        return;
    }

    dom.menuToggle.addEventListener("click", () => {
        const header = document.querySelector(".site-header");
        if (!header || !header.classList.contains("nav-collapsed")) {
            return;
        }

        const open = dom.siteNav.classList.toggle("open");
        dom.menuToggle.setAttribute("aria-expanded", String(open));
    });

    onWidthResize(updateResponsiveNavMode);
    window.addEventListener("load", updateResponsiveNavMode);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateResponsiveNavMode);
    }

    updateResponsiveNavMode();
}

function updateResponsiveNavMode() {
    if (!dom.menuToggle || !dom.siteNav) {
        return;
    }

    const header = document.querySelector(".site-header");
    if (!header) {
        return;
    }

    header.classList.remove("nav-collapsed");
    dom.siteNav.classList.remove("open");
    dom.menuToggle.setAttribute("aria-expanded", "false");

    const needsCollapse = window.innerWidth <= 880;
    if (needsCollapse) {
        header.classList.add("nav-collapsed");
    }
}

function wireHomeHamburger() {
    const hamburger = document.getElementById("homeHamburger");
    const drawer = document.getElementById("homeNavDrawer");
    const overlay = document.getElementById("homeNavOverlay");
    const closeBtn = document.getElementById("homeNavClose");

    if (!hamburger || !drawer) return;

    function openDrawer() {
        drawer.setAttribute("aria-hidden", "false");
        drawer.classList.add("is-open");
        hamburger.setAttribute("aria-expanded", "true");
        document.body.classList.add("nav-drawer-open");
    }

    function closeDrawer() {
        drawer.setAttribute("aria-hidden", "true");
        drawer.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-drawer-open");
    }

    hamburger.addEventListener("click", openDrawer);
    if (overlay) overlay.addEventListener("click", closeDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
    });
}

function markActiveNav() {
    const page = document.body.dataset.page;
    if (!page || !dom.siteNav) {
        return;
    }

    const links = dom.siteNav.querySelectorAll("a[data-link]");
    links.forEach((link) => {
        if (link.dataset.link === page) {
            link.classList.add("active");
        }
    });
}

function initProductsPage() {
    if (!dom.productGrid) {
        return;
    }

    filteredProducts = [...products];
    visibleProductCount = PRODUCTS_PER_PAGE;
    const savedView = takeSavedProductsView();
    if (savedView) {
        applySavedProductsView(savedView);
    } else {
        renderProductsPage();
    }

    if (dom.productSearch) {
        dom.productSearch.addEventListener("input", filterAndRenderProducts);
    }

    // Remember this view when leaving, so "All roses" / Back returns to the same spot
    window.addEventListener("pagehide", saveProductsView);
    window.addEventListener("pageswap", saveProductsView);

    if (dom.productColorFilter) {
        dom.productColorFilter.addEventListener("click", (event) => {
            const chip = event.target.closest(".rose-chip[data-color]");
            if (!chip) {
                return;
            }

            selectedProductColor = chip.dataset.color || "all";
            dom.productColorFilter.querySelectorAll(".rose-chip[data-color]").forEach((button) => {
                const isActive = button === chip;
                button.classList.toggle("is-active", isActive);
                button.setAttribute("aria-pressed", String(isActive));
            });
            filterAndRenderProducts();
            layoutColourChips();
        });
    }

    initColourChipsOverflow();
}

// ----- Returning to the same spot in the products grid -----
// When someone opens a rose and comes back ("All roses", Back, or the products link on a rose page),
// the grid is restored as they left it: search, colour, how many roses were loaded and the scroll position.
const PRODUCTS_VIEW_STORAGE_KEY = "bunchesDirectProductsView";

function saveProductsView() {
    try {
        window.sessionStorage.setItem(PRODUCTS_VIEW_STORAGE_KEY, JSON.stringify({
            search: dom.productSearch ? dom.productSearch.value : "",
            color: selectedProductColor,
            visibleCount: visibleProductCount,
            scrollY: window.scrollY
        }));
    } catch {
        // storage unavailable: the grid simply starts at the top
    }
}

function takeSavedProductsView() {
    // only restore when coming back from a rose page; arriving from anywhere else starts fresh
    const from = (window.navigation && navigation.activation && navigation.activation.from && navigation.activation.from.url) || document.referrer;
    if (!from || !from.includes("product-detail.html")) {
        return null;
    }

    try {
        const saved = JSON.parse(window.sessionStorage.getItem(PRODUCTS_VIEW_STORAGE_KEY) || "null");
        return saved && typeof saved === "object" ? saved : null;
    } catch {
        return null;
    }
}

function applySavedProductsView(view) {
    if (dom.productSearch && typeof view.search === "string") {
        dom.productSearch.value = view.search;
    }

    const chip = dom.productColorFilter && dom.productColorFilter.querySelector(`.rose-chip[data-color="${view.color}"]`);
    if (chip) {
        selectedProductColor = view.color;
        dom.productColorFilter.querySelectorAll(".rose-chip[data-color]").forEach((button) => {
            button.classList.toggle("is-active", button === chip);
            button.setAttribute("aria-pressed", String(button === chip));
        });
    }

    filterAndRenderProducts();
    if (Number(view.visibleCount) > visibleProductCount) {
        visibleProductCount = Number(view.visibleCount);
        renderProductsPage();
    }

    // card heights are fixed, so the layout is final now and the scroll lands on the right row
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }
    window.scrollTo(0, Number(view.scrollY) || 0);
}

// Keep the colour chips on one row at every screen size: chips that don't fit go behind a "More"
// chip that expands the full list.
let layoutColourChips = () => {};

function initColourChipsOverflow() {
    const wrap = dom.productColorFilter;
    if (!wrap) {
        return;
    }

    const chips = [...wrap.querySelectorAll(".rose-chip[data-color]")];
    const moreButton = document.createElement("button");
    moreButton.type = "button";
    moreButton.className = "rose-chip rose-chip-more";
    wrap.appendChild(moreButton);

    let expanded = false;

    const setMoreLabel = (hiddenCount) => {
        moreButton.innerHTML = expanded
            ? 'Less <span class="rose-chip-chevron is-up" aria-hidden="true"></span>'
            : `More (${hiddenCount}) <span class="rose-chip-chevron" aria-hidden="true"></span>`;
        moreButton.setAttribute("aria-expanded", String(expanded));
    };

    layoutColourChips = () => {
        // while collapsed into one row, the chips stretch to end exactly at the grid's right edge
        wrap.classList.toggle("is-single-row", !expanded);
        chips.forEach((chip) => {
            chip.hidden = false;
        });
        moreButton.hidden = false;

        if (expanded) {
            setMoreLabel(0);
            return;
        }

        // Hide chips from the end (never the selected one) until everything, "More" included, sits on the first row
        const activeChip = chips.find((chip) => chip.classList.contains("is-active"));
        const visible = [...chips];
        const firstRowTop = chips[0].offsetTop;
        const fitsOneRow = () => moreButton.offsetTop === firstRowTop && visible.every((chip) => chip.offsetTop === firstRowTop);

        setMoreLabel(0);
        while (!fitsOneRow() && visible.length > 1) {
            let index = visible.length - 1;
            if (visible[index] === activeChip) {
                index -= 1;
            }
            visible[index].hidden = true;
            visible.splice(index, 1);
            setMoreLabel(chips.length - visible.length);
        }

        moreButton.hidden = visible.length === chips.length;
    };

    moreButton.addEventListener("click", () => {
        expanded = !expanded;
        layoutColourChips();
    });
    onWidthResize(() => layoutColourChips());
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(layoutColourChips);
    }
    layoutColourChips();
}

// Products grid <-> rose page: the clicked white card magnifies into the rose page's photo panel,
// with the photo growing inside it
// (and back again with the browser's Back button). Both pages give the photo the same
// view-transition name; on the grid only the clicked card gets it, because each name must be unique.
function initRoseCardMorph() {
    if (!dom.productGrid) {
        return;
    }

    const clearNames = () => {
        dom.productGrid.querySelectorAll(".rose-card, .rose-card-media img").forEach((element) => {
            element.style.viewTransitionName = "";
        });
    };

    const nameCard = (card) => {
        clearNames();
        if (!card) {
            return;
        }
        card.style.viewTransitionName = "rose-panel";
        card.querySelector(".rose-card-media img").style.viewTransitionName = "rose-photo";
    };

    const cardForRoseUrl = (url) => {
        const rose = new URL(url, window.location.href).searchParams.get("rose");
        return rose
            ? [...dom.productGrid.querySelectorAll(".rose-card")].find(
                (card) => card.querySelector(".rose-card-name").textContent === rose
            )
            : null;
    };

    // leaving for a rose page
    window.addEventListener("pageswap", (event) => {
        const target = event.activation && event.activation.entry && event.activation.entry.url;
        if (event.viewTransition && target && target.includes("product-detail.html")) {
            nameCard(cardForRoseUrl(target));
        } else {
            clearNames();
        }
    });

    // coming back from a rose page
    window.addEventListener("pagereveal", (event) => {
        const from = navigation && navigation.activation && navigation.activation.from;
        if (!event.viewTransition || !from || !from.url || !from.url.includes("product-detail.html")) {
            clearNames();
            return;
        }
        const card = cardForRoseUrl(from.url);
        // after Previous/Next the rose may be elsewhere in the grid: bring its card into view first
        if (card) {
            const rect = card.getBoundingClientRect();
            const headerBottom = document.querySelector(".home-header")?.getBoundingClientRect().bottom || 0;
            if (rect.bottom < headerBottom + 60 || rect.top > window.innerHeight - 60) {
                card.scrollIntoView({ block: "center", behavior: "instant" });
            }
        }
        nameCard(card);
        addTransitionType(event.viewTransition, "rose-close");
        event.viewTransition.finished.finally(clearNames);
    });
}

// Rose page: arriving from the products grid (the photo grows out of its card)
function initRosePageEntrance() {
    if (!document.body.classList.contains("rose-detail-page")) {
        return;
    }

    // Previous / Next replace the current history entry instead of adding one, so the page
    // before this rose (normally the products grid) is always one step back.
    [dom.prevFlowerBtn, dom.nextFlowerBtn].forEach((link) => {
        if (!link) {
            return;
        }
        link.addEventListener("click", (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                return;
            }
            event.preventDefault();
            window.location.replace(link.href);
        });
    });

    // "All roses": if the grid is the previous page, go back to it instead of loading it again.
    // The browser then shows the grid it kept in memory (same scroll, every photo already loaded),
    // so the card can shrink back into place immediately.
    const backLink = document.querySelector(".rose-detail-back");
    if (backLink) {
        backLink.addEventListener("click", (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                return;
            }
            const entries = window.navigation && navigation.entries ? navigation.entries() : [];
            const current = window.navigation && navigation.currentEntry;
            const previous = current ? entries[current.index - 1] : null;
            if (previous && isProductsGridUrl(previous.url)) {
                event.preventDefault();
                history.back();
            }
        });
    }

    window.addEventListener("pagereveal", (event) => {
        const from = navigation && navigation.activation && navigation.activation.from;
        if (event.viewTransition && from && isProductsGridUrl(from.url)) {
            addTransitionType(event.viewTransition, "rose-open");
        }
    });
}

// About Us: the partner-farm certifications rotate one at a time. The dots jump to a logo;
// hovering or focusing pauses the rotation, and it doesn't rotate at all for reduced motion.
function initCertificationCarousel() {
    const stage = document.getElementById("certCarousel");
    if (!stage) {
        return;
    }

    const slides = [...stage.querySelectorAll("[data-cert-slide]")];
    const dots = [...document.querySelectorAll("[data-cert-dot]")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let timer = null;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
            slide.classList.toggle("is-active", i === current);
            slide.setAttribute("aria-hidden", String(i !== current));
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === current);
            if (i === current) {
                dot.setAttribute("aria-current", "true");
            } else {
                dot.removeAttribute("aria-current");
            }
        });
    };

    const start = () => {
        if (reduceMotion || timer) {
            return;
        }
        timer = window.setInterval(() => show(current + 1), 3200);
    };

    const stop = () => {
        window.clearInterval(timer);
        timer = null;
    };

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            show(Number(dot.dataset.certDot));
            stop();
            start();
        });
    });

    const box = stage.closest(".ab-certs");
    box.addEventListener("mouseenter", stop);
    box.addEventListener("mouseleave", start);
    box.addEventListener("focusin", stop);
    box.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
}

// "Get in Touch" form: sent through our own server (same email service as orders) and the result
// is shown inside the form.
function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) {
        return;
    }

    const status = document.getElementById("contactMessage");
    const button = form.querySelector(".ct-submit");
    const setStatus = (text, kind) => {
        if (status) {
            status.textContent = text;
            status.dataset.kind = kind || "";
        }
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) {
            return;
        }

        const data = new FormData(form);
        const payload = {
            companyName: String(data.get("companyName") || ""),
            companyEmail: String(data.get("companyEmail") || ""),
            companyPhone: String(data.get("companyPhone") || ""),
            message: String(data.get("message") || ""),
            privacyConsent: data.get("privacyConsent") === "on",
            website: String(data.get("website") || "")
        };

        const label = button.textContent;
        button.disabled = true;
        button.textContent = "Sending…";
        setStatus("");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || "Something went wrong. Please try again.");
            }

            form.reset();
            setStatus("Thank you! Your message has been sent. We'll get back to you shortly.", "success");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Something went wrong. Please try again.", "error");
        } finally {
            button.disabled = false;
            button.textContent = label;
        }
    });
}

// The products grid lives at "/" (old links to /products.html redirect there)
function isProductsGridUrl(url) {
    try {
        const { pathname } = new URL(url, window.location.href);
        return pathname === "/" || pathname.endsWith("/products.html");
    } catch {
        return false;
    }
}

// Transition types let the CSS tell opening a rose apart from closing one (newer Chrome; ignored elsewhere)
function addTransitionType(viewTransition, type) {
    try {
        viewTransition.types.add(type);
    } catch {
        // older browsers: the default crossfade is used instead
    }
}

function filterAndRenderProducts() {
    const searchTerm = dom.productSearch ? dom.productSearch.value.trim().toLowerCase() : "";
    const selectedColor = selectedProductColor;

    filteredProducts = products.filter((product) => {
        // Descriptions are placeholder text, so search only the name and the rose's colour.
        const searchable = `${product.name} ${product.color || ""}`.toLowerCase();
        const textMatch = searchable.includes(searchTerm);
        if (selectedColor === "all") {
            return textMatch;
        }

        return textMatch && product.color === selectedColor;
    });

    visibleProductCount = PRODUCTS_PER_PAGE;
    renderProductsPage();
}

function renderProductsPage() {
    const pageItems = filteredProducts.slice(0, visibleProductCount);

    renderProductCards(pageItems);
    renderProductPagination();
}

function renderProductCards(list) {
    if (!dom.productGrid) {
        return;
    }

    if (list.length === 0) {
        dom.productGrid.innerHTML = "<p class=\"rose-empty\">No roses match your search.</p>";
        return;
    }

    dom.productGrid.innerHTML = list.map((product, index) => productCardHtml(product, index)).join("");
}

function productCardHtml(product, index, extraClass = "", style = "") {
    const isAboveFold = index < 8 || extraClass.includes("rose-card-enter");
    const priority = index < 4 ? "high" : "low";

    return `
            <a class="rose-card${extraClass}" href="${getProductDetailUrl(product)}" aria-label="View details for ${product.name}"${style}>
                <div class="rose-card-media">
                    <img src="${product.image || FALLBACK_PRODUCT_IMAGE}" alt="${product.name} rose" loading="${isAboveFold ? "eager" : "lazy"}" decoding="async" fetchpriority="${priority}" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                </div>
                <h3 class="rose-card-name">${product.name}</h3>
                <p class="rose-card-colour"><span class="rose-dot rose-dot--${product.color || "mixed"}" aria-hidden="true"></span>${product.description || ""}</p>
                <div class="rose-card-footer">
                    <div>
                        <span class="rose-card-label">Stem length</span>
                        <span class="rose-card-stem">${formatStemRange(product)}</span>
                    </div>
                    <span class="rose-card-arrow" aria-hidden="true">&rarr;</span>
                </div>
            </a>
        `;
}

function getRoseStems(product) {
    const stems = product && Array.isArray(product.stems) ? product.stems : DEFAULT_ROSE_STEMS;
    return [Number(stems[0]), Number(stems[1])];
}

// [40, 60] -> "40–60 cm"
function formatStemRange(product) {
    const [min, max] = getRoseStems(product);
    return min === max ? `${min} cm` : `${min}–${max} cm`;
}

// Fills the stem length dropdown with this rose's lengths in 10 cm steps, keeping 60 cm as the
// default when the rose comes in it (otherwise the length closest to 60 cm)
function renderStemLengthOptions(product) {
    if (!dom.stemLengthSelect) {
        return;
    }
    const [min, max] = getRoseStems(product);
    const lengths = [];
    for (let length = min; length <= max; length += 10) {
        lengths.push(length);
    }
    const preferred = lengths.reduce((best, length) => (Math.abs(length - 60) < Math.abs(best - 60) ? length : best), lengths[0]);
    dom.stemLengthSelect.innerHTML = lengths
        .map((length) => `<option value="${length}" ${length === preferred ? "selected" : ""}>${length} cm</option>`)
        .join("");
}

// "Load More Roses": keep the cards already on screen and add only the next batch,
// which fades and rises in one card after another.
function loadMoreProducts() {
    const start = visibleProductCount;
    visibleProductCount += PRODUCTS_PER_PAGE;
    const batch = filteredProducts.slice(start, visibleProductCount);

    const html = batch
        .map((product, i) => productCardHtml(product, start + i, " rose-card-enter", ` style="--enter-i: ${i}"`))
        .join("");
    dom.productGrid.insertAdjacentHTML("beforeend", html);

    renderProductPagination();
}

// Start downloading the next batch's photos as soon as someone heads for the button
function preloadNextProductImages() {
    filteredProducts
        .slice(visibleProductCount, visibleProductCount + PRODUCTS_PER_PAGE)
        .forEach((product) => preloadImage(product.image));
}

function getProductDetailUrl(product) {
    const rose = encodeURIComponent(product.name);
    return `product-detail.html?rose=${rose}`;
}

function initProductDetailPage() {
    if (!dom.detailImage || !dom.detailName) {
        return;
    }

    if (products.length === 0) {
        dom.detailName.textContent = "Product unavailable";
        dom.detailImage.src = FALLBACK_PRODUCT_IMAGE;
        dom.detailImage.alt = "Product image unavailable";
        return;
    }

    const selectedRose = getRoseNameFromQuery();
    const selectedIndex = findProductIndexByName(selectedRose);
    const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const product = products[safeIndex];

    renderProductDetail(product, safeIndex);
    wireDetailQuantityControls();
}

function getRoseNameFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("rose") || "").trim();
}

function findProductIndexByName(name) {
    if (!name) {
        return -1;
    }

    const loweredName = name.toLowerCase();
    return products.findIndex((product) => product.name.toLowerCase() === loweredName);
}

function renderProductDetail(product, index) {
    const previousProduct = index > 0 ? products[index - 1] : null;
    const nextProduct = index < products.length - 1 ? products[index + 1] : null;
    activeDetailProduct = product;

    dom.detailImage.loading = "eager";
    dom.detailImage.decoding = "async";
    dom.detailImage.setAttribute("fetchpriority", "high");
    dom.detailImage.src = product.image || FALLBACK_PRODUCT_IMAGE;
    dom.detailImage.alt = `${product.name} rose`;
    dom.detailName.textContent = product.name;
    document.title = `${product.name} | Bunches Direct`;
    renderStemLengthOptions(product);

    // Warm the cache for adjacent roses so Next/Previous feels instant.
    preloadImage(previousProduct && previousProduct.image);
    preloadImage(nextProduct && nextProduct.image);

    [[dom.prevFlowerBtn, previousProduct], [dom.nextFlowerBtn, nextProduct]].forEach(([link, target]) => {
        if (!link) {
            return;
        }
        // visibility (not display) so "Next" stays on the right when there is no previous rose
        link.style.visibility = target ? "visible" : "hidden";
        if (target) {
            link.href = getProductDetailUrl(target);
            link.querySelector("[data-pager-name]").textContent = target.name;
        }
    });

    updateSelectionSummary();
}

function preloadImage(src) {
    if (!src) {
        return;
    }

    const image = new Image();
    image.src = src;
}

function wireDetailQuantityControls() {
    if (!dom.qtyMinus || !dom.qtyPlus || !dom.qtyValue || !dom.addBoxBtn) {
        return;
    }

    const defaultAddBoxLabel = dom.addBoxBtn.textContent;

    dom.qtyMinus.addEventListener("click", () => {
        const currentValue = Number(dom.qtyValue.textContent) || 1;
        const nextValue = Math.max(1, currentValue - 1);
        dom.qtyValue.textContent = String(nextValue);
        updateSelectionSummary();
    });

    dom.qtyPlus.addEventListener("click", () => {
        const currentValue = Number(dom.qtyValue.textContent) || 1;
        const nextValue = currentValue + 1;
        dom.qtyValue.textContent = String(nextValue);
        updateSelectionSummary();
    });

    if (dom.boxTypeSelect) {
        // radio buttons inside the fieldset; "change" bubbles up to it
        dom.boxTypeSelect.addEventListener("change", updateSelectionSummary);
    }

    if (dom.stemLengthSelect) {
        dom.stemLengthSelect.addEventListener("change", updateSelectionSummary);
    }

    dom.addBoxBtn.addEventListener("click", () => {
        addCurrentSelectionToCart();
        dom.addBoxBtn.textContent = "Added!";

        // briefly highlight the "View cart" link so it's clear where the roses went
        const cartLink = document.getElementById("detailCartLink");
        if (cartLink) {
            cartLink.classList.remove("is-highlighted");
            void cartLink.offsetWidth;
            cartLink.classList.add("is-highlighted");
        }
        updateSelectionSummary();

        if (dom.addBoxBtnResetTimer) {
            window.clearTimeout(dom.addBoxBtnResetTimer);
        }

        dom.addBoxBtnResetTimer = window.setTimeout(() => {
            dom.addBoxBtn.textContent = defaultAddBoxLabel;
        }, 1200);
    });
}

function addCurrentSelectionToCart() {
    if (!activeDetailProduct || !dom.qtyValue || !dom.boxTypeSelect || !dom.stemLengthSelect) {
        return;
    }

    const quantity = Number(dom.qtyValue.textContent) || 1;
    const item = {
        roseName: activeDetailProduct.name,
        image: activeDetailProduct.image || FALLBACK_PRODUCT_IMAGE,
        boxType: getSelectedBoxType(),
        stemLength: Number(dom.stemLengthSelect.value),
        quantity
    };

    const cart = getCartItems();
    const existingItem = cart.find(
        (entry) =>
            entry.roseName === item.roseName &&
            entry.boxType === item.boxType &&
            entry.stemLength === item.stemLength
    );

    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else {
        cart.push(item);
    }

    saveCartItems(cart);
}

function getCartItems() {
    try {
        const stored = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!stored) {
            return [];
        }

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCartItems(items) {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    renderHomeCartBadge();
}

const BOX_STEMS = { "Q-Box": "100–150 stems", "H-Box": "200–250 stems" };

function initCartPage() {
    if (!dom.cartItems || !dom.cartTotal || !dom.cartEmptyState || !dom.cartFilled) {
        return;
    }

    // One listener for every row: quantity steppers and remove buttons
    dom.cartItems.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const index = Number(button.dataset.index);
        const cart = getCartItems();
        const item = cart[index];
        if (!item) {
            return;
        }

        if (button.dataset.action === "remove") {
            cart.splice(index, 1);
        } else {
            const change = button.dataset.action === "increase" ? 1 : -1;
            item.quantity = Math.max(1, (Number(item.quantity) || 1) + change);
        }

        saveCartItems(cart);
        renderCartPage();
    });

    renderCartPage();
}

function renderCartPage() {
    const cart = getCartItems();
    const isEmpty = cart.length === 0;

    dom.cartEmptyState.hidden = !isEmpty;
    dom.cartFilled.hidden = isEmpty;
    if (dom.cartLead) {
        dom.cartLead.hidden = isEmpty;
    }

    if (isEmpty) {
        dom.cartItems.innerHTML = "";
        return;
    }

    dom.cartItems.innerHTML = cart
        .map((item, index) => {
            const quantity = Number(item.quantity) || 1;
            const meta = [item.boxType, BOX_STEMS[item.boxType], item.stemLength && `${item.stemLength} cm`]
                .filter(Boolean)
                .join(" · ");

            return `
            <article class="cp-item">
                <img class="cp-item-image" src="${item.image || FALLBACK_PRODUCT_IMAGE}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <div class="cp-item-copy">
                    <h3>${item.roseName}</h3>
                    <p>${meta}</p>
                </div>
                <div class="cp-qty" role="group" aria-label="Boxes of ${item.roseName}">
                    <button type="button" data-action="decrease" data-index="${index}" aria-label="One box less" ${quantity <= 1 ? "disabled" : ""}>&minus;</button>
                    <span>${quantity}</span>
                    <button type="button" data-action="increase" data-index="${index}" aria-label="One box more">+</button>
                </div>
                <button class="cp-remove" type="button" data-action="remove" data-index="${index}" aria-label="Remove ${item.roseName}">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12h9.4l.8-12M10 11v5M14 11v5" /></svg>
                </button>
            </article>`;
        })
        .join("");

    const totalBoxes = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const varieties = new Set(cart.map((item) => item.roseName)).size;
    dom.cartTotal.textContent = String(totalBoxes);
    if (dom.cartVarieties) {
        dom.cartVarieties.textContent = String(varieties);
    }
}

function buildCartItemsHtml(cart) {
    if (!Array.isArray(cart) || cart.length === 0) {
        return '<p class="dp-items-empty">Your cart is empty. <a href="/">Browse roses</a></p>';
    }

    return cart
        .map((item) => {
            const quantity = Number(item.quantity) || 1;
            const meta = [item.boxType, item.stemLength && `${item.stemLength} cm`].filter(Boolean).join(" · ");
            return `
            <div class="dp-item">
                <img src="${item.image || FALLBACK_PRODUCT_IMAGE}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <div class="dp-item-copy"><strong>${item.roseName}</strong><span>${meta}</span></div>
                <span class="dp-item-qty">${quantity} ${quantity === 1 ? "box" : "boxes"}</span>
            </div>`;
        })
        .join("");
}

function initOrderDetailsPage() {
    if (!dom.checkoutItems || !dom.deliveryForm || !dom.toPaymentBtn) {
        return;
    }

    const cart = getCartItems();
    dom.checkoutItems.innerHTML = buildCartItemsHtml(cart);
    const checkoutTotal = document.getElementById("checkoutTotal");
    if (checkoutTotal) {
        checkoutTotal.textContent = String(cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0));
    }

    if (cart.length === 0) {
        dom.toPaymentBtn.disabled = true;
        return;
    }

    hydrateDeliveryForm();

    dom.toPaymentBtn.addEventListener("click", async () => {
        if (dom.deliveryMessage) {
            dom.deliveryMessage.textContent = "";
        }
        if (!dom.deliveryForm.reportValidity()) {
            return;
        }

        const formData = new FormData(dom.deliveryForm);
        const details = {
            companyName: String(formData.get("companyName") || ""),
            companyEmail: String(formData.get("companyEmail") || ""),
            deliveryAddress: String(formData.get("deliveryAddress") || ""),
            taxVat: String(formData.get("taxVat") || ""),
            phone: String(formData.get("phone") || ""),
            contactPerson: String(formData.get("contactPerson") || ""),
            truckCompany: String(formData.get("truckCompany") || ""),
            deliveryDate: String(formData.get("deliveryDate") || ""),
            privacyConsent: formData.get("privacyConsent") === "on",
            termsConsent: formData.get("termsConsent") === "on"
        };

        // Disable button and show loading state
        dom.toPaymentBtn.disabled = true;
        const originalLabel = dom.toPaymentBtn.textContent;
        dom.toPaymentBtn.textContent = "Sending pre-order…";

        try {
            const cart = getCartItems();
            const response = await fetch("/api/place-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cartItems: cart, deliveryDetails: details })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Server error. Please try again.");
            }

            saveOrderDetails(details);

            // Show confirmation panel, hide checkout content
            const confirmSection = document.getElementById("orderConfirmation");
            const checkoutSection = document.querySelector(".checkout-content");
            if (checkoutSection) checkoutSection.hidden = true;
            if (confirmSection) {
                confirmSection.hidden = false;
                window.scrollTo({ top: 0, behavior: "smooth" });
            }

            // Clear cart after confirmed order
            localStorage.removeItem(CART_STORAGE_KEY);
            localStorage.removeItem(ORDER_DETAILS_STORAGE_KEY);
            renderHomeCartBadge();
        } catch (err) {
            dom.toPaymentBtn.disabled = false;
            dom.toPaymentBtn.textContent = originalLabel;
            const msg = err instanceof Error ? err.message : "Something went wrong.";
            if (dom.deliveryMessage) {
                dom.deliveryMessage.textContent = `Could not send your pre-order: ${msg}`;
            }
        }
    });
}

function hydrateDeliveryForm() {
    if (!dom.deliveryForm || !dom.deliveryDateSelect) {
        return;
    }

    const details = getOrderDetails();
    const setIfPresent = (name, value) => {
        const field = dom.deliveryForm.elements.namedItem(name);
        if (field && typeof value === "string" && value) {
            field.value = value;
        }
    };

    setIfPresent("companyName", details.companyName);
    setIfPresent("companyEmail", details.companyEmail);
    setIfPresent("deliveryAddress", details.deliveryAddress);
    setIfPresent("taxVat", details.taxVat);
    setIfPresent("phone", details.phone);
    setIfPresent("contactPerson", details.contactPerson);
    setIfPresent("truckCompany", details.truckCompany);

    // Render available delivery dates in select dropdown
    const availableDates = getAvailableDeliveryDates();
    if (availableDates.length === 0) {
        dom.deliveryMessage.textContent = "No delivery dates available at this time.";
        dom.deliveryDateSelect.disabled = true;
        return;
    }

    let optionsHtml = '<option value="">Select a delivery date</option>';
    availableDates.forEach((option) => {
        // Build YYYY-MM-DD from the local date; toISOString() converts to UTC and shifts it a day back in Europe
        const d = option.date;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const isSelected = details.deliveryDate === dateStr ? "selected" : "";
        optionsHtml += `<option value="${dateStr}" ${isSelected}>${option.label}</option>`;
    });

    dom.deliveryDateSelect.innerHTML = optionsHtml;
    if (dom.deliveryMessage) {
        dom.deliveryMessage.textContent = "";
    }

    // Add change listener to update message
    dom.deliveryDateSelect.addEventListener("change", () => {
        if (dom.deliveryMessage) {
            dom.deliveryMessage.textContent = "";
        }
    });
}

function getAvailableDeliveryDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function dateString(date) {
        const options = { month: "short", day: "numeric" };
        return date.toLocaleDateString("en-US", options);
    }

    function dayName(date) {
        const options = { weekday: "long" };
        return date.toLocaleDateString("en-US", options);
    }

    const available = [];

    // Find all Mondays and Thursdays for the next 5 weeks
    for (let i = 0; i < 35; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        if (day === 1) {
            // Monday - deadline is 5 days before (Wednesday of previous week)
            const deadline = new Date(date);
            deadline.setDate(deadline.getDate() - 5);

            if (today <= deadline) {
                available.push({
                    day: "Monday",
                    date: new Date(date),
                    label: `${dayName(date)}, ${dateString(date)}`
                });
            }
        } else if (day === 4) {
            // Thursday - deadline is 5 days before (Friday of previous week)
            const deadline = new Date(date);
            deadline.setDate(deadline.getDate() - 5);

            if (today <= deadline) {
                available.push({
                    day: "Thursday",
                    date: new Date(date),
                    label: `${dayName(date)}, ${dateString(date)}`
                });
            }
        }
    }

    return available;
}

function getOrderDetails() {
    try {
        const stored = window.localStorage.getItem(ORDER_DETAILS_STORAGE_KEY);
        if (!stored) {
            return {};
        }

        const parsed = JSON.parse(stored);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function saveOrderDetails(details) {
    window.localStorage.setItem(ORDER_DETAILS_STORAGE_KEY, JSON.stringify(details));
}

function initPaymentPage() {
    if (!dom.paymentItems || !dom.paymentForm || !dom.confirmPaymentBtn || !dom.paymentMessage) {
        return;
    }

    const paymentStatus = getPaymentStatus();
    if (paymentStatus === "success") {
        saveCartItems([]);
        dom.paymentItems.innerHTML = "<p>Payment received. Thank you for your order.</p>";
        if (dom.paymentTotal) {
            dom.paymentTotal.textContent = "Paid: confirmed";
        }
        dom.paymentMessage.textContent = "Payment completed securely. You can close this page.";
        dom.confirmPaymentBtn.disabled = true;
        return;
    }

    const cart = getCartItems();
    dom.paymentItems.innerHTML = buildCartItemsHtml(cart);

    const payableTotal = getCartPayableTotal(cart);
    if (dom.paymentTotal) {
        dom.paymentTotal.textContent = `Total amount due: ${formatCurrency(payableTotal)}`;
    }

    if (cart.length === 0) {
        dom.paymentMessage.textContent = "Your cart is empty. Add products before payment.";
        dom.confirmPaymentBtn.disabled = true;
        return;
    }

    if (paymentStatus === "cancelled") {
        dom.paymentMessage.textContent = "Payment was cancelled. Please try again when ready.";
    }

    dom.confirmPaymentBtn.addEventListener("click", async () => {
        const selectedMethod = dom.paymentForm.querySelector('input[name="paymentMethod"]:checked');

        if (!selectedMethod) {
            dom.paymentMessage.textContent = "Please choose credit card or bank transfer to continue.";
            return;
        }

        if (selectedMethod.value === "bank-transfer") {
            dom.paymentMessage.textContent = "Bank transfer selected. Please contact us to receive IBAN and payment reference for this order.";
            return;
        }

        await startSecureCardCheckout(cart);
    });
}

function getPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("status") || "").toLowerCase();
}

function getCartPayableTotal(cart) {
    return cart.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = getUnitPriceByRoseName(item.roseName);
        return sum + unitPrice * quantity;
    }, 0);
}

function getUnitPriceByRoseName(roseName) {
    const rose = products.find((product) => product.name === roseName);
    return rose ? Number(rose.price) || 0 : 0;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR"
    }).format(amount);
}

async function startSecureCardCheckout(cart) {
    dom.confirmPaymentBtn.disabled = true;
    dom.paymentMessage.textContent = "Redirecting to secure card checkout...";

    try {
        const response = await fetch(CHECKOUT_SESSION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ cartItems: cart })
        });

        const payload = await response.json();
        if (!response.ok || !payload.url) {
            throw new Error(payload.error || "Unable to create payment session.");
        }

        window.location.href = payload.url;
    } catch (error) {
        dom.paymentMessage.textContent = `Payment failed to start: ${error.message}`;
        dom.confirmPaymentBtn.disabled = false;
    }
}

function updateSelectionSummary() {
    if (!dom.selectionSummary || !dom.qtyValue || !dom.boxTypeSelect || !dom.stemLengthSelect) {
        return;
    }

    const qty = dom.qtyValue.textContent;
    const boxType = getSelectedBoxType();
    const stemLength = dom.stemLengthSelect.value;

    dom.selectionSummary.textContent = `Selected: ${qty} ${boxType}, ${stemLength} cm stems`;
}

function getSelectedBoxType() {
    const checked = dom.boxTypeSelect && dom.boxTypeSelect.querySelector("input[name='boxType']:checked");
    return checked ? checked.value : "Q-Box";
}

function renderProductPagination() {
    if (!dom.productPagination) {
        return;
    }

    if (filteredProducts.length === 0 || filteredProducts.length <= visibleProductCount) {
        dom.productPagination.innerHTML = "";
        return;
    }

    const shownCount = Math.min(visibleProductCount, filteredProducts.length);

    dom.productPagination.innerHTML = `
        <p class="page-indicator">Showing ${shownCount} of ${filteredProducts.length} roses</p>
        <button class="rose-load-more" id="productsLoadMoreBtn" type="button">Load More Roses</button>
    `;

    const loadMoreButton = document.getElementById("productsLoadMoreBtn");

    if (loadMoreButton) {
        loadMoreButton.addEventListener("click", loadMoreProducts);
        ["pointerenter", "focus", "touchstart"].forEach((type) => {
            loadMoreButton.addEventListener(type, preloadNextProductImages, { once: true, passive: true });
        });
    }
}

function updateCartBadge() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;
    const items = getCartItems();
    const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
}

function renderCompanyDetails() {
    const parts = [
        COMPANY_DETAILS.legalName,
        COMPANY_DETAILS.address,
        COMPANY_DETAILS.register,
        COMPANY_DETAILS.vat && `VAT ID ${COMPANY_DETAILS.vat}`
    ].filter(Boolean);

    // footer: current year, plus register / VAT numbers once they are filled in
    document.querySelectorAll("[data-year]").forEach((element) => {
        element.textContent = String(new Date().getFullYear());
    });
    const ids = [COMPANY_DETAILS.register, COMPANY_DETAILS.vat && `VAT ID ${COMPANY_DETAILS.vat}`].filter(Boolean);
    document.querySelectorAll("[data-company-ids]").forEach((element) => {
        element.textContent = ids.length ? ` · ${ids.join(" · ")}` : "";
    });

    if (parts.length === 0) {
        return;
    }

    document.querySelectorAll("[data-company-details]").forEach((element) => {
        element.textContent = parts.join(" · ");
        element.hidden = false;
    });
}

function initCookieConsentBanner() {
    if (!document.body) {
        return;
    }

    try {
        const existingConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
        if (existingConsent) {
            return;
        }
    } catch {
        return;
    }

    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.id = "cookieConsentBanner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie notice");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
        <div class="cookie-banner-inner">
            <p class="cookie-banner-title">Cookies</p>
            <p class="cookie-banner-copy">We only store your cart and order details in your browser so checkout works. No tracking or advertising cookies. More in our <a href="cookie-policy.html">Cookie Policy</a>.</p>
            <div class="cookie-banner-actions">
                <button type="button" class="btn btn-solid" data-consent="essential">OK</button>
            </div>
        </div>
    `;

    const saveConsent = (value) => {
        try {
            window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
        } catch {
            // Ignore storage errors and still close the banner.
        }

        banner.remove();
    };

    const buttons = banner.querySelectorAll("button[data-consent]");
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            saveConsent(button.dataset.consent || "essential");
        });
    });

    document.body.appendChild(banner);
}

async function initAvailabilityPage() {
    const hasViewer = Boolean(dom.availabilityStatus);
    const hasUploader = Boolean(dom.availabilityUploadForm && dom.availabilityUploadBtn && dom.availabilityUploadMessage);

    if (!hasViewer && !hasUploader) {
        return;
    }

    if (hasViewer) {
        await refreshAvailabilityDocument();
    }

    if (!hasUploader) {
        return;
    }

    dom.availabilityUploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(dom.availabilityUploadForm);
        const adminPassword = String(formData.get("adminPassword") || "").trim();
        const file = formData.get("availabilityPdf");

        if (!adminPassword) {
            setAvailabilityUploadMessage("Enter the admin password.", true);
            return;
        }

        if (!(file instanceof File) || file.size === 0) {
            setAvailabilityUploadMessage("Select a PDF file to upload.", true);
            return;
        }

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            setAvailabilityUploadMessage("Only PDF files are allowed.", true);
            return;
        }

        if (file.size > MAX_AVAILABILITY_UPLOAD_SIZE_BYTES) {
            const maxMb = Math.round(MAX_AVAILABILITY_UPLOAD_SIZE_BYTES / (1024 * 1024));
            setAvailabilityUploadMessage(`PDF is too large. Maximum file size is ${maxMb} MB.`, true);
            return;
        }

        dom.availabilityUploadBtn.disabled = true;
        const originalLabel = dom.availabilityUploadBtn.textContent;
        dom.availabilityUploadBtn.textContent = "Uploading...";
        setAvailabilityUploadMessage("Uploading the latest availability PDF...", false);

        try {
            const fileDataBase64 = await readFileAsBase64(file);
            const response = await fetch(AVAILABILITY_UPLOAD_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    adminPassword,
                    fileDataBase64
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error || "Upload failed. Please try again.");
            }

            setAvailabilityUploadMessage("Availability PDF updated successfully.", false);
            dom.availabilityUploadForm.reset();
            await refreshAvailabilityDocument(payload);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
            setAvailabilityUploadMessage(message, true);
        } finally {
            dom.availabilityUploadBtn.disabled = false;
            dom.availabilityUploadBtn.textContent = originalLabel;
        }
    });
}

async function refreshAvailabilityDocument(prefetchedPayload) {
    if (!dom.availabilityStatus) {
        return;
    }

    dom.availabilityStatus.textContent = "Loading the latest availability file...";

    try {
        // First try to fetch from API (if server is available)
        let payload = prefetchedPayload;
        if (!payload) {
            try {
                payload = await fetchAvailabilityPayload();
            } catch {
                // API unavailable (GitHub Pages static site), use direct file path
                payload = null;
            }
        }

        // If no API payload, try direct file path
        if (!payload) {
            const directUrl = "/assets/availability/latest-availability.pdf";
            const headResponse = await fetch(directUrl, { method: "HEAD", cache: "no-store" }).catch(() => null);
            if (headResponse && headResponse.ok) {
                payload = {
                    available: true,
                    url: directUrl,
                    updatedAt: Date.now()
                };
            }
        }

        const hasPdf = payload && payload.available === true && typeof payload.url === "string" && payload.url;

        if (!hasPdf) {
            dom.availabilityStatus.textContent = "No availability PDF has been uploaded yet. Please check again later.";
            if (dom.availabilityDocumentWrap) {
                dom.availabilityDocumentWrap.hidden = true;
            }
            return;
        }

        const versionedUrl = buildVersionedAvailabilityUrl(payload.url, payload.updatedAt);

        if (dom.availabilityFrame) {
            dom.availabilityFrame.src = `${versionedUrl}#toolbar=1&navpanes=0`;
        }

        if (dom.availabilityDownloadLink) {
            dom.availabilityDownloadLink.href = versionedUrl;
        }

        if (dom.availabilityDocumentWrap) {
            dom.availabilityDocumentWrap.hidden = false;
        }

        const updatedText = formatAvailabilityUpdatedAt(payload.updatedAt);
        dom.availabilityStatus.textContent = updatedText
            ? `Latest file updated on ${updatedText}.`
            : "Latest availability file:";
    } catch {
        dom.availabilityStatus.textContent = "Unable to load the availability PDF right now. Please refresh and try again.";
        if (dom.availabilityDocumentWrap) {
            dom.availabilityDocumentWrap.hidden = true;
        }
    }
}

async function fetchAvailabilityPayload() {
    const response = await fetch(AVAILABILITY_ENDPOINT, {
        cache: "no-store"
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not fetch availability data.");
    }

    return payload;
}

function buildVersionedAvailabilityUrl(url, updatedAt) {
    const baseUrl = String(url || "").trim();
    const version = Number(updatedAt) || Date.now();
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}v=${version}`;
}

function formatAvailabilityUpdatedAt(updatedAt) {
    const numericValue = Number(updatedAt);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return "";
    }

    return new Date(numericValue).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const dataUrl = String(reader.result || "");
            const commaIndex = dataUrl.indexOf(",");
            if (commaIndex < 0) {
                reject(new Error("Invalid file encoding."));
                return;
            }

            resolve(dataUrl.slice(commaIndex + 1));
        };

        reader.onerror = () => {
            reject(new Error("Could not read the selected PDF file."));
        };

        reader.readAsDataURL(file);
    });
}

function setAvailabilityUploadMessage(message, isError) {
    if (!dom.availabilityUploadMessage) {
        return;
    }

    dom.availabilityUploadMessage.textContent = message;
    dom.availabilityUploadMessage.classList.toggle("is-error", isError);
}

// ----- Order review (office) and order response (client) -----
// Both pages are opened from links in the order emails:
//   order-review.html?id=…&token=…&mode=accept|edit      the office accepts, changes or cancels a new order
//   order-response.html?id=…&token=…&choice=accept|decline the client answers the office's changes
// The token in the link is what gives access; the server checks it on every request.
const ORDER_BOX_TYPES = ["Q-Box", "H-Box"];
const ORDER_STEM_LENGTHS = [40, 50, 60, 70, 80, 90];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getOrderLinkParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get("id") || "",
        token: params.get("token") || "",
        mode: params.get("mode") || "",
        choice: params.get("choice") || ""
    };
}

// Without an action: loads the order. With one: POSTs it (accept, propose, cancel, respond).
async function orderRequest(link, action, body = {}) {
    const base = `/api/orders/${encodeURIComponent(link.id)}`;
    const response = action
        ? await fetch(`${base}/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: link.token, ...body })
        })
        : await fetch(`${base}?token=${encodeURIComponent(link.token)}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || "Something went wrong. Please try again.");
        error.order = data.order;
        throw error;
    }
    return data;
}

function setOrderHeading(reference, titleHtml, lead) {
    const ref = document.getElementById("orderRef");
    const title = document.getElementById("orderTitle");
    const leadElement = document.getElementById("orderLead");
    if (ref) ref.textContent = reference;
    if (title) title.innerHTML = titleHtml;
    if (leadElement) {
        leadElement.textContent = lead;
        leadElement.hidden = !lead;
    }
}

// "2026-10-15" -> "Thursday 15 October 2026"
function formatOrderDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) {
        return String(value || "-");
    }
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function orderItemImage(item) {
    const product = products.find((entry) => entry.name === item.roseName);
    return item.image || (product && product.image) || FALLBACK_PRODUCT_IMAGE;
}

function orderTotalBoxes(items) {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function orderItemsHtml(items) {
    return items
        .map((item) => {
            const quantity = Number(item.quantity) || 1;
            const meta = [item.boxType, item.stemLength && `${item.stemLength} cm`].filter(Boolean).join(" · ");
            return `
            <div class="dp-item">
                <img src="${escapeHtml(orderItemImage(item))}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <div class="dp-item-copy"><strong>${escapeHtml(item.roseName)}</strong><span>${escapeHtml(meta)}</span></div>
                <span class="dp-item-qty">${quantity} ${quantity === 1 ? "box" : "boxes"}</span>
            </div>`;
        })
        .join("");
}

function orderDetailsHtml(details) {
    const rows = [
        ["Company", details.companyName],
        ["Contact person", details.contactPerson],
        ["Email", details.companyEmail],
        ["Phone", details.phone],
        ["Tax / VAT #", details.taxVat],
        ["Delivery address", details.deliveryAddress],
        ["Truck company in Aalsmeer", details.truckCompany]
    ];
    return `<dl class="or-details">${rows
        .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "-")}</dd>`)
        .join("")}</dl>`;
}

function orderSummaryLinesHtml(deliveryDate, items) {
    return `
        <p class="or-summary-line"><span>Delivery</span><strong>${escapeHtml(formatOrderDate(deliveryDate))}</strong></p>
        <div class="dp-summary-total"><span>Total boxes</span><span>${orderTotalBoxes(items)}</span></div>`;
}

function orderDoneHtml(heading, text, icon = "&#10003;") {
    return `
        <div class="dp-done-card">
            <span class="dp-done-icon" aria-hidden="true">${icon}</span>
            <h1>${escapeHtml(heading)}</h1>
            <p>${escapeHtml(text)}</p>
        </div>`;
}

// Runs a button's action: disables it and shows progress, then hands the result (or error) on
function runOrderButton(button, busyLabel, task) {
    const message = document.getElementById("orderActionMessage");
    const label = button.textContent;
    button.disabled = true;
    button.textContent = busyLabel;
    if (message) message.textContent = "";

    return task().catch((error) => {
        button.disabled = false;
        button.textContent = label;
        if (message) message.textContent = error.message;
        return Promise.reject(error);
    });
}

// ----- Office: order-review.html -----
function initOrderReviewPage() {
    const root = document.getElementById("orderReviewRoot");
    if (!root) {
        return;
    }

    const link = getOrderLinkParams();
    const state = {
        order: null,
        mode: link.mode === "edit" ? "edit" : "accept",
        items: [],
        deliveryDate: "",
        note: ""
    };

    // The editable copy starts from the changes already sent (if any), otherwise from the client's order
    function resetDraft() {
        const source = state.order.proposal || {
            cartItems: state.order.cartItems,
            deliveryDate: state.order.deliveryDetails.deliveryDate,
            note: ""
        };
        state.items = source.cartItems.map((item) => ({ ...item }));
        state.deliveryDate = source.deliveryDate;
        state.note = source.note || "";
    }

    function setMode(mode) {
        state.mode = mode;
        const url = new URL(window.location.href);
        url.searchParams.set("mode", mode);
        window.history.replaceState(null, "", url);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function render() {
        const order = state.order;
        const company = order.deliveryDetails.companyName || "Client";

        if (order.status === "accepted" || order.status === "cancelled") {
            const accepted = order.status === "accepted";
            setOrderHeading(`Order ${order.id}`, accepted ? "Order <span>accepted</span>" : "Order <span>cancelled</span>", "");
            root.innerHTML = orderDoneHtml(
                accepted ? "This order is accepted" : "This order is cancelled",
                accepted ? `${company} has been told the order is being processed.` : `${company} has been told the order is cancelled.`,
                accepted ? "&#10003;" : "&times;"
            );
            return;
        }

        // Once changes are sent, the original can no longer be accepted; only re-sent changes or a cancel
        if (order.status === "awaiting_client") {
            state.mode = "edit";
        }

        if (state.mode === "accept") {
            setOrderHeading(`New order · ${order.id}`, `Accept <span>order</span>`, `${company} placed this order. Check it and accept it, or change it first.`);
            root.innerHTML = `
            <div class="dp-layout">
                <div class="dp-card">
                    <h2 class="dp-section-title">Roses ordered</h2>
                    <div class="dp-items">${orderItemsHtml(order.cartItems)}</div>
                    <hr class="dp-divider">
                    <h2 class="dp-section-title">Delivery details</h2>
                    ${orderDetailsHtml(order.deliveryDetails)}
                </div>
                <aside class="dp-summary">
                    <h2>Your decision</h2>
                    ${orderSummaryLinesHtml(order.deliveryDetails.deliveryDate, order.cartItems)}
                    <button class="dp-submit" type="button" data-order-action="accept">Accept order</button>
                    <p id="orderActionMessage" class="dp-message" role="alert"></p>
                    <p class="or-hint">The client gets an email that the order is accepted and being processed.</p>
                    <p class="or-alt">Something not right? <button class="or-link" type="button" data-order-mode="edit">Change or cancel the order</button></p>
                </aside>
            </div>`;
            return;
        }

        const roseOptions = products
            .map((product) => `<option value="${escapeHtml(product.name)}">${escapeHtml(product.name)}</option>`)
            .join("");
        const banner = order.status === "awaiting_client"
            ? `<p class="or-banner">You already sent changes to ${escapeHtml(company)}. They haven't answered yet. Sending again replaces those changes.</p>`
            : "";

        setOrderHeading(`Order ${order.id}`, `Change <span>order</span>`, `Edit ${company}'s order and send it back. They can accept the new version or decline it.`);
        root.innerHTML = `
            ${banner}
            <div class="dp-layout">
                <div class="dp-card">
                    <h2 class="dp-section-title">Roses</h2>
                    <div class="or-edit-list">${state.items.length === 0 ? '<p class="dp-items-empty">No roses left. Add one below, or cancel the whole order.</p>' : state.items.map(editRowHtml).join("")}</div>
                    <div class="or-add-row">
                        <div class="dp-select">
                            <select id="orderAddRose" aria-label="Rose to add">
                                <option value="">Add a rose…</option>
                                ${roseOptions}
                            </select>
                        </div>
                        <button class="or-secondary" type="button" data-edit-action="add">Add</button>
                    </div>

                    <hr class="dp-divider">

                    <div class="dp-grid">
                        <div class="dp-field">
                            <label for="orderDeliveryDate">Delivery date</label>
                            <input id="orderDeliveryDate" type="date" value="${escapeHtml(state.deliveryDate)}" required>
                        </div>
                        <div class="dp-field dp-field-wide">
                            <label for="orderNote">Message to the client <em class="or-optional">(optional)</em></label>
                            <textarea id="orderNote" rows="4" maxlength="2000" placeholder="e.g. Aloha is sold out this week, so we replaced it with Vendela.">${escapeHtml(state.note)}</textarea>
                        </div>
                    </div>

                    <hr class="dp-divider">
                    <h2 class="dp-section-title">Delivery details</h2>
                    ${orderDetailsHtml(order.deliveryDetails)}
                </div>
                <aside class="dp-summary">
                    <h2>Send to client</h2>
                    ${orderSummaryLinesHtml(state.deliveryDate, state.items)}
                    <button class="dp-submit" type="button" data-order-action="propose" ${state.items.length === 0 ? "disabled" : ""}>Send changes to client</button>
                    <p id="orderActionMessage" class="dp-message" role="alert"></p>
                    <p class="or-hint">${escapeHtml(company)} gets an email with the new order and two buttons: accept or decline. If they decline, the order is cancelled.</p>
                    ${order.status === "pending" ? '<p class="or-alt">Order fine after all? <button class="or-link" type="button" data-order-mode="accept">Accept it as it is</button></p>' : ""}
                    <p class="or-alt"><button class="or-link or-danger" type="button" data-order-action="cancel">Cancel the whole order</button></p>
                </aside>
            </div>`;
    }

    function editRowHtml(item, index) {
        const quantity = Number(item.quantity) || 1;
        const boxOptions = ORDER_BOX_TYPES
            .map((type) => `<option value="${type}" ${item.boxType === type ? "selected" : ""}>${type}</option>`)
            .join("");
        const stemOptions = ORDER_STEM_LENGTHS
            .map((length) => `<option value="${length}" ${Number(item.stemLength) === length ? "selected" : ""}>${length} cm</option>`)
            .join("");
        return `
            <div class="or-edit-row">
                <img src="${escapeHtml(orderItemImage(item))}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <strong class="or-edit-name">${escapeHtml(item.roseName)}</strong>
                <div class="or-edit-controls">
                    <div class="dp-select or-mini-select">
                        <select data-edit-field="boxType" data-index="${index}" aria-label="Box type for ${escapeHtml(item.roseName)}">
                            ${ORDER_BOX_TYPES.includes(item.boxType) ? "" : '<option value="" selected>Box type…</option>'}${boxOptions}
                        </select>
                    </div>
                    <div class="dp-select or-mini-select">
                        <select data-edit-field="stemLength" data-index="${index}" aria-label="Stem length for ${escapeHtml(item.roseName)}">
                            ${ORDER_STEM_LENGTHS.includes(Number(item.stemLength)) ? "" : '<option value="" selected>Stem…</option>'}${stemOptions}
                        </select>
                    </div>
                    <div class="cp-qty" role="group" aria-label="Boxes of ${escapeHtml(item.roseName)}">
                        <button type="button" data-edit-action="decrease" data-index="${index}" aria-label="One box less" ${quantity <= 1 ? "disabled" : ""}>&minus;</button>
                        <span>${quantity}</span>
                        <button type="button" data-edit-action="increase" data-index="${index}" aria-label="One box more">+</button>
                    </div>
                    <button class="cp-remove" type="button" data-edit-action="remove" data-index="${index}" aria-label="Remove ${escapeHtml(item.roseName)}">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12h9.4l.8-12M10 11v5M14 11v5" /></svg>
                    </button>
                </div>
            </div>`;
    }

    function addRose() {
        const select = document.getElementById("orderAddRose");
        const roseName = select ? select.value : "";
        if (!roseName) {
            return;
        }
        const existing = state.items.find((item) => item.roseName === roseName && item.boxType === "Q-Box" && Number(item.stemLength) === 60);
        if (existing) {
            existing.quantity = (Number(existing.quantity) || 1) + 1;
        } else {
            state.items.push({ roseName, boxType: "Q-Box", stemLength: 60, quantity: 1 });
        }
        render();
    }

    function showResult(promise, heading, text) {
        promise.then((data) => {
            state.order = data.order;
            setOrderHeading(`Order ${data.order.id}`, heading, "");
            root.innerHTML = orderDoneHtml(...text);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }).catch((error) => {
            // The order changed in the meantime (e.g. already accepted): show its current state
            if (error.order) {
                state.order = error.order;
                render();
            }
        });
    }

    root.addEventListener("click", (event) => {
        const modeButton = event.target.closest("[data-order-mode]");
        if (modeButton) {
            resetDraft();
            setMode(modeButton.dataset.orderMode);
            return;
        }

        const editButton = event.target.closest("[data-edit-action]");
        if (editButton) {
            const action = editButton.dataset.editAction;
            const item = state.items[Number(editButton.dataset.index)];
            if (action === "add") {
                addRose();
            } else if (item && action === "remove") {
                state.items.splice(Number(editButton.dataset.index), 1);
                render();
            } else if (item) {
                item.quantity = Math.max(1, (Number(item.quantity) || 1) + (action === "increase" ? 1 : -1));
                render();
            }
            return;
        }

        const actionButton = event.target.closest("[data-order-action]");
        if (!actionButton) {
            return;
        }
        const company = state.order.deliveryDetails.companyName || "The client";
        const action = actionButton.dataset.orderAction;

        if (action === "accept") {
            showResult(
                runOrderButton(actionButton, "Accepting…", () => orderRequest(link, "accept")),
                "Order <span>accepted</span>",
                ["Order accepted", `${company} has been emailed that the order is accepted and being processed.`]
            );
        } else if (action === "propose") {
            const missingOption = state.items.some((item) => !ORDER_BOX_TYPES.includes(item.boxType) || !ORDER_STEM_LENGTHS.includes(Number(item.stemLength)));
            if (missingOption || !state.deliveryDate) {
                const message = document.getElementById("orderActionMessage");
                if (message) {
                    message.textContent = missingOption ? "Choose a box type and stem length for every rose." : "Choose a delivery date.";
                }
                return;
            }
            showResult(
                runOrderButton(actionButton, "Sending…", () => orderRequest(link, "propose", {
                    cartItems: state.items.map(({ roseName, boxType, stemLength, quantity }) => ({ roseName, boxType, stemLength, quantity })),
                    deliveryDate: state.deliveryDate,
                    note: state.note
                })),
                "Changes <span>sent</span>",
                ["Changes sent to the client", `${company} has been emailed the new order. You'll get an email as soon as they accept or decline it.`]
            );
        } else if (action === "cancel") {
            if (!window.confirm(`Cancel this order? ${company} will get an email saying the order has been cancelled.`)) {
                return;
            }
            showResult(
                runOrderButton(actionButton, "Cancelling…", () => orderRequest(link, "cancel")),
                "Order <span>cancelled</span>",
                ["Order cancelled", `${company} has been emailed that the order is cancelled.`, "&times;"]
            );
        }
    });

    // Field edits update the draft without re-rendering, so typing never loses focus
    root.addEventListener("change", (event) => {
        const field = event.target.closest("[data-edit-field]");
        if (field) {
            const item = state.items[Number(field.dataset.index)];
            if (item) {
                item[field.dataset.editField] = field.dataset.editField === "stemLength" ? Number(field.value) : field.value;
            }
        }
        if (event.target.id === "orderDeliveryDate") {
            state.deliveryDate = event.target.value;
            render();
        }
    });
    root.addEventListener("input", (event) => {
        if (event.target.id === "orderNote") {
            state.note = event.target.value;
        }
    });

    orderRequest(link)
        .then((order) => {
            state.order = order;
            resetDraft();
            render();
        })
        .catch((error) => {
            setOrderHeading("", "Order <span>not found</span>", "");
            root.innerHTML = orderDoneHtml("This link doesn't work", error.message, "!");
        });
}

// ----- Client: order-response.html -----
function initOrderResponsePage() {
    const root = document.getElementById("orderResponseRoot");
    if (!root) {
        return;
    }

    const link = getOrderLinkParams();
    let order = null;

    function render() {
        if (order.status === "accepted") {
            setOrderHeading(`Order ${order.id}`, "Order <span>accepted</span>", "");
            root.innerHTML = orderDoneHtml("Your order is accepted", "Thank you! Your order is being processed. We've sent you a confirmation email.");
            return;
        }
        if (order.status === "cancelled") {
            setOrderHeading(`Order ${order.id}`, "Order <span>cancelled</span>", "");
            root.innerHTML = orderDoneHtml("This order is cancelled", "You're welcome to place a new order at any time.", "&times;");
            return;
        }
        if (order.status !== "awaiting_client" || !order.proposal) {
            setOrderHeading(`Order ${order.id}`, "Your <span>order</span>", "");
            root.innerHTML = orderDoneHtml("We're reviewing your order", "We'll email you as soon as it has been checked.", "&#8230;");
            return;
        }

        const proposal = order.proposal;
        const declineFirst = link.choice === "decline";
        const acceptButton = `<button class="${declineFirst ? "or-secondary or-wide" : "dp-submit"}" type="button" data-response="accept">Accept changes</button>`;
        const declineButton = `<button class="${declineFirst ? "dp-submit" : "or-secondary or-wide"}" type="button" data-response="decline">Decline and cancel order</button>`;
        const note = proposal.note
            ? `<div class="or-note"><p class="or-note-title">Message from Bunches Direct</p><p>${escapeHtml(proposal.note).replace(/\n/g, "<br>")}</p></div>`
            : "";
        const changes = proposal.changes && proposal.changes.length
            ? `<h2 class="dp-section-title">What changed</h2><ul class="or-changes">${proposal.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul><hr class="dp-divider">`
            : "";

        setOrderHeading(`Order ${order.id}`, "Updated <span>order</span>", "We've made a few changes to your order. Please accept the new version so we can process it, or decline it to cancel the order.");
        root.innerHTML = `
            <div class="dp-layout">
                <div class="dp-card">
                    ${note}
                    ${changes}
                    <h2 class="dp-section-title">Your updated order</h2>
                    <div class="dp-items">${orderItemsHtml(proposal.cartItems)}</div>
                    <hr class="dp-divider">
                    <h2 class="dp-section-title">Delivery details</h2>
                    ${orderDetailsHtml(order.deliveryDetails)}
                </div>
                <aside class="dp-summary">
                    <h2>Your answer</h2>
                    ${orderSummaryLinesHtml(proposal.deliveryDate, proposal.cartItems)}
                    ${declineFirst ? declineButton + acceptButton : acceptButton + declineButton}
                    <p id="orderActionMessage" class="dp-message" role="alert"></p>
                </aside>
            </div>`;
    }

    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-response]");
        if (!button) {
            return;
        }
        const decision = button.dataset.response;
        if (decision === "decline" && !window.confirm("Decline the changes? Your order will be cancelled.")) {
            return;
        }

        runOrderButton(button, decision === "accept" ? "Accepting…" : "Cancelling…", () => orderRequest(link, "respond", { decision }))
            .then((data) => {
                order = data.order;
                render();
                window.scrollTo({ top: 0, behavior: "smooth" });
            })
            .catch((error) => {
                if (error.order) {
                    order = error.order;
                    render();
                }
            });
    });

    orderRequest(link)
        .then((data) => {
            order = data;
            render();
        })
        .catch((error) => {
            setOrderHeading("", "Order <span>not found</span>", "");
            root.innerHTML = orderDoneHtml("This link doesn't work", error.message, "!");
        });
}

init();
updateCartBadge();
