// Generated by CoffeeScript 1.6.3
/*
    Module dependencies.
*/

var app, consolidate, db, express, http, path, redis, routes, swig, user, _;

_ = require("underscore");

express = require('express');

routes = require('./routes');

user = require('./routes/user');

http = require('http');

path = require('path');

app = express();

app.set('port', process.env.PORT || 3000);

app.set('views', __dirname + '/views');

/*
    SWIG TEMPLATING ENGINE ( TWIG  )
*/


consolidate = require("consolidate");

swig = require('swig');

app.engine('.twig', consolidate.swig);

app.set('view engine', 'html');

swig.init({
  root: __dirname + "/views/",
  allowErrors: true,
  extensions: {
    "_": _
  }
});

app.set('views', __dirname + "/views/");

/* REDIS*/


redis = require("redis");

db = redis.createClient(9400, "beardfish.redistogo.com");

db.auth("b4e7177ca59109c8dd5739c59a429901", function() {});

app.use(function(req, res, next) {
  var ua;
  ua = req.headers['user-agent'];
  return db.zadd('online', Date.now(), ua, next);
});

app.use(function(req, res, next) {
  var ago, min;
  min = 60 * 1000;
  ago = Date.now() - min;
  return db.zrevrangebyscore("online", "+inf", ago, function(err, users) {
    if (err) {
      return next(err);
    }
    req.online = users;
    return next();
  });
});

app.use(express.favicon());

app.use(express.logger('dev'));

app.use(express.bodyParser());

app.use(express.methodOverride());

app.use(express.cookieParser('your secret here'));

app.use(express.session());

app.use(app.router);

app.use(require('less-middleware')({
  src: __dirname + '/public'
}));

app.use(express["static"](path.join(__dirname, 'public')));

if ('development' === app.get('env')) {
  app.use(express.errorHandler());
} else {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    return res.send(500, 'Something went wrog');
  });
}

app.get('/', routes.index);

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function() {
  return console.log('Express server listening on port ' + app.get('port'));
});

/*
//@ sourceMappingURL=app.map
*/
