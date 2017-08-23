///
/// @file   passwordReset.controller.js
/// @brief  Controller functions for the password reset database model.
///

// Imports
const waterfall = require('async').waterfall;
const userModel = require('../models/user.model');
const passwordResetModel = require('../models/passwordReset.model');
const validate = require('../utility/validation');
const email = require('../utility/email');

// Export Controller Functions
module.exports = {
    ///
    /// @fn     issuePasswordReset
    /// @brief  Issues a password reset token to the given user.
    ///
    /// @param {string} emailAddress The user's email address.
    /// @param {function} callback Run when this function finishes.
    ///
    issuePasswordReset (emailAddress, callback) {
        waterfall([
            // Validate the email address submitted.
            (next) => {
                const emailError = validate.emailAddress(emailAddress);
                if (emailError) {
                    return next({
                        status: 400,
                        message: emailError
                    });
                }

                next(null);
            },

            // Check to see if a user exists with this email address.
            (next) => {
                userModel.findOne({ emailAddress }, (err, user) => {
                    // Any errors?
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while verifying your email address. Try again later.'
                        });
                    }

                    // User found and verified?
                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'A verified user with this email address was not found.'
                        });
                    }

                    // Next function.
                    return next(null, user);
                });
            },

            // Check to see if a reset token is already present in the database.
            (user, next) => {
                passwordResetModel.findOne({ emailAddress }, (err, token) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while checking the password reset token database. Try again later.'
                        });
                    }

                    // Was a token found?
                    if (token) {
                        return next({
                            status: 409,
                            message: 'Another password reset token was issued for you recently. Try again later.'
                        });
                    }

                    // Next function.
                    return next(null, user);
                });
            },

            // Create the password reset token and store it in the database.
            (user, next) => {
                let token = new passwordResetModel();
                const code = token.generateAuthenticateCode();
                token.emailAddress = emailAddress;
                
                // Save the token.
                token.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while creating your password reset token. Try again later.'
                        });
                    }

                    // Send the authentication code to the next function.
                    return next(null, code, token, user);
                });
            },

            // Send the user an email with the token's authentication code.
            (code, token, user, next) => {
                email.transport.sendMail(
                    email.passwordResetRequest({
                        emailAddress,
                        fullName: user.fullName,
                        authenticationCode: code,
                        authenticationLink: token.authenticationLink
                    }), (err) => {
                        // Any errors?
                        if (err) {
                            token.remove();
                            return next({
                                status: 500,
                                message: 'An error occured while sending your authentication code. Try again later.'
                            });
                        }

                        // Done.
                        return next(null);
                    }
                );
            }
        ], (err) => {
            // Any errors?
            if (err) {
                console.log(err);
                return callback(err);
            }

            return callback(null, {
                message: 'An authentication code has been sent to your inbox. Check your email.'
            });
        });
    },

    ///
    /// @fn     authenticatePasswordReset
    /// @brief  Authenticates a password reset token issued to a user.
    ///
    /// Details: authenticateId, authenticateCode
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    authenticatePasswordReset (details, callback) {
        waterfall([
            // Find the token with the given ID.
            (next) => {
                passwordResetModel.findOne({
                    authenticateLink: details.authenticateId
                }, (err, token) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for your password reset token. Try again later.'
                        });
                    }

                    // Has the token been found?
                    if (!token) {
                        return next({
                            status: 404,
                            message: 'Password reset token not found.'
                        });
                    }

                    // Has the token already been authenticated?
                    if (token.authenticated === true) {
                        return next({
                            status: 409,
                            message: 'This password reset token has already been authenticated.'
                        });
                    }

                    // Next function.
                    return next(null, token);
                });
            },

            // Attempt to authenticate the token.
            (token, next) => {
                if (token.checkAuthenticationCode(details.authenticateCode) === false) {
                    return next({
                        status: 401,
                        message: 'The authentication code you submitted is incorrect.'
                    });
                }

                // Token is authenticated. Mark it so.
                token.authenticated = true;
                token.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while authenticating your password reset token. Try again later.'
                        });
                    }

                    // Token is authenticated and saved.
                    return next(null);
                });
            }
        ], (err) => {
            if (err) {
                return callback(err);
            }

            return callback(null, {
                message: 'Your password reset token has been authenticated. You may now change your password.'
            });
        });
    },

    ///
    /// @fn     changePassword
    /// @brief  Changes the user's password.
    ///
    /// Details: authenticateLink, password, confirm
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    changePassword (details, callback) {
        waterfall([
            // Validate the password submitted.
            (next) => {
                const passwordError = validate.password(details.password, details.confirm);
                if (passwordError) {
                    return next({
                        status: 400,
                        message: passwordError
                    });
                }

                return next(null);
            },

            // Find the token with the given authentication link.
            (next) => {
                passwordResetModel.findOne({ authenticateLink: details.authenticateLink }, (err, token) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for your password reset token. Try again later.'
                        });
                    }

                    // Was the token found?
                    if (!token) {
                        return next({
                            status: 404,
                            message: 'Password reset token not found'
                        });
                    }

                    // Has the token been authenticated?
                    if (token.authenticated === false) {
                        return next({
                            status: 401,
                            message: 'This password reset token has not been authenticated.'
                        });
                    }

                    // Has the token been spent?
                    if (token.spent === true) {
                        return next({
                            status: 409,
                            message: 'This password reset token has already been spent.'
                        });
                    }

                    // Next function.
                    return next(null, token);
                });
            },

            // Find the user associated with this password reset token.
            (token, next) => {
                userModel.findOne({ emailAddress: token.emailAddress }, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for the requesting user. Try again later.'
                        });
                    }

                    // Was the user found and verified?
                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'A user with the token\'s listed email address was not found.'
                        });
                    }

                    // Next function.
                    return next(null, user, token);
                });
            },

            // Mark the token as spent.
            (user, token, next) => {
                token.spent = true;
                token.save(err => {
                    if (err) {
                        token.remove();
                        return next({
                            status: 500,
                            message: 'An error occured while changing the token\'s spent state. Re-request your reset token and try again later.'
                        });
                    }

                    // Next function.
                    return next(null, user, token);
                });
            },

            // Change the user's password.
            (user, token, next) => {
                user.setPassword(details.password);
                user.save(err => {
                    if (err) {
                        token.remove();
                        return next({
                            status: 500,
                            message: 'An error occured while changing your password. Re-request your reset token and try again later.'
                        });
                    }

                    // Next function.
                    return next(null, user);
                });
            },

            // Send the user an email letting them know their password was changed.
            (user, next) => {
                email.transport.sendMail(
                    email.passwordChanged({
                        emailAddress: user.emailAddress,
                        fullName: user.fullName
                    }), err => {
                        if (err) {
                            // It doesn't matter at this point if an error occurs; the operation at hand
                            // has already completed successfully. Report it, though.
                            console.error(err);
                        }

                        // Done.
                        return next(null);
                    }
                );
            }
        ], (err) => {
            if (err) {
                return callback(err);
            }

            return callback(null, {
                message: 'Your password has been changed.'
            });
        });
    }
};