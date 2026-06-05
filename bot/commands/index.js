import { keyboards } from '../keyboards/index.js';
import { utils } from '../utils/index.js';
import { dataService } from '../services/dataService.js';
import { adminService } from '../services/adminService.js';
import { config } from '../config/index.js';

// User states for password prompt tracking
const userStates = new Map();

/**
 * Helper to display a list of products safely (with photo fallback)
 */
async function sendProductCards(ctx, products, limit = 3) {
  if (products.length === 0) {
    return ctx.reply('🔍 К сожалению, товары не найдены.');
  }

  const itemsToSend = products.slice(0, limit);
  
  for (const product of itemsToSend) {
    const text = utils.formatProduct(product, config.siteUrl);
    const markup = keyboards.productActionMenu(product.id, config.siteUrl);

    if (product.image) {
      try {
        await ctx.replyWithPhoto(product.image, {
          caption: text,
          parse_mode: 'HTML',
          reply_markup: markup
        });
        continue;
      } catch (err) {
        // Fallback to text if photo upload fails
      }
    }
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: markup
    });
  }

  if (products.length > limit) {
    const remaining = products.length - limit;
    await ctx.reply(`➕ Показано первых ${limit} товаров. Еще ${remaining} товаров доступны на нашем сайте!`, 
      Markup ? Markup.inlineKeyboard([[Markup.button.url('🌐 Открыть каталог', `${config.siteUrl}/catalog`)]]) : undefined
    );
  }
}

