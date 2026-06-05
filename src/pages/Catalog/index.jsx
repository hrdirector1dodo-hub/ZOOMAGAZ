// src/pages/Catalog/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Button from '../../components/ui/Button';
import styles from './index.module.css';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data State
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating-desc');

  // UI State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Load products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const data = await api.getProducts();
      setProducts(data);
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  // Sync state with URL Query Params on mount/update
  useEffect(() => {
    const catParam = searchParams.get('category');
    const brandParam = searchParams.get('brand');
    const searchParam = searchParams.get('search');

    if (catParam) setSelectedCategory(catParam);
    if (brandParam) {
      setSelectedBrands(prev => prev.includes(brandParam) ? prev : [...prev, brandParam]);
    }
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  // Extract unique brands for filtering depending on selected category
  const availableBrands = useMemo(() => {
    const relevantProducts = selectedCategory 
      ? products.filter(p => p.category === selectedCategory)
      : products;
    return [...new Set(relevantProducts.map(p => p.brand))].sort();
  }, [products, selectedCategory]);

  // Helper to check and reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrands([]);
    setPriceRange({ min: '', max: '' });
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('rating-desc');
    setSearchParams({});
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter (matches name, brand, or category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Brands filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price filter
    if (priceRange.min !== '') {
      result = result.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter(p => p.price <= Number(priceRange.max));
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // Stock filter
    if (inStockOnly) {
      result = result.filter(p => p.inStock > 0);
    }

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'rating-desc') {
        return b.rating - a.rating;
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrands, priceRange, minRating, inStockOnly, sortBy]);

  // Categories list definition
  const categories = [
    { id: 'dogs', name: 'Товары для собак' },
    { id: 'cats', name: 'Товары для кошек' },
    { id: 'parrots', name: 'Товары для попугаев' },
    { id: 'fish', name: 'Товары для рыбок' },
    { id: 'ferrets', name: 'Товары для хорьков' }
  ];

  const handleBrandChange = (brandName) => {
    setSelectedBrands(prev => 
      prev.includes(brandName) 
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  };

  const renderFiltersContent = () => (
    <>
      {/* Category filter */}
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Категории</h3>
        <div className={styles.categoryList}>
          <div 
            className={`${styles.categoryItem} ${selectedCategory === '' ? styles.categoryItemActive : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            Все категории
          </div>
          {categories.map(cat => (
            <div 
              key={cat.id}
              className={`${styles.categoryItem} ${selectedCategory === cat.id ? styles.categoryItemActive : ''}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedBrands([]); // clear brand filters when switching category
              }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Price filter */}
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Цена, ₽</h3>
        <div className={styles.priceInputs}>
          <input 
            type="number" 
            placeholder="От"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            className={styles.priceInput}
          />
          <span className={styles.priceDivider}>—</span>
          <input 
            type="number" 
            placeholder="До"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            className={styles.priceInput}
          />
        </div>
      </div>

      {/* Brand filter */}
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Бренды</h3>
        <div className={styles.checkboxList}>
          {availableBrands.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Выберите категорию</p>
          ) : (
            availableBrands.map(brand => (
              <label key={brand} className={styles.checkboxLabel}>
                <input 
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                  className={styles.checkbox}
                />
                <span>{brand}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Rating filter */}
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Минимальный рейтинг</h3>
        <div className={styles.ratingList}>
          {[4.8, 4.5, 4.2].map(rating => (
            <div 
              key={rating}
              className={`${styles.ratingOption} ${minRating === rating ? styles.ratingOptionActive : ''}`}
              onClick={() => setMinRating(minRating === rating ? 0 : rating)}
            >
              ★ {rating}+ и выше
            </div>
          ))}
        </div>
      </div>

      {/* Availability filter */}
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Наличие</h3>
        <label className={styles.checkboxLabel}>
          <input 
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Только в наличии</span>
        </label>
      </div>

      {/* Clear Filters Button */}
      <Button variant="outline" fullWidth onClick={resetFilters}>
        <Trash2 size={16} />
        Сбросить фильтры
      </Button>
    </>
  );

  return (
    <div className={`${styles.catalogPage} container animate-fade-in`}>
      <div className={styles.header}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Каталог зоотоваров</h1>
        <p style={{ color: 'var(--color-text-light)', marginTop: '8px' }}>Более 100 экологичных и премиальных товаров для ваших питомцев</p>
      </div>

      {/* Global Search Bar */}
      <div style={{ marginTop: '24px' }}>
        <div className={styles.searchWrapper}>
          <input 
            type="text" 
            placeholder="Поиск товаров по названию, бренду, описанию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} size={20} />
        </div>
      </div>

      <div className={styles.catalogLayout}>
        {/* Desktop Sidebar */}
        <aside className={styles.sidebar}>
          {renderFiltersContent()}
        </aside>

        {/* Catalog Main Content */}
        <div className={styles.content}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.resultsCount}>
              Найдено товаров: <span className={styles.resultsCountBold}>{filteredProducts.length}</span>
            </div>
            
            <div className={styles.toolbarActions}>
              <button 
                className={styles.mobileFilterBtn}
                onClick={() => setIsMobileDrawerOpen(true)}
              >
                <SlidersHorizontal size={18} />
                Фильтры
              </button>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className={styles.sortSelect}
              >
                <option value="rating-desc">По рейтингу (популярные)</option>
                <option value="price-asc">По цене (сначала дешевые)</option>
                <option value="price-desc">По цене (сначала дорогие)</option>
                <option value="name-asc">По названию (А-Я)</option>
              </select>
            </div>
          </div>

          {/* Products Grid or Empty State */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '1.2rem', color: 'var(--color-primary-jade)' }}>
              Загрузка товаров...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '3rem' }}>🐾</div>
              <h3 className={styles.emptyStateTitle}>Товары не найдены</h3>
              <p className={styles.emptyStateText}>
                Попробуйте изменить параметры поиска или сбросить фильтры, чтобы увидеть все товары.
              </p>
              <Button variant="primary" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileFiltersDrawer} ${isMobileDrawerOpen ? styles.mobileFiltersDrawerOpen : ''}`}>
        <div className={styles.mobileFiltersContent}>
          <div className={styles.mobileFiltersHeader}>
            <span className={styles.mobileFiltersTitle}>Фильтры</span>
            <button onClick={() => setIsMobileDrawerOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className={styles.mobileFiltersBody}>
            {renderFiltersContent()}
          </div>
          <div className={styles.mobileFiltersFooter}>
            <Button variant="primary" fullWidth onClick={() => setIsMobileDrawerOpen(false)}>
              Применить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
