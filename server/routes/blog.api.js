///
/// @file   server/routes/blog.api.js
/// @brief  API routing for our blog functions.
///

// Imports
const express = require('express');
const blogController = require('../controllers/blog.controller');
const authUtility = require('../utility/auth');

// Express Router
const router = express.Router();

// POST: Creates a blog.
router.post('/create', authUtility.jwtAuthentication, (req, res) => {
    // Requires user authentication.
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.createBlog({
            userId: user.id,
            title: req.body.title,
            body: req.body.body,
            keywords: req.body.keywords
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// GET: Fetches a blog.
router.get('/view/:blogId', (req, res) => {
    blogController.fetchBlog(req.params.blogId, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// GET: Fetches a blog's comments.
router.get('/comments/:blogId', (req, res) => {
    blogController.fetchBlogComments({
        blogId: req.params.blogId,
        page: parseInt(req.query.page || 0)
    }, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// GET: Fetches all recent blogs.
router.get('/recent', (req, res) => {
    blogController.fetchAllBlogs(parseInt(req.query.page) || 0, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    })
});

// GET: Searches for blogs by keyword.
router.get('/search', (req, res) => {
    blogController.fetchBlogsByKeyword({
        keywords: req.query.query,
        page: parseInt(req.query.page) || 0
    }, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// GET: Fetches blogs by a user's subscriptions.
router.get('/subscriptions', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.fetchSubscriptionBlogs({
            userId: user.id,
            page: parseInt(req.query.page) || 0
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// PUT: Updates a blog.
router.put('/update/:blogId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.updateBlog({
            userId: user.id,
            blogId: req.params.blogId,
            title: req.body.title,
            body: req.body.body
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// PUT: Rates a blog.
router.put('/rate/:blogId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.rateBlog({
            userId: user.id,
            blogId: req.params.blogId,
            score: req.body.score
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// PUT: Posts a comment on a blog.
router.put('/postComment/:blogId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.postComment({
            userId: user.id,
            blogId: req.params.blogId,
            comment: req.body.comment
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// DELETE: Removes a comment from the blog.
router.delete('/deleteComment/:blogId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.removeComment({
            userId: user.id,
            blogId: req.params.blogId,
            commentId: req.body.commentId
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// DELETE: Removes a blog.
router.delete('/delete/:blogId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        blogController.removeBlog({
            userId: user.id,
            blogId: req.params.blogId
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// Export
module.exports = router;