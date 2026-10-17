import React, { useState } from 'react';
import { SRI_LANKAN_FOOD_DB } from '../data/mockData';
import { SriLankanFoodItem } from '../types';

export const SriLankanDietPlanner: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeSwap, setActiveSwap] = useState<SriLankanFoodItem | null>(null);

  const categories = ['All', 'Staple', 'Curry / Sambol', 'Beverage', 'Snack'];

  const filteredFoods = SRI_LANKAN_FOOD_DB.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sinhalaName.includes(searchQuery);
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
              <span>🥥 Cultural Nutrition AI</span>
              <span>•</span>
              <span>243 Sri Lankan Foods</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
              Sri Lankan Cardioprotective Diet & Ingredient Swaps
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Tailored for high-risk CVD patients awaiting surgery: eliminates acute trans-fats and excessive sodium 
              while incorporating traditional cardioprotective staples (Thambili, Malu Ambul Thiyal, Gotukola).
            </p>
          </div>

          {/* Quick Swap Highlight Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs max-w-xs">
            <span className="font-bold text-amber-300">Nimal's Top Diet Swap:</span>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span className="text-red-400 line-through">Cola (39g Sugar)</span>
              <span className="text-slate-400">➔</span>
              <span className="text-emerald-400 font-bold">King Coconut (Thambili)</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search food by English or Sinhala name (e.g. Thambili, Gotukola, Fish)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex overflow-x-auto space-x-1.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Cardioprotective Swaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => {
          const isProtective = food.cardioImpact === 'PROTECTIVE';

          return (
            <div
              key={food.id}
              className={`rounded-2xl border p-5 transition-all ${
                isProtective
                  ? 'border-emerald-500/30 bg-slate-900/90 hover:border-emerald-500/60'
                  : 'border-red-500/30 bg-slate-950/90 hover:border-red-500/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isProtective
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {food.cardioImpact}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-white">{food.name}</h3>
                  <div className="font-sinhala text-xs text-amber-400/90">{food.sinhalaName}</div>
                </div>

                <span className="rounded-lg bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-300">
                  {food.calories} kcal
                </span>
              </div>

              {/* Nutritional Breakdown */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-950 p-2.5 text-center font-mono text-[11px] border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500">Sodium</div>
                  <div className={`font-bold ${food.sodiumMg > 500 ? 'text-red-400' : 'text-slate-200'}`}>
                    {food.sodiumMg} mg
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Total Fat</div>
                  <div className="text-slate-200 font-bold">{food.totalFatG} g</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Trans Fat</div>
                  <div className={`font-bold ${food.transFatG > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {food.transFatG} g
                  </div>
                </div>
              </div>

              {/* Clinical Impact Reasoning */}
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                {food.reason}
              </p>

              {/* Swap Target if restricted */}
              {food.swapTarget && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs">
                  <span className="font-semibold text-amber-300">Recommended Heart Swap: </span>
                  <span className="text-slate-200">{food.swapTarget}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
