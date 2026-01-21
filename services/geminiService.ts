import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe, Unit, Category } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Suggests recipes based on available ingredients using Gemini.
 */
export const suggestRecipesWithAI = async (ingredients: Ingredient[]): Promise<Partial<Recipe>[]> => {
  if (ingredients.length === 0) return [];

  const ingredientNames = ingredients.map(i => i.name).join(', ');

  const prompt = `
    Como um nutricionista especialista em "meal prep" (marmitas), sugira 3 receitas práticas e saudáveis usando alguns destes ingredientes: ${ingredientNames}.
    Retorne apenas um JSON estruturado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              prepTimeMinutes: { type: Type.NUMBER },
              yield: { type: Type.NUMBER },
              instructions: { type: Type.STRING },
              // Note: We cannot easily map back to strict Ingredient IDs purely from AI text without fuzzy matching, 
              // so we return a text description of ingredients for the user to manually refine if needed, 
              // or we assume standard basic ingredients.
              description: { type: Type.STRING, description: "Breve descrição dos ingredientes principais" }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    return JSON.parse(text) as Partial<Recipe>[];
  } catch (error) {
    console.error("Erro ao gerar receitas:", error);
    throw new Error("Falha ao obter sugestões da IA.");
  }
};

/**
 * Generates detailed prep instructions for a specific recipe.
 */
export const generateDetailedInstructions = async (recipeName: string, ingredientList: string): Promise<string> => {
  const prompt = `
    Crie um guia passo a passo detalhado para preparar a receita: "${recipeName}".
    Ingredientes: ${ingredientList}.
    Foque em eficiência para quem está cozinhando várias marmitas ao mesmo tempo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster text generation
      }
    });
    return response.text || "Sem instruções geradas.";
  } catch (error) {
    console.error("Erro ao gerar instruções:", error);
    return "Não foi possível gerar instruções detalhadas no momento.";
  }
};

/**
 * Optimizes the Sunday Prep schedule.
 */
export const optimizePrepSchedule = async (recipes: Recipe[]): Promise<string> => {
  if (recipes.length === 0) return "Nenhuma receita selecionada para o planejamento.";

  const recipeSummaries = recipes.map(r => `${r.name} (${r.prepTimeMinutes} min)`).join(', ');

  const prompt = `
    Eu preciso preparar as seguintes receitas no domingo para minhas marmitas da semana: ${recipeSummaries}.
    Crie um cronograma de preparação otimizado (pipeline de cozinha) para que eu perca o menor tempo possível.
    Sugira a ordem de preparo, o que pode ser feito simultaneamente (ex: enquanto algo assa, corte vegetais) e dicas de armazenamento.
    Formate a resposta em Markdown claro.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME, // Using a smarter model if available, but flash is good for planning
      contents: prompt,
    });
    return response.text || "Erro ao gerar cronograma.";
  } catch (error) {
    console.error("Erro ao otimizar preparo:", error);
    return "Não foi possível conectar ao assistente de IA.";
  }
};