export function registerCommands(bot) {
  // Keep Markup import for helper buttons
  const { Markup } = bot.telegram ? { Markup: { inlineKeyboard: () => {}, button: {} } } : {};

  // /start command
  bot.command('start', async (ctx) => {
    userStates.delete(ctx.from.id);
    const welcomeText = `👋 <b>Добро пожаловать в EcoPet!</b>\n\n` +
      `Я ваш персональный помощник по магазину зоотоваров.\n` +
      `Помогу найти корм, игрушки, расскажу об актуальных акциях и помогу сориентироваться на нашем сайте.\n\n` +
      `Воспользуйтесь меню ниже или введите запрос для быстрого поиска товаров!`;
    
    await ctx.reply(welcomeText, {
      parse_mode: 'HTML',
      ...keyboards.mainMenu()
    });
  });

  // /help command
  bot.command('help', async (ctx) => {
    const helpText = `📖 <b>Справка по командам бота:</b>\n\n` +
      `/start — Перезапустить бота и открыть главное меню\n` +
      `/catalog — Посмотреть категории товаров\n` +
      `/search [запрос] — Быстрый поиск товара\n` +
      `/categories — Выбрать товары по категориям\n` +
      `/promotions — Актуальные акции и спецпредложения\n` +
      `/contacts — Контакты и филиалы магазина\n` +
      `/site — Ссылка на интернет-магазин\n` +
      `/admin — Вход в режим администратора\n\n` +
      `💡 Вы можете просто прислать ключевое слово (например, <i>"корм"</i> или <i>"кошачий лежак"</i>), и я найду его в каталоге!`;

    await ctx.reply(helpText, { parse_mode: 'HTML' });
  });

  // /catalog command & trigger
  const showCatalog = async (ctx) => {
    await ctx.reply('📂 Выберите интересующую категорию товаров:', keyboards.categoriesMenu());
  };
  bot.command('catalog', showCatalog);
  bot.command('categories', showCatalog);
  bot.hears('📦 Каталог', showCatalog);

  // /site command & trigger
  const showSite = async (ctx) => {
    await ctx.reply(`🌐 Наш официальный сайт:\n${config.siteUrl}`, 
      Markup ? Markup.inlineKeyboard([[Markup.button.url('Перейти на сайт', config.siteUrl)]]) : undefined
    );
  };
  bot.command('site', showSite);
  bot.hears('🌐 Перейти на сайт', showSite);

  // /promotions command & trigger
  const showPromotions = async (ctx) => {
    const promos = await dataService.getPromotions();
    if (promos.length === 0) {
      return ctx.reply('🔥 На данный момент активных акций нет. Следите за обновлениями!');
    }

    let text = `🔥 <b>Наши акции и спецпредложения:</b>\n\n`;
    promos.forEach((p, idx) => {
      text += `${idx + 1}. <b>${p.title}</b> [${p.badge}]\n`;
      text += `<i>${p.description}</i>\n`;
      text += `📅 Период проведения: ${p.period}\n\n`;
    });

    text += `💡 Все подробности и акционные товары доступны в разделе акций на главной странице!`;
    await ctx.reply(text, { parse_mode: 'HTML' });
  };
  bot.command('promotions', showPromotions);
  bot.hears('🔥 Акции и скидки', showPromotions);

  // /contacts command & trigger
  const showContacts = async (ctx) => {
    const contactsText = `📞 <b>Контакты нашего магазина:</b>\n\n` +
      `📱 <b>Телефон:</b> +7 (495) 123-45-67\n` +
      `💬 <b>WhatsApp:</b> <a href="https://wa.me/74951234567">Написать в чат</a>\n` +
      `✉️ <b>Email:</b> support@ecopet.ru\n\n` +
      `🕒 <b>Режим работы поддержки:</b> Ежедневно с 09:00 до 22:00\n\n` +
      `📍 Для получения списка адресов филиалов нажмите кнопку ниже или введите /branches`;
    
    await ctx.reply(contactsText, { parse_mode: 'HTML' });
  };
  bot.command('contacts', showContacts);
  bot.hears('📞 Контакты', showContacts);

  // Address филиалов
  const showBranches = async (ctx) => {
    const branches = await dataService.getBranches();
    if (branches.length === 0) {
      return ctx.reply('📍 Адреса филиалов временно недоступны.');
    }

    let text = `📍 <b>Филиалы EcoPet:</b>\n\n`;
    branches.forEach((b) => {
      text += `🏢 <b>г. ${b.city}</b>\n`;
      text += `🏠 Адрес: ${b.address}\n`;
      text += `📞 Тел: ${b.phone}\n`;
      text += `🕒 Время работы: ${b.hours}\n`;
      text += `✨ Особенности: ${b.features.join(', ')}\n\n`;
    });

    await ctx.reply(text, { parse_mode: 'HTML' });
  };
  bot.command('branches', showBranches);
  bot.hears('📍 Адреса филиалов', showBranches);

  // Поиск товара (/search)
  bot.command('search', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
      return ctx.reply('🔍 Пожалуйста, напишите запрос после команды, например:\n/search корм для кошек');
    }
    const results = await dataService.searchProducts(query);
    await sendProductCards(ctx, results, 3);
  });

  bot.hears('🔍 Поиск товара', async (ctx) => {
    await ctx.reply('🔍 Отправьте мне название товара или категорию (например: <i>"сухой корм"</i>, <i>"лежак"</i>, <i>"аквариум"</i>), и я найду его!', { parse_mode: 'HTML' });
  });

  // Popular products trigger
  const showPopular = async (ctx) => {
    const products = await dataService.getProducts();
    // Sort by rating desc, stock > 0
    const popular = products
      .filter(p => p.stock > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
      
    await ctx.reply('🌟 <b>Популярные товары с высоким рейтингом:</b>', { parse_mode: 'HTML' });
    await sendProductCards(ctx, popular, 3);
  };
  bot.command('popular', showPopular);
  bot.hears('🌟 Популярные товары', showPopular);

  // Categories direct triggers
  bot.hears('🐕 Товары для собак', async (ctx) => {
    const results = await dataService.getProductsByCategory('dogs');
    await sendProductCards(ctx, results, 3);
  });
  bot.hears('🐈 Товары для кошек', async (ctx) => {
    const results = await dataService.getProductsByCategory('cats');
    await sendProductCards(ctx, results, 3);
  });
  bot.hears('🦜 Товары для попугаев', async (ctx) => {
    const results = await dataService.getProductsByCategory('parrots');
    await sendProductCards(ctx, results, 3);
  });
  bot.hears('🐠 Товары для рыбок', async (ctx) => {
    const results = await dataService.getProductsByCategory('fish');
    await sendProductCards(ctx, results, 3);
  });
  bot.hears('🐹 Товары для хорьков', async (ctx) => {
    const results = await dataService.getProductsByCategory('ferrets');
    await sendProductCards(ctx, results, 3);
  });

  // Cart helper trigger
  bot.hears('🛒 Корзина', async (ctx) => {
    const cartText = `🛒 <b>Где находится корзина?</b>\n\n` +
      `Ваша корзина доступна в верхнем правом углу на любой странице нашего сайта.\n` +
      `Вы также можете перейти к ней напрямую по адресу:\n` +
      `${config.siteUrl}/cart\n\n` +
      `💡 Добавляйте товары из каталога на сайте, оформляйте заказ в один клик, и мы доставим его бесплатно при сумме от 2000 рублей!`;

    await ctx.reply(cartText, {
      parse_mode: 'HTML',
      reply_markup: Markup ? Markup.inlineKeyboard([[Markup.button.url('🛒 Перейти в корзину', `${config.siteUrl}/cart`)]]) : undefined
    });
  });

  // Operator support trigger
  bot.hears('💬 Связаться с оператором', async (ctx) => {
    await ctx.reply('💬 Если у вас есть вопросы по заказам или товарам, свяжитесь с нашим оператором службы поддержки:\n👉 @ecopet_support\n\nМы ответим вам в течение пары минут!');
  });

  // Admin Commands
  const checkAdminAccess = (ctx) => {
    if (!utils.isAdmin(ctx)) {
      ctx.reply('❌ Доступ запрещен. Эта функция доступна только администраторам.');
      return false;
    }
    return true;
  };

  const showAdminPanel = async (ctx) => {
    if (utils.isAdmin(ctx)) {
      await ctx.reply('👤 <b>Панель администратора EcoPet</b>\n\nВыберите действие в меню ниже:', {
        parse_mode: 'HTML',
        reply_markup: keyboards.adminMenu()
      });
    } else {
      // Prompt for password
      userStates.set(ctx.from.id, { action: 'awaiting_password' });
      await ctx.reply('🔑 Введите секретный пароль администратора для авторизации:');
    }
  };

  bot.command('admin', showAdminPanel);
  bot.hears('👤 Админ-панель', showAdminPanel);

  // Admin command: /stats
  const runStats = async (ctx) => {
    if (!checkAdminAccess(ctx)) return;
    const stats = await adminService.getStats();

    let text = `📊 <b>Статистика каталога EcoPet:</b>\n\n` +
      `📦 <b>Всего товаров:</b> ${stats.totalCount} шт.\n` +
      `🏷️ <b>Категорий:</b> ${stats.totalCategories}\n` +
      `💰 <b>Средняя цена товара:</b> ${stats.averagePrice} ₽\n\n` +
      `🗂️ <b>Товаров по категориям:</b>\n`;

    for (const [cat, data] of Object.entries(stats.categoryStats)) {
      text += `  • ${cat}: ${data.count} шт.\n`;
    }

    text += `\n⚠️ <b>Предупреждения:</b>\n` +
      `  • Товаров с низким остатком (≤2): ${stats.lowStock.length}\n` +
      `  • Товаров без описания: ${stats.noDescription.length}\n` +
      `  • Товаров без фото: ${stats.noImage.length}\n\n` +
      `💲 <b>Самые дорогие товары:</b>\n`;

    stats.mostExpensive.forEach((p, idx) => {
      text += `  ${idx + 1}. ${p.name} — ${p.price} ₽\n`;
    });

    text += `\n💲 <b>Самые дешевые товары:</b>\n`;
    stats.cheapest.forEach((p, idx) => {
      text += `  ${idx + 1}. ${p.name} — ${p.price} ₽\n`;
    });

    await ctx.reply(text, { parse_mode: 'HTML' });
  };
  bot.command('stats', runStats);

  // Admin command: /report
  const runReport = async (ctx) => {
    if (!checkAdminAccess(ctx)) return;
    const report = await adminService.getAnalysisReport();
    const recommendations = await adminService.getRecommendations();

    let text = `📝 <b>Аналитический отчет по каталогу:</b>\n\n` +
      `📈 <b>Заполненность категорий (Описание / Фото):</b>\n`;

    for (const [name, info] of Object.entries(report.categoryAnalysis)) {
      text += `  • <b>${name}</b>: ${info.count} шт. (описания: ${info.descCompleteness}%, фото: ${info.imageCompleteness}%)\n`;
    }

    if (report.priceAnomalies.length > 0) {
      text += `\n💰 <b>Проверка цен (Аномалии):</b>\n`;
      report.priceAnomalies.slice(0, 5).forEach((item, idx) => {
        text += `  ${idx + 1}. ${item.product.name} (${item.product.price} ₽): <i>${item.reason}</i>\n`;
      });
      if (report.priceAnomalies.length > 5) {
        text += `  ... и еще ${report.priceAnomalies.length - 5} позиций.\n`;
      }
    } else {
      text += `\n✅ Аномалий цен не обнаружено.\n`;
    }

    text += `\n💡 <b>Рекомендации по улучшению:</b>\n`;
    recommendations.forEach(r => {
      text += `  • ${r}\n`;
    });

    await ctx.reply(text, { parse_mode: 'HTML' });
  };
  bot.command('report', runReport);

  // Callback queries
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    // Category callback
    if (data.startsWith('category_')) {
      const categoryKey = data.replace('category_', '');
      const categoryNames = {
        dogs: 'Товары для собак',
        cats: 'Товары для кошек',
        parrots: 'Товары для попугаев',
        fish: 'Товары для рыбок',
        ferrets: 'Товары для хорьков'
      };
      
      const results = await dataService.getProductsByCategory(categoryKey);
      await ctx.answerCbQuery();
      await ctx.reply(`📂 Категория: <b>${categoryNames[categoryKey] || categoryKey}</b>`, { parse_mode: 'HTML' });
      await sendProductCards(ctx, results, 3);
      return;
    }

    // Back to catalog
    if (data === 'back_to_catalog') {
      await ctx.answerCbQuery();
      await showCatalog(ctx);
      return;
    }

    // Similar products callback
    if (data.startsWith('similar_')) {
      const productId = data.replace('similar_', '');
      const product = await dataService.getProductById(productId);
      
      if (!product) {
        await ctx.answerCbQuery('Товар не найден.');
        return;
      }
      
      const categoryProducts = await dataService.getProductsByCategory(product.category);
      const similar = categoryProducts
        .filter(p => p.id !== product.id)
        .slice(0, 2);

      await ctx.answerCbQuery();
      if (similar.length === 0) {
        await ctx.reply('💡 В данной категории больше нет товаров.');
      } else {
        await ctx.reply('💡 <b>Похожие товары в этой же категории:</b>', { parse_mode: 'HTML' });
        await sendProductCards(ctx, similar, 2);
      }
      return;
    }

    // Admin inline actions
    if (data.startsWith('admin_')) {
      if (!utils.isAdmin(ctx)) {
        await ctx.answerCbQuery('❌ Доступ ограничен.', { show_alert: true });
        return;
      }

      await ctx.answerCbQuery();

      if (data === 'admin_stats') {
        await runStats(ctx);
      } else if (data === 'admin_report') {
        await runReport(ctx);
      } else if (data === 'admin_recommendations') {
        const recs = await adminService.getRecommendations();
        let text = `💡 <b>Рекомендации по улучшению сайта:</b>\n\n`;
        recs.forEach((r, idx) => {
          text += `${idx + 1}. ${r}\n`;
        });
        await ctx.reply(text, { parse_mode: 'HTML' });
      } else if (data === 'admin_products_list') {
        const products = await dataService.getProducts();
        let text = `🛒 <b>Краткий список товаров (${products.length} шт.):</b>\n\n`;
        products.slice(0, 15).forEach((p) => {
          text += `• ID ${p.id} | ${p.name} — <b>${p.price} ₽</b> (остаток: ${p.stock})\n`;
        });
        
        if (products.length > 15) {
          text += `\n... и еще ${products.length - 15} товаров. Полный список доступен на сайте.`;
        }
        await ctx.reply(text, { parse_mode: 'HTML' });
      } else if (data === 'admin_exit') {
        utils.deauthorizeAdmin(ctx);
        await ctx.reply('🚪 Вы вышли из админ-панели. Сессия закрыта.', keyboards.mainMenu());
      }
      return;
    }
  });

  // Catch-all text messages for search or password entry
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    // Check if user is in "awaiting_password" state
    const state = userStates.get(ctx.from.id);
    if (state && state.action === 'awaiting_password') {
      const success = utils.authorizeAdmin(ctx, text);
      userStates.delete(ctx.from.id);
      
      if (success) {
        return ctx.reply('✅ Успешный вход в панель администратора!', keyboards.adminMenu());
      } else {
        return ctx.reply('❌ Неверный пароль. Попробуйте еще раз с помощью /admin.');
      }
    }

    // Direct text resolution to search or category
    const categoryKey = dataService.resolveCategory(text);
    if (categoryKey) {
      const results = await dataService.getProductsByCategory(categoryKey);
      return sendProductCards(ctx, results, 3);
    }

    // Otherwise, treat as search query
    const results = await dataService.searchProducts(text);
    if (results.length > 0) {
      await ctx.reply(`🔍 Результаты поиска по запросу "<b>${utils.escapeHtml(text)}</b>":`, { parse_mode: 'HTML' });
      return sendProductCards(ctx, results, 3);
    } else {
      return ctx.reply(`🔍 По запросу "<b>${utils.escapeHtml(text)}</b>" ничего не найдено.\nПопробуйте ввести другие ключевые слова или выберите категорию в меню.`, { parse_mode: 'HTML' });
    }
  });
}
