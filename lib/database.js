/* jslint es5:true */
/*
 Database service provider
 */

module.exports = (function (container) {
    /* uses feedreader*/
    // utiliser  process.env.MONGODB_EXPRESS en production
    container.set("db.connection", process.env.MONGODB_EXPRESS);
    container.set('db.connection.options', {server:{socketOptions:{keepAlive:1}}});
    container.set("db.debug", process.env.NODE_ENV == "development");
    container.protect("db.connection.error_handler", console.error.bind(console, 'mongoose connection error:'));
    container.share('db', function (container) {

            var Sync, SyncSchema, Article, ArticleSchema, Category,
                CategorySchema, Feed, FeedSchema,
                mongoose, url, db, feedparser;
            mongoose = require("mongoose");
            url = require("url");
            feedparser = container.get('feedparser');
            //@note @mongoose actioner le mode debug @see https://groups.google.com/forum/#!topic/mongoose-orm/aCMpWx587b4
            mongoose.set("debug", container.get('db.debug'));
            mongoose.connection.on('error', container.get("db.connection.error_handler"));
            mongoose.connect(container.get("db.connection"), container.get("db.connection.options"));


            ArticleSchema = new mongoose.Schema({
                title:{type:String, required:true},
                description:String,
                summary:String,
                meta:mongoose.Schema.Types.Mixed,
                link:{type:String, required:true},
                guid:String,
                categories:[String],
                tags:[String],
                pubDate:{type:Date, default:Date.now},
                _feed:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Feed",
                    required:true
                },
                _favorite:Boolean,
                _read:Date,
                _created_at:{type:Date, default:Date.now}
            });
            ArticleSchema.statics.findAllAndSortByPubDateDesc = function (options, callback) {
                options = options || {};
                options.sort = { pubDate:-1};
                return this.find({_feed:{$exists:true}}, 'title pubDate _read meta.title _favorite link _feed',
                    options).lean().populate({path:'_feed'}).exec(callback);
            };
            ArticleSchema.statics.findByTags = function (tags, callback) {
                return Article.find({categories:{"$in":tags}}, 'title _id _feed link pubDate', {sort:{pubDate:-1}}).
                    lean().populate({path:'_feed', select:'title _id'}).exec(callback);
            };
            ArticleSchema.statics.toggleFavorite = function (id, callback) {
                mongoose.model('Article').findOne({_id:id}, function (err, article) {
                    if (article) {
                        article._favorite = article._favorite ? !article._favorite : true;
                        article.save(callback);
                    } else {
                        console.log("article with id", id, "not found");
                        callback();
                    }
                });
            };
            ArticleSchema.statics.findByFeedId = function (id, callback) {
                ///console.log(id);
                Article.find({_feed:id}, 'pubDate title  meta.title _read _favorite link _feed',
                    {sort:{pubDate:-1}}).populate({path:'_feed', select:'title _id'}).exec(callback);
            };
            ArticleSchema.statics.findUnread = function (options, callback) {
                options = options || {};
                options.sort = {pubDate:-1};
                return Article.find({_read:null}, 'pubDate title  meta.title _read _favorite link _feed',
                    options).populate({path:'_feed', select:'title _id link', model:Feed}).lean().exec(callback);
            };
            ArticleSchema.statics.findByCategory = function (id, callback) {
                return Category.findOne({_id:id}).lean().populate({path:"_feeds", select:"id title _articles xmlurl", model:"Feed"}).exec(
                    function (err, category) {
                        if (err) {
                            return callback(err)
                        } else {
                            console.log(category);
                        }
                        var articleIds = [].concat.apply([], category._feeds.map(function (feed) {
                            return feed._articles
                        }))
                        return Article.find({_id:{$in:articleIds}}).lean().populate({path:"_feed"}).exec(callback);
                    }
                );
            };
            ArticleSchema.statics.findByCategoryTitle = function (title, callback) {
                return Category.findOne({ title:title }).lean().populate({path:"_feeds", select:"id title _articles xmlurl", model:"Feed"}).exec(
                    function (err, category) {
                        if (err || !category) {
                            return callback(err);
                        } else {
                            console.log(category);
                        }
                        var articleIds = [].concat.apply([], category._feeds.map(function (feed) {
                            return feed._articles;
                        }))
                        return Article.find({_id:{$in:articleIds}}).lean().sort("-pubDate").populate({path:"_feed"}).exec(callback);
                    }
                );
            };
            ArticleSchema.methods.toString = function () {
                return "[object Article]";
            };
            ArticleSchema.statics.search = function (words, callback) {
                //@note @mongo executer un SQL LIKE http://docs.mongodb.org/manual/reference/operator/regex/
                Article.find({"$or":[
                    {'meta.title':{$regex:words, $options:"i"}},
                    {title:{$regex:words, $options:"i"}},
                    {description:{$regex:words, $options:"ix"}},
                    {summary:{$regex:words, $options:"ix"}},
                    {categories:{"$in":[words]}}
                ]}, 'pubDate title link _id _feed ', {sort:{pubDate:-1}}).populate({path:'_feed', select:'title _id'}).exec(callback)
            };
            ArticleSchema.statics.findFavorites = function (callback) {
                mongoose.model('Article').find({_favorite:true}, 'title pubDate meta.title _read _favorite _feed')
                    .populate({path:'_feed', select:'title _id'}).exec(callback);
            };
            ArticleSchema.statics.findByIdAndMarkAsRead = function (id, callback) {
                Article.findOne({_id:id}, function (err, article) {
                    callback(err, article);
                    article._read = new Date();
                    article.save();
                });
            };

            ArticleSchema.pre("validate", function (next) {
                var self = this;
                //find feed and add it to the article
                if (!this._feed) {
                    Feed.findOne({xmlurl:this.meta.xmlurl}, function (err, feed) {
                        if (err)throw err;
                        self._feed = feed._id;
                        next();
                    });
                } else {
                    next();
                }
            });

            /**
             * @class Article
             * @extends mongoose.Model
             */

            FeedSchema = new mongoose.Schema({
                xmlurl:{type:String, unique:true, required:true},
                title:{type:String, required:true},
                original_title:String,
                link:{type:String, required:true},
                favicon:String,
                date:Date,
                description:String,
                _articles:[
                    {type:mongoose.Schema.Types.ObjectId, ref:'Article'}
                ],
                _created_at:{type:Date, default:Date.now},
                _category:{type:mongoose.Schema.Types.ObjectId, ref:"Category"}

            });
            FeedSchema.pre('validate', function (next) {
                if (!this.original_title) {
                    this.original_title = this.title;
                }
                next();
            });
            FeedSchema.pre('save', function (next) {
                var self = this;
                return Article.find({_feed:this._id}, '_id', function (err, articles) {
                    if (err) {
                        return next()
                    } else {
                        if (!self._articles)self._articles = [];
                        [].push.apply(self._articles, articles.map(function (a) {
                            return a._id
                        }));
                        return next();
                    }
                });
            });
            FeedSchema.post("save", function (feed) {
                if (feed._category) {
                    feed.populate('_category', function (err, feed) {
                        if (err) {
                            container.logger.log("FeedSchema.post save", err);
                        } else {
                            if (feed._category._feeds.indexOf(feed._id) < 0) {
                                feed._category._feeds.push(feed._id);
                                feed._category.save();
                            }
                        }
                    });
                }
            });
            FeedSchema.methods.toString = function () {
                return "[object Feed]";
            };
            FeedSchema.statics.getWithNoCategory = function (callback) {
                return Feed.find({_category:null}, callback);
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
            /**
             * Suscribe a feed.
             * @param url
             * @param callback
             * @return {mongoose.Schema.Types.ObjectID} the ID of the suscribed feed
             */
            FeedSchema.statics.subscribe = function (url, callback) {
                return container['feedparser'].parse(url, function (err, meta, articles) {
                    if (err)return callback(err);
                    meta = Feed.normalize(meta, url);
                    return Feed.update({xmlurl:meta.xmlurl}, meta, {upsert:true}, function (err, feed) {
                        if (err)return callback(err);
                        return Feed.findOne({xmlurl:meta.xmlurl}, 'xmlurl', function (err, feed) {
                            if (err)return callback(err);
                            return Article.find({'meta.xmlurl':feed.xmlurl}, 'link', function (err, _articles) {
                                console.log(articles.length, "articles found in feed", feed.xmlurl);
                                var links = _articles.map(function (a) {
                                    return a.link;
                                });
                                articles = articles.filter(function (a) {
                                    return links.indexOf(a.link) < 0;
                                });
                                return Article.create(articles, function (err) {
                                    if (!err)container.logger.log("article saved : ", arguments.length - 1);
                                    var articleIDS = [].slice.call(arguments).slice(1, arguments.length).map(function (a) {
                                        return a._id
                                    });
                                    feed._articles = feed._articles || [];
                                    console.log('article ids', articleIDS);
                                    feed._articles.concat(articleIDS);
                                    feed.save(callback);
                                });
                            });
                        });
                    });
                });
            };
            /** désabonner à un feed **/
            FeedSchema.statics.unsubscribe = function (id, cb) {
                return Feed.findOneAndRemove({_id:id}, function (err, feed) {
                    if (err) {
                        cb(err);
                    } else {
                        Article.where("_feed").equals(id).remove(function (err, articlesRemoved) {
                            return cb(err, feed);
                        });
                    }
                });
            };
            /** verifier une url **/
            FeedSchema.statics.matchUrl = function (url) {
                return url.match(/^(http|https)\:\/\/\w+\.\w+/);
            };
            /**
             * refresh all subscribed feeds
             * @param {Function} callback
             * @return {*}
             */
            FeedSchema.statics.refresh = function (callback) {
                return Feed.find(function (err, feeds) {
                    if (err)return callback(err);
                    new Sync().save();
                    feeds = feeds.filter(function (feed) {
                        return ( feed && feed.xmlurl);
                    });
                    var i = 0;
                    var _cb = function (err, feed) {
                        if (err)console.log(err);
                        i += 1;
                        if (i < feeds.length) {
                            return Feed.subscribe(feeds[i].xmlurl, _cb);
                        } else {
                            return callback();
                        }
                    }
                    return Feed.subscribe(feeds[i].xmlurl, _cb);
                })
            };
            FeedSchema.statics.import = function (xmlstring, callback) {
                return feedparser.parseFromGoogleXmlString(xmlstring, function (err, results) {
                    if (err) return callback(err)
                    var len = results.length - 1;
                    var _cb = function (err, result) {
                        if (err)console.log(err);
                        if (!results[len]) {
                            --len;
                        }
                        if (--len >= 0) {
                            console.log("subscribing");
                            return Feed.subscribe(results[len], _cb);
                        } else {
                            return callback();
                        }
                    }
                    return Feed.subscribe(results[len], _cb);
                });
            };

            /**
             * @class Feed
             * @extends mongoose.Model
             */

            CategorySchema = new mongoose.Schema({
                title:{type:String, unqiue:true, required:true},
                created_at:{type:Date, default:Date.now},
                order:Number,
                _feeds:[
                    {type:mongoose.Schema.Types.ObjectId, ref:"Feed"}
                ]
            });
            CategorySchema.methods.toString = function () {
                return "[object Category]";
            };
            CategorySchema.statics.getAllWithFeeds = function (callback) {
                return Category.find().populate('_feeds').exec(callback);
            };

            CategorySchema.pre("remove", function (next) {
                // clean up
                Feed.find({_category:this._id}, function (err, feeds) {
                    var l = feeds.length - 1;
                    var cb = function () {
                        if (l < 0) {
                            return next();
                        } else {
                            feeds[l]._category = undefined;
                            return feeds[l].save(function () {
                                l -= 1;
                                return cb();
                            });
                        }
                    }
                    return cb();
                });
            });

            SyncSchema = new mongoose.Schema({
                date:{ type:Date, default:Date.now }
            });

            Category = mongoose.model("Category", CategorySchema);

            Article = mongoose.model("Article", ArticleSchema);

            Feed = mongoose.model('Feed', FeedSchema);

            Sync = mongoose.model('Sync', SyncSchema);

            return mongoose;
        }
    );
});


