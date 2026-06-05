import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_PATH = path.resolve(__dirname, '../../src/data/products.json');
const BRANCHES_PATH = path.resolve(__dirname, '../../src/data/branches.json');
const PROMOTIONS_PATH = path.resolve(__dirname, '../../src/data/promotions.json');

async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

export const dataService = {
  /**
   * Retrieves products from source file, mapping inStock to stock and first image to image
   */
  async getProducts() {
    const products = await readJson(PRODUCTS_PATH);
    return products.map(p => ({
      ...p,
      stock: p.inStock !== undefined ? p.inStock : 0,
      image: p.images && p.images.length > 0 ? p.images[0] : null
    }));
  },

  async getBranches() {
    return readJson(BRANCHES_PATH);
  },

  async getPromotions() {
    return readJson(PROMOTIONS_PATH);
  },

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === Number(id)) || null;
  },

  async searchProducts(query) {
    if (!query) return [];
    const normalizedQuery = query.toLowerCase().trim();
    const products = await this.getProducts();

    return products.filter(p => {
      const nameMatch = p.name && p.name.toLowerCase().includes(normalizedQuery);
      const brandMatch = p.brand && p.brand.toLowerCase().includes(normalizedQuery);
      const descMatch = p.description && p.description.toLowerCase().includes(normalizedQuery);
      const catMatch = p.categoryName && p.categoryName.toLowerCase().includes(normalizedQuery);
      const catKeyMatch = p.category && p.category.toLowerCase().includes(normalizedQuery);
      return nameMatch || brandMatch || descMatch || catMatch || catKeyMatch;
    });
  },

  async getProductsByCategory(categoryKey) {
    const products = await this.getProducts();
    return products.filter(p => p.category === categoryKey);
  },

  /**
   * Translates common search inputs into actual category keys
   */
  resolveCategory(query) {
    const normalized = query.toLowerCase().trim();
    if (normalized.includes('собак') || normalized.includes('dog') || normalized === 'собаки') {
      return 'dogs';
    }
    if (normalized.includes('кош') || normalized.includes('cat') || normalized === 'кошки') {
      return 'cats';
    }
    if (normalized.includes('попуг') || normalized.includes('parrot') || normalized.includes('птиц') || normalized === 'попугаи') {
      return 'parrots';
    }
    if (normalized.includes('рыб') || normalized.includes('fish') || normalized === 'рыбки') {
      return 'fish';
    }
    if (normalized.includes('хорьк') || normalized.includes('ferret') || normalized === 'хорьки') {
      return 'ferrets';
    }
    return null;
  }
};
