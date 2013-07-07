var express = require("express");

var app = express();

app.all("/",function (req,res) {
    res.send("mini app test");
})

module.exports = app;