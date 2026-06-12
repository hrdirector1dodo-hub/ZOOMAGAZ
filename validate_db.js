/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runValidation = () => {
  console.log('=== STARTING AUTOMATED DATABASE INTEGRATION VALIDATION ===\n');

  let errors = [];
  let passed = [];

  const absSchemaPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\b411d5a0-b4f4-4986-9e10-b40f7786df90\\supabase_schema.sql';
  
  if (!fs.existsSync(absSchemaPath)) {
    errors.push('Schema file supabase_schema.sql not found at absolute path!');
  } else {
    const schemaContent = fs.readFileSync(absSchemaPath, 'utf8');
    
    // Check tables
    const expectedTables = [
      'profiles', 'categories', 'products', 'orders', 'order_items', 
      'payments', 'reviews', 'bonus_history', 'coupons', 'sessions', 'audit_logs'
    ];

    expectedTables.forEach(table => {
      const regex = new RegExp(`CREATE TABLE( IF NOT EXISTS)? public\\.${table}`, 'i');
      if (regex.test(schemaContent)) {
        passed.push(`Table public.${table} exists in schema definition`);
      } else {
        errors.push(`Table public.${table} is missing from schema definition!`);
      }
    });

    // Check triggers & functions
    const expectedTriggers = ['on_auth_user_created', 'on_review_submitted'];
    expectedTriggers.forEach(trig => {
      const regex = new RegExp(`CREATE( OR REPLACE)? TRIGGER ${trig}`, 'i');
      if (regex.test(schemaContent)) {
        passed.push(`Trigger ${trig} exists in schema definition`);
      } else {
        errors.push(`Trigger ${trig} is missing from schema definition!`);
      }
    });

    // Check RLS statements
    expectedTables.forEach(table => {
      const regex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i');
      if (regex.test(schemaContent)) {
        passed.push(`RLS enabled on public.${table}`);
      } else {
        errors.push(`RLS enablement statement is missing for public.${table}!`);
      }
    });
  }

  // 2. Verify context integration queries
  const contexts = [
    { name: 'AuthContext.jsx', path: 'src/context/AuthContext.jsx', tables: ['profiles'] },
    { name: 'OrdersContext.jsx', path: 'src/context/OrdersContext.jsx', tables: ['orders', 'order_items', 'payments'] },
    { name: 'ReviewContext.jsx', path: 'src/context/ReviewContext.jsx', tables: ['reviews', 'coupons', 'profiles'] },
    { name: 'BonusContext.jsx', path: 'src/context/BonusContext.jsx', tables: ['profiles', 'bonus_history'] }
  ];

  contexts.forEach(ctx => {
    const ctxPath = path.join(__dirname, ctx.path);
    if (!fs.existsSync(ctxPath)) {
      errors.push(`Context file ${ctx.name} not found!`);
    } else {
      const content = fs.readFileSync(ctxPath, 'utf8');
      
      // Verify isSupabaseConfigured checks
      if (content.includes('isSupabaseConfigured')) {
        passed.push(`${ctx.name} includes isSupabaseConfigured checks`);
      } else {
        errors.push(`${ctx.name} is missing isSupabaseConfigured fallback verification checks!`);
      }

      // Verify queries
      ctx.tables.forEach(table => {
        const regex = new RegExp(`from\\(['"]${table}['"]\\)`, 'i');
        if (regex.test(content)) {
          passed.push(`${ctx.name} correctly references '${table}' table in queries`);
        } else {
          errors.push(`${ctx.name} does not reference expected table '${table}' in queries!`);
        }
      });
    }
  });

  // 3. Verify .env settings
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    errors.push('.env file not found!');
  } else {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
      passed.push('.env file contains Supabase keys');
    } else {
      errors.push('.env file is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY declarations!');
    }
  }

  console.log(`Passed Checks (${passed.length}):`);
  passed.forEach(p => console.log(`[PASS] ${p}`));
  console.log('');

  if (errors.length > 0) {
    console.log(`Failed Checks (${errors.length}):`);
    errors.forEach(e => console.log(`[FAIL] ${e}`));
    console.log('');
    process.exit(1);
  } else {
    console.log('[SUCCESS] All database schema constraints, queries, and environment checks verified successfully!');
    process.exit(0);
  }
};

runValidation();
