import React, { useState } from 'react';
import { SRI_LANKAN_FOODS } from './data/mockData';

export const NutritionPlanner: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Staple', 'Curry / Sambol', 'Beverage', 'Snack'];

  const filteredFoods = SRI_LANKAN_FOODS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sinhalaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              <span>🥥</span>
              <span>Sri Lankan Heart Nutrition Guide</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
              Best Foods for Your Heart Health
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              Discover which traditional Sri Lankan foods to enjoy more of, and which to enjoy less. Simple, practical swaps to strengthen your heart naturally before surgery.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs shrink-0">
            <span className="font-bold text-amber-900 block mb-1">⭐ Easy Swap Today:</span>
            <div className="flex items-center gap-2 font-medium text-[11px]">
              <span className="text-rose-700 line-through">Sweet Soda / Cola</span>
              <span className="text-slate-400">➔</span>
              <span className="text-emerald-800 font-bold">Thambili (King Coconut)</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search foods (e.g. Thambili, Gotukola, Red Rice)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-400 focus:outline-none font-medium"
          />
          <div className="flex overflow-x-auto space-x-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => {
          const isProtective = food.cardioImpact === 'PROTECTIVE';
          return (
            <div
              key={food.id}
              className={`rounded-3xl border bg-white p-5 transition-all hover:shadow-md hover:scale-[1.01] ${
                isProtective ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{food.name}</h3>
                  <div className="text-xs text-slate-500 font-medium">{food.sinhalaName}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    isProtective
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {isProtective ? 'Heart-Friendly ✓' : 'Limit This'}
                </span>
              </div>

              {/* Nutritional Stats */}
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center text-xs border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Calories</div>
                  <div className="font-bold text-slate-900">{food.calories}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Salt (mg)</div>
                  <div className="font-bold text-slate-900">{food.sodiumMg}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Fat (g)</div>
                  <div className="font-bold text-slate-900">{food.totalFatG}</div>
                </div>
              </div>

              {/* Patient-Friendly Explanation */}
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">{food.reason}</p>

              {food.swapTarget && (
                <div className="mt-3 rounded-2xl bg-emerald-50/70 px-3 py-2 text-xs border border-emerald-100">
                  <span className="text-amber-700 font-bold">Try Instead: </span>
                  <span className="text-emerald-900 font-semibold">{food.swapTarget}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
