import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobileNumber, dateOfBirth, gender } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    
    // Validate mobile number format if provided
    if (mobileNumber) {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
      }
    }
    
    // Validate gender if provided
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender selection' });
    }
    
    // Validate date of birth if provided
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18 || age > 100) {
        return res.status(400).json({ message: 'Age must be between 18 and 100 years' });
      }
    }
    
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedMobile = mobileNumber ? String(mobileNumber).trim() : undefined;
    
    // Check for existing email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered' });
    
    // Check for existing mobile if provided
    if (normalizedMobile) {
      const existingMobile = await User.findOne({ mobileNumber: normalizedMobile });
      if (existingMobile) return res.status(409).json({ message: 'Mobile number already registered' });
    }
    
    // Generate unique username
    const generateUsername = async (baseName) => {
      const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = cleanName;
      let counter = 1;
      
      while (await User.findOne({ username })) {
        username = `${cleanName}${counter}`;
        counter++;
      }
      return username;
    };

    const username = await generateUsername(name);
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Prepare user data with optional fields
    const userData = {
      name: String(name).trim(), 
      username,
      email: normalizedEmail, 
      passwordHash
    };
    
    // Add optional fields if provided
    if (normalizedMobile) userData.mobileNumber = normalizedMobile;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (gender) userData.gender = gender;
    
    const user = await User.create(userData);
    
    await Portfolio.create({ user: user._id, holdings: [] });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber || null,
        dateOfBirth: user.dateOfBirth || null,
        gender: user.gender || null
      }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Email or mobile number already registered' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: error?.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/user', authRequired, async (req, res) => {
  const user = await User.findById(req.userId).select('name username email mobileNumber dateOfBirth gender walletBalance totalProfit');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ 
    id: user._id, 
    name: user.name, 
    username: user.username,
    email: user.email, 
    mobileNumber: user.mobileNumber || null,
    dateOfBirth: user.dateOfBirth || null,
    gender: user.gender || null,
    walletBalance: user.walletBalance,
    totalProfit: user.totalProfit
  });
});

// Change password route
router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

export default router;

