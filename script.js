// Product data lives in products-data.js and is loaded only on pages that need it.
const FALLBACK_PRODUCT_IMAGE = "assets/flower-card.svg";
const PRODUCTS_PER_PAGE = 20;
const CART_STORAGE_KEY = "bunchesDirectCart";
const ORDER_DETAILS_STORAGE_KEY = "bunchesDirectOrderDetails";
const CHECKOUT_SESSION_ENDPOINT = "/api/create-checkout-session";

const products = Array.isArray(window.BUNCHES_PRODUCTS) ? window.BUNCHES_PRODUCTS : [];

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
    clearCartBtn: document.getElementById("clearCartBtn"),
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
    homeCartCount: document.getElementById("homeCartCount")
};

let filteredProducts = [...products];
let visibleProductCount = PRODUCTS_PER_PAGE;
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
}

function scheduleIdlePagePrefetches() {
    const idleCallback =
        window.requestIdleCallback ||
        ((callback) => window.setTimeout(callback, 350));

    const pagesToWarm = [];
    const page = document.body.dataset.page;

    if (page === "home") {
        pagesToWarm.push("products.html", "about.html", "contact.html", "cart.html");
    } else if (page === "products") {
        pagesToWarm.push("index.html", "cart.html");
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

function init() {
    setupSmoothPageNavigation();
    setYear();
    wireMobileMenu();
        wireHomeHamburger();
    markActiveNav();
    initHomeCartBadge();
    initProductsPage();
    initProductDetailPage();
    initCartPage();
    initOrderDetailsPage();
    initPaymentPage();
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

    window.addEventListener("resize", updateResponsiveNavMode);
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
    renderProductsPage();

    if (dom.productSearch) {
        dom.productSearch.addEventListener("input", filterAndRenderProducts);
    }

    if (dom.productColorFilter) {
        dom.productColorFilter.addEventListener("change", filterAndRenderProducts);
    }
}

function filterAndRenderProducts() {
    const searchTerm = dom.productSearch ? dom.productSearch.value.trim().toLowerCase() : "";
    const selectedColor = dom.productColorFilter ? dom.productColorFilter.value : "all";

    filteredProducts = products.filter((product) => {
        const searchable = `${product.name} ${product.description}`.toLowerCase();
        const textMatch = searchable.includes(searchTerm);
        if (selectedColor === "all") {
            return textMatch;
        }

        return textMatch && inferProductColor(product) === selectedColor;
    });

    visibleProductCount = PRODUCTS_PER_PAGE;
    renderProductsPage();
}

function inferProductColor(product) {
    const text = `${product.name} ${product.description}`.toLowerCase();

    if (text.includes("red") || text.includes("burgundy") || text.includes("crimson")) {
        return "red";
    }
    if (text.includes("pink") || text.includes("blush") || text.includes("fuchsia")) {
        return "pink";
    }
    if (text.includes("white") || text.includes("ivory") || text.includes("cream")) {
        return "white";
    }
    if (text.includes("yellow") || text.includes("gold")) {
        return "yellow";
    }
    if (text.includes("orange") || text.includes("coral")) {
        return "orange";
    }
    if (text.includes("peach") || text.includes("apricot")) {
        return "peach";
    }

    return "pink";
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
        dom.productGrid.innerHTML = "<p>No bouquets match your current filter.</p>";
        return;
    }

    dom.productGrid.innerHTML = list
        .map(
            (product) => `
            <a class="product-card product-card-link" href="${getProductDetailUrl(product)}" aria-label="View details for ${product.name}">
                <img class="product-image" src="${product.image || FALLBACK_PRODUCT_IMAGE}" alt="${product.name} arrangement image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <h3>${product.name}</h3>
                <p class="product-tag">Premium Rose</p>
                <span class="product-arrow" aria-hidden="true">&rarr;</span>
            </a>
        `
        )
        .join("");
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

    dom.detailImage.src = product.image || FALLBACK_PRODUCT_IMAGE;
    dom.detailImage.alt = `${product.name} rose image`;
    dom.detailName.textContent = product.name;

    if (dom.prevFlowerBtn) {
        if (previousProduct) {
            dom.prevFlowerBtn.href = getProductDetailUrl(previousProduct);
            dom.prevFlowerBtn.innerHTML = `&larr; Previous flower: ${previousProduct.name}`;
            dom.prevFlowerBtn.style.display = "inline-flex";
        } else {
            dom.prevFlowerBtn.style.display = "none";
        }
    }

    if (dom.nextFlowerBtn) {
        if (nextProduct) {
            dom.nextFlowerBtn.href = getProductDetailUrl(nextProduct);
            dom.nextFlowerBtn.innerHTML = `Next flower: ${nextProduct.name} &rarr;`;
            dom.nextFlowerBtn.style.display = "inline-flex";
        } else {
            dom.nextFlowerBtn.style.display = "none";
        }
    }

    updateSelectionSummary();
}

function wireDetailQuantityControls() {
    if (!dom.qtyMinus || !dom.qtyPlus || !dom.qtyValue || !dom.addBoxBtn) {
        return;
    }

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
        dom.boxTypeSelect.addEventListener("change", updateSelectionSummary);
    }

    if (dom.stemLengthSelect) {
        dom.stemLengthSelect.addEventListener("change", updateSelectionSummary);
    }

    dom.addBoxBtn.addEventListener("click", () => {
        addCurrentSelectionToCart();
        dom.addBoxBtn.textContent = "Added!";
        updateSelectionSummary();

        window.setTimeout(() => {
            dom.addBoxBtn.textContent = "Add box to cart";
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
        boxType: dom.boxTypeSelect.value,
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

function initCartPage() {
    if (!dom.cartItems || !dom.cartTotal || !dom.clearCartBtn || !dom.cartEmptyState) {
        return;
    }

    renderCartPage();

    dom.clearCartBtn.addEventListener("click", () => {
        saveCartItems([]);
        renderCartPage();
    });
}

function renderCartPage() {
    if (!dom.cartItems || !dom.cartTotal || !dom.clearCartBtn || !dom.cartEmptyState) {
        return;
    }

    const cart = getCartItems();

    if (cart.length === 0) {
        dom.cartItems.innerHTML = "";
        dom.cartTotal.textContent = "Total boxes: 0";
        dom.cartEmptyState.style.display = "block";
        dom.clearCartBtn.style.display = "none";
        return;
    }

    dom.cartEmptyState.style.display = "none";
    dom.clearCartBtn.style.display = "inline-flex";

    dom.cartItems.innerHTML = cart
        .map(
            (item, index) => `
            <article class="cart-item-card">
                <img class="cart-item-image" src="${item.image || FALLBACK_PRODUCT_IMAGE}" alt="${item.roseName} rose image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <div class="cart-item-copy">
                    <h3>${item.roseName}</h3>
                    <p>Packaging: ${item.boxType}</p>
                    <p>Stem length: ${item.stemLength} cm</p>
                    <p>Boxes: ${item.quantity}</p>
                </div>
                <button class="btn btn-outline cart-remove-btn" type="button" data-index="${index}">Remove</button>
            </article>
        `
        )
        .join("");

    const totalBoxes = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    dom.cartTotal.textContent = `Total boxes: ${totalBoxes}`;

    const removeButtons = dom.cartItems.querySelectorAll(".cart-remove-btn");
    removeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.index);
            const latestCart = getCartItems();

            if (!Number.isNaN(index)) {
                latestCart.splice(index, 1);
                saveCartItems(latestCart);
                renderCartPage();
            }
        });
    });
}

