///
/// @file   server/routes/user.api.js
/// @brief  API routing for our user functions.
///

// Imports
const escape = require('html-escape');
const express = require('express');
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const userController = require('../controllers/user.controller');
const passwordResetController = require('../controllers/passwordReset.controller');
const authUtility = require('../utility/auth');

// Express Router
const router = express.Router();

// Passport Login Strategies.
passport.use(new passportLocal({ usernameField: 'emailAddress' }, authUtility.loginStrategies.localLogin));

// POST: Register a new user.
router.post('/register', (req, res) => {
    userController.registerLocalUser({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailAddress: req.body.emailAddress,
        password: req.body.password,
        confirm: req.body.confirm
    }, (err, ok) => {
        if (err) {
            return res.status(err.status).json({ error: err });
        }

        return res.status(200).json(ok);
    });
});

// GET: Verifies a newly-registered user.
router.get('/verify/:verifyId', (req, res) => {
    userController.verifyLocalUser(req.params.verifyId, (err, ok) => {
        if (err) {
            return res.status(err.status).json({ error: err });
        }

        return res.status(200).json(ok);
    });
});

// POST: Logs a user in locally.
router.post('/login', (req, res) => {
    if (!req.body.emailAddress && !req.body.password) {
        return res.status(400).json({ error: { status: 401, message: 'Please enter your login credentials.' }});
    }

    if (!req.body.emailAddress) {
        return res.status(400).json({ error: { status: 401, message: 'Please enter your email address.' }});
    }

    if (!req.body.password) {
        return res.status(400).json({ error: { status: 401, message: 'Please enter your password.' }});
    }

    // Let Passport handle the authentication.
    passport.authenticate('local', (err, user, info) => {
        // Any errors with authentication?
        if (err) {
            return res.status(err.status).json({ error: err });
        }

        // Was the user authenticated successfully?
        if (!user) {
            return res.status(401).json({ error: { status: 401, message: info.message }});
        }

        // Generate a JWT.
        const token = user.generateJwt();
        return res.status(200).json({ token });
    })(req, res);
});

// POST: Request a password reset.
router.post('/requestPasswordReset', (req, res) => {
    passwordResetController.issuePasswordReset(req.body.emailAddress, (err, ok) => {
        if (err) {
            return res.status(err.status).json({ error: err });
        }

        return res.status(200).json(ok);
    });
});

// POST: Authenticate a password reset.
router.post('/authenticatePasswordReset/:authenticateId', (req, res) => {
    passwordResetController.authenticatePasswordReset({
        authenticateId: req.params.authenticateId,
        authenticateCode: req.body.authenticateCode
    }, (err, ok) => {
        if (err) {
            return res.status(err.status).json({ error: err });
        }

        return res.status(200).json(ok);
    });
});

// POST: Change the user's password.
router.post('/changePassword/:authenticateId', (req, res) => {
    passwordResetController.changePassword({
        authenticateLink: req.params.authenticateId,
        password: req.body.password,
        confirm: req.body.confirm
    }, (err, ok) => {
        if (err) {
            return res.status(err.status).json({ error: err });
        }

        return res.status(200).json(ok);
    })
});

// GET: Fetches a user's profile.
router.get('/profile/:userId', (req, res) => {
    userController.fetchProfile(req.params.userId, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// GET: Fetches a list of the users the given user is subscribed to.
router.get('/subscriptions/:userId', (req, res) => {
    userController.fetchSubscriptions({
        userId: req.params.userId,
        page: parseInt(req.query.page) || 0
    }, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// GET: Fetches a user's blogs.
router.get('/blogs/:userId', (req, res) => {
    userController.fetchBlogs({
        userId: req.params.userId,
        page: parseInt(req.query.page) || 0
    }, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// PUT: Subscribes to a user.
router.put('/subscribe/:targetId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }); }
        userController.subscribeToUser({
            userId: user.id,
            targetUserId: req.params.targetId
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// PUT: Unsubscribes from a user.
router.put('/unsubscribe/:targetId', authUtility.jwtAuthentication, (req, res) => {
    authUtility.testLogin(req, (err, user) => {
        if (err) { return res.status(err.status).json({ error: err }); }
        userController.unsubscribeFromUser({
            userId: user.id,
            targetUserId: req.params.targetId
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }) }
            return res.status(200).json(ok);
        });
    });
});

// GET: Is a user subscribed to another?
router.get('/isSubscribed', (req, res) => {
    userController.isSubscribed({
        userId: req.query.userId,
        targetId: req.query.targetId
    }, (err, ok) => {
        if (err) { return res.status(err.status).json({ error: err }) }
        return res.status(200).json(ok);
    });
});

// Exports
module.exports = router;