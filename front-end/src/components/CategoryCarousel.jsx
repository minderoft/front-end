import React from 'react';

const CategoryCarousel = ({ categories, onCategoryClick }) => (
  <section className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">
          Explorez notre Écosystème
        </span>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
          Navigation visuelle par catégorie
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full sm:gap-6 md:gap-6 lg:gap-8 sm:grid-cols-4" aria-label="Navigation par catégorie">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-label={`Naviguer vers ${category.name}`}
            className={`ecosystem-card ${category.theme} rounded-xl overflow-hidden relative group`}
            onClick={() => onCategoryClick(category.id)}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.72)), url('${category.image}')`,
              minHeight: '220px',
            }}
          >
            <div className="ecosystem-card-overlay" />
            <div className="ecosystem-card-inner h-full w-full flex flex-col justify-between p-4 sm:p-6">
              <div className="ecosystem-card-icon-ring bg-black/40 backdrop-blur-sm"> 
                <span className="ecosystem-icon">{category.icon}</span>
              </div>
              <div className="ecosystem-card-footer">
                <h3 className="text-lg sm:text-xl font-semibold text-white">{category.name}</h3>
                <p className="text-xs sm:text-sm text-white/85">{category.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default CategoryCarousel;
