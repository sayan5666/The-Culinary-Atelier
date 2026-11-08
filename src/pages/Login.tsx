import { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-48 min-h-screen flex flex-col items-center justify-center px-8">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-[2rem] p-12 shadow-2xl shadow-on-surface/5 border border-surface-container-highest text-center">
        <div className="text-4xl font-headline text-green-800 mb-6">The Culinary Atelier</div>
        <h1 className="text-2xl font-headline font-medium mb-8">Welcome Back</h1>
        <p className="text-outline mb-10">Sign in to save your favorite recipes and manage your pantry.</p>
        
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-4 rounded-xl font-bold transition-all border border-outline-variant disabled:opacity-50 active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="mt-8 text-xs text-outline uppercase tracking-widest">
          Secure authentication by Firebase
        </div>
      </div>
    </main>
  );
}
