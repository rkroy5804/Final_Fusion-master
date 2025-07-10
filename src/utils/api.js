import { CACHE_SIZE } from './constants';
import { improvedTranslate } from './improvedTranslation';
import { translateWithAPI } from './translationAPI';
import { getLanguageCode } from './supportedLanguages';

// Simple in-memory cache
const cache = new Map();

/**
 * Generate cache key from text and languages
 * @param {string} text - Text to translate
 * @param {string} source - Source language
 * @param {string} target - Target language
 * @returns {string} - Cache key
 */
const getCacheKey = (text, source, target) => `${text}_${source}_${target}`;

/**
 * Add translation result to cache with LRU eviction
 * @param {string} key - Cache key
 * @param {Object} value - Translation result
 */
const addToCache = (key, value) => {
  if (cache.size >= CACHE_SIZE) {
    // Remove oldest entry (first key in the map)
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, value);
};

/**
 * Translate text using a translation service
 * @param {string} text - Text to translate
 * @param {string} source - Source language code
 * @param {string} target - Target language code
 * @returns {Promise<Object>} - Translation result
 */
export const translateText = async (text, source, target) => {
  if (!text.trim()) {
    return { text: '', source: source };
  }

  const cacheKey = getCacheKey(text, source, target);

  // Check cache first
  if (cache.has(cacheKey)) {
    console.log('Translation found in cache, returning cached result');
    return cache.get(cacheKey);
  }

  try {
    console.log(`Translation requested for text: "${text}"`);
    console.log(`Source language: ${source}, Target language: ${target}`);

    // Always use the Microsoft Translator API directly
    const apiResult = await translateWithAPI(text, source, target);

    // Check if there was an error in the translation
    if (apiResult.error) {
      console.warn('Translation API returned an error, using fallback');

      // Try to use the improved translation as a fallback
      const fallbackResult = {
        text: improvedTranslate(text, target),
        source: source,
        isMock: true
      };

      // Add to cache
      addToCache(cacheKey, fallbackResult);

      return fallbackResult;
    }

    console.log(`API translation successful: "${apiResult.text}"`);

    // Add to cache
    addToCache(cacheKey, apiResult);

    return apiResult;
  } catch (error) {
    console.error('Translation error:', error);

    // For debugging purposes, log the full error
    console.error('Full error object:', error);

    // Use the improved translation as a fallback
    const fallbackResult = {
      text: improvedTranslate(text, target),
      source: source,
      isMock: true
    };

    // Add to cache
    addToCache(cacheKey, fallbackResult);

    return fallbackResult;
  }
};

