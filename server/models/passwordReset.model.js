///
/// @file   passwordReset.model.js
/// @brief  The database model for the password reset token.
///

// Imports
const uuid = require('uuid');
const csprng = require('csprng');
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

// Password Reset Schema
const passwordResetSchema = new mongoose.Schema({
    // The email address of the user requesting the reset.
    emailAddress: { type: String, required: true, unique: true },

    // The authentication link.
    authenticateLink: { type: String, required: true, unique: true },

    // The hashed authentication ID.
    authenticateHash: { type: String, required: true, unique: true },

    // Authentication details.
    authenticated: { type: Boolean, default: false },

    // Has this token been spent?
    spent: { type: Boolean, default: false },
    spendBy: { type: Date, default: Date.now, expires: 600 }
}, { usePushEach: true });

// Generates an authentication hash
passwordResetSchema.methods.generateAuthenticateCode = function () {
    // Generate the authentication link.
    this.authenticateLink = uuid.v4();

    // Create a salt.
    const salt = bcryptjs.genSaltSync();

    // Generate a cryptographically secure random number and hash it.
    const code = csprng();
    const hash = bcryptjs.hashSync(code, salt);

    // Save the hash.
    this.authenticateHash = hash;

    // Return the code.
    return code;
};

// Checks a submitted authentication code in order to verify a password
// reset token.
passwordResetSchema.methods.checkAuthenticationCode = function (code) {
    return bcryptjs.compareSync(code, this.authenticateHash);
};

// Compile and export the module.
module.exports = mongoose.model('passwordReset', passwordResetSchema);