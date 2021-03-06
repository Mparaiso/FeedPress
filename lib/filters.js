/**
 * Filters for swig templating engine
 * @type {Object}
 */
module.exports = {
    substring:function (input, start, length) {
        var result;
        result = "";
        if (typeof input === "string") {
            result = "".substring.call(input, start, length);
        }
        return result;
    },
    is_undefined:function (input) {
        return typeof input === "undefined";
    },
    plus:function (input, number) {
        return +input + number;
    },
    equals:function (input, arg) {
        return input == arg;
//        return [].reduce.call(arguments, function (prev, current) {
//            return prev == current;
//        }, true);
    },
    getTotalArticlesForCategory:function (category) {
        var res = category._feeds.reduce(function(prev,next){
            debugger;
            return prev+next._articles.length;
        },0);
        return res;
    },
    trim:function(input){
        return input.trim();
    }
};