// Common words in different languages for more realistic mock translations
const commonWords = {
  en: {
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    farewells: ['goodbye', 'bye', 'see you', 'see you later', 'take care'],
    questions: ['what', 'where', 'when', 'why', 'how', 'who'],
    pronouns: ['i', 'you', 'he', 'she', 'it', 'we', 'they'],
    verbs: ['am', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did'],
    nouns: ['world', 'day', 'time', 'year', 'people', 'way', 'thing', 'man', 'woman', 'child'],
    adjectives: ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old'],
    conjunctions: ['and', 'but', 'or', 'because', 'if', 'when', 'that', 'while', 'although'],
    prepositions: ['in', 'on', 'at', 'with', 'by', 'for', 'from', 'to', 'of', 'about']
  },
  es: {
    greetings: ['hola', 'buenos días', 'buenas tardes', 'buenas noches'],
    farewells: ['adiós', 'hasta luego', 'hasta pronto', 'nos vemos', 'cuídate'],
    questions: ['qué', 'dónde', 'cuándo', 'por qué', 'cómo', 'quién'],
    pronouns: ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas'],
    verbs: ['soy', 'eres', 'es', 'somos', 'son', 'tengo', 'tienes', 'tiene', 'tenemos', 'tienen'],
    nouns: ['mundo', 'día', 'tiempo', 'año', 'gente', 'manera', 'cosa', 'hombre', 'mujer', 'niño'],
    adjectives: ['bueno', 'nuevo', 'primero', 'último', 'largo', 'gran', 'pequeño', 'propio', 'otro', 'viejo'],
    conjunctions: ['y', 'pero', 'o', 'porque', 'si', 'cuando', 'que', 'mientras', 'aunque'],
    prepositions: ['en', 'sobre', 'con', 'por', 'para', 'desde', 'hasta', 'de', 'acerca de']
  },
  fr: {
    greetings: ['bonjour', 'salut', 'bonsoir'],
    farewells: ['au revoir', 'à bientôt', 'à plus tard', 'adieu', 'prenez soin de vous'],
    questions: ['quoi', 'où', 'quand', 'pourquoi', 'comment', 'qui'],
    pronouns: ['je', 'tu', 'il', 'elle', 'nous', 'ils', 'elles'],
    verbs: ['suis', 'es', 'est', 'sommes', 'sont', 'ai', 'as', 'a', 'avons', 'ont'],
    nouns: ['monde', 'jour', 'temps', 'année', 'gens', 'façon', 'chose', 'homme', 'femme', 'enfant'],
    adjectives: ['bon', 'nouveau', 'premier', 'dernier', 'long', 'grand', 'petit', 'propre', 'autre', 'vieux'],
    conjunctions: ['et', 'mais', 'ou', 'parce que', 'si', 'quand', 'que', 'pendant que', 'bien que'],
    prepositions: ['dans', 'sur', 'à', 'avec', 'par', 'pour', 'de', 'vers', 'au sujet de']
  },
  de: {
    greetings: ['hallo', 'guten morgen', 'guten tag', 'guten abend'],
    farewells: ['auf wiedersehen', 'tschüss', 'bis später', 'bis bald', 'pass auf dich auf'],
    questions: ['was', 'wo', 'wann', 'warum', 'wie', 'wer'],
    pronouns: ['ich', 'du', 'er', 'sie', 'es', 'wir', 'sie'],
    verbs: ['bin', 'bist', 'ist', 'sind', 'habe', 'hast', 'hat', 'haben'],
    nouns: ['welt', 'tag', 'zeit', 'jahr', 'leute', 'weg', 'ding', 'mann', 'frau', 'kind'],
    adjectives: ['gut', 'neu', 'erst', 'letzt', 'lang', 'groß', 'klein', 'eigen', 'ander', 'alt'],
    conjunctions: ['und', 'aber', 'oder', 'weil', 'wenn', 'als', 'dass', 'während', 'obwohl'],
    prepositions: ['in', 'auf', 'an', 'mit', 'durch', 'für', 'von', 'zu', 'über']
  },
  'zh-cn': {
    greetings: ['你好', '早上好', '下午好', '晚上好'],
    farewells: ['再见', '拜拜', '回头见', '保重'],
    questions: ['什么', '哪里', '何时', '为什么', '怎么样', '谁'],
    pronouns: ['我', '你', '他', '她', '它', '我们', '他们'],
    verbs: ['是', '有', '做', '去', '来', '看', '说', '想', '知道', '认为'],
    nouns: ['世界', '日子', '时间', '年', '人们', '方式', '事情', '男人', '女人', '孩子'],
    adjectives: ['好', '新', '第一', '最后', '长', '伟大', '小', '自己的', '其他', '老'],
    conjunctions: ['和', '但是', '或者', '因为', '如果', '当', '那', '而', '虽然'],
    prepositions: ['在', '上', '于', '与', '由', '为', '从', '到', '关于']
  }
};

/**
 * More sophisticated mock translation API
 * @param {string} text - Text to translate
 * @param {string} source - Source language code
 * @param {string} target - Target language code
 * @returns {Promise<Object>} - Translation result
 */
const mockTranslateAPI = async (text, source, target) => {
  return new Promise(async (resolve) => {
    // Add a small delay to simulate network latency
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(300);

    // Detect language if source is 'auto'
    const detectedSource = source === 'auto' ? detectLanguage(text) : source;

    // Get language code from language name if needed
    const sourceCode = source === 'auto' ? 'auto' : getLanguageCode(detectedSource) || source;
    const targetCode = getLanguageCode(target) || target;

    // Always try to use the Microsoft Translator API first
    try {
      console.log(`Attempting to translate with Microsoft API:
        - Source: ${sourceCode} (${detectedSource})
        - Target: ${targetCode}
        - Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      const apiResult = await translateWithAPI(text, sourceCode, targetCode);

      // If we got a valid result from the API, use it
      if (apiResult) {
        console.log('Successfully translated with Microsoft API');
        resolve(apiResult);
        return;
      } else {
        console.warn('API returned null result, falling back to mock translation');
      }
    } catch (error) {
      console.error('Translation API failed with error:', error);
      console.warn('Falling back to mock translation');
      // Continue to mock translation as fallback
    }

    // If API translation failed or we're using mock mode, use our improved mock translation
    const translatedText = improvedTranslate(text, targetCode);

    resolve({
      text: translatedText,
      source: sourceCode,
      isMock: true // Flag to indicate this is a mock translation
    });
  });
};

/**
 * Improved mock language detection
 * @param {string} text - Text to detect language for
 * @returns {string} - Detected language code
 */
const detectLanguage = (text) => {
  const lowerText = text.toLowerCase();

  // Count matches for each language
  const matches = {};

  // Check for matches in each language
  Object.entries(commonWords).forEach(([langCode, categories]) => {
    matches[langCode] = 0;

    // Check each category of words
    Object.values(categories).forEach(words => {
      words.forEach(word => {
        // Create a regex that matches the word with word boundaries
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const count = (lowerText.match(regex) || []).length;
        matches[langCode] += count;
      });
    });
  });

  // Find the language with the most matches
  let detectedLang = 'en'; // Default to English
  let maxMatches = 0;

  Object.entries(matches).forEach(([langCode, count]) => {
    if (count > maxMatches) {
      maxMatches = count;
      detectedLang = langCode;
    }
  });

  return detectedLang;
};
