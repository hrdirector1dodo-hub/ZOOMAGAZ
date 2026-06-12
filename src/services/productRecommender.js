// src/services/productRecommender.js
import petStoreData from '../data/petStore.json';

/**
 * AI Product Recommender for Pet Store
 * Analyzes user queries and recommends products based on:
 * - Animal type
 * - Breed
 * - Age group
 * - Problem/Need
 * - Budget
 */

// Mapping of keywords to animal types
const ANIMAL_KEYWORDS = {
  'dogs': ['собак', 'щенок', 'щенка', 'пес', 'пёс', 'дог', 'собачка', 'собака', 'bulldog', 'labrador', 'овчарка', 'лабрадор', 'чихуахуа', 'йорк', 'бульдог'],
  'cats': ['кош', 'кот', 'котен', 'котена', 'котёна', 'кошка', 'кот', 'кисонька', 'кошечка'],
  'parrots': ['попуга', 'попугай', 'птиц', 'пернат', 'волнистый'],
  'fish': ['рыб', 'рыбка', 'аквариум', 'золотая'],
  'rodents': ['хомячок', 'морская свинка', 'крыса', 'кролик', 'дегу', 'кролика', 'хомяк']
};

// Mapping of age-related keywords
const AGE_KEYWORDS = {
  'puppy': ['щенок', 'щенка', 'щеночек', 'маленький', 'молодой', 'юный', 'щенка', 'месяца'],
  'senior': ['пожилой', 'старый', 'старая', 'древний', 'лет 10', 'лет 12', 'лет 15'],
  'adult': ['взрослый', 'взрослая', 'взрослого', 'лет 2', 'лет 3', 'лет 5', 'лет 7', 'в возрасте'],
  'all': []
};

// Mapping of problem keywords to categories/benefits
const PROBLEM_KEYWORDS = {
  'eating': {
    keywords: ['не ест', 'отказывается', 'не хочет', 'привередлив', 'капризн', 'голодн', 'аппетит'],
    categories: ['food', 'treats'],
    benefits: ['для привередливых', 'стимулирует аппетит', 'разные вкусы']
  },
  'health': {
    keywords: ['здоров', 'витамин', 'иммунитет', 'сильн', 'болеет', 'слаб', 'болезн'],
    categories: ['vitamins', 'food'],
    benefits: ['иммунитет', 'здоровье', 'для развития']
  },
  'joints': {
    keywords: ['суставы', 'костям', 'бегает', 'ходит', 'хромает', 'артрит', 'подвижность'],
    categories: ['food', 'vitamins'],
    benefits: ['для суставов', 'хондроитин', 'глюкозамин']
  },
  'play': {
    keywords: ['играть', 'скучн', 'развлеч', 'активн', 'игрушк', 'занять'],
    categories: ['toys', 'furniture'],
    benefits: ['интерактивная', 'развитие', 'активность']
  },
  'comfort': {
    keywords: ['спать', 'комфорт', 'мягкий', 'кровать', 'лежак', 'уют', 'лежанка'],
    categories: ['furniture', 'accessories'],
    benefits: ['комфортный', 'мягкий', 'уютный']
  },
  'grooming': {
    keywords: ['шерст', 'уход', 'шампун', 'вычесыв', 'мыть', 'волос', 'груминг', 'блеск'],
    categories: ['care', 'accessories'],
    benefits: ['для шерсти', 'блеск', 'уход']
  },
  'transport': {
    keywords: ['переносить', 'поездка', 'путешеств', 'клеток', 'переноск', 'возить', 'носить'],
    categories: ['carrier', 'accessories'],
    benefits: ['транспортировка', 'удобная', 'практичная']
  }
};

// Normalize text for matching
const normalizeText = (text) => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[.,!?;:]/g, '');
};

// Find keywords in text
const findKeywords = (text, keywordObj) => {
  const normalized = normalizeText(text);
  const found = [];
  for (const [key, keywords] of Object.entries(keywordObj)) {
    if (Array.isArray(keywords)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        found.push(key);
      }
    }
  }
  return found;
};

