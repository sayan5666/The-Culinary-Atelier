import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function Ingredients() {
  const { user, isAuthReady } = useAuth();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [category, setCategory] = useState('Vegetable');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = `users/${user.uid}/ingredients`;
    const q = query(collection(db, path), orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ingredientData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIngredients(ingredientData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newIngredient.trim()) return;

    const path = `users/${user.uid}/ingredients`;
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        name: newIngredient.trim(),
        category,
        addedAt: serverTimestamp()
      });
      setNewIngredient('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (ingredientId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/ingredients/${ingredientId}`;
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-2 block">Pantry Management</span>
            <h1 className="font-headline text-5xl font-medium tracking-tight">Your Ingredients</h1>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-on-surface/5 border border-surface-container-highest mb-12">
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Ingredient Name</label>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="e.g., Baby Spinach, Ribeye Steak..."
                className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant font-sans"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-sans"
              >
                <option>Vegetable</option>
                <option>Fruit</option>
                <option>Meat</option>
                <option>Dairy</option>
                <option>Spice</option>
                <option>Grains</option>
                <option>Other</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold hover:bg-primary-container transition-all self-end active:scale-95"
            >
              Add to Pantry
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ingredients.length === 0 ? (
            <div className="md:col-span-2 text-center py-12 text-outline italic">
              Your pantry is empty. Add some ingredients to get started.
            </div>
          ) : (
            ingredients.map((ing) => (
              <div key={ing.id} className="flex justify-between items-center bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest hover:bg-surface-container-high transition-all">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">{ing.category}</div>
                  <div className="font-headline text-2xl">{ing.name}</div>
                </div>
                <button onClick={() => handleDelete(ing.id)} className="text-outline hover:text-error transition-all active:scale-90">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
