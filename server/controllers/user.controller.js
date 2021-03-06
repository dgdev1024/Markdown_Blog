///
/// @file   server/controllers/user.controller.js
/// @brief  Controller functions for the user database model.
///

// Imports
const waterfall = require('async').waterfall;
const forEachOf = require('async').forEachOf;
const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const blogModel = require('../models/blog.model');
const regex = require('../utility/regex');
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
                        // Error 11000 indicates a duplicate entry in the database.
                        //
                        // In the case of TDM, the only unique field in our user model is the
                        // email address field, so no regex matching should be necessary here.
                        if (err.code === 11000) {
                            return next({
                                status: 409,
                                message: 'There is another user registered with this email address.'
                            });
                        }

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
                            console.log(err);
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

            // Also fetch the number of blogs this user has authored.
            blogModel.find({ authorId: userId }, (err, blogs) => {
                if (err) {
                    return callback({
                        status: 500,
                        message: 'An error occured while fetching the user\'s blogs. Try again later.'
                    });
                }
    
                return callback(null, {
                    fullName: user.fullName,
                    emailAddress: user.emailAddress,
                    joinDate: user.joinDate,
                    subscriptionCount: user.subscriptions.length,
                    blogCount: blogs.length
                });
            });
        });
    },

    ///
    /// @fn     fetchSubscriptions
    /// @brief  Fetches a list of the user's subscriptions.
    ///
    /// Details: userId, page
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchSubscriptions (details, callback) {
        userModel.findById(details.userId, (err, user) => {
            if (err) {
                return callback({
                    status: 500,
                    message: 'An error occured while fetching your subscription list. Try again later.'
                });
            }

            if (!user || user.verified === false) {
                return callback({
                    status: 404,
                    message: 'A verified user with the given ID was not found.'
                });
            }

            if (user.subscriptions.length === 0) {
                return callback({
                    status: 404,
                    message: 'This user is not subscribed to anybody.'
                });
            }
            
            // Get the subscriptions requested.
            const start = 0 + (9 * details.page);
            const end = start + 9;
            const subscriptions = user.subscriptions.slice(start, end);

            // Return the subscriptions.
            return callback(null, {
                subscriptions,
                lastPage: end >= user.subscriptions.length
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
                        fullUrl: `${process.env.SITE_URL}/blog/view/${val._id.toString()}`,
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
        });
    },

    ///
    /// @fn     isSubscribed
    /// @brief  Check to see if a user is subscribed to another.
    ///
    /// Details: userId, targetId
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Called when this function finishes.
    ///
    isSubscribed (details, callback) {
        waterfall([
            // Find the inquiring user, first.
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
                            message: 'No verified inquiring user was found with this ID.'
                        });
                    }

                    return next(null, user.subscriptions.map(v => v.subscriberId));
                });
            },

            // Check to see if the target user is present, too.
            (subIds, next) => {
                userModel.findById(details.targetId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error has occured while verifying the target user\'s ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'No verified target user was found with this ID.'
                        });
                    }

                    return next(null, subIds);
                });
            },

            // Check to see if this target user's ID is present in your subscription list.
            (subIds, next) => {
                return next(null, {
                    subscribed: subIds.indexOf(details.targetId) !== -1
                });
            }
        ], (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(null, result);
        });
    },

    ///
    /// @fn     removeUser
    /// @brief  Deletes a user's account.
    ///
    /// @param  {string}    id      The ID of the user to be deleted.
    /// @param  {function}  done    Run when finished.
    ///
    removeUser (id, done) {
        waterfall([
            // First, find and remove all blogs authored by this account.
            (next) => {
                blogModel.remove({ authorId: id })
                    .then(() => {
                        return next(null);
                    })
                    .catch((err) => {
                        console.error(`userController.removeUser (delete blogs) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'An error has occured while deleting your account. Try again later.'
                        });
                    });
            },

            // Next, find and remove all blog comments authored by this account.
            (next) => {
                blogModel.find({}).then((blogs) => {
                    forEachOf(blogs, (val, key, fornext) => {
                        if (val.comments.length === 0) {
                            return fornext();
                        }

                        val.comments = val.comments.filter((comment) => {
                            return comment.authorId !== id;
                        });

                        val.save().then(() => {
                            return fornext();
                        }).catch((err) => {
                            console.error(`userController.removeUser (delete comment) - ${err.stack}`);
                            return fornext();
                        });
                    }, (err) => {
                        if (err) { return next(err); }
                        return next(null);
                    });
                });
            },

            // Next, remove the user from all users' subscriber lists.
            (next) => {
                userModel.find({}).then((users) => {
                    forEachOf(users, (val, key, fornext) => {
                        if (val.subscriptions.length === 0) {
                            return fornext();
                        }

                        val.subscriptions = val.subscriptions.filter((sub) => {
                            return sub.subscriberId !== id;
                        });

                        val.save().then(() => {
                            return fornext();
                        }).catch((err) => {
                            console.error(`userController.removeUser (delete subscription) - ${err.stack}`);
                            return fornext();
                        });
                    }, (err) => {
                        if (err) { return next(err); }
                        return next(null);
                    });
                }).catch((err) => {
                    console.error(`userController.removeUser (delete subscriptions) - ${err.stack}`);
                    return next({
                        status: 500,
                        message: 'An error has occured while deleting your account. Try again later.'
                    });
                });
            },

            // Now remove the account from the database.
            (next) => {
                userModel.findById(id).then((user) => {
                    if (!user) {
                        console.error(`userController.removeUser (delete account) - User not found.`);
                        return next({
                            status: 404,
                            message: 'User account not found.'
                        });
                    }

                    user.remove().then(() => {
                        return next(null);
                    }).catch((err) => {
                        console.error(`userController.removeUser (delete account) - ${err.stack}`);
                        return next({
                            status: 500,
                            message: 'An error has occured while deleting your account. Try again later.'
                        });
                    });
                });
            }
        ], (err) => {
            if (err) { return done(err); }
            return done(null, {
                message: 'Your account has been deleted.'
            });
        })
    }
};