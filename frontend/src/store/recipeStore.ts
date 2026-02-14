/**
 * Local recipe store using localStorage + JSON.
 * Used for persisting recipe name, quantity (servings), and analysis results
 * so they can be displayed on the Recipes tab.
 */

import type { Recipe } from "@/types/api";
import type { FullAnalysisResponse, RecalculateResponse } from "@/types/api";
import { format } from "date-fns";

const STORAGE_KEY = "recipe-health-recipes";

function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const RECIPE_STORE_EVENT = "recipe-store-updated";

function saveRecipes(recipes: Recipe[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(RECIPE_STORE_EVENT));
    }
  } catch (e) {
    console.error("Failed to save recipes to localStorage", e);
  }
}

export function subscribeToRecipeStore(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(RECIPE_STORE_EVENT, handler);
  return () => window.removeEventListener(RECIPE_STORE_EVENT, handler);
}

/**
 * Get all stored recipes.
 */
export function getRecipes(): Recipe[] {
  return loadRecipes();
}

/**
 * Add a recipe from analysis/final data.
 */
export function addRecipe(params: {
  name: string;
  quantity?: number;
  analysisData: FullAnalysisResponse;
  finalData?: RecalculateResponse | null;
}): Recipe {
  const { name, quantity, analysisData, finalData } = params;
  const recipes = loadRecipes();
  const id = `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const recipe: Recipe = {
    id,
    name,
    quantity,
    health_score: analysisData.original_health_score?.score ?? 0,
    rating: analysisData.original_health_score?.rating ?? "Unknown",
    ingredients: finalData?.final_ingredients ?? analysisData.ingredients,
    improved_score: finalData?.final_health_score?.score ?? analysisData.improved_health_score?.score,
    detected_allergens: (analysisData.detected_allergens || []).map((a: Record<string, unknown>) =>
      typeof a === "string" ? a : (a.allergen_category ?? a.category ?? "Unknown") as string
    ),
    swap_suggestions: (analysisData.swap_suggestions || []).map((s: Record<string, unknown>) => ({
      original: s.original as string,
      substitute: {
        name: (s.substitute as Record<string, unknown>)?.name as string,
        flavor_match: 0,
        health_improvement: 0,
      },
      accepted: s.accepted as boolean,
    })),
    timestamp: format(new Date(), "MMM d, yyyy 'at' h:mm a"),
  };

  recipes.unshift(recipe);
  saveRecipes(recipes);
  return recipe;
}

/**
 * Remove a recipe by id.
 */
export function removeRecipe(id: string): void {
  const recipes = loadRecipes().filter((r) => r.id !== id);
  saveRecipes(recipes);
}
