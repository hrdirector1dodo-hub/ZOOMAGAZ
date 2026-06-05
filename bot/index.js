import { Telegraf } from 'telegraf';
import { config } from './config/index.js';
import { registerCommands } from './commands/index.js';
import http from 'http';

if (!config.token || config.token === 'your_bot_token_here') {
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  console.error('\x1b[31m%s\x1b[0m', '❌ ОШИБКА: TELEGRAM_BOT_TOKEN не задан в файле .env!');
  console.error('\x1b[36m%s\x1b[0m', 'Пожалуйста, выполните следующие шаги:');
  console.error('1. Создайте файл .env в корневой папке проекта (на основе .env.example)');
  console.error('2. Укажите ваш токен от BotFather в переменной TELEGRAM_BOT_TOKEN');
  console.error('3. Запустите бота заново.');
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  process.exit(1);
}

const bot = new Telegraf(config.token);

console.log('🤖 Инициализация Telegram-бота EcoPet...');

// Register command routing
registerCommands(bot);

// Catch errors to prevent process crash
bot.catch((err, ctx) => {
  console.error(`❌ Ошибка в обновлении ${ctx.updateType}:`, err);
});

bot.launch()
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', '==================================================');
    console.log('\x1b[32m%s\x1b[0m', '🚀 Telegram-бот EcoPet успешно запущен и готов!');
    console.log(`🌐 Адрес сайта: ${config.siteUrl}`);
    console.log('Для остановки нажмите Ctrl+C');
    console.log('\x1b[32m%s\x1b[0m', '==================================================');
  })
  .catch((err) => {
    console.error('❌ Критическая ошибка при запуске бота:', err);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('Stopping bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Stopping bot...');
  bot.stop('SIGTERM');
});

// Start a simple HTTP health check server for hosting platform compliance (e.g. Render/Railway)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('EcoPet Bot is running successfully!\n');
}).listen(PORT, () => {
  console.log(`📡 Health check server is running on port ${PORT}`);
});

