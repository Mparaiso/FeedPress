module.exports = (container)->
    container.share("feedparser", (container)->
        feedparser = require('ortoo-feedparser');
        return {
            parse: (url,options)->
                return feedparser.parseUrl(url,options)
        }
    )