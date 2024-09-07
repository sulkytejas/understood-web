import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const storedLocale = localStorage.getItem('locale') || 'en';
// Initialize i18n
i18n
  .use(HttpBackend) // Load translations from your server or public folder
  .use(LanguageDetector) // Automatically detect the user's language
  .use(initReactI18next) // Bind react-i18next to the i18n instance
  .init({
    fallbackLng: 'en', // Default language when no language is detected
    lng: storedLocale,
    debug: true, // Enable debug mode in the console for development
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    backend: {
      // Path to your translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      // Options for language detection
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
    },
  });

export default i18n;
