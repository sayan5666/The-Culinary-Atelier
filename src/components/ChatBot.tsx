import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const BURGER_ICON_SRC = '/assets/aistudio/burger-chatbot_63e47bd9.png';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Trigger a small happy wiggle once whenever the chat opens
  useEffect(() => {
    if (isOpen) {
      setIsWiggling(true);
      const timer = setTimeout(() => setIsWiggling(false), 650);
      return () => clearTimeout(timer);
    } else {
      setIsWiggling(false);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 380);
    setIsOpen((prev) => !prev);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input.trim() };
    const currentMessages = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentMessages,
          message: input.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to get chat response');
      const data = await response.json();

      const modelMessage: Message = {
        role: 'model',
        text: data.text || 'I apologize, I am unable to respond at the moment.',
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.warn('Chat warning:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[125px] md:bottom-[160px] right-[24px] z-[9999] w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-11rem)] bg-surface-container-lowest rounded-[2rem] shadow-2xl border border-surface-container-highest flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div>
                  <h3 className="font-headline text-lg font-medium">AI Sous-Chef</h3>
                  <p className="text-xs opacity-80">Dish &amp; Cooking Specialist</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="hover:bg-on-primary/10 p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 scroll-smooth">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-primary">magic_button</span>
                  </div>
                  <h4 className="font-headline text-xl mb-2">Bonjour!</h4>
                  <p className="text-outline text-sm px-8">
                    I am your AI Sous-Chef. I strictly answer questions about dishes, recipes, ingredients, and cooking!
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-high text-on-surface rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-6 border-t border-surface-container-highest bg-surface-container-lowest"
            >
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your Sous-Chef..."
                  className="w-full bg-surface-container-low border-none rounded-full py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Burger Floating Trigger Wrapper */}
      <div
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-label={isOpen ? 'Close AI Sous-Chef chat' : 'Open AI Sous-Chef chat'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="fixed bottom-[24px] right-[24px] w-[85px] md:w-[120px] z-[9999] bg-transparent border-0 shadow-none p-0 m-0 cursor-pointer select-none transition-transform duration-300 ease-out hover:scale-[1.12]"
      >
        <div className={isBouncing ? 'animate-burger-bounce' : 'animate-burger-float'}>
          <div className={isWiggling ? 'animate-burger-wiggle' : 'animate-burger-rotate'}>
            <img
              src={BURGER_ICON_SRC}
              alt="AI Sous-Chef Burger Chatbot"
              draggable={false}
              className="w-full h-auto object-contain select-none block drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)]"
            />
          </div>
        </div>
      </div>
    </>
  );
}
