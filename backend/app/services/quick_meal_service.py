"""
Quick Meal Filter Service

This module provides filtering logic for finding quick, healthy, practical meals
that are suitable for busy users (e.g., students in hostels/PGs).

The service uses RecipeDB API endpoints to filter recipes based on:
- Preparation time (under 5 minutes by default)
- Number of ingredients (3 or fewer by default)
- Cooking method (no-cook, microwave)
- Required utensils (hostel-friendly equipment)
- Meal category (breakfast, snack, etc.)
"""

import logging
from typing import List, Dict, Optional, Set
from app.models.recipe import (
    QuickMealFilters,
    QuickMealRecipe,
    QuickMealResponse,
    RecipeBasic
)
from app.services.recipedb_service import RecipeDBService

logger = logging.getLogger(__name__)


class QuickMealService:
    """
    Service for filtering and recommending quick, practical meals.
    
    Helps users find fast, budget-friendly recipes with minimal ingredients,
    specifically designed for hostel/PG settings and busy lifestyles.
    
    Uses RecipeDB API endpoints for dynamic filtering.
    
    Attributes:
        recipedb_service: Service for accessing recipe database
    """
    
    def __init__(self, recipedb_service: RecipeDBService):
        """Initialize quick meal service with recipe database access."""
        self.recipedb_service = recipedb_service
        
        # Hostel-friendly cooking methods
        self.hostel_methods = ["no-cook", "microwave", "kettle"]
        
        # Quick meal categories
        self.quick_categories = ["snacks", "quick meals", "beverages"]
        
        logger.info("QuickMealService initialized")
    
    def filter_quick_meals(
        self,
        filters: QuickMealFilters,
        limit: int = 20
    ) -> QuickMealResponse:
        """
        Filter recipes based on quick meal criteria using RecipeDB API.
        
        Dynamically queries RecipeDB using appropriate endpoints based on
        user-specified filters.
        
        Args:
            filters: QuickMealFilters object with filter criteria
            limit: Maximum number of recipes to return
            
        Returns:
            QuickMealResponse: Filtered quick meal recipes with metadata
        """
        logger.info(f"Filtering quick meals with criteria: {filters}")
        
        all_recipes = []
        recipe_ids_seen: Set[str] = set()
        
        # Strategy 1: Search by hostel-friendly cooking methods
        if filters.hostel_friendly:
            logger.info("Searching for hostel-friendly recipes (no-cook, microwave)")
            for method in self.hostel_methods:
                try:
                    recipes = self.recipedb_service.search_by_method(method)
                    for recipe in recipes:
                        recipe_id = recipe.get("id")
                        if recipe_id and recipe_id not in recipe_ids_seen:
                            all_recipes.append(recipe)
                            recipe_ids_seen.add(recipe_id)
                except Exception as e:
                    logger.warning(f"Error searching by method {method}: {str(e)}")
                    logger.warning(f"[COSYLAB API FALLBACK] RecipeDB method search '{method}' failed in quick meals. Skipping this cooking method.")
        
        # Strategy 2: Search by quick meal categories
        for category in self.quick_categories:
            try:
                recipes = self.recipedb_service.search_by_category(category)
                for recipe in recipes:
                    recipe_id = recipe.get("id")
                    if recipe_id and recipe_id not in recipe_ids_seen:
                        all_recipes.append(recipe)
                        recipe_ids_seen.add(recipe_id)
            except Exception as e:
                logger.warning(f"Error searching by category {category}: {str(e)}")
                logger.warning(f"[COSYLAB API FALLBACK] RecipeDB category search '{category}' failed in quick meals. Skipping this category.")
        
        # Strategy 3: Search by diet type if specified
        if filters.diet_type:
            try:
                recipes = self.recipedb_service.search_by_diet(filters.diet_type)
                for recipe in recipes:
                    recipe_id = recipe.get("id")
                    if recipe_id and recipe_id not in recipe_ids_seen:
                        all_recipes.append(recipe)
                        recipe_ids_seen.add(recipe_id)
            except Exception as e:
                logger.warning(f"Error searching by diet {filters.diet_type}: {str(e)}")
                logger.warning(f"[COSYLAB API FALLBACK] RecipeDB diet search '{filters.diet_type}' failed in quick meals. Skipping diet filter.")
        
        # Strategy 4: Search by cuisine if specified
        if filters.cuisine:
            try:
                recipes = self.recipedb_service.search_by_cuisine(filters.cuisine)
                for recipe in recipes:
                    recipe_id = recipe.get("id")
                    if recipe_id and recipe_id not in recipe_ids_seen:
                        all_recipes.append(recipe)
                        recipe_ids_seen.add(recipe_id)
            except Exception as e:
                logger.warning(f"Error searching by cuisine {filters.cuisine}: {str(e)}")
                logger.warning(f"[COSYLAB API FALLBACK] RecipeDB cuisine search '{filters.cuisine}' failed in quick meals. Skipping cuisine filter.")
        
        logger.info(f"Found {len(all_recipes)} recipes from API before filtering")
        
        # Apply client-side filters
        filtered_meals = []
        for recipe_data in all_recipes:
            # Filter by preparation time
            prep_time = recipe_data.get("prep_time", 0)
            if prep_time and prep_time > filters.max_prep_time:
                continue
            
            # Filter by ingredient count
            ingredients = recipe_data.get("ingredients", [])
            if isinstance(ingredients, list) and len(ingredients) > filters.max_ingredients:
                continue
            
            # Create QuickMealRecipe object
            try:
                recipe_basic = RecipeBasic(
                    id=recipe_data.get("id", "unknown"),
                    name=recipe_data.get("name", "Unknown Recipe"),
                    cuisine=recipe_data.get("cuisine"),
                    diet_type=recipe_data.get("diet_type"),
                    ingredients=ingredients if isinstance(ingredients, list) else [],
                    instructions=recipe_data.get("instructions"),
                    prep_time=prep_time if prep_time else None,
                    cook_time=recipe_data.get("cook_time"),
                    servings=recipe_data.get("servings", 1)
                )
                
                ingredient_count = len(ingredients) if isinstance(ingredients, list) else 0
                
                # Use API-provided cost if available, otherwise estimate
                estimated_cost = recipe_data.get("cost_per_serving")
                if not estimated_cost:
                    # Simple estimation based on ingredient count
                    estimated_cost = ingredient_count * 20  # ₹20 per ingredient average
                
                # Filter by cost
                if estimated_cost > filters.max_cost:
                    continue
                
                # Extract equipment from recipe data
                equipment_needed = self._extract_equipment(recipe_data)
                
                # Generate practical tip
                practical_tip = self._generate_practical_tip(recipe_basic, estimated_cost)
                
                quick_meal = QuickMealRecipe(
                    recipe=recipe_basic,
                    ingredient_count=ingredient_count,
                    estimated_cost=int(estimated_cost),
                    equipment_needed=equipment_needed,
                    practical_tips=practical_tip
                )
                
                filtered_meals.append(quick_meal)
                
                if len(filtered_meals) >= limit:
                    break
                    
            except Exception as e:
                logger.warning(f"Error processing recipe {recipe_data.get('name')}: {str(e)}")
                continue
        
        logger.info(f"Filtered down to {len(filtered_meals)} quick meals")
        
        # Create response
        filters_dict = {
            "max_prep_time": filters.max_prep_time,
            "max_ingredients": filters.max_ingredients,
            "max_cost": filters.max_cost,
            "hostel_friendly": filters.hostel_friendly
        }
        if filters.cuisine:
            filters_dict["cuisine"] = filters.cuisine
        if filters.diet_type:
            filters_dict["diet_type"] = filters.diet_type
        
        psychological_tip = self._get_psychological_tip()
        
        response = QuickMealResponse(
            meals=filtered_meals,
            total_found=len(filtered_meals),
            filters_applied=filters_dict,
            psychological_tip=psychological_tip
        )
        
        return response
    
    def _extract_equipment(self, recipe_data: Dict) -> List[str]:
        """
        Extract equipment information from recipe data.
        
        Args:
            recipe_data: Recipe data dictionary
            
        Returns:
            List[str]: List of equipment items
        """
        # Check if equipment is provided in recipe data
        equipment = recipe_data.get("utensils", [])
        if isinstance(equipment, list) and equipment:
            return equipment
        
        # Check method field
        method = recipe_data.get("method", "").lower()
        if "no-cook" in method or "no cook" in method:
            return ["plate", "knife"]
        elif "microwave" in method:
            return ["microwave", "bowl"]
        
        # Default minimal equipment
        return ["basic kitchen tools"]
    
    def _generate_practical_tip(self, recipe: RecipeBasic, cost: int) -> str:
        """
        Generate a practical tip for preparing the recipe.
        
        Args:
            recipe: Recipe basic information
            cost: Estimated cost
            
        Returns:
            str: Practical preparation tip
        """
        tips = [
            f"Quick {recipe.prep_time or 'under 5'} min meal - perfect when you're short on time!",
            f"Budget-friendly at ≈₹{cost} per serving.",
            f"Only {len(recipe.ingredients)} ingredients needed - easy to shop for!",
            "Keep ingredients stocked for emergency quick meals.",
            "Perfect for late-night study sessions or early morning classes."
        ]
        
        # Return a relevant tip
        if cost < 30:
            return f"Super affordable at ≈₹{cost}! {tips[3]}"
        elif recipe.prep_time and recipe.prep_time <= 3:
            return f"{tips[0]} {tips[4]}"
        else:
            return tips[2]
    
    def _get_psychological_tip(self) -> str:
        """
        Get a psychological insight about quick healthy eating.
        
        Returns:
            str: Psychological tip
        """
        tips = [
            "Quick healthy meals prevent extreme hunger and reduce cravings for junk food by keeping blood sugar stable.",
            "Having easy meal options removes the excuse of 'nothing to eat' - the main reason healthy eating fails.",
            "5-minute meals mean healthy eating is actually more convenient than ordering junk food.",
            "Keeping quick healthy options ready prevents decision fatigue when you're tired or stressed.",
            "Regular quick meals throughout the day prevent the extreme hunger that leads to overeating."
        ]
        
        # Return a random tip (in production, could rotate or personalize)
        return tips[0]