// Parse user query to extract intent and parameters
const parseQuery = (query) => {
  const normalized = normalizeText(query);
  
  const animals = findKeywords(normalized, ANIMAL_KEYWORDS);
  const ageGroups = findKeywords(normalized, AGE_KEYWORDS);
  const problems = findKeywords(normalized, PROBLEM_KEYWORDS);
  
  // Extract price if mentioned
  let maxPrice = null;
  const priceMatch = normalized.match(/(\d+)\s*(руб|р\.|руб\.|₽)/);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1]);
  }
  
  return {
    animalType: animals[0] || null,
    breed: null, // Initialize breed field
    ageGroup: ageGroups[0] || 'adult',
    problems: problems,
    maxPrice,
    originalQuery: query,
    queryLength: query.length
  };
};

// Filter products based on criteria
const filterProducts = (criteria) => {
  let filtered = petStoreData.products;
  
  // Filter by animal type
  if (criteria.animalType) {
    filtered = filtered.filter(p => p.animalType === criteria.animalType);
  }
  
  // Filter by age group (if specified and not "adult")
  if (criteria.ageGroup && criteria.ageGroup !== 'all') {
    filtered = filtered.filter(p => 
      p.ageGroup === criteria.ageGroup || p.ageGroup === 'all'
    );
  }
  
  // Filter by problem categories
  if (criteria.problems && criteria.problems.length > 0) {
    const problemCategories = new Set();
    const problemBenefits = new Set();
    
    criteria.problems.forEach(problem => {
      if (PROBLEM_KEYWORDS[problem]) {
        PROBLEM_KEYWORDS[problem].categories.forEach(cat => 
          problemCategories.add(cat)
        );
        PROBLEM_KEYWORDS[problem].benefits.forEach(ben =>
          problemBenefits.add(ben)
        );
      }
    });
    
    if (problemCategories.size > 0) {
      filtered = filtered.filter(p => problemCategories.has(p.category));
    }
    
    // Prioritize products with matching benefits
    if (problemBenefits.size > 0) {
      filtered = filtered.sort((a, b) => {
        const aMatches = (a.benefits || []).filter(b => problemBenefits.has(b)).length;
        const bMatches = (b.benefits || []).filter(b => problemBenefits.has(b)).length;
        return bMatches - aMatches;
      });
    }
  }
  
  // Filter by price
  if (criteria.maxPrice) {
    filtered = filtered.filter(p => p.price <= criteria.maxPrice);
  }
  
  return filtered;
};

// Score products for relevance
const scoreProduct = (product, criteria) => {
  let score = 0;
  
  // Animal type match (50 points)
  if (criteria.animalType === product.animalType) {
    score += 50;
  }
  
  // Age group match (20 points)
  if (criteria.ageGroup === product.ageGroup || product.ageGroup === 'all') {
    score += 20;
  }
  
  // Breed-specific match (15 points)
  if (criteria.breed && product.breed.toLowerCase().includes(criteria.breed.toLowerCase())) {
    score += 15;
  }
  
  // Rating boost (10 points)
  if (product.rating >= 4.8) score += 10;
  else if (product.rating >= 4.5) score += 5;
  
  // In stock boost (5 points)
  if (product.inStock > 0) score += 5;
  
  // Benefits match (based on problems)
  if (criteria.problems && criteria.problems.length > 0) {
    criteria.problems.forEach(problem => {
      if (PROBLEM_KEYWORDS[problem]) {
        const matchingBenefits = (product.benefits || []).filter(b =>
          PROBLEM_KEYWORDS[problem].benefits.includes(b)
        ).length;
        score += matchingBenefits * 10;
      }
    });
  }
  
  return score;
};

// Generate explanation for recommendation
const generateExplanation = (product, criteria) => {
  const reasons = [];
  
  // Build reasons list
  if (criteria.animalType === product.animalType) {
    reasons.push('специально для этого животного');
  }
  
  if (criteria.problems && criteria.problems.length > 0) {
    criteria.problems.forEach(problem => {
      if (PROBLEM_KEYWORDS[problem]) {
        const matchingBenefits = (product.benefits || []).filter(b =>
          PROBLEM_KEYWORDS[problem].benefits.includes(b)
        );
        if (matchingBenefits.length > 0) {
          reasons.push(`помогает с ${problem}`);
        }
      }
    });
  }
  
  if (product.rating >= 4.8) {
    reasons.push(`высокий рейтинг (${product.rating}⭐)`);
  }
  
  if (product.inStock > 0) {
    reasons.push('в наличии');
  }
  
  return reasons;
};

