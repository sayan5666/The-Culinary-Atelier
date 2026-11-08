import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDr2sitAtMOmmsaT8WmXUU8Pb50uPx0n7I";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Primary fast model (gemini-3.1-flash-lite) and secondary model
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const FALLBACK_MODEL = "gemini-3.8-flash";

// In-memory caches to drastically reduce Gemini API load and eliminate 429 quota errors
const recipeCache = new Map<string, any>();
const autocompleteCache = new Map<string, string[]>();

// Curated comprehensive culinary archive for instant autocomplete and search
const CULINARY_ARCHIVE: string[] = [
  "Pacific Rim Salmon Poke Bowl",
  "Authentic Carbonara",
  "Glazed Peking Duck",
  "Artisan Vegetable Samosas",
  "Butter Chicken",
  "Paneer Tikka",
  "Hyderabadi Biryani",
  "Masala Dosa",
  "Dal Makhani",
  "Gulab Jamun",
  "Sourdough Starters",
  "Japanese Omelette (Tamagoyaki)",
  "Vegan Umami Ramen",
  "Creamy Garlic Chicken with Mushrooms",
  "Classic Beef Bourguignon",
  "Spaghetti Aglio e Olio",
  "Neapolitan Margherita Pizza",
  "Thai Green Curry",
  "Pad Thai",
  "Tom Yum Goong",
  "Chicken Tikka Masala",
  "Palak Paneer",
  "Rogan Josh",
  "Tandoori Chicken",
  "Chana Masala",
  "Birria Tacos",
  "Guacamole and Fresh Tortillas",
  "Enchiladas Suizas",
  "French Onion Soup",
  "Duck Confit",
  "Coq au Vin",
  "Ratatouille",
  "Spanish Paella Valenciana",
  "Patatas Bravas",
  "Churros con Chocolate",
  "Vietnamese Pho Bo",
  "Banh Mi Sandwich",
  "Korean Bibimbap",
  "Korean Fried Chicken",
  "Kimchi Jjigae",
  "Greek Moussaka",
  "Souvlaki with Tzatziki",
  "Shakshuka with Feta",
  "Middle Eastern Falafel",
  "Creamy Hummus with Za'atar",
  "Moroccan Lamb Tagine",
  "Wild Mushroom Risotto",
  "Lobster Thermidor",
  "Grilled Ribeye with Chimichurri",
  "Pan-Seared Scallops with Herb Butter",
  "Crispy Skin Salmon with Asparagus",
  "Tiramisu Tradizionale",
  "Matcha Basque Cheesecake",
  "Classic French Crème Brûlée",
  "Avocado Toast with Poached Egg",
  "Caprese Salad with Burrata",
  "Caesar Salad with Crispy Pancetta",
  "Honey Mustard Glazed Pork Tenderloin",
  "Baja Fish Tacos",
  "Seafood Bouillabaisse",
  "Gnocchi al Gorgonzola",
  "Classic Lasagna Bolognese",
  "Thai Basil Chicken (Pad Krapow)",
  "Massaman Beef Curry",
  "Mango Sticky Rice"
];

// Helper to provide high-resolution, gourmet food photography matching dish keywords
function getRecipeImageUrl(title: string, cuisine: string = ""): string {
  const lower = `${title} ${cuisine}`.toLowerCase();
  if (lower.includes("salmon") || lower.includes("poke") || lower.includes("sashimi") || lower.includes("pacific rim")) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("carbonara") || lower.includes("pasta") || lower.includes("spaghetti") || lower.includes("lasagna") || lower.includes("gnocchi") || lower.includes("aglio")) {
    return "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("duck") || lower.includes("peking")) {
    return "https://images.unsplash.com/photo-1514944298352-f47228a6fcf7?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("samosa")) {
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("butter chicken") || lower.includes("tikka masala") || lower.includes("curry") || lower.includes("korma")) {
    return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("paneer")) {
    return "https://images.unsplash.com/photo-1567184109411-b28f2baf6096?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("biryani") || lower.includes("fried rice") || lower.includes("pilaf")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("dosa")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("dal") || lower.includes("lentil") || lower.includes("chana")) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("jamun") || lower.includes("dessert") || lower.includes("cake") || lower.includes("tiramisu") || lower.includes("sweet") || lower.includes("brûlée")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("pizza") || lower.includes("focaccia")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("ramen") || lower.includes("soup") || lower.includes("pho") || lower.includes("bouillabaisse")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("salad") || lower.includes("caprese") || lower.includes("caesar")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("steak") || lower.includes("beef") || lower.includes("bourguignon")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("taco") || lower.includes("mexican") || lower.includes("enchilada")) {
    return "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("sourdough") || lower.includes("bread")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("egg") || lower.includes("omelette") || lower.includes("shakshuka")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("chicken")) {
    return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("scallop") || lower.includes("lobster") || lower.includes("shrimp") || lower.includes("seafood")) {
    return "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=1200&q=80";
  }

  const fallbacks = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80"
  ];
  const hash = title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
}

