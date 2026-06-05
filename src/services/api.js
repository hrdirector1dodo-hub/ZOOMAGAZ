// src/services/api.js
import products from '../data/products.json';
import reviews from '../data/reviews.json';
import promotions from '../data/promotions.json';
import articles from '../data/articles.json';
import branches from '../data/branches.json';

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getProducts: async () => {
    await delay(300);
    return products;
  },
  
  getProductById: async (id) => {
    await delay(200);
    const numericId = parseInt(id, 10);
    const product = products.find(p => p.id === numericId);
    return product || null;
  },
  
  getReviews: async () => {
    await delay(200);
    return reviews;
  },
  
  getPromotions: async () => {
    await delay(100);
    return promotions;
  },
  
  getArticles: async () => {
    await delay(200);
    return articles;
  },
  
  getBranches: async () => {
    await delay(200);
    return branches;
  }
};
