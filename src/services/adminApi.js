// src/services/adminApi.js
import { supabase } from '../utils/supabaseClient'; // existing client with anon key

/**
 * Fetch all products for the admin panel.
 * Returns { data, error } where data is an array of product objects.
 */
export const getAdminProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id');
  return { data, error };
};

/**
 * Create a new product.
 * @param {Object} product - product fields matching DB schema.
 */
export const createProduct = async (product) => {
  const { data, error } = await supabase.from('products').insert(product);
  return { data, error };
};

/**
 * Update an existing product.
 * @param {number} id - product ID.
 * @param {Object} updates - fields to update.
 */
export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);
  return { data, error };
};

/**
 * Delete a product.
 * @param {number} id - product ID.
 */
export const deleteProduct = async (id) => {
  const { data, error } = await supabase.from('products').delete().eq('id', id);
  return { data, error };
};

/* ------------------------------------------------------------------
   SECURITY NOTE:
   This module uses only the public/anon Supabase key. For real
   production admin operations you must protect these endpoints with
   Supabase Row‑Level Security (RLS) policies and/or a server‑side
   function that uses the service_role key. The current implementation
   is suitable for a demo or learning environment.
------------------------------------------------------------------ */
