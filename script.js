const ENQUIRY_KEY = "bunchesDirectEnquiry";

const products = [
    {
        id: "rose-romance",
        name: "Rose Romance",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap."
    },
    {
        id: "sunlit-daisy",
        name: "Sunlit Daisy Pop",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look."
    },
    {
        id: "linen-whites",
        name: "Linen Whites",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus."
    },
    {
        id: "wedding-cloud",
        name: "Wedding Cloud",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events."
    },
    {
        id: "pink-muse",
        name: "Pink Muse",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems."
    },
    {
        id: "citrus-bloom",
        name: "Citrus Bloom",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums."
    },
    {
        id: "green-studio",
        name: "Green Studio",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines."
    },
    {
        id: "gala-grandeur",
        name: "Gala Grandeur",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations."
    }
];

const dom = {
    menuToggle: document.getElementById("menuToggle"),
    siteNav: document.getElementById("siteNav"),
    enquiryCount: document.getElementById("enquiryCount"),
    year: document.getElementById("year"),
    newsletterForm: document.getElementById("newsletterForm"),
    newsletterEmail: document.getElementById("newsletterEmail"),
    newsletterMessage: document.getElementById("newsletterMessage"),
    productGrid: document.getElementById("productGrid"),
    productSearch: document.getElementById("productSearch"),
    filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
    enquiryItems: document.getElementById("enquiryItems"),
    enquiryTotal: document.getElementById("enquiryTotal"),
    clearEnquiryBtn: document.getElementById("clearEnquiryBtn"),
    contactForm: document.getElementById("contactForm"),
    contactMessage: document.getElementById("contactMessage")
};

function init() {
    setYear();
    wireMobileMenu();
    markActiveNav();
    wireNewsletterForm();
    updateEnquiryCount();
    initProductsPage();
    initContactPage();
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
        const open = dom.siteNav.classList.toggle("open");
        dom.menuToggle.setAttribute("aria-expanded", String(open));
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

function wireNewsletterForm() {
    if (!dom.newsletterForm || !dom.newsletterEmail || !dom.newsletterMessage) {
        return;
    }

    dom.newsletterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = dom.newsletterEmail.value.trim();

        if (!isValidEmail(email)) {
            setMessage(dom.newsletterMessage, "Please enter a valid email address.", false);
            return;
        }

        localStorage.setItem("bunchesDirectNewsletterEmail", email);
        dom.newsletterForm.reset();
        setMessage(dom.newsletterMessage, "You are subscribed. Welcome to the flower club!", true);
    });
}

function initProductsPage() {
    if (!dom.productGrid) {
        return;
    }

    renderProductCards(products);
    renderEnquiryPanel();

    dom.filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            dom.filterButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            filterAndRenderProducts();
        });
    });

    if (dom.productSearch) {
        dom.productSearch.addEventListener("input", filterAndRenderProducts);
    }

    if (dom.clearEnquiryBtn) {
        dom.clearEnquiryBtn.addEventListener("click", () => {
            localStorage.setItem(ENQUIRY_KEY, JSON.stringify([]));
            renderEnquiryPanel();
            updateEnquiryCount();
        });
    }
}

