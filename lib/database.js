/*
 Database service provider
 */

module.exports = (function (container) {
    /* uses feedreader*/
    // utiliser  process.env.MONGODB_EXPRESS en production
    container.set("db.connection", process.env.MONGODB_EXPRESS);
    container.set('db.connection.options', {server:{socketOptions:{keepAlive:1}}});
    container.protect("db.connection.error_handler", console.error.bind(console, 'mongoose connection error:'));
    container.share('db', function (container) {

            var Article, ArticleSchema, Feed, FeedSchema, Option, OptionSchema, mongoose, url, db, feedparser, async;
            mongoose = require("mongoose");
            url = require("url");
            feedparser = container.get('feedparser');
            mongoose.connect(container.get("db.connection"), container.get("db.connection.options"));
            mongoose.connection.on('error', container.get("db.connection.error_handler"));

            ArticleSchema = new mongoose.Schema({
                title:String,
                description:String,
                summary:String,
                meta:mongoose.Schema.Types.Mixed,
                link:String,
                guid:String,
                categories:[String],
                tags:[String],
                pubDate:Date,
                _feed:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Feed",
                    required:true
                },
                _favorite:Boolean,
                _read:Date
            });
            ArticleSchema.statics.findAllAndSortByPubDateDesc = function (callback) {
                return this.find({}, 'title pubDate _read meta.title _favorite',
                    {sort:{ pubDate:-1} }, callback);
            };
            ArticleSchema.statics.findByTags = function (tags, callback) {
                return Article.find({categories:{"$in":tags}}, callback);
            };
            ArticleSchema.statics.toggleFavorite = function (id, callback) {
                mongoose.model('Article').findOne({_id:id}, function (err, article) {
                    if (article) {
                        article._favorite = article._favorite ? !article._favorite : true;
                        article.save(callback);
                    } else {
                        console.log("article with id", id, "not found");
                        callback()
                    }
                });
            };
            ArticleSchema.statics.findByFeedId = function (id, callback) {
                ///console.log(id);
                Article.find({_feed:id}, 'title pubDate meta.title _read _favorite',
                    {sort:{pubDate:-1}}, callback);
            };
            ArticleSchema.statics.findUnread = function (callback) {
                ///console.log("searching unread")
                return Article.find({_read:null}, 'title pubDate meta.title _read _favorite',
                    {sort:{pubDate:-1}}, callback);
            };
            ArticleSchema.methods.toString = function () {
                return "[object Article]";
            };
            ArticleSchema.statics.search = function (words, callback) {
                //@note @mongo executer un SQL LIKE http://docs.mongodb.org/manual/reference/operator/regex/
                Article.find({"$or":[
                    {'meta.title':{$regex:words, $options:"i"}},
                    {title:{"$regex":words, $options:"ix"}},
                    {description:{$regex:words, $options:"ix"}},
                    {summary:{$regex:words, $options:"ix"}},
                    {categories:{"$in":[words]}}
                ]}, function () {
                    callback.apply(null, [].slice.call(arguments));
                });
            }
            ArticleSchema.statics.findFavorites = function (callback) {
                mongoose.model('Article').find({_favorite:true}, 'title pubDate meta.title _read _favorite',
                    function (err, favorites) {
                        callback(err, favorites);
                    }
                );
            };
            ArticleSchema.statics.findByIdAndMarkAsRead = function (id, callback) {
                Article.findOne({_id:id}, function (err, article) {
                    callback(err, article);
                    article._read = new Date();
                    article.save();
                });
            };

            /**
             * @class Article
             * @extends mongoose.Model
             */
            Article = mongoose.model("Article", ArticleSchema);

            FeedSchema = new mongoose.Schema({
                xmlurl:{type:String, unique:true},
                title:String,
                link:String,
                favicon:String,
                date:Date,
                description:String,
                _articles:[
                    {type:mongoose.Schema.Types.ObjectId, ref:'Article'}
                ]
            });
            FeedSchema.statics.hasBeenSuscribed = function (url, callback) {
                return this.findOne({xmlurl:url}, callback);
            }
            FeedSchema.methods.toString = function () {
                return "[object Feed]";
            };
            /**
             * try to guess the feed url
             */
            FeedSchema.statics.normalize = function (meta, url) {
                if (!meta.favicon) {
                    if (meta['rss:image'] && meta['rss:image'].url['#']) {
                        meta.favicon = meta['rss:image'].url['#'];
                    } else {
                        meta.favicon = meta.link + "/favicon.ico";
                    }
                }
                if (!meta.pubDate) {
                    if (meta.pubdate) {
                        meta.pubDate = meta.pubdate;
                    } else {
                        meta.pubDate = new Date();
                    }
                }
                if (!meta.xmlurl) {
                    if (meta.xmlUrl) {
                        meta.xmlurl = meta.xmlUrl
                    } else if (url.match(/(xml|rss|feed)/i)) {
                        meta.xmlurl = url;
                    } else if (meta['rss:link'] && meta['rss:link']['#']) {
                        meta.xmlurl = meta['rss:link']['#']
                    }
                }
                return meta;
            };
            /** abonner à un fil **/
            FeedSchema.statics.suscribe = function (url, callback, createArticles) {
                if (typeof createArticles === "undefined")createArticles = true;
                return container['feedparser'].parse(url, function (err, meta, articles) {
                    container.logger.log('feedparsed', url, err);
                    if (err)  return callback(err);
                    meta = Feed.normalize(meta, url);
                    var feed = new Feed(meta);
                    return feed.update(meta, {upsert:true}, function (err) {
                        if (err || createArticles == false)return callback(err);
                        return Article.find({}, 'link', function (err, _articles) {
                            var links = _articles.map(function (a) {
                                return a.link
                            });
                            articles = articles.filter(function (a) {
                                return links.indexOf(a.link) < 0;
                            }).map(function (a) {
                                    a._feed = feed._id;
                                    return a;
                                });
                            console.log("adding ", articles.length, "articles to", url);
                            return Article.create(articles, function (err, __articles) {
                                return callback(err, __articles);
                            });
                        });
                    });
                });
            }
            /** désabonner à un feed **/
            FeedSchema.statics.unsuscribe = function (id, cb) {
                return Feed.where().findOneAndRemove({_id:id}, function (err, feed) {
                    err ? cb(err) : Article.where("meta.xmlurl").equals(feed.xmlurl).remove(cb);
                });
            };
            /** verifier une url **/
            FeedSchema.statics.matchUrl = function (url) {
                return url.match(/^(http|https)\:\/\/\w+\.\w+/);
            };
            FeedSchema.statics.refresh = function (callback) {
                return Feed.find(function (err, feeds) {
                    if (err)return callback(err);
                    return Feed.find(function (err, feeds) {
                        if (err)return callback(err);
                        var i = 0;
                        var recurse = function (i) {
                            if (i < feeds.length) {
                                return Feed.suscribe(feeds[i++].xmlurl, function () {
                                    return recurse(i);
                                });
                            } else {
                                return callback();
                            }
                        }
                        recurse(i);
                    })
                });
            };

            FeedSchema.statics.import = function (xmlstring, callback) {
                feedparser.parseFromGoogleXmlString(xmlstring, function (err, results) {
                    if (err) return callback(err)
                    var len = results.length - 1;
                    var _cb = function (err, result) {
                        if (err)console.log(err);
                        if (--len >= 0) {
                            console.log("subscribing");
                            return Feed.suscribe(results[len], _cb)
                        } else {
                            return callback();
                        }
                    }
                    return Feed.suscribe(results[len], _cb);
                });
            };

            /**
             * @class Feed
             * @extends mongoose.Model
             */
            Feed = mongoose.model('Feed', FeedSchema);

            OptionSchema = new mongoose.Schema({
                key:String,
                value:mongoose.Schema.Types.Mixed
            });
            /**
             * @class a type
             * @extends mongoose.Model
             */
            Option = mongoose.model("Option", OptionSchema);

            return mongoose
        }
    )
    ;
});


