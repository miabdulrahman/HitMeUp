const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const { generateToken, setAuthCookies } = require("./authController");

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

/**
 * @desc    Authenticate user using Google
 * @route   POST /api/auth/google
 * @access  Public
 */

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload();

        const {
            sub: googleId,
            name,
            email,
            email_verified,
            picture
        } = payload;

        if (!email || !email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google email is not verifed",
            })
        }

        let user = await User.findOne({ googleId });

        if (!user) {
            const existingUser = await User.findOne({
                email: email.toLowerCase()
            })

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "An account exists with this email. Please log in using your existing methos before linking Google"
                })
            }

            user = await User.create({
                name: name || email.split("@")[0],
                email: email.toLowerCase(),
                googleId,
                authProvider: "google",
                avatar: picture || "",
                role: "customer"
            })

        }

        const token = generateToken(user);
        setAuthCookies(res, token);

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user: user.toSafeObject()
        })
    } catch (error) {
        console.error("google login error", error);

        return res.status(401).json({
            success: false,
            message: "Google authentication failed"
        })
    }
}

module.exports = {
    googleLogin
}