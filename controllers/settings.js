var fs = require("fs");
module.exports = {
    index:function (req, res) {
        res.render("settings/index.twig");
    },
    import:function (req, res) {
        var filepath, db;
        if (req.files.reader) {
            filepath = req.files.reader.path;
            fs.readFile(filepath, function (err, data) {
                db = req.app.DI.db;
                db.model('Feed').import(data.toString(), function (err, result) {
                    if (err) {
                        res.send(500, err);
                    } else {
                        fs.unlink(filepath, function () {
                            res.redirect("/");
                        })
                    }
                });
            });
        } else {
            res.redirect("/");
        }
    }
};

