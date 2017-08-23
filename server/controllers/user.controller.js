///
/// @file   server/controllers/user.controller.js
/// @brief  Controller functions for the user database model.
///

// Imports
const waterfall = require('async').waterfall;
const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const blogModel = require('../models/blog.model');
const email = require('../utility/email');
const validation = require('../utility/validation');

// Export Functions
module.exports = {
    ///
    /// @fn     registerLocalUser
    /// @brief  Registers a user for local login.
    ///
    /// Details: firstName, lastName, emailAddress, password, confirm
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    registerLocalUser (details, callback) {
        waterfall([
            // Validate the credentials the new user submitted.
            (next) => {
                // Validate the credentials submitted. Store any errors.
                const fullNameError = validation.fullName(details.firstName, details.lastName);
                const emailError    = validation.emailAddress(details.emailAddress);
                const passwordError = validation.password(details.password, details.confirm);

                // Store any errors.
                let errors = [];
                if (fullNameError) { errors.push(fullNameError); }
                if (emailError)    { errors.push(emailError); }
                if (passwordError) { errors.push(passwordError); }

                // Report the errors, if present.
                if (errors.length > 0) {
                    return next({
                        status: 400,
                        message: 'There are some issues with the credentials you submitted.',
                        details: errors
                    });
                }

                // Next function.
                return next(null);
            },

            // Create the user object and store it in the database.
            (next) => {
                let user = new userModel();
                user.firstName = details.firstName;
                user.lastName = details.lastName;
                user.emailAddress = details.emailAddress;
                user.setPassword(details.password);
                user.generateVerifyId();

                user.save((err) => {
                    // Any errors saving the user?
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while saving the user. Try again later.'
                        });
                    }

                    // Send the user object to the next function.
                    return next(null, user);
                });
            },

            // Send an email asking the user to verify their account.
            (user, next) => {
                email.transport.sendMail(
                    email.verifyEmail({
                        fullName: user.fullName,
                        emailAddress: user.emailAddress,
                        verifyId: user.verifyId
                    }), (err) => {
                        // Any errors sending the email?
                        if (err) {
                            user.remove();
                            return next({
                                status: 500,
                                message: 'An error occured while sending the verification email. Try again later.'
                            });
                        }

                        // OK.
                        return next(null);
                    }
                );
            }
        ], (err) => {
            // Any errors?
            if (err) {
                return callback(err);
            }

            // OK.
            return callback(null, { message: 'An account verification email has been sent. Check your email!' });
        });
    },

    ///
    /// @fn     verifyLocalUser
    /// @brief  Verifies a newly-created local user account.
    ///
    /// @param {string} verifyId The ID portion of the verify link.
    /// @param {function} callback Run when this function finishes.
    ///
    verifyLocalUser (verifyId, callback) {
        // Find the user in the database.
        userModel.findOneAndUpdate({
            verifyId
        }, {
            verified: true,
            verifyId: null,
            verifyBy: null
        }, {
            new: true
        }, (err, user) => {
            // Any errors seeking out the user?
            if (err) {
                return callback({
                    status: 500,
                    message: 'An error occured while verifying your account. Try again later.'
                });
            }

            // Was the user found?
            if (!user) {
                return callback({
                    status: 404,
                    message: 'The verification ID submitted does not match any user.'
                });
            }

            // User verified.
            return callback(null, {
                message: 'Your account has been verified. You may now log in.'
            });
        });
    },

    ///
    /// @fn     fetchProfile
    /// @brief  Fetches a user's profile.
    ///
    /// @param {string} userId The user's ID.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchProfile (userId, callback) {
        userModel.findById(userId, (err, user) => {
            if (err) {
                return callback({
                    status: 500,
                    message: 'An error occured while searching for the user. Try again later.'
                });
            }

            if (!user || user.verified === false) {
                return callback({
                    status: 404,
                    message: 'A verified user with this ID was not found.'
                });
            }

            return callback(null, {
                fullName: user.fullName,
                emailAddress: user.emailAddress
            });
        });
    },

    ///
    /// @fn     fetchBlogs
    /// @brief  Fetch blogs authored by the user.
    ///
    /// Details: userId, page
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchBlogs (details, callback) {
        blogModel.find({ authorId: details.userId })
            .sort('-postDate')
            .skip(details.page * 10)
            .limit(11)
            .exec((err, blogs) => {
                if (err) {
                    return callback({
                        status: 500,
                        message: 'An error occured while searching for the user\'s polls. Try again later.'
                    });
                }

                if (blogs.length === 0) {
                    return callback({
                        status: 404,
                        message: 'This user has no blogs.'
                    });
                }

                // Prepare the blogs for return.
                const mapped = blogs.map((val, idx) => {
                    if (idx === 10) { return; }
                    return {
                        fullUrl: `${process.env.SITE_URL}/api/blog/view/${val._id.toString()}`,
                        blogId: val._id.toString(),
                        postDate: val.postDate,
                        title: val.title,
                        author: val.author,
                        authorId: val.authorId,
                        rating: val.averageRating,
                        ratingCount: val.ratingCount,
                        commentCount: val.commentCount,
                        keywords: val.keywords
                    };
                }).slice(0, 10);

                // Return the blogs.
                return callback(null, { blogs: mapped, lastPage: blogs.length !== 11 });
            });
    },

    ///
    /// @fn     subscribeToUser
    /// @brief  Subscribes to a user.
    ///
    /// Details: userId, targetUserId
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    subscribeToUser (details, callback) {
        waterfall([
            // Find the subscribing user in the database.
            (next) => {
                userModel.findById(details.userId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error has occured while verifying your user ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'A verified user with this ID was not found.'
                        });
                    }

                    return next(null, user);
                });
            },

            // Find the target user in the database.
            (subscribing, next) => {
                userModel.findById(details.targetUserId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error has occured while verifying the target user\'s ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'No target user was found with this ID.'
                        });
                    }

                    return next(null, subscribing, user);
                });
            },

            // Modify the users' subscription arrays as approprite.
            (subscribing, target, next) => {
                subscribing.subscriptions.push({ 
                    subscriberName: target.fullName, 
                    subscriberId: target._id.toString() 
                });

                subscribing.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while saving your subscription. Try again later.'
                        });
                    }

                    return next(null);
                });
            }
        ], (err) => {
            if (err) {
                return callback(err);
            }

            return callback(null, {
                message: 'Subscription has been added.'
            });
        });
    },

    ///
    /// @fn     unsubscribeFromUser
    /// @brief  Unsubscribes from a user.
    ///
    /// Details: userId, targetUserId
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    unsubscribeFromUser (details, callback) {
        waterfall([
            // Find the subscribing user in the database.
            (next) => {
                userModel.findById(details.userId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error has occured while verifying your user ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'A verified user with this ID was not found.'
                        });
                    }

                    return next(null, user);
                });
            },

            // Find the target user in the database.
            (subscribing, next) => {
                userModel.findById(details.targetUserId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error has occured while verifying the target user\'s ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'No target user was found with this ID.'
                        });
                    }

                    if (subscribing.isSubscribedTo(details.targetUserId) === false) {
                        return next({
                            status: 409,
                            message: 'You are not subscribed to this user.'
                        });
                    }

                    return next(null, subscribing, user);
                });
            },

            // Remove the subscriber from the list.
            (subscribing, target, next) => {
                subscribing.removeSubscriber(details.targetUserId);
                subscribing.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while removing your subscription. Try again later.'
                        });
                    }

                    // Done.
                    return next(null);
                });
            }
        ], (err) => {
            if (err) {
                return callback(err);
            }

            return callback(null, {
                message: 'Subscription has been removed.'
            });
        })
    }
};