// Curated recipes for featured / trending items so they load instantly with zero API consumption
const PRESET_RECIPES: Record<string, any> = {
  "pacific rim salmon poke bowl": {
    title: "Pacific Rim Salmon Poke Bowl",
    description: "A masterclass in balance: marinated sashimi-grade salmon met with the crunch of heirloom radishes, creamy avocado crema, and warm seasoned sushi rice.",
    prepTime: "25m",
    cookTime: "20m",
    difficulty: "Medium",
    cuisine: "Pacific Rim / Hawaiian",
    ingredients: [
      "1 lb sashimi-grade wild salmon, cubed into 1/2-inch bites",
      "2 cups cooked seasoned sushi rice",
      "2 ripe avocados, diced",
      "4 heirloom radishes, thinly shaved",
      "1 Japanese cucumber, thinly sliced",
      "3 tbsp low-sodium soy sauce or tamari",
      "1 tbsp toasted sesame oil",
      "1 tsp freshly grated ginger",
      "1 tbsp toasted white & black sesame seeds",
      "1 sheet nori seaweed, thinly shredded",
      "2 green onions, thinly sliced on bias"
    ],
    instructions: [
      "In a medium glass bowl, whisk together soy sauce, sesame oil, and freshly grated ginger.",
      "Gently fold in the cubed salmon and sliced green onions. Chill in the refrigerator for 15 minutes to marinate.",
      "Divide warm sushi rice between deep ceramic serving bowls.",
      "Arrange the marinated salmon, sliced cucumber, diced avocado, and shaved radishes in vibrant sections over the rice.",
      "Garnish with toasted sesame seeds and shredded nori. Serve immediately with sriracha mayo or pickled ginger."
    ],
    tips: [
      "Ensure salmon is strictly sashimi-grade kept ice cold until preparation.",
      "Season sushi rice with a touch of rice vinegar, sugar, and salt while still warm."
    ],
    winePairing: "Crisp Marlborough Sauvignon Blanc or chilled Junmai Daiginjo Sake",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
  },
  "authentic carbonara": {
    title: "Authentic Carbonara",
    description: "The Roman masterpiece: perfectly al dente rigatoni coated in an emulsified silky sauce of farm eggs, freshly grated Pecorino Romano, and crispy guanciale.",
    prepTime: "10m",
    cookTime: "15m",
    difficulty: "Easy",
    cuisine: "Italian",
    ingredients: [
      "400g spaghetti or rigatoni",
      "200g guanciale (or pancetta), diced into lardons",
      "4 large farm-fresh egg yolks + 1 whole egg",
      "100g finely grated Pecorino Romano cheese",
      "Generous freshly cracked coarse black pepper",
      "Kosher salt for pasta water"
    ],
    instructions: [
      "Bring a large pot of water to a gentle boil and salt lightly (guanciale & pecorino are already savory).",
      "In a wide cold skillet, add the guanciale and cook over medium-low heat until the fat renders and the edges turn crispy and golden. Remove from heat.",
      "In a mixing bowl, vigorously whisk together the whole egg, egg yolks, grated Pecorino, and freshly cracked black pepper until a thick paste forms.",
      "Cook pasta until 1 minute shy of al dente. Reserve 1 cup of starchy pasta water.",
      "Transfer hot pasta directly into the guanciale skillet (off the heat). Toss to coat in rendered fat.",
      "Stir 2-3 tablespoons of warm pasta water into the egg-cheese mixture, then pour over the pasta while tossing continuously off heat until a glossy, velvety emulsion coats every strand.",
      "Plate immediately with an extra flurry of Pecorino Romano and freshly cracked pepper."
    ],
    tips: [
      "Never use cream or garlic—authentic carbonara creates its richness entirely through egg and pecorino emulsion.",
      "Ensure skillet is off the flame when adding the eggs to prevent scrambling."
    ],
    winePairing: "Crisp Frascati Superiore or dry Chianti Classico",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=80"
  },
  "glazed peking duck": {
    title: "Glazed Peking Duck",
    description: "Iconic Imperial Chinese culinary heritage: lacquered crackling skin with tender, aromatic duck meat served with paper-thin mandarin pancakes.",
    prepTime: "60m",
    cookTime: "90m",
    difficulty: "Expert",
    cuisine: "Chinese",
    ingredients: [
      "1 whole duck (approx. 5-6 lbs), cleaned and patted dry",
      "3 tbsp maltose or honey",
      "2 tbsp Shaoxing rice wine",
      "1 tbsp red wine vinegar",
      "1 tbsp Chinese five-spice powder",
      "12-16 warm mandarin pancakes",
      "1 bunch scallions, finely julienned",
      "1 cucumber, seeded and julienned",
      "Hoisin sauce or sweet bean sauce for dipping"
    ],
    instructions: [
      "Blanch duck in boiling water for 30 seconds to tighten skin, then hang or elevate on rack in refrigerator for 12-24 hours to dry skin thoroughly.",
      "Whisk maltose, Shaoxing wine, vinegar, and five-spice powder with a little warm water. Brush generously over the duck.",
      "Roast at 375°F (190°C) for 60-75 minutes until skin is mahogany, shatteringly crisp, and internal temperature reaches 165°F.",
      "Rest for 15 minutes before carving thin, glistening slices with crisp skin attached.",
      "Serve warm with steamed pancakes, julienned scallions, cucumber, and sweet bean sauce."
    ],
    tips: [
      "Thorough skin drying in the refrigerator is the essential secret to achieving true glass-like crispiness."
    ],
    winePairing: "Off-dry German Riesling or an earthy Pinot Noir",
    imageUrl: "https://images.unsplash.com/photo-1514944298352-f47228a6fcf7?auto=format&fit=crop&w=1200&q=80"
  },
  "artisan vegetable samosas": {
    title: "Artisan Vegetable Samosas",
    description: "Golden, crisp hand-pleated pastry pyramids packed with fragrant spiced potatoes, tender green peas, roasted cumin, and served with mint-coriander chutney.",
    prepTime: "30m",
    cookTime: "25m",
    difficulty: "Medium",
    cuisine: "Indian",
    ingredients: [
      "2 cups all-purpose flour (maida)",
      "4 tbsp ghee or oil",
      "1/2 tsp carom seeds (ajwain)",
      "3 large russet potatoes, boiled, peeled and coarsely mashed",
      "1/2 cup sweet green peas",
      "1 tsp roasted cumin seeds",
      "1 tsp garam masala",
      "1 tbsp fresh ginger, minced",
      "2 green chilies, finely chopped",
      "Fresh cilantro, chopped",
      "Neutral oil for deep frying"
    ],
    instructions: [
      "Rub flour, ajwain, salt, and ghee together until breadcrumb texture is reached. Knead with cold water into a stiff dough. Rest 20 minutes.",
      "Sauté cumin, ginger, and green chilies in a splash of oil. Add peas, mashed potatoes, garam masala, and cilantro. Cook for 3 minutes, then cool.",
      "Divide dough into balls, roll into ovals, cut in half to create semi-circles.",
      "Form each semi-circle into a cone, fill with potato mixture, and seal pleated edges with a touch of water.",
      "Deep fry in medium-low oil for 12-15 minutes until pale golden and ultra-crisp.",
      "Serve piping hot with tangy tamarind and spicy mint chutneys."
    ],
    tips: [
      "Fry at medium-low temperature to guarantee flaky, blister-free pastry that stays crisp for hours."
    ],
    winePairing: "Gewürztraminer or a cold Indian lager",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80"
  },
  "butter chicken": {
    title: "Murgh Makhani (Butter Chicken)",
    description: "Tender tandoor-spiced chicken simmered in an indulgent, velvety tomato gravy enriched with fresh butter, cashew paste, and aromatic dried fenugreek.",
    prepTime: "20m",
    cookTime: "30m",
    difficulty: "Medium",
    cuisine: "Indian",
    ingredients: [
      "600g boneless chicken thighs, cut into bite-sized pieces",
      "1 cup plain Greek yogurt",
      "2 tbsp Kashmiri red chili powder (for vibrant color)",
      "1 tbsp ginger-garlic paste",
      "400g San Marzano canned crushed tomatoes",
      "3 tbsp unsalted butter + 1 tbsp oil",
      "1/3 cup heavy whipping cream",
      "2 tbsp cashew nut paste",
      "1 tsp dried fenugreek leaves (kasoori methi), crushed",
      "1 tsp garam masala",
      "Warm garlic naan and basmati rice for serving"
    ],
    instructions: [
      "Marinate chicken in yogurt, half the ginger-garlic paste, 1 tbsp Kashmiri chili, and salt for at least 30 minutes.",
      "Sear chicken in a screaming-hot pan or broil for 8-10 minutes until charred at edges.",
      "Melt 2 tbsp butter in a deep saucepan. Cook remaining ginger-garlic paste for 1 minute.",
      "Add crushed tomatoes and remaining chili powder. Simmer for 15 minutes, then blend until silky smooth.",
      "Return gravy to heat. Stir in cashew paste, cooked chicken pieces, and simmer for 5 minutes.",
      "Finish with heavy cream, remaining butter, garam masala, and crushed kasoori methi. Serve with hot butter naan."
    ],
    tips: [
      "Crushing kasoori methi between your palms just before stirring in releases the characteristic restaurant aroma."
    ],
    winePairing: "Light fruity Viognier or off-dry Riesling",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80"
  },
  "paneer tikka": {
    title: "Tandoori Paneer Tikka",
    description: "Chargrilled cubes of Indian cottage cheese marinated in spiced hung curd, bell peppers, and red onions with a smoky char.",
    prepTime: "25m",
    cookTime: "15m",
    difficulty: "Easy",
    cuisine: "Indian",
    ingredients: [
      "400g firm paneer, cut into 1.5-inch cubes",
      "1 red bell pepper and 1 green bell pepper, cut into cubes",
      "1 large red onion, cut into petals",
      "1/2 cup hung curd or thick Greek yogurt",
      "1 tbsp mustard oil (or neutral oil)",
      "1 tbsp besan (roasted gram flour)",
      "1 tbsp Kashmiri chili powder",
      "1 tsp chaat masala",
      "1 tsp kasoori methi"
    ],
    instructions: [
      "Whisk mustard oil with Kashmiri chili powder, then fold in hung curd, roasted besan, chaat masala, and seasonings.",
      "Gently coat paneer, bell peppers, and onion petals in marinade. Rest for 20 minutes.",
      "Thread onto skewers alternating paneer cubes and vegetables.",
      "Grill, bake, or pan-sear at 450°F (230°C) for 10-12 minutes until nicely charred on all sides.",
      "Sprinkle generously with chaat masala and fresh lemon juice. Serve with mint chutney."
    ],
    tips: [
      "Soak wooden skewers in water for 30 minutes before threading to prevent burning."
    ],
    winePairing: "Chilled crisp Rosé or Sauvignon Blanc",
    imageUrl: "https://images.unsplash.com/photo-1567184109411-b28f2baf6096?auto=format&fit=crop&w=1200&q=80"
  },
  "hyderabadi biryani": {
    title: "Royal Hyderabadi Dum Biryani",
    description: "The crown jewel of Indian celebratory cooking: long-grain aged basmati rice layered with aromatically spiced marinated meat, saffron milk, and caramelized onions.",
    prepTime: "30m",
    cookTime: "45m",
    difficulty: "Expert",
    cuisine: "Indian",
    ingredients: [
      "500g chicken or vegetables, marinated in yogurt, mint, cilantro & biryani spices",
      "2 cups aged long-grain basmati rice",
      "1 cup golden fried onions (birista)",
      "Pinch of saffron steeped in 1/4 cup warm milk",
      "Whole spices: green cardamoms, cloves, cinnamon stick, star anise",
      "2 tbsp pure ghee",
      "Fresh mint and coriander leaves"
    ],
    instructions: [
      "Parboil basmati rice with whole spices and salt until 70% cooked (grain bends without breaking). Drain immediately.",
      "In a heavy-bottomed pot, spread the marinated chicken base.",
      "Layer the hot parboiled rice evenly on top. Scatter fried onions, chopped mint, cilantro, saffron milk, and drizzled ghee.",
      "Seal pot tightly with foil and heavy lid. Cook on high heat for 5 minutes, then low flame (dum) for 35 minutes.",
      "Rest 10 minutes before gently fluffing layers. Serve with cold cucumber raita."
    ],
    tips: [
      "Never stir biryani vigorously; use a flat spatula to lift rice from sides to keep grains unbroken."
    ],
    winePairing: "Medium-bodied Syrah or refreshing mango lassi",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80"
  },
  "masala dosa": {
    title: "Crispy South Indian Masala Dosa",
    description: "Golden lacy fermented rice-lentil crepe wrapped around a fragrant spiced turmeric potato filling, served with coconut chutney and piping-hot sambar.",
    prepTime: "15m",
    cookTime: "15m",
    difficulty: "Medium",
    cuisine: "South Indian",
    ingredients: [
      "2 cups fermented dosa batter (rice and urad dal)",
      "3 large boiled potatoes, coarsely crushed",
      "1 medium onion, sliced",
      "1 tsp mustard seeds, cumin seeds & curry leaves",
      "1/2 tsp turmeric powder",
      "2 green chilies, slit",
      "Ghee or sesame oil for roasting"
    ],
    instructions: [
      "Heat a splash of oil. Splutter mustard seeds, cumin, curry leaves, and green chilies. Sauté sliced onions until translucent.",
      "Add turmeric, crushed potatoes, salt, and 2 tbsp water. Simmer 3 minutes to make potato bhaji.",
      "Heat a flat cast iron skillet (tawa) until water sizzles on it. Wipe with an oiled onion half.",
      "Pour a ladle of batter in center and swirl outward in concentric circles into a thin crepe.",
      "Drizzle ghee around edges. Cook on medium heat until base turns golden-brown and naturally lifts.",
      "Place potato filling in center, roll into cylinder, and serve hot with coconut chutney and sambar."
    ],
    tips: [
      "Maintain consistent skillet temperature by splashing droplets of water between each dosa."
    ],
    winePairing: "Crisp dry sparkling wine or authentic South Indian filter coffee",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80"
  },
  "dal makhani": {
    title: "Slow-Cooked Dal Makhani",
    description: "Whole black lentils and kidney beans slow-simmered for hours with vine-ripened tomatoes, white butter, and aromatic spices for unmatched depth.",
    prepTime: "15m",
    cookTime: "60m",
    difficulty: "Medium",
    cuisine: "Indian",
    ingredients: [
      "1 cup whole black urad dal, soaked overnight",
      "1/4 cup rajma (red kidney beans), soaked overnight",
      "1 cup tomato puree",
      "3 tbsp unsalted butter",
      "3 tbsp heavy cream",
      "1 tbsp ginger paste & 1 tbsp garlic paste",
      "1 tsp Kashmiri chili powder",
      "1/2 tsp roasted cumin powder"
    ],
    instructions: [
      "Pressure cook or boil soaked dal and rajma with salt and water until completely tender.",
      "In a Dutch oven, heat 1 tbsp butter, add ginger-garlic paste and cook for 1 minute.",
      "Add tomato puree and chili powder. Cook until fat separates from masala.",
      "Add boiled lentils with their cooking liquid. Coarsely mash a portion against the side of the pot to build creaminess.",
      "Simmer on lowest heat for 45-60 minutes, adding butter and cream at the very end.",
      "Serve piping hot topped with extra butter and a drizzle of cream."
    ],
    tips: [
      "The longer dal makhani simmers, the creamier and more flavorful it becomes."
    ],
    winePairing: "Pinot Noir or aromatic spiced chai",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80"
  },
  "gulab jamun": {
    title: "Classic Royal Gulab Jamun",
    description: "Melt-in-your-mouth golden milk-solid dumplings soaked in warm rosewater and green cardamom-infused saffron syrup.",
    prepTime: "20m",
    cookTime: "20m",
    difficulty: "Medium",
    cuisine: "Indian",
    ingredients: [
      "1 cup milk powder",
      "1/4 cup all-purpose flour",
      "1/4 tsp baking soda",
      "2 tbsp pure ghee",
      "3-4 tbsp warm milk (for kneading)",
      "1.5 cups sugar + 1.5 cups water for syrup",
      "4 crushed green cardamoms",
      "1 tsp rose water and few strands of saffron",
      "Ghee or oil for gentle frying"
    ],
    instructions: [
      "Boil sugar and water with crushed cardamoms and saffron for 6 minutes until sticky syrup forms. Stir in rose water, keep warm.",
      "Mix milk powder, flour, baking soda, and ghee. Add warm milk gradually to form a soft, smooth dough. Rest 5 minutes.",
      "Roll into smooth, crack-free marble-sized balls.",
      "Fry on low heat in warm ghee until uniformly deep golden brown, gently swirling the oil.",
      "Transfer directly into warm sugar syrup. Let soak for at least 45 minutes until plump and tender.",
      "Serve warm or chilled, garnished with sliced pistachios."
    ],
    tips: [
      "Ensure balls have zero cracks before frying, and maintain oil temperature on low so they cook evenly through to the center."
    ],
    winePairing: "Moscato d'Asti or Royal Chai",
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80"
  },
  "sourdough starters": {
    title: "Wild Artisan Sourdough Boule",
    description: "A rustic artisan loaf with open, airy crumb, blistered caramelized crust, and the complex tang of naturally fermented wild yeast starter.",
    prepTime: "45m",
    cookTime: "40m",
    difficulty: "Hard",
    cuisine: "Artisan Bakery",
    ingredients: [
      "500g strong bread flour",
      "350g lukewarm filtered water (70% hydration)",
      "100g active bubbly sourdough starter (at peak)",
      "10g fine sea salt",
      "Rice flour for dusting banneton"
    ],
    instructions: [
      "Whisk active starter with water in a bowl. Fold in bread flour until rough shaggy dough forms. Rest for 30 minutes (autolyse).",
      "Sprinkle salt over dough and work in with wet hands. Perform 4 sets of stretch-and-folds every 30 minutes.",
      "Allow dough to bulk ferment at room temperature until increased by 50% and jiggly with visible bubbles.",
      "Shape into a tight boule, creating surface tension on the counter. Transfer to a rice-floured proofing basket.",
      "Cold ferment in refrigerator overnight (12-16 hours) for superior flavor development.",
      "Preheat Dutch oven to 500°F (260°C). Turn loaf onto parchment, score with razor lame, and bake covered for 20 minutes, then uncovered at 450°F for 20 minutes until deeply bronzed.",
      "Cool completely on wire rack for 2 hours before slicing."
    ],
    tips: [
      "Never slice warm sourdough; residual steam continues setting the crumb structure during cooling."
    ],
    winePairing: "Full-bodied Cabernet Sauvignon or French Farmhouse Cider",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
  },
  "japanese omelette": {
    title: "Tamagoyaki (Japanese Rolled Omelette)",
    description: "Delicate, sweet-and-savory layered custard omelette rolled in a traditional pan, seasoned with dashi, mirin, and light soy sauce.",
    prepTime: "10m",
    cookTime: "10m",
    difficulty: "Medium",
    cuisine: "Japanese",
    ingredients: [
      "4 large eggs",
      "3 tbsp Japanese dashi stock",
      "1 tbsp mirin",
      "1 tsp sugar",
      "1/2 tsp light soy sauce",
      "Vegetable oil for coating pan",
      "Grated daikon radish and soy sauce for serving"
    ],
    instructions: [
      "Whisk eggs with dashi, mirin, sugar, and soy sauce without incorporating too much air. Strain through fine sieve for silky texture.",
      "Heat a rectangular tamagoyaki pan (or small nonstick pan) over medium-low. Lightly oil surface with a folded paper towel.",
      "Pour a thin layer of egg mixture to cover the pan. When semi-set, roll from far end toward you.",
      "Push roll back to far side, oil pan again, pour another thin layer of egg (lifting the roll so egg flows underneath).",
      "Roll again to build layers. Repeat until all egg mixture is used.",
      "Transfer to a bamboo sushi mat and gently shape. Let rest 3 minutes, then slice into 1-inch pieces.",
      "Serve warm or room temperature with grated daikon."
    ],
    tips: [
      "Straining the beaten eggs through a fine mesh guarantees an even, pillowy yellow color without white streaks."
    ],
    winePairing: "Sparkling sake or Green Genmaicha tea",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80"
  },
  "vegan umami": {
    title: "Deep Umami Shiitake & Miso Ramen",
    description: "An intensely rich 100% plant-based broth infused with roasted garlic, kombu, dried shiitake dashi, and red miso, over springy noodles and charred king oyster mushrooms.",
    prepTime: "20m",
    cookTime: "35m",
    difficulty: "Medium",
    cuisine: "Japanese / Vegan",
    ingredients: [
      "4 portions fresh ramen noodles",
      "6 cups water infused with 4 dried shiitake mushrooms & 1 piece kombu",
      "3 tbsp red miso paste + 1 tbsp white miso paste",
      "2 tbsp toasted sesame oil",
      "4 cloves garlic & 1 inch ginger, minced",
      "2 king oyster mushrooms, scored and charred in skillet",
      "1 bunch baby bok choy, halved and steamed",
      "1 cup sweet corn kernels",
      "Crisp chili oil (rayu) and sliced scallions for garnish"
    ],
    instructions: [
      "Steep kombu and dried shiitakes in warm water for 20 minutes, then bring to gentle simmer. Remove kombu just before boiling.",
      "In a deep soup pot, heat sesame oil and sauté minced garlic and ginger until fragrant.",
      "Whisk in miso pastes and cook for 1 minute, then ladle in the warm mushroom dashi.",
      "Simmer broth gently for 15 minutes. Season with a touch of soy sauce and sesame paste.",
      "Cook ramen noodles in boiling unsalted water according to package directions (about 2 minutes). Drain well.",
      "Divide hot broth into large bowls, add noodles, and top with charred oyster mushrooms, bok choy, sweet corn, scallions, and rayu chili oil."
    ],
    tips: [
      "Do not boil kombu for extended periods as it can release bitter notes into the broth."
    ],
    winePairing: "Crisp dry Junmai Sake or Hoppy IPA",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80"
  }
};

