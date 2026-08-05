const util = require('util');
if (typeof util.deprecate !== 'function') {
  util.deprecate = function (fn) {
    return fn;
  };
}

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