function buildCartItemsHtml(cart) {
    if (!Array.isArray(cart) || cart.length === 0) {
        return "<p>No products selected yet.</p>";
    }

    return cart
        .map(
            (item) => `
            <article class="cart-item-card">
                <img class="cart-item-image" src="${item.image || FALLBACK_PRODUCT_IMAGE}" alt="${item.roseName} rose image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <div class="cart-item-copy">
                    <h3>${item.roseName}</h3>
                    <p>Packaging: ${item.boxType}</p>
                    <p>Stem length: ${item.stemLength} cm</p>
                    <p>Boxes: ${item.quantity}</p>
                </div>
            </article>
        `
        )
        .join("");
}

function initOrderDetailsPage() {
    if (!dom.checkoutItems || !dom.deliveryForm || !dom.toPaymentBtn) {
        return;
    }

    const cart = getCartItems();
    dom.checkoutItems.innerHTML = buildCartItemsHtml(cart);

    if (cart.length === 0) {
        dom.toPaymentBtn.disabled = true;
        return;
    }

    hydrateDeliveryForm();

    dom.toPaymentBtn.addEventListener("click", async () => {
        if (!dom.deliveryForm.reportValidity()) {
            return;
        }

        const formData = new FormData(dom.deliveryForm);
        const details = {
            companyName: String(formData.get("companyName") || ""),
            deliveryAddress: String(formData.get("deliveryAddress") || ""),
            taxVat: String(formData.get("taxVat") || ""),
            phone: String(formData.get("phone") || ""),
            contactPerson: String(formData.get("contactPerson") || ""),
            truckCompany: String(formData.get("truckCompany") || ""),
            deliveryDate: String(formData.get("deliveryDate") || "")
        };

        // Disable button and show loading state
        dom.toPaymentBtn.disabled = true;
        const originalLabel = dom.toPaymentBtn.textContent;
        dom.toPaymentBtn.textContent = "Placing order…";

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
                confirmSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            // Clear cart after confirmed order
            localStorage.removeItem(CART_STORAGE_KEY);
            localStorage.removeItem(ORDER_DETAILS_STORAGE_KEY);
        } catch (err) {
            dom.toPaymentBtn.disabled = false;
            dom.toPaymentBtn.textContent = originalLabel;
            const msg = err instanceof Error ? err.message : "Something went wrong.";
            alert(`Could not place order: ${msg}`);
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

    let optionsHtml = '<option value="">-- Select a delivery date --</option>';
    availableDates.forEach((option) => {
        const dateStr = option.date.toISOString().split("T")[0]; // YYYY-MM-DD format
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
    const boxType = dom.boxTypeSelect.value;
    const stemLength = dom.stemLengthSelect.value;

    dom.selectionSummary.textContent = `Selected: ${qty} box(es), ${boxType}, ${stemLength} cm stems.`;
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
        <button class="btn btn-solid" id="productsLoadMoreBtn" type="button">Load More Roses</button>
    `;

    const loadMoreButton = document.getElementById("productsLoadMoreBtn");

    if (loadMoreButton) {
        loadMoreButton.addEventListener("click", () => {
            visibleProductCount += PRODUCTS_PER_PAGE;
            renderProductsPage();
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

init();
updateCartBadge();
