/*
 Database service provider
 */

module.exports = (function (container) {
    /* uses feedreader*/
    // utiliser  process.env.MONGODB_EXPRESS en production
    container.set("db.connection", process.env.MONGODB_EXPRESS);
    container.set('db.connection.options', {server:{keepAlive:1}});
    container.protect("db.connection.error_handler", console.error.bind(console, 'mongoose connection error:'));
    container.share('db', function (container) {

        var Article, ArticleSchema, Feed, FeedSchema, mongoose, url, db, feedparser, async;

        mongoose = require("mongoose");
        url = require("url");
        async = require("async");
        feedparser = container.get('feedparser');
        db = mongoose.connect(container.get("db.connection"), container.get("db.connection.options"));
        mongoose.connection.on('error', container.get("db.connection.error_handler"));
        /* Schemas*/
        ArticleSchema = new mongoose.Schema({
            title:String,
            description:String,
            summary:String,
            meta:mongoose.Schema.Types.Mixed,
            link:String,
            guid:{type:String, unique:true},
            categories:[String],
            tags:[String],
            pubDate:Date,
            _feed:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Feed"
            }
        });
        ArticleSchema.statics.findAllAndSortByPubDateDesc = function (callback) {
            return this.find({}, {}, {
                sort:{
                    "pubDate":-1
                }
            }, callback);
        };

        ArticleSchema.statics.findByTags = function (tags, callback) {
            return Article.find({categories:{"$in":tags}}, function (err, articles) {
                return callback.apply(callback, [].slice.call(arguments));
            });
        };
        /**
         * find by feed id
         * @param id
         * @param callback
         * @return {*|Query|Query|Cursor}
         */
        ArticleSchema.statics.findByFeedId = function (id, callback) {
            Article.find({__feed:id}, function (err, articles) {
                return callback(err, articles);
            });
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
        };
        ArticleSchema.pre("save", function (next, done) {
            console.log(typeof this, arguments);
            next();
        });

        /**
         * Feed schema
         * @type {mongoose.Schema}
         */
        FeedSchema = new mongoose.Schema({
            xmlurl:{type:String, unique:true},
            title:String,
            link:String,
            faviconurl:String,
            description:String
        });

        FeedSchema.pre("save", function (next) {
            //favicon ico url
            console.log("pre saving a Feed", this);
            next();
        });

        FeedSchema.statics.normalise = function (feed) {
        };

        FeedSchema.statics.hasBeenSuscribed = (function (url, callback) {
            return this.findOne({
                xmlurl:url
            }, function (err, feed) {
                if (err) {
                    return callback(err);
                } else if (feed) {
                    console.log(feed);
                    return callback(err, feed);
                } else {
                    return callback(err);
                }
            });
        });

        FeedSchema.methods.toString = function () {
            return "[object Feed]";
        };

        /**
         * Create articles from a feed
         * @param {Feed} url
         * @param {Function} callback
         * @returns {*}
         */
        FeedSchema.statics.createArticlesFromFeed = function (feed, callback) {
            var _url = feed.xmlurl;
            return container['feedparser'].parse(_url).on('complete',function (meta, articles) {
                    Article.find({}, 'guid', function (err, _articles) {
                        if (err)return callback(err);
                        var guids = _articles.map(function (article) {
                            return article.guid;
                        });
                        articles = articles.filter(function (article) {
                            return guids.indexOf(article.guid) < 0;
                        }).map(function (article) {
                                if (!article.meta.xmlurl) {
                                    article.meta.xmlurl = feed.xmlurl
                                }
                                article._feed = feed._id;
                                return article;
                            });
                        return Article.create(articles, function (err, article) {
                            if (err) {
                                callback(err);
                            } else if (article) {
                                var feed_url = url.parse(article.meta.link);
                                return feed.update({
                                    xmlurl:article.meta.xmlurl,
                                    link:article.meta.link,
                                    description:article.meta.description,
                                    title:article.meta.title,
                                    faviconurl:feed_url.protocol + "//" + feed_url.host + "/favicon.ico"
                                }, function (err, feed) {
                                    if (err) {
                                        return callback(err);
                                    } else {
                                        return callback(err, feed);
                                    }
                                });
                            } else {
                                callback();
                            }
                        });
                    });
                }
            ).on("error", function (err) {
                    return callback(err);
                }
            );
        };
        /**
         * suscribe ( or not ) a feed ,then created articles from that feed
         * @param {string} url
         * @param {Function} callback
         * @returns {*}
         */
        FeedSchema.statics.suscribe = function (url, callback) {
            if (!Feed.matchUrl(url))return callback(url + " is not a valid url");
            return Feed.hasBeenSuscribed(url, function (err, _feed) {
                if (err) {
                    return callback(err);
                } else if (_feed) {
                    return Feed.createArticlesFromFeed(_feed, callback);
                } else {
                    new Feed({xmlurl:url, _articles:[]}).save(function (err, feed) {
                        if (err) {
                            return callback(err);
                        } else {
                            return Feed.createArticlesFromFeed(feed, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback();
                                }
                            });
                        }
                    });
                }
            });
        };

        FeedSchema.statics.unsubscribe = function (id, callback) {
            return Feed.where().findOneAndRemove({_id:id}, function (err, feed) {
                if (err) {
                    return callback(err);
                } else {
                    return Article.where("meta.xmlurl").equals(feed.xmlurl).remove(callback);
                }
            });
        };

        FeedSchema.statics.matchUrl = function (url) {
            return url.match(/^(http|https)\:\/\/\w+\.\w+/);
        };
        /**
         * refresh all feeds
         * @param {Function} callback
         * @return {*}
         */
        FeedSchema.statics.refresh = function (callback) {
            return Feed.find(function (err, feeds) {
                if (err) {
                    callback.apply(null, [].slice.call(arguments));
                } else {
                    var doRefresh = function (feeds) {
                        var feed;
                        if (feed = feeds.pop()) {
                            Feed.createArticlesFromFeed(feed, function (err) {
                                if (err) {
                                    return callback(err);
                                } else {
                                    return doRefresh(feeds);
                                }
                            });
                        } else {
                            return callback();
                        }
                    };
                    return doRefresh(feeds);
                }
            });
        }
        /* Models*/
        FeedSchema.statics.import = function (xmlstring, callback) {
            feedparser.parseFromGoogleXmlString(xmlstring, function (err, results) {
                if (err) {
                    return callback(err);
                }
                for (var i in results) {
                    Feed.suscribe(results[i],function(){});
                }
                callback();
//                recurse = function (results) {
//                    var url = results.pop();
//                    return Feed.suscribe(url, function (err, r) {
//                        if (err) {
//                            container.logger.log(err);
//                        }
//                        if (results.length > 0) {
//                            return recurse(results);
//                        } else {
//                            return callback();
//                        }
//                    });
//                };
//                return recurse(results);
            });
        };
        Article = mongoose.model("Article", ArticleSchema);
        /**
         * représente une URL de feed
         * @typedef Feed
         */
        Feed = mongoose.model('Feed', FeedSchema);

        return mongoose
    });
});

