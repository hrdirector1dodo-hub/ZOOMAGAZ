/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.join(__dirname, '.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
}

const isConfigured = supabaseUrl && 
                     supabaseUrl.startsWith('https://') && 
                     supabaseAnonKey && 
                     supabaseAnonKey !== 'your_supabase_anon_key_here';

if (!isConfigured) {
  console.log('--------------------------------------------------');
  console.log('Supabase is not configured in .env file (or using placeholders).');
  console.log('Skipping database seeding.');
  console.log('To run this script with a real database:');
  console.log('1. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.log('2. Run this script again: node seed.js');
  console.log('--------------------------------------------------');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const runSeeding = async () => {
  try {
    console.log('Starting Supabase data seeding...');
    
    // Read products.json
    const productsPath = path.join(__dirname, 'src', 'data', 'products.json');
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    // 1. Get unique categories
    const categoriesMap = new Map();
    productsData.forEach(p => {
      if (p.category && p.categoryName) {
        categoriesMap.set(p.category, p.categoryName);
      }
    });

    console.log(`Found ${categoriesMap.size} categories. Seeding categories...`);
    
    const categoriesToInsert = Array.from(categoriesMap.entries()).map(([slug, name]) => ({
      name,
      slug
    }));

    // Insert categories (upsert on slug)
    const { data: dbCategories, error: catError } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, { onConflict: 'slug' })
      .select();

    if (catError) {
      throw new Error(`Failed to seed categories: ${catError.message}`);
    }

    console.log('Categories seeded successfully!');

    // Create a slug to ID lookup map
    const categoryLookup = {};
    dbCategories.forEach(c => {
      categoryLookup[c.slug] = c.id;
    });

    // 2. Seed products
    console.log(`Preparing ${productsData.length} products to seed...`);
    
    const productsToInsert = productsData.map(p => {
      const categoryId = categoryLookup[p.category] || null;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand || null,
        price: p.price,
        description: p.description || '',
        rating: p.rating || 5.0,
        in_stock: p.inStock !== undefined ? p.inStock : 10,
        images: p.images || [],
        specs: p.specs || {},
        category_id: categoryId
      };
    });

    const { error: prodError } = await supabase
      .from('products')
      .upsert(productsToInsert, { onConflict: 'id' });

    if (prodError) {
      throw new Error(`Failed to seed products: ${prodError.message}`);
    }

    console.log('Products seeded successfully!');
    console.log('Seeding finished successfully!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

runSeeding();
