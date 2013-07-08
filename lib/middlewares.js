/**
 * MIDDLEWARES
 * @type {{Object}}
 */
module.exports = {
    /**
     *
     * @param req
     * @param res
     * @param next
     * @return {Query}
     */
    countArticles:function (req, res, next) {
        req.app.DI.logger.log("counting articles");
        var db = req.app.DI.db;
        return db.model("Article").count(function (err, result) {
            res.locals.article_count = result;
            next();
        });
    },
    /**
     *
     * @param req
     * @param res
     * @param next
     * @return {Query}
     */
    countStared:function (req, res, next) {
        req.app.DI.logger.log("counting stared");
        var db = req.app.DI.db;
        return db.model("Article").count({_favorite:true}, function (err, result) {
            req.app.set("favorite_count", result);
            next();
        });
    },
    /**
     *
     * @param req
     * @param res
     * @param next
     * @return {Query}
     */
    countUnread:function (req, res, next) {
        req.app.DI.logger.log("counting unread");
        var db = req.app.DI.db;
        return db.model("Article").count({_read:null}, function (err, result) {
            req.app.set("unread_count", result || 0);
            next();
        });
    },
    /**
     *
     * @param req
     * @param res
     * @param next
     * @return {Query}
     */
    fetchFeeds:function (req, res, next) {
        var db = req.app.DI.db;
        return db.model("Feed").find({_category:{$exists:false}}, "title _nice_name xmlurl favicon", function (err, feeds) {
            if (err)req.app.DI.logger.log("error form fetchFeeds", err);
            if (feeds)req.app.locals.feeds = feeds;
            next();
        });
    },
    /**
     *
     * @param req
     * @param res
     * @param next
     */
    fetchCategories:function (req, res, next) {
        var db = req.app.DI.db;
        db.model("Category").find().populate({path:'_feeds', select:'_id title xmlurl favicon'}).exec(
            function (err, categories) {
                err ? (console.log(err)) : (res.locals.categories = categories);
                next();
            }
        );
    },
    /**
     * Create a category if a new one is submitted on the edit feed page
     * @param req
     * @param res
     * @param next
     * @return {*}
     */
    createCategory:function (req, res, next) {

        if (req.method == "POST" && req.body.category_new) {
            var db = req.app.DI.db;
            var logger = req.app.DI.logger;
            var category = {title:req.body.category_new};
            return db.model("Category").update({title:category.title}, category, {upsert:true}, function (err) {
                if (err) {
                    logger.log("error from createCategory", err)
                    return next();
                } else {
                    logger.warn("A new category was added");
                    return db.model("Category").findOne({title:category.title}, function (err, res) {
                        if (err) {
                            logger.log("error", err);
                        } else {
                            console.log(res);
                            req.body.category = res._id;
                        }
                        next();
                    });
                }
            });
        } else {
            return next();
        }
    }
};