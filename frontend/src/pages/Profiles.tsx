import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink } from "@/components/NavLink";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dumbbell, Shield, ArrowRight, ChevronRight, AlertCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { recipeApi, ApiError } from "@/services/api";
import { toast } from "sonner";
import { DietaryCustomization } from "@/components/DietaryCustomization";
import {
  getCustomArchetypes,
  addCustomArchetype,
  removeCustomArchetype,
} from "@/store/archetypeStore";
import type { UserProfile } from "@/types/api";

const archetypes = [
  {
    id: "fitness",
    name: "Fitness Seeker",
    icon: Dumbbell,
    colorSelected: "bg-pink-200",
    iconColorSelected: "text-pink-700",
    borderColorSelected: "border-pink-400",
    colorUnselected: "bg-slate-200",
    iconColorUnselected: "text-slate-600",
    borderColorUnselected: "border-slate-300",
    description: "Avoids added sugars; focuses on protein and recovery ingredients.",
    avoid_ingredients: ["refined sugar", "added sugar", "white sugar", "high fructose corn syrup"],
    allergens: [] as string[],
    features: ["Avoiding refined sugar", "Avoiding added sugar", "Avoiding white sugar", "Avoiding high fructose corn syrup"],
  },
  {
    id: "dietary",
    name: "Dietary-Restricted",
    icon: Shield,
    colorSelected: "bg-pink-200",
    iconColorSelected: "text-pink-700",
    borderColorSelected: "border-pink-400",
    colorUnselected: "bg-slate-200",
    iconColorUnselected: "text-slate-600",
    borderColorUnselected: "border-slate-300",
    description: "Common allergen ingredients to avoid; customize as needed.",
    avoid_ingredients: ["gluten", "dairy", "peanuts", "shellfish", "eggs"],
    allergens: ["wheat", "milk", "peanuts", "shellfish", "eggs"],
    features: ["Avoiding gluten", "Avoiding dairy", "Avoiding peanuts", "Avoiding shellfish", "Avoiding eggs"],
  },
];

