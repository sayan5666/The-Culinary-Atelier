import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRecipeFromIngredients, searchRecipe, getAutocompleteSuggestions } from './geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAutocompleteSuggestions', () => {
    it('returns empty array when query is less than 2 chars', async () => {
      const res = await getAutocompleteSuggestions('a');
      expect(res).toEqual([]);
    });

    it('returns suggestions from fetch when endpoint succeeds', async () => {
      const mockSuggestions = ['Salmon Poke', 'Salmon Teriyaki'];
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuggestions,
      } as Response);

      const res = await getAutocompleteSuggestions('salmon');
      expect(res).toEqual(mockSuggestions);
    });

    it('falls back to local common suggestions when fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const res = await getAutocompleteSuggestions('carbonara');
      expect(res).toContain('Authentic Carbonara');
    });
  });

  describe('generateRecipeFromIngredients', () => {
    it('calls /api/recipe/generate and returns parsed recipe', async () => {
      const mockRecipe = {
        title: 'Tomato Basil Bruschetta',
        description: 'Crisp rustic bread topped with marinated vine-ripened tomatoes.',
        prepTime: '10m',
        cookTime: '5m',
        difficulty: 'Easy' as const,
        cuisine: 'Italian',
        ingredients: ['Tomato', 'Basil', 'Baguette'],
        instructions: ['Toast bread', 'Top with diced tomatoes and basil'],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe,
      } as Response);

      const result = await generateRecipeFromIngredients(['Tomato', 'Basil']);
      expect(result).toEqual(mockRecipe);
    });

    it('throws friendly error when API returns error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Pantry ingredients unavailable' }),
      } as Response);

      await expect(generateRecipeFromIngredients(['Rare Ingredient'])).rejects.toThrow(
        'Pantry ingredients unavailable'
      );
    });
  });

  describe('searchRecipe', () => {
    it('calls /api/recipe/search and returns parsed recipe', async () => {
      const mockRecipe = {
        title: 'Authentic Carbonara',
        description: 'Classic Roman pasta with pecorino and guanciale.',
        prepTime: '10m',
        cookTime: '15m',
        difficulty: 'Easy' as const,
        cuisine: 'Italian',
        ingredients: ['Rigatoni', 'Guanciale', 'Pecorino Romano', 'Egg yolks'],
        instructions: ['Cook pasta', 'Toss with rendered guanciale and egg emulsion'],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipe,
      } as Response);

      const result = await searchRecipe('Carbonara');
      expect(result).toEqual(mockRecipe);
    });

    it('throws friendly error when search API fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network down'));

      await expect(searchRecipe('Fail Dish')).rejects.toThrow('Network down');
    });
  });
});
