import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRecipeFromIngredients, searchRecipe } from './geminiService';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  const generateContentMock = vi.fn();
  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: generateContentMock,
        },
      };
    }),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
    },
  };
});

// Import the mocked module to access the mock function
import { GoogleGenAI } from '@google/genai';

describe('geminiService', () => {
  const mockAi = new GoogleGenAI({ apiKey: 'AIzaSyDr2sitAtMOmmsaT8WmXUU8Pb50uPx0n7I' });
  const generateContentMock = mockAi.models.generateContent as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRecipeFromIngredients', () => {
    it('should call generateContent with the correct prompt and config', async () => {
      const mockRecipe = {
        title: 'Test Recipe',
        description: 'A delicious test dish',
        prepTime: '10m',
        cookTime: '20m',
        difficulty: 'Easy',
        cuisine: 'Test',
        ingredients: ['Item 1'],
        instructions: ['Step 1'],
      };

      generateContentMock.mockResolvedValue({
        text: JSON.stringify(mockRecipe),
      });

      const ingredients = ['Tomato', 'Basil'];
      const diet = 'Vegan';
      const result = await generateRecipeFromIngredients(ingredients, diet);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-flash-preview',
          contents: expect.stringContaining('Tomato, Basil'),
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        })
      );
      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Vegan'),
        })
      );
      expect(result).toEqual(mockRecipe);
    });

    it('should handle empty response text gracefully', async () => {
      generateContentMock.mockResolvedValue({
        text: '',
      });

      const result = await generateRecipeFromIngredients(['Water']);
      expect(result).toEqual({});
    });
  });

  describe('searchRecipe', () => {
    it('should call generateContent with the search query', async () => {
      const mockRecipe = {
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta',
        prepTime: '5m',
        cookTime: '15m',
        difficulty: 'Medium',
        cuisine: 'Italian',
        ingredients: ['Pasta', 'Eggs'],
        instructions: ['Boil pasta', 'Mix eggs'],
      };

      generateContentMock.mockResolvedValue({
        text: JSON.stringify(mockRecipe),
      });

      const query = 'Pasta Carbonara';
      const result = await searchRecipe(query);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining(query),
        })
      );
      expect(result).toEqual(mockRecipe);
    });

    it('should throw an error if generateContent fails', async () => {
      generateContentMock.mockRejectedValue(new Error('API Error'));

      await expect(searchRecipe('Fail Dish')).rejects.toThrow('API Error');
    });
  });
});
