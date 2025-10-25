import mongoose from 'mongoose';

/**
 * Order Model Schema
 * 
 * Represents a stock trading order (buy/sell) executed by a user.
 * Tracks all trading activity for portfolio management and order history.
 * 
 * Features:
 * - Complete order details including symbol, quantity, price
 * - Order type (buy/sell) and status tracking
 * - Order category (delivery, intraday, MTF)
 * - Exchange information and timestamps
 * - Optimized indexes for efficient queries
 * 
 * Schema Fields:
 * - user: Reference to User who placed the order
 * - symbol: Stock symbol being traded
 * - orderType: 'buy' or 'sell'
 * - quantity: Number of shares (minimum 1)
 * - price: Price per share (minimum 0)
 * - totalAmount: Total order value (quantity × price)
 * - status: Order status (completed, pending, cancelled)
 * - orderDate: When the order was placed
 * - exchange: Stock exchange (default: NSE)
 * - orderCategory: Trading category (delivery, intraday, MTF)
 */
const orderSchema = new mongoose.Schema(
  {
    // User and Stock Information
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    symbol: { 
      type: String, 
      required: true 
    },
    
    // Order Details
    orderType: { 
      type: String, 
      enum: ['buy', 'sell'], 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 // Minimum 1 share
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 // Price cannot be negative
    },
    totalAmount: { 
      type: Number, 
      required: true, 
      min: 0 // Total amount cannot be negative
    },
    
    // Order Status and Metadata
    status: { 
      type: String, 
      enum: ['completed', 'pending', 'cancelled'], 
      default: 'completed' 
    },
    orderDate: { 
      type: Date, 
      default: Date.now 
    },
    exchange: { 
      type: String, 
      default: 'NSE' // National Stock Exchange
    },
    orderCategory: { 
      type: String, 
      enum: ['delivery', 'intraday', 'mtf'], 
      default: 'delivery' 
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create indexes for efficient database queries
orderSchema.index({ user: 1, orderDate: -1 }); // User orders sorted by date (newest first)
orderSchema.index({ user: 1, symbol: 1 }); // User orders by specific stock symbol

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);
export default Order;
