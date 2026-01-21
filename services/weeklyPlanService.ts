import { supabase } from './supabaseClient';
import { WeeklyPlan, DayOfWeek, DailyPlan } from '../types';

export interface WeeklyPlanRow {
    id: string;
    day: DayOfWeek;
    recipe_id: string;
    servings: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch the complete weekly plan
 */
export async function fetchWeeklyPlan(): Promise<WeeklyPlan> {
    const { data, error } = await supabase
        .from('weekly_plans')
        .select('*');

    if (error) {
        console.error('Error fetching weekly plan:', error);
        throw new Error('Falha ao carregar planejamento semanal');
    }

    // Initialize empty plan
    const emptyPlan: WeeklyPlan = {
        [DayOfWeek.MONDAY]: { day: DayOfWeek.MONDAY, recipeIds: [], servings: {} },
        [DayOfWeek.TUESDAY]: { day: DayOfWeek.TUESDAY, recipeIds: [], servings: {} },
        [DayOfWeek.WEDNESDAY]: { day: DayOfWeek.WEDNESDAY, recipeIds: [], servings: {} },
        [DayOfWeek.THURSDAY]: { day: DayOfWeek.THURSDAY, recipeIds: [], servings: {} },
        [DayOfWeek.FRIDAY]: { day: DayOfWeek.FRIDAY, recipeIds: [], servings: {} },
    };

    // Group data by day
    (data || []).forEach(row => {
        const day = row.day as DayOfWeek;
        if (emptyPlan[day]) {
            if (!emptyPlan[day].recipeIds.includes(row.recipe_id)) {
                emptyPlan[day].recipeIds.push(row.recipe_id);
            }
            emptyPlan[day].servings[row.recipe_id] = row.servings;
        }
    });

    return emptyPlan;
}

/**
 * Update the plan for a specific day
 */
export async function updateDayPlan(
    day: DayOfWeek,
    recipeIds: string[],
    servings: Record<string, number>
): Promise<DailyPlan> {
    // Delete existing entries for this day
    await supabase
        .from('weekly_plans')
        .delete()
        .eq('day', day);

    // Insert new entries
    if (recipeIds.length > 0) {
        const entries = recipeIds.map(recipeId => ({
            day,
            recipe_id: recipeId,
            servings: servings[recipeId] || 1
        }));

        const { error } = await supabase
            .from('weekly_plans')
            .insert(entries);

        if (error) {
            console.error('Error updating day plan:', error);
            throw new Error('Falha ao atualizar planejamento do dia');
        }
    }

    return {
        day,
        recipeIds,
        servings
    };
}

/**
 * Clear the entire weekly plan
 */
export async function clearWeeklyPlan(): Promise<void> {
    const { error } = await supabase
        .from('weekly_plans')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
        console.error('Error clearing weekly plan:', error);
        throw new Error('Falha ao limpar planejamento semanal');
    }
}

/**
 * Add a recipe to a specific day
 */
export async function addRecipeToDay(
    day: DayOfWeek,
    recipeId: string,
    servings: number = 1
): Promise<void> {
    const { error } = await supabase
        .from('weekly_plans')
        .insert({
            day,
            recipe_id: recipeId,
            servings
        });

    if (error) {
        console.error('Error adding recipe to day:', error);
        throw new Error('Falha ao adicionar receita ao dia');
    }
}

/**
 * Remove a specific recipe from a day
 */
export async function removeRecipeFromDay(
    day: DayOfWeek,
    recipeId: string
): Promise<void> {
    const { error } = await supabase
        .from('weekly_plans')
        .delete()
        .eq('day', day)
        .eq('recipe_id', recipeId);

    if (error) {
        console.error('Error removing recipe from day:', error);
        throw new Error('Falha ao remover receita do dia');
    }
}
