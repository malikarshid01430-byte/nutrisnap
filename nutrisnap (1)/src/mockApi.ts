import { FoodItem } from './types';

const FOOD_DATABASE: Record<string, FoodItem[]> = {
  'salad': [
    { id: '1', name: 'Mixed Greens', calories: 15, protein: 1, carbs: 3, fat: 0, fiber: 2, vitamins: ['A', 'K', 'C'], confidence: 0.98 },
    { id: '2', name: 'Cherry Tomatoes', calories: 20, protein: 1, carbs: 4, fat: 0, fiber: 1.5, vitamins: ['C', 'K'], confidence: 0.95 },
    { id: '3', name: 'Cucumber', calories: 10, protein: 0.5, carbs: 2, fat: 0, fiber: 0.5, vitamins: ['K'], confidence: 0.92 },
    { id: '4', name: 'Olive Oil Dressing', calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0, vitamins: ['E'], confidence: 0.88 },
  ],
  'burger': [
    { id: '5', name: 'Beef Patty', calories: 250, protein: 20, carbs: 0, fat: 18, fiber: 0, vitamins: ['B12', 'Zinc'], confidence: 0.97 },
    { id: '6', name: 'Brioche Bun', calories: 150, protein: 5, carbs: 28, fat: 3, fiber: 1, vitamins: ['B1'], confidence: 0.94 },
    { id: '7', name: 'Cheddar Cheese', calories: 110, protein: 7, carbs: 1, fat: 9, fiber: 0, vitamins: ['A', 'B12'], confidence: 0.91 },
    { id: '8', name: 'Lettuce & Tomato', calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 1, vitamins: ['C', 'K'], confidence: 0.85 },
  ],
  'pizza': [
    { id: '9', name: 'Pizza Crust', calories: 200, protein: 6, carbs: 38, fat: 3, fiber: 2, vitamins: ['B1'], confidence: 0.96 },
    { id: '10', name: 'Mozzarella', calories: 160, protein: 12, carbs: 2, fat: 12, fiber: 0, vitamins: ['A', 'B12'], confidence: 0.93 },
    { id: '11', name: 'Tomato Sauce', calories: 30, protein: 1, carbs: 6, fat: 0, fiber: 1, vitamins: ['C', 'E'], confidence: 0.89 },
    { id: '12', name: 'Pepperoni', calories: 140, protein: 5, carbs: 1, fat: 13, fiber: 0, vitamins: ['B12'], confidence: 0.87 },
  ],
  'default': [
    { id: '13', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, vitamins: ['B6', 'B12'], confidence: 0.99 },
    { id: '14', name: 'Brown Rice', calories: 215, protein: 5, carbs: 45, fat: 1.6, fiber: 3.5, vitamins: ['B1', 'B6'], confidence: 0.95 },
    { id: '15', name: 'Steamed Broccoli', calories: 55, protein: 4, carbs: 11, fat: 0.6, fiber: 5, vitamins: ['C', 'K', 'A'], confidence: 0.92 },
  ]
};

export const mockAnalyzeImage = async (imageFile: File): Promise<FoodItem[]> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Randomly pick a meal type for demo
  const keys = Object.keys(FOOD_DATABASE);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return FOOD_DATABASE[randomKey];
};
