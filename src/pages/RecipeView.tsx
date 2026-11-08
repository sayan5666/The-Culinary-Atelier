import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { generateRecipeFromIngredients, searchRecipe, Recipe } from '../services/geminiService';
import { useAuth } from '../AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CURATED_COLLECTIONS = [
  {
    title: 'Pacific Rim Salmon Poke Bowl',
    cuisine: 'Pacific Rim',
    category: 'Asian & Pacific',
    difficulty: 'Medium',
    time: '45m',
    description: 'Marinated sashimi-grade salmon met with the crunch of heirloom radishes and creamy avocado crema.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Authentic Carbonara',
    cuisine: 'Italian',
    category: 'Italian',
    difficulty: 'Easy',
    time: '25m',
    description: 'Silky Roman emulsion of farm-fresh egg yolks, aged Pecorino Romano, cracked black pepper, and crisp guanciale.',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Glazed Peking Duck',
    cuisine: 'Chinese',
    category: 'Asian & Pacific',
    difficulty: 'Expert',
    time: '120m',
    description: 'Imperial culinary heritage with shatteringly crisp maltose-glazed skin and paper-thin mandarin pancakes.',
    imageUrl: 'https://images.unsplash.com/photo-1514944298352-f47228a6fcf7?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Artisan Vegetable Samosas',
    cuisine: 'Indian',
    category: 'Indian',
    difficulty: 'Medium',
    time: '45m',
    description: 'Flaky hand-pleated pastry cones filled with roasted cumin spiced potatoes, sweet peas, and fresh herbs.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Butter Chicken',
    cuisine: 'Indian',
    category: 'Indian',
    difficulty: 'Medium',
    time: '50m',
    description: 'Chargrilled tandoori chicken thighs simmered in a velvety San Marzano tomato, butter, and fenugreek gravy.',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Hyderabadi Biryani',
    cuisine: 'Indian',
    category: 'Indian',
    difficulty: 'Expert',
    time: '75m',
    description: 'Slow-steamed royal basmati rice layered with saffron milk, caramelized onions, fresh mint, and aromatic spices.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Vegan Umami',
    displayTitle: 'Deep Umami Shiitake & Miso Ramen',
    cuisine: 'Japanese / Vegan',
    category: 'Plant-Based',
    difficulty: 'Medium',
    time: '55m',
    description: 'Rich plant-based dashi broth infused with red miso, roasted garlic, charred king oyster mushrooms, and bok choy.',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Japanese Omelette',
    displayTitle: 'Tamagoyaki (Japanese Rolled Omelette)',
    cuisine: 'Japanese',
    category: 'Asian & Pacific',
    difficulty: 'Medium',
    time: '20m',
    description: 'Delicate, sweet-and-savory layered custard omelette seasoned with dashi stock, mirin, and light soy sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Sourdough Starters',
    displayTitle: 'Wild Artisan Sourdough Boule',
    cuisine: 'Artisan Bakery',
    category: 'European',
    difficulty: 'Hard',
    time: '85m',
    description: 'Rustic hearth loaf with an open, airy crumb, blistered caramelized crust, and complex wild-fermented tang.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
];

