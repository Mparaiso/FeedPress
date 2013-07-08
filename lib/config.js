module.exports = function (container) {
    var database = require("./database");
    var feedparser = require("./feedparser");
    var filters = require("./filters");
    container.set("filters",filters);
    container.set("logger", console);
    container.register(database, {
        "db.connection":process.env.MONGO_FEEDPRESS
    });
    container.register(feedparser);
}