///
/// @file   server/index.js
/// @brief  The entry point for the application's backend.
///

// Imports
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const reportError = require('./utility/error').reportError;

// Exports
module.exports = () => {
    // Express and Middleware
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(compression());
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(passport.initialize());

    // Force HTTPS on Heroku.
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.header('x-forwarded-proto') !== 'https') {
                res.redirect(`https://${req.header('host')}${req.url}`);
            } else {
                next();
            }
        });
    }

    // API Routing
    app.use('/api/user', require('./routes/user.api'));
    app.use('/api/blog', require('./routes/blog.api'));

    // Index Routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });

    // Error Handling
    app.use((err, req, res, next) => {
        const error = reportError(err);
        res.status(error.status).json({ error });
    });

    // Listen
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port #${port}...`));
};