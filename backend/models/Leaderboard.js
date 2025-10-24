import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true
    },
    username: { 
      type: String, 
      required: true,
      trim: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    // Daily earnings (resets at 12:00 AM IST)
    dailyEarnings: { 
      type: Number, 
      default: 0 
    },
    // Monthly earnings (resets on 1st of month at 12:00 AM IST)
    monthlyEarnings: { 
      type: Number, 
      default: 0 
    },
    // Overall earnings (never resets)
    overallEarnings: { 
      type: Number, 
      default: 0 
    },
    // Last reset timestamps
    lastDailyReset: { 
      type: Date, 
      default: Date.now 
    },
    lastMonthlyReset: { 
      type: Date, 
      default: Date.now 
    },
    // Additional metrics for leaderboard
    totalTrades: { 
      type: Number, 
      default: 0 
    },
    winRate: { 
      type: Number, 
      default: 0 
    },
    // Current portfolio value for display
    currentPortfolioValue: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient leaderboard queries
leaderboardSchema.index({ dailyEarnings: -1 });
leaderboardSchema.index({ monthlyEarnings: -1 });
leaderboardSchema.index({ overallEarnings: -1 });
leaderboardSchema.index({ user: 1 });

// Static method to get leaderboard by period
leaderboardSchema.statics.getLeaderboard = function(period = 'overall', limit = 100) {
  let sortField = 'overallEarnings';
  
  if (period === 'day') {
    sortField = 'dailyEarnings';
  } else if (period === 'month') {
    sortField = 'monthlyEarnings';
  }
  
  return this.find({})
    .sort({ [sortField]: -1, name: 1 })
    .limit(limit)
    .select('username name dailyEarnings monthlyEarnings overallEarnings totalTrades winRate currentPortfolioValue')
    .populate('user', 'name username');
};

// Static method to get user's rank
leaderboardSchema.statics.getUserRank = function(userId, period = 'overall') {
  let sortField = 'overallEarnings';
  
  if (period === 'day') {
    sortField = 'dailyEarnings';
  } else if (period === 'month') {
    sortField = 'monthlyEarnings';
  }
  
  return this.find({})
    .sort({ [sortField]: -1, name: 1 })
    .select('user')
    .then(users => {
      const userIndex = users.findIndex(u => u.user.toString() === userId.toString());
      return userIndex !== -1 ? userIndex + 1 : null;
    });
};

// Instance method to update earnings
leaderboardSchema.methods.updateEarnings = function(amount, type = 'trade') {
  this.overallEarnings += amount;
  this.dailyEarnings += amount;
  this.monthlyEarnings += amount;
  
  if (type === 'trade') {
    this.totalTrades += 1;
  }
  
  return this.save();
};

// Instance method to reset daily earnings
leaderboardSchema.methods.resetDailyEarnings = function() {
  this.dailyEarnings = 0;
  this.lastDailyReset = new Date();
  return this.save();
};

// Instance method to reset monthly earnings
leaderboardSchema.methods.resetMonthlyEarnings = function() {
  this.monthlyEarnings = 0;
  this.lastMonthlyReset = new Date();
  return this.save();
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;
