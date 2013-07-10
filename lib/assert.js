/**
 *
 * @type {assert}
 */
var assert = require("assert");
/**
 *
 * @param o
 */
assert.notNull = function (o) {
    if (o === null) {
        console.error(o);
        throw "object is null";
    }
};

/**
 *
 * @param o
 */
assert.null = function (o) {
    if (o !== null) {
        console.error(o);
        throw "object is not null";
    }
};

/**
 *
 * @param o
 */
assert.true = function (o) {
    if (o !== true) {
        console.error(o);
        throw "object is not true";
    }
};

module.exports = assert;