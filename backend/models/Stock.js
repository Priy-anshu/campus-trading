import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
  {
    symbol: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      uppercase: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true,
      min: 0
    },
    change: { 
      type: Number, 
      default: 0 
    },
    changePercent: { 
      type: Number, 
      default: 0 
    },
    volume: { 
      type: Number, 
      default: 0,
      min: 0
    },
    marketCap: { 
      type: Number, 
      default: 0 
    },
    lastUpdated: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
stockSchema.index({ symbol: 1, isActive: 1 });
stockSchema.index({ lastUpdated: -1 });

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
