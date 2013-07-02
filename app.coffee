###
    Module dependencies.
###
_ = require("underscore")
express = require('express')
routes = require('./routes')
home = require("./routes/home")
users = require('./routes/users')
http = require('http')
path = require('path');
database = require("./lib/database")

# creation de l'application
app = express();

# all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');

###
    SWIG TEMPLATING ENGINE ( TWIG  )
###
consolidate = require "consolidate"
swig = require 'swig'
app.engine '.twig', consolidate.swig
app.set 'view engine','html'
swig.init({
    root: __dirname+"/views/"
    allowErrors:true
    extensions:{"_":_}
})
app.set 'views',__dirname+"/views/"
# fin de la config swig

### REDIS ###
redis = require("redis")
db = redis.createClient(
    process.env.REDISTOGO_PORT,
    process.env.REDISTOGO_HOST
)
db.auth(process.env.REDISTOGO_PASSWORD, ->)
# online user tracking
app.use((req,res,next)->
    ua =req.headers['user-agent']
    db.zadd('online',Date.now(),ua,next)
)
# fetching online users in the last minute
app.use((req,res,next)->
    min=60*1000
    ago=Date.now()-min
    db.zrevrangebyscore("online","+inf",ago,(err,users)->
        if err then return next(err)
        req.online = users
        next()
    )
)

###
    MIDDLEWARES
###
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
else
    app.use (err,req,res,next)->
        console.error err.stack
        res.send 500, 'Something went wrong'

###
    LOCALS
###

app.locals.db = database

###
    ROUTES
###

app.get('/', routes.index)
app.all("/home",home.index)
app.post("/home/contact",home.createContact)
app.all("/home/contact",home.contact)
app.get('/users', users.index)
app.all("/users/new",users.new)
app.get("/users/:name",users.show)
app.all("/users/edit/:id",users.edit)

server = http.createServer(app).listen(app.get('port'), ->
    console.log('Express server listening on port ' + app.get('port'));
)
