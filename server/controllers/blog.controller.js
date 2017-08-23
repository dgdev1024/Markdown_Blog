///
/// @file   server/controllers/blog.controller.js
/// @brief  Controller functions for the blog database model.
///

// Imports
const waterfall = require('async').waterfall;
const userModel = require('../models/user.model');
const blogModel = require('../models/blog.model');

// Export Controller Functions.
module.exports = {
    ///
    /// @fn     createBlog
    /// @brief  Creates a new blog.
    ///
    /// Details: userId, title, body, keywords
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    createBlog (details, callback) {
        waterfall([
            // Validate the details submitted.
            (next) => {
                if (!details.title) {
                    return next({
                        status: 400,
                        message: 'Please provide a title.'
                    });
                }

                if (!details.body) {
                    return next({
                        status: 400,
                        message: 'Please provide a body.'
                    });
                }

                if (details.body.length < 50 || details.body.length > 10000) {
                    return next({
                        status: 400,
                        message: 'The blog\'s body must be between 50 and 10,000 characters in length.'
                    });
                }

                if (!details.keywords) {
                    return next({
                        status: 400,
                        message: 'Please provide some keywords.'
                    });
                }

                return next(null);
            },

            // Make sure a user exists with the given user ID.
            (next) => {
                userModel.findById(details.userId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while verifying your user ID. Try again later.'
                        });
                    }

                    // Was the user found?
                    if (!user) {
                        return next({
                            status: 404,
                            message: 'A user with the given user ID was not found.'
                        });
                    }

                    // Is the user's account verified?
                    if (user.verified === false) {
                        return next({
                            status: 401,
                            message: 'You must verify your new account before you can create blogs.'
                        });
                    }

                    // Send the user object to the next function.
                    return next(null, user);
                });
            },

            // Create the blog object and store it in the DB.
            (user, next) => {
                // Create and populate the blog object.
                let blog = new blogModel();
                blog.author = user.fullName;
                blog.authorId = details.userId;
                blog.title = details.title;
                blog.body = details.body;
                blog.keywords = details.keywords;

                // Save the object to the database.
                blog.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while saving the blog. Try again later.'
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
                message: 'Your blog has been posted!'
            });
        });
    },

    ///
    /// @fn     fetchBlog
    /// @brief  Fetches a blog by its ID.
    ///
    /// @param {string} blogId The ID of the blog.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchBlog (blogId, callback) {
        blogModel.findById(blogId, (err, blog) => {
            if (err) {
                return callback({
                    status: 500,
                    message: 'An error occured while searching for the blog requested. Try again later.'
                });
            }

            // Was the blog found?
            if (!blog) {
                return callback({
                    status: 404,
                    message: 'The blog requested was not found.'
                });
            }

            // Return the blog.
            return callback(null, {
                title: blog.title,
                author: {
                    name: blog.author,
                    id: blog.authorId
                },
                postDate: blog.postDate,
                rating: {
                    average: blog.averageRating,
                    count: blog.ratingCount
                },
                commentCount: blog.commentCount,
                body: blog.body,
                keywords: blog.keywords
            });
        });
    },

    ///
    /// @fn     fetchBlogComments
    /// @brief  Fetches some comments on a blog.
    ///
    /// Details: blogId, page
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when the function finishes.
    ///
    fetchBlogComments (details, callback) {
        blogModel.findById(details.blogId, (err, blog) => {
            if (err) {
                return callback({
                    status: 500,
                    message: 'An error occured while searching for the blog requested. Try again later.'
                });
            }

            // Was the blog found?
            if (!blog) {
                return callback({
                    status: 404,
                    message: 'The blog requested was not found.'
                });
            }

            // Get the comments requested.
            const start = 0 + (10 * details.page);
            const end = start + 10;
            const comments = blog.comments.sort((a, b) => {
                return b.postDate.getTime() - a.postDate.getTime()
            }).slice(start, end);

            // Return the comments.
            return callback(null, {
                comments,
                lastPage: end >= blog.comments.length
            });
        });
    },

    ///
    /// @fn     fetchBlogsByKeyword
    /// @brief  Fetches all blogs that match a given keyword.
    ///
    /// Details: keywords, page
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchBlogsByKeyword (details, callback) {
        if (!details.keywords) {
            return callback({
                status: 400,
                message: 'Please enter a search query.'
            });
        }

        blogModel.find(
            { $text: { $search: details.keywords }},
            { score: { $meta: 'textScore' }}
        )
            // .sort({ score: { $meta: 'textScore' }})
            .sort('-postDate')
            .skip(10 * details.page)
            .limit(11)
            .exec((err, blogs) => {
                if (err) {
                    return callback({
                        status: 500,
                        message: 'An error occured while searching for blogs. Try again later.'
                    });
                }

                if (blogs.length === 0) {
                    return callback({
                        status: 404,
                        message: 'Your search did not turn up any results.'
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
    /// @fn     fetchSubscriptionBlogs
    /// @brief  Fetches all blogs authored by a user's subscriptions.
    ///
    /// Details: userId, page
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchSubscriptionBlogs (details, callback) {
        waterfall([
            // Find the user in the database and get a list of its subscriptions.
            (next) => {
                userModel.findById(details.userId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while verifying your user ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'A verified user with this ID was not found'
                        });
                    }

                    // Get the list of the user's subscribers.
                    const subscriptionIDs = user.getSubscriptionIDs();
                    if (subscriptionIDs.length === 0) {
                        return next({
                            status: 404,
                            message: 'This user is not subscribed to anybody'
                        });
                    }

                    // Next function.
                    return next(null, subscriptionIDs);
                });
            },

            (ids, next) => {
                blogModel.find({ authorId: { $in: ids }})
                    .sort('-postDate')
                    .skip(10 * details.page)
                    .limit(11)
                    .exec((err, blogs) => {
                        if (err) {
                            return callback({
                                status: 500,
                                message: 'An error occured while fetching the blogs. Try again later.'
                            });
                        }

                        if (blogs.length === 0) {
                            return callback({
                                status: 404,
                                message: 'None of your subscriptions have authored any blogs, yet.'
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
                        return next(null, { blogs: mapped, lastPage: blogs.length !== 11 });
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
    /// @fn     fetchAllBlogs
    /// @brief  Fetches all blogs.
    ///
    /// @param {number} page The page of results.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchAllBlogs (page, callback) {
        blogModel.find({})
            .sort('-postDate')
            .skip(10 * page)
            .limit(11)
            .exec((err, blogs) => {
                if (err) {
                    return callback({
                        status: 500,
                        message: 'An error occured while fetching blogs. Try again later.'
                    });
                }

                if (blogs.length === 0) {
                    return callback({
                        status: 404,
                        message: 'There are no blogs, yet!'
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
    /// @fn     updateBlog
    /// @brief  Updates the title and contents of the blog.
    ///
    /// Details: userId, blogId, title, body
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    updateBlog (details, callback) {
        waterfall([
            // Find the blog in question.
            (next) => {
                blogModel.findById(details.blogId, (err, blog) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for the blog requested. Try again later.'
                        });
                    }

                    // Was the blog found?
                    if (!blog) {
                        return next({
                            status: 404,
                            message: 'The blog you requested was not found.'
                        });
                    }

                    // Does this user own the blog?
                    if (blog.authorId !== details.userId) {
                        return next({
                            status: 403,
                            message: 'You are not the author of this blog.'
                        });
                    }

                    // Next function.
                    return next(null, blog);
                });
            },

            // Update the blog.
            (blog, next) => {
                blog.title = details.title;
                blog.body = details.body;

                blog.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while saving your blog. Try again later.'
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
                message: 'Your blog has been updated.'
            });
        });
    },

    ///
    /// @fn     rateBlog
    /// @brief  Rates a blog.
    ///
    /// Details: userId, blogId, score
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    rateBlog (details, callback) {
        waterfall([
            // Validate the score.
            (next) => {
                if (!details.score || details.score < 1 || details.score > 5) {
                    return next({
                        status: 400,
                        message: 'Your rating must range from 1 to 5.'
                    });
                }

                return next(null);
            },

            // Find the blog in the database.
            (next) => {
                blogModel.findById(details.blogId, (err, blog) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for the blog requested. Try again later.'
                        });
                    }

                    if (!blog) {
                        return next({
                            status: 404,
                            message: 'The blog requested was not found.'
                        });
                    }

                    return next(null, blog);
                });
            },

            // Check to see if the user has already rated the blog. If not, then
            // rate the blog.
            (blog, next) => {
                if (blog.userHasRated(details.userId) !== 0) {
                    return next({
                        status: 409,
                        message: 'You already rated this blog.'
                    });
                }

                // Rate the blog.
                blog.ratings.push({ raterId: details.userId, score: details.score });
                blog.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while rating the blog. Try again later.'
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
                message: 'Your rating has been submitted.'
            });
        });
    },

    ///
    /// @fn     postComment
    /// @brief  Posts a comment on this blog.
    ///
    /// Details: userId, blogId, comment
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    postComment (details, callback) {
        waterfall([
            // Validate the comment body submitted.
            (next) => {
                // Make sure a comment was posted...
                if (!details.comment) {
                    return next({
                        status: 400,
                        message: 'Please enter a comment.'
                    });
                }

                // Make sure the comment is between 10 and 200 characters in length.
                if (details.comment.length < 10 && details.comment.length > 200) {
                    return next({
                        status: 400,
                        message: 'Comments must be between 10 and 200 characters in length'
                    });
                }

                // Next function.
                return next(null);
            },

            // Match the user ID to a user in the database.
            (next) => {
                userModel.findById(details.userId, (err, user) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while verifying your user ID. Try again later.'
                        });
                    }

                    if (!user || user.verified === false) {
                        return next({
                            status: 404,
                            message: 'A user with the given ID was not found'
                        });
                    }

                    return next(null, user);
                });
            },

            // Find the blog in the database.
            (user, next) => {
                blogModel.findById(details.blogId, (err, blog) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for the blog requested. Try again later.'
                        });
                    }

                    if (!blog) {
                        return next({
                            status: 404,
                            message: 'The blog requested was not found.'
                        });
                    }

                    return next(null, user, blog);
                });
            },

            // Post the comment.
            (user, blog, next) => {
                blog.comments.push({
                    author: user.fullName,
                    authorId: details.userId,
                    body: details.comment
                });

                blog.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while saving your comment. Try again later.'
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
                message: 'Your comment was posted.'
            });
        });
    },

    ///
    /// @fn     removeComment
    /// @brief  Removes a comment from a blog.
    ///
    /// Details: userId, blogId, commentId
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    removeComment (details, callback) {
        waterfall([
            // Find the blog in the database.
            (next) => {
                blogModel.findById(details.blogId, (err, blog) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for the blog requested. Try again later.'
                        });
                    }

                    if (!blog) {
                        return next({
                            status: 404,
                            message: 'The blog requested was not found.'
                        });
                    }

                    return next(null, blog);
                });
            },

            // Find the comment in the blog and check to see if the requesting user authored it.
            (blog, next) => {
                const comment = blog.findComment(details.commentId);
                if (!comment) {
                    return next({
                        status: 404,
                        message: 'The comment requested was not found.'
                    });
                }

                if (comment.authorId !== details.userId) {
                    return next({
                        status: 403,
                        message: 'You are not the author of this comment.'
                    });
                }

                return next(null, blog);
            },

            // Remove the comment.
            (blog, next) => {
                blog.removeComment(details.commentId);
                blog.save(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while removing your comment. Try again later.'
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
                message: 'Your comment has been removed.'
            });
        });
    },

    ///
    /// @fn     removeBlog
    /// @brief  Removes a blog.
    ///
    /// Details: userId, blogId
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    removeBlog (details, callback) {
        waterfall([
            // Find the blog in the database.
            (next) => {
                blogModel.findById(details.blogId, (err, blog) => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while searching for the blog requested. Try again later.'
                        });
                    }

                    if (!blog) {
                        return next({
                            status: 404,
                            message: 'The blog requested was not found.'
                        });
                    }

                    // Check to see if the requesting user is the author of the blog.
                    if (blog.authorId !== details.userId) {
                        return next({
                            status: 403,
                            message: 'You are not the author of this blog.'
                        });
                    }

                    return next(null, blog);
                });
            },

            // Remove the blog.
            (blog, next) => {
                blog.remove(err => {
                    if (err) {
                        return next({
                            status: 500,
                            message: 'An error occured while removing your blog. Try again later.'
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
                message: 'Your blog was removed.'
            });
        });
    }
};