// Format product for display
const formatProductForDisplay = (product) => {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    discount: product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0,
    description: product.description,
    brand: product.brand,
    rating: product.rating,
    inStock: product.inStock,
    benefits: product.benefits || [],
    sku: product.sku
  };
};

// Main recommendation engine
export const getProductRecommendations = (userQuery, options = {}) => {
  if (!userQuery || userQuery.trim().length === 0) {
    return {
      success: false,
      message: '❌ Не удалось понять ваш запрос. Опишите, какой товар вам нужен.',
      recommendations: [],
      criteria: null
    };
  }
  
  // Check if query is about products (safety check)
  const restrictedKeywords = ['контакт', 'доставк', 'адрес', 'телефон', 'часы', 'работ', 'график', 'цена доставк', 'оплат', 'оформлен', 'замен', 'возврат', 'гарант'];
  const normalized = normalizeText(userQuery);
  if (restrictedKeywords.some(keyword => normalized.includes(keyword))) {
    return {
      success: false,
      message: '🚫 Я помогаю только с подбором товаров и рекомендациями. Для других вопросов обратитесь в поддержку.',
      recommendations: [],
      criteria: null
    };
  }
  
  // Parse query
  const criteria = parseQuery(userQuery);
  
  // Validate that we have enough info
  if (!criteria.animalType && criteria.problems.length === 0) {
    return {
      success: false,
      message: '❓ Мне не ясно, для какого животного вам нужен товар. Укажите вид питомца (собака, кошка, попугай, рыбка или грызун).',
      recommendations: [],
      criteria
    };
  }
  
  // Get filtered products
  let products = filterProducts(criteria);
  
  if (products.length === 0) {
    return {
      success: false,
      message: '😔 К сожалению, я не нашел подходящих товаров по вашим критериям. Попробуйте описать иначе.',
      recommendations: [],
      criteria
    };
  }
  
  // Score and sort products
  const scored = products.map(product => ({
    product,
    score: scoreProduct(product, criteria)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  // Get top 3 recommendations
  const topRecommendations = scored.slice(0, 3).map(({ product }) => {
    const formatted = formatProductForDisplay(product);
    const explanations = generateExplanation(product, criteria);
    
    return {
      ...formatted,
      explanations,
      explanation: explanations.join(', ')
    };
  });
  
  // Generate friendly response
  const animalName = criteria.animalType ? 
    petStoreData.animals.find(a => a.id === criteria.animalType)?.name || 'питомцу' : 
    'питомцу';
  
  let message = `✅ Я нашел отличные товары для ${animalName}!`;
  
  if (topRecommendations.length === 1) {
    message = `✨ Вот идеальный вариант:`;
  } else if (topRecommendations.length > 1) {
    message = `✨ Я рекомендую эти товары:`;
  }
  
  return {
    success: true,
    message,
    recommendations: topRecommendations,
    criteria,
    totalFound: products.length
  };
};

// Get all available animals
export const getAvailableAnimals = () => {
  return petStoreData.animals.map(a => ({
    id: a.id,
    name: a.name
  }));
};

// Check if a query is product-related
export const isProductQuery = (query) => {
  const normalized = normalizeText(query);
  
  // Check for product-related keywords
  const productKeywords = [
    'товар', 'купить', 'где', 'как', 'какой', 'нужен', 'нужна', 'нужно',
    'подобрать', 'подбе', 'рекомендуе', 'посоветуе', 'помоги', 'как выбрать',
    'какие выбрать', 'что выбрать', 'цена', 'стоимость', 'дешев', 'дорог'
  ];
  
  // Check for animal keywords
  const animalKeywordsFlat = Object.values(ANIMAL_KEYWORDS).flat();
  
  const hasProductIntent = productKeywords.some(kw => normalized.includes(kw)) ||
                           animalKeywordsFlat.some(kw => normalized.includes(kw));
  
  return hasProductIntent;
};

export default {
  getProductRecommendations,
  getAvailableAnimals,
  isProductQuery
};
