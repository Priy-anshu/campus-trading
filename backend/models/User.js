import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Model Schema
 * 
 * Defines the structure and validation rules for user accounts in the trading platform.
 * Includes personal information, authentication data, and trading metrics.
 * 
 * Features:
 * - User authentication with password hashing
 * - Trading balance and profit tracking
 * - Daily/monthly profit calculations
 * - Portfolio value tracking for performance metrics
 * 
 * Schema Fields:
 * - Personal Info: name, email, mobile, dateOfBirth, gender
 * - Authentication: passwordHash, username
 * - Trading: walletBalance, profit metrics
 * - Performance: daily/monthly profit tracking with reset timestamps
 */

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    username: { 
      type: String, 
      unique: true, 
      sparse: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      index: true 
    },
    
    // Authentication
    passwordHash: { 
      type: String, 
      required: true 
    },
    
    // Contact Information
    mobileNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      match: /^[6-9]\d{9}$/, // Indian mobile number format
      trim: true
    },
    dateOfBirth: { 
      type: Date, 
      required: false 
    },
    gender: { 
      type: String, 
      required: false,
      enum: ['male', 'female', 'other']
    },
    
    // Trading & Financial Data
    walletBalance: { 
      type: Number, 
      default: 100000 // Initial balance of ₹1,00,000
    },
    totalProfit: { 
      type: Number, 
      default: 0 // Total profit/loss across all time
    },
    dailyProfit: { 
      type: Number, 
      default: 0 // Today's profit/loss
    },
    monthlyProfit: { 
      type: Number, 
      default: 0 // This month's profit/loss
    },
    
    // Reset Tracking for Daily/Monthly Calculations
    lastDailyReset: { 
      type: Date, 
      default: Date.now // Last time daily profit was reset
    },
    lastMonthlyReset: { 
      type: Date, 
      default: Date.now // Last time monthly profit was reset
    },
    
    // Portfolio Value Tracking for Performance Calculations
    lastPortfolioValue: { 
      type: Number, 
      default: 100000 // Last calculated total portfolio value
    },
    yesterdayTotalEarnings: { 
      type: Number, 
      default: 100000 // Yesterday's total earnings for 1-day return calculation
    },
    lastMonthTotalEarnings: { 
      type: Number, 
      default: 100000 // Last month's total earnings for monthly return calculation
    },
    startOfMonthPortfolioValue: { 
      type: Number, 
      default: 100000 // Portfolio value at start of current month
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

/**
 * Compare provided password with stored hash
 * Uses bcrypt for secure password comparison
 * @param {string} password - Plain text password to compare
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
export default User;

