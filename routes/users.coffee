module.exports = {
# GET users listing.
    index: ((req, res)->
        req.app.get('db').Users.find({}, (err, docs)->
            res.render("users/index.twig", {users: docs})
        )
    )
    new: ((req, res)->
        if req.route.method.toLowerCase() == "post"
            b =req.body
            new req.app.get('db').Users({
                name: b.name,
                age: b.age,
                email: b.email
            }).save((err, user)->
                res.redirect("/users/#{user.name}")
            )
        else
            res.render("users/new.twig")
    )
    show: ((req, res)->
        username=req.params.name
        # trouver l'utilisateur selon le nom
        req.app.get('db').Users.find(name: username,(err, docs)->
            user=docs[0]
            res.render("users/show.twig", {user: user})
        )
    )
    edit: ((req, res)->
        db = req.app.get('db')
        db.Users.findById(req.params.id, ((err, user)->
            if req.route.method.toLowerCase() == "post"
                db.Users.update(_id: req.body.id,
                    name: req.body.name
                    age: req.body.age
                    email: req.body.email
                , (err)->
                    res.redirect("/users/" + req.body.name)
                )
            else
                res.render("users/edit.twig", {user, action: "/users/edit/" + user.id, method: "POST"})
            )
        )
    )
    list: ((req, res)->
        res.render("list.twig", {online: req.online})
    )
}