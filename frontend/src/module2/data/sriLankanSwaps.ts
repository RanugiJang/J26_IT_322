import gotukolaSambol from '../assets/foods/gotukola_sambol.jpg';

export interface RecipeData {
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  budget: 'Affordable' | 'Flexible' | string;
  ingredients: string[];
  instructions: string[];
  cardioClinicalNote: string;
}

export interface FoodSwapItem {
  id: string;
  name: string;
  sinhalaName: string;
  category: string;
  imageUrl: string;
  clinicalConcern: string;
  concernDetails: string;
  nutrients: {
    calories: number;
    sodiumMg: number;
    fatG: number;
    sugarG: number;
  };
  healthySwap: {
    name: string;
    sinhalaName: string;
    imageUrl: string;
    clinicalBenefit: string;
    benefitDetails: string;
    nutrients: {
      calories: number;
      sodiumMg: number;
      fatG: number;
      sugarG: number;
      potassiumMg: number;
    };
    recipe: RecipeData;
  };
  alternativeSwaps: Array<{
    name: string;
    sinhalaName: string;
    imageUrl: string;
    benefit: string;
    recipeSummary: string;
  }>;
}

export const SRI_LANKAN_FOOD_SWAPS: FoodSwapItem[] = [
  {
    id: 'coconut-sambol',
    name: 'Coconut Sambol (Pol Sambol)',
    sinhalaName: 'පොල් සම්බෝල',
    category: 'Sambol / Side',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'High Saturated Fat & Sodium Load',
    concernDetails: 'Traditional Pol Sambol contains large portions of grated mature coconut (high in lauric saturated fats) and salted chili paste. Excess saturated fat increases circulating LDL cholesterol, while added salt elevates arterial blood pressure prior to surgery.',
    nutrients: {
      calories: 195,
      sodiumMg: 420,
      fatG: 18.2,
      sugarG: 2.1,
    },
    healthySwap: {
      name: 'Gotukola Sambol',
      sinhalaName: 'ගොටුකොළ සම්බෝල',
      imageUrl: gotukolaSambol,
      clinicalBenefit: 'Microvascular Vasodilation & 70% Less Saturated Fat',
      benefitDetails: 'Gotukola (Centella asiatica) is rich in bioactive triterpenoids that enhance microcirculation and arterial compliance. Uses only a modest sprinkle of coconut, cutting saturated fat by 70% while boosting potassium and dietary nitrates.',
      nutrients: {
        calories: 68,
        sodiumMg: 65,
        fatG: 2.1,
        sugarG: 1.0,
        potassiumMg: 310,
      },
      recipe: {
        title: 'Easy Gotukola Sambol (Heart-Healthy)',
        prepTime: '10 minutes',
        cookTime: '0 minutes (Raw Fresh Salad)',
        servings: '2 - 3 portions',
        budget: 'Affordable (Home garden / local market)',
        ingredients: [
          '1 cup fresh gotukola leaves, washed thoroughly and finely shredded',
          '2 tablespoons freshly grated coconut (strictly measured for heart safety)',
          '1–2 tablespoons finely chopped small red shallots / onions',
          '1 small green chili, finely sliced (to taste)',
          '1 tablespoon fresh lime juice',
          '1/4 teaspoon freshly ground black pepper',
          'Zero added salt (or maximum 1 tiny pinch if medically cleared)'
        ],
        instructions: [
          'Wash the gotukola thoroughly in cold running water and drain on a clean tea towel.',
          'Roll leaves into a tight bundle and shred as finely as possible with a sharp knife.',
          'In a bowl, combine the shredded gotukola, grated coconut, and chopped red shallots.',
          'Add fresh lime juice, green chili, and black pepper.',
          'Toss lightly with fingertips just before serving — do not squeeze or bruise leaves.',
          'Serve immediately with red raw rice and dhal curry for an optimal cardioprotective lunch.'
        ],
        cardioClinicalNote: 'Bioactive asiaticoside in gotukola promotes nitric oxide synthesis in coronary endothelial cells, improving vascular flexibility without spiking blood pressure.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Mukunuwenna Sambol',
        sinhalaName: 'මුකුණුවැන්න සම්බෝල',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        benefit: 'Rich in dietary carotenoids and iron for pre-operative red blood cell replenishment.',
        recipeSummary: 'Quickly steam mukunuwenna for 60 seconds; toss with lime, pepper, and 1 tsp coconut.'
      },
      {
        name: 'Kathurumurunga Mallum',
        sinhalaName: 'කතුරුමුරුංගා මැල්ලුම',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
        benefit: 'Natural bioflavonoids soothe vascular inflammation and stabilize capillary permeability.',
        recipeSummary: 'Gently flash-heated with turmeric, onions, and garlic without any cooking oil.'
      }
    ]
  },
  {
    id: 'fried-fish',
    name: 'Fried Fish (Malu Theldala)',
    sinhalaName: 'මාළු බැදලා',
    category: 'Protein / Fish',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'High Heat Oxidation & Inflammatory Trans Fats',
    concernDetails: 'Deep-frying fish in high-temperature vegetable oils generates toxic lipid peroxides and advanced glycation end-products (AGEs). These induce coronary endothelial inflammation, stiffen arteries, and elevate post-meal cardiac workload.',
    nutrients: {
      calories: 285,
      sodiumMg: 520,
      fatG: 19.5,
      sugarG: 0,
    },
    healthySwap: {
      name: 'Malu Ambul Thiyal',
      sinhalaName: 'මාළු ඇඹුල් තියල්',
      imageUrl: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: 'Zero Cooking Oil, Omega-3 Rich & Hydroxycitric Acid',
      benefitDetails: 'Traditional southern dry sour curry cooked strictly in a clay pot without a single drop of cooking oil or coconut cream. Preserves heart-protective Omega-3 EPA/DHA fatty acids while Goraka provides natural polyphenols that aid lipid metabolism.',
      nutrients: {
        calories: 145,
        sodiumMg: 180,
        fatG: 3.2,
        sugarG: 0,
        potassiumMg: 420,
      },
      recipe: {
        title: 'Traditional Malu Ambul Thiyal (Oil-Free)',
        prepTime: '15 minutes',
        cookTime: '20 minutes',
        servings: '4 portions',
        budget: 'Affordable / Market fresh',
        ingredients: [
          '350g fresh Tuna (Kelawalla or Balaya), cut into 1-inch cubes',
          '4–5 pieces dried Goraka (Garcinia cambogia), soaked in warm water',
          '1.5 teaspoons freshly crushed black peppercorns (miris)',
          '1 teaspoon minced garlic & 1/2 teaspoon grated ginger',
          '1 sprig fresh curry leaves & 1 inch pandan leaf (rampe)',
          '1/4 cup water (zero cooking oil)',
          '1/2 teaspoon roasted fenugreek powder'
        ],
        instructions: [
          'Grind the soaked Goraka into a smooth black paste with a little warm water.',
          'In a bowl, mix the goraka paste, crushed black pepper, minced garlic, and ginger.',
          'Gently coat each tuna cube with the spice paste so every piece is completely covered.',
          'Arrange the fish in a single layer at the bottom of a clay pot (chattiya).',
          'Add curry leaves, rampe, and 1/4 cup water.',
          'Cover and simmer on low heat for 18–20 minutes until the gravy reduces to a glossy, dark coating.',
          'Allow to rest for 10 minutes before serving. Can be stored safely for 3 days without refrigeration.'
        ],
        cardioClinicalNote: 'Goraka contains hydroxycitric acid (HCA) and black pepper contains piperine, an anti-inflammatory synergy that blunts hepatic fatty acid synthesis.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Malu Mirisata (Mild Spicy Fish Stew)',
        sinhalaName: 'මාළු මිරිසට',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
        benefit: 'Boiled fish stew with tomatoes, fenugreek, and lime with zero added oil.',
        recipeSummary: 'Simmer tuna with diced tomatoes, curry powder, and thin broth for 15 minutes.'
      },
      {
        name: 'Banana-Leaf Steamed Modha',
        sinhalaName: 'කෙසෙල් කොළේ තැම්බූ මාළු',
        imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
        benefit: 'Delicate steaming locks in all Omega-3 oils while infusing banana leaf polyphenols.',
        recipeSummary: 'Marinate white fish with turmeric, lime, and crushed pepper; wrap in banana leaf and steam.'
      }
    ]
  },
  {
    id: 'sugary-drink',
    name: 'Sugary Drink (Sweet Soda / Carbonated Cola)',
    sinhalaName: 'පැණි බීම / කෝලා',
    category: 'Beverage',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'Acute Endothelial Dysfunction & Rapid Sugar Spike',
    concernDetails: 'A single 330ml bottle of commercial sweet soda delivers 39g of refined simple sugars (high-fructose corn syrup). This causes acute oxidative arterial stress, impairs flow-mediated vasodilation within 30 minutes, and promotes arterial wall stiffness.',
    nutrients: {
      calories: 140,
      sodiumMg: 45,
      fatG: 0,
      sugarG: 39.0,
    },
    healthySwap: {
      name: 'Fresh King Coconut Water (Thambili)',
      sinhalaName: 'තැඹිලි වතුර',
      imageUrl: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: '290mg Potassium Electrolytes & Blood Pressure Support',
      benefitDetails: 'Pure natural isotonic hydration direct from the tree. Loaded with bioavailable potassium (290mg) that counterbalances dietary sodium, relaxes vascular smooth muscle, and stabilizes heart rate before surgery.',
      nutrients: {
        calories: 45,
        sodiumMg: 25,
        fatG: 0.1,
        sugarG: 5.5,
        potassiumMg: 290,
      },
      recipe: {
        title: 'Pure Thambili Elixir with Mint & Lime',
        prepTime: '3 minutes',
        cookTime: '0 minutes (Pure Beverage)',
        servings: '1 serving (approx. 250ml)',
        budget: 'Affordable (Street vendor / tree-fresh)',
        ingredients: [
          '1 fresh golden Sri Lankan King Coconut (Thambili)',
          '2 fresh mint leaves (bruised gently)',
          '3–4 drops fresh lime juice (optional for refreshing zest)',
          'Zero added sugar, syrups, or artificial sweeteners'
        ],
        instructions: [
          'Carefully slice off the top of the fresh King Coconut.',
          'Pour the clear water through a strainer into a glass (or drink straight from the nut with a paper straw).',
          'Gently float 2 fresh mint leaves and add 3 drops of fresh lime juice.',
          'Drink immediately at room temperature or lightly chilled for maximum cellular hydration.',
          'Do not scrape the thick oily flesh if watching saturated fat intake; enjoy the pure water.'
        ],
        cardioClinicalNote: 'Natural magnesium and potassium in Thambili activate vascular sodium-potassium ATPase pumps, reducing peripheral vascular resistance.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Ranawara Herbal Tea',
        sinhalaName: 'රණවරා තේ',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
        benefit: 'Ancient Cassia auriculata infusion clinically shown to blunt post-meal blood sugar surges.',
        recipeSummary: 'Boil dried Ranawara blossoms in water for 5 minutes; serve warm with lime.'
      },
      {
        name: 'Iramusu Herbal Tonic',
        sinhalaName: 'ඉරමුසු කැඳ/තේ',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
        benefit: 'Hemidesmus indicus calms autonomic cardiac nerves and purifies peripheral blood flow.',
        recipeSummary: 'Steep crushed iramusu roots in hot water; sip slowly before evening rest.'
      }
    ]
  },
  {
    id: 'fried-rolls',
    name: 'Fried Short Eats / Rolls (Beef / Mutton Roll)',
    sinhalaName: 'රෝල්ස් / ෂෝට් ඊට්ස්',
    category: 'Snack',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'Trans Fats from Reused Oil & Salt Spikes',
    concernDetails: 'Commercial short eats are deep-fried in reused cooking oils laden with trans fats and high sodium seasoning (680mg+ per roll). Reused oil creates inflammatory aldehydes that destabilize coronary atherosclerotic plaques.',
    nutrients: {
      calories: 320,
      sodiumMg: 680,
      fatG: 18.5,
      sugarG: 1.5,
    },
    healthySwap: {
      name: 'Steamed Red Dhal Patty (Thambapu Wade)',
      sinhalaName: 'තැම්බූ පරිප්පු වඩේ',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: 'High Soluble Fiber, Plant Protein & Zero Trans Fat',
      benefitDetails: 'Red split lentils (parippu) mashed with cumin, onions, curry leaves, and steamed rather than deep-fried. Delivers 6g of soluble fiber to bind bile acids and lower LDL, with virtually zero saturated fat.',
      nutrients: {
        calories: 110,
        sodiumMg: 95,
        fatG: 1.2,
        sugarG: 0.5,
        potassiumMg: 280,
      },
      recipe: {
        title: 'Steamed Heart-Safe Lentil Patties',
        prepTime: '15 minutes (+ 30m lentil soak)',
        cookTime: '10 minutes',
        servings: '6 patties',
        budget: 'Very affordable (Household pantry dhal)',
        ingredients: [
          '1 cup red lentils (mysore dhal), soaked for 45 minutes and drained',
          '2 tablespoons finely diced red shallots',
          '1 sprig fresh curry leaves, finely minced',
          '1/2 teaspoon cumin seeds (jeera) & 1/4 teaspoon turmeric powder',
          '1 small green chili, seeded and minced',
          '1 tablespoon fresh coriander or gotukola leaves'
        ],
        instructions: [
          'Coarsely crush the soaked lentils in a stone grinder or pulse in blender (leave texture chunky).',
          'Mix in the chopped shallots, curry leaves, cumin seeds, turmeric, and green chili.',
          'Divide mixture into 6 equal portions and flatten into 1/2-inch thick round patties.',
          'Place patties into a steamer basket (or metal plate in a covered pot with boiling water).',
          'Steam on medium heat for 8–10 minutes until firm and fragrant.',
          'Serve warm with a side of fresh mint-lime dip. Completely free of frying oils.'
        ],
        cardioClinicalNote: 'Soluble beta-glucans and legumes reduce systemic C-reactive protein (CRP) levels prior to elective cardiac procedures.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Kurakkan Roti with Lunu Miris',
        sinhalaName: 'කුරක්කන් රොටී',
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
        benefit: 'Finger millet provides complex low-GI carbs, magnesium, and slow-burning energy.',
        recipeSummary: 'Mix finger millet flour with warm water; bake dry on a flat clay pan.'
      },
      {
        name: 'Karapincha Herbal Kenda',
        sinhalaName: 'කරපිංචා කැඳ',
        imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
        benefit: 'Curry leaf alkaloids support natural cholesterol elimination through liver pathways.',
        recipeSummary: 'Blend curry leaves with red rice broth; heat gently with 1 tsp thin coconut milk.'
      }
    ]
  },
  {
    id: 'dried-fish',
    name: 'Dried Fish (Karawala)',
    sinhalaName: 'කරවල',
    category: 'Protein / Preserved',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'Critical Sodium Overload (> 1,800mg/100g)',
    concernDetails: 'Traditional dried fish is preserved by heavy salt curing, packing over 1,800mg of sodium into a single serving. This leads to rapid fluid retention, pulmonary congestion risk, and acute hypertension spikes in cardiac patients.',
    nutrients: {
      calories: 220,
      sodiumMg: 1850,
      fatG: 4.5,
      sugarG: 0,
    },
    healthySwap: {
      name: 'Fresh Lake Fish / Modha with Turmeric & Lime',
      sinhalaName: 'දෙහි සහ කහ යෙදූ නැවුම් මාළු',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: '95% Less Sodium with Complete Muscle-Building Protein',
      benefitDetails: 'Fresh water or sea fish cooked fresh with turmeric, black pepper, and lime delivers clean, bioavailable protein needed for surgical wound healing while keeping sodium under 90mg per serving.',
      nutrients: {
        calories: 125,
        sodiumMg: 85,
        fatG: 2.1,
        sugarG: 0,
        potassiumMg: 380,
      },
      recipe: {
        title: 'Banana-Leaf Baked Fresh Fish with Turmeric',
        prepTime: '10 minutes',
        cookTime: '15 minutes',
        servings: '2 portions',
        budget: 'Affordable / Market fresh',
        ingredients: [
          '250g fresh white fish fillets (Modha, Tilapia, or Paraw)',
          '1/2 teaspoon pure Ceylon turmeric powder (kaha)',
          '1 tablespoon fresh lime juice',
          '1/2 teaspoon coarsely cracked black peppercorns',
          '1 clove garlic, finely grated',
          '1 fresh banana leaf (or baking parchment paper)',
          '1 sprig fresh curry leaves'
        ],
        instructions: [
          'Rinse fresh fish fillets and pat dry with clean paper towels.',
          'Rub fillets with turmeric powder, crushed black pepper, grated garlic, and lime juice.',
          'Place seasoned fish on a softened banana leaf along with fresh curry leaves.',
          'Fold banana leaf into a tight parcel and secure with a toothpick.',
          'Cook on a dry non-stick griddle / pan on low heat for 7 minutes on each side.',
          'Unwrap and serve immediately with steamed red rice. Fragrant, tender, and virtually sodium-free.'
        ],
        cardioClinicalNote: 'Turmeric curcuminoids suppress NF-kB inflammatory pathways, protecting coronary bypass graft patency.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Oyster Mushroom Kuruma',
        sinhalaName: 'පිදුරු හතු කරිය',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        benefit: 'Delivers meaty savory umami texture with zero cholesterol and high potassium.',
        recipeSummary: 'Sauté mushrooms dry with garlic, fenugreek, and thin dhal broth.'
      }
    ]
  },
  {
    id: 'instant-noodles',
    name: 'Instant Noodles with Seasoning Packets',
    sinhalaName: 'ඉන්ස්ටන්ට් නූඩ්ල්ස්',
    category: 'Staple / Processed',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'Monosodium Glutamate, Palm Oil & Fast Starch',
    concernDetails: 'Pre-fried in saturated palm oil to achieve instant cooking. Flavored with artificial MSG seasoning containing over 1,200mg sodium per packet with zero soluble fiber, causing rapid blood glucose destabilization.',
    nutrients: {
      calories: 380,
      sodiumMg: 1240,
      fatG: 16.0,
      sugarG: 3.0,
    },
    healthySwap: {
      name: 'Steamed Red Rice String Hoppers with Kiri Hodi',
      sinhalaName: 'රතු ඉඳිආප්ප සහ කිරි හොදි',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: 'Low Glycemic Index, Steamed & Zero Chemical Additives',
      benefitDetails: 'Unpolished red rice flour string hoppers (Indiappa) steamed naturally. Paired with light turmeric coconut milk broth (diya kiri) enriched with fenugreek, garlic, and onions for slow, steady glycemic release.',
      nutrients: {
        calories: 175,
        sodiumMg: 110,
        fatG: 2.8,
        sugarG: 1.0,
        potassiumMg: 210,
      },
      recipe: {
        title: 'Mild Fenugreek Kiri Hodi for String Hoppers',
        prepTime: '5 minutes',
        cookTime: '8 minutes',
        servings: '3 portions',
        budget: 'Very affordable',
        ingredients: [
          '8–10 steamed red rice string hoppers (homemade or fresh bakery)',
          '1 cup thin coconut milk (diya kiri — second extract, not thick cream)',
          '1/4 teaspoon ground turmeric & 1/2 teaspoon fenugreek seeds (uluhal)',
          '2 small red shallots, sliced',
          '1 clove garlic, sliced',
          '1 sprig curry leaves & 1 slice green chili',
          '1 teaspoon fresh lime juice (stirred in at the very end)'
        ],
        instructions: [
          'In a small pot, combine thin coconut milk, turmeric, fenugreek seeds, shallots, garlic, and curry leaves.',
          'Heat over gentle low flame, stirring continuously with a wooden spoon.',
          'Do not let the coconut milk boil or curdle; simmer gently for 5 minutes until aromatic.',
          'Turn off flame, allow to cool slightly, and stir in fresh lime juice.',
          'Ladle warm Kiri Hodi over steamed red string hoppers.'
        ],
        cardioClinicalNote: 'Fenugreek (uluhal) contains 4-hydroxyisoleucine which stimulates glucose-dependent insulin secretion smoothly.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Whole Oats Porridge with Cinnamon',
        sinhalaName: 'කුරුඳු යෙදූ ඕට්ස් කැඳ',
        imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80',
        benefit: 'Rich in oat beta-glucan fiber clinically proven to lower arterial LDL cholesterol.',
        recipeSummary: 'Cook rolled oats with water, Ceylon cinnamon stick, and a splash of low-fat milk.'
      }
    ]
  },
  {
    id: 'biscuits-sweets',
    name: 'Tea Biscuits & Fried Sweets (Kavum / Kokis)',
    sinhalaName: 'බිස්කට් / කැවුම් / කොකිස්',
    category: 'Snack / Sweets',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'Refined Palm Shortening & High Glycemic Fructose',
    concernDetails: 'Commercial tea biscuits and traditional festival sweetmeats are formulated with industrial palm shortening and refined sugar, spiking triglyceride synthesis in the liver and promoting coronary microvascular constriction.',
    nutrients: {
      calories: 260,
      sodiumMg: 280,
      fatG: 12.0,
      sugarG: 22.0,
    },
    healthySwap: {
      name: 'Fresh Red Papaya Slices with Lime (Papol)',
      sinhalaName: 'දෙහි යුෂ යෙදූ නැවුම් පැපොල්',
      imageUrl: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: 'Natural Papain Enzymes, Vitamin C & Soluble Pectin Fiber',
      benefitDetails: 'Fresh ripe Ceylon papaya is rich in lycopene, carotenoids, and papain enzymes that reduce systemic oxidative stress. Natural fruit sugars are buffered by soluble pectin fiber, preventing glucose spikes.',
      nutrients: {
        calories: 55,
        sodiumMg: 5,
        fatG: 0.2,
        sugarG: 9.0,
        potassiumMg: 260,
      },
      recipe: {
        title: 'Chilled Ceylon Papaya with Fresh Lime Zest',
        prepTime: '5 minutes',
        cookTime: '0 minutes',
        servings: '1 bowl',
        budget: 'Very affordable (Fresh local produce)',
        ingredients: [
          '1 cup fresh ripe red papaya, peeled, seeded, and cut into 1-inch cubes',
          '1/2 fresh juicy green lime',
          'Optional: 1 fresh mint leaf for garnish'
        ],
        instructions: [
          'Chill ripe papaya in refrigerator for 20 minutes before preparation.',
          'Peel and dice into bite-sized cubes and place into a glass or ceramic serving bowl.',
          'Squeeze fresh lime juice evenly over the cubes right before serving.',
          'Enjoy as an afternoon tea companion instead of tea biscuits or fried sweets.'
        ],
        cardioClinicalNote: 'Lycopene in red papaya improves high-density lipoprotein (HDL) function and reduces vascular free radical damage.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Guava Slices with Black Pepper',
        sinhalaName: 'ගම්මිරිස් යෙදූ පේර',
        imageUrl: 'https://images.unsplash.com/photo-1536511135898-752b18c92582?auto=format&fit=crop&w=600&q=80',
        benefit: 'Packed with 4x the Vitamin C of oranges and soluble dietary pectin fiber.',
        recipeSummary: 'Slice fresh crisp guava; dust with cracked black pepper and lime.'
      }
    ]
  },
  {
    id: 'fried-chicken',
    name: 'Fried Chicken (Skin-on Deep Fried)',
    sinhalaName: 'බැදපු කුකුළු මස්',
    category: 'Protein / Poultry',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    clinicalConcern: 'Heterocyclic Amines & Saturated Poultry Fat',
    concernDetails: 'Deep-frying skin-on poultry in vegetable oil saturates the meat in oxidized lipids and generates heterocyclic amines that trigger vascular oxidative damage and elevate LDL cholesterol.',
    nutrients: {
      calories: 340,
      sodiumMg: 620,
      fatG: 22.0,
      sugarG: 0,
    },
    healthySwap: {
      name: 'Clay Pot Roasted Spiced Chicken Curry (Kukul Mas)',
      sinhalaName: 'කුළුබඩු යෙදූ කුකුළු මස් කරිය',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      clinicalBenefit: 'Trimmed Skinless Lean Protein with Curcumin & Cinnamon',
      benefitDetails: 'Skinless lean chicken breast stewed gently in a clay pot with roasted Sri Lankan spices, cinnamon, and garlic. Delivers 26g of pure muscle-building protein with 75% less fat and zero trans fats.',
      nutrients: {
        calories: 165,
        sodiumMg: 140,
        fatG: 4.0,
        sugarG: 1.0,
        potassiumMg: 350,
      },
      recipe: {
        title: 'Heart-Safe Skinless Clay Pot Chicken Curry',
        prepTime: '15 minutes',
        cookTime: '25 minutes',
        servings: '4 portions',
        budget: 'Moderate',
        ingredients: [
          '400g skinless, boneless chicken breast, trimmed of all visible fat and cubed',
          '1 tablespoon roasted Sri Lankan curry powder (thunapaha)',
          '1/2 teaspoon chili powder & 1/2 teaspoon turmeric powder',
          '1 inch true Ceylon cinnamon quill (kurundu)',
          '1 stalk lemongrass (serai), bruised & 1 sprig curry leaves',
          '3 cloves garlic & 1 inch ginger, crushed into paste',
          '1/2 cup water + 2 tablespoons thin coconut milk'
        ],
        instructions: [
          'Marinate chicken cubes with curry powder, turmeric, chili, garlic, and ginger for 15 minutes.',
          'Place chicken in a dry clay pot over medium-low heat. Stir for 3 minutes to seal juices without adding any oil.',
          'Add water, cinnamon quill, lemongrass, and curry leaves.',
          'Cover and simmer on gentle heat for 18–20 minutes until chicken is tender.',
          'Stir in 2 tablespoons thin coconut milk and cook for 2 more minutes.',
          'Serve warm with red rice and gotukola sambol.'
        ],
        cardioClinicalNote: 'Ceylon cinnamon (Cinnamomum verum) improves insulin sensitivity and reduces serum triglyceride concentrations.'
      }
    },
    alternativeSwaps: [
      {
        name: 'Soy Meat Curry with Fenugreek',
        sinhalaName: 'සෝයා මීට් කරිය',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        benefit: 'Zero saturated fat and zero cholesterol plant-based isoflavones.',
        recipeSummary: 'Soak soy chunks in warm turmeric water; cook in roasted curry spices.'
      }
    ]
  }
];
