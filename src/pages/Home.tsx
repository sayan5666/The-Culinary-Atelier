import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAutocompleteSuggestions } from '../services/geminiService';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        try {
          const results = await getAutocompleteSuggestions(searchQuery);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSuggestionError(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipe?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`/recipe?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  return (
    <main className="pt-48">
      {/* Hero Search Section */}
      <section className="max-w-7xl mx-auto px-8 mb-24 text-center">
        <h1 className="font-headline text-6xl md:text-8xl font-medium tracking-tight mb-8 text-on-background">
          Find any <span className="italic text-primary">dish</span> in the world.
        </h1>
        <div className="max-w-3xl mx-auto relative group" ref={suggestionRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input 
              className="w-full bg-surface-container-lowest border-none rounded-full py-6 pl-16 pr-8 text-xl shadow-xl shadow-on-surface/5 focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant font-sans" 
              placeholder="Search for ingredients, cuisines, or techniques..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            />
            <button 
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-8 py-3 rounded-full font-bold transition-all hover:bg-primary-container active:scale-95"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions || suggestionError) && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden z-40 text-left animate-in fade-in slide-in-from-top-2 duration-200">
              {isLoadingSuggestions ? (
                <div className="p-8 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <div className="text-outline font-medium animate-pulse">Searching culinary archives...</div>
                </div>
              ) : suggestionError ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-error text-4xl mb-2">error</span>
                  <div className="text-error font-bold mb-1">Oops! Something went wrong</div>
                  <div className="text-outline text-sm">{suggestionError}</div>
                </div>
              ) : (
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li 
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-6 py-4 hover:bg-surface-container-low cursor-pointer flex items-center gap-4 transition-colors border-b border-outline-variant last:border-none group/item"
                    >
                      <span className="material-symbols-outlined text-outline group-hover/item:text-primary transition-colors text-lg">restaurant_menu</span>
                      <span className="font-sans text-lg text-on-surface group-hover/item:font-medium">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="text-sm uppercase tracking-widest text-outline font-bold mr-2 self-center">Trending:</span>
          <span onClick={() => navigate('/recipe?q=Sourdough+Starters')} className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-sm font-semibold hover:bg-secondary-container transition-all cursor-pointer active:scale-95">Sourdough Starters</span>
          <span onClick={() => navigate('/recipe?q=Japanese+Omelette')} className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-sm font-semibold hover:bg-secondary-container transition-all cursor-pointer active:scale-95">Japanese Omelette</span>
          <span onClick={() => navigate('/recipe?q=Vegan+Umami')} className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-sm font-semibold hover:bg-secondary-container transition-all cursor-pointer active:scale-95">Vegan Umami</span>
        </div>
      </section>

      {/* Featured Global Recipes Bento Grid */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-2 block">Curation</span>
            <h2 className="font-headline text-5xl font-medium tracking-tight">Featured Global Recipes</h2>
          </div>
          <Link to="/recipe" className="text-primary font-bold flex items-center gap-2 group active:scale-95 transition-transform">
            View all collections
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Large Feature Card */}
          <div className="md:col-span-7 group cursor-pointer" onClick={() => navigate('/recipe?q=Pacific+Rim+Salmon+Poke+Bowl')}>
            <div className="rounded-xl overflow-hidden bg-surface-container-lowest relative aspect-[4/3] mb-6">
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="overhead shot of a vibrant poke bowl with fresh salmon, avocado, radishes and sesame seeds on a white marble table" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC77t5weT1jyESf9urihxrV7iL-eBBbZ-ow0KYPh9Ldx5HNSml-oY0j3dL__MxSTE9zyGphMce2U3f5Td3oez_t4YMTlFLQOiLjVge96CQrxqVWmFlZegIqi28R2v_-QSqzC8TqVSl6oEauW_vInbCgxQ1uyzgttA7qArKst3NRzyngZoRX6Ak4PR9qD7CMIod5vLWQQFMF67bzXJ-tzzi2o7j8atq1dp5M3g3VKKTd3rEFA0fow9Qc_WvcQpeDDExIgTyN3Sqwap8"/>
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="bg-surface/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-on-surface">Hard</span>
                <span className="bg-surface/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-on-surface">45 Mins</span>
              </div>
            </div>
            <h3 className="font-headline text-3xl mb-2">Pacific Rim Salmon Poke Bowl</h3>
            <p className="text-outline line-clamp-2 max-w-xl">A masterclass in balance: marinated sashimi-grade salmon met with the crunch of heirloom radishes and creamy avocado crema.</p>
          </div>

          {/* Column of 2 Small Cards */}
          <div className="md:col-span-5 flex flex-col gap-8">
            <div className="group cursor-pointer flex gap-6 items-center" onClick={() => navigate('/recipe?q=Authentic+Carbonara')}>
              <div className="w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-surface-container-low">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="close up of a rustic italian pasta carbonara with creamy sauce and golden guanciale bits on a handmade ceramic plate" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm8Mil_GR59LoukSriV8GLn1_IcMwUwn3nrX4km9XsZjbvI9idBDf8T4fRFoi0jbfhb7xkqBoXmxBzede6d1vtjcGoEotKqmTR-8GP-WVox_PKP1BuleExaWsdSjuXAGWFUuNnSPyinjtb80w4m8OFHxYrdfJKYA9cEzeFcL26EqMoDRGYjX0cQ-763HFWz7-3OnCVrse13ktxC4mrGSXuAwTXAeXoO0AN4S6Bt6IE46HS7P6PUvDB85WmaBXJHEIr_8sy6Ra2Zuc"/>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-secondary tracking-widest">Italian</span>
                <h4 className="font-headline text-2xl mt-1 mb-2">Authentic Carbonara</h4>
                <div className="flex gap-4 text-sm text-outline font-medium">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">schedule</span> 20m</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">restaurant</span> Easy</span>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer flex gap-6 items-center" onClick={() => navigate('/recipe?q=Glazed+Peking+Duck')}>
              <div className="w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-surface-container-low">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="glistening traditional glazed peking duck sliced on a dark platter with scallions and thin pancakes" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8D8GYXj7hdkJHItH9c8lW0Th387l5vZvn6Xibjiz92B4EnRSD3DuAAaCN9fzjOAY3LIrDd5TdiMRDzooVjMzk65EYG_r92bP01kEAjvIq1UnNI-vMplMlQswbPHfGZTR8GNbgu7JbUXD5i_4vRpH4ft59acCsxy60m2POvBWKSoonk2nuHvrb9Tnvckwzf73LZuKPglMUAfrvreuTJLi4HdlJ2mzLZevTP2z5Ytz7vSzXTmhL0x7Z9Xf-Hofn8Z4EvqaFb40EymY"/>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-secondary tracking-widest">Chinese</span>
                <h4 className="font-headline text-2xl mt-1 mb-2">Glazed Peking Duck</h4>
                <div className="flex gap-4 text-sm text-outline font-medium">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">schedule</span> 120m</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">restaurant</span> Expert</span>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer flex gap-6 items-center" onClick={() => navigate('/recipe?q=Artisan+Vegetable+Samosas')}>
              <div className="w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-surface-container-low">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="crispy golden vegetable samosas served with spicy mint chutney on a rustic slate plate" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_2UBWM89ikZBNMXsfgqDuvqJlvrYNpkZZXZPDfaPH6ondXOv7A3xJ2TS1f0yRO0d8Sq0-9KJr_JtZ-TQZlphS5O98vCg687uQJNFrn3Y7VLC0wYml3ZFHOQEsbQtha1guAlLIPowM_fbFpInML_thVwx64rseOd28wzkMdSdT5FrzbJbN7QslhTC7WpNe7jyXjoUnRWFZh2AX4gDlretAoIkDfvsQwPADhomJ7E4J9E5W_Kbtj3IeySy2K9wu4wv_WKt9ASkU9Fk"/>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-secondary tracking-widest">Indian</span>
                <h4 className="font-headline text-2xl mt-1 mb-2">Artisan Vegetable Samosas</h4>
                <div className="flex gap-4 text-sm text-outline font-medium">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">schedule</span> 45m</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">restaurant</span> Medium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indian Cuisine Spotlight */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <div className="bg-secondary/5 dark:bg-secondary-container/10 rounded-[3rem] p-12 md:p-20 border border-secondary/10 dark:border-secondary-container/20">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 text-left">
              <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-secondary dark:text-secondary-fixed mb-4 block">Regional Spotlight</span>
              <h2 className="font-headline text-5xl md:text-7xl font-medium tracking-tight mb-8 leading-tight">
                The Soul of <span className="italic text-secondary dark:text-secondary-fixed">India</span>
              </h2>
              <p className="text-xl text-outline mb-12 max-w-xl leading-relaxed">
                From the aromatic spice markets of Old Delhi to the coastal flavors of Kerala, Indian cuisine is a tapestry of history and tradition. Discover the recipes that define a sub-continent.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Butter Chicken", icon: "restaurant" },
                  { name: "Paneer Tikka", icon: "flatware" },
                  { name: "Hyderabadi Biryani", icon: "ramen_dining" },
                  { name: "Masala Dosa", icon: "bakery_dining" },
                  { name: "Dal Makhani", icon: "soup_kitchen" },
                  { name: "Gulab Jamun", icon: "icecream" }
                ].map((dish) => (
                  <button 
                    key={dish.name}
                    onClick={() => navigate(`/recipe?q=${encodeURIComponent(dish.name)}`)}
                    className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant hover:border-secondary dark:hover:border-secondary-fixed hover:bg-secondary/5 transition-all text-left group active:scale-95"
                  >
                    <span className="material-symbols-outlined text-secondary/60 group-hover:text-secondary transition-colors">{dish.icon}</span>
                    <span className="font-bold text-on-surface">{dish.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="aspect-square rounded-[2rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1000&auto=format&fit=crop" 
                  alt="A vibrant spread of Indian dishes including curry, naan, and rice" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-6 rounded-2xl shadow-xl border border-outline-variant max-w-[200px] -rotate-6">
                <p className="text-sm font-bold italic text-secondary dark:text-secondary-fixed">"The secret is in the tempering of the spices."</p>
                <p className="text-xs mt-2 text-outline">— Chef's Note</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chef CTA Section */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <div className="bg-surface-container-low rounded-[2rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-16">
          {/* Abstract Design Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4"></div>
          
          <div className="relative z-10 flex-1">
            <div className="bg-primary-container text-on-primary-container px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-block mb-6">New Feature</div>
            <h2 className="font-headline text-5xl md:text-6xl font-medium mb-8 leading-tight">Your personal <span className="italic text-primary">AI Sous-Chef</span> is ready.</h2>
            <p className="text-xl text-outline mb-10 max-w-lg leading-relaxed">
              Input your leftover ingredients and dietary preferences. Our AI Chef will curate a bespoke recipe just for you, including wine pairings and plating tips.
            </p>
            <Link to="/ai-chef" className="inline-block bg-primary text-on-primary px-10 py-5 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Try AI Chef Now
            </Link>
          </div>
          
          <div className="relative z-10 flex-1 flex justify-center">
            <div className="relative w-full max-w-sm aspect-square">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
              <img className="absolute inset-4 w-full h-full object-cover rounded-full shadow-2xl" alt="a chef's hands professionally arranging fresh herbs on a plate in a bright modern kitchen with golden sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAow70B8ATm3dAy50ZbPNia9G6xCbJR1OSlgUM5jTeU6nVAvMSBX_zSDsjH_XANQxwhhgoQlRYpmnfKOIY4k6K2tBMfQKRdrkb-kcK68A0z3J6SFjsECXVwjSJk7P2kKhl1ZuCjo9aUlXgwGFgO8k4P0e07KX1q1YgW4Bfv5rXbr9oB3ZCFMu87_t1LKh8EJWfte93ceuXaJUDcHwpcL_U-MXqUx4lknlCKlNLenfngGL6lhPU5VifHEJEuR0pNTT9Z27vgghKN0Y"/>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
