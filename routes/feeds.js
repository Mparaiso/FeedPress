/**
 *
 * @type {{index: Function, read: Function, suscribe: Function}} FeedCtrl
 */
module.exports = {
    toString:function () {
        return "[object FeedCtrl]"
    },
    index:function (req, res, cb) {
        var db = req.app.DI.db;
        db.model('Article').findAllAndSortByPubDateDesc(function (err, articles) {
                if (err) {
                    return res.send(500, arguments);
                } else {
                    return db.model('Feed').find(function (err, feeds) {
                        if (err) {
                            res.send(500, arguments);
                        } else {
                            res.render("feeds/index.twig", {
                                articles:articles,
                                feeds:feeds
                            });
                        }
                    });
                }
            }
        );
    },
    suscribe:function (req, res) {
        var db, url;
        url = req.body.url;
        db = req.app.DI.db;
        if (url) {
            db.model('Feed').suscribe(url, function (err) {
                if (err) {
                    console.log(err)
                    throw err
                } else {
                    res.redirect("/");
                }
            });
        } else {
            res.redirect("/");
        }
    },
    /**
     * display one article
     * @param req
     * @param res
     */
    read:function (req, res) {
        var id = req.params.id;
        var db = req.app.DI.db;
        db.model('Article').findByFeedId(id, function (err, articles) {
            if (err) {
                return res.send(500, err);
            } else {
                return db.model('Feed').find(function (err, feeds) {
                    if (err) {
                        res.send(500, arguments);
                    } else {
                        res.render("feeds/index.twig", {
                            articles:articles,
                            feeds:feeds
                        });
                    }
                });
            }
        });
    },
    /**
     * display articles according to a feed
     * @param req
     * @param res
     */
    byXmlUrl:function (req, res) {
        var xmlurl = req.params.xmlurl;
        var db = req.app.DI.db;
        db.model('Article').find({'meta.xmlurl':xmlurl}, function (err, articles) {
            if (err) {
                return res.send(500, err);
            } else {
                return db.model('Feed').find(function (err, feeds) {
                    if (err) {
                        return res.send(500, err);
                    } else {
                        return res.render("feeds/index.twig", {articles:articles, feeds:feeds});
                    }
                });
            }
        });
    },
    /**
     * display articles by tags
     * @param req
     * @param res
     */
    byTags:function (req, res) {
        db = req.app.DI.db;
        tags = [req.params.tag]
        db.model('Article').findByTags(tags, function (err, articles) {
            if (err) {
                return res.send(500, err);
            } else {
                return db.model('Feed').find(function (err, feeds) {
                    if (err) {
                        return res.send(500, err);
                    } else {
                        return res.render("feeds/index.twig", {feeds:feeds, articles:articles});
                    }
                });
            }
        });
    },
    /**
     * refresh all the suscribed feeds
     * @param {request} req
     * @param {response} res
     */
    refresh:function (req, res) {
        db = req.app.DI.db
        db.model('Feed').refresh(function (err, done) {
            if (err) {
                res.send(500, err);
            } else {
                res.send({message:"All feeds have been refreshed"})
            }
        });
    },

    unsuscribe:function (req, res) {
        var db = req.app.DI.db;
        db.model('Feed').unsubscribe(req.params.objectid, function (err) {
            console.log("feed unsubscribe", arguments);
            res.redirect("/");
        });
    },
    search:function (req, res) {
        var db = req.app.DI.db
            , q = req.query.q||"";
        db.model('Article').search(q, function (err, articles) {
            console.log(err);
            if (err) {
                res.send(500, err);
            } else {
                db.model('Feed').find(function (err, feeds) {
                    console.log(err);
                    if (err) {
                        res.send(500, err);
                    } else {
                        res.render("feeds/index.twig", {articles:articles, feeds:feeds});
                    }
                });
            }
        });

    }
};
