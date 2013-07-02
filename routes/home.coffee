contactMessages = []

module.exports = {
    index: (req, res)->
        viewModel =
            title: "Home Page"
            email: "email@host.com"
            phone: "343.300.3443.30"
            contactMessages: contactMessages
        res.render("home/index.twig", viewModel)

    contact: (req, res)->
        res.render("home/contact.twig", {contactMessages})

    # gestion des formulaires
    createContact: (req, res)->
        contactMessages.push({message: req.body.message, name: req.body.name})
        res.redirect("/home")

}