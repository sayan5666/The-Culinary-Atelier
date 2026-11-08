import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { logOut } from '../firebase';

export default function NavBar() {
  const { user, isAuthReady } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="bg-background/80 dark:bg-stone-950/80 backdrop-blur-md fixed top-0 w-full z-[70] transition-colors duration-300">
      <div className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="text-2xl font-bold text-primary dark:text-primary-fixed font-headline">
          The Culinary Atelier
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-headline font-medium tracking-tight">
          <Link to="/" className="text-on-surface/70 dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors">Recipes</Link>
          <Link to="/ai-chef" className="text-on-surface/70 dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors">AI Chef</Link>
          {user && (
            <>
              <Link to="/dashboard" className="text-on-surface/70 dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors">Dashboard</Link>
              <Link to="/ingredients" className="text-on-surface/70 dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors">Pantry</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-surface-container-low dark:bg-stone-900 text-on-surface dark:text-stone-300 hover:bg-surface-container-high dark:hover:bg-stone-800 transition-all duration-300 active:scale-95"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {isAuthReady && (
            user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-surface-container-low dark:bg-stone-900 px-4 py-2 rounded-full border border-surface-container-highest dark:border-stone-800">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
                  <span className="text-sm font-bold text-on-surface dark:text-stone-200 hidden lg:block">{user.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="hover:opacity-80 transition-opacity duration-300 scale-95 active:scale-90 transition-transform"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-error">logout</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:bg-primary-container transition-all active:scale-95"
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
      <div className="bg-surface-container-highest dark:bg-stone-900 h-px w-full"></div>
    </header>
  );
}
