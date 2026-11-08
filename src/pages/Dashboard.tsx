import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAuthReady } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = `users/${user.uid}/recipes`;
    const q = query(collection(db, path), orderBy('savedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipeData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleDelete = async (recipeId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/recipes/${recipeId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  if (loading) {
    return (
      <main className="pt-48 min-h-screen flex items-center justify-center px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </main>
    );
  }

  return (
    <main className="pt-48 min-h-screen px-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-2 block">Welcome Back, {user?.displayName?.split(' ')[0]}</span>
            <h1 className="font-headline text-5xl font-medium tracking-tight">Your Culinary Atelier</h1>
          </div>
          <Link to="/ai-chef" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:bg-primary-container transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">magic_button</span>
            New Recipe
          </Link>
        </div>

        {recipes.length === 0 ? (
          <div className="bg-surface-container-low rounded-[2rem] p-16 text-center border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-6">restaurant_menu</span>
            <h2 className="font-headline text-3xl mb-4">No saved recipes yet</h2>
            <p className="text-xl text-outline mb-8 max-w-md mx-auto">Start your culinary journey by generating a recipe with our AI Chef or searching for a dish.</p>
            <Link to="/ai-chef" className="text-primary font-bold flex items-center justify-center gap-2 group">
              Try AI Chef Now
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xl shadow-on-surface/5 border border-surface-container-highest flex flex-col">
                {recipe.imageUrl && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface">
                      {recipe.cuisine}
                    </div>
                  </div>
                )}
                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    {!recipe.imageUrl && <span className="text-xs font-bold uppercase tracking-widest text-secondary">{recipe.cuisine}</span>}
                    <button onClick={() => handleDelete(recipe.id)} className="text-outline hover:text-error transition-colors ml-auto">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <h3 className="font-headline text-2xl mb-2 group-hover:text-primary transition-colors">{recipe.title}</h3>
                  <p className="text-outline line-clamp-2 mb-6">{recipe.description}</p>
                  <div className="flex gap-4 text-sm text-outline font-medium">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">schedule</span> {recipe.cookTime}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">restaurant</span> {recipe.difficulty}</span>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low border-t border-surface-container-highest">
                  <button 
                    onClick={() => navigate(`/recipe?q=${encodeURIComponent(recipe.title)}`, { state: { recipe } })}
                    className="w-full text-center py-2 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all"
                  >
                    View Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
