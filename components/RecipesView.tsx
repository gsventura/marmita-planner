import React, { useState } from 'react';
import { Recipe, Ingredient, RecipeIngredient, Unit, RecipeOwner } from '../types';
import { Plus, Trash2, ChefHat, Clock, Users, Sparkles, BookOpen, AlertCircle, Search } from 'lucide-react';
import { suggestRecipesWithAI, generateDetailedInstructions } from '../services/geminiService';

interface Props {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id'>>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  ingredients: Ingredient[];
  loading?: boolean;
}

const RecipesView: React.FC<Props> = ({ recipes, addRecipe, updateRecipe, deleteRecipe, ingredients, loading = false }) => {
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState<RecipeOwner | 'ALL'>('ALL');

  // Form State
  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe>>({
    ingredients: [],
    yield: 1,
    prepTimeMinutes: 30,
    instructions: '',
    owner: RecipeOwner.GUSTAVO
  });

  // Filtered Recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = filterOwner === 'ALL' || recipe.owner === filterOwner;
    return matchesSearch && matchesOwner;
  });

  // New ingredient entry state for form
  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedQty, setSelectedQty] = useState(0);

  const handleEdit = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setViewState('form');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta receita?')) {
      try {
        await deleteRecipe(id);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Erro ao deletar receita. Tente novamente.');
      }
    }
  };

  const saveRecipe = async () => {
    if (!currentRecipe.name || !currentRecipe.ingredients) return;

    try {
      setSaving(true);
      const recipeData = {
        name: currentRecipe.name,
        ingredients: currentRecipe.ingredients,
        yield: currentRecipe.yield || 1,
        prepTimeMinutes: currentRecipe.prepTimeMinutes || 30,
        instructions: currentRecipe.instructions || '',
        owner: currentRecipe.owner || RecipeOwner.GUSTAVO
      };

      if (currentRecipe.id) {
        await updateRecipe(currentRecipe.id, recipeData);
      } else {
        await addRecipe(recipeData);
      }

      setViewState('list');
      resetForm();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Erro ao salvar receita. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentRecipe({ ingredients: [], yield: 1, prepTimeMinutes: 30, instructions: '', owner: RecipeOwner.GUSTAVO });
  };

  const addIngredientToRecipe = () => {
    if (!selectedIngId || selectedQty <= 0) return;
    const newIng: RecipeIngredient = { ingredientId: selectedIngId, quantity: selectedQty };

    setCurrentRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIng]
    }));
    setSelectedIngId('');
    setSelectedQty(0);
  };

  const removeIngredientFromRecipe = (index: number) => {
    setCurrentRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index)
    }));
  };

  // AI Handlers
  const handleAISuggest = async () => {
    setLoadingAI(true);
    try {
      const suggestions = await suggestRecipesWithAI(ingredients);
      if (suggestions.length > 0) {
        const s = suggestions[0];
        setCurrentRecipe(prev => ({
          ...prev,
          name: s.name,
          prepTimeMinutes: s.prepTimeMinutes,
          yield: s.yield,
          instructions: s.instructions + `\n\n(Nota: Ajuste os ingredientes conforme sua despensa)`
        }));
        alert(`Sugestão carregada: ${s.name}. Por favor, vincule os ingredientes manualmente.`);
      } else {
        alert("A IA não conseguiu sugerir receitas com os ingredientes atuais.");
      }
    } catch (e) {
      alert("Erro ao consultar IA");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAIGenerateInstructions = async () => {
    if (!currentRecipe.name) return alert("Defina um nome para a receita primeiro.");
    setLoadingAI(true);
    try {
      const ingredientNames = currentRecipe.ingredients?.map(ri => {
        const ing = ingredients.find(i => i.id === ri.ingredientId);
        return ing ? `${ri.quantity}${ing.unit} de ${ing.name}` : '';
      }).join(', ') || '';

      const instructions = await generateDetailedInstructions(currentRecipe.name, ingredientNames);
      setCurrentRecipe(prev => ({ ...prev, instructions }));
    } catch (e) {
      alert("Erro ao gerar instruções");
    } finally {
      setLoadingAI(false);
    }
  };

  if (viewState === 'form') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {currentRecipe.id ? 'Editar Receita' : 'Nova Receita'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleAISuggest}
              disabled={loadingAI}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
            >
              <Sparkles size={16} />
              {loadingAI ? 'Pensando...' : 'Sugerir Receita (IA)'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome da Receita</label>
              <input
                type="text"
                value={currentRecipe.name || ''}
                onChange={e => setCurrentRecipe({ ...currentRecipe, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Ex: Frango com Batata Doce"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Marmita de</label>
              <select
                value={currentRecipe.owner || RecipeOwner.GUSTAVO}
                onChange={e => setCurrentRecipe({ ...currentRecipe, owner: e.target.value as RecipeOwner })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value={RecipeOwner.LUIZA}>Luiza</option>
                <option value={RecipeOwner.GUSTAVO}>Gustavo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Porções</label>
              <input
                type="number"
                min="1"
                value={currentRecipe.yield || 1}
                onChange={e => setCurrentRecipe({ ...currentRecipe, yield: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tempo (min)</label>
              <input
                type="number"
                min="5"
                value={currentRecipe.prepTimeMinutes || 30}
                onChange={e => setCurrentRecipe({ ...currentRecipe, prepTimeMinutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="font-medium text-slate-700 mb-2">Ingredientes</h3>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedIngId}
              onChange={e => setSelectedIngId(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            >
              <option value="">Selecione um ingrediente...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qtd"
              value={selectedQty || ''}
              onChange={e => setSelectedQty(parseFloat(e.target.value))}
              className="w-24 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={addIngredientToRecipe}
              className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900"
            >
              <Plus size={20} />
            </button>
          </div>

          <ul className="space-y-2 mb-4 bg-slate-50 p-4 rounded-lg">
            {currentRecipe.ingredients?.length === 0 && <li className="text-sm text-slate-400">Nenhum ingrediente adicionado.</li>}
            {currentRecipe.ingredients?.map((ri, idx) => {
              const ing = ingredients.find(i => i.id === ri.ingredientId);
              return (
                <li key={idx} className="flex justify-between items-center text-sm">
                  {ing ? (
                    <span>{ing.name}</span>
                  ) : (
                    <span className="text-red-400 italic flex items-center gap-1"><AlertCircle size={12} /> Ingrediente indisponível</span>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-600">{ri.quantity} {ing?.unit}</span>
                    <button onClick={() => removeIngredientFromRecipe(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-600">Modo de Preparo</label>
            <button
              onClick={handleAIGenerateInstructions}
              disabled={loadingAI}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <Sparkles size={12} /> Gerar com IA
            </button>
          </div>
          <textarea
            value={currentRecipe.instructions || ''}
            onChange={e => setCurrentRecipe({ ...currentRecipe, instructions: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg h-32"
            placeholder="Descreva o passo a passo..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => { setViewState('list'); resetForm(); }}
            className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={saveRecipe}
            disabled={saving || loading}
            className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Receita'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Livro de Receitas</h2>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar receita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Owner Filter */}
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setFilterOwner('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded ${filterOwner === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterOwner(RecipeOwner.LUIZA)}
              className={`px-3 py-1 text-xs font-medium rounded ${filterOwner === RecipeOwner.LUIZA ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Luiza
            </button>
            <button
              onClick={() => setFilterOwner(RecipeOwner.GUSTAVO)}
              className={`px-3 py-1 text-xs font-medium rounded ${filterOwner === RecipeOwner.GUSTAVO ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Gustavo
            </button>
          </div>

          <button
            onClick={() => { resetForm(); setViewState('form'); }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus size={18} /> Nova Receita
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{recipe.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(recipe)} className="text-slate-400 hover:text-blue-500 p-1"><BookOpen size={16} /></button>
                  <button onClick={() => handleDelete(recipe.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-1"><Clock size={14} /> {recipe.prepTimeMinutes} min</div>
                <div className="flex items-center gap-1"><Users size={14} /> {recipe.yield} porções</div>
              </div>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {recipe.ingredients.length} ingredientes cadastrados.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${recipe.owner === RecipeOwner.LUIZA
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
                  }`}>
                  {recipe.owner}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredRecipes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <ChefHat size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma receita encontrada.</p>
            {recipes.length === 0 ? (
              <p className="text-sm mt-1">Crie uma nova ou peça ajuda à IA.</p>
            ) : (
              <p className="text-sm mt-1">Tente ajustar seus filtros de busca.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesView;