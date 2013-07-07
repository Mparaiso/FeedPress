/**
 *
 * @type {{index: Function, read: Function, suscribe: Function}} FeedCtrl
 */
module.exports = {
    toString:function () {
        return "[object FeedCtrl]"
    },
    index:function (req, res) {
        var db = req.app.DI.db;
        db.model('Article').findAllAndSortByPubDateDesc(function (err, articles) {
            if (err) {
                return res.send(500, arguments);
            } else {
                res.render("feeds/index.twig", {
                    articles:articles
                });
            }
        });
    },
    subscribe:function (req, res) {
        var db, url;
        url = req.body.url;
        db = req.app.DI.db;
        if (url) {
            db.model('Feed').subscribe(url, function (err) {
                if (err) {
                    console.log(err);
                }
                res.redirect("/");
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
        db.model('Article').findByFeedId(id, function (err, articles) {
            if (err) return res.send(500, arguments);
            return res.render("feeds/index.twig", { articles:articles});
        });
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
            return res.render("feeds/index.twig", {articles:articles});
        });
    },
    /**
     * refresh all the suscribed feeds
     * @param {request} req
     * @param {response} res
     */
    refresh:function (req, res) {
        var db = req.app.DI.db;
        db.model('Feed').refresh(function (err) {
            if (err) {
                req.app.DI.logger.error(err)
            } else {
                req.app.DI.logger.log({message:"All feeds have been refreshed"})
            }
        });
        res.redirect("/");
    },
    unsubscribe:function (req, res) {
        var db = req.app.DI.db;
        db.model('Feed').unsubscribe(req.params.id, function (err) {
            console.log("feed unsubscribe", arguments);
            res.redirect("/");
        });
    },
    search:function (req, res) {
        var db = req.app.DI.db
            , q = req.query.q || "";
        db.model('Article').search(q, function (err, articles) {
            if (err) return  res.send(500, err);
            return res.render("feeds/index.twig", {articles:articles});
        });

    },
    streamIcon:function (req, res) {
        var id = req.params.id;

    }
};
