import { config } from '../config/index.js';

// In-memory set of user IDs who logged in using the password
const authenticatedAdmins = new Set();

/**
 * Escape HTML special characters to prevent Telegram API errors
 */
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const utils = {
  /**
   * Check if a Telegram user is authorized as an administrator
   */
  isAdmin(ctx) {
    if (!ctx || !ctx.from) return false;
    const userId = ctx.from.id.toString();

    // Check by environment config ID
    if (config.adminId && userId === config.adminId.toString().trim()) {
      return true;
    }

    // Check by active session login (in-memory)
    return authenticatedAdmins.has(ctx.from.id);
  },

  /**
   * Try to authorize admin by password
   */
  authorizeAdmin(ctx, password) {
    if (!ctx || !ctx.from || !password) return false;
    
    const configuredPassword = config.adminPassword.toString().trim();
    if (configuredPassword && password.trim() === configuredPassword) {
      authenticatedAdmins.add(ctx.from.id);
      return true;
    }
    return false;
  },

  /**
   * Deauthorize admin session
   */
  deauthorizeAdmin(ctx) {
    if (!ctx || !ctx.from) return false;
    return authenticatedAdmins.delete(ctx.from.id);
  },

  /**
   * Format a product object into a clean, premium HTML message
   */
  formatProduct(product, siteUrl) {
    const name = escapeHtml(product.name);
    const price = product.price ? `${product.price} ₽` : 'Цена не указана';
    const categoryName = escapeHtml(product.categoryName || product.category || 'Общая');
    const brand = escapeHtml(product.brand || 'EcoPet');
    const rating = product.rating || 'Нет оценок';
    const stockStatus = product.stock > 0 ? `${product.stock} шт.` : '❌ Нет в наличии';
    const description = escapeHtml(product.description || 'Описание временно отсутствует.');

    return `<b>📦 ${name}</b>\n\n` +
           `<b>💰 Цена:</b> ${price}\n` +
           `<b>🏷️ Категория:</b> ${categoryName}\n` +
           `<b>🏢 Бренд:</b> ${brand}\n` +
           `<b>⭐ Рейтинг:</b> ${rating}\n` +
           `<b>📦 Наличие:</b> ${stockStatus}\n\n` +
           `<b>📝 Описание:</b>\n<i>${description}</i>\n\n` +
           `🔗 <a href="${siteUrl}/product/${product.id}">Открыть карточку товара на сайте</a>`;
  }
};
