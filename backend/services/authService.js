import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthService {
  static async register(userData) {
    const { name, email, password, mobileNumber, dateOfBirth, gender } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Generate unique username
    const username = await this.generateUniqueUsername(name);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      username,
      mobileNumber,
      dateOfBirth,
      gender,
      walletBalance: 100000 // Initial wallet balance
    });

    await user.save();

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobileNumber: user.mobileNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      walletBalance: user.walletBalance,
      token
    };

    return userResponse;
  }

  static async login(email, password) {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobileNumber: user.mobileNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      walletBalance: user.walletBalance,
      token
    };

    return userResponse;
  }

  static async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobileNumber: user.mobileNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      walletBalance: user.walletBalance,
      dailyProfit: user.dailyProfit,
      totalProfit: user.totalProfit,
      oneDayReturn: user.oneDayReturn,
      monthlyReturn: user.monthlyReturn
    };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();
  }

  static async generateUniqueUsername(name) {
    const baseUsername = name.toLowerCase().replace(/\s+/g, '');
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }
}

export default AuthService;