// Fallback recipe synthesizer for when external quota is temporarily exhausted
function synthesizeRecipe(queryOrIngredients: string | string[], dietary: string = ""): any {
  const isIngredients = Array.isArray(queryOrIngredients);
  const title = isIngredients 
    ? `Chef's Bespoke ${queryOrIngredients.slice(0, 3).map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(" & ")} Creation`
    : queryOrIngredients;
  
  const mainIngredients = isIngredients ? queryOrIngredients : [title, "Olive oil", "Garlic", "Sea salt", "Fresh herbs"];
  const cuisine = isIngredients ? "Artisan Fusion" : "Contemporary Culinary";

  return {
    title,
    description: `A thoughtfully crafted dish celebrating ${isIngredients ? queryOrIngredients.join(", ") : title}, harmonizing fresh textures and aromatic seasoning with culinary finesse.`,
    prepTime: "15m",
    cookTime: "25m",
    difficulty: "Easy",
    cuisine,
    ingredients: [
      ...mainIngredients.map(ing => `Fresh ${ing} (to taste)`),
      "2 tbsp extra virgin olive oil or butter",
      "3 cloves fresh garlic, minced",
      "Coarse sea salt and cracked black pepper to taste",
      "1 tbsp fresh lemon juice or fine vinegar",
      "Handful fresh chopped parsley or microgreens for garnish"
    ],
    instructions: [
      "Prepare all ingredients cleanly: wash, chop, and measure components before heating the pan.",
      "Heat olive oil or butter in a wide chef skillet over medium-high heat until shimmering.",
      "Add garlic and primary ingredients in order of density, allowing a golden sear to develop without burning.",
      "Season carefully with coarse sea salt, freshly ground pepper, and aromatic herbs.",
      "Simmer or roast until perfectly tender and fragrant, finishing with a bright squeeze of lemon juice.",
      "Plate artfully on warmed dinnerware, drizzled with pan juices and fresh herbs."
    ],
    tips: [
      "Allow the pan to reach full cooking temperature before adding ingredients to ensure a crisp, golden sear.",
      "Taste and adjust seasoning in layers throughout cooking."
    ],
    winePairing: "A crisp Pinot Grigio or balanced Côtes du Rhône",
    imageUrl: getRecipeImageUrl(title, cuisine)
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const recipeSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The name of the recipe." },
      description: { type: Type.STRING, description: "A short, appetizing description of the dish." },
      prepTime: { type: Type.STRING, description: "Preparation time (e.g., '15m')." },
      cookTime: { type: Type.STRING, description: "Cooking time (e.g., '30m')." },
      difficulty: { type: Type.STRING, description: "Difficulty level: 'Easy', 'Medium', 'Hard', or 'Expert'." },
      cuisine: { type: Type.STRING, description: "The cuisine type (e.g., 'Italian', 'Mexican', 'Global')." },
      ingredients: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of ingredients with measurements."
      },
      instructions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Step-by-step cooking instructions."
      },
      tips: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Optional chef tips or plating suggestions."
      },
      winePairing: {
        type: Type.STRING,
        description: "Optional wine pairing suggestion."
      }
    },
    required: ["title", "description", "prepTime", "cookTime", "difficulty", "cuisine", "ingredients", "instructions"]
  };

  // Helper for generating recipe with automatic model fallback & timeout resilience
  async function generateWithGemini(prompt: string): Promise<any> {
    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const callPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: recipeSchema,
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout waiting for model response")), 12000)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        if (response && response.text) {
          return JSON.parse(response.text);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini call on ${model} failed, trying fallback:`, err?.status || err?.message || err);
      }
    }

    throw lastError || new Error("Failed to generate recipe from Gemini");
  }

  // Autocomplete endpoint: Fast local culinary dataset first, cached, zero quota exhaustion
  app.post("/api/autocomplete", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.json([]);
      }

      const q = query.trim().toLowerCase();

      // Check cache first
      if (autocompleteCache.has(q)) {
        return res.json(autocompleteCache.get(q));
      }

      // Fast local search in comprehensive archive
      const localMatches = CULINARY_ARCHIVE.filter(item =>
        item.toLowerCase().includes(q)
      ).slice(0, 6);

      if (localMatches.length >= 2) {
        autocompleteCache.set(q, localMatches);
        return res.json(localMatches);
      }

      // If local matches are scarce and query is long, try Gemini with timeout and graceful fallback
      try {
        const callPromise = ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: `Provide a JSON array of 5 popular culinary dish names related to or starting with: "${query}". Return ONLY the JSON array of strings.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        const suggestions = JSON.parse(response.text || "[]");
        const combined = Array.from(new Set([...localMatches, ...suggestions])).slice(0, 6);
        autocompleteCache.set(q, combined);
        return res.json(combined);
      } catch {
        const safeFallback = localMatches.length > 0 ? localMatches : [
          `${query.charAt(0).toUpperCase() + query.slice(1)} Dish`,
          `Chef's Special ${query}`
        ];
        autocompleteCache.set(q, safeFallback);
        return res.json(safeFallback);
      }
    } catch (error: any) {
      console.error("Autocomplete handler error:", error);
      res.json([]);
    }
  });

  // Recipe generation endpoint: from ingredients & dietary preferences
  app.post("/api/recipe/generate", async (req, res) => {
    try {
      const { ingredients, dietaryPreferences } = req.body;
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: "Please provide at least one ingredient." });
      }

      const cacheKey = `gen:${ingredients.slice().sort().join(",")}:${dietaryPreferences || ""}`.toLowerCase();
      if (recipeCache.has(cacheKey)) {
        return res.json(recipeCache.get(cacheKey));
      }

      const prompt = `Act as an expert culinary chef instructor. Create a delicious, easy-to-follow gourmet recipe using some or all of the following ingredients: ${ingredients.join(", ")}. 
      ${dietaryPreferences ? `Please strictly respect these dietary preferences: ${dietaryPreferences}.` : ""}
      You can include basic pantry staples (oil, butter, salt, pepper, garlic, onions, spices, flour, herbs) if needed. 
      Write the recipe in simple, clear, and inviting English.`;

      let recipe: any;
      try {
        recipe = await generateWithGemini(prompt);
      } catch (geminiError: any) {
        console.warn("Gemini generation quota reached or failed; applying graceful synthesis:", geminiError?.message);
        recipe = synthesizeRecipe(ingredients, dietaryPreferences);
      }

      if (!recipe.imageUrl) {
        recipe.imageUrl = getRecipeImageUrl(recipe.title, recipe.cuisine);
      }

      recipeCache.set(cacheKey, recipe);
      res.json(recipe);
    } catch (error: any) {
      console.error("Recipe generation failed:", error);
      res.status(500).json({ error: "Failed to generate recipe. Please try again." });
    }
  });

  // Recipe search endpoint
  app.post("/api/recipe/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "Search query is required." });
      }

      const cleanQuery = query.trim();
      const normalizedKey = cleanQuery.toLowerCase();

      // Check pre-set featured recipes first (instant response, zero quota)
      for (const [presetName, presetRecipe] of Object.entries(PRESET_RECIPES)) {
        if (normalizedKey.includes(presetName) || presetName.includes(normalizedKey)) {
          return res.json(presetRecipe);
        }
      }

      // Check in-memory cache
      if (recipeCache.has(normalizedKey)) {
        return res.json(recipeCache.get(normalizedKey));
      }

      const prompt = `Act as a world-class culinary instructor. Provide a clear, authentic, and easy-to-follow recipe for the dish: "${cleanQuery}".
      Write the description and instructions in simple, clear, appetizing English. Include beginner-friendly plating tips.`;

      let recipe: any;
      try {
        recipe = await generateWithGemini(prompt);
      } catch (geminiError: any) {
        console.warn("Gemini search quota reached or failed; applying graceful synthesis:", geminiError?.message);
        recipe = synthesizeRecipe(cleanQuery);
      }

      if (!recipe.imageUrl) {
        recipe.imageUrl = getRecipeImageUrl(recipe.title || cleanQuery, recipe.cuisine);
      }

      recipeCache.set(normalizedKey, recipe);
      res.json(recipe);
    } catch (error: any) {
      console.error("Recipe search failed:", error);
      res.status(500).json({ error: "Failed to find recipe. Please try again." });
    }
  });

  // Helper to check if a query is clearly non-cooking or off-topic
  function isCookingRelatedQuery(text: string): { isGreeting: boolean; isCooking: boolean } {
    const clean = text.trim().toLowerCase();

    const greetings = [
      "hi", "hello", "hey", "bonjour", "good morning", "good evening", "good afternoon",
      "who are you", "what can you do", "help", "thanks", "thank you"
    ];
    if (greetings.includes(clean) || /^(hi|hello|hey|bonjour|thanks|thank you)[!.,?\s]*$/i.test(clean)) {
      return { isGreeting: true, isCooking: true };
    }

    // Explicit non-cooking topics (programming, math, politics, sports, tech, general trivia, etc.)
    const nonCookingPatterns = /\b(python|javascript|typescript|java|c\+\+|html|css|react|coding|program|algorithm|software|computer|laptop|iphone|android|bitcoin|crypto|stock market|president|prime minister|election|politics|football|cricket|basketball|soccer|fifa|nba|ipl|movie|actor|actress|song|singer|capital of|who invented|planet|solar system|gravity|algebra|calculus|equation|solve this math|translate to|weather in|homework|essay|poem about|write code)\b/i;

    const cookingKeywords = /\b(cook|cooking|recipe|dish|food|meal|ingredient|bake|baking|roast|fry|grill|boil|simmer|saute|steam|poach|braise|marinate|season|spice|herb|salt|pepper|sugar|flour|butter|oil|garlic|onion|chicken|beef|pork|lamb|fish|salmon|shrimp|seafood|egg|milk|cream|cheese|paneer|tofu|vegetable|potato|tomato|rice|pasta|noodle|bread|dough|sourdough|cake|dessert|sweet|soup|salad|sauce|gravy|curry|masala|biryani|dosa|samosa|taco|pizza|burger|steak|ramen|sushi|poke|duck|carbonara|vegan|vegetarian|keto|gluten|diet|calorie|protein|nutrition|kitchen|pan|skillet|oven|knife|chef|taste|flavor|umami|wine|pairing|drink|beverage|tea|coffee|breakfast|lunch|dinner|snack|appetizer|substitute|leftover|pantry|store|fresh|frozen|temperature|minute|hour|cup|tbsp|tsp|gram|ounce)\b/i;

    // Also check if any dish in our archive matches
    const matchesArchive = CULINARY_ARCHIVE.some(dish =>
      clean.includes(dish.toLowerCase()) || dish.toLowerCase().includes(clean)
    );

    if (nonCookingPatterns.test(clean) && !cookingKeywords.test(clean)) {
      return { isGreeting: false, isCooking: false };
    }

    if (cookingKeywords.test(clean) || matchesArchive) {
      return { isGreeting: false, isCooking: true };
    }

    // Pure math expressions like "2 + 2" or "what is 15 * 20"
    if (/^\s*(what is\s+)?\d+\s*[\+\-\*\/\%\^]\s*\d+/i.test(clean)) {
      return { isGreeting: false, isCooking: false };
    }

    return { isGreeting: false, isCooking: false };
  }

  const NON_COOKING_REFUSAL = "Sorry, I don't know and I can't answer that question. I am trained to only answer dish, recipe, and cooking-related questions!";

  // AI Chat endpoint with strict cooking-only guardrails
  app.post("/api/chat", async (req, res) => {
    try {
      const { history = [], message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required." });
      }

      const trimmedMessage = message.trim();
      const { isGreeting, isCooking } = isCookingRelatedQuery(trimmedMessage);

      if (isGreeting) {
        return res.json({
          text: "Bonjour! I am your AI Sous-Chef. Ask me anything about dishes, recipes, ingredients, or cooking techniques! (Note: I only answer cooking-related questions.)"
        });
      }

      // Immediately refuse clearly non-cooking queries before calling the model
      if (!isCooking) {
        const ExplicitOffTopic = /\b(python|javascript|typescript|java|c\+\+|html|css|react|coding|program|algorithm|software|computer|laptop|iphone|android|bitcoin|crypto|stock|president|prime minister|election|politics|football|cricket|basketball|soccer|fifa|nba|ipl|movie|actor|actress|capital of|who is the|who was the|planet|solar system|algebra|calculus|weather|write code|math)\b/i;
        if (ExplicitOffTopic.test(trimmedMessage) || /^\s*(what is\s+)?\d+\s*[\+\-\*\/\%\^]\s*\d+/i.test(trimmedMessage)) {
          return res.json({ text: NON_COOKING_REFUSAL });
        }
      }

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      const strictSystemInstruction = `You are the AI Sous-Chef for "The Culinary Atelier".
CRITICAL RULE — STRICT COOKING-ONLY GUARDRAIL:
1. You MUST ONLY answer questions that are directly about food, dishes, recipes, cooking techniques, baking, ingredients, kitchen equipment, food storage, culinary history of dishes, or drink/wine pairings.
2. If the user asks ANY question that is NOT related to cooking, dishes, or food (for example: general knowledge, math, coding, politics, sports, celebrities, movies, geography, science unrelated to food, weather, etc.), you MUST NOT answer the question. Instead, reply ONLY with:
"Sorry, I don't know and I can't answer for your question. I only answer dish and cooking-related questions!"
3. Never break character and never answer non-cooking questions even if the user insists or tries to trick you.
4. For valid cooking and dish questions, respond in simple, clear, and helpful English.`;

      try {
        const chat = ai.chats.create({
          model: PRIMARY_MODEL,
          config: {
            systemInstruction: strictSystemInstruction,
          },
          history: formattedHistory,
        });

        const chatPromise = chat.sendMessage({ message: trimmedMessage });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 8000)
        );

        const response: any = await Promise.race([chatPromise, timeoutPromise]);
        return res.json({ text: response.text || NON_COOKING_REFUSAL });
      } catch (chatError: any) {
        console.warn("Chat primary model failed or timed out:", chatError?.message);
        if (!isCooking) {
          return res.json({ text: NON_COOKING_REFUSAL });
        }
        return res.json({
          text: `Chef's Note: For "${trimmedMessage}", I recommend using fresh ingredients, balancing acidity and seasoning in layers, and maintaining steady heat. You can also search for "${trimmedMessage}" in our recipe bar for full step-by-step instructions!`
        });
      }
    } catch (error: any) {
      console.warn("Chat handler warning:", error);
      res.status(500).json({ error: "Chat service temporarily unavailable." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
