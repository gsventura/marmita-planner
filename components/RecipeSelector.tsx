import React, { useState, useEffect, useRef } from 'react';
import { Recipe, RecipeOwner } from '../types';
import { Search, X, Check } from 'lucide-react';

interface Props {
    recipes: Recipe[];
    onSelect: (recipeId: string) => void;
    placeholder?: string;
}

const RecipeSelector: React.FC<Props> = ({ recipes, onSelect, placeholder = "Selecione uma receita..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full text-left text-sm border-slate-200 border rounded-lg px-3 py-2 text-slate-500 hover:border-emerald-500 hover:text-slate-700 transition flex justify-between items-center bg-white"
                >
                    <span>{placeholder}</span>
                    <span className="text-xs text-slate-400">▼</span>
                </button>
            ) : (
                <div className="absolute top-0 left-0 w-full z-50 bg-white border border-emerald-500 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-300"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {filteredRecipes.length === 0 ? (
                            <div className="p-3 text-sm text-slate-400 text-center">
                                Nenhuma receita encontrada.
                            </div>
                        ) : (
                            <ul className="py-1">
                                {filteredRecipes.map(recipe => (
                                    <li key={recipe.id}>
                                        <button
                                            onClick={() => handleSelect(recipe.id)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition flex justify-between items-center group"
                                        >
                                            <span className="text-slate-700 font-medium">{recipe.name}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${recipe.owner === RecipeOwner.LUIZA
                                                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {recipe.owner}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-slate-50 px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100">
                        {filteredRecipes.length} receitas encontradas
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeSelector;
