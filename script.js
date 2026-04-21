// Product images are configured per product below.
// To use your own images:
// 1) Put files in assets/products/
// 2) Replace each image path in the products array
// 3) Keep the same filename (easy) or update the path string
const FALLBACK_PRODUCT_IMAGE = "assets/flower-card.svg";
const PRODUCTS_PER_PAGE = 18;

const products = [
    {
        id: "rose-romance",
        name: "All for Love",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Absolut Pink",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Aloha",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Aloha 3",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Altamira",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Amaretto",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Andrea",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Antonia Garden",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Art+Deco",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Artica",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Arya",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Atlas 2",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Atomic 1",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Atomic 3",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Avalanch",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Babaloo Rose",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Be Sweet 2",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Bimba",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Blessing",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Blue Dream",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Blueberry",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Bluez",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Boulevard",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Bountyway",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Brighton 20",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Bumblebee",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Cabaret",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Candlelight",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Candy X Pression",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Caraluna",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Carpe Diem",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Carrousel",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Champagner",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Cherry Brandy",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Cherry Oh",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Chilli Love",
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
    productSearch: document.getElementById("productSearch"),
    productPagination: document.getElementById("productPagination")
};

let filteredProducts = [...products];
let currentProductPage = 1;

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

    filteredProducts = [...products];
    currentProductPage = 1;
    renderProductsPage();

    if (dom.productSearch) {
        dom.productSearch.addEventListener("input", filterAndRenderProducts);
    }
}

function filterAndRenderProducts() {
    const searchTerm = dom.productSearch ? dom.productSearch.value.trim().toLowerCase() : "";

    filteredProducts = products.filter((product) => {
        const searchable = `${product.name} ${product.description}`.toLowerCase();
        return searchable.includes(searchTerm);
    });

    currentProductPage = 1;
    renderProductsPage();
}

function renderProductsPage() {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    const start = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
    const pageItems = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);

    renderProductCards(pageItems);
    renderProductPagination(totalPages);
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

function renderProductPagination(totalPages) {
    if (!dom.productPagination) {
        return;
    }

    if (filteredProducts.length === 0 || totalPages <= 1) {
        dom.productPagination.innerHTML = "";
        return;
    }

    const prevDisabled = currentProductPage <= 1 ? "disabled" : "";
    const nextDisabled = currentProductPage >= totalPages ? "disabled" : "";

    dom.productPagination.innerHTML = `
        <button class="btn btn-outline" id="productsPrevBtn" ${prevDisabled}>View Previous Products</button>
        <p class="page-indicator">Page ${currentProductPage} of ${totalPages}</p>
        <button class="btn btn-solid" id="productsNextBtn" ${nextDisabled}>View More Products</button>
    `;

    const prevButton = document.getElementById("productsPrevBtn");
    const nextButton = document.getElementById("productsNextBtn");

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            if (currentProductPage > 1) {
                currentProductPage -= 1;
                renderProductsPage();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            if (currentProductPage < totalPages) {
                currentProductPage += 1;
                renderProductsPage();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

init();
