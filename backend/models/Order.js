import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    orderType: { 
      type: String, 
      enum: ['buy', 'sell'], 
      required: true 
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ['completed', 'pending', 'cancelled'], 
      default: 'completed' 
    },
    orderDate: { type: Date, default: Date.now },
    exchange: { type: String, default: 'NSE' },
    orderCategory: { 
      type: String, 
      enum: ['delivery', 'intraday', 'mtf'], 
      default: 'delivery' 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
orderSchema.index({ user: 1, orderDate: -1 });
orderSchema.index({ user: 1, symbol: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
