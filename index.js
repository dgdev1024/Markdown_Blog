///
/// @file   index.js
/// @brief  The entry point for our application.
///

// Imports
const mongoose = require('mongoose');
const env = require('node-env-file');

// Mongoose Promise
mongoose.Promise = global.Promise;

// Environnment Variables
// env('.env');

// Connect to Database
mongoose.connect(process.env.DB_URL, { useMongoClient: true }).then(require('./server'))
    .catch(err => {
        console.error(`[EXCEPTION!] ${err}`);
        mongoose.connection.close().then(() => process.exit(1));
    });