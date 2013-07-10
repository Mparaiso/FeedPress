/*jslint node:true, es5: true, white: true ,plusplus: true,nomen: true, sloppy: true */
/*globals describe,it,expect,beforeEach */
var Pimple = require("pimple");
var config = require("lib/config");
var assert = require("lib/assert");
var fixtures = require("lib/fixtures");
var async = require("async");

describe("A Container", function () {
    var db, Feed, Category, Article , container = new Pimple();

    beforeEach(function (done) {
        async.series([
            function (callback) {
                db.model("Category").remove(callback);
            },
            function (callback) {
                db.model("Feed").remove(callback);
            },
            function (callback) {
                db.model("Article").remove(callback);
            }
        ], function () {
            done();
        });
    });

    container.register(config, {"db.connection":process.env.MONGO_FEEDPRESS_TEST, "db.debug":false});
    db = container.db;


    /**
     *
     * @type {Pimple}
     */
    it("is created", function () {
        assert.notNull(container);
        assert.notEqual(container.get("db"), null);
        assert.notEqual(container.db, null);
        Category = db.model("Category");
        Feed = db.model("Feed");
        Article = db.model("Article");


        describe("A Category", function () {
            var cat = new Category(fixtures.categories[0]);
            it("is saved", function (done) {
                cat.save(function () {
                    db.model("Category").find(function (err, categories) {
                        assert.equal(categories.length, 1);
                        done();
                    });
                });
            });
        });


        describe("2 feeds", function () {
            this.timeout(10000);
            var cat, feeds;
            it("are saved and assigned to a category", function (done) {
                async.series([
                    function (callback) {
                        db.model("Feed").create(fixtures.feeds, callback);
                    },
                    function (callback) {
                        db.model("Category").findOne(function (e, c) {
                            cat = c;
                            callback()
                        })
                    },
                    function (callback) {
                        db.model("Feed").find(function (err, _feeds) {
                            assert.equal(_feeds.length, 2);
                            feeds = _feeds;
                            callback();
                        });
                    }
                    ,
                    function (callback) {
                        db.model("Category").findOne(function (e, cat) {
                            cat._feeds = feeds.map(function (f) {
                                f._category = cat._id;
                                return f._id;
                            }).sort();

                            cat.save(function (err, category) {
                                assert.equal(category._feeds.length, 2);
                                callback();
                            });
                        });
                    }, function (cb) {
                        feeds[0].save(cb)
                    }, function (cb) {
                        feeds[1].save(cb)
                    },
                    function (callback) {
                        db.model("Category").getAllWithFeeds(function (e, categories) {
                            assert.equal(categories.length, 1);
                            assert.equal(categories[0]._feeds[0].title, fixtures.feeds[0].title);
                            callback();
                        });
                    }
                ], function () {
                    db.model("Feed").find(function (err, feeds) {
                        done()
                    })
                });
            })

            it(", when their category is removed ,should have their _category property undefined", function (done) {
                var cat;
                async.series([
                    function (cb) {
                        db.model("Category").findOne(function (err, _cat) {
                            cat = _cat;
                            cat.remove(cb);
                        });
                    },
                    function (cb) {
                        db.model("Feed").findOne(function (err, feed) {
                            assert.true(typeof feed._category === "undefined");
                            cb();
                        });
                    }
                ], function () {
                    done()
                });

            });


        });
    })

    it("has an article", function () {

        describe("An Article in a feed ", function () {
            var article, feed;

            it("is created", function (done) {
                async.series([
                    function (cb) {
                        db.model('Feed').create(fixtures.feeds, function (err, f) {
                            db.model("Feed").findOne(function (err, f) {
                                feed = f;
                                cb();
                            });
                        })
                    },
                    function (cb) {
                        article = new Article(fixtures.articles[0]);
                        article._feed = feed._id;
                        article.save(function (err, article) {
                            assert.null(err);
                            cb();
                        });
                    }

                ], function () {
                    done();
                });
            });

            it("can be populated with its related feed", function (done) {
                article.populate("_feed",function (err, article) {
                    assert.equal(article._feed.title,feed.title);
                    assert.equal(article._feed.xmlurl,feed.xmlurl);
                    assert.equal(article._feed.link,feed.link);
                    done();
                });

            });

            it(",when its feed is removed using Feed.unsubscribe, it is removed too",function(done){
                db.model("Feed").unsubscribe(feed._id,function(){
                    db.model("Article").find(function(err,articles){
                        assert.equal(articles.length,0);
                        done();
                    });
                });

            });
        });
    })


});
