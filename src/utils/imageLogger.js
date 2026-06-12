import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Logs image load failures to console and database audit_logs table
 * @param {string} src - The failed image source URL
 * @param {string|number} productId - Optional product ID
 * @param {string} productName - Optional name of product or article
 */
export const logImageError = async (src, productId = null, productName = '') => {
  console.error(`[ProductImage] Ошибка загрузки изображения: ${src} ${productName ? `(${productName})` : ''}`);

  const logPayload = {
    action: 'IMAGE_LOAD_FAILED',
    table_name: productId && String(productId).startsWith('art-') ? 'articles' : 'products',
    record_id: null,
    old_value: null,
    new_value: { src, productId, productName },
    ip_address: '127.0.0.1'
  };

  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // Fetch external IP asynchronously for the log entry
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(async (ipData) => {
          await supabase
            .from('audit_logs')
            .insert({
              ...logPayload,
              user_id: userId,
              ip_address: ipData.ip || '127.0.0.1'
            });
        })
        .catch(async () => {
          // Fallback if IP lookup fails
          await supabase
            .from('audit_logs')
            .insert({
              ...logPayload,
              user_id: userId
            });
        });
    } catch (err) {
      console.warn('Failed to write image error to database audit_logs:', err);
    }
  } else {
    try {
      const logs = JSON.parse(localStorage.getItem('ecopet_audit_logs') || '[]');
      logs.push({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        ...logPayload
      });
      localStorage.setItem('ecopet_audit_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to save image error log in localStorage:', e);
    }
  }
};
