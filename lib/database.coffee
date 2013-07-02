mongoose = require("mongoose")

mongoose.connect(process.env.MONGODB_EXPRESS)

UserSchema = new mongoose.Schema({
    name:String,
    email:String,
    age:Number
})

Users = mongoose.model('Users',UserSchema)

module.exports ={
    connection : mongoose
    Users:Users
    UserSchema:UserSchema
}