///
/// @file   server/index.js
/// @brief  The entry point for the application's backend.
///

// Imports
const path = require('path');
const helmet = require('helmet');
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const reportError = require('./utility/error').reportError;

// Exports
module.exports = () => {
    // Express and Middleware
    const app = express();
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [ "'self'" ],
                styleSrc: [ "'self'", 'maxcdn.bootstrap.com', 'fonts.googleapis.com' ],
                imgSrc: [ '*' ]
            }
        }
    }));
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(passport.initialize());

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