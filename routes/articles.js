module.exports = {
    unread:function (req, res) {
        var db = req.app.DI.db;
        db.model('Article').findUnread(function (err, articles) {
            console.log(err);
            if (err)return res.send(500, err);
            return db.model('Feed').find(function (err, feeds) {
                if (err)return res.send(500, err);
                return res.render("feeds/index.twig", {
                    articles:articles,
                    feeds:feeds
                });
            });
        });
    },
    read:function (req, res) {
        var db = req.app.DI.db;
        var id = req.params.id;
        db.model('Article').findByIdAndMarkAsRead(id, function (err, article) {
            db.model('Feed').find(function (err, feeds) {
                if (err)return res.send(500, err);
                return res.render("articles/read.twig", {
                    article:article,
                    feeds:feeds
                });
            });
        });
    }
}