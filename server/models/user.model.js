///
/// @file   server/models/user.model.js
/// @brief  The database model for our users.
///

// Imports
const uuid = require('uuid');
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// User Subscription Schema
const userSubscriptionSchema = new mongoose.Schema({
    // The subscriber's full name and user ID.
    subscriberName: { type: String, required: true },
    subscriberId: { type: String, required: true }
});

// User Schema
const userSchema = new mongoose.Schema({
    // The user's first and last name.
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    // The user's email address.
    emailAddress: { type: String, required: true, unique: true },

    // The user's hashed password.
    passwordHash: { type: String },

    // The list of the user's subscriptions and subscribers.
    subscriptions: [userSubscriptionSchema],

    // Account verification details.
    verified: { type: Boolean, default: false },
    verifyId: { type: String },
    verifyBy: { type: Date, default: Date.now, expires: 1200 }
});

// The user's full name.
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// The user's subscription count.
userSchema.virtual('subscriptionCount').get(function () {
    return this.subscriptions.length;
});

// The user's subscriber count.
userSchema.virtual('subscriberCount').get(function () {
    return this.subscribers.length;
});

// Generates a verification ID for the user.
userSchema.methods.generateVerifyId = function () {
    this.verifyId = uuid.v4();
};

// Sets a password for the user.
userSchema.methods.setPassword = function (password) {
    // Generate a salt and use it to hash the password.
    const salt = bcryptjs.genSaltSync();
    const hash = bcryptjs.hashSync(password, salt);

    // Store the hash.
    this.passwordHash = hash;
};

// Checks a submitted password against the stored hash.
userSchema.methods.checkPassword = function (password) {
    return bcryptjs.compareSync(password, this.passwordHash);
};

// Generates a JSON web token for the logged in user.
userSchema.methods.generateJwt = function () {
    // Set up the token's expiry time.
    let exp = new Date();
    exp.setDate(exp.getDate() + 2);

    // Sign the JWT and return it.
    return jwt.sign({
        _id: this._id.toString(),
        emailAddress: this.emailAddress,
        fullName: this.fullName,
        exp: parseInt(exp.getTime() / 1000)
    }, process.env.JWT_SECRET);
};

// Check to see if this user is subscribed to the user with the given ID.
userSchema.methods.isSubscribedTo = function (userId) {
    for (const subscription of this.subscriptions) {
        if (subscription.subscriberId === userId) {
            return true;
        }
    }

    return false;
};

// Removes a subscriber from the user's list.
userSchema.methods.removeSubscriber = function (userId) {
    for (let i = 0; i < this.subscriptions.length; ++i) {
        if (this.subscriptions[i].subscriberId === userId) {
            this.subscriptions.splice(i, 1);
            return true;
        }
    }

    return false;
};

// Retrieves a list of the user's subscription's IDs.
userSchema.methods.getSubscriptionIDs = function () {
    return this.subscriptions.map(val => {
        return val.subscriberId;
    });
};

// Compile and export the model.
module.exports = mongoose.model('user', userSchema);