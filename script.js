const products = [
    {
        id: "rose-romance",
        name: "Rose Romance",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/flower-card.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Sunlit Daisy Pop",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/flower-card.svg"
    },
    {
        id: "linen-whites",
        name: "Linen Whites",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/flower-card.svg"
    },
    {
        id: "wedding-cloud",
        name: "Wedding Cloud",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/flower-card.svg"
    },
    {
        id: "pink-muse",
        name: "Pink Muse",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/flower-card.svg"
    },
    {
        id: "citrus-bloom",
        name: "Citrus Bloom",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/flower-card.svg"
    },
    {
        id: "green-studio",
        name: "Green Studio",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/flower-card.svg"
    },
    {
        id: "gala-grandeur",
        name: "Gala Grandeur",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/flower-card.svg"
    }
];

const dom = {
    menuToggle: document.getElementById("menuToggle"),
    siteNav: document.getElementById("siteNav"),
    year: document.getElementById("year"),
    newsletterForm: document.getElementById("newsletterForm"),
    newsletterEmail: document.getElementById("newsletterEmail"),
    newsletterMessage: document.getElementById("newsletterMessage"),
    productGrid: document.getElementById("productGrid"),
    productSearch: document.getElementById("productSearch"),
    filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
    contactForm: document.getElementById("contactForm"),
    contactMessage: document.getElementById("contactMessage")
};

function init() {
    setYear();
    wireMobileMenu();
    markActiveNav();
    wireNewsletterForm();
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
                <img class="product-image" src="${product.image}" alt="${product.name} arrangement image" loading="lazy">
                <span class="tag">${product.category}</span>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">$${product.price}</p>
            </article>
        `
        )
        .join("");
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
