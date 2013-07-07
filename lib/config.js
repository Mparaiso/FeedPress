module.exports = function (container) {
    var database = require("./database");
    var feedparser = require("./feedparser");
    container.set("logger", console);
    container.register(database, {
        "db.connection":process.env.MONGO_FEEDPRESS
    });
    container.register(feedparser);
}