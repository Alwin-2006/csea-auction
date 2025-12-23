import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  let token;

  // Check for token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      // IMPORTANT: Make sure to add JWT_SECRET to your .env file
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (assuming the payload has the user's ID)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Authorization failed, user not found.' });
      }

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Authorization failed, token is invalid.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Authorization failed, no token provided.' });
  }
};

export default authMiddleware;
