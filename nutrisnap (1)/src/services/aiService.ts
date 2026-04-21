import { GoogleGenAI, Type } from "@google/genai";
import { DailySummary, UserProfile, MealSuggestion, MealEntry, PlannedMeal } from "../types";

export const getMealSuggestions = async (
  summary: DailySummary,
  profile: UserProfile
): Promise<MealSuggestion[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const remainingCalories = Math.max(0, profile.dailyGoals.calories - summary.totalCalories);
  const remainingProtein = Math.max(0, profile.dailyGoals.protein - summary.totalProtein);
  const remainingCarbs = Math.max(0, profile.dailyGoals.carbs - summary.totalCarbs);
  const remainingFat = Math.max(0, profile.dailyGoals.fat - summary.totalFat);

  const prompt = `
    User Profile:
    - Name: ${profile.name}
    - Age: ${profile.age}
    - Gender: ${profile.gender}
    - Weight: ${profile.weight}kg
    - Height: ${profile.height}cm
    - Daily Goals: ${profile.dailyGoals.calories}kcal, ${profile.dailyGoals.protein}g P, ${profile.dailyGoals.carbs}g C, ${profile.dailyGoals.fat}g F
    - Dietary Preference: ${profile.aiSettings?.dietaryPreference || 'none'}
    - Regional Cuisine: ${profile.aiSettings?.regionalCuisine || 'Global'}

    Today's Progress:
    - Eaten: ${summary.totalCalories}kcal, ${summary.totalProtein}g P, ${summary.totalCarbs}g C, ${summary.totalFat}g F
    - Remaining: ${remainingCalories}kcal, ${remainingProtein}g P, ${remainingCarbs}g C, ${remainingFat}g F

    Based on the remaining macros, suggest 3 meals for the rest of the day.
    The meals should help the user hit their targets as closely as possible.
    Provide a name, calories, protein, carbs, fat, prep time, difficulty level (Easy, Medium, Hard), and a brief description for each meal.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              prepTime: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
              description: { type: Type.STRING }
            },
            required: ["id", "name", "calories", "protein", "carbs", "fat", "prepTime", "difficulty", "description"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching meal suggestions:", error);
    return [
      {
        id: "s1",
        name: "Grilled Salmon with Asparagus",
        calories: 450,
        protein: 35,
        carbs: 10,
        fat: 25,
        prepTime: "20 mins",
        difficulty: "Easy",
        description: "A high-protein, low-carb meal perfect for hitting your remaining targets."
      },
      {
        id: "s2",
        name: "Quinoa and Black Bean Bowl",
        calories: 520,
        protein: 18,
        carbs: 65,
        fat: 12,
        prepTime: "15 mins",
        difficulty: "Easy",
        description: "Fiber-rich and satisfying bowl with fresh vegetables."
      },
      {
        id: "s3",
        name: "Greek Yogurt Parfait",
        calories: 280,
        protein: 22,
        carbs: 30,
        fat: 6,
        prepTime: "5 mins",
        difficulty: "Easy",
        description: "A light snack or dessert to top off your protein intake."
      }
    ];
  }
};

export const getWeeklyInsights = async (
  meals: MealEntry[],
  profile: UserProfile
): Promise<{ tips: string[]; score: number }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    User Profile:
    - Name: ${profile.name}
    - Daily Goals: ${profile.dailyGoals.calories}kcal, ${profile.dailyGoals.protein}g P, ${profile.dailyGoals.carbs}g C, ${profile.dailyGoals.fat}g F
    - Dietary Preference: ${profile.aiSettings?.dietaryPreference || 'none'}

    Recent Meals (Last 7 days):
    ${meals.slice(0, 20).map(m => `- ${m.timestamp.toDateString()}: ${m.totalCalories}kcal (${m.foodItems.map(i => i.name).join(', ')})`).join('\n')}

    Analyze the user's eating patterns over the last week.
    1. Provide 3 personalized, actionable nutrition tips (e.g., "You tend to skip protein at breakfast", "Late night snacks are high in sugar").
    2. Calculate a weekly nutrition score out of 100 based on how well they hit their macro goals and the quality of their food choices.

    Return the result in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            score: { type: Type.NUMBER }
          },
          required: ["tips", "score"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching weekly insights:", error);
    return {
      tips: [
        "Try to include more leafy greens in your lunch.",
        "Your protein intake is slightly low on weekends.",
        "Great job staying hydrated during your afternoon meals!"
      ],
      score: 85
    };
  }
};

export const generateWeeklyMealPlan = async (
  profile: UserProfile
): Promise<PlannedMeal[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  const prompt = `
    Generate a full weekly meal plan for a user with the following profile:
    - Name: ${profile.name}
    - Daily Goals: ${profile.dailyGoals.calories}kcal, ${profile.dailyGoals.protein}g P, ${profile.dailyGoals.carbs}g C, ${profile.dailyGoals.fat}g F
    - Dietary Preference: ${profile.aiSettings?.dietaryPreference || 'none'}
    - Regional Cuisine: ${profile.aiSettings?.regionalCuisine || 'Global'}

    For each day (Mon, Tue, Wed, Thu, Fri, Sat, Sun), provide 4 meals: Breakfast, Lunch, Dinner, and Snack.
    Each meal must have a title, calories, protein, carbs, and fat.
    The total daily macros should closely match the user's daily goals.

    Return the result as an array of objects in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              day: { type: Type.STRING, enum: days },
              mealType: { type: Type.STRING, enum: mealTypes },
              title: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            },
            required: ["id", "day", "mealType", "title", "calories", "protein", "carbs", "fat"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating weekly meal plan:", error);
    const mockPlan: PlannedMeal[] = [];
    days.forEach(day => {
      mealTypes.forEach(type => {
        mockPlan.push({
          id: Math.random().toString(36).substr(2, 9),
          day,
          mealType: type as any,
          title: `${type} Option`,
          calories: Math.floor(profile.dailyGoals.calories / 4),
          protein: Math.floor(profile.dailyGoals.protein / 4),
          carbs: Math.floor(profile.dailyGoals.carbs / 4),
          fat: Math.floor(profile.dailyGoals.fat / 4),
        });
      });
    });
    return mockPlan;
  }
};
