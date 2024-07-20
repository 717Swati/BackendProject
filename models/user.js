const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
    },
    PhoneNumber: {
        type: Number,
        required: true
    },
    RegistrationDate: {
        type: Date,
        required: true,
    },
    DOB: {
        type: Date,
        required: true
    },
    MonthlySalary: {
        type: Number,
        validate: {
            validator: function (value) {
                return value > 25000;
            },
            message: 'Monthly salary must be greater than 25,000'
        }
    },
    Password: {
        type: String,
        required: true,
    },
    PurchasePower: {
        type: Number,
        default: 0
    }
});

//creating collection
const User = mongoose.model("User", userSchema);

//to export this chat.js to index.js so that we can require this file
module.exports = User;

