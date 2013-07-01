module.exports = {

# GET users listing.
    list: (req, res)->
        res.render("list.twig",{online:req.online})
}