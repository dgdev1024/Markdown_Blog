///
/// @file   validation.js
/// @brief  Functions pertaining to registration credential validation.
///

// Imports
const regex = require('./regex');

// Exports
module.exports = {
    ///
    /// @fn     fullName
    /// @brief  Validates the user's full name.
    ///
    /// @param  {string}    first    The user's first name.
    /// @param  {string}    last     The user's last name.
    ///
    /// @return A blank string on success, an error string otherwise.
    ///
    fullName (first, last) {
        // Make sure the user entered both a first and last name.
        if (!first || !last) {
            return 'Please enter both a first and last name.';
        }

        // Make sure the first and last names don't contain any numbers.
        if (regex.numbers.test(first) || regex.numbers.test(last)) {
            return 'First and last names shall not contain numbers.';
        }

        // Make sure the first and last names don't contain any symbols.
        if (regex.symbols.test(first) || regex.symbols.test(last)) {
            return 'First and last names shall not contain symbols.';
        }

        // Return a blank string on success.
        return '';
    },

    ///
    /// @fn     emailAddress
    /// @brief  Validates the user's email address.
    ///
    /// @param  {string}    email       The user's email address.
    ///
    /// @return A blank string on success, an error string otherwise.
    ///
    emailAddress (email) {
        // Make sure the user entered an email address.
        if (!email) {
            return 'Please enter an email address.';
        }

        // Make sure the address is of the form 'alias@domain'.
        if (!regex.emailAddress.test(email)) {
            return 'Please enter a valid email address.';
        }

        // Valid email address.
        return '';
    },

    ///
    /// @fn     password
    /// @brief  Validates the new user's password.
    ///
    /// @param  {string}    password    The user's submitted password.
    /// @param  {string}    confirm     The user's retyped password.
    ///
    /// @return A blank string on success, an error string otherwise.
    ///
    password (password, confirm) {
        // Make sure the user entered a password.
        if (!password) {
            return 'Please enter a password.';
        }

        // Make sure the user retyped their password.
        if (!confirm) {
            return 'Please retype your password.';
        }

        // Make sure the passwords match.
        if (password !== confirm) {
            return 'The passwords do not match.';
        }

        // Make sure the password has...
        // - ...between 8 and 20 characters.
        // - ...at least one capital letter.
        // - ...at least one number.
        // - ...at least one symbol.
        if (password.length < 8 || password.length > 20) {
            return 'Your password must be between 8 and 20 characters in length.';
        }
        if (!regex.capitalLetters.test(password)) {
            return 'Your password must have at least one capital letter.';
        }
        if (!regex.numbers.test(password)) {
            return 'Your password must have at least one numeric character.';
        }
        if (!regex.symbols.test(password)) {
            return 'Your password must have at least one symbol.';
        }

        // Password validated.
        return '';
    }
};