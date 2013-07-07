/**
 * FEEDPRESS
 * @author mparaiso <mparaiso@online.fr>
 * FeedPress! is a RSS Reader built with node.js
 * FeedPress! lets you suscribe feeds , read article online and import feeds from Google Reader
 * With FeedPress! you no longer needs to depend on a thirdparty RSS reader to consume RSS feeds.
 * @licence LGPL
 * @copyright mparaiso
 */
var Config, Pimple, app, articles, consolidate, express, feeds, http, path, server, swig;

express = require('express');

routes = require("./controllers");

settings = require("./controllers/settings");

feeds = require('./controllers/feeds');

articles = require('./controllers/articles');

favorites = require('./controllers/favorites');

Pimple = require('pimple');

Config = require('./lib/config');

http = require('http');

path = require('path');

app = express();

var everythingIsAFunction = function (a) {
    return typeof a === "function"
}

/**
 * Helps - routes with a single object
 * @param routes
 * @param prefix
 */
app.map = function (routes, prefix) {
    var route, value;
    prefix = prefix || "";
    for (route in routes) {
        value = routes[route];
        switch (typeof value) {
            case "object":
                if (value instanceof Array && value.every(everythingIsAFunction)) {
                    // if array , treat all the args as middleware except the last ( controller )
                    value.unshift(prefix);
                    app[route].apply(app, value);
                } else {
                    app.map(value, prefix + route);
                }
                break;
            case "function":
                app[route].call(app, prefix, value);
                break;
        }
    }
};

app.set('port', process.env.PORT || 3000);
app.set("title", "FeedPress!");
app.set("author", "Mparaiso");
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

/**
 * Dependency injection container
 * @type {Pimple}
 */
app.DI = new Pimple();
app.DI.set("dispatcher", app);
app.DI.register(Config);

/**
 * Swig template engine bootstraping
 */
consolidate = require("consolidate");

swig = require('swig');

app.engine('.twig', consolidate.swig);

swig.init({
    root:__dirname + "/views/",
    allowErrors:true,
    cache:true,
    encoding:'utf8',
    extensions:{
    },
    filters:{
        substring:function (input, start, length) {
            var result;
            result = "";
            if (typeof input === "string") {
                result = "".substring.call(input, start, length);
            }
            return result;
        }
    }
});


/**
 * MIDDLEWARES
 */

var countArticles = function (req, res, next) {
    req.app.DI.logger.log("counting articles");
    var db = req.app.DI.db;
    return db.model("Article").count(function (err, result) {
        req.app.set("article_count", result);
        next();
    });
};
var countStared = function (req, res, next) {
    req.app.DI.logger.log("counting stared");
    var db = req.app.DI.db;
    return db.model("Article").count({_favorite:true}, function (err, result) {
        req.app.set("favorite_count", result);
        next();
    });
};

var countUnread = function (req, res, next) {
    req.app.DI.logger.log("counting unread");
    var db = req.app.DI.db;
    return db.model("Article").count({_read:null}, function (err, result) {
        req.app.set("unread_count", result || 0);
        next();
    });
}

var fetchFeeds = function (req, res, next) {
    var db = req.app.DI.db;
    return db.model("Feed").find({}, "title xmlurl favicon", function (err, feeds) {
        if (err)req.app.DI.logger.log("error form fetchFeeds", err);
        if (feeds)app.locals.feeds = feeds;
        next();
    });
};

app.use("/feeds", countArticles);
app.use("/feeds", countStared);
app.use("/feeds", countUnread);
app.use("/feeds", fetchFeeds);

app.use(express.favicon());

app.use(express.logger('dev'));

app.use(express.bodyParser({keepExtensions:true, uploadDir:__dirname + '/upload'}));

app.use(express.methodOverride());

app.use(express.cookieParser('your secret here'));

app.use(express.session());

app.use(app.router);

app.use(require('less-middleware')({src:__dirname + '/public'}));

app.use(express["static"](path.join(__dirname, 'public')));

if ('development' === app.get('env')) {
    app.use(express.errorHandler());
} else {
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        //return res.send(500, 'Something went wrong');
        res.set("Refresh", "3;/");
        return res.render('error.twig', {message:'Something went wrong, redirecting to home page'});
    });
}

/**
 * ROUTES
 */

app.map({
        '/':{
            all:[countArticles, countStared, countUnread, fetchFeeds, feeds.index]
        },
        '/feeds':{
            '/articles':{
                '/unread':{
                    all:articles.unread
                },
                '/bytags/:tag':{
                    all:feeds.byTags
                },
                '/:id':{
                    all:articles.read
                }
            },
            '/subscribe':{
                post:feeds.subscribe
            },
            '/unsubscribe/:id':{
                all:feeds.unsubscribe
            },
            '/edit':{
                all:feeds.edit
            },
            '/refresh':{
                all:feeds.refresh
            },
            '/favorites/:id':{
                all:favorites.toggleFavorite
            },
            '/favorites':{
                all:favorites.index
            },
            '/:id':{
                all:feeds.read
            },
            all:feeds.index
        },
        '/search':{
            all:feeds.search
        },
        '/error':{
            all:routes.index
        },
        '/settings':{
            '/import':{
                post:settings.import
            },
            all:settings.index
        }
    }
);

/**
 * application bootstrap
 */
server = http.createServer(app).listen(app.get('port'), function () {
    return console.log('Express server listening on port ' + app.get('port'));
});


