// src/utils/catalogDiagnostics.js
import products from '../data/products.json';

/**
 * Runs a diagnostic check on all products in the catalog database
 * and logs the results to the browser console.
 */
export const runCatalogDiagnostics = () => {
  console.group('🐾 Автоматическая диагностика каталога товаров');
  
  let missingImages = [];
  let outOfStock = [];

  products.forEach(product => {
    // 1. Check images
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0 || !product.images[0]) {
      missingImages.push(product);
    }

    // 2. Check stock level (previously hidden quantity selectors)
    if (product.inStock === 0) {
      outOfStock.push(product);
    }
  });

  // Log image results
  if (missingImages.length > 0) {
    console.warn(`⚠️ Найдено товаров без изображений в базе данных (${missingImages.length}):`);
    missingImages.forEach(p => {
      console.warn(`  - [#${p.id}] ${p.name}`);
    });
  } else {
    console.log('✅ Базовая проверка базы данных: все товары имеют пути к изображениям.');
  }

  // Log quantity selector status (out of stock status)
  if (outOfStock.length > 0) {
    console.info(`ℹ️ Товарные карточки без наличия на складе (кнопки выбора количества заблокированы) (${outOfStock.length}):`);
    outOfStock.forEach(p => {
      console.info(`  - [#${p.id}] ${p.name} (Бренд: ${p.brand}, В наличии: 0 шт)`);
    });
  }

  // General check on schema fields
  const sample = products[0] || {};
  const hasImageOrImageUrlField = 'image' in sample || 'imageUrl' in sample;
  if (hasImageOrImageUrlField) {
    console.warn('⚠️ Обнаружено нетипичное поле image/imageUrl в объекте товара. Рекомендуется использовать массив images.');
  } else {
    console.log('✅ Структура полей в норме (используется поле images).');
  }

  console.groupEnd();
};
