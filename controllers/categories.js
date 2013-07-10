/* */
module.exports={

    edit:function(req,res){
        var id = req.params.id;
        var db = req.app.DI.db;


        db.model("Category").findOne({_id:id}).populate('_feeds').exec(function(err,category){
            if(req.method=="POST"){
                if(req.body.title)category.title=req.body.title;
               // if(req.body._feeds && req.body._feeds instanceof Array)
               //     category._feeds = req.body._feeds;
                category.save(function(err,_category){
                    if(!err){
                        req.flash("success","Category "+category.title+" edited.");
                    }else{
                        console.log(err);
                        req.flash("alert","Error editing "+category.title+".");
                    }
                    res.redirect("/feeds/articles/bycategorytitle/"+encodeURIComponent(category.title));
                });
            }else{
                res.render("categories/edit.twig",{category:category});
            }
        });
    },
    delete:function(req,res){
        var id = req.params.id;
        var db = req.app.DI.db;
        db.model("Category").remove({_id:id},function(err,category){
            req.flash("info","Category : "+category.title+" removed.");
            res.redirect("/");
        });
    }
};