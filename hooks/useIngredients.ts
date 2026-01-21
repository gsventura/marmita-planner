import { useState, useEffect, useCallback } from 'react';
import { Ingredient } from '../types';
import * as ingredientsService from '../services/ingredientsService';

interface UseIngredientsReturn {
    ingredients: Ingredient[];
    loading: boolean;
    error: string | null;
    addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
    updateIngredient: (id: string, updates: Partial<Omit<Ingredient, 'id'>>) => Promise<void>;
    deleteIngredient: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to manage ingredients with Supabase
 */
export function useIngredients(): UseIngredientsReturn {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ingredientsService.fetchIngredients();
            setIngredients(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar ingredientes');
            console.error('Error fetching ingredients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addIngredient = useCallback(async (ingredient: Omit<Ingredient, 'id'>) => {
        try {
            setError(null);
            const newIngredient = await ingredientsService.createIngredient(ingredient);
            setIngredients(prev => [...prev, newIngredient].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao adicionar ingrediente');
            throw err;
        }
    }, []);

    const updateIngredient = useCallback(async (
        id: string,
        updates: Partial<Omit<Ingredient, 'id'>>
    ) => {
        try {
            setError(null);
            const updated = await ingredientsService.updateIngredient(id, updates);
            setIngredients(prev =>
                prev.map(ing => ing.id === id ? updated : ing).sort((a, b) => a.name.localeCompare(b.name))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar ingrediente');
            throw err;
        }
    }, []);

    const deleteIngredient = useCallback(async (id: string) => {
        try {
            setError(null);
            await ingredientsService.deleteIngredient(id);
            setIngredients(prev => prev.filter(ing => ing.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar ingrediente');
            throw err;
        }
    }, []);

    return {
        ingredients,
        loading,
        error,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        refetch: fetchData
    };
}
