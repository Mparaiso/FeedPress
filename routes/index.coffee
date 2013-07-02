module.exports = {
    # GET home page.
    index: (req, res)->
        res.render('index.twig', { message: "This is mparaiso's message" })
}