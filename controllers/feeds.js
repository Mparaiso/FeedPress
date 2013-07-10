/*jslint node:true, es5: true, white: true ,plusplus: true,nomen: true, sloppy: true */
/*globals angular */
/**
 *
 * @type {{index: Function, read: Function, suscribe: Function}} FeedCtrl
 */
module.exports = {
    toString:function () {
        return "[object FeedCtrl]";
    },
    index:function (req, res) {
        var params = {}, skip, last, db = req.app.DI.db;
        params.limit = 30;
        last = Math.floor(res.locals.article_count / params.limit);
        skip = req.query.skip < last && req.query.skip > 0 ? req.query.skip : 0;
        params.skip = skip * params.limit;
        db.model('Article').findUnread(params, function (err, articles) {
            if (err) {
                return res.send(500, arguments);
            } else {
                return res.render("feeds/index.twig", {
                    articles:articles,
                    skip:skip,
                    last:last,
                    subtitle:"Latest Articles"
                });
            }
        });
    },
    subscribe:function (req, res) {
        //@note @node @express set the request timeout
        req.socket.setTimeout(10 * 60 * 1000);
        var db, url;
        url = req.body.url;
        db = req.app.DI.db;
        if (url) {
            db.model('Feed').subscribe(url, function (err, feed) {
                console.log("feed", feed);
                if (err) {
                    console.log(req.url, err);
                    req.flash("error", ["Error subscribing feed", feed.title].join(" "));
                } else {
                    req.flash("info", ["Feed", feed.title, "subscribed"].join(" "));
                }
                res.redirect("/feeds/" + feed._id);
            });
        } else {
            res.redirect("/");
        }
    },
    /**
     * find articles by feed
     * @param req
     * @param res
     */
    read:function (req, res) {
        var id = req.params.id;
        var db = req.app.DI.db;
        return db.model('Feed').findOne({_id:id}).populate({path:"_articles", select:"link _read _favorite pubDate title meta.title"})
            .lean().exec(function (err, feed) {
                if (err) return res.send(500, arguments);
                feed._articles.forEach(function (a) {
                    a._feed = feed;
                });
                return res.render("feeds/index.twig", { articles:feed._articles, feed_id:feed._id, subtitle:feed.title});
            }
        );
    },
    /**
     * display articles by tags
     * @param req
     * @param res
     */
    byTags:function (req, res) {
        var db = req.app.DI.db;
        var tags = [req.params.tag];
        db.model('Article').findByTags(tags, function (err, articles) {
            if (err)  return res.send(500, err);
            return res.render("feeds/index.twig", {articles:articles, subtitle:"Tags: " + tags.join(" ")});
        });
    },
    byCategory:function (req, res) {
        var db = req.app.DI.db;
        var id = req.params.id;
        db.model("Article").findByCategory(id, function (err, articles) {
            err ? res.send(500, err) : res.render("feeds/index.twig", {articles:articles, subtitle:"By Category"});
        });
    },
    /**
     * refresh all the suscribed feeds
     * @param {request} req
     * @param {response} res
     */
    refresh:function (req, res) {
        req.socket.setTimeout(10 * 60 * 1000);
        var db = req.app.DI.db;
        db.model('Feed').refresh(function (err) {
            if (err) {
                req.app.DI.logger.error(err)
            } else {
                req.app.DI.logger.log({message:"All feeds have been refreshed"})
            }
            res.redirect("/");
        });

    },
    unsubscribe:function (req, res) {
        var db = req.app.DI.db;
        db.model('Feed').unsubscribe(req.params.id, function (err, feed) {
            req.flash('info', ["Feed : ", feed.title, "removed"].join(" "));
            res.redirect("/");
        });
    },
    search:function (req, res) {
        var db = req.app.DI.db
            , q = req.query.q || "";
        db.model('Article').search(q, function (err, articles) {
            if (err) return  res.send(500, err);
            return res.render("feeds/index.twig", {articles:articles, subtitle:"Search : \"" + q + " \""});
        });

    },
    edit:function (req, res) {
        var category, errors, db = req.app.DI.db, id = req.params.id;
        db.model("Feed").findOne({_id:id}, function (err, feed) {
            ///console.log(feed);
            if (err || (!feed))return res.send(500, arguments);
            if (req.method == "POST") {
                feed.title = req.body.title ? req.body.title.trim() : feed.original_title;
                feed._category = req.body.category ? req.body.category : feed._category;
                return feed.save(function (err) {
                    if (!err) {
                        res.redirect("/feeds/" + id);
                    } else {
                        console.log("/feeds/edit errors !", err);
                        errors = err.errors;
                        res.render("feeds/edit.twig", {feed:feed, feed_id:id, errors:errors});
                    }
                });
            } else {
                return res.render("feeds/edit.twig", {feed:feed, feed_id:id, errors:errors});
            }
        });

    }
}
;
