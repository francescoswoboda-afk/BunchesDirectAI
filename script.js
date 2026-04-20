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
    productGrid: document.getElementById("productGrid"),
    productSearch: document.getElementById("productSearch"),
    filterButtons: Array.from(document.querySelectorAll(".filter-btn"))
};

function init() {
    setYear();
    wireMobileMenu();
    markActiveNav();
    initProductsPage();
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

init();
