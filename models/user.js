const { func } = require('joi');
const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    url: String,
    filename: String

})
ImageSchema.virtual('profile').get(function () {
    return this.url.replace('/upload', '/upload/c_thumb,g_face,h_200,w_200');

})
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name cannot be blank"]
    },
    email: {
        type: String,
        required: [true, "Email cannot be blank"]
    },
    phone: {
        type: Number,
        required: [true, "Mobile cannot be blank"],
        unique: true

    },
    password: {
        type: String,
        required: [true, "Password cannot be blank"]
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    profile: ImageSchema


})

module.exports = mongoose.model("User", userSchema);

