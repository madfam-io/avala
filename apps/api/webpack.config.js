const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        '@avala/db': path.resolve(__dirname, '../../packages/db/src'),
      },
      extensions: ['.ts', '.js', '.json'],
    },
  };
};
