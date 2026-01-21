import React, { useState } from 'react';
import { Ingredient, Unit, Category } from '../types';
import { Trash2, Plus, Edit2, Search, AlertCircle, X } from 'lucide-react';

interface Props {
  ingredients: Ingredient[];
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
  updateIngredient: (id: string, updates: Partial<Omit<Ingredient, 'id'>>) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  loading?: boolean;
}

const IngredientsView: React.FC<Props> = ({
  ingredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  loading = false
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>(Unit.GRAMS);
  const [category, setCategory] = useState<Category>(Category.PROTEIN);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      setSaving(true);
      if (editingId) {
        await updateIngredient(editingId, { name, unit, category });
        setEditingId(null);
      } else {
        await addIngredient({ name, unit, category });
      }
      setName('');
      setUnit(Unit.GRAMS);
      setCategory(Category.PROTEIN);
    } catch (error) {
      console.error('Error saving ingredient:', error);
      alert('Erro ao salvar ingrediente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ing: Ingredient) => {
    setName(ing.name);
    setUnit(ing.unit);
    setCategory(ing.category);
    setEditingId(ing.id);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmId(id);
    // Auto-cancel after 3 seconds if not confirmed
    setTimeout(() => {
      setDeleteConfirmId(prev => (prev === id ? null : prev));
    }, 3000);
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteIngredient(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Erro ao deletar ingrediente. Tente novamente.');
    }
  };

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(filter.toLowerCase()) ||
    i.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          {editingId ? 'Editar Ingrediente' : 'Novo Ingrediente'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ex: Peito de Frango"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Unidade</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            {editingId ? <><Edit2 size={18} /> Atualizar</> : <><Plus size={18} /> Cadastrar</>}
          </button>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setName(''); }}
              className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Despensa ({ingredients.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-sm">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Unidade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Nenhum ingrediente encontrado.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map(ing => (
                  <tr key={ing.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-3 px-4 font-medium text-slate-700">{ing.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {ing.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{ing.unit}</td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2 items-center">
                      <button onClick={() => handleEdit(ing)} className="text-slate-400 hover:text-blue-600 p-2 transition">
                        <Edit2 size={16} />
                      </button>

                      {deleteConfirmId === ing.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                          <span className="text-xs text-red-600 font-bold mr-1">Confirmar?</span>
                          <button
                            onClick={() => confirmDelete(ing.id)}
                            className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 shadow-sm"
                            title="Confirmar exclusão"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-200 text-slate-600 p-1.5 rounded hover:bg-slate-300"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteRequest(ing.id)}
                          className="text-slate-400 hover:text-red-500 p-2 transition"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IngredientsView;