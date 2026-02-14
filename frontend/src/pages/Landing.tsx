import { motion } from "framer-motion";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { ChefHat, Heart, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import bgImage from "@/assets/bg.png";

/** Adjust between 0 and 1 to control background image visibility (0 = fully transparent, 1 = fully opaque) */
const LANDING_BG_OPACITY = 0.25;

const features = [
  {
    icon: ChefHat,
    title: "Recipe Health Analysis",
    description: "Enter a recipe name or ingredients and get instant health scores, macronutrients, and micronutrients. See how healthy a dish is before you cook.",
  },
  {
    icon: Heart,
    title: "Personalized Insights",
    description: "Create profiles like Fitness Seeker or Dietary Restricted with ingredients to avoid or prefer. NutriTwin flags allergens and ingredients you want to skip.",
  },
  {
    icon: Sparkles,
    title: "Smarter Ingredient Swaps",
    description: "Get AI powered swap ideas for healthier alternatives that fit your profile and preferences without losing flavor.",
  },
  {
    icon: BookOpen,
    title: "Save and Track",
    description: "Save analyzed recipes to My Recipes and track your nutrition journey over time.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen">
      {/* Base background */}
      <div className="fixed inset-0 z-0 bg-background" aria-hidden />
      {/* Background image (adjust LANDING_BG_OPACITY above to change transparency) */}
      <div
        className="fixed inset-0 z-0 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
          opacity: LANDING_BG_OPACITY,
        }}
        aria-hidden
      />
      {/* Soft decorative blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
        >
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight mb-4">
            Your Personal Nutrition Assistant
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Know what you eat. Analyze any recipe for health scores, allergens, and ingredient swaps tailored to your diet.
          </p>
          <NavLink to="/profiles">
            <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-full">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </NavLink>
        </motion.section>

        {/* Value prop */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center text-muted-foreground text-lg mb-20 max-w-2xl mx-auto"
        >
          Eat smarter, not harder. NutriTwin helps you understand what is in your food and how to make it healthier.
        </motion.p>

        {/* Features */}
        <section className="mb-24">
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/30 text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Secondary CTA */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 md:p-12 text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl mb-3">Ready to eat better?</h2>
          <p className="text-muted-foreground mb-6">
            Create a profile and start analyzing recipes in under a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <NavLink to="/profiles">
              <Button size="lg" className="w-full sm:w-auto rounded-full">
                Create Profile
              </Button>
            </NavLink>
            <NavLink to="/analysis">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full">
                Analyze a Recipe
              </Button>
            </NavLink>
          </div>
        </motion.section>

        {/* Minimal footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground">
          NutriTwin
        </footer>
      </main>
    </div>
  );
}
