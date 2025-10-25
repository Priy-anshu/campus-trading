import mongoose from 'mongoose';

const dailyProfitSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true
    },
    date: { 
      type: Date, 
      required: true
    },
    profit: { 
      type: Number, 
      required: true,
      default: 0
    },
    totalValue: { 
      type: Number, 
      required: true,
      default: 0
    },
    trades: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
dailyProfitSchema.index({ date: -1 });

// Ensure one record per user per day (unique constraint)
dailyProfitSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyProfit = mongoose.model('DailyProfit', dailyProfitSchema);
export default DailyProfit;
