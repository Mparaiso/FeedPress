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

settings = require("./controllers/settings");

feeds = require('./controllers/feeds');

articles = require('./controllers/articles');

favorites = require('./controllers/favorites');

stream = require("./controllers/stream");

middlewares = require("./lib/middlewares");

Pimple = require('pimple');

Config = require('./lib/config');

http = require('http');

path = require('path');

app = express();

var everythingIsAFunction = function (a) {
    return typeof a === "function"
}

/**
 * Helper : mount routes with a single object
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
    allowErrors:false,
    cache:false,
    encoding:'utf8',
    extensions:{
    },
    filters:app.DI.get('filters')
});


/**
 * MIDDLEWARES
 */

app.use("/feeds", middlewares.countArticles);
app.use("/feeds", middlewares.countStared);
app.use("/feeds", middlewares.countUnread);
app.use("/feeds", middlewares.fetchFeeds);
app.use("/feeds", middlewares.fetchCategories);

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
        res.set("Refresh", "3;/");
        return res.render('error.twig', {message:'Something went wrong, redirecting to home page'});
    });
}


/**
 * ROUTES
 */
app.map({
        '/':{
            all:[middlewares.fetchCategories, middlewares.countArticles, middlewares.countStared, middlewares.countUnread, middlewares.fetchFeeds, feeds.index]
        },
        '/feeds':{
            '/search':{
                all:feeds.search
            },
            '/articles':{
                '/unread':{
                    get:articles.unread
                },
                '/bytags/:tag':{
                    get:feeds.byTags
                },
                '/:id':{
                    get:articles.read
                }
            },
            '/subscribe':{
                post:feeds.subscribe
            },
            '/unsubscribe/:id':{
                all:feeds.unsubscribe
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
            '/edit/:id':{
                all:[middlewares.createCategory,feeds.edit]
            },
            '/:id':{
                get:feeds.read
            },
            all:feeds.index
        },
        '/settings':{
            '/import':{
                post:settings.import
            },
            all:settings.index
        },
        '/stream/:url':{
            get:stream.index
        }
    }
);

/**
 * application bootstrap
 */
server = http.createServer(app).listen(app.get('port'), function () {
    return console.log('Express server listening on port ' + app.get('port'));
});



