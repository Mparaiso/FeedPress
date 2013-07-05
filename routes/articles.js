module.exports = {
    read: function (req, res) {
        var db = req.app.DI.db;
        db.model('Article').findOne({
            _id: req.params.id
        }, function (err, article) {
            db.model('Feed').find(function (err, feeds) {
                if (err)return res.send(500, err);
                return res.render("articles/read.twig", {
                    article: article,
                    feeds: feeds
                });
            });
        });
    }
}