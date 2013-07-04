/**
 *
 * @type {{index: Function, read: Function, suscribe: Function}} FeedCtrl
 */
module.exports = {
    toString: function () {
        return "[object FeedCtrl]"
    },
    index: function (req, res,cb) {
        var db = req.app.DI.db;
        db.Article.findAllAndSortByPubDateDesc(function (err, articles) {
                if (err) {
                    return res.send(500, arguments);
                } else {
                    return db.Feed.find(function (err, feeds) {
                        if (err) {
                            res.send(500, arguments);
                        } else {
                            res.render("feeds/index.twig", {
                                articles: articles,
                                feeds: feeds
                            });
                        }
                    });
                }
            }
        );
    },
    suscribe: function (req, res) {
        var db, url;
        url = req.body.url;
        db = req.app.DI.db;
        if (url) {
            db.Feed.suscribe(url, function (err) {
                if (err) {
                    console.log(err);
                    res.send(500, err);
                } else {
                    res.redirect("/");
                }
            });
        } else {
            res.redirect("/");
        }
    },
    read: function (req, res) {
        var id = req.params.id;
        var db = req.app.DI.db;
        db.Article.findByFeedId(id, function (err, articles) {
            if (err) {
                return res.send(500, err);
            } else {
                return db.Feed.find(function (err, feeds) {
                    if (err) {
                        res.send(500, arguments);
                    } else {
                        res.render("feeds/index.twig", {
                            articles: articles,
                            feeds: feeds
                        });
                    }
                });
            }
        });
    },
    byXmlUrl: function (req, res) {
        var xmlurl = req.params.xmlurl;
        var db = req.app.DI.db;
        db.Article.find({'meta.xmlurl': xmlurl}, function (err, articles) {
            if (err) {
                return res.send(500, err);
            } else {
                return db.Feed.find(function (err, feeds) {
                    if (err) {
                        return res.send(500, err);
                    } else {
                        return res.render("feeds/index.twig", {articles: articles, feeds: feeds});
                    }
                });
            }
        });
    }
};
