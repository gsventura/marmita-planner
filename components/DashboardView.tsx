import React, { useMemo, useState } from 'react';
import { WeeklyPlan, Recipe, Ingredient, ShoppingItem, DayOfWeek, DailyPlan } from '../types';
import { ShoppingCart, ChefHat, CheckSquare, Square, Printer, Sparkles } from 'lucide-react';
import { optimizePrepSchedule } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Assuming markdown rendering is handled or raw text

// Small helper for markdown-like display if no library is allowed, 
// but since I can't install new deps, I will display raw text nicely or use simple replacement.
// Actually, I'll just use a whitespace-pre-wrap div.

interface Props {
  plan: WeeklyPlan;
  recipes: Recipe[];
  ingredients: Ingredient[];
}

const DashboardView: React.FC<Props> = ({ plan, recipes, ingredients }) => {
  const [prepGuide, setPrepGuide] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Calculate Shopping List
  const shoppingList = useMemo(() => {
    const items: Record<string, ShoppingItem> = {};

    Object.values(DayOfWeek).forEach(day => {
      const dailyPlan = plan[day];
      dailyPlan.recipeIds.forEach(rId => {
        const recipe = recipes.find(r => r.id === rId);
        if (!recipe) return;
        
        const servingsNeeded = dailyPlan.servings[rId] || 1;
        const ratio = servingsNeeded / recipe.yield; // Adjust based on yield

        recipe.ingredients.forEach(ri => {
          const ing = ingredients.find(i => i.id === ri.ingredientId);
          if (!ing) return;

          const quantityNeeded = ri.quantity * ratio;

          if (items[ing.id]) {
            items[ing.id].totalQuantity += quantityNeeded;
          } else {
            items[ing.id] = {
              ingredientId: ing.id,
              name: ing.name,
              unit: ing.unit,
              category: ing.category,
              totalQuantity: quantityNeeded,
              checked: false
            };
          }
        });
      });
    });

    return Object.values(items).sort((a, b) => a.category.localeCompare(b.category));
  }, [plan, recipes, ingredients]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generatePrep = async () => {
    setLoadingAI(true);
    // Gather all unique recipes used in the week
    const usedRecipeIds = new Set<string>();
    (Object.values(plan) as DailyPlan[]).forEach(p => p.recipeIds.forEach(id => usedRecipeIds.add(id)));
    
    const activeRecipes = recipes.filter(r => usedRecipeIds.has(r.id));
    
    const result = await optimizePrepSchedule(activeRecipes);
    setPrepGuide(result);
    setLoadingAI(false);
  };

  // Group by category
  const groupedList = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Shopping List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Lista de Compras</h2>
          </div>
          <button onClick={() => window.print()} className="text-slate-400 hover:text-slate-600">
            <Printer size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto max-h-[600px]">
          {Object.keys(groupedList).length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              Planeje sua semana para gerar a lista.
            </div>
          ) : (
            Object.keys(groupedList).map(category => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">{category}</h3>
                <div className="space-y-2">
                  {groupedList[category].map(item => (
                    <div 
                      key={item.ingredientId} 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${checkedItems[item.ingredientId] ? 'bg-slate-50 opacity-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => toggleCheck(item.ingredientId)}
                    >
                      <div className="flex items-center gap-3">
                        {checkedItems[item.ingredientId] ? <CheckSquare size={20} className="text-emerald-500"/> : <Square size={20} className="text-slate-300"/>}
                        <span className={checkedItems[item.ingredientId] ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
                        {item.totalQuantity.toFixed(1)} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Prep Guide Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-900 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChefHat className="text-yellow-400" />
                <h2 className="text-xl font-bold">Guia de Preparo (Domingo)</h2>
              </div>
              <button 
                onClick={generatePrep}
                disabled={loadingAI}
                className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={16} />
                {loadingAI ? 'Otimizando...' : 'Otimizar com IA'}
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              A IA organiza a melhor ordem para cozinhar tudo de uma vez.
            </p>
          </div>
          
          <div className="p-6 min-h-[400px]">
            {prepGuide ? (
              <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                {prepGuide}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 text-center">
                <ChefHat size={48} className="mb-4 opacity-20" />
                <p>Clique em "Otimizar com IA" para gerar seu cronograma de cozinha.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;