"""
Pydantic models for recipe data.

This module defines the data models for recipe information, including
request/response schemas for recipe analysis endpoints. All models use
Pydantic for automatic validation, serialization, and type safety.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Any, List, Optional, Dict


class RecipeAnalysisRequest(BaseModel):
    """
    Request model for recipe health analysis endpoint.

    Used by the /analyze endpoint (Workflow 1) to initiate recipe
    health analysis.

    Attributes:
        recipe_name: Name of the recipe to analyze
    """
    recipe_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Name of the recipe to analyze",
        examples=["Chicken Curry"]
    )

    @field_validator('recipe_name')
    @classmethod
    def validate_recipe_name(cls, v: str) -> str:
        """Validate recipe name is not empty or whitespace only."""
        if not v or not v.strip():
            raise ValueError('Recipe name cannot be empty')
        return v.strip()


class FullAnalysisRequest(BaseModel):
    """
    Request model for the unified recipe analysis endpoint (/analyze-full).

    Supports both RecipeDB lookup (recipe_name only) and custom recipe
    input (recipe_name + ingredients). Also accepts user-declared allergens
    and ingredients to avoid.
    """
    recipe_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Name of the recipe to analyze",
        examples=["Chocolate Chip Cookies"]
    )
    ingredients: Optional[List[str]] = Field(
        None,
        description="List of ingredients (custom input mode; skips RecipeDB lookup for recipe data)"
    )
    allergens: Optional[List[str]] = Field(
        None,
        description="Allergen categories the user is sensitive to (e.g., ['milk', 'eggs'])"
    )
    avoid_ingredients: Optional[List[str]] = Field(
        None,
        description="Specific ingredients the user wants to avoid (e.g., ['white sugar', 'butter'])"
    )

    @field_validator('recipe_name')
    @classmethod
    def validate_recipe_name_full(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Recipe name cannot be empty')
        return v.strip()

    @field_validator('ingredients')
    @classmethod
    def validate_ingredients(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            v = [ing.strip() for ing in v if ing.strip()]
            if len(v) == 0:
                raise ValueError('Ingredients list cannot be empty if provided')
        return v

    @field_validator('allergens')
    @classmethod
    def validate_allergens(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        valid_allergens = {"milk", "eggs", "peanuts", "tree_nuts", "soy", "wheat", "fish", "shellfish"}
        if v is not None:
            v = [a.strip().lower() for a in v if a.strip()]
            for allergen in v:
                if allergen not in valid_allergens:
                    raise ValueError(
                        f"Invalid allergen '{allergen}'. "
                        f"Valid: {', '.join(sorted(valid_allergens))}"
                    )
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "recipe_name": "Chocolate Chip Cookies",
                "ingredients": ["butter", "white sugar", "white flour", "eggs", "chocolate chips"],
                "allergens": ["milk", "eggs"],
                "avoid_ingredients": ["white sugar"]
            }
        }
    }


class RecipeBasic(BaseModel):
    """
    Basic recipe information model.
    
    Contains essential recipe data without detailed nutrition information.
    Used across multiple response models.
    
    Attributes:
        id: Unique recipe identifier
        name: Recipe name
        cuisine: Cuisine type (e.g., "Italian", "Indian")
        diet_type: Diet classification (e.g., "vegetarian", "vegan")
        ingredients: List of ingredient strings
        instructions: Optional cooking instructions
        prep_time: Optional preparation time in minutes
        cook_time: Optional cooking time in minutes
        servings: Optional number of servings
    """
    id: str = Field(..., description="Unique recipe identifier")
    name: str = Field(..., description="Recipe name")
    cuisine: Optional[str] = Field(None, description="Cuisine type")
    diet_type: Optional[str] = Field(None, description="Diet classification")
    ingredients: List[str] = Field(
        default_factory=list,
        description="List of ingredients"
    )
    instructions: Optional[str] = Field(None, description="Cooking instructions")
    prep_time: Optional[int] = Field(None, description="Preparation time in minutes")
    cook_time: Optional[int] = Field(None, description="Cooking time in minutes")
    servings: Optional[int] = Field(None, description="Number of servings")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "12345",
                "name": "Chicken Curry",
                "cuisine": "Indian",
                "diet_type": "non-vegetarian",
                "ingredients": [
                    "chicken breast",
                    "curry powder",
                    "onion",
                    "garlic",
                    "coconut milk"
                ],
                "instructions": "Cook chicken with spices...",
                "prep_time": 15,
                "cook_time": 30,
                "servings": 4
            }
        }
    }


class RecipeRecommendation(BaseModel):
    """
    Recipe recommendation model for Workflow 1.
    
    Represents a single recommended recipe with similarity and health
    scoring information.
    
    Attributes:
        recipe: Basic recipe information
        similarity_score: How similar to original recipe (0-100)
        health_score: Health score of recommended recipe (0-100)
        relevance_score: Combined ranking score
        reason: Explanation for why this recipe was recommended
    """
    recipe: RecipeBasic = Field(..., description="Recommended recipe data")
    similarity_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Similarity to original recipe (0-100)"
    )
    health_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Health score of this recipe (0-100)"
    )
    relevance_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Combined relevance score"
    )
    reason: str = Field(
        ...,
        description="Explanation for recommendation"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "recipe": {
                    "id": "67890",
                    "name": "Healthy Chicken Tikka",
                    "cuisine": "Indian",
                    "diet_type": "non-vegetarian",
                    "ingredients": ["chicken", "yogurt", "spices"]
                },
                "similarity_score": 85.5,
                "health_score": 78.2,
                "relevance_score": 81.85,
                "reason": "Recommended: same Indian cuisine, very similar recipe, good health rating"
            }
        }
    }


class RecipeSearchFilters(BaseModel):
    """
    Optional filters for recipe search.
    
    Used when querying for similar recipes or searching recipe database.
    
    Attributes:
        cuisine: Filter by cuisine type
        diet_type: Filter by diet classification
        min_calories: Minimum calories
        max_calories: Maximum calories
        min_protein: Minimum protein in grams
        max_protein: Maximum protein in grams
    """
    cuisine: Optional[str] = Field(None, description="Cuisine type filter")
    diet_type: Optional[str] = Field(None, description="Diet type filter")
    min_calories: Optional[int] = Field(None, ge=0, description="Minimum calories")
    max_calories: Optional[int] = Field(None, ge=0, description="Maximum calories")
    min_protein: Optional[float] = Field(None, ge=0, description="Minimum protein (g)")
    max_protein: Optional[float] = Field(None, ge=0, description="Maximum protein (g)")
    
    @field_validator('max_calories')
    @classmethod
    def validate_calorie_range(cls, v: Optional[int], info) -> Optional[int]:
        """Ensure max calories is greater than min calories."""
        if v is not None and 'min_calories' in info.data and info.data['min_calories'] is not None:
            if v < info.data['min_calories']:
                raise ValueError('max_calories must be greater than min_calories')
        return v
    
    @field_validator('max_protein')
    @classmethod
    def validate_protein_range(cls, v: Optional[float], info) -> Optional[float]:
        """Ensure max protein is greater than min protein."""
        if v is not None and 'min_protein' in info.data and info.data['min_protein'] is not None:
            if v < info.data['min_protein']:
                raise ValueError('max_protein must be greater than min_protein')
        return v


class QuickMealFilters(BaseModel):
    """
    Filter parameters for quick, healthy, practical meal suggestions.
    
    Designed for users who want fast, budget-friendly recipes with minimal
    ingredients. Particularly useful for students in hostels/PGs.
    
    Attributes:
        max_prep_time: Maximum preparation time in minutes (default: 5)
        max_ingredients: Maximum number of ingredients (default: 3)
        max_cost: Maximum cost per serving in INR (default: 100)
        hostel_friendly: Whether recipe should be hostel/PG-friendly (default: True)
        cuisine: Optional cuisine filter
        diet_type: Optional diet type filter (vegetarian, vegan, etc.)
    """
    max_prep_time: int = Field(
        5,
        ge=1,
        le=30,
        description="Maximum preparation time in minutes"
    )
    max_ingredients: int = Field(
        3,
        ge=1,
        le=10,
        description="Maximum number of ingredients"
    )
    max_cost: int = Field(
        100,
        ge=10,
        le=500,
        description="Maximum cost per serving in INR"
    )
    hostel_friendly: bool = Field(
        True,
        description="Filter for hostel/PG-friendly recipes (no oven, minimal equipment)"
    )
    cuisine: Optional[str] = Field(
        None,
        description="Optional cuisine filter (e.g., 'Indian', 'Italian')"
    )
    diet_type: Optional[str] = Field(
        None,
        description="Optional diet type filter (e.g., 'vegetarian', 'vegan')"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "max_prep_time": 5,
                "max_ingredients": 3,
                "max_cost": 100,
                "hostel_friendly": True,
                "cuisine": "Indian",
                "diet_type": "vegetarian"
            }
        }
    }


class QuickMealRecipe(BaseModel):
    """
    Quick meal recipe model with practical information.
    
    Contains recipe data plus quick meal specific metadata like
    estimated cost and equipment requirements.
    
    Attributes:
        recipe: Basic recipe information
        ingredient_count: Number of ingredients in the recipe
        estimated_cost: Estimated cost per serving in INR
        equipment_needed: List of simple equipment needed
        practical_tips: Quick tips for preparation
    """
    recipe: RecipeBasic = Field(..., description="Recipe data")
    ingredient_count: int = Field(..., ge=1, description="Number of ingredients")
    estimated_cost: int = Field(..., ge=0, description="Estimated cost per serving (INR)")
    equipment_needed: List[str] = Field(
        default_factory=list,
        description="Simple equipment required (e.g., 'pan', 'bowl')"
    )
    practical_tips: Optional[str] = Field(
        None,
        description="Quick preparation tips"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "recipe": {
                    "id": "quick001",
                    "name": "Banana Peanut Butter Toast",
                    "cuisine": "Continental",
                    "diet_type": "vegetarian",
                    "ingredients": ["bread", "peanut butter", "banana"],
                    "prep_time": 3,
                    "servings": 1
                },
                "ingredient_count": 3,
                "estimated_cost": 30,
                "equipment_needed": ["plate", "knife"],
                "practical_tips": "Use whole wheat bread for extra fiber. Slice banana thinly for even spread."
            }
        }
    }


class QuickMealResponse(BaseModel):
    """
    Response model for quick meal filter endpoint.
    
    Returns a list of quick, practical meals matching the filter criteria,
    along with metadata about the search.
    
    Attributes:
        meals: List of quick meal recipes
        total_found: Total number of meals found
        filters_applied: Summary of filters applied
        psychological_tip: Helpful tip about preventing cravings
    """
    meals: List[QuickMealRecipe] = Field(..., description="List of quick meal recipes")
    total_found: int = Field(..., ge=0, description="Total number of meals found")
    filters_applied: Dict[str, Any] = Field(..., description="Summary of applied filters")
    psychological_tip: str = Field(
        default="Quick healthy meals help stabilize blood sugar and reduce extreme hunger, making it easier to avoid cravings for junk food.",
        description="Psychological insight about healthy eating"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "meals": [
                    {
                        "recipe": {
                            "id": "quick001",
                            "name": "Banana Peanut Butter Toast",
                            "ingredients": ["bread", "peanut butter", "banana"],
                            "prep_time": 3
                        },
                        "ingredient_count": 3,
                        "estimated_cost": 30,
                        "equipment_needed": ["plate", "knife"]
                    }
                ],
                "total_found": 15,
                "filters_applied": {
                    "max_prep_time": 5,
                    "max_ingredients": 3,
                    "max_cost": 100
                },
                "psychological_tip": "Quick healthy meals prevent extreme hunger and keep blood sugar stable."
            }
        }
    }