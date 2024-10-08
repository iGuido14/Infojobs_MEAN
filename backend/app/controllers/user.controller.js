const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');
const argon2 = require('argon2');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authService');
const RefreshToken = require('../models/refreshToken.model');

// @desc Register a new user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { user } = req.body;

    if (!user || !user.email || !user.username || !user.password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPwd = await argon2.hash(user.password);

    const newUser = {
        username: user.username,
        password: hashedPwd,
        email: user.email,
    };

    const createdUser = await User.create(newUser);

    if (createdUser) {
        res.status(201).json({
            user: createdUser.toUserResponse()
        });
    } else {
        res.status(422).json({
            errors: { body: "Unable to register a user" }
        });
    }
});

// @desc Login user and return tokens
// @route POST /api/users/login
// @access Public
const userLogin = asyncHandler(async (req, res) => {
    const { user } = req.body;

    if (!user || !user.email || !user.password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const loginUser = await User.findOne({ email: user.email }).exec();

    if (!loginUser) return res.status(404).json({ message: "User Not Found" });

    const match = await argon2.verify(loginUser.password, user.password);
    if (!match) return res.status(401).json({ message: 'Unauthorized' });

    // Generate tokens
    const accessToken = generateAccessToken(loginUser);
    const refreshToken = await RefreshToken.findOne({ userId: loginUser._id }).exec();

    if (!refreshToken) {
        const refreshToken = generateRefreshToken(loginUser);

        await new RefreshToken({
            token: refreshToken,
            userId: loginUser._id,
            expiryDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        }).save();
    }

    res.status(200).json({
        // user: loginUser.toUserResponse(accessToken, refreshToken.token)
        user: loginUser.toUserResponse(accessToken)
        // accessToken,
        // refreshToken
    });
});

// @desc Get current user
// @route GET /api/user
// @access Private
const getCurrentUser = asyncHandler(async (req, res) => {
    const email = req.userEmail;
    const user = await User.findOne({ email }).exec();

    if (!user) {
        return res.status(404).json({ message: "User Not Found" });
    }

    console.log(user);
    const accessToken = req.newAccessToken;
    const refreshToken = await RefreshToken.findOne({ userId: user._id }).exec();

    // if(refreshToken.expiryDate )

    res.status(200).json({
        user: user.toUserResponse(accessToken, refreshToken.token)
    });
});

// @desc update currently logged-in user
// Warning: if password or email is updated, client-side must update the token
// @route PUT /api/user
// @access Private
// @return User
const updateUser = asyncHandler(async (req, res) => {
    const { user } = req.body;

    // confirm data
    if (!user) {
        return res.status(400).json({ message: "Required a User object" });
    }

    const email = req.userEmail;

    const target = await User.findOne({ email }).exec();

    if (user.email) {
        target.email = user.email;
    }
    if (user.username) {
        target.username = user.username;
    }
    if (user.password) {
        const hashedPwd = await argon2.hash(user.password);
        target.password = hashedPwd;
    }
    if (typeof user.image !== 'undefined') {
        target.image = user.image;
    }
    if (typeof user.bio !== 'undefined') {
        target.bio = user.bio;
    }
    await target.save();

    return res.status(200).json({
        user: target.toUserResponse()
    });

});

module.exports = {
    registerUser,
    getCurrentUser,
    userLogin,
    updateUser
}
