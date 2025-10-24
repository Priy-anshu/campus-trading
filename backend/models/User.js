import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    mobileNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      match: /^[6-9]\d{9}$/,
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
    walletBalance: { type: Number, default: 100000 },
    totalProfit: { type: Number, default: 0 },
    dailyProfit: { type: Number, default: 0 },
    monthlyProfit: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },
    lastMonthlyReset: { type: Date, default: Date.now },
    lastPortfolioValue: { type: Number, default: 100000 }, // Track last calculated portfolio value
    yesterdayTotalEarnings: { type: Number, default: 100000 }, // Track yesterday's total earnings for 1-day return calculation
    lastMonthTotalEarnings: { type: Number, default: 100000 } // Track last month's total earnings for monthly return calculation
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;

