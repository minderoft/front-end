import React from 'react';

const CategoryCarousel = ({ categories, onCategoryClick }) => (
  <section className="categories-section">
    <div className="section-head">
      <span className="section-label">Explorez notre Écosystème</span>
      <h2>Navigation visuelle par catégorie</h2>
    </div>

    <div className="ecosystem-grid" aria-label="Navigation par catégorie">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-label={`Naviguer vers ${category.name}`}
          className={`ecosystem-card ${category.theme}`}
          onClick={() => onCategoryClick(category.id)}
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.72)), url('${category.image}')`,
          }}
        >
          <div className="ecosystem-card-overlay" />
          <div className="ecosystem-card-inner">
            <div className="ecosystem-card-icon-ring">
              <span className="ecosystem-icon">{category.icon}</span>
            </div>
            <div className="ecosystem-card-footer">
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </section>
);

export default CategoryCarousel;
