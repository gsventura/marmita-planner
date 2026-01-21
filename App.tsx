import React, { useState } from 'react';
import { LayoutDashboard, CalendarDays, Book, Carrot, Menu, Database } from 'lucide-react';
import IngredientsView from './components/IngredientsView';
import RecipesView from './components/RecipesView';
import PlannerView from './components/PlannerView';
import DashboardView from './components/DashboardView';
import { useIngredients } from './hooks/useIngredients';
import { useRecipes } from './hooks/useRecipes';
import { useWeeklyPlan } from './hooks/useWeeklyPlan';

enum View {
  DASHBOARD = 'dashboard',
  PLANNER = 'planner',
  RECIPES = 'recipes',
  INGREDIENTS = 'ingredients'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use Supabase hooks for data management
  const {
    ingredients,
    loading: ingredientsLoading,
    error: ingredientsError,
    addIngredient,
    updateIngredient,
    deleteIngredient
  } = useIngredients();

  const {
    recipes,
    loading: recipesLoading,
    error: recipesError,
    addRecipe,
    updateRecipe,
    deleteRecipe
  } = useRecipes();

  const {
    plan,
    loading: planLoading,
    error: planError,
    updateDayPlan,
    clearPlan
  } = useWeeklyPlan();



  const NavButton = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition font-medium ${currentView === view
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
        : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4">
        <div className="flex items-center gap-2 px-4 mb-8 mt-2">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">Marmita</h1>
            <p className="text-xs text-slate-500 font-medium">Planner Inteligente</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavButton view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavButton view={View.PLANNER} icon={CalendarDays} label="Planejamento" />
          <NavButton view={View.RECIPES} icon={Book} label="Receitas" />
          <NavButton view={View.INGREDIENTS} icon={Carrot} label="Ingredientes" />
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
            <Database size={10} /> Supabase Cloud
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
            <LayoutDashboard size={20} />
          </div>
          <h1 className="font-bold text-lg text-slate-800">Marmita Planner</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          <Menu />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 pt-20 px-4 space-y-2">
          <NavButton view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavButton view={View.PLANNER} icon={CalendarDays} label="Planejamento" />
          <NavButton view={View.RECIPES} icon={Book} label="Receitas" />
          <NavButton view={View.INGREDIENTS} icon={Carrot} label="Ingredientes" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-20 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {currentView === View.DASHBOARD && (
            <DashboardView plan={plan} recipes={recipes} ingredients={ingredients} />
          )}
          {currentView === View.PLANNER && (
            <PlannerView
              plan={plan}
              updateDayPlan={updateDayPlan}
              recipes={recipes}
              loading={planLoading}
              clearPlan={clearPlan}
            />
          )}
          {currentView === View.RECIPES && (
            <RecipesView
              recipes={recipes}
              addRecipe={addRecipe}
              updateRecipe={updateRecipe}
              deleteRecipe={deleteRecipe}
              ingredients={ingredients}
              loading={recipesLoading}
            />
          )}
          {currentView === View.INGREDIENTS && (
            <IngredientsView
              ingredients={ingredients}
              addIngredient={addIngredient}
              updateIngredient={updateIngredient}
              deleteIngredient={deleteIngredient}
              loading={ingredientsLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;