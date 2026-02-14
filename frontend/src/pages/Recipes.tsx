import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NavLink } from "@/components/NavLink";
import { Search, Plus, ChefHat } from "lucide-react";
import { getRecipes } from "@/store/recipeStore";
import type { Recipe } from "@/types/api";

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setRecipes(getRecipes());
  }, []);

  // Re-fetch when returning to this tab (e.g. after saving a new recipe)
  useEffect(() => {
    const onFocus = () => setRecipes(getRecipes());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    return "bg-yellow-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-4xl tracking-tight md:text-5xl mb-3">
                My Recipes
              </h1>
              <p className="text-muted-foreground text-lg">
                Your analyzed recipes and their health scores ({recipes.length})
              </p>
            </div>
            <NavLink to="/analysis">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            </NavLink>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Recipes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {recipe.quantity != null && recipe.quantity > 0 && (
                            <span>{recipe.quantity} servings</span>
                          )}
                          {recipe.quantity != null && recipe.quantity > 0 && recipe.timestamp && " · "}
                          {recipe.timestamp}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getScoreColor(recipe.health_score)}`}>
                          {Math.round(recipe.health_score)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recipe.detected_allergens.length > 0 && (
                        <Badge variant="secondary">
                          {recipe.detected_allergens.length} allergens
                        </Badge>
                      )}
                      {recipe.improved_score && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          +{Math.round(recipe.improved_score - recipe.health_score)} improvement
                        </Badge>
                      )}
                      {recipe.swap_suggestions.length > 0 && (
                        <Badge variant="secondary">
                          {recipe.swap_suggestions.length} swaps
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            /* Empty state if no recipes */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full"
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="font-display text-xl mb-2">No recipes yet</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-sm">
                    Start analyzing your recipes to build your personalized collection
                  </p>
                  <NavLink to="/analysis">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Analyze First Recipe
                    </Button>
                  </NavLink>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
