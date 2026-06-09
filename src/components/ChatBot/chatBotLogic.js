// src/components/ChatBot/chatBotLogic.js

// Normalizes input string for easier keyword matching
const normalizeText = (text) => {
  return text.toLowerCase().trim();
};

// Help helper to match words
const containsAny = (text, keywords) => {
  return keywords.some(keyword => text.includes(keyword));
};

export const INITIAL_STATE = {
  step: 'idle', // 'idle' | 'animal' | 'category' | 'age' | 'budget'
  answers: {
    animal: null, // 'dogs' | 'cats' | 'parrots' | 'fish' | 'ferrets'
    category: null, // 'корм' | 'игрушка' | 'витамины' | 'уход' | 'аксессуары' | 'домик' | 'переноска' | 'аквариум' | 'наполнитель'
    age: null, // 'молодые' | 'взрослые' | 'пожилые' | 'any'
    budget: null // number or null
  }
};

// Synonyms mapping for animals
const ANIMAL_MAP = {
  dogs: ['собак', 'щенок', 'щенк', 'пес', 'пёс', 'дог', 'собач', 'puppy', 'dog'],
  cats: ['кош', 'кот', 'котен', 'котён', 'кис', 'cat'],
  parrots: ['попуга', 'птиц', 'пернат', 'parrot'],
  fish: ['рыб', 'аквариум', 'fish'],
  ferrets: ['хорек', 'хорёк', 'хорьк', 'ferret']
};

// Synonyms mapping for categories
const CATEGORY_MAP = {
  'корм': ['корм', 'консерв', 'паштет', 'еда', 'лакомств', 'сух'],
  'игрушка': ['игрушк', 'мяч', 'кольц', 'интеракт', 'мышка', 'лазер'],
  'витамины': ['витамин', 'добавк', 'здоровь'],
  'уход': ['уход', 'шампун', 'гигиен', 'когтерез', 'щетк', 'щётк', 'чистк'],
  'аксессуары': ['аксессуар', 'ошейник', 'поводок', 'рулетк', 'лежак', 'лежанк', 'миск', 'поилк'],
  'домик': ['домик', 'лежак', 'лежанк', 'когтеточк', 'комплекс'],
  'переноска': ['переноск', 'сумк'],
  'аквариум': ['аквариум', 'фильтр', 'компрессор', 'декор', 'грунт'],
  'наполнитель': ['наполнитель', 'песок']
};

// Map localized category names back to system keys or tags
const getAnimalKey = (text) => {
  const norm = normalizeText(text);
  for (const [key, keywords] of Object.entries(ANIMAL_MAP)) {
    if (containsAny(norm, keywords)) {
      return key;
    }
  }
  return null;
};

const getCategoryKey = (text) => {
  const norm = normalizeText(text);
  for (const [key, keywords] of Object.entries(CATEGORY_MAP)) {
    if (containsAny(norm, keywords)) {
      return key;
    }
  }
  return null;
};

// Filter products based on search criteria
export const searchProducts = (products, criteria) => {
  const { animal, category, age, budget } = criteria;
  
  return products.filter(p => {
    // 1. Animal Filter
    if (animal && p.category !== animal) {
      return false;
    }

    // 2. Category Filter
    if (category) {
      const nameNorm = p.name.toLowerCase();
      const descNorm = p.description.toLowerCase();
      const typeNorm = (p.specs?.['Тип товара'] || '').toLowerCase();
      const catKeywords = CATEGORY_MAP[category] || [];

      const matchesKeyword = catKeywords.some(kw => 
        nameNorm.includes(kw) || descNorm.includes(kw) || typeNorm.includes(kw)
      );

      if (!matchesKeyword) return false;
    }

    // 3. Age Filter
    if (age && age !== 'any') {
      const ageSpec = (p.specs?.['Возраст питомца'] || '').toLowerCase();
      if (age === 'молодые') {
        // Look for "для щенков", "для котят", "всех возрастов"
        if (!ageSpec.includes('щенк') && !ageSpec.includes('котят') && !ageSpec.includes('всех')) {
          return false;
        }
      } else if (age === 'взрослые') {
        if (!ageSpec.includes('взросл') && !ageSpec.includes('всех')) {
          return false;
        }
      } else if (age === 'пожилых') {
        if (!ageSpec.includes('пожил') && !ageSpec.includes('всех')) {
          return false;
        }
      }
    }

    // 4. Budget Filter
    if (budget && p.price > budget) {
      return false;
    }

    return true;
  });
};

