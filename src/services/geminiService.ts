export interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  cuisine: string;
  ingredients: string[];
  instructions: string[];
  tips?: string[];
  winePairing?: string;
  imageUrl?: string;
}

const COMMON_SUGGESTIONS = [
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
  "Spaghetti Aglio e Olio",
  "Neapolitan Margherita Pizza",
  "Thai Green Curry",
  "French Onion Soup",
  "Wild Mushroom Risotto"
];

export async function getAutocompleteSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();

  try {
    const response = await fetch("/api/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cleanQuery }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn("Autocomplete network warning, using local dataset fallback:", error);
  }

  // Fallback to local common suggestions matching query
  return COMMON_SUGGESTIONS.filter(item => item.toLowerCase().includes(cleanQuery)).slice(0, 5);
}

export async function generateRecipeFromIngredients(ingredients: string[], dietaryPreferences: string = ""): Promise<Recipe> {
  try {
    const response = await fetch("/api/recipe/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, dietaryPreferences }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate recipe");
    }
    
    return await response.json();
  } catch (error: any) {
    console.warn("Recipe generation warning:", error);
    throw new Error(error.message || "Failed to generate recipe. Please try again.");
  }
}

export async function searchRecipe(query: string): Promise<Recipe> {
  try {
    const response = await fetch("/api/recipe/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to find recipe");
    }
    
    return await response.json();
  } catch (error: any) {
    console.warn("Recipe search warning:", error);
    throw new Error(error.message || "Failed to find recipe. Please try again.");
  }
}
