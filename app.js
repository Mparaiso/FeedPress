// Generated by CoffeeScript 1.6.3
/*
 Module dependencies.
 */

var Config, Pimple, app, articles, consolidate, express, feeds, http, path, server, swig, _;

express = require('express');

routes = require("./routes");

settings = require("./routes/settings");

feeds = require('./routes/feeds');

articles = require('./routes/articles');

favorites = require('./routes/favorites');

Pimple = require('pimple');

Config = require('./lib/config');

http = require('http');

path = require('path');

app = express();

var everythingIsAFunction = function (a) {
    return typeof a === "function"
}

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
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

/* Configuration du conteneur d'injection de dépendance*/
app.DI = new Pimple();
app.DI.set("dispatcher", app);
app.DI.register(Config);

/*
 SWIG TEMPLATING ENGINE ( TWIG  )
 */
consolidate = require("consolidate");

swig = require('swig');

app.engine('.twig', consolidate.swig);

swig.init({
    root:__dirname + "/views/",
    allowErrors:true,
    extensions:{
        "_":_
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


/*
 MY MIDDLEWARE
 */

var countArticles = function (req, res, next) {
    req.app.DI.logger.log("counting articles");
    var db = req.app.DI.db;
    return db.model("Article").count(function (err, result) {
        req.app.set("article_count", result);
        next();
    });
}
var countStared = function (req, res, next) {
    req.app.DI.logger.log("counting stared");
    var db = req.app.DI.db;
    return db.model("Article").count({_favorite:true}, function (err, result) {
        req.app.set("favorite_count", result);
        next();
    });
}

var countUnread = function (req, res, next) {
    req.app.DI.logger.log("counting unread");
    var db = req.app.DI.db;
    return db.model("Article").count({_read:null}, function (err, result) {
        req.app.set("unread_count", result || 0);
        next();
    });
}

app.use("/feeds", countArticles);
app.use("/feeds", countStared);
app.use("/feeds", countUnread);

/*
 MIDDLEWARES
 */
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

app.use("/miniapp", require("./miniapp").router);

app.map({
        '/':{
            all:[countArticles, countStared, countUnread, feeds.index]
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
            '/suscribe':{
                post:feeds.suscribe
            },
            '/unsuscribe':{
                all:feeds.unsuscribe
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


server = http.createServer(app).listen(app.get('port'), function () {
    return console.log('Express server listening on port ' + app.get('port'));
});


