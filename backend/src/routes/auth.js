import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// This client is for the server-side flow and requires the client secret.
// The redirect URI MUST be added to your Google Cloud Console authorized URIs.
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL || 'https://csea-auction-site.onrender.com'}/api/auth/google/callback`
);

// Route to initiate the Google OAuth redirect flow
router.get('/google', (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
    ],
    prompt: 'consent' // Force consent screen every time
  });
  res.redirect(authorizeUrl);
});

// Route to handle the callback from Google
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
        }

        // Exchange the authorization code for tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Get user profile information
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // Find or create user in the database
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                username: name,
                email,
                googleId: sub,
                profilePicture: picture,
                password: '' // No password for OAuth users
            });
            await user.save();
        }

        // Generate our own JWT to manage the session
        const userPayload = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture
        };
        const jwtToken = jwt.sign(userPayload, process.env.JWT_SECRET);
        
        // Redirect to a specific frontend route that can handle the token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);

    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
});


// Traditional signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    const userPayload = {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
    };

    // Generate JWT token
    const token = jwt.sign(userPayload, process.env.JWT_SECRET);

    res.json({
      success: true,
      user: userPayload,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Traditional login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userPayload = {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
    };

    // Generate JWT token
    const token = jwt.sign(userPayload, process.env.JWT_SECRET);

    res.json({
      success: true,
      user: userPayload,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;