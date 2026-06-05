# EcoPet — Интернет-магазин зоотоваров и Telegram-помощник

EcoPet — это современный, отзывчивый интернет-магазин зоотоваров, построенный на React + Vite с использованием CSS Modules и React Router. Проект полностью готов к публикации в сети (deploy). В проект интегрирован многофункциональный Telegram-бот, который служит помощником клиента и аналитической панелью для администратора.

---

## 📂 Структура проекта
* **Сайт (React + Vite)**: Исходный код находится в папке `/src`. При компиляции генерируется статический бандл в папке `/dist`.
* **Бот (Node.js)**: Код бота расположен в папке `/bot`. Использует те же JSON-базы данных (`src/data/`), что и сайт.

---

## 🔧 Локальный запуск

В проект встроена портативная версия Node.js (для Windows), поэтому установка глобального Node.js не обязательна.

### 1. Запуск сайта
Откройте PowerShell в корневой папке проекта и запустите:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; $env:PATH = "node-portable-v22\node-v22.12.0-win-x64;" + $env:PATH; npm run dev
```
Сайт откроется по адресу: **`http://localhost:5173/`**.

### 2. Запуск бота
Убедитесь, что вы настроили файл `.env` в корне проекта (указали `TELEGRAM_BOT_TOKEN`, `ADMIN_ID`, `ADMIN_PASSWORD` и `SITE_URL`). Затем запустите:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; $env:PATH = "node-portable-v22\node-v22.12.0-win-x64;" + $env:PATH; node bot/index.js
```

---

## 🛠️ Загрузка кода на GitHub

Для загрузки проекта в ваш репозиторий `https://github.com/hrdirector1dodo-hub/ZOOMAGAZ.git` выполните следующие шаги:

### Шаг 1. Установите Git
Если Git еще не установлен на вашем компьютере:
1. Скачайте установщик с официального сайта: [git-scm.com](https://git-scm.com/download/win).
2. Установите его, оставив настройки по умолчанию.
3. Откройте новый терминал PowerShell, чтобы обновились пути окружения.

### Шаг 2. Инициализация и первый коммит
Выполните команды в папке проекта:
```bash
# Инициализировать локальный репозиторий
git init

# Добавить все файлы проекта под версионный контроль
git add .

# Создать первый коммит
git commit -m "Initial commit: website and Telegram Bot integration"

# Переименовать ветку по умолчанию в main
git branch -M main

# Связать локальный репозиторий с удаленным на GitHub
git remote add origin https://github.com/hrdirector1dodo-hub/ZOOMAGAZ.git

# Отправить код на GitHub (потребуется авторизация)
git push -u origin main
```

---

## 🌐 Публикация сайта на Netlify

Вы можете опубликовать фронтенд-часть (папку `/dist` сайта) на Netlify двумя способами:

### Способ 1. Автоматический деплой через GitHub (Рекомендуемый)
Этот способ автоматически обновляет сайт в интернете при каждом пуше кода в ваш репозиторий на GitHub.

1. Зарегистрируйтесь или войдите на [Netlify.com](https://www.netlify.com/).
2. Перейдите в панель управления и нажмите **"Add new site"** -> **"Import an existing project"**.
3. Выберите **GitHub** в качестве провайдера и авторизуйтесь.
4. Выберите ваш репозиторий `hrdirector1dodo-hub/ZOOMAGAZ`.
5. Netlify автоматически определит тип проекта и заполнит параметры:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Нажмите **"Deploy site"**. Через пару минут сайт будет опубликован!
7. Настройки маршрутизации (содержимое [netlify.toml](netlify.toml)) автоматически обеспечат корректную работу React Router при перезагрузке страниц.

### Способ 2. Ручной деплой (Drag-and-Drop)
Если вы хотите загрузить файлы напрямую без привязки к GitHub:

1. Соберите проект локально в папку `dist` с помощью команды:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; $env:PATH = "node-portable-v22\node-v22.12.0-win-x64;" + $env:PATH; npm run build
   ```
2. Откройте панель управления [Netlify](https://app.netlify.com/).
3. Перейдите на вкладку **Sites** и прокрутите вниз до зоны загрузки **"Want to deploy a new site without connecting to Git? Drag and drop your site folder here"**.
4. Перетащите сгенерированную папку `dist/` из вашего проводника прямо в это окно.
5. Сайт будет опубликован мгновенно!

---

## 🤖 Публикация Telegram-бота

Поскольку Netlify поддерживает только статические сайты (HTML/JS/CSS), Node.js бэкэнд бота нужно опубликовать на специализированном хостинге, например на **Railway** или **Render**.

### Развертывание на Railway.app
1. Зарегистрируйтесь на [Railway.app](https://railway.app/) через ваш GitHub аккаунт.
2. Нажмите **"New Project"** -> **"Deploy from GitHub repo"** и выберите ваш репозиторий `ZOOMAGAZ`.
3. Перейдите в настройки деплоя и добавьте переменные окружения (**Variables**):
   - `TELEGRAM_BOT_TOKEN` = *ваш токен бота*
   - `ADMIN_ID` = *ваш telegram ID*
   - `ADMIN_PASSWORD` = *ваш секретный пароль*
   - `SITE_URL` = *URL вашего опубликованного сайта на Netlify*
4. Railway автоматически применит команду запуска. В код бота встроен HTTP health check, слушающий порт `PORT` (или `3000` по умолчанию), что предотвратит падение деплоя по таймауту.

### Развертывание на Render.com (Бесплатный хостинг)
1. Зарегистрируйтесь или войдите на [Render.com](https://render.com/) с помощью вашей учетной записи GitHub.
2. В панели управления нажмите кнопку **"New +"** и выберите **"Web Service"**.
3. Выберите репозиторий `ZOOMAGAZ` из списка подключенных к вашему GitHub.
4. Настройте параметры веб-службы:
   - **Name:** `ecopet-bot`
   - **Runtime:** `Node`
   - **Root Directory:** `bot` (Крайне важно! Укажите `bot`, так как код бота находится в подпапке).
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free` (Бесплатный тариф)
5. Нажмите кнопку **"Advanced"** и добавьте переменные окружения (**Environment Variables**):
   - `TELEGRAM_BOT_TOKEN` = *ваш токен бота от BotFather*
   - `ADMIN_ID` = *ваш Telegram ID*
   - `ADMIN_PASSWORD` = *ваш секретный пароль для админки*
   - `SITE_URL` = *ссылка на ваш опубликованный сайт на Netlify*
6. Нажмите **"Create Web Service"**. Бот скомпилируется и запустится автоматически. Встроенный сервер проверит доступность порта и бот будет стабильно работать в сети в режиме 24/7!