// Main processing function for messages
export const processUserMessage = (messageText, state, products, branches, promotions) => {
  const text = normalizeText(messageText);

  // --- Veterinary caution check ---
  const vetKeywords = [
    'болит', 'заболел', 'ветеринар', 'лекарств', 'лечен', 'лечит', 
    'чешет', 'рвот', 'понос', 'раны', 'кровь', 'болезн', 'кашель', 'температур'
  ];
  if (containsAny(text, vetKeywords)) {
    return {
      text: "Я могу подсказать общую информацию по уходу или подобрать товары, но при любых симптомах болезни лучше не откладывать и сразу обратиться к квалифицированному ветеринару. Здоровье питомца — это главное!",
      type: 'text',
      nextState: { ...state, step: 'idle' },
      quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
    };
  }

  // --- Questionnaire flow processing ---
  if (state.step && state.step !== 'idle') {
    const nextState = { ...state, answers: { ...state.answers } };

    switch (state.step) {
      case 'animal': {
        const animalChoice = getAnimalKey(text);
        if (!animalChoice) {
          return {
            text: "Пожалуйста, выберите одно из животных: Собака, Кошка, Попугай, Рыбки, Хорек.",
            type: 'text',
            nextState,
            quickReplies: ['Собака', 'Кошка', 'Попугай', 'Рыбки', 'Хорек', 'Отмена']
          };
        }
        nextState.answers.animal = animalChoice;
        nextState.step = 'category';
        
        const animalLabel = animalChoice === 'dogs' ? 'собаки' : 
                            animalChoice === 'cats' ? 'кошки' :
                            animalChoice === 'parrots' ? 'попугая' :
                            animalChoice === 'fish' ? 'рыбок' : 'хорька';

        return {
          text: `Отлично! Ищем товары для ${animalLabel}. Какой тип товара вас интересует?`,
          type: 'text',
          nextState,
          quickReplies: ['Корм', 'Игрушка', 'Витамины', 'Уход', 'Аксессуары', 'Домик', 'Переноска', 'Аквариум', 'Наполнитель', 'Отмена']
        };
      }

      case 'category': {
        if (containsAny(text, ['отмена', 'назад'])) {
          return {
            text: "Подбор отменен. Чем я могу помочь?",
            type: 'text',
            nextState: INITIAL_STATE,
            quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
          };
        }
        const categoryChoice = getCategoryKey(text);
        if (!categoryChoice) {
          return {
            text: "Выберите категорию из предложенных: Корм, Игрушка, Витамины, Уход, Аксессуары, Домик, Переноска, Аквариум, Наполнитель.",
            type: 'text',
            nextState,
            quickReplies: ['Корм', 'Игрушка', 'Витамины', 'Уход', 'Аксессуары', 'Домик', 'Переноска', 'Аквариум', 'Наполнитель', 'Отмена']
          };
        }
        nextState.answers.category = categoryChoice;
        nextState.step = 'age';
        return {
          text: "Какой возраст вашего питомца?",
          type: 'text',
          nextState,
          quickReplies: ['Для щенков/котят (молодые)', 'Для взрослых', 'Для пожилых', 'Любой возраст']
        };
      }

      case 'age': {
        if (containsAny(text, ['отмена'])) {
          return {
            text: "Подбор отменен. Чем я могу помочь?",
            type: 'text',
            nextState: INITIAL_STATE,
            quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
          };
        }
        let ageChoice = 'any';
        if (containsAny(text, ['щен', 'кот', 'молод'])) {
          ageChoice = 'молодые';
        } else if (containsAny(text, ['взросл'])) {
          ageChoice = 'взрослые';
        } else if (containsAny(text, ['пожил', 'стар'])) {
          ageChoice = 'пожилых';
        }
        nextState.answers.age = ageChoice;
        nextState.step = 'budget';
        return {
          text: "Укажите ваш максимальный бюджет в рублях (например, 2000) или выберите вариант ниже:",
          type: 'text',
          nextState,
          quickReplies: ['До 1000 ₽', 'До 2500 ₽', 'До 5000 ₽', 'Любой бюджет']
        };
      }

      case 'budget': {
        if (containsAny(text, ['отмена'])) {
          return {
            text: "Подбор отменен. Чем я могу помочь?",
            type: 'text',
            nextState: INITIAL_STATE,
            quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
          };
        }

        let budgetLimit = null;
        const numberMatch = text.replace(/\s/g, '').match(/\d+/);
        if (numberMatch) {
          budgetLimit = parseInt(numberMatch[0], 10);
        } else if (containsAny(text, ['1000'])) {
          budgetLimit = 1000;
        } else if (containsAny(text, ['2500'])) {
          budgetLimit = 2500;
        } else if (containsAny(text, ['5000'])) {
          budgetLimit = 5000;
        }

        nextState.answers.budget = budgetLimit;
        
        // Execute search
        const found = searchProducts(products, nextState.answers);
        const limitFound = found.slice(0, 5); // top 5 results

        nextState.step = 'idle'; // Reset state

        if (limitFound.length === 0) {
          return {
            text: "К сожалению, по вашему запросу ничего не найдено в каталоге. Попробуйте выбрать другие критерии или сбросить фильтры.",
            type: 'text',
            nextState,
            quickReplies: ['Подобрать товар', 'Акции', 'Контакты']
          };
        }

        const animalLabel = nextState.answers.animal === 'dogs' ? 'собак' : 
                            nextState.answers.animal === 'cats' ? 'кошек' :
                            nextState.answers.animal === 'parrots' ? 'попугаев' :
                            nextState.answers.animal === 'fish' ? 'рыбок' : 'хорьков';

        return {
          text: `Вот что я подобрал для ${animalLabel} (${nextState.answers.category}):`,
          type: 'products',
          products: limitFound,
          nextState,
          quickReplies: ['Подобрать еще', 'Акции', 'Контакты']
        };
      }
    }
  }

  // --- Cancel/Reset state ---
  if (containsAny(text, ['отмена', 'сброс', 'выйти из подбора'])) {
    return {
      text: "Диалог сброшен. Я готов ответить на новые вопросы или подобрать товары.",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
    };
  }

  // --- Main keywords matching in IDLE mode ---

  // Check if initiating helper selection
  if (containsAny(text, ['подобрать', 'помоги выбрать', 'поиск', 'подобрать товар', 'купить'])) {
    // If specific animal or category is already mentioned, we can prefill
    const animal = getAnimalKey(text);
    const category = getCategoryKey(text);
    
    const nextState = { 
      step: animal ? (category ? 'age' : 'category') : 'animal', 
      answers: { animal, category, age: null, budget: null } 
    };

    if (animal && category) {
      const animalLabel = animal === 'dogs' ? 'собаки' : 
                          animal === 'cats' ? 'кошки' :
                          animal === 'parrots' ? 'попугая' :
                          animal === 'fish' ? 'рыбок' : 'хорька';
      return {
        text: `Отлично, я понял, что мы ищем ${category} для ${animalLabel}. Какой возраст у вашего питомца?`,
        type: 'text',
        nextState,
        quickReplies: ['Для щенков/котят (молодые)', 'Для взрослых', 'Для пожилых', 'Любой возраст']
      };
    } else if (animal) {
      const animalLabel = animal === 'dogs' ? 'собаки' : 
                          animal === 'cats' ? 'кошки' :
                          animal === 'parrots' ? 'попугая' :
                          animal === 'fish' ? 'рыбок' : 'хорька';
      return {
        text: `Я понял, что нужен товар для ${animalLabel}. Какая именно категория вас интересует?`,
        type: 'text',
        nextState,
        quickReplies: ['Корм', 'Игрушка', 'Витамины', 'Уход', 'Аксессуары', 'Домик', 'Переноска', 'Аквариум', 'Наполнитель', 'Отмена']
      };
    } else {
      return {
        text: "Давайте подберем идеальный товар для вашего питомца! Для какого животного вы ищете товар?",
        type: 'text',
        nextState,
        quickReplies: ['Собака', 'Кошка', 'Попугай', 'Рыбки', 'Хорек']
      };
    }
  }

  // Quick category / animal direct phrases (e.g. "нужен корм для кошки")
  const directAnimal = getAnimalKey(text);
  const directCategory = getCategoryKey(text);
  if (directAnimal && directCategory) {
    const found = searchProducts(products, { animal: directAnimal, category: directCategory });
    const limitFound = found.slice(0, 5);
    
    if (limitFound.length > 0) {
      const animalLabel = directAnimal === 'dogs' ? 'собак' : 
                          directAnimal === 'cats' ? 'кошек' :
                          directAnimal === 'parrots' ? 'попугаев' :
                          directAnimal === 'fish' ? 'рыбок' : 'хорьков';
      return {
        text: `Определил животное: ${directAnimal === 'dogs' ? 'Собака' : directAnimal === 'cats' ? 'Кошка' : directAnimal === 'parrots' ? 'Попугай' : directAnimal === 'fish' ? 'Рыбки' : 'Хорек'}, категория: ${directCategory}. Вот подходящие товары из нашего каталога:`,
        type: 'products',
        products: limitFound,
        nextState: INITIAL_STATE,
        quickReplies: [`Товары для ${directAnimal === 'dogs' ? 'собаки' : directAnimal === 'cats' ? 'кошки' : 'питомца'}`, 'Акции', 'Контакты']
      };
    }
  }

  // Custom complex queries for puppies (щенки)
  if (containsAny(text, ['для щенка', 'для щенков', 'купить щенку'])) {
    // Show dog products matching puppy keywords (feeding, toys, treats, beds)
    const puppyFeed = products.filter(p => p.category === 'dogs' && (
      p.name.toLowerCase().includes('щенк') || 
      p.description.toLowerCase().includes('щенк') || 
      (p.specs?.['Возраст питомца'] || '').toLowerCase().includes('щенк') ||
      p.name.toLowerCase().includes('игрушк') ||
      p.name.toLowerCase().includes('лежак') ||
      p.name.toLowerCase().includes('ошейник')
    )).slice(0, 5);

    return {
      text: "Для щенков мы рекомендуем сбалансированный корм для роста, мягкую лежанку, безопасные игрушки для зубов, гипоаллергенный шампунь и витамины. Вот отличный стартовый набор для вашего щенка:",
      type: 'products',
      products: puppyFeed,
      nextState: INITIAL_STATE,
      quickReplies: ['Товары для собаки', 'Акции', 'Контакты']
    };
  }

  // Custom complex queries for kittens (котята)
  if (containsAny(text, ['для котенка', 'для котят', 'купить котенку'])) {
    const kittenFeed = products.filter(p => p.category === 'cats' && (
      p.name.toLowerCase().includes('котят') || 
      p.description.toLowerCase().includes('котят') || 
      (p.specs?.['Возраст питомца'] || '').toLowerCase().includes('котят') ||
      p.name.toLowerCase().includes('игрушк') ||
      p.name.toLowerCase().includes('наполнит') ||
      p.name.toLowerCase().includes('лежак')
    )).slice(0, 5);

    return {
      text: "Для котенка важно подобрать нежный влажный корм, когтеточку для стачивания когтей, безопасные игрушки-дразнилки, лоток с качественным наполнителем и удобный лежак. Вот что мы подобрали:",
      type: 'products',
      products: kittenFeed,
      nextState: INITIAL_STATE,
      quickReplies: ['Товары для кошки', 'Акции', 'Контакты']
    };
  }

  // Custom complex queries for fish/aquarium (аквариум)
  if (containsAny(text, ['для аквариума', 'для рыбок', 'рыбкам'])) {
    const fishGoods = products.filter(p => p.category === 'fish').slice(0, 5);
    return {
      text: "Для запуска и поддержания аквариума вам понадобятся: сам аквариум, очищающий фильтр, воздушный компрессор, декоративный грунт и растения, а также качественный корм в хлопьях для рыбок. Посмотрите товары из каталога:",
      type: 'products',
      products: fishGoods,
      nextState: INITIAL_STATE,
      quickReplies: ['Акции', 'Контакты']
    };
  }

  // Custom complex queries for parrots (попугай)
  if (containsAny(text, ['для попугая', 'для попугаев', 'попугаю'])) {
    const parrotGoods = products.filter(p => p.category === 'parrots').slice(0, 5);
    return {
      text: "Для попугаев требуются: просторная и безопасная клетка, поилка, качественная зерновая смесь с минералами, витаминные подкормки (мел, сепия) и развивающие игрушки (качели, колокольчики). Вот подходящие товары:",
      type: 'products',
      products: parrotGoods,
      nextState: INITIAL_STATE,
      quickReplies: ['Акции', 'Контакты']
    };
  }

  // Custom complex queries for ferrets (хорек)
  if (containsAny(text, ['для хорька', 'для хорьков', 'хорьку'])) {
    const ferretGoods = products.filter(p => p.category === 'ferrets').slice(0, 5);
    return {
      text: "Для хорька важно обустроить большую клетку, повесить удобный гамак, купить сухой корм с высоким содержанием животного белка, миску-поилку и лоток. Вот товары для хорьков:",
      type: 'products',
      products: ferretGoods,
      nextState: INITIAL_STATE,
      quickReplies: ['Акции', 'Контакты']
    };
  }

  // Difference between adult and young food
  if (containsAny(text, ['отличается корм', 'разница в кормах', 'различия корма'])) {
    return {
      text: "Корм для молодых животных (щенков, котят) имеет повышенную калорийность, содержит больше белка, кальция и фосфора для активного роста скелета и мышц, а его гранулы мельче и легче разгрызаются. Корм для взрослых сбалансирован под стабильный обмен веществ и содержит меньше калорий во избежание ожирения. Пожилым же животным требуются хондропротекторы для суставов и легкоусвояемые компоненты.",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
    };
  }

  // Standard FAQ Questions:

  // Location / Branches (где находится магазин, какие есть филиалы)
  if (containsAny(text, ['где магазин', 'адрес', 'где вы', 'филиал', 'город', 'казан', 'москв', 'петербург', 'спб'])) {
    return {
      text: "Наш главный магазин находится по адресу: г. Москва, ул. Лесная, д. 20, стр. 1 (м. Белорусская). Также у нас есть филиалы в Санкт-Петербурге и Казани. Вот подробный список наших филиалов с графиком работы:",
      type: 'branches',
      branches: branches,
      nextState: INITIAL_STATE,
      quickReplies: ['Контакты', 'Акции', 'Подобрать товар']
    };
  }

  // Contact info (как связаться с магазином)
  if (containsAny(text, ['связаться', 'контакт', 'телефон', 'номер', 'позвонить', 'почт', 'email'])) {
    return {
      text: "Вы можете связаться с ZOOMAGAZ следующими способами:\n\n📞 Телефон: +7 (800) 555-35-35 (бесплатно по РФ)\n✉️ Email: support@ecopet.ru\n📍 Главный офис: г. Москва, ул. Лесная, д. 20\n\nМы работаем ежедневно с 09:00 до 22:00.",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Филиалы', 'Акции', 'Подобрать товар']
    };
  }

  // Delivery (есть ли доставка)
  if (containsAny(text, ['доставк', 'привезти', 'курьер'])) {
    return {
      text: "Мы доставляем товары по всей России:\n\n🚚 Бесплатная доставка курьером при заказе от 2000 рублей!\n📦 Для заказов менее 2000 рублей стоимость доставки — 290 рублей.\n🕒 Сроки доставки по Москве и СПб — 1-2 дня, в другие регионы — от 3 дней (СДЭК, Почта России).",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Акции', 'Подобрать товар', 'Контакты']
    };
  }

  // Promotions (какие есть акции)
  if (containsAny(text, ['акци', 'скидк', 'промо', 'выгод'])) {
    return {
      text: "В ZOOMAGAZ прямо сейчас действуют отличные предложения для заботливых хозяев! Посмотрите наши акции:",
      type: 'promotions',
      promotions: promotions,
      nextState: INITIAL_STATE,
      quickReplies: ['Подобрать корм', 'Контакты', 'Главная']
    };
  }

  // How to place order (как оформить заказ)
  if (containsAny(text, ['заказ', 'оформ', 'купить товар'])) {
    return {
      text: "Оформить заказ на сайте очень просто:\n\n1. Перейдите в Каталог и добавьте товары в корзину с помощью кнопки с иконкой тележки.\n2. Кликните на иконку корзины в правом верхнем углу сайта.\n3. Проверьте список товаров и нажмите кнопку 'Оформить заказ'.\n4. Заполните адрес доставки и контактные данные, после чего подтвердите покупку.",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Каталог', 'Подобрать товар', 'Контакты']
    };
  }

  // Register / Sign In (как зарегистрироваться, как войти в профиль)
  if (containsAny(text, ['зарегистрир', 'регистрац', 'создать аккаунт'])) {
    return {
      text: "Чтобы зарегистрироваться на ZOOMAGAZ:\n\n1. Нажмите на иконку пользователя (человечка) в правом верхнем углу сайта.\n2. В открывшемся окне перейдите на вкладку 'Регистрация'.\n3. Введите ваше имя, email и надежный пароль.\n4. Нажмите кнопку 'Зарегистрироваться'. После этого вам будет доступен личный кабинет!",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Войти в профиль', 'Подобрать товар']
    };
  }

  if (containsAny(text, ['войти', 'вход', 'профил', 'кабинет', 'авторизова'])) {
    return {
      text: "Чтобы войти в свой личный профиль:\n\n1. Нажмите на иконку пользователя в правом верхнем углу экрана.\n2. Введите ваш email и пароль на вкладке 'Вход'.\n3. Нажмите кнопку 'Войти'. После этого в правом верхнем углу отобразится ваше имя, и вы сможете просматривать заказы в Личном кабинете.",
      type: 'text',
      nextState: INITIAL_STATE,
      quickReplies: ['Зарегистрироваться', 'Подобрать товар']
    };
  }

  // Quick buttons triggers directly
  if (containsAny(text, ['товары для кошки', 'товары для кошек'])) {
    const found = searchProducts(products, { animal: 'cats' });
    return {
      text: "Вот популярные товары для кошек из нашего каталога:",
      type: 'products',
      products: found.slice(0, 5),
      nextState: INITIAL_STATE,
      quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
    };
  }

  if (containsAny(text, ['товары для собаки', 'товары для собак'])) {
    const found = searchProducts(products, { animal: 'dogs' });
    return {
      text: "Вот отличные предложения товаров для собак из нашего каталога:",
      type: 'products',
      products: found.slice(0, 5),
      nextState: INITIAL_STATE,
      quickReplies: ['Подобрать корм', 'Акции', 'Контакты']
    };
  }

  if (containsAny(text, ['подобрать корм', 'купить корм'])) {
    const nextState = { step: 'animal', answers: { animal: null, category: 'корм', age: null, budget: null } };
    return {
      text: "Давайте подберем корм! Для какого животного вы ищете корм?",
      type: 'text',
      nextState,
      quickReplies: ['Собака', 'Кошка', 'Попугай', 'Рыбки', 'Хорек']
    };
  }

  // General fallback
  return {
    text: "Привет! Я умный помощник ZOOMAGAZ. Могу помочь вам подобрать товары для питомцев, рассказать о действующих скидках, условиях доставки или найти наши контакты. \n\nНапишите ваш вопрос (например, 'нужен корм для кошки' или 'где находится магазин') или выберите одну из быстрых кнопок ниже 👇",
    type: 'text',
    nextState: INITIAL_STATE,
    quickReplies: ['Подобрать корм', 'Товары для кошки', 'Товары для собаки', 'Акции', 'Контакты']
  };
};
