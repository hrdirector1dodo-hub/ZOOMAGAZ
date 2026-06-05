import { Markup } from 'telegraf';

export const keyboards = {
  /**
   * Main menu (Reply Keyboard) with persistent client action buttons
   */
  mainMenu() {
    return Markup.keyboard([
      ['📦 Каталог', '🔍 Поиск товара'],
      ['🔥 Акции и скидки', '🌟 Популярные товары'],
      ['🐕 Товары для собак', '🐈 Товары для кошек'],
      ['🦜 Товары для попугаев', '🐠 Товары для рыбок', '🐹 Товары для хорьков'],
      ['🛒 Корзина', '📞 Контакты', '📍 Адреса филиалов'],
      ['💬 Связаться с оператором', '🌐 Перейти на сайт'],
      ['👤 Админ-панель']
    ]).resize();
  },

  /**
   * Inline Keyboard for selecting categories
   */
  categoriesMenu() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🐕 Собаки', 'category_dogs'),
        Markup.button.callback('🐈 Кошки', 'category_cats')
      ],
      [
        Markup.button.callback('🦜 Попугаи', 'category_parrots'),
        Markup.button.callback('🐠 Рыбки', 'category_fish')
      ],
      [
        Markup.button.callback('🐹 Хорьки', 'category_ferrets')
      ]
    ]);
  },

  /**
   * Inline buttons for actions on a specific product card
   */
  productActionMenu(productId, siteUrl) {
    return Markup.inlineKeyboard([
      [Markup.button.url('🌐 Открыть на сайте', `${siteUrl}/product/${productId}`)],
      [
        Markup.button.callback('💡 Похожие товары', `similar_${productId}`),
        Markup.button.callback('🔙 В каталог', 'back_to_catalog')
      ]
    ]);
  },

  /**
   * Inline Keyboard for the Administrator panel commands
   */
  adminMenu() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📊 Статистика', 'admin_stats'),
        Markup.button.callback('📝 Отчет по каталогу', 'admin_report')
      ],
      [
        Markup.button.callback('🛒 Список товаров', 'admin_products_list'),
        Markup.button.callback('💡 Рекомендации', 'admin_recommendations')
      ],
      [
        Markup.button.callback('🚪 Выйти из админ-панели', 'admin_exit')
      ]
    ]);
  }
};
