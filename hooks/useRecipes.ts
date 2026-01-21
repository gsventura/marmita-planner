import { useState, useEffect, useCallback } from 'react';
import { Recipe } from '../types';
import * as recipesService from '../services/recipesService';

interface UseRecipesReturn {
    recipes: Recipe[];
    loading: boolean;
    error: string | null;
    addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
    updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id'>>) => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to manage recipes with Supabase
 */
export function useRecipes(): UseRecipesReturn {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await recipesService.fetchRecipes();
            setRecipes(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar receitas');
            console.error('Error fetching recipes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id'>) => {
        try {
            setError(null);
            const newRecipe = await recipesService.createRecipe(recipe);
            setRecipes(prev => [...prev, newRecipe].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao adicionar receita');
            throw err;
        }
    }, []);

    const updateRecipe = useCallback(async (
        id: string,
        updates: Partial<Omit<Recipe, 'id'>>
    ) => {
        try {
            setError(null);
            const updated = await recipesService.updateRecipe(id, updates);
            setRecipes(prev =>
                prev.map(recipe => recipe.id === id ? updated : recipe).sort((a, b) => a.name.localeCompare(b.name))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar receita');
            throw err;
        }
    }, []);

    const deleteRecipe = useCallback(async (id: string) => {
        try {
            setError(null);
            await recipesService.deleteRecipe(id);
            setRecipes(prev => prev.filter(recipe => recipe.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar receita');
            throw err;
        }
    }, []);

    return {
        recipes,
        loading,
        error,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        refetch: fetchData
    };
}
