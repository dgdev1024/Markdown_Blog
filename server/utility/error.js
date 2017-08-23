///
/// @file   server/utility/error.js
/// @brief  Middleware functions for handling errors.
///

// Imports
const httpStatus = require('http-status-codes');

module.exports.reportError = (err) => {
    if (process.env.NODE_ENV === 'development') {
        return {
            status: err.status || 500,
            type: httpStatus.getStatusText(err.status || 500),
            message: err.message,
            stack: err.stack
        };
    } else {
        return {
            status: err.status || 500,
            message: httpStatus.getStatusText(err.status || 500)
        };
    }
}