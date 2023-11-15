const
    util    = require('./util.js'),
    objects = {};

/**
 * @param {Object} subject
 * @param {Object} target
 * @returns {boolean}
 */
objects.matches = function (subject, target) {
    if (Object.is(subject, target)) return true;
    if (!(util.isObject(subject) && util.isObject(target))) return false;
    if (util.isArray(subject) && util.isArray(target))
        return subject.length === target.length && target.every((value, index) => objects.matches(subject[index], value));
    return Object.keys(target).every(key => objects.matches(subject[key], target[key]));
};

/**
 * @param {Object} subject
 * @param {Object} target
 * @returns {boolean}
 */
objects.equals = function (subject, target) {
    if (Object.is(subject, target)) return true;
    if (!(util.isObject(subject) && util.isObject(target))) return false;
    if (util.isArray(subject) && util.isArray(target))
        return subject.length === target.length && target.every((value, index) => objects.equals(subject[index], value));
    const sKeys = Object.keys(subject).sort(), tKeys = Object.keys(target).sort();
    return objects.equals(sKeys, tKeys) && objects.equals(sKeys.map(key => subject[key]), tKeys.map(key => target[key]));
};

/**
 * @param {Object} target
 * @param {...Object} sourceArr
 * @returns {Object}
 */
objects.extend = function (target = {}, ...sourceArr) {
    if (!util.isObjectLike(target)) return target;
    for (let source of sourceArr) {
        if (!util.isObjectLike(source)) continue;
        for (let [key, sVal] of Object.entries(source)) {
            const tVal  = target[key];
            target[key] = util.isNativeObject(sVal)
                ? objects.extend(util.isNativeObject(tVal) ? tVal : {}, sVal)
                : sVal;
        }
    }
    return target;
};

/**
 * @param {...Object} sourceArr
 * @returns {Object}
 */
objects.combine = function (...sourceArr) {
    return objects.extend({}, ...sourceArr);
};

/**
 * @param {Object} target
 * @param {...Object} sourceArr
 * @returns {Object}
 */
objects.reduce = function (target = {}, ...sourceArr) {
    if (!util.isObjectLike(target)) return target;
    for (let source of sourceArr) {
        if (!util.isObjectLike(source)) continue;
        for (let [key, sVal] of Object.entries(source)) {
            const tVal = target[key];
            if (objects.equals(tVal, sVal)) delete target[key];
            else if (util.isNativeObject(sVal) && util.isNativeObject(tVal))
                objects.reduce(tVal, sVal);
        }
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @returns {Readonly<T>}
 */
objects.freeze = function (target) {
    if (!util.isObjectLike(target)) return target;
    return Object.freeze(target);
};

/**
 * @template T
 * @param {T} target
 * @param {number} [depth=Infinity]
 * @returns {Readonly<T>}
 */
objects.freeze.recursive = function (target, depth = Infinity) {
    if (!util.isObjectLike(target)) return target;
    if (Object.isFrozen(target)) return target;
    Object.freeze(target);
    if (depth > 0) Object.values(target).forEach(value => objects.freeze.recursive(value, depth - 1));
    return target;
};

/**
 * @template T
 * @param {T} target
 * @returns {Readonly<T>}
 */
objects.seal = function (target) {
    if (!util.isObjectLike(target)) return target;
    return Object.seal(target);
};

/**
 * @template T
 * @param {T} target
 * @param {number} [depth=Infinity]
 * @returns {Readonly<T>}
 */
objects.seal.recursive = function (target, depth = Infinity) {
    if (!util.isObjectLike(target)) return target;
    if (Object.isSealed(target)) return target;
    Object.seal(target);
    if (depth > 0) Object.values(target).forEach(value => objects.seal.recursive(value, depth - 1));
    return target;
};

/**
 * @template T
 * @param {T} target
 * @returns {Readonly<T>}
 */
objects.lock = function (target) {
    if (!util.isObjectLike(target)) return target;
    const lock = {writable: false, configurable: false};
    for (let key of Object.keys(target)) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (writable) Object.defineProperty(target, key, lock);
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @param {number} [depth=Infinity]
 * @returns {Readonly<T>}
 */
objects.lock.recursive = function (target, depth = Infinity) {
    if (!util.isObjectLike(target)) return target;
    const lock = {writable: false, configurable: false};
    for (let [key, child] of Object.entries(target)) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (writable) {
            Object.defineProperty(target, key, lock);
            if (depth > 0) objects.lock.recursive(child, depth - 1);
        }
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @param {...Array<string | symbol | number>} keys
 * @returns {T | Readonly<T>}
 */
objects.lock.props = function (target, ...keys) {
    if (!util.isObjectLike(target)) return target;
    const lock = {writable: false, configurable: false};
    for (let key of keys) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (writable) Object.defineProperty(target, key, lock);
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @param {...Array<string | symbol | number>} keys
 * @returns {T}
 */
objects.lock.defaults = function (target, ...keys) {
    if (!util.isObjectLike(target)) return target;
    for (let key of keys) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (!writable) continue;
        let current = target[key], assigned = false;
        Object.defineProperty(target, key, {
            configurable: false,
            get() {
                return current;
            },
            set(value) {
                if (assigned) return;
                assigned = true;
                current  = value;
            }
        });
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @returns {T}
 */
objects.hide = function (target) {
    if (!util.isObjectLike(target)) return target;
    const hide = {enumerable: false};
    for (let key of Object.keys(target)) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (writable) Object.defineProperty(target, key, hide);
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @param {number} [depth=Infinity]
 * @returns {T}
 */
objects.hide.recursive = function (target, depth = Infinity) {
    if (!util.isObjectLike(target)) return target;
    const hide = {enumerable: false};
    for (let [key, child] of Object.entries(target)) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (writable) {
            Object.defineProperty(target, key, hide);
            if (depth > 0) objects.lock.recursive(child, depth - 1);
        }
    }
    return target;
};

/**
 * @template T
 * @param {T} target
 * @param {...Array<string | symbol | number>} keys
 * @returns {T}
 */
objects.hide.props = function (target, ...keys) {
    if (!util.isObjectLike(target)) return target;
    const hide = {enumerable: false};
    for (let key of keys) {
        const writable = !Object.prototype.hasOwnProperty.call(target, key) || Reflect.getOwnPropertyDescriptor(target, key).configurable;
        if (writable) Object.defineProperty(target, key, hide);
    }
    return target;
};

objects.freeze.recursive(objects);
module.exports = objects;
