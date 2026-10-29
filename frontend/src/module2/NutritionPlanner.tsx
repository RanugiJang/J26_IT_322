import React, { useState, useEffect } from "react";
import { SRI_LANKAN_FOODS } from "./data/clinicalData";
import { SRI_LANKAN_FOOD_SWAPS, type FoodSwapItem } from "./data/sriLankanSwaps";
import type { PatientProfile } from "./types";
import nutritionHeroBg from "./assets/foods/nutrition_hero_bg.jpg";
import gotukolaSambol from "./assets/foods/gotukola_sambol.jpg";

interface NutritionPlannerProps {
  patient?: PatientProfile | null;
  onOpenForm?: () => void;
}

const FOOD_TO_SWAP_ID: Record<string, string> = {
  "coconut sambol": "coconut-sambol",
  "pol sambol": "coconut-sambol",
  "fried fish": "fried-fish",
  "fried chicken": "fried-chicken",
  "sugary drinks": "sugary-drinks",
  "sweet soda": "sugary-drinks",
  "cola": "sugary-drinks",
  "biscuits or sweets": "biscuits-sweets",
  "biscuits": "biscuits-sweets",
  "instant noodles": "instant-noodles",
  "dried fish": "dried-fish",
  "dhal curry": "dhal-curry",
  "rice and curry": "rice-and-curry",
  "salty snack": "biscuits-sweets",
};

const findSwapId = (foodName?: string): string => {
  if (!foodName) return "coconut-sambol";
  const lower = foodName.toLowerCase().trim();
  for (const [key, id] of Object.entries(FOOD_TO_SWAP_ID)) {
    if (lower.includes(key) || key.includes(lower)) return id;
  }
  const match = SRI_LANKAN_FOOD_SWAPS.find(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.id.includes(lower.replace(/\s+/g, "-"))
  );
  return match?.id ?? "coconut-sambol";
};

const FOOD_EMOJIS: Record<string, string> = {
  "Rice and curry": "🍚",
  "Fried fish": "🐟",
  "Fried chicken": "🍗",
  "Coconut sambol": "🥥",
  "Dhal curry": "🫘",
  "Dried fish": "🐠",
  "Sugary drinks": "🥤",
  "Biscuits or sweets": "🍪",
  "Instant noodles": "🍜",
};

