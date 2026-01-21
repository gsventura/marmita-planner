export enum Unit {
  GRAMS = 'g',
  MILLILITERS = 'ml',
  UNIT = 'un',
  SPOON = 'colher',
  CUP = 'xícara'
}

export enum Category {
  PROTEIN = 'Proteína',
  CARB = 'Carboidrato',
  VEGETABLE = 'Vegetal',
  FRUIT = 'Fruta',
  SPICE = 'Tempero/Outros',
  DAIRY = 'Laticínios'
}

export enum RecipeOwner {
  LUIZA = 'Luiza',
  GUSTAVO = 'Gustavo'
}

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  category: Category;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  yield: number; // number of servings
  prepTimeMinutes: number;
  instructions: string;
  owner: RecipeOwner;
}

export enum DayOfWeek {
  MONDAY = 'Segunda',
  TUESDAY = 'Terça',
  WEDNESDAY = 'Quarta',
  THURSDAY = 'Quinta',
  FRIDAY = 'Sexta'
}

export interface DailyPlan {
  day: DayOfWeek;
  recipeIds: string[]; // Recipes scheduled for this day
  servings: Record<string, number>; // RecipeID -> Number of servings needed for that day
}

export type WeeklyPlan = Record<DayOfWeek, DailyPlan>;

export interface ShoppingItem {
  ingredientId: string;
  totalQuantity: number;
  unit: Unit;
  category: Category;
  name: string;
  checked: boolean;
}

// AI Types
export interface AISuggestionRequest {
  availableIngredients: Ingredient[];
}

export interface AIOptimizationRequest {
  recipes: Recipe[];
}