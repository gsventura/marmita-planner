import { supabase } from './supabaseClient';
import { Ingredient, Unit, Category } from '../types';

export interface IngredientRow {
    id: string;
    name: string;
    unit: Unit;
    category: Category;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch all ingredients from Supabase
 */
export async function fetchIngredients(): Promise<Ingredient[]> {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching ingredients:', error);
        throw new Error('Falha ao carregar ingredientes');
    }

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        unit: row.unit as Unit,
        category: row.category as Category
    }));
}

/**
 * Create a new ingredient
 */
export async function createIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
    const { data, error } = await supabase
        .from('ingredients')
        .insert({
            name: ingredient.name,
            unit: ingredient.unit,
            category: ingredient.category
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating ingredient:', error);
        throw new Error('Falha ao criar ingrediente');
    }

    return {
        id: data.id,
        name: data.name,
        unit: data.unit as Unit,
        category: data.category as Category
    };
}

/**
 * Update an existing ingredient
 */
export async function updateIngredient(
    id: string,
    updates: Partial<Omit<Ingredient, 'id'>>
): Promise<Ingredient> {
    const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating ingredient:', error);
        throw new Error('Falha ao atualizar ingrediente');
    }

    return {
        id: data.id,
        name: data.name,
        unit: data.unit as Unit,
        category: data.category as Category
    };
}

/**
 * Delete an ingredient
 */
export async function deleteIngredient(id: string): Promise<void> {
    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting ingredient:', error);
        throw new Error('Falha ao deletar ingrediente');
    }
}
