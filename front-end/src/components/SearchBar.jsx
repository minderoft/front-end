import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import Button from './Button';
import './SearchBar.css';

const SearchBar = ({ onSearch = () => {}, categories = [] }) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ keyword, location, category });
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-bar-container">
        {/* Catégories */}
        <div className="search-input-group">
          <label htmlFor="category" className="search-label">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="search-select"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mot-clé */}
        <div className="search-input-group">
          <label htmlFor="keyword" className="search-label">
            Rechercher
          </label>
          <input
            id="keyword"
            type="text"
            placeholder="Quoi ? Immobilier, véhicules..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Localisation */}
        <div className="search-input-group">
          <label htmlFor="location" className="search-label">
            Localisation
          </label>
          <div className="search-input-wrapper">
            <MapPin className="search-input-icon" size={18} />
            <input
              id="location"
              type="text"
              placeholder="Abidjan, Cocody..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Bouton Rechercher */}
        <Button
          type="submit"
          variant="cta"
          size="lg"
          className="search-button"
          icon={Search}
        >
          Rechercher
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
