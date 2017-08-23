///
/// @file   server/utility/auth.js
/// @brief  Functions pertaining to user authentication.
///

// Imports
const mongoose = require('mongoose');
const expressJwt = require('express-jwt');
const userModel = require('../models/user.model');

// Exports
module.exports = {
    // JWT Authentication.
    jwtAuthentication: expressJwt({
        secret: process.env.JWT_SECRET,
        userProperty: 'payload'
    }),

    // Test Local Login
    testLogin (req, callback) {
        // Make sure the JWT payload exists, and that payload contains a
        // user ID.
        if (!req.payload || !req.payload._id) {
            return callback({
                status: 401,
                message: 'You need to be logged in to use this feature.'
            });
        }

        // Attempt to match the ID found to a user in the database.
        userModel.findById(req.payload._id, (err, user) => {
            // Errors?
            if (err) {
                return callback({
                    status: 500,
                    message: 'An error occured while testing your login status. Try again later.'
                });
            }

            // Does the user exist in the database?
            if (!user || user.verified === false) {
                return callback({
                    status: 401,
                    message: 'Your login token is invalid. Please log in again.'
                });
            }

            return callback(null, {
                id: req.payload._id,
                fullName: req.payload.fullName,
                emailAddress: req.payload.emailAddress
            });
        });
    },

    // Login Strategies.
    loginStrategies: {
        ///
        /// @fn     localLogin
        /// @brief  Logs the user in with the local strategy.
        ///
        /// @param {string} username The user's email address.
        /// @param {string} password The user's password.
        /// @param {function} callback Run when this function finishes.
        ///
        localLogin (username, password, callback) {
            userModel.findOne({ emailAddress: username }, (err, user) => {
                // Any errors finding the user?
                if (err) {
                    return callback(err);
                }

                // Was the user found and verified?
                if (!user || user.verified === false) {
                    return callback(null, false, { message: 'No verified user found with this email address.' });
                }

                // Does the password submitted match?
                if (user.checkPassword(password) === false) {
                    return callback(null, false, { message: 'The password submitted is incorrect.' });
                }

                // Credentials verified.
                return callback(null, user);
            });
        }
    }
}