function filterAndRenderProducts() {
    const activeFilterButton = dom.filterButtons.find((button) => button.classList.contains("active"));
    const activeFilter = activeFilterButton ? activeFilterButton.dataset.filter : "all";
    const searchTerm = dom.productSearch ? dom.productSearch.value.trim().toLowerCase() : "";

    const filteredProducts = products.filter((product) => {
        const matchesFilter = activeFilter === "all" || product.category === activeFilter;
        const searchable = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        const matchesSearch = searchable.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    renderProductCards(filteredProducts);
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
            <article class="product-card">
                <span class="tag">${product.category}</span>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">$${product.price}</p>
                <button class="btn btn-solid" data-add-id="${product.id}">Add to Enquiry</button>
            </article>
        `
        )
        .join("");

    dom.productGrid.querySelectorAll("[data-add-id]").forEach((button) => {
        button.addEventListener("click", () => {
            addToEnquiry(button.dataset.addId);
        });
    });
}

function addToEnquiry(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
        return;
    }

    const enquiry = getEnquiryItems();
    const existing = enquiry.find((item) => item.id === product.id);

    if (existing) {
        existing.qty += 1;
    } else {
        enquiry.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    localStorage.setItem(ENQUIRY_KEY, JSON.stringify(enquiry));
    renderEnquiryPanel();
    updateEnquiryCount();
}

function getEnquiryItems() {
    try {
        const value = localStorage.getItem(ENQUIRY_KEY);
        return value ? JSON.parse(value) : [];
    } catch (_error) {
        return [];
    }
}

function updateEnquiryCount() {
    if (!dom.enquiryCount) {
        return;
    }

    const count = getEnquiryItems().reduce((acc, item) => acc + item.qty, 0);
    dom.enquiryCount.textContent = String(count);
}

function renderEnquiryPanel() {
    if (!dom.enquiryItems || !dom.enquiryTotal) {
        return;
    }

    const enquiry = getEnquiryItems();

    if (enquiry.length === 0) {
        dom.enquiryItems.innerHTML = "<li>Your enquiry list is currently empty.</li>";
        dom.enquiryTotal.textContent = "$0";
        return;
    }

    dom.enquiryItems.innerHTML = enquiry
        .map(
            (item) => `
            <li>
                <span>${item.name} x${item.qty} - $${item.price * item.qty}</span>
                <button type="button" data-remove-id="${item.id}">Remove</button>
            </li>
        `
        )
        .join("");

    const total = enquiry.reduce((sum, item) => sum + item.price * item.qty, 0);
    dom.enquiryTotal.textContent = `$${total}`;

    dom.enquiryItems.querySelectorAll("[data-remove-id]").forEach((button) => {
        button.addEventListener("click", () => {
            removeFromEnquiry(button.dataset.removeId);
        });
    });
}

function removeFromEnquiry(productId) {
    const enquiry = getEnquiryItems().filter((item) => item.id !== productId);
    localStorage.setItem(ENQUIRY_KEY, JSON.stringify(enquiry));
    renderEnquiryPanel();
    updateEnquiryCount();
}

function initContactPage() {
    if (!dom.contactForm || !dom.contactMessage) {
        return;
    }

    dom.contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(dom.contactForm);
        const payload = {
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim(),
            phone: String(formData.get("phone") || "").trim(),
            occasion: String(formData.get("occasion") || "").trim(),
            date: String(formData.get("date") || "").trim(),
            message: String(formData.get("message") || "").trim(),
            updates: Boolean(formData.get("updates"))
        };

        const validationError = validateContactPayload(payload);
        if (validationError) {
            setMessage(dom.contactMessage, validationError, false);
            return;
        }

        saveContactSubmission(payload);
        dom.contactForm.reset();
        setMessage(dom.contactMessage, "Thanks! We received your request and will contact you shortly.", true);
    });
}

function validateContactPayload(payload) {
    if (!payload.name || payload.name.length < 2) {
        return "Please enter your full name.";
    }

    if (!isValidEmail(payload.email)) {
        return "Please provide a valid email address.";
    }

    if (!payload.occasion) {
        return "Please choose an occasion.";
    }

    if (!payload.date) {
        return "Please select a preferred date.";
    }

    if (!payload.message || payload.message.length < 10) {
        return "Please include a few details in your message.";
    }

    return "";
}

function saveContactSubmission(payload) {
    const key = "bunchesDirectContactRequests";
    let records = [];

    try {
        const existing = localStorage.getItem(key);
        records = existing ? JSON.parse(existing) : [];
    } catch (_error) {
        records = [];
    }

    records.push({
        ...payload,
        enquiry: getEnquiryItems(),
        submittedAt: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(records));
}

function setMessage(element, text, isSuccess) {
    element.textContent = text;
    element.classList.remove("success", "error");
    element.classList.add(isSuccess ? "success" : "error");
}

function isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email);
}

init();
