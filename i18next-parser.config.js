module.exports = {
  locales: ['en', 'hi', 'ru', 'de', 'zh', 'ar'], // Define the languages you support
  output: 'public/locales/$LOCALE/$NAMESPACE.json', // Where the JSON files should be created
  keySeparator: false, // Set to false if you use dot notation in keys (e.g., 'common.welcome')
  namespaceSeparator: false, // Set to false if you don't want to use namespaces
  createOldCatalogs: false, // Don't create old catalog files for removed keys
  indentation: 2, // JSON indentation
  lexers: {
    js: ['JavascriptLexer'], // Extract translations from JavaScript and JSX
    jsx: ['JavascriptLexer'],
  },
};
