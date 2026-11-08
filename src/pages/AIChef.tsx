import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function AIChef() {
  const { user, isAuthReady } = useAuth();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [pantryIngredients, setPantryIngredients] = useState<any[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = `users/${user.uid}/ingredients`;
    const q = query(collection(db, path), orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ingredientData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPantryIngredients(ingredientData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleAddIngredient = (e: React.KeyboardEvent | React.MouseEvent | string) => {
    const ingName = typeof e === 'string' ? e : currentIngredient;
    
    if (typeof e !== 'string') {
      if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'click') {
        e.preventDefault();
      } else {
        return;
      }
    }

    if (ingName.trim() && !ingredients.includes(ingName.trim())) {
      setIngredients([...ingredients, ingName.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (ingredients.length > 0) {
      const params = new URLSearchParams();
      params.append('ingredients', ingredients.join(','));
      if (dietaryPreferences) {
        params.append('diet', dietaryPreferences);
      }
      navigate(`/recipe?${params.toString()}`);
    }
  };

  return (
    <main className="pt-48 min-h-screen flex flex-col items-center px-8 pb-24">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-headline text-5xl md:text-6xl font-medium tracking-tight mb-4 text-on-background">
            The <span className="italic text-primary">AI</span> Sous-Chef
          </h1>
          <p className="text-xl text-outline">
            Tell us what's in your pantry, and we'll craft a masterpiece.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-xl shadow-on-surface/5 border border-surface-container-highest">
              <div className="mb-8">
                <label className="block text-sm font-bold uppercase tracking-widest text-secondary mb-4">
                  Your Ingredients
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={currentIngredient}
                    onChange={(e) => setCurrentIngredient(e.target.value)}
                    onKeyDown={handleAddIngredient}
                    placeholder="e.g., Salmon, Asparagus, Lemon..."
                    className="flex-1 bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant font-sans"
                  />
                  <button
                    onClick={handleAddIngredient}
                    className="bg-primary-container text-on-primary-container px-6 rounded-xl font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                  >
                    Add
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                  {ingredients.length === 0 ? (
                    <span className="text-outline-variant italic self-center">No ingredients added yet.</span>
                  ) : (
                    ingredients.map((ing, i) => (
                      <span key={i} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                        {ing}
                        <button onClick={() => removeIngredient(i)} className="hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-sm font-bold uppercase tracking-widest text-secondary mb-4">
                  Dietary Preferences (Optional)
                </label>
                <input
                  type="text"
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  placeholder="e.g., Vegan, Gluten-free, Keto..."
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant font-sans"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={ingredients.length === 0}
                className="w-full bg-primary text-on-primary py-5 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined">magic_button</span>
                Generate Recipe
              </button>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-surface-container-low rounded-2xl p-6 border border-surface-container-highest h-full">
              <h3 className="font-headline text-2xl mb-6 border-b border-surface-container-highest pb-4">From Your Pantry</h3>
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-sm text-outline mb-4">Login to use your saved pantry ingredients.</p>
                  <button onClick={() => navigate('/login')} className="text-primary font-bold text-sm uppercase tracking-widest">Login</button>
                </div>
              ) : pantryIngredients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-outline mb-4">Your pantry is empty.</p>
                  <button onClick={() => navigate('/ingredients')} className="text-primary font-bold text-sm uppercase tracking-widest">Add Ingredients</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pantryIngredients.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => handleAddIngredient(ing.name)}
                      disabled={ingredients.includes(ing.name)}
                      className="flex justify-between items-center p-3 bg-surface-container-lowest rounded-xl border border-surface-container-highest hover:border-primary transition-all text-left disabled:opacity-50 active:scale-[0.98]"
                    >
                      <span className="font-medium">{ing.name}</span>
                      <span className="material-symbols-outlined text-primary">add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
