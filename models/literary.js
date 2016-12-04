var mongoose = require('mongoose');


var literaryRegistrationSchema = mongoose.Schema({
    team : [
        {
            email          : String,
            name           : String,
            phoneNumber    : Number,
            college        : String,
            year           : Number,
            city           : String,
            accommodation  : Boolean,
            eventName      : String,
        }
    ]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Literary', literaryRegistrationSchema);