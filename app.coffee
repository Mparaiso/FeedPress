###
# création de l'application
express = require("express")
app = express()
# définition des routes
app.get("/hello.txt",(req,res)->
    body="Hello World"
    res.setHeader('Content-Type','text/plain')
    res.setHeader("Content-Length",body.length)
    res.end(body)
)
# calculation automatique de la longueur de la réponse
app.get "/hello2.txt",(req,res)->
    res.send("Hello word")

# lier et écouter les connections sur un port
app.listen(3000)

console.log("Listening on port 3000")
###


###
* Module dependencies.
###

express = require('express')
routes = require('./routes')
user = require('./routes/user')
http = require('http')
path = require('path');

app = express();

# all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')))

# development only
if 'development' == app.get('env')
    app.use(express.errorHandler())


app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), ->
    console.log('Express server listening on port ' + app.get('port'));
)
