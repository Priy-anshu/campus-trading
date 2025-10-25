import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true
    },
    userName: { 
      type: String, 
      required: true 
    },
    
    // Current earnings (reset daily/monthly)
    dayEarning: { 
      type: Number, 
      default: 0 
    },
    monthEarning: { 
      type: Number, 
      default: 0 
    },
    overallEarning: { 
      type: Number, 
      default: 0 
    },
    
    // Historical earnings for analytics
    lastDayEarning: { 
      type: Number, 
      default: 0 
    },
    lastMonthEarning: { 
      type: Number, 
      default: 0 
    },
    
    // Reset tracking
    lastDayReset: { 
      type: Date 
    },
    lastMonthReset: { 
      type: Date 
    },
    
    // Portfolio value tracking
    currentPortfolioValue: { 
      type: Number, 
      default: 100000 
    },
    lastPortfolioValue: { 
      type: Number, 
      default: 100000 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
leaderboardSchema.index({ dayEarning: -1 });
leaderboardSchema.index({ monthEarning: -1 });
leaderboardSchema.index({ overallEarning: -1 });

// Ensure one record per user (unique constraint)
leaderboardSchema.index({ userId: 1 }, { unique: true });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;