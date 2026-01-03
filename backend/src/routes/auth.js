import express from 'express';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();


const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL || 'https://csea-auction-site.onrender.com'}/api/auth/google/callback`
);


const senderOAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || 'https://csea-auction-site.onrender.com'}/api/auth/google/sender-callback`
);


router.get('/google', (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
    ],
    prompt: 'consent'
  });
  res.redirect(authorizeUrl);
});

router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
        }


        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

       
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;


        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                username: name,
                email,
                googleId: sub,
                profilePicture: picture,
                password: '' 
            });
            await user.save();
        }


        const userPayload = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture
        };
        const jwtToken = jwt.sign(userPayload, process.env.JWT_SECRET);
        
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);

    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
});



router.get('/google', (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
    ],
    prompt: 'consent'
  });
  res.redirect(authorizeUrl);
});

router.get('/google/authorize-sender', (req, res) => {
    const authorizeUrl = senderOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/gmail.send',
          'openid'
      ],
      prompt: 'consent' 
    });
    res.redirect(authorizeUrl);
});


router.get('/google/sender-callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('Authorization failed: No code received.');
        }

        const { tokens } = await senderOAuth2Client.getToken(code);
        
        if (!tokens.refresh_token) {
            return res.status(500).send('No refresh token received. Ensure "offline" access is requested and user consents.');
        }


        const ticket = await senderOAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const senderEmail = payload.email;

        await SystemSettings.findOneAndUpdate(
            {},
            { 
                gmailRefreshToken: tokens.refresh_token,
                gmailSenderEmail: senderEmail 
            },
            { upsert: true, new: true, setDefaultsOnInsert: true } 
        );

        res.send('Gmail sender account authorized successfully! You can close this window.');

    } catch (error) {
        console.error('Google sender callback error:', error);
        res.status(500).send(`Authorization failed: ${error.message}`);
    }
});


router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

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


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = await User.findOne({ email });

    if (!user) {

      const username = email.split('@')[0]; 
      user = new User({
        username,
        email,
        password
      });
      await user.save();
    } else {
      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
    }

    const userPayload = {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
    };

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