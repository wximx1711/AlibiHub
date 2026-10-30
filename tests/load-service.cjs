// Load production ES modules in Node; replace native platform boundaries only.
const fs = require('fs'), path = require('path'), vm = require('vm'), babel = require('@babel/core');
function loader(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (!path.extname(file)) file += '.js';
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const code = babel.transformSync(fs.readFileSync(file, 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'], filename: file }).code;
    const req = name => name in mocks ? mocks[name] : name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name);
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { console, setTimeout, clearTimeout, setInterval, clearInterval, URL, AbortController, fetch, process, ...globals }, { filename: file })(req, mod, mod.exports);
    return mod.exports;
  }
  return load;
}
function memoryStorage() {
  const values = new Map();
  return { values, async getItem(k) { return values.get(k) ?? null; }, async setItem(k,v) { values.set(k,v); }, async removeItem(k) { values.delete(k); }, async multiRemove(keys) { keys.forEach(k=>values.delete(k)); } };
}
module.exports = { loader, memoryStorage };
