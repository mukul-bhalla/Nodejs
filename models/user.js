const mongoose = require('mongoose');
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
    }
})

module.exports = mongoose.model("User", userSchema);