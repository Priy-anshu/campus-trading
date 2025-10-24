import mongoose from 'mongoose';

const dailyEarningsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, index: true }, // Stores the start of the day in IST
    totalEarnings: { type: Number, default: 0 }, // Total portfolio value (wallet + holdings) at end of day
    dailyReturn: { type: Number, default: 0 }, // Difference from previous day
    monthlyReturn: { type: Number, default: 0 }, // Difference from start of month
  },
  { timestamps: true }
);

// Compound index for efficient queries
dailyEarningsSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyEarnings = mongoose.model('DailyEarnings', dailyEarningsSchema);
export default DailyEarnings;