export default function Profiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedArchetype, setSelectedArchetype] = useState<string>("fitness");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editArchetype, setEditArchetype] = useState("fitness");
  const [editAllergens, setEditAllergens] = useState<string[]>([]);
  const [editAvoidIngredients, setEditAvoidIngredients] = useState<string[]>([]);
  const [createAllergens, setCreateAllergens] = useState<string[]>([]);
  const [createAvoidIngredients, setCreateAvoidIngredients] = useState<string[]>([]);
  const [customArchetypes, setCustomArchetypes] = useState<string[]>([]);
  const [newCustomArchetypeName, setNewCustomArchetypeName] = useState("");
  const [editNewCustomArchetypeName, setEditNewCustomArchetypeName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const selected = archetypes.find((a) => a.id === selectedArchetype);
  const isFormComplete = name.trim() !== "" && age.trim() !== "";

  // Apply preset avoid_ingredients and allergens when archetype changes (create flow)
  useEffect(() => {
    const arch = archetypes.find((a) => a.id === selectedArchetype);
    if (arch && "avoid_ingredients" in arch && "allergens" in arch) {
      setCreateAvoidIngredients([...arch.avoid_ingredients]);
      setCreateAllergens([...arch.allergens]);
    }
  }, [selectedArchetype]);

  // Load custom archetypes on mount
  useEffect(() => {
    setCustomArchetypes(getCustomArchetypes());
  }, []);

  const refreshCustomArchetypes = () => setCustomArchetypes(getCustomArchetypes());

  const handleSaveCustomArchetype = (source: "create" | "edit") => {
    const name = source === "create" ? newCustomArchetypeName : editNewCustomArchetypeName;
    const trimmed = name.trim();
    if (!trimmed) return;
    addCustomArchetype(trimmed);
    if (source === "create") {
      setSelectedArchetype(trimmed);
      setNewCustomArchetypeName("");
    } else {
      setEditArchetype(trimmed);
      setEditNewCustomArchetypeName("");
    }
    refreshCustomArchetypes();
    toast.success(`Saved "${trimmed}" as custom archetype`);
  };

  // Load existing profiles on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await recipeApi.getProfiles();
        setProfiles(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load profiles");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Handle form submission to create new profile
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;

    try {
      setIsSaving(true);
      setError(null);

      const ageNum = parseInt(age, 10);
      const ageValue = Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120 ? undefined : ageNum;

      const newProfile = await recipeApi.createProfile({
        name: name.trim(),
        age: ageValue,
        archetype: selectedArchetype,
        allergens: createAllergens,
        avoid_ingredients: createAvoidIngredients,
      });

      setProfiles([...profiles, newProfile]);
      toast.success("Profile was created");

      // Reset form
      const fitnessArch = archetypes.find((a) => a.id === "fitness");
      setName("");
      setAge("");
      setSelectedArchetype("fitness");
      setCreateAvoidIngredients(fitnessArch && "avoid_ingredients" in fitnessArch ? [...fitnessArch.avoid_ingredients] : []);
      setCreateAllergens(fitnessArch && "allergens" in fitnessArch ? [...fitnessArch.allergens] : []);
      setShowCreateForm(false);

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      setIsDeleting(true);
      await recipeApi.deleteProfile(profileToDelete.id);
      setProfiles(profiles.filter((p) => p.id !== profileToDelete.id));
      setProfileToDelete(null);
      toast.success("Profile was deleted");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to delete profile");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (profile: UserProfile) => {
    setProfileToEdit(profile);
    setEditName(profile.name);
    setEditAge(profile.age != null ? String(profile.age) : "");
    setEditArchetype(profile.archetype || "fitness");
    setEditAllergens(profile.allergens ?? []);
    setEditAvoidIngredients(profile.avoid_ingredients ?? []);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileToEdit) return;
    const ageNum = parseInt(editAge, 10);
    const ageValue = Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120 ? undefined : ageNum;
    try {
      setIsUpdating(true);
      setError(null);
      const updated = await recipeApi.updateProfile(profileToEdit.id, {
        name: editName.trim(),
        age: ageValue,
        archetype: editArchetype,
        allergens: editAllergens,
        avoid_ingredients: editAvoidIngredients,
      });
      setProfiles(profiles.map((p) => (p.id === profileToEdit.id ? updated : p)));
      setProfileToEdit(null);
      toast.success("Profile was updated");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-5xl tracking-tight mb-3">
            Your Profiles
          </h1>
          <p className="text-muted-foreground text-xl">
            Manage your health preferences and personalization settings
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Existing Profiles Section */}
        {!isLoading && profiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl tracking-tight">Your Profiles</h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="h-4 w-4" />
                {showCreateForm ? "Cancel" : "Add Profile"}
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{profile.name}</CardTitle>
                        <CardDescription>
                          {profile.age != null && !Number.isNaN(Number(profile.age))
                            ? `Age: ${Number(profile.age)}`
                            : "Age not specified"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(profile)}
                          aria-label="Edit profile"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setProfileToDelete(profile)}
                          aria-label="Delete profile"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Badge variant="secondary">
                        {archetypes.find((a) => a.id === profile.archetype)?.name ?? profile.archetype}
                      </Badge>
                    </div>
                    {(profile.allergens.length > 0 || (profile.avoid_ingredients?.length ?? 0) > 0) && (
                      <div>
                        {profile.allergens.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Allergens</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.allergens.map((allergen) => (
                                <Badge key={allergen} variant="outline" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(profile.avoid_ingredients?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Avoids</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.avoid_ingredients.map((item) => (
                                <Badge key={item} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Create/Edit Profile Form */}
        {(showCreateForm || profiles.length === 0) && (
          <>
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">
                    {profiles.length > 0 ? "Create New Profile" : "Personal Information"}
                  </CardTitle>
                  <CardDescription>Tell us a bit about yourself</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Enter your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Archetype Selection Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <h2 className="font-display text-2xl tracking-tight mb-2">
                Select Your Archetype
              </h2>
              <p className="text-muted-foreground">
                Choose the profile that best matches your health and nutrition goals
              </p>
            </motion.div>

            {/* Archetype Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {archetypes.map((archetype, index) => (
                <motion.div
                  key={archetype.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedArchetype === archetype.id
                        ? `${archetype.borderColorSelected} shadow-md bg-pink-50/50`
                        : `${archetype.borderColorUnselected} bg-slate-50/50 hover:border-slate-400`
                    }`}
                    onClick={() => setSelectedArchetype(archetype.id)}
                  >
                    <CardContent className="pt-12 pb-8 flex flex-col items-center">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                        selectedArchetype === archetype.id ? archetype.colorSelected : archetype.colorUnselected
                      }`}>
                        <archetype.icon className={`h-8 w-8 ${
                          selectedArchetype === archetype.id ? archetype.iconColorSelected : archetype.iconColorUnselected
                        }`} />
                      </div>
                      <h3 className="font-display text-xl text-center">
                        {archetype.name}
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Saved custom archetypes */}
            {customArchetypes.length > 0 && (
              <div className="mb-4">
                <Label className="text-muted-foreground">Your saved archetypes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customArchetypes.map((customName) => (
                    <Badge
                      key={customName}
                      variant={selectedArchetype === customName ? "default" : "outline"}
                      className={`cursor-pointer text-sm py-2 px-4 ${
                        selectedArchetype === customName ? "bg-pink-500 hover:bg-pink-600" : ""
                      }`}
                      onClick={() => setSelectedArchetype(customName)}
                    >
                      {customName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom archetype */}
            <div className="flex gap-2 mb-8">
              <Input
                placeholder="Save custom archetype (name only)"
                value={newCustomArchetypeName}
                onChange={(e) => setNewCustomArchetypeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSaveCustomArchetype("create"))}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSaveCustomArchetype("create")}
                disabled={!newCustomArchetypeName.trim()}
              >
                Save & select
              </Button>
            </div>

            {/* Selected Archetype Details */}
            {selected && (
              <motion.div
                key={selectedArchetype}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-muted/50 mb-8">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-muted-foreground text-lg mb-4">
                      {selected.description}
                    </p>
                    <div className="flex flex-wrap gap-6">
                      {selected.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Customize for your health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Customize for your health</CardTitle>
                  <CardDescription>
                    Add dietary presets, allergies, or ingredients to avoid (e.g. diabetic, gluten-free, allergic to peanuts)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DietaryCustomization
                    allergens={createAllergens}
                    avoidIngredients={createAvoidIngredients}
                    onChange={(a, av) => {
                      setCreateAllergens(a);
                      setCreateAvoidIngredients(av);
                    }}
                    disabled={isSaving}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Save Profile Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="font-display text-xl mb-2">Ready to analyze recipes?</h3>
                      <p className="text-muted-foreground">
                        {isFormComplete
                          ? "Now that you've set up your profile, start analyzing recipes with personalized health insights"
                          : "Please fill in your name and age to continue"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="lg"
                        className="gap-2"
                        disabled={!isFormComplete || isSaving}
                        onClick={handleCreateProfile}
                      >
                        {isSaving ? "Saving..." : "Save Profile"}
                      </Button>
                      {isFormComplete && (
                        <NavLink to="/analysis">
                          <Button size="lg" variant="outline" className="gap-2">
                            Next: Analyze Recipes
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </NavLink>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading profiles...
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete profile?</AlertDialogTitle>
              <AlertDialogDescription>
                This profile will be permanently deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteProfile}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit profile dialog */}
        <Dialog open={!!profileToEdit} onOpenChange={(open) => !open && setProfileToEdit(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Update your profile details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">Age *</Label>
                <Input
                  id="edit-age"
                  type="number"
                  min={1}
                  max={120}
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
              <div className="space-y-2">
                <Label>Archetype</Label>
                <div className="grid grid-cols-2 gap-2">
                  {archetypes.map((arch) => {
                    const IconComponent = arch.icon;
                    return (
                      <Card
                        key={arch.id}
                        className={`cursor-pointer transition-all border-2 ${
                          editArchetype === arch.id
                            ? "border-pink-400 bg-pink-50/50"
                            : "border-slate-300 hover:border-slate-400"
                        }`}
                        onClick={() => {
                          setEditArchetype(arch.id);
                          if ("avoid_ingredients" in arch && "allergens" in arch) {
                            setEditAvoidIngredients([...arch.avoid_ingredients]);
                            setEditAllergens([...arch.allergens]);
                          }
                        }}
                      >
                        <CardContent className="pt-4 pb-4 flex flex-col items-center">
                          <IconComponent
                            className={`h-6 w-6 ${
                              editArchetype === arch.id ? "text-pink-700" : "text-slate-600"
                            }`}
                          />
                          <span className="text-xs mt-1 text-center">{arch.name}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {(() => {
                  const presetIds = new Set(archetypes.map((a) => a.id));
                  const isEditCustom = editArchetype && !presetIds.has(editArchetype);
                  const displayCustoms = isEditCustom && !customArchetypes.includes(editArchetype)
                    ? [editArchetype, ...customArchetypes]
                    : customArchetypes;
                  return displayCustoms.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Saved custom</p>
                    <div className="flex flex-wrap gap-1">
                      {displayCustoms.map((customName) => (
                        <Badge
                          key={customName}
                          variant={editArchetype === customName ? "default" : "outline"}
                          className={`cursor-pointer text-xs ${
                            editArchetype === customName ? "bg-pink-500" : ""
                          }`}
                          onClick={() => setEditArchetype(customName)}
                        >
                          {customName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  ) : null;
                })()}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Save custom archetype"
                    value={editNewCustomArchetypeName}
                    onChange={(e) => setEditNewCustomArchetypeName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleSaveCustomArchetype("edit"))
                    }
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveCustomArchetype("edit")}
                    disabled={!editNewCustomArchetypeName.trim()}
                  >
                    Save & select
                  </Button>
                </div>
                {/* Selected archetype details - visible when preset is selected */}
                {(() => {
                  const editSelected = archetypes.find((a) => a.id === editArchetype);
                  return editSelected ? (
                    <div className="mt-4 rounded-lg bg-muted/50 p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">{editSelected.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {editSelected.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium"
                          >
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="border-t pt-4 mt-4">
                <DietaryCustomization
                  allergens={editAllergens}
                  avoidIngredients={editAvoidIngredients}
                  onChange={(a, av) => {
                    setEditAllergens(a);
                    setEditAvoidIngredients(av);
                  }}
                  disabled={isUpdating}
                  compact
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProfileToEdit(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating || !editName.trim()}>
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
