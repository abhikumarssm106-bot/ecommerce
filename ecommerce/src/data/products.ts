import type { Product } from '../types';

export const productsData: Product[] = [
  {
    id: 'p1',
    name: 'Organic Bananas (Bunch)',
    brand: 'Fresh Farms',
    category: 'groceries',
    price: 1.99,
    oldPrice: 2.49,
    image: 'images/prod_bananas.png',
    imageStyle: '',
    weight: '1 bunch (approx. 5-7 bananas)',
    badge: 'Fresh',
    badgeClass: 'new',
    stock: 'In Stock',
    stockClass: '',
    description: 'Hand-picked organic bananas grown in sun-drenched tropical valleys. Naturally sweetened, rich in potassium, and harvested at perfect maturity to guarantee a delicious texture and flavor.',
    features: [
      '100% USDA Certified Organic fruit',
      'Rich in Potassium, Vitamin B6, and Dietary Fiber',
      'Perfect natural pre-workout snack or baking ingredient',
      'Directly sourced from sustainable local cooperatives'
    ],
    usage: 'Store at room temperature. Peel and eat fresh, add to morning cereals, blend into delicious smoothies, or slice onto pancakes.',
    origin: 'Ecuador',
    storage: 'Keep at room temperature away from direct sunlight. Do not refrigerate until fully ripe.',
    mfgDate: '28/05/2026',
    expDate: '06/06/2026',
    ingredients: 'Organic fresh bananas.',
    nutrition: {
      'Calories': '89 kcal',
      'Total Fat': '0.3g',
      'Sodium': '1mg',
      'Total Carbohydrates': '22.8g',
      'Dietary Fiber': '2.6g',
      'Sugars': '12.2g',
      'Protein': '1.1g'
    },
    variants: [
      { name: 'Standard bunch (approx. 5-7 bananas)', priceOffset: 0, weight: '1 bunch' },
      { name: 'Double Bundle (approx. 10-14 bananas)', priceOffset: 1.50, weight: '2 bunches' }
    ],
    reviews: [
      { name: 'Sarah Connor', rating: 5, text: 'Super fresh bananas! Arrived yellow and delicious. Perfect for my morning smoothies.', date: '01/06/2026' },
      { name: 'David Miller', rating: 4, text: 'A bit green when they arrived, but ripened perfectly in two days. Very sweet flavor.', date: '30/05/2026' }
    ],
    related: ['p5', 'p7', 'p9'],
    bundle: {
      items: ['p3', 'p5'],
      discount: 0.10
    }
  },
  {
    id: 'p2',
    name: 'Chocolate Chip Cookies (200g)',
    brand: 'BakeHouse',
    category: 'snacks',
    price: 3.49,
    oldPrice: 4.29,
    image: 'images/prod_cookies.png',
    imageStyle: '',
    weight: '200g pack',
    badge: 'Sale',
    badgeClass: 'sale',
    stock: 'Only 6 left!',
    stockClass: 'low',
    description: 'Delectably crispy chocolate chip cookies baked fresh daily using premium Belgian chocolate chips and organic wheat flour. Melt-in-the-mouth goodness with a generous distribution of chocolate drops.',
    features: [
      'Baked with genuine Belgian chocolate chips (25%)',
      'No artificial preservatives, trans fats, or high fructose corn syrup',
      'Prepared using natural butter and organic brown sugar',
      'Individually tray-packed to preserve crunch and shape'
    ],
    usage: 'Ready to eat. Enjoy as a midday snack, pair with a glass of cold milk, or crush over vanilla ice cream for a gourmet dessert.',
    origin: 'United Kingdom',
    storage: 'Store in a cool, dry place in an airtight container once opened.',
    mfgDate: '20/05/2026',
    expDate: '20/09/2026',
    ingredients: 'Organic wheat flour, Belgian chocolate chips (sugar, cocoa mass, cocoa butter, emulsifier: soy lecithin), butter, organic brown sugar, eggs, vanilla extract, baking soda, salt.',
    nutrition: {
      'Calories': '485 kcal',
      'Total Fat': '24g',
      'Saturated Fat': '14g',
      'Sodium': '290mg',
      'Total Carbohydrates': '62g',
      'Sugars': '33g',
      'Protein': '5.2g'
    },
    variants: [
      { name: 'Standard Pack (200g)', priceOffset: 0, weight: '200g' },
      { name: 'Family Size (400g)', priceOffset: 2.80, weight: '400g' }
    ],
    reviews: [
      { name: 'Emma Watson', rating: 5, text: 'Absolutely love these! Generous chocolate chunks, extremely buttery. Will buy again.', date: '02/06/2026' },
      { name: 'John Doe', rating: 5, text: 'Best cookies I have ordered online. They arrived fully intact, no crumbs!', date: '29/05/2026' }
    ],
    related: ['p3', 'p6', 'p8'],
    bundle: {
      items: ['p3', 'p8'],
      discount: 0.12
    }
  },
  {
    id: 'p3',
    name: 'Organic Whole Milk (1L)',
    brand: 'Dairy Pure',
    category: 'drinks',
    price: 2.29,
    oldPrice: 2.79,
    image: 'images/prod_milk.png',
    imageStyle: '',
    weight: '1 Liter bottle',
    badge: 'Fresh',
    badgeClass: 'new',
    stock: 'In Stock',
    stockClass: '',
    description: '100% pasteurized organic fresh whole cow\'s milk sourced from certified free-range local dairy farms. Creamy, nutrient-rich, and packaged in eco-friendly glass bottles to ensure maximum purity.',
    features: [
      'Naturally rich in Calcium, Protein, and Vitamin D3',
      'Sourced from pasture-raised, grass-fed cows',
      'No synthetic hormones, antibiotics, or chemical pesticides',
      'Bottled in sterile, sustainable, 100% recyclable glass'
    ],
    usage: 'Keep chilled. Perfect to drink cold, pour over breakfast cereals, add to tea/coffee, or use in premium cooking and dessert recipes.',
    origin: 'United Kingdom',
    storage: 'Keep refrigerated between 2°C and 4°C. Consume within 3 days of opening.',
    mfgDate: '01/06/2026',
    expDate: '08/06/2026',
    ingredients: 'Organic pasteurized homogenized whole cow\'s milk, Vitamin D3.',
    nutrition: {
      'Calories': '62 kcal',
      'Total Fat': '3.5g',
      'Saturated Fat': '2.3g',
      'Sodium': '44mg',
      'Total Carbohydrates': '4.7g',
      'Sugars': '4.7g',
      'Protein': '3.2g'
    },
    variants: [
      { name: 'Standard Bottle (1L)', priceOffset: 0, weight: '1L' },
      { name: 'Value Size (2L)', priceOffset: 1.80, weight: '2L' }
    ],
    reviews: [
      { name: 'Mark Evans', rating: 5, text: 'This milk is so rich and creamy! Nothing like the supermarket plastic bottle stuff.', date: '03/06/2026' },
      { name: 'Clara Oswald', rating: 4, text: 'Tastes amazing. I wish they had a skimmed milk version too.', date: '31/05/2026' }
    ],
    related: ['p1', 'p6', 'p8'],
    bundle: {
      items: ['p1', 'p2'],
      discount: 0.10
    }
  },
  {
    id: 'p4',
    name: 'Liquid Laundry Detergent (1.5L)',
    brand: 'Clean & Soft',
    category: 'laundry',
    price: 8.99,
    oldPrice: 10.99,
    image: 'images/prod_detergent.png',
    imageStyle: '',
    weight: '1.5 Liter bottle',
    badge: '',
    badgeClass: '',
    stock: 'In Stock',
    stockClass: '',
    description: 'Ultra-concentrated eco-friendly liquid laundry detergent formulated with plant-based active enzymes. Powerful stain removal action that preserves fabric colors, softens fibers, and leaves a fresh natural lavender scent.',
    features: [
      'Advanced plant-based active enzyme formula',
      'Effective in cold water cycles (down to 20°C) to save energy',
      'Hypoallergenic, dermatologically tested, safe for sensitive skin',
      'Free from optical brighteners, phosphates, and artificial dyes'
    ],
    usage: 'Follow garment labels. Pour detergent into dispenser drawer. Use 35ml for medium loads, 50ml for heavy or heavily soiled loads.',
    origin: 'Germany',
    storage: 'Store in a cool dry place. Keep out of reach of children.',
    mfgDate: '15/04/2026',
    expDate: '15/04/2028',
    ingredients: 'Anionic surfactants (5-15%), non-ionic surfactants (<5%), soap, enzymes, optical brighteners, natural lavender essential oil extract, preservatives.',
    nutrition: null,
    variants: [
      { name: 'Standard (1.5L - 40 washes)', priceOffset: 0, weight: '1.5L' },
      { name: 'Jumbo Pack (3L - 80 washes)', priceOffset: 7.00, weight: '3L' }
    ],
    reviews: [
      { name: 'Peter Parker', rating: 5, text: 'Cleaned my dirty suits perfectly. Very gentle on fabric and smells wonderful.', date: '28/05/2026' },
      { name: 'Mary Watson', rating: 4, text: 'Great cleaning power. The lavender scent is very subtle and not overwhelming.', date: '25/05/2026' }
    ],
    related: ['p2', 'p3', 'p6'],
    bundle: {
      items: ['p1', 'p3'],
      discount: 0.08
    }
  },
  {
    id: 'p5',
    name: 'Fresh Red Apples (1kg)',
    brand: 'Fresh Farms',
    category: 'groceries',
    price: 2.99,
    oldPrice: 3.49,
    image: 'images/prod_apples.png',
    imageStyle: '',
    weight: '1kg pack (approx. 5-6 apples)',
    badge: 'Bestseller',
    badgeClass: 'sale',
    stock: 'In Stock',
    stockClass: '',
    description: 'Crisp, juicy red Royal Gala apples handpicked from local high-altitude organic orchards. Naturally sweet, firm-textured, and packed immediately to lock in freshness and crunch.',
    features: [
      '100% naturally grown Gala apples',
      'Excellent source of Dietary Fiber and Vitamin C',
      'Crispy texture with high juice content and natural sweetness',
      'Washed and ready to eat, no artificial wax coating'
    ],
    usage: 'Washed and ready. Perfect for healthy snacking, slicing into fresh green salads, baking apple pies, or pressing into fresh apple juice.',
    origin: 'New Zealand',
    storage: 'Keep in the fruit crisper drawer of your refrigerator to preserve crispness up to 2 weeks.',
    mfgDate: '26/05/2026',
    expDate: '15/06/2026',
    ingredients: 'Organic Royal Gala apples.',
    nutrition: {
      'Calories': '52 kcal',
      'Total Fat': '0.2g',
      'Sodium': '1mg',
      'Total Carbohydrates': '14g',
      'Dietary Fiber': '2.4g',
      'Sugars': '10.4g',
      'Protein': '0.3g'
    },
    variants: [
      { name: 'Standard Pack (1kg)', priceOffset: 0, weight: '1kg' },
      { name: 'Bulk Pack (2kg)', priceOffset: 2.50, weight: '2kg' }
    ],
    reviews: [
      { name: 'Bruce Wayne', rating: 5, text: 'Extremely crisp and sweet. They stay fresh in my fridge for a very long time.', date: '02/06/2026' },
      { name: 'Selina Kyle', rating: 5, text: 'Perfect size, sweet, juicy. Great quality apples!', date: '30/05/2026' }
    ],
    related: ['p1', 'p7', 'p9'],
    bundle: {
      items: ['p1', 'p7'],
      discount: 0.12
    }
  },
  {
    id: 'p6',
    name: 'Fresh Orange Juice (1L)',
    brand: 'SunSqueeze',
    category: 'drinks',
    price: 3.99,
    oldPrice: 4.99,
    image: 'images/prod_juice.png',
    imageStyle: '',
    weight: '1 Liter bottle',
    badge: 'Sale',
    badgeClass: 'sale',
    stock: 'Only 4 left!',
    stockClass: 'low',
    description: '100% cold-pressed orange juice with pulp, squeezed from sun-ripened organic Valencia oranges. Never from concentrate, with zero added sugar, preservatives, or water. Pure liquid sunshine in a bottle.',
    features: [
      '100% pure cold-pressed Valencia oranges',
      'Packed with Natural Vitamin C (100% daily value per glass)',
      'Zero added sugar, colorings, or artificial flavors',
      'Cold-filled to preserve fresh aroma and nutrients'
    ],
    usage: 'Shake well before serving. Pour cold. Perfect breakfast juice, cocktail mixer, or frozen into healthy popsicles.',
    origin: 'Spain',
    storage: 'Keep refrigerated between 2°C and 5°C. Consume within 4 days of opening.',
    mfgDate: '30/05/2026',
    expDate: '10/06/2026',
    ingredients: '100% Cold-pressed orange juice.',
    nutrition: {
      'Calories': '45 kcal',
      'Total Fat': '0.1g',
      'Sodium': '1mg',
      'Total Carbohydrates': '10.4g',
      'Sugars': '8.4g',
      'Protein': '0.7g'
    },
    variants: [
      { name: 'Standard Bottle (1L)', priceOffset: 0, weight: '1L' },
      { name: 'Single-serve (250ml x 4 pack)', priceOffset: 0.80, weight: '4x250ml' }
    ],
    reviews: [
      { name: 'Barry Allen', rating: 5, text: 'Gives me an instant burst of energy! Tastes exactly like freshly squeezed oranges.', date: '01/06/2026' },
      { name: 'Iris West', rating: 4, text: 'Tastes amazing, very fresh. A bit pulpy, which I like but my kids don\'t.', date: '29/05/2026' }
    ],
    related: ['p3', 'p8', 'p2'],
    bundle: {
      items: ['p1', 'p2'],
      discount: 0.10
    }
  },
  {
    id: 'p7',
    name: 'Organic Green Apples (1kg)',
    brand: 'Fresh Farms',
    category: 'groceries',
    price: 3.29,
    oldPrice: 3.79,
    image: 'images/prod_apples.png',
    imageStyle: 'filter: hue-rotate(85deg) saturate(1.2);',
    weight: '1kg pack',
    badge: 'New',
    badgeClass: 'new',
    stock: 'In Stock',
    stockClass: '',
    description: 'Zesty, crisp organic Granny Smith green apples grown in rich volcanic soil. Known for their mouth-watering tartness, juicy white flesh, and bright green skin. Perfect for baking or healthy snacking.',
    features: [
      'USDA Certified Organic Granny Smith apples',
      'Low glycemic index, rich in pectin and dietary fibers',
      'Crispy, firm texture with a tangy and refreshing sour-sweet flavor',
      'Directly sourced from sustainable family orchards'
    ],
    usage: 'Wash and enjoy. Ideal for eating raw, pairing with peanut butter, baking inside classic apple pies, or juicing with celery and ginger.',
    origin: 'France',
    storage: 'Keep in refrigerator crisper drawer. Wrap in damp paper towel to extend freshness.',
    mfgDate: '27/05/2026',
    expDate: '18/06/2026',
    ingredients: 'Organic Granny Smith apples.',
    nutrition: {
      'Calories': '47 kcal',
      'Total Fat': '0.1g',
      'Sodium': '1mg',
      'Total Carbohydrates': '13.6g',
      'Dietary Fiber': '2.8g',
      'Sugars': '9.6g',
      'Protein': '0.4g'
    },
    variants: [
      { name: 'Standard Pack (1kg)', priceOffset: 0, weight: '1kg' },
      { name: 'Bulk Pack (2kg)', priceOffset: 2.20, weight: '2kg' }
    ],
    reviews: [
      { name: 'Tony Stark', rating: 5, text: 'Perfect balance of sour and crisp. Great for dipping in caramel!', date: '03/06/2026' },
      { name: 'Pepper Potts', rating: 5, text: 'Extremely fresh and crunchy. Great organic quality.', date: '31/05/2026' }
    ],
    related: ['p1', 'p5', 'p9'],
    bundle: {
      items: ['p1', 'p5'],
      discount: 0.12
    }
  },
  {
    id: 'p8',
    name: 'Organic Strawberry Milk (1L)',
    brand: 'Dairy Pure',
    category: 'drinks',
    price: 2.69,
    oldPrice: 3.19,
    image: 'images/prod_milk.png',
    imageStyle: 'filter: hue-rotate(300deg) saturate(0.8);',
    weight: '1 Liter bottle',
    badge: 'New',
    badgeClass: 'new',
    stock: 'In Stock',
    stockClass: '',
    description: 'Deliciously creamy organic strawberry milk blended from fresh whole cow\'s milk and real organic strawberry juice. Lightly sweetened with organic cane sugar, with no high-fructose syrup or synthetic dyes.',
    features: [
      'Prepared using real organic strawberry fruit juice',
      'High in Calcium, Vitamin D, and Essential Amino Acids',
      'No artificial colors (pink hue comes from beetroot juice)',
      'Sourced from certified grass-fed grass-pastured cattle'
    ],
    usage: 'Serve ice-cold. Shake vigorously before opening. Great after-school treat, breakfast drink, or base for strawberry milkshakes.',
    origin: 'United Kingdom',
    storage: 'Keep refrigerated between 2°C and 4°C. Consume within 3 days of opening.',
    mfgDate: '01/06/2026',
    expDate: '07/06/2026',
    ingredients: 'Organic fresh whole milk, organic cane sugar, organic strawberry juice concentrate, natural strawberry flavor extract, beetroot juice (for natural pink color).',
    nutrition: {
      'Calories': '78 kcal',
      'Total Fat': '3.2g',
      'Saturated Fat': '2.0g',
      'Sodium': '42mg',
      'Total Carbohydrates': '9.2g',
      'Sugars': '9.0g',
      'Protein': '3.0g'
    },
    variants: [
      { name: 'Standard Glass Bottle (1L)', priceOffset: 0, weight: '1L' },
      { name: 'Kids Snack Carton (200ml x 5 pack)', priceOffset: 0.90, weight: '5x200ml' }
    ],
    reviews: [
      { name: 'Peter Quill', rating: 5, text: 'Reminds me of my childhood. Super strawberry flavor, not too sweet!', date: '02/06/2026' },
      { name: 'Gamora', rating: 4, text: 'Creamy, rich, and made with clean organic ingredients. Very good product.', date: '30/05/2026' }
    ],
    related: ['p3', 'p6', 'p2'],
    bundle: {
      items: ['p2', 'p3'],
      discount: 0.10
    }
  },
  {
    id: 'p9',
    name: 'Gourmet Fruit & Cheese Basket',
    brand: 'G Mart Basket',
    category: 'groceries',
    price: 39.99,
    oldPrice: 47.99,
    image: 'images/grocery_hero.png',
    imageStyle: '',
    weight: 'Large size gift basket',
    badge: 'Weekly Deal',
    badgeClass: 'new',
    stock: 'Only 3 left!',
    stockClass: 'low',
    description: 'Artisan hand-woven wicker gift basket filled with premium local fresh cheeses (Gouda, Cheddar, and Brie) paired elegantly with handpicked organic grapes, sweet strawberries, and crisp Royal Gala apples.',
    features: [
      'Curated selection of three premium aged artisan cheeses (3x150g)',
      'Handpicked fresh seasonal organic grapes, strawberries, and apples',
      'Packaged in an elegant, reusable wicker basket with ribbon wrap',
      'Perfect luxury gift for housewarmings, anniversaries, or corporate events'
    ],
    usage: 'Keep cheese chilled until serving. Serve grapes and strawberries fresh alongside sliced cheeses at room temperature.',
    origin: 'United States / Local Farms',
    storage: 'Refrigerate cheeses immediately. Keep fresh fruit in cool drawer. Wicker basket can be reused.',
    mfgDate: '02/06/2026',
    expDate: '09/06/2026',
    ingredients: 'Artisan cheese (milk, cultures, salt, enzymes), organic red grapes, organic strawberries, organic Gala apples.',
    nutrition: {
      'Cheese Calories (per 100g)': '380 kcal',
      'Cheese Fat': '28g',
      'Fruit Calories (average)': '50 kcal',
      'Total Carbohydrates (Fruit)': '12g',
      'Protein (Cheese)': '22g'
    },
    variants: [
      { name: 'Standard Wicker Basket (Gourmet)', priceOffset: 0, weight: 'Large size' },
      { name: 'Grand Deluxe Wicker Basket (Premium)', priceOffset: 15.00, weight: 'Extra Large' }
    ],
    reviews: [
      { name: 'Steve Rogers', rating: 5, text: 'Perfect gift! The Cheddar and Brie were outstandingly rich, fruit was spotless.', date: '03/06/2026' },
      { name: 'Natasha Romanoff', rating: 5, text: 'Sent this to a colleague. They were blown away by the presentation and taste. Highly recommended.', date: '02/06/2026' }
    ],
    related: ['p1', 'p5', 'p7'],
    bundle: {
      items: ['p3', 'p6'],
      discount: 0.15
    }
  }
];
