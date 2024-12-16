// frontend/src/config/countries.js

export const SUPPORTED_COUNTRIES = {
  HI: {
    code: 'HI',
    languageCode: 'hi-IN',
    name: 'Hindi',
    locale: 'hi',
    rtl: false,
    avatar: 'अ',
  },
  RU: {
    code: 'RU',
    languageCode: 'ru-RU',
    name: 'Russian',
    locale: 'ru',
    rtl: false,
    avatar: 'Б',
  },
  US: {
    code: 'US',
    languageCode: 'en-US',
    name: 'English',
    locale: 'en',
    rtl: false,
    avatar: 'C',
  },
  DE: {
    code: 'DE',
    languageCode: 'de-DE',
    name: 'German',
    locale: 'de',
    rtl: false,
    avatar: 'D',
  },
  CN: {
    code: 'CN',
    languageCode: 'zh-CN',
    name: 'Chinese (Simplified)',
    locale: 'zh',
    rtl: false,
    avatar: '戊',
  },
  AE: {
    code: 'AE',
    languageCode: 'ar-AE',
    name: 'Arabic',
    locale: 'ar',
    rtl: true,
    avatar: 'و',
  },
  MR: {
    code: 'MR',
    languageCode: 'mr-IN',
    name: 'Marathi',
    locale: 'mr',
    rtl: false,
    avatar: 'ऐ',
  },
};

// Helper functions
export const getCountriesList = () => Object.values(SUPPORTED_COUNTRIES);

export const getLocales = () =>
  Object.values(SUPPORTED_COUNTRIES).map((country) => country.locale);

export const getLanguageName = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.name : null;
};

export const getLanguageAvatar = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.avatar : languageCode.charAt(0).toUpperCase();
};

export const isRTL = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.rtl : false;
};
