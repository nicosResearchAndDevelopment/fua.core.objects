const util = exports;

util.isObject       = (value) => value && typeof value === 'object';
util.isNativeObject = (value) => util.isObject(value) && value.__proto__ === Object.prototype;
util.isArray        = (value) => Array.isArray(value);
util.isFunction     = (value) => typeof value === 'function';

util.sealModule = function (target) {
    Object.freeze(target);
    for (const child of Object.values(target)) {
        if (child instanceof Object) util.sealModule(child);
    }
};
