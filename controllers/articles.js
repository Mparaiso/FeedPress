module.exports = {
    unread:function (req, res) {
        var db = req.app.DI.db;
        var options = {
            limit:res.locals.limit,
            skip:res.locals.skip*res.locals.limit
        }
        db.model('Article').findUnread(options,function (err, articles) {
            console.log(err);
            if (err)return res.send(500, err);
            return res.render("feeds/index.twig", {
                articles:articles,
                last:Math.floor(res.locals.unread_count/res.locals.limit),
                subtitle:'Unread Articles.'
            });
        });
    },
    read:function (req, res) {
        var db = req.app.DI.db;
        var id = req.params.id;
        db.model('Article').findByIdAndMarkAsRead(id, function (err, article) {
            if (err)return res.send(500, err);
            return res.render("articles/read.twig", {
                article:article
            });
        });
    },
    byCategoryTitle:function (req, res) {
        var db = req.app.DI.db;
        var title = req.params.title;
        db.model("Article").findByCategoryTitle(title, function (err, articles) {
            err ? res.send(500, err) : res.render("feeds/index.twig", {articles:articles, subtitle:"By Category : "+title});
        });
    }
};