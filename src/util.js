const util = exports;

util.isObject       = (value) => value && typeof value === 'object';
util.isNativeObject = (value) => util.isObject(value) && value.__proto__ === Object.prototype;
util.isArray        = (value) => Array.isArray(value);
util.isFunction     = (value) => typeof value === 'function';
util.isObjectLike   = (value) => util.isObject(value) || util.isFunction(value);
