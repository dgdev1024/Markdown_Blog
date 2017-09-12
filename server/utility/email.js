///
/// @file   server/utility/email.js
/// @brief  Our backend's email sending system.
///

// Imports
const nodemailer = require('nodemailer');

// Our email sender.
const sender = `${process.env.SITE_AUTHOR} <${process.env.EMAIL_ADDRESS}>`;

// Set up and export the email transport
module.exports.transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    port: 465,
    secure: true,
    auth: {
        type: 'oauth2',
        user: process.env.EMAIL_ADDRESS,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        accessToken: process.env.EMAIL_ACCESS_TOKEN,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN
    }
});

// The functions below are for creating emails to send to our users.
//
// Verify Your Account
module.exports.verifyEmail = details => {
    const url = `${process.env.SITE_URL}/user/verify/${details.verifyId}`;

    const body = `
        <div>
            <h2>Hello, ${details.fullName}!</h2>
            <p>
                Click or tap on the link below in order to verify your new account:<br />
                <a href="${url}">${url}</a>
            </p>
            <p>
                Thank you for registering for The Daily Markdown! We hope you enjoy the site!
                -${process.env.SITE_AUTHOR}
            </p>
        </div>
    `;

    return {
        from: sender,
        to: `${details.fullName} <${details.emailAddress}>`,
        subject: 'The Daily Markdown: Verify your Account',
        html: body
    };
};

// Password Reset Request
module.exports.passwordResetRequest = details => {
    const url = `${process.env.SITE_URL}/user/authenticatePasswordReset/${details.authenticationLink}`;

    const body = `
        <div>
            <h2>Hello, ${details.fullName}!</h2>
            <p>
                You are receiving this email because a password reset has been requested for your account.<br />
                Enter the following code in order to verify the password reset request:<br /><br />
                <h3>${details.authenticationCode}</h3>
            </p>
            <p>
                If you need to get back to the authentication page to authenticate later, click this link:<br />
                <a href="${url}">${url}</a>
            </p>
            <p>
                If you did not request this reset, you may ignore this email.
            </p>
            <p>
                Thank you for using for The Daily Markdown!
                -${process.env.SITE_AUTHOR}
            </p>
        </div>
    `;

    return {
        from: sender,
        to: `${details.fullName} <${details.emailAddress}>`,
        subject: 'The Daily Markdown: Password Reset Requested',
        html: body
    };
};

// Password Changed
module.exports.passwordChanged = details => {
    const body = `
        <div>
            <h2>Hello, ${details.fullName}!</h2>
            <p>
                You are receiving this email because the password on your account has been changed.<br />
                If you were the one who performed this action, then ignore this email.<br />
                If you weren't, then please reply to this email.
            </p>
            <p>
                Thank you for using for The Daily Markdown!
                -${process.env.SITE_AUTHOR}
            </p>
        </div>
    `;

    return {
        from: sender,
        to: `${details.fullName} <${details.emailAddress}>`,
        subject: 'The Daily Markdown: Password Changed',
        html: body
    };
};