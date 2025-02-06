// frontend/src/config/countries.js

export const SUPPORTED_COUNTRIES = {
  HI: {
    code: 'HI',
    languageCode: 'hi-IN',
    speechCode: 'hi-IN',
    name: 'Hindi',
    spokenName: 'Hindi', // Same as written for Hindi
    locale: 'hi',
    rtl: false,
    avatar: 'अ',
  },
  RU: {
    code: 'RU',
    languageCode: 'ru-RU',
    speechCode: 'ru-RU',
    name: 'Russian',
    spokenName: 'Russian', // Same as written for Russian
    locale: 'ru',
    rtl: false,
    avatar: 'Б',
  },
  US: {
    code: 'US',
    languageCode: 'en-US',
    speechCode: 'en-US',
    name: 'English',
    spokenName: 'English', // Same as written for English
    locale: 'en',
    rtl: false,
    avatar: 'C',
  },
  DE: {
    code: 'DE',
    languageCode: 'de-DE',
    speechCode: 'de-DE',
    name: 'German',
    spokenName: 'German', // Same as written for German
    locale: 'de',
    rtl: false,
    avatar: 'D',
  },
  CN: {
    code: 'CN',
    languageCode: 'zh-CN',
    speechCode: 'cmn-CN',
    name: 'Chinese (Simplified)', // Written language name
    spokenName: 'Mandarin', // Spoken language name
    locale: 'zh',
    rtl: false,
    avatar: '戊',
  },
  AE: {
    code: 'AE',
    languageCode: 'ar-AE',
    speechCode: 'ar-AE',
    name: 'Arabic',
    spokenName: 'Arabic', // Same as written for Arabic
    locale: 'ar',
    rtl: true,
    avatar: 'و',
  },
  MR: {
    code: 'MR',
    languageCode: 'mr-IN',
    speechCode: 'mr-IN',
    name: 'Marathi',
    spokenName: 'Marathi', // Same as written for Marathi
    locale: 'mr',
    rtl: false,
    avatar: 'ऐ',
  },
};

// Existing helper functions
export const getCountriesList = () => Object.values(SUPPORTED_COUNTRIES);

export const getLocales = () =>
  Object.values(SUPPORTED_COUNTRIES).map((country) => country.locale);

export const getLanguageName = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.name : null;
};

// New function to get spoken language name
export const getSpokenLanguageName = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.spokenName : null;
};

export const getLocaleForLanguageCode = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.locale : null;
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

export const getSpeechCode = (languageCode) => {
  const country = Object.values(SUPPORTED_COUNTRIES).find(
    (c) => c.languageCode === languageCode,
  );
  return country ? country.speechCode : languageCode;
};

export const getSpeechCodeFromCountry = (countryCode) => {
  const country = SUPPORTED_COUNTRIES[countryCode];
  return country ? country.speechCode : null;
};
