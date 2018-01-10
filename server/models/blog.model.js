///
/// @file   server/models/blog.model.js
/// @brief  The database model for our blogs.
///

// Imports
const mongoose = require('mongoose');

// Blog Rating Schema
const blogRatingSchema = new mongoose.Schema({
    // The ID of the user rating the blog.
    raterId: { type: String, required: true },

    // The rating score.
    score: {
        type: Number,
        required: true,
        validate: {
            validator: v => v >= 1 && v <= 5,
            message: 'Blog ratings shall range from 1 to 5.'
        }
    }
}, { usePushEach: true });

// Blog Comment Schema
const blogCommentSchema = new mongoose.Schema({
    // The comment's author name and ID.
    author: { type: String, required: true },
    authorId: { type: String, required: true },

    // The comment's post date.
    postDate: { type: Date, default: Date.now },

    // The comment's body.
    body: {
        type: String,
        required: true,
        validate: {
            validator: v => v.length >= 10 && v.length <= 200,
            message: 'Comments shall be between 10 and 200 characters in length.'
        }
    }
}, { usePushEach: true });

// Blog Schema
const blogSchema = new mongoose.Schema({
    // The blog's author name and ID.
    author: { type: String, required: true },
    authorId: { type: String, required: true },

    // The blog's post date.
    postDate: { type: Date, default: Date.now },

    // The blog's title.
    title: { type: String, required: true },

    // The blog's body.
    body: {
        type: String,
        required: true,
        validate: {
            validator: v => v.length >= 50 && v.length <= 10000,
            message: 'A blog must be between 50 and 10,000 characters in length.'
        }
    },

    // The blog's keywords.
    keywords: { type: String, required: true },

    // An array of the blog's ratings.
    ratings: [blogRatingSchema],

    // An array of the blog's comments.
    comments: [blogCommentSchema]
}, { usePushEach: true });

// Index the blog's keywords, for search purposes.
blogSchema.index({ keywords: "text" });

// Gets the average rating of a blog.
blogSchema.virtual('averageRating').get(function () {
    if (this.ratings.length === 0) {
        return 0;
    } else {
        const score = this.ratings.reduce((acc, val) => {
            return acc + val.score
        }, 0) / this.ratings.length;

        return Number(Math.round(score + 'e2') + 'e-2');
    }
});

// Gets the number of total ratings.
blogSchema.virtual('ratingCount').get(function () {
    return this.ratings.length;
});

// Gets the number of total comments.
blogSchema.virtual('commentCount').get(function () {
    return this.comments.length;
});

// Gets the 'heat' of a blog.
blogSchema.virtual('heat').get(function () {
    return this.comments.length + this.ratings.length;
});

// Checks to see if a certain user rated a blog.
blogSchema.methods.userHasRated = function (userId) {
    for (const rating of this.ratings) {
        if (rating.raterId === userId) {
            return rating.score;
        }
    }

    return 0;
};

// Finds a comment in the blog.
blogSchema.methods.findComment = function (commentId) {
    for (let i = 0; i < this.comments.length; ++i) {
        if (this.comments[i]._id.toString() === commentId) {
            return this.comments[i];
        }
    }

    return null;
}

// Removes a comment from a blog.
blogSchema.methods.removeComment = function (commentId) {
    for (let i = 0; i < this.comments.length; ++i) {
        if (this.comments[i]._id.toString() === commentId) {
            this.comments.splice(i, 1);
            return true;
        }
    }

    return false;
};

// Compile and export the schema.
module.exports = mongoose.model('blog', blogSchema);