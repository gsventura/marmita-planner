import React from 'react';
import { WeeklyPlan, DayOfWeek, Recipe, DailyPlan, RecipeOwner } from '../types';
import { Calendar, Trash2, Plus } from 'lucide-react';
import RecipeSelector from './RecipeSelector';

interface Props {
  plan: WeeklyPlan;
  updateDayPlan: (day: DayOfWeek, recipeIds: string[], servings: Record<string, number>) => Promise<void>;
  recipes: Recipe[];
  loading?: boolean;
  clearPlan: () => Promise<void>;
}

const PlannerView: React.FC<Props> = ({ plan, updateDayPlan, recipes, loading = false, clearPlan }) => {

  const handleClearPlan = async () => {
    if (confirm('Tem certeza que deseja limpar todo o planejamento da semana?')) {
      await clearPlan();
    }
  };

  const addRecipeToDay = async (day: DayOfWeek, recipeId: string) => {
    if (!recipeId) return;

    const currentDay = plan[day];
    // Avoid duplicates for simplicity
    if (currentDay.recipeIds.includes(recipeId)) return;

    try {
      const newRecipeIds = [...currentDay.recipeIds, recipeId];
      const newServings = { ...currentDay.servings, [recipeId]: 1 };
      await updateDayPlan(day, newRecipeIds, newServings);
    } catch (error) {
      console.error('Error adding recipe to day:', error);
      alert('Erro ao adicionar receita ao dia. Tente novamente.');
    }
  };

  const removeRecipeFromDay = async (day: DayOfWeek, recipeId: string) => {
    const currentDay = plan[day];
    const newServings = { ...currentDay.servings };
    delete newServings[recipeId];

    try {
      const newRecipeIds = currentDay.recipeIds.filter(id => id !== recipeId);
      await updateDayPlan(day, newRecipeIds, newServings);
    } catch (error) {
      console.error('Error removing recipe from day:', error);
      alert('Erro ao remover receita do dia. Tente novamente.');
    }
  };

  const updateServings = async (day: DayOfWeek, recipeId: string, delta: number) => {
    const currentDay = plan[day];
    const currentServings = currentDay.servings[recipeId] || 1;
    const newAmount = Math.max(1, currentServings + delta);

    try {
      const newServings = { ...currentDay.servings, [recipeId]: newAmount };
      await updateDayPlan(day, currentDay.recipeIds, newServings);
    } catch (error) {
      console.error('Error updating servings:', error);
      alert('Erro ao atualizar porções. Tente novamente.');
    }
  };

  // Helper to get recipe by ID
  const getRecipe = (id: string) => recipes.find(r => r.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-emerald-600" size={28} />
          <h2 className="text-2xl font-bold text-slate-800">Planejamento Semanal</h2>
        </div>
        <button
          onClick={handleClearPlan}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition border border-transparent hover:border-red-100"
        >
          <Trash2 size={16} />
          Limpar Planejamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {Object.values(DayOfWeek).map((day) => (
          <div key={day} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[300px]">
            <div className="p-3 bg-emerald-50 border-b border-emerald-100 rounded-t-xl font-bold text-emerald-800 text-center">
              {day}
            </div>

            <div className="p-3 flex-1 space-y-3">
              {plan[day].recipeIds.map(rId => {
                const recipe = getRecipe(rId);
                if (!recipe) return null;
                const servings = plan[day].servings[rId] || 1;

                return (
                  <div key={rId} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm group hover:border-emerald-300 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="font-medium text-sm text-slate-700 leading-tight block mb-1">{recipe.name}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${recipe.owner === RecipeOwner.LUIZA
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {recipe.owner}
                        </span>
                      </div>
                      <button
                        onClick={() => removeRecipeFromDay(day, rId)}
                        className="text-slate-300 hover:text-red-500 transition ml-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded px-2 py-1">
                      <span className="text-xs text-slate-500">Marmitas:</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateServings(day, rId, -1)} className="w-5 h-5 flex items-center justify-center bg-white rounded border hover:bg-slate-100 text-xs">-</button>
                        <span className="text-xs font-bold w-3 text-center">{servings}</span>
                        <button onClick={() => updateServings(day, rId, 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded border hover:bg-slate-100 text-xs">+</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {plan[day].recipeIds.length === 0 && (
                <div className="text-center py-8 text-slate-300 text-sm">
                  Sem refeições
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100">
              <RecipeSelector
                recipes={recipes}
                onSelect={(id) => addRecipeToDay(day, id)}
                placeholder="+ Adicionar Receita"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerView;