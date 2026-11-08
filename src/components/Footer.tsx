export default function Footer() {
  return (
    <footer className="bg-surface-container-low dark:bg-stone-900 w-full border-t border-surface-container-highest dark:border-stone-800 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 w-full mt-20 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-0">
          <div className="text-lg font-headline italic text-on-surface dark:text-stone-200 mb-2">The Culinary Atelier</div>
          <div className="font-sans text-sm uppercase tracking-widest text-on-surface/60 dark:text-stone-400">© 2024 The Culinary Atelier. Crafted for the Modern Epicurean.</div>
        </div>
        <div className="flex gap-12 font-sans text-sm uppercase tracking-widest">
          <a className="text-on-surface/60 dark:text-stone-400 hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">About Us</a>
          <a className="text-on-surface/60 dark:text-stone-400 hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Chef's Journal</a>
          <a className="text-on-surface/60 dark:text-stone-400 hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Privacy</a>
          <a className="text-on-surface/60 dark:text-stone-400 hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}
