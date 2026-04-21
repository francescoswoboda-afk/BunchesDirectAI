// Product images are configured per product below.
// To use your own images:
// 1) Put files in assets/products/
// 2) Replace each image path in the products array
// 3) Keep the same filename (easy) or update the path string
const FALLBACK_PRODUCT_IMAGE = "assets/flower-card.svg";

const products = [
    {
        id: "rose-romance",
        name: "Rose Romance",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Sunlit Daisy Pop",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Linen Whites",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Wedding Cloud",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Pink Muse",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Citrus Bloom",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Green Studio",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Gala Grandeur",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    }
];

const dom = {
    menuToggle: document.getElementById("menuToggle"),
    siteNav: document.getElementById("siteNav"),
    year: document.getElementById("year"),
    productGrid: document.getElementById("productGrid"),
    productSearch: document.getElementById("productSearch")
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

    if (dom.productSearch) {
        dom.productSearch.addEventListener("input", filterAndRenderProducts);
    }
}

function filterAndRenderProducts() {
    const searchTerm = dom.productSearch ? dom.productSearch.value.trim().toLowerCase() : "";

    const filteredProducts = products.filter((product) => {
        const searchable = `${product.name} ${product.description}`.toLowerCase();
        return searchable.includes(searchTerm);
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
                <img class="product-image" src="${product.image || FALLBACK_PRODUCT_IMAGE}" alt="${product.name} arrangement image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
            </article>
        `
        )
        .join("");
}

init();
