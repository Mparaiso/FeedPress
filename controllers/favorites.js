module.exports = {
    index:function (req, res) {
        var db = req.app.DI.db;
        console.log("controller,this", this);
        db.model("Article").findFavorites(function (e, articles) {
            if (e)throw e;
            db.model("Feed").find(function (e, feeds) {
                if (e)throw e;
                res.render("feeds/index.twig", {articles:articles, feeds:feeds});
            });
        });
    },
    toggleFavorite:function (req, res) {
        var id = req.params.id;
        var db = req.app.DI.db;
        db.model('Article').toggleFavorite(id, function (e, result) {
            if (e)req.app.DI.logger.error(e);
            res.redirect(req.header('Referer'));
        });
    }
}
