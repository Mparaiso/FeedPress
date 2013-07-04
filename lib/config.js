module.exports = function (container) {
    var database = require("./database");
    var feedparser = require("./feedparser");
    container.register(database);
    container.register(feedparser);
}