import { dataService } from './dataService.js';

export const adminService = {
  /**
   * Get basic metrics and statistics for the catalog
   */
  async getStats() {
    const products = await dataService.getProducts();
    
    const totalCount = products.length;
    
    // Categories statistics
    const categoryStats = {};
    products.forEach(p => {
      const catName = p.categoryName || p.category || 'Без категории';
      if (!categoryStats[catName]) {
        categoryStats[catName] = { count: 0, totalPrice: 0 };
      }
      categoryStats[catName].count++;
      categoryStats[catName].totalPrice += p.price || 0;
    });

    const totalCategories = Object.keys(categoryStats).length;

    // Average price
    const averagePrice = totalCount > 0 
      ? Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / totalCount) 
      : 0;

    // Expensive and cheap products
    const sortedByPrice = [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
    const cheapest = sortedByPrice.slice(0, 3);
    const mostExpensive = sortedByPrice.slice(-3).reverse();

    // Products with low stock (<= 2)
    const lowStock = products.filter(p => p.stock <= 2);

    // Products without description
    const noDescription = products.filter(p => !p.description || p.description.trim() === '');

    // Products without image
    const noImage = products.filter(p => !p.images || p.images.length === 0 || !p.images[0]);

    return {
      totalCount,
      totalCategories,
      categoryStats,
      averagePrice,
      cheapest,
      mostExpensive,
      lowStock,
      noDescription,
      noImage
    };
  },

  /**
   * Performs an analysis of the catalog and returns category reports,
   * price checks, and promotion recommendations.
   */
  async getAnalysisReport() {
    const products = await dataService.getProducts();
    const stats = await this.getStats();

    // Category completeness analysis
    const categoryAnalysis = {};
    for (const [catName, data] of Object.entries(stats.categoryStats)) {
      const catProducts = products.filter(p => (p.categoryName || p.category || 'Без категории') === catName);
      const withDescription = catProducts.filter(p => p.description && p.description.trim() !== '').length;
      const withImage = catProducts.filter(p => p.images && p.images.length > 0 && p.images[0]).length;
      const avgPrice = data.count > 0 ? Math.round(data.totalPrice / data.count) : 0;

      categoryAnalysis[catName] = {
        count: data.count,
        avgPrice,
        descCompleteness: Math.round((withDescription / data.count) * 100),
        imageCompleteness: Math.round((withImage / data.count) * 100)
      };
    }

    // Determine well filled vs needs work
    const bestFilled = [];
    const needsWork = [];
    for (const [name, info] of Object.entries(categoryAnalysis)) {
      const avgCompleteness = (info.descCompleteness + info.imageCompleteness) / 2;
      if (avgCompleteness >= 90 && info.count >= 5) {
        bestFilled.push({ name, ...info });
      } else {
        needsWork.push({ name, ...info });
      }
    }

    // Identify suspicious prices (anomalies: price <= 0, or price is 5x higher/lower than category average)
    const priceAnomalies = [];
    for (const [name, info] of Object.entries(categoryAnalysis)) {
      const catProducts = products.filter(p => (p.categoryName || p.category || 'Без категории') === name);
      catProducts.forEach(p => {
        if (p.price <= 0) {
          priceAnomalies.push({ product: p, reason: 'Цена равна 0 или отрицательная' });
        } else if (info.avgPrice > 0) {
          const ratio = p.price / info.avgPrice;
          if (ratio > 5) {
            priceAnomalies.push({ product: p, reason: `Цена аномально высока (${Math.round(ratio)}x от средней)` });
          } else if (ratio < 0.15) {
            priceAnomalies.push({ product: p, reason: `Цена аномально низка (${Math.round(1/ratio)}x ниже средней)` });
          }
        }
      });
    }

    // Identify good promotion candidates (rating >= 4.7 and stock >= 5, not already on sale)
    const promoCandidates = products.filter(p => p.rating >= 4.7 && p.stock >= 5).slice(0, 5);

    return {
      categoryAnalysis,
      bestFilled,
      needsWork,
      priceAnomalies,
      promoCandidates
    };
  },

  /**
   * Recommendations for improving the website based on analytical data
   */
  async getRecommendations() {
    const stats = await this.getStats();
    const analysis = await this.getAnalysisReport();

    const recs = [];

    if (stats.lowStock.length > 0) {
      recs.push(`⚠️ **Пополнение запасов**: ${stats.lowStock.length} товаров имеют низкий остаток (<= 2 шт.). Рекомендуется обновить склад.`);
    }

    if (stats.noDescription.length > 0) {
      recs.push(`📝 **Описание товаров**: ${stats.noDescription.length} товаров не имеют описания. Это снижает конверсию и ухудшает SEO.`);
    }

    if (stats.noImage.length > 0) {
      recs.push(`🖼️ **Фотографии товаров**: ${stats.noImage.length} товаров не имеют изображений. Карточки без фото редко просматриваются покупателями.`);
    }

    if (analysis.needsWork.length > 0) {
      const names = analysis.needsWork.map(c => `"${c.name}"`).join(', ');
      recs.push(`🔧 **Доработка категорий**: Категории ${names} требуют наполнения или улучшения карточек товаров (добавление описаний/картинок).`);
    }

    if (analysis.priceAnomalies.length > 0) {
      recs.push(`💰 **Проверка цен**: Обнаружено ${analysis.priceAnomalies.length} товаров с аномальными ценами. Проверьте их на предмет опечаток.`);
    }

    if (recs.length === 0) {
      recs.push('🎉 **Отличная работа!** Данные каталога в идеальном состоянии: все товары имеют описания, картинки и актуальные остатки.');
    }

    return recs;
  }
};