export const NutritionPlanner: React.FC<NutritionPlannerProps> = ({ patient, onOpenForm }) => {
  const [activeTab, setActiveTab] = useState<"swap_studio" | "food_library">("swap_studio");
  const patientFoodToReplace = patient?.foodToReplace || (patient?.usualFoods && patient.usualFoods.length > 0 ? patient.usualFoods[0] : "Fried fish");
  const patientUsualFoods = (patient?.usualFoods && patient.usualFoods.length > 0)
    ? patient.usualFoods
    : (patient?.foodToReplace ? [patient.foodToReplace] : (patient?.name ? ["Rice and curry"] : []));

  const hasPatientData = Boolean(
    patient && (
      (patient.name && patient.name.trim().length > 0) ||
      (patient.usualFoods && patient.usualFoods.length > 0) ||
      Boolean(patient.foodToReplace)
    )
  );

  const getInitialSwapId = (): string => findSwapId(patientFoodToReplace);
  const [selectedSwapId, setSelectedSwapId] = useState<string>(getInitialSwapId);
  const [alternativeIndex, setAlternativeIndex] = useState<number>(-1);

  const [triedRecipes, setTriedRecipes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cardioloop_tried_recipes");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [savedRecipes, setSavedRecipes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cardioloop_saved_recipes");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const activeSwap: FoodSwapItem =
    SRI_LANKAN_FOOD_SWAPS.find((s) => s.id === selectedSwapId) || SRI_LANKAN_FOOD_SWAPS[0];

  useEffect(() => {
    const newId = findSwapId(patient?.foodToReplace);
    setSelectedSwapId(newId);
    setAlternativeIndex(-1);
  }, [patient?.foodToReplace]);

  const handleTryRecipe = (recipeTitle: string) => {
    const updated = triedRecipes.includes(recipeTitle)
      ? triedRecipes.filter((r) => r !== recipeTitle)
      : [...triedRecipes, recipeTitle];
    setTriedRecipes(updated);
    try { localStorage.setItem("cardioloop_tried_recipes", JSON.stringify(updated)); } catch {}
    setFeedbackMessage(
      updated.includes(recipeTitle)
        ? `Great job! You tried "${recipeTitle}". Keep it up — every healthy meal helps your heart!`
        : `Removed your record for "${recipeTitle}".`
    );
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  const handleSaveRecipe = (recipeTitle: string) => {
    const updated = savedRecipes.includes(recipeTitle)
      ? savedRecipes.filter((r) => r !== recipeTitle)
      : [...savedRecipes, recipeTitle];
    setSavedRecipes(updated);
    try { localStorage.setItem("cardioloop_saved_recipes", JSON.stringify(updated)); } catch {}
    setFeedbackMessage(
      updated.includes(recipeTitle)
        ? `Saved! You can find "${recipeTitle}" in your recipe book anytime.`
        : `Removed "${recipeTitle}" from your saved recipes.`
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleCycleAlternative = () => {
    if (activeSwap.alternativeSwaps && activeSwap.alternativeSwaps.length > 0) {
      setAlternativeIndex((prev) =>
        prev + 1 >= activeSwap.alternativeSwaps.length ? -1 : prev + 1
      );
    }
  };

  const categories = ["All", "Staple", "Curry / Sambol", "Beverage", "Snack"];
  const filteredFoods = SRI_LANKAN_FOODS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sinhalaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isCurrentRecipeTried = triedRecipes.includes(activeSwap.healthySwap.recipe.title);
  const isCurrentRecipeSaved = savedRecipes.includes(activeSwap.healthySwap.recipe.title);
  const firstName = patient?.name?.split(" ")[0] || "there";

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8 font-sans pb-6 text-slate-900">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION ("Nutrition" Editorial Grand Header)                      */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#2d2216] shadow-2xl shadow-stone-900/30 border border-stone-200/40 min-h-[560px] sm:min-h-[620px] flex flex-col justify-between">
        {/* Background Image with warm rich Sri Lankan culinary table scene */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-[1.02]"
          style={{
            backgroundImage: `url(${nutritionHeroBg})`,
          }}
        >
          {/* Subtle gradient veil for typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-900/30 to-stone-950/80" />
          <div className="absolute inset-0 bg-amber-950/20 backdrop-brightness-[0.92]" />
        </div>

        {/* Top Floating Pill Navigation Bar */}
        <div className="relative z-20 px-5 pt-6 sm:px-10">
          <header className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/20 px-5 py-3 backdrop-blur-md border border-white/30 text-white shadow-lg shadow-black/10">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-amber-950 text-xs font-black shadow-sm">
                🥥
              </span>
              <span className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow-sm">
                CARDIOLOOP NUTRITION
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-[11px] font-semibold tracking-wider uppercase text-white/90">
              <button
                onClick={() => {
                  setActiveTab("swap_studio");
                  scrollToSection("swap-studio-section");
                }}
                className={`transition-colors hover:text-amber-200 ${activeTab === "swap_studio" ? "text-amber-300 font-bold" : ""}`}
              >
                Food Swaps &amp; Recipes
              </button>
              <button
                onClick={() => {
                  setActiveTab("food_library");
                  scrollToSection("food-library-section");
                }}
                className={`transition-colors hover:text-amber-200 ${activeTab === "food_library" ? "text-amber-300 font-bold" : ""}`}
              >
                Sri Lankan Food Library
              </button>
            </nav>

            <div className="flex items-center space-x-2">
              {onOpenForm && (
                <button
                  onClick={onOpenForm}
                  className="rounded-full bg-white px-5 py-2 text-xs font-bold text-stone-900 hover:bg-amber-50 hover:shadow-md transition-all uppercase tracking-wider"
                >
                  Edit Diet
                </button>
              )}
            </div>
          </header>
        </div>

        {/* Giant Hero Title: "Nourish" (mirrors "Recovery", "Movement", "Calmness", "Breathe") */}
        <div className="relative z-10 px-5 pt-6 sm:px-10 text-center select-none pointer-events-none">
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-light tracking-tight text-white/95 leading-none drop-shadow-[0_4px_35px_rgba(0,0,0,0.5)]">
            Nourish
          </h1>
        </div>

        {/* Hero Middle Content: Left and Right Copy */}
        <div className="relative z-20 px-6 sm:px-12 pb-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-end text-white">
          {/* Left Kicker & Personalized Subhead */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-amber-200/95 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Cardio-Protective Sri Lankan Diet · {firstName}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
              Wholesome nourishment <br />
              <span className="font-light italic text-amber-100">for coronary resilience</span>
            </h2>
            <p className="max-w-md text-xs sm:text-sm text-stone-200 leading-relaxed font-normal">
              Traditional Lankan herbs, red rice polyphenols, and electrolyte-rich king coconut gently lower blood pressure, reduce vascular plaque, and fuel surgical recovery.
            </p>
          </div>

          {/* Right Copy & Primary CTAs */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end">
            <div className="rounded-2xl bg-black/40 border border-white/20 p-4 max-w-md backdrop-blur-md text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span>Target to Replace: {patientFoodToReplace}</span>
                <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] text-emerald-200 border border-emerald-400/30">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-stone-200 leading-relaxed">
                Swapping heavy fried foods and table salt with fresh Gotukola and potassium-rich alternatives relieves arterial strain.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => {
                  setActiveTab("swap_studio");
                  scrollToSection("swap-studio-section");
                }}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-stone-900 hover:bg-amber-100 transition-all shadow-lg shadow-black/20 flex items-center space-x-1.5"
              >
                <span>Explore Food Swaps</span>
                <span>➔</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("food_library");
                  scrollToSection("food-library-section");
                }}
                className="rounded-full px-4 py-2.5 text-xs font-bold transition-all flex items-center space-x-2 backdrop-blur-md border bg-black/35 hover:bg-black/55 text-white border-white/20"
              >
                <span>📖 Food Guide ({SRI_LANKAN_FOODS.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Banner */}
        <div className="relative z-20 border-t border-white/20 bg-black/30 backdrop-blur-md px-6 py-3.5 sm:px-12">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-medium tracking-wider uppercase text-stone-200/90 gap-3">
            <span>Authentic Sri Lankan Nutrition</span>
            <span className="hidden sm:inline">•</span>
            <span>Sodium &amp; Saturated Fat Reduction</span>
            <span className="hidden sm:inline">•</span>
            <span>Endothelial Plaque Protection</span>
            <span className="hidden sm:inline">•</span>
            <span>Natural Electrolyte Balance</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. 3-COLUMN EDITORIAL PHOTOS & CULINARY INSIGHTS                          */}
      {/* ========================================================================= */}
      <section className="rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-stone-200/80 space-y-8">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900"></span>
            <span>Cardiovascular Culinary Principles</span>
          </div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            How traditional Sri Lankan foods strengthen your heart
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Photo Card: Fresh Gotukola Sambol */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={gotukolaSambol}
              alt="Fresh authentic Sri Lankan Gotukola Sambol in traditional clay bowl"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 left-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60">
              <div className="text-xs font-black text-emerald-800">Gotukola Sambol</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Microvascular Booster
              </div>
            </div>
            {/* Bottom Caption Pill */}
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-stone-950/75 backdrop-blur-md p-3 text-white text-[11px] leading-relaxed">
              Gotukola (Centella asiatica) stimulates collagen synthesis in blood vessels and improves microcirculatory flow prior to surgical interventions.
            </div>
          </div>

          {/* Center Column: Principles & Quick Actions */}
          <div className="md:col-span-4 space-y-5 px-2">
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              <strong className="text-stone-900 font-semibold">CardioLoop Heart Nutrition</strong> replaces inflammatory cooking habits with culturally familiar, delicious Sri Lankan superfoods. You don’t need to abandon your home tastes — just balance the cooking techniques.
            </p>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              By substituting deep-frying with steaming, reducing hidden table salts, and enjoying thambili instead of sweetened sodas, your blood vessels relax and arterial elasticity improves rapidly.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setActiveTab("swap_studio");
                  scrollToSection("swap-studio-section");
                }}
                className="rounded-full bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>View My Swaps</span>
                <span>➔</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("food_library");
                  scrollToSection("food-library-section");
                }}
                className="rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
              >
                <span>Browse Library</span>
              </button>
            </div>
          </div>

          {/* Right Photo Card: Fresh Tropical Fruits & Vegetables */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={nutritionHeroBg}
              alt="Sri Lankan farm-fresh papaya, okra, red rice, and spices"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60 text-right">
              <div className="text-xs font-black text-amber-700">Potassium &amp; Fiber</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Natural Blood Pressure Support
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="absolute bottom-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-xl border border-white/80">
              <div className="text-lg font-black text-emerald-700">40% Less Salt</div>
              <div className="text-[10px] font-semibold text-stone-600">
                With Herb &amp; Lime Seasoning
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ Feedback Banner ─ */}
      {feedbackMessage && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-lg">✨</span>
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-3">✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          VIEW 1 — MY FOOD SWAPS
          ══════════════════════════════════════════ */}
      {activeTab === "swap_studio" && (
        <div id="swap-studio-section" className="space-y-6 scroll-mt-6">

          {/* ─ Patient Summary Banner (auto-generated from health form) ─ */}
          {hasPatientData ? (
            <div className="rounded-[2.5rem] border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👋</span>
                  <h3 className="text-base font-bold text-amber-950">
                    Hi {firstName}, here is your personalized eating plan
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
                    Based on your health form
                  </span>
                  {onOpenForm && (
                    <button
                      onClick={onOpenForm}
                      className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-white border border-amber-200 px-3 py-1 rounded-xl hover:bg-amber-50 transition-colors shadow-xs"
                    >
                      ✏️ Edit Diet Details
                    </button>
                  )}
                </div>
              </div>

              {/* What they said they eat — read-only tags */}
              {patientUsualFoods.length > 0 && (
                <div>
                  <p className="text-xs text-amber-900 font-semibold mb-2.5">Foods you told us you usually eat:</p>
                  <div className="flex flex-wrap gap-2">
                    {patientUsualFoods.map((food) => {
                      const emoji = FOOD_EMOJIS[food] ?? "🍽️";
                      const isTarget = food.toLowerCase() === (patientFoodToReplace || "").toLowerCase();
                      return (
                        <span
                          key={food}
                          className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-1.5 text-xs font-semibold ${
                            isTarget
                              ? "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-300 shadow-xs"
                              : "border-amber-200 bg-white text-amber-900"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{food}</span>
                          {isTarget && <span className="text-rose-600 font-bold">← replacing this</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Patient Dietary Habits & Assessment Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="rounded-2xl bg-white/95 border border-amber-200/80 p-3.5 shadow-xs">
                  <span className="text-[10px] font-semibold text-amber-700 block uppercase tracking-wider">Target Food</span>
                  <span className="font-bold text-amber-950 truncate block mt-1">{patientFoodToReplace}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{patient?.foodFrequency || "3–5 times a week"}</span>
                </div>
                <div className="rounded-2xl bg-white/95 border border-amber-200/80 p-3.5 shadow-xs">
                  <span className="text-[10px] font-semibold text-amber-700 block uppercase tracking-wider">Portion &amp; Prep</span>
                  <span className="font-bold text-amber-950 truncate block mt-1">{patient?.portionSize || "Medium"} portion</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{patient?.preparationMethod || "Fried"} prep</span>
                </div>
                <div className="rounded-2xl bg-white/95 border border-amber-200/80 p-3.5 shadow-xs">
                  <span className="text-[10px] font-semibold text-amber-700 block uppercase tracking-wider">Focus Goals</span>
                  <span className="font-bold text-amber-950 truncate block mt-1">
                    {patient?.dietImprovements && patient.dietImprovements.length > 0
                      ? patient.dietImprovements.join(", ")
                      : "Reduce salt & saturated fats"}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Prehab target</span>
                </div>
                <div className="rounded-2xl bg-white/95 border border-amber-200/80 p-3.5 shadow-xs">
                  <span className="text-[10px] font-semibold text-amber-700 block uppercase tracking-wider">Budget &amp; Allergies</span>
                  <span className="font-bold text-amber-950 truncate block mt-1">{patient?.foodBudget || "Affordable ingredients"}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {patient?.foodAllergies && patient.foodAllergies.trim().length > 0 && patient.foodAllergies.toLowerCase() !== "none"
                      ? `Allergy: ${patient.foodAllergies}`
                      : "No allergies reported"}
                  </span>
                </div>
              </div>

              {patientFoodToReplace && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                  <span>✅</span>
                  <span>
                    Your swap plan is ready below — replacing <strong>{patientFoodToReplace}</strong> with a heart-healthy option.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* No patient data yet */
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 text-center space-y-3 shadow-sm">
              <span className="text-4xl block">📋</span>
              <h3 className="text-base font-bold text-slate-700">No patient details found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please complete the <strong>Patient Details Form</strong> first. Your personalized eating plan, food swaps, and recipes will appear here automatically.
              </p>
              {onOpenForm && (
                <button
                  onClick={onOpenForm}
                  className="inline-flex items-center space-x-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <span>📋</span>
                  <span>Open Patient Details Form</span>
                </button>
              )}
            </div>
          )}

          {/* ─ Food Check + Healthy Swap ─ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left — Your current food */}
            <div className="lg:col-span-5 rounded-[2rem] border border-rose-200 bg-gradient-to-br from-rose-50/60 to-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-800">
                    <span>⚠️</span><span>Your current food</span>
                  </span>
                  <span className="text-[11px] font-semibold text-rose-600 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200">
                    Worth replacing
                  </span>
                </div>
                <div className="flex items-start gap-4 pt-1">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0 border border-rose-200 shadow-sm">
                    <img
                      src={activeSwap.imageUrl} alt={activeSwap.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80";
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">{activeSwap.name}</h4>
                    <span className="text-xs text-rose-700 font-semibold block mt-0.5">{activeSwap.sinhalaName}</span>
                    <span className="inline-block mt-2 rounded-lg bg-rose-200/60 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                      {activeSwap.clinicalConcern}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">{activeSwap.concernDetails}</p>
              </div>
              <div className="pt-3 border-t border-rose-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Per serving:</span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  {[
                    { label: "Calories", val: String(activeSwap.nutrients.calories), color: "rose-100", text: "slate-800", labelColor: "slate-400" },
                    { label: "Salt", val: `${activeSwap.nutrients.sodiumMg}mg`, color: "rose-200", text: "rose-700", labelColor: "rose-700" },
                    { label: "Fat", val: `${activeSwap.nutrients.fatG}g`, color: "rose-100", text: "slate-800", labelColor: "slate-400" },
                    { label: "Sugar", val: `${activeSwap.nutrients.sugarG}g`, color: "rose-100", text: "slate-800", labelColor: "slate-400" },
                  ].map(({ label, val, color, text, labelColor }) => (
                    <div key={label} className={`rounded-xl bg-white p-2 border border-${color}`}>
                      <span className={`text-[10px] text-${labelColor} block font-sans font-bold`}>{label}</span>
                      <strong className={`text-${text}`}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Try this instead */}
            <div className="lg:col-span-7 rounded-[2rem] border border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-[11px] font-bold text-emerald-900 border border-emerald-200">
                    <span>✨</span><span>Try this instead!</span>
                  </span>
                  <button
                    onClick={handleCycleAlternative}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 bg-white border border-emerald-200 rounded-xl px-3 py-1 hover:bg-emerald-50 transition-all shadow-xs"
                  >
                    <span>🔄</span><span>Show another option</span>
                  </button>
                </div>

                {alternativeIndex === -1 ? (
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-1">
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden shrink-0 border-2 border-emerald-300 shadow-md">
                      <img
                        src={activeSwap.healthySwap.imageUrl} alt={activeSwap.healthySwap.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                      <span className="absolute bottom-1 left-1 bg-emerald-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Heart-Friendly ❤️
                      </span>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xl font-black text-emerald-950 leading-tight">{activeSwap.healthySwap.name}</h4>
                      <span className="text-xs text-emerald-800 font-semibold block">
                        {activeSwap.healthySwap.sinhalaName} • Traditional Sri Lankan
                      </span>
                      <div className="inline-block rounded-lg bg-emerald-100/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900 border border-emerald-200">
                        ✓ {activeSwap.healthySwap.clinicalBenefit}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pt-1">{activeSwap.healthySwap.benefitDetails}</p>
                    </div>
                  </div>
                ) : (() => {
                  const alt = activeSwap.alternativeSwaps[alternativeIndex];
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-1">
                      <div className="relative h-28 w-28 rounded-2xl overflow-hidden shrink-0 border-2 border-teal-300 shadow-md">
                        <img
                          src={alt.imageUrl} alt={alt.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80";
                          }}
                        />
                        <span className="absolute bottom-1 left-1 bg-teal-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Option {alternativeIndex + 1}
                        </span>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-xl font-black text-teal-950 leading-tight">{alt.name}</h4>
                        <span className="text-xs text-teal-800 font-semibold block">{alt.sinhalaName}</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{alt.benefit}</p>
                        <div className="rounded-xl bg-white p-2.5 border border-teal-200 text-xs text-teal-900">
                          <strong>Quick tip:</strong> {alt.recipeSummary}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-emerald-200">
                <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold mb-2">
                  <span>What you save by making this swap:</span>
                  <span className="text-emerald-700 font-mono">
                    {activeSwap.nutrients.sodiumMg > activeSwap.healthySwap.nutrients.sodiumMg &&
                      `${Math.round(((activeSwap.nutrients.sodiumMg - activeSwap.healthySwap.nutrients.sodiumMg) / activeSwap.nutrients.sodiumMg) * 100)}% less salt`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  {[
                    { label: "Calories", val: String(activeSwap.healthySwap.nutrients.calories), diff: activeSwap.nutrients.calories - activeSwap.healthySwap.nutrients.calories, unit: "kcal" },
                    { label: "Salt", val: `${activeSwap.healthySwap.nutrients.sodiumMg}mg`, diff: activeSwap.nutrients.sodiumMg - activeSwap.healthySwap.nutrients.sodiumMg, unit: "mg" },
                    { label: "Fat", val: `${activeSwap.healthySwap.nutrients.fatG}g`, diff: activeSwap.nutrients.fatG - activeSwap.healthySwap.nutrients.fatG, unit: "g" },
                    { label: "Sugar", val: `${activeSwap.healthySwap.nutrients.sugarG}g`, diff: activeSwap.nutrients.sugarG - activeSwap.healthySwap.nutrients.sugarG, unit: "g" },
                  ].map(({ label, val, diff, unit }) => (
                    <div key={label} className="rounded-xl bg-white p-2 border border-emerald-200 shadow-xs">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold">{label}</span>
                      <strong className="text-emerald-900">{val}</strong>
                      {diff > 0 && (
                        <span className="text-[9px] text-emerald-600 block font-sans font-bold mt-0.5">
                          -{diff}{unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─ Recipe Detail Card ─ */}
          <div className="rounded-[2.5rem] border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Recommended Recipe</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{activeSwap.healthySwap.recipe.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeSwap.healthySwap.recipe.cardioClinicalNote || 'Heart-healthy preparation'}</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 shrink-0">
                <span className="flex items-center space-x-1">
                  <span>⏱️</span><span>{activeSwap.healthySwap.recipe.prepTime || '10 min'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <span>👥</span><span>{activeSwap.healthySwap.recipe.servings || '2 portions'}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>🥗</span><span>Ingredients:</span>
                </h4>
                <ul className="space-y-2 text-xs">
                  {(activeSwap.healthySwap.recipe.ingredients || []).map((ing, i) => (
                    <li key={i} className="flex items-start space-x-2 text-slate-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>👩‍🍳</span><span>How to make it:</span>
                </h4>
                <ol className="space-y-2 text-xs">
                  {((activeSwap.healthySwap.recipe as any).instructions || (activeSwap.healthySwap.recipe as any).steps || []).map((step: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2.5 text-slate-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Did you try this? Action Bar */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Tried this recipe?</span>
                <span className="text-[11px] text-slate-500">Record your progress to help your care team.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleTryRecipe(activeSwap.healthySwap.recipe.title)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                    isCurrentRecipeTried
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  {isCurrentRecipeTried ? "✓ Completed" : "Mark as Tried"}
                </button>
                <button
                  onClick={() => handleSaveRecipe(activeSwap.healthySwap.recipe.title)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all border ${
                    isCurrentRecipeSaved
                      ? "bg-amber-400 text-stone-900 border-amber-500"
                      : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {isCurrentRecipeSaved ? "⭐ Saved" : "Save Recipe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          VIEW 2 — FOOD GUIDE
          ══════════════════════════════════════════ */}
      {activeTab === "food_library" && (
        <div id="food-library-section" className="space-y-6 scroll-mt-6">
          <div className="rounded-[2.5rem] border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-stone-100">
              <div>
                <div className="inline-flex items-center space-x-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                  <span>🥥</span><span>Sri Lankan Food Guide</span>
                </div>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                  Foods that are good for your heart
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Here are traditional Sri Lankan foods to enjoy more of, and ones to eat less of. Small changes make a big difference!
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs shrink-0">
                <span className="font-bold text-amber-900 block mb-1">⭐ Easy swap today:</span>
                <div className="flex items-center gap-2 font-medium text-[11px]">
                  <span className="text-rose-700 line-through">{patient?.foodToReplace || "Sweet Soda / Cola"}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-emerald-800 font-bold">Thambili (King Coconut)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search foods (e.g. Thambili, Gotukola, Red Rice)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-400 focus:outline-none font-medium"
              />
              <div className="flex overflow-x-auto space-x-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map((food) => {
              const isProtective = food.cardioImpact === "PROTECTIVE";
              return (
                <div
                  key={food.id}
                  className={`rounded-3xl border bg-white p-5 transition-all hover:shadow-md hover:scale-[1.01] flex flex-col justify-between ${
                    isProtective ? "border-emerald-200" : "border-rose-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{food.name}</h4>
                        <div className="text-xs text-slate-500 font-medium">{food.sinhalaName}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        isProtective
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {isProtective ? "Great choice ✓" : "Eat less ✕"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{food.reason}</p>
                    {food.swapTarget && (
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-200">
                        <strong className="block text-[11px] text-emerald-800 font-bold mb-0.5">Try this instead:</strong>
                        <span>{food.swapTarget}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{food.calories} kcal</span>
                    <span>•</span>
                    <span>{food.sodiumMg}mg salt</span>
                    <span>•</span>
                    <span>{food.totalFatG}g fat</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