export default function RecipeView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const query = searchParams.get('q')?.trim() || '';
  const ingredientsParam = searchParams.get('ingredients')?.trim() || '';
  const dietParam = searchParams.get('diet')?.trim() || '';
  const stateRecipe = (location.state as { recipe?: Recipe } | null)?.recipe;

  const hasRecipeRequest = Boolean(query || ingredientsParam || stateRecipe);

  const fetchRecipe = async () => {
    if (!query && !ingredientsParam && !stateRecipe) {
      setRecipe(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (stateRecipe && (!query || stateRecipe.title.toLowerCase() === query.toLowerCase())) {
      setRecipe(stateRecipe);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let result: Recipe;
      if (query) {
        result = await searchRecipe(query);
      } else {
        const ingredientsList = ingredientsParam.split(',').map(i => i.trim()).filter(Boolean);
        result = await generateRecipeFromIngredients(ingredientsList, dietParam);
      }
      setRecipe(result);
    } catch (err: any) {
      console.warn('Recipe fetch warning:', err);
      setError(err.message || 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [query, ingredientsParam, dietParam]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !recipe) return;
      
      setCheckingSaved(true);
      const path = `users/${user.uid}/recipes`;
      try {
        const { getDocs, query: fsQuery, where } = await import('firebase/firestore');
        const q = fsQuery(collection(db, path), where('title', '==', recipe.title));
        const snapshot = await getDocs(q);
        setSaved(!snapshot.empty);
      } catch (err) {
        console.warn('Error checking if saved:', err);
      } finally {
        setCheckingSaved(false);
      }
    };

    checkIfSaved();
  }, [user, recipe]);

  const handleSave = async () => {
    if (!user || !recipe) {
      navigate('/login');
      return;
    }

    setSaving(true);
    const path = `users/${user.uid}/recipes`;
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        ...recipe,
        savedAt: serverTimestamp()
      });
      setSaved(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  const handleInlineSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/recipe?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  // When navigating directly to /recipe (e.g. "View all collections"), show the Curated Collections & Explorer
  if (!hasRecipeRequest) {
    const categories = ['All', 'Italian', 'Indian', 'Asian & Pacific', 'European', 'Plant-Based'];
    const filteredCollections = selectedCategory === 'All'
      ? CURATED_COLLECTIONS
      : CURATED_COLLECTIONS.filter(item => item.category === selectedCategory);

    return (
      <main className="pt-48 min-h-screen px-8 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-3 block">
              The Culinary Archive
            </span>
            <h1 className="font-headline text-5xl md:text-7xl font-medium tracking-tight mb-6 text-on-background">
              Global <span className="italic text-primary">Collections</span>
            </h1>
            <p className="text-xl text-outline mb-10 leading-relaxed">
              Explore our curated archive of signature dishes from around the world, or search for any recipe by name, cuisine, or technique.
            </p>

            <form onSubmit={handleInlineSearch} className="relative max-w-2xl mx-auto mb-8">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">search</span>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search any dish (e.g., Beef Bourguignon, Pad Thai, Tiramisu)..."
                className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-full py-5 pl-16 pr-36 text-lg shadow-xl shadow-on-surface/5 focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant font-sans"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-7 py-3 rounded-full font-bold transition-all hover:bg-primary-container active:scale-95"
              >
                Explore
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredCollections.map((item) => (
              <div
                key={item.title}
                onClick={() => navigate(`/recipe?q=${encodeURIComponent(item.title)}`)}
                className="group cursor-pointer bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xl shadow-on-surface/5 border border-surface-container-highest flex flex-col hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden relative bg-surface-container-low">
                  <img
                    src={item.imageUrl}
                    alt={item.displayTitle || item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-on-surface">
                      {item.cuisine}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-headline text-2xl mb-3 group-hover:text-primary transition-colors">
                      {item.displayTitle || item.title}
                    </h3>
                    <p className="text-outline line-clamp-2 mb-6 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest text-sm text-outline font-medium">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg text-primary">schedule</span>
                        {item.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg text-primary">restaurant</span>
                        {item.difficulty}
                      </span>
                    </div>
                    <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Recipe
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-low rounded-[2.5rem] p-10 md:p-14 border border-surface-container-highest flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">Custom Creation</span>
              <h2 className="font-headline text-3xl md:text-4xl mb-2">Cooking with ingredients on hand?</h2>
              <p className="text-outline text-lg">Let our AI Sous-Chef design a custom recipe tailored to your pantry and dietary needs.</p>
            </div>
            <Link
              to="/ai-chef"
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold hover:bg-primary-container transition-all whitespace-nowrap flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">magic_button</span>
              Open AI Sous-Chef
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pt-48 min-h-screen flex flex-col items-center justify-center px-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mb-6"></div>
        <h2 className="font-headline text-3xl text-on-background animate-pulse text-center">
          {query ? `Searching for ${query}...` : 'The AI Chef is crafting your recipe...'}
        </h2>
      </main>
    );
  }

  if (error || !recipe) {
    return (
      <main className="pt-48 min-h-screen flex flex-col items-center justify-center px-8">
        <div className="bg-surface-container-lowest border border-outline-variant text-on-surface p-8 md:p-12 rounded-3xl max-w-lg text-center shadow-xl">
          <span className="material-symbols-outlined text-primary text-5xl mb-4">restaurant_menu</span>
          <h2 className="font-headline text-3xl mb-3">Kitchen Update</h2>
          <p className="font-sans text-outline mb-8 leading-relaxed">{error || 'Something went wrong while preparing the dish.'}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={fetchRecipe}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-md"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/recipe')}
              className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-bold hover:bg-surface-container-highest transition-all active:scale-95"
            >
              Browse Collections
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-48 min-h-screen px-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 text-outline hover:text-primary transition-all font-bold text-sm uppercase tracking-widest active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || saved || checkingSaved}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all active:scale-95 ${
              saved 
                ? 'bg-primary-container text-on-primary-container cursor-default' 
                : 'bg-primary text-on-primary hover:bg-primary-container shadow-lg shadow-primary/20'
            }`}
          >
            <span className="material-symbols-outlined">{saved ? 'check' : 'bookmark'}</span>
            {saved ? 'Saved to Atelier' : saving ? 'Saving...' : checkingSaved ? 'Checking...' : 'Save Recipe'}
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-16 shadow-2xl shadow-on-surface/5 border border-surface-container-highest">
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              {recipe.cuisine}
            </span>
            <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              {recipe.difficulty}
            </span>
          </div>

          <h1 className="font-headline text-5xl md:text-7xl font-medium tracking-tight mb-6 text-on-background leading-tight">
            {recipe.title}
          </h1>
          
          {recipe.imageUrl && (
            <div className="mb-12 rounded-3xl overflow-hidden aspect-[16/9] shadow-2xl shadow-on-surface/10 border border-surface-container-highest">
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <p className="text-xl text-outline mb-12 leading-relaxed italic border-l-4 border-primary pl-6 py-2">
            {recipe.description}
          </p>

          <div className="flex flex-wrap gap-8 mb-16 p-6 bg-surface-container-low rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">schedule</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-secondary">Prep Time</div>
                <div className="font-headline text-xl">{recipe.prepTime}</div>
              </div>
            </div>
            <div className="w-px bg-outline-variant hidden md:block"></div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">local_fire_department</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-secondary">Cook Time</div>
                <div className="font-headline text-xl">{recipe.cookTime}</div>
              </div>
            </div>
            {recipe.winePairing && (
              <>
                <div className="w-px bg-outline-variant hidden md:block"></div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">wine_bar</span>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-secondary">Wine Pairing</div>
                    <div className="font-headline text-lg max-w-[200px] truncate" title={recipe.winePairing}>{recipe.winePairing}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            <div className="md:col-span-1">
              <h3 className="font-headline text-3xl mb-6 border-b border-surface-container-highest pb-4">Ingredients</h3>
              <ul className="space-y-4">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                    <span className="text-on-surface-variant leading-relaxed">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-headline text-3xl mb-6 border-b border-surface-container-highest pb-4">Method</h3>
              <ol className="space-y-8">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex gap-6">
                    <span className="font-headline text-4xl text-outline-variant font-medium opacity-50">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <p className="text-lg text-on-surface-variant leading-relaxed pt-1">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              {recipe.tips && recipe.tips.length > 0 && (
                <div className="mt-16 bg-surface-container-high p-8 rounded-2xl">
                  <h4 className="font-headline text-2xl mb-4 flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined">lightbulb</span>
                    Chef's Notes
                  </h4>
                  <ul className="space-y-3">
                    {recipe.tips.map((tip, idx) => (
                      <li key={idx} className="text-on-surface-variant italic">
                        "{tip}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
