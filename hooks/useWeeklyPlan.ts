import { useState, useEffect, useCallback } from 'react';
import { WeeklyPlan, DayOfWeek } from '../types';
import * as weeklyPlanService from '../services/weeklyPlanService';

interface UseWeeklyPlanReturn {
    plan: WeeklyPlan;
    loading: boolean;
    error: string | null;
    updateDayPlan: (day: DayOfWeek, recipeIds: string[], servings: Record<string, number>) => Promise<void>;
    addRecipeToDay: (day: DayOfWeek, recipeId: string, servings?: number) => Promise<void>;
    removeRecipeFromDay: (day: DayOfWeek, recipeId: string) => Promise<void>;
    clearPlan: () => Promise<void>;
    refetch: () => Promise<void>;
}

const EMPTY_PLAN: WeeklyPlan = {
    [DayOfWeek.MONDAY]: { day: DayOfWeek.MONDAY, recipeIds: [], servings: {} },
    [DayOfWeek.TUESDAY]: { day: DayOfWeek.TUESDAY, recipeIds: [], servings: {} },
    [DayOfWeek.WEDNESDAY]: { day: DayOfWeek.WEDNESDAY, recipeIds: [], servings: {} },
    [DayOfWeek.THURSDAY]: { day: DayOfWeek.THURSDAY, recipeIds: [], servings: {} },
    [DayOfWeek.FRIDAY]: { day: DayOfWeek.FRIDAY, recipeIds: [], servings: {} },
};

/**
 * Custom hook to manage weekly meal plan with Supabase
 */
export function useWeeklyPlan(): UseWeeklyPlanReturn {
    const [plan, setPlan] = useState<WeeklyPlan>(EMPTY_PLAN);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await weeklyPlanService.fetchWeeklyPlan();
            setPlan(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar planejamento');
            console.error('Error fetching weekly plan:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateDayPlan = useCallback(async (
        day: DayOfWeek,
        recipeIds: string[],
        servings: Record<string, number>
    ) => {
        try {
            setError(null);
            const updatedDay = await weeklyPlanService.updateDayPlan(day, recipeIds, servings);
            setPlan(prev => ({
                ...prev,
                [day]: updatedDay
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar planejamento');
            throw err;
        }
    }, []);

    const addRecipeToDay = useCallback(async (
        day: DayOfWeek,
        recipeId: string,
        servings: number = 1
    ) => {
        try {
            setError(null);
            await weeklyPlanService.addRecipeToDay(day, recipeId, servings);

            setPlan(prev => {
                const dayPlan = prev[day];
                const newRecipeIds = [...dayPlan.recipeIds, recipeId];
                const newServings = { ...dayPlan.servings, [recipeId]: servings };

                return {
                    ...prev,
                    [day]: {
                        day,
                        recipeIds: newRecipeIds,
                        servings: newServings
                    }
                };
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao adicionar receita ao dia');
            throw err;
        }
    }, []);

    const removeRecipeFromDay = useCallback(async (
        day: DayOfWeek,
        recipeId: string
    ) => {
        try {
            setError(null);
            await weeklyPlanService.removeRecipeFromDay(day, recipeId);

            setPlan(prev => {
                const dayPlan = prev[day];
                const newRecipeIds = dayPlan.recipeIds.filter(id => id !== recipeId);
                const newServings = { ...dayPlan.servings };
                delete newServings[recipeId];

                return {
                    ...prev,
                    [day]: {
                        day,
                        recipeIds: newRecipeIds,
                        servings: newServings
                    }
                };
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao remover receita do dia');
            throw err;
        }
    }, []);

    const clearPlan = useCallback(async () => {
        try {
            setError(null);
            await weeklyPlanService.clearWeeklyPlan();
            setPlan(EMPTY_PLAN);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao limpar planejamento');
            throw err;
        }
    }, []);

    return {
        plan,
        loading,
        error,
        updateDayPlan,
        addRecipeToDay,
        removeRecipeFromDay,
        clearPlan,
        refetch: fetchData
    };
}
