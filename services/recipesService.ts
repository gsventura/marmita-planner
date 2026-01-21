import { supabase } from './supabaseClient';
import { Recipe, RecipeIngredient, RecipeOwner } from '../types';

export interface RecipeRow {
    id: string;
    name: string;
    yield: number;
    prep_time_minutes: number;
    instructions: string;
    owner: string;
    created_at?: string;
    updated_at?: string;
}

export interface RecipeIngredientRow {
    recipe_id: string;
    ingredient_id: string;
    quantity: number;
}

/**
 * Fetch all recipes with their ingredients
 */
export async function fetchRecipes(): Promise<Recipe[]> {
    // Fetch recipes
    const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .order('name', { ascending: true });

    if (recipesError) {
        console.error('Error fetching recipes:', recipesError);
        throw new Error('Falha ao carregar receitas');
    }

    // Fetch all recipe ingredients relationships
    const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*');

    if (ingredientsError) {
        console.error('Error fetching recipe ingredients:', ingredientsError);
        throw new Error('Falha ao carregar ingredientes das receitas');
    }

    // Map recipes with their ingredients
    return (recipesData || []).map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        yield: recipe.yield,
        prepTimeMinutes: recipe.prep_time_minutes,
        instructions: recipe.instructions,
        owner: recipe.owner as RecipeOwner,
        ingredients: (ingredientsData || [])
            .filter(ri => ri.recipe_id === recipe.id)
            .map(ri => ({
                ingredientId: ri.ingredient_id,
                quantity: ri.quantity
            }))
    }));
}

/**
 * Create a new recipe with its ingredients
 */
export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    // Create the recipe
    const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
            name: recipe.name,
            yield: recipe.yield,
            prep_time_minutes: recipe.prepTimeMinutes,
            instructions: recipe.instructions,
            owner: recipe.owner
        })
        .select()
        .single();

    if (recipeError) {
        console.error('Error creating recipe:', recipeError);
        throw new Error('Falha ao criar receita');
    }

    // Create recipe ingredients relationships
    if (recipe.ingredients.length > 0) {
        const recipeIngredients = recipe.ingredients.map(ing => ({
            recipe_id: recipeData.id,
            ingredient_id: ing.ingredientId,
            quantity: ing.quantity
        }));

        const { error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .insert(recipeIngredients);

        if (ingredientsError) {
            console.error('Error creating recipe ingredients:', ingredientsError);
            // Rollback: delete the recipe
            await supabase.from('recipes').delete().eq('id', recipeData.id);
            throw new Error('Falha ao adicionar ingredientes à receita');
        }
    }

    return {
        id: recipeData.id,
        name: recipeData.name,
        yield: recipeData.yield,
        prepTimeMinutes: recipeData.prep_time_minutes,
        instructions: recipeData.instructions,
        owner: recipeData.owner as RecipeOwner,
        ingredients: recipe.ingredients
    };
}

/**
 * Update an existing recipe and its ingredients
 */
export async function updateRecipe(
    id: string,
    updates: Partial<Omit<Recipe, 'id'>>
): Promise<Recipe> {
    // Update recipe basic info
    const recipeUpdates: any = {};
    if (updates.name !== undefined) recipeUpdates.name = updates.name;
    if (updates.yield !== undefined) recipeUpdates.yield = updates.yield;
    if (updates.prepTimeMinutes !== undefined) recipeUpdates.prep_time_minutes = updates.prepTimeMinutes;
    if (updates.instructions !== undefined) recipeUpdates.instructions = updates.instructions;
    if (updates.owner !== undefined) recipeUpdates.owner = updates.owner;

    const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .update(recipeUpdates)
        .eq('id', id)
        .select()
        .single();

    if (recipeError) {
        console.error('Error updating recipe:', recipeError);
        throw new Error('Falha ao atualizar receita');
    }

    // Update ingredients if provided
    let ingredients: RecipeIngredient[] = [];

    if (updates.ingredients !== undefined) {
        // Delete existing ingredients
        await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', id);

        // Insert new ingredients
        if (updates.ingredients.length > 0) {
            const recipeIngredients = updates.ingredients.map(ing => ({
                recipe_id: id,
                ingredient_id: ing.ingredientId,
                quantity: ing.quantity
            }));

            const { error: ingredientsError } = await supabase
                .from('recipe_ingredients')
                .insert(recipeIngredients);

            if (ingredientsError) {
                console.error('Error updating recipe ingredients:', ingredientsError);
                throw new Error('Falha ao atualizar ingredientes da receita');
            }
        }

        ingredients = updates.ingredients;
    } else {
        // Fetch existing ingredients
        const { data: ingredientsData } = await supabase
            .from('recipe_ingredients')
            .select('*')
            .eq('recipe_id', id);

        ingredients = (ingredientsData || []).map(ri => ({
            ingredientId: ri.ingredient_id,
            quantity: ri.quantity
        }));
    }

    return {
        id: recipeData.id,
        name: recipeData.name,
        yield: recipeData.yield,
        prepTimeMinutes: recipeData.prep_time_minutes,
        instructions: recipeData.instructions,
        owner: recipeData.owner as RecipeOwner,
        ingredients
    };
}

/**
 * Delete a recipe (cascade delete will handle recipe_ingredients)
 */
export async function deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting recipe:', error);
        throw new Error('Falha ao deletar receita');
    }
}
