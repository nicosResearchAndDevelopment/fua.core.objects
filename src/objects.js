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
    for (let source of sourceArr) {
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
 * @param {Object} target
 * @param {...Object} sourceArr
 * @returns {Object}
 */
objects.reduce = function (target = {}, ...sourceArr) {
    for (let source of sourceArr) {
        for (let [key, sVal] of Object.entries(source)) {
            const tVal = target[key];
            if (objects.equals(tVal, sVal)) delete target[key];
            else if (util.isNativeObject(sVal) && util.isNativeObject(tVal))
                objects.reduce(tVal, sVal);
        }
    }
    return target;
};

objects.freeze = function (target) {
    return Object.freeze(target);
};

objects.freeze.recursive = function (target) {
    if (!util.isObject(value) && !util.isFunction(value)) return target;
    if (Object.isFrozen(target)) return target;
    Object.freeze(target);
    Object.values(target).forEach(objects.freeze.recursive);
    return target;
};

// TODO lock/seal

util.sealModule(objects);
module.exports = objects;
