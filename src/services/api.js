// src/services/api.js

import reviews from '../data/reviews.json';
import promotions from '../data/promotions.json';
import articles from '../data/articles.json';
import branches from '../data/branches.json';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getProducts: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Failed to fetch products from Supabase:', err);
        return []; // empty fallback
      }
    }
    await delay(300);
    return []; // empty fallback
  },
  
  getProductById: async (id) => {
    if (isSupabaseConfigured) {
      try {
        const numericId = parseInt(id, 10);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', numericId)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error(`Failed to fetch product ${id} from Supabase:`, err);
        return null;
      }
    }
    await delay(200);
    const numericId = parseInt(id, 10);
    const product = products.find(p => p.id === numericId);
    return product || null;
  },
  
  getReviews: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*');
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Failed to fetch reviews from Supabase:', err);
        return reviews; // local fallback
      }
    }
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
