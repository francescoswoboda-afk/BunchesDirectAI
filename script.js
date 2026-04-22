// Product images are configured per product below.
// To use your own images:
// 1) Put files in assets/products/
// 2) Replace each image path in the products array
// 3) Keep the same filename (easy) or update the path string
const FALLBACK_PRODUCT_IMAGE = "assets/flower-card.svg";
const PRODUCTS_PER_PAGE = 18;
const CART_STORAGE_KEY = "bunchesDirectCart";
const ORDER_DETAILS_STORAGE_KEY = "bunchesDirectOrderDetails";

const products = [
    {
        id: "ALL-FOR-LOVE-",
        name: "All for Love",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/ALL-FOR-LOVE-.png"
    },
    {
        id: "ABSOLUTPINK2",
        name: "Absolut Pink",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/ABSOLUTPINK2.jpg"
    },
    {
        id: "ALOHA",
        name: "Aloha",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/ALOHA.png"
    },
    {
        id: "ALOHA3",
        name: "Aloha 3",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/ALOHA3.jpg"
    },
    {
        id: "ALTAMIRA-",
        name: "Altamira",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/ALTAMIRA-.png"
    },
    {
        id: "AMARETTO",
        name: "Amaretto",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/AMARETTO.png"
    },
    {
        id: "ANDREA-",
        name: "Andrea",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/ANDREA-.png"
    },
    {
        id: "ANTONIAGARDEN1",
        name: "Antonia Garden",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/ANTONIAGARDEN1.jpg"
    },
        {
        id: "Art+Deco-1",
        name: "Art+Deco",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/Art+Deco-1.jpeg"
    },
    {
        id: "ARTICA-",
        name: "Artica",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/ARTICA-.jpeg"
    },
    {
        id: "ARYA",
        name: "Arya",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/ARYA.png"
    },
    {
        id: "ATLAS2",
        name: "Atlas",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/ATLAS2.jpg"
    },
    {
        id: "Atomic1",
        name: "Atomic 1",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/Atomic1.jpg"
    },
    {
        id: "Atomic3",
        name: "Atomic 3",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/Atomic3.jpg"
    },
    {
        id: "AVALANCH-",
        name: "Avalanch",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/AVALANCH-.png"
    },
    {
        id: "babbaloo-rose",
        name: "Babaloo Rose",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/babaloo-rose.jpeg"
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
    },
    {
        id: "rose-romance",
        name: "Christa",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Clown",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Cold Play",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Constanza",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Cool Down",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Coral Reef",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Cotton X Pression",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Country Aquarel",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Country Blues",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Country Candy",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Country Secret",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Country Soul",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Cream Esperance",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Cream Carpediem",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Cream Shimmer",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Creme de la Creme",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Crystal Flame",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Dallas",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Deep Purple",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Discovery",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Dragonfly",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Dynamic",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Encanto",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Enchantment",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Esperance",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Exotix Berry",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Explorer",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Faith",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Fascination",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Fashion Gold",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Fatima",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Flirty",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Freedom",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Free Spirit",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Frutteto",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Geraldine",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Gotcha",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Green Fashion",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Her Majesty",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "High Magic",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Hot Merengue",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Imagine",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Intensity",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Jessica",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Jessika",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Joy",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Kahala",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Lighthouse",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Lola",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Mamma Mia",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Mandala",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Mandarin X Pression",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Mango Tango",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Melon X Pression",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Mia",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Miss Piggy",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Mix Color Box",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Mondial",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Moody Blues",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Moonstone",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "New Flash",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "O'Hara",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Orange Only",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Paloma",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Peach Avalanche",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Pink Floyd",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Pink Mondial",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Pink Amaretto",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Pink Ohara",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Pink X Pression",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Playa Blanca",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Powder Puff",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Princess Crown",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Purple Moon",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Razzmatazz",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Revolution Red",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Rhoslyn",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Salma",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Secret Garden",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Shimmer",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Silantoi",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Sugar Moon",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Sunny Blow",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Swan",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Sweet Avalanche",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "Sweet Beat",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Sweet Cake",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    },
    {
        id: "green-studio",
        name: "Sweet Memory",
        category: "minimal",
        price: 44,
        description: "Modern foliage-forward bunch with white accents and clean lines.",
        image: "assets/products/green-studio.svg"
    },
    {
        id: "gala-grandeur",
        name: "Symbol",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
        {
        id: "gala-grandeur",
        name: "Teddys",
        category: "event",
        price: 120,
        description: "Large centerpiece blend for receptions and statement installations.",
        image: "assets/products/gala-grandeur.svg"
    },
    {
        id: "rose-romance",
        name: "Tie Dye",
        category: "romantic",
        price: 65,
        description: "Classic red roses with burgundy foliage and silk ribbon wrap.",
        image: "assets/products/rose-romance.svg"
    },
    {
        id: "sunlit-daisy",
        name: "Twilight",
        category: "bright",
        price: 42,
        description: "Yellow daisies, orange spray roses, and mint for a cheerful look.",
        image: "assets/products/sunlit-daisy.svg"
    },
    {
        id: "linen-whites",
        name: "Tycoon",
        category: "minimal",
        price: 48,
        description: "A calm palette of white lisianthus, ivory roses, and eucalyptus.",
        image: "assets/products/linen-whites.svg"
    },
    {
        id: "wedding-cloud",
        name: "Vicky Gardens",
        category: "event",
        price: 95,
        description: "Premium peonies and garden roses tailored for bridal events.",
        image: "assets/products/wedding-cloud.svg"
    },
    {
        id: "pink-muse",
        name: "VIPink",
        category: "romantic",
        price: 58,
        description: "Blush pink mix with ranunculus and textural seasonal stems.",
        image: "assets/products/pink-muse.svg"
    },
    {
        id: "citrus-bloom",
        name: "Wild Crown",
        category: "bright",
        price: 55,
        description: "Orange tulips, coral carnations, and lemon button mums.",
        image: "assets/products/citrus-bloom.svg"
    }
];

const dom = {
    menuToggle: document.getElementById("menuToggle"),
    siteNav: document.getElementById("siteNav"),
    year: document.getElementById("year"),
    productGrid: document.getElementById("productGrid"),
    productSearch: document.getElementById("productSearch"),
    productPagination: document.getElementById("productPagination"),
    detailImage: document.getElementById("detailImage"),
    detailName: document.getElementById("detailName"),
    detailDescription: document.getElementById("detailDescription"),
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
    paymentForm: document.getElementById("paymentForm"),
    confirmPaymentBtn: document.getElementById("confirmPaymentBtn"),
    paymentMessage: document.getElementById("paymentMessage")
};

let filteredProducts = [...products];
let currentProductPage = 1;
let activeDetailProduct = null;

function init() {
    setYear();
    wireMobileMenu();
    markActiveNav();
    initProductsPage();
    initProductDetailPage();
    initCartPage();
    initOrderDetailsPage();
    initPaymentPage();
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
            <a class="product-card product-card-link" href="${getProductDetailUrl(product)}" aria-label="View details for ${product.name}">
                <img class="product-image" src="${product.image || FALLBACK_PRODUCT_IMAGE}" alt="${product.name} arrangement image" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PRODUCT_IMAGE}';">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
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

    if (dom.detailDescription) {
        dom.detailDescription.textContent = product.description;
    }

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

    dom.toPaymentBtn.addEventListener("click", () => {
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

        saveOrderDetails(details);
        window.location.href = "payment.html";
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
    dom.deliveryMessage.textContent = "Select your preferred delivery date.";

    // Add change listener to update message
    dom.deliveryDateSelect.addEventListener("change", () => {
        if (dom.deliveryDateSelect.value) {
            const selectedText = dom.deliveryDateSelect.options[dom.deliveryDateSelect.selectedIndex].text;
            dom.deliveryMessage.textContent = `Selected: ${selectedText}`;
        } else {
            dom.deliveryMessage.textContent = "Select your preferred delivery date.";
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

    const cart = getCartItems();
    dom.paymentItems.innerHTML = buildCartItemsHtml(cart);

    if (cart.length === 0) {
        dom.paymentMessage.textContent = "Your cart is empty. Add products before payment.";
        dom.confirmPaymentBtn.disabled = true;
        return;
    }

    dom.confirmPaymentBtn.addEventListener("click", () => {
        const selectedMethod = dom.paymentForm.querySelector('input[name="paymentMethod"]:checked');

        if (!selectedMethod) {
            dom.paymentMessage.textContent = "Please choose credit card or bank transfer to continue.";
            return;
        }

        const label = selectedMethod.value === "credit-card" ? "credit card" : "bank transfer";
        dom.paymentMessage.textContent = `Payment method selected: ${label}. Your order request is ready.`;
    });
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
    const pageTokens = getPageTokens(totalPages, currentProductPage);
    const pageButtons = pageTokens
        .map((token) => {
            if (token === "ellipsis") {
                return "<span class=\"page-ellipsis\" aria-hidden=\"true\">...</span>";
            }

            const activeClass = token === currentProductPage ? "is-active" : "";
            const ariaCurrent = token === currentProductPage ? "aria-current=\"page\"" : "";
            return `<button class="page-jump-btn ${activeClass}" data-page="${token}" ${ariaCurrent}>${token}</button>`;
        })
        .join("");

    dom.productPagination.innerHTML = `
        <button class="btn btn-outline" id="productsPrevBtn" ${prevDisabled}>View Previous Products</button>
        <p class="page-indicator">Page ${currentProductPage} of ${totalPages}</p>
        <div class="page-jump-wrap" aria-label="Select product page">${pageButtons}</div>
        <button class="btn btn-solid" id="productsNextBtn" ${nextDisabled}>View More Products</button>
    `;

    const prevButton = document.getElementById("productsPrevBtn");
    const nextButton = document.getElementById("productsNextBtn");
    const jumpButtons = dom.productPagination.querySelectorAll(".page-jump-btn");

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

    jumpButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedPage = Number(button.dataset.page);

            if (!Number.isNaN(selectedPage) && selectedPage !== currentProductPage) {
                currentProductPage = selectedPage;
                renderProductsPage();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });
}

function getPageTokens(totalPages, currentPage) {
    if (totalPages <= 8) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [...createPageRange(1, 7), "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, "ellipsis", ...createPageRange(totalPages - 6, totalPages)];
    }

    return [
        1,
        "ellipsis",
        ...createPageRange(currentPage - 1, currentPage + 3),
        "ellipsis",
        totalPages
    ];
}

function createPageRange(startPage, endPage) {
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}

init();
