###
    Module dependencies.
###
_ = require "lodash"
express = require 'express'

feeds = require './routes/feeds'
articles = require './routes/articles'
Pimple = require 'pimple'
Config=require './lib/config'
http = require 'http'
path = require 'path'

# creation de l'application
app = express();

app.map=(routes,prefix)->
    prefix=prefix||""
    for route,value of routes
        switch typeof value
            when "object"
                this.map(value,prefix+route)
            when "function"
                app[route](prefix,value)
    return


# all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');

### Configuration du conteneur d'injection de dépendance ###
app.DI = new Pimple
app.DI.register(Config)

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
    extensions:{"_":_},
    filters:{
        substring:(input,start,length)->
            result=""
            if typeof input == "string"
                result =  "".substring.call(input,start,length)
            return result
    }
})
app.set 'views',__dirname+"/views/"

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

###
    ROUTES
###
app.map
    '/':
        all:feeds.index

    '/feeds':
        '/byxmlurl/:xmlurl':
            all:feeds.byXmlUrl
        '/suscribe':
            post:feeds.suscribe
        '/:id':
            all:feeds.read
        all:feeds.index


    '/articles':
        '/:id':
            all:articles.read





###
    MY MIDDLEWARE
###
app.use((req,res,next)->
    res.set("Cache-Control","public")
    res.set("X-Powered-By","Me-Myself-And-I")
    next()
)

server = http.createServer(app).listen(app.get('port'), ->
    console.log('Express server listening on port ' + app.get('port'));
)

app.on("something",(-> console.log "hi"))
