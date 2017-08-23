///
/// @file   server/utility/regex.js
/// @brief  Common regular expressions used by the backend.
///

// Exports
module.exports = {
    emailAddress: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    capitalLetters: /[A-Z]/,
    numbers: /[0-9]/,
    symbols: /[$-/:-?{-~!"^_`\[\]]/,
    mongooseError: /index\:\ (?:.*\.)?\$?(?:([_a-z0-9]*)(?:_\d*)|([_a-z0-9]*))\s*dup